# Go Worker Foundation + Thumbnails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Go worker process that executes heavy file jobs from a `jobs`
table in the app's database, and move thumbnail/waveform generation onto it.

**Architecture:** The SvelteKit app decides _what_ to do and inserts a `jobs`
row whose `spec` is fully resolved (absolute paths, sizes). The Go binary
(`cmd/worker`) leases queued rows, runs the executor registered for the row's
`type`, and writes `succeeded`/`failed` + `result`/`error` back. The app awaits
a row by polling it when a caller needs the outcome (a thumbnail request). The
worker runs as a child process the app spawns (`WORKER_MODE=embedded`, the
default) or as its own container from the same image (`WORKER_MODE=external`).

**Tech Stack:** Go 1.26 (`database/sql`, `modernc.org/sqlite` — pure Go, no cgo
— and `github.com/jackc/pgx/v5/stdlib`), ffmpeg + pdftoppm (already in the
image), Bun/TypeScript + Drizzle on the app side.

**Spec:** this document — decisions taken with the user on 2026-09-19:
thumbnails & peaks, library scan, zip archives, transfers & trash all move to
the worker; transport is a DB job table; the worker runs in the same container
by default **and** can run as a separate container. This plan covers the
foundation and thumbnails only. Scan, zips and transfer/trash each get their own
follow-up plan built on the `jobs` table and `awaitJob` from here.

## Global Constraints

- **Never commit.** The user commits, branches and pushes themselves. Where a
  task ends, leave the work uncommitted and report it.
- Both dialects, always: every schema change goes in `schema.pg.ts`,
  `schema.sqlite.ts` **and** the `schema.ts` shim, then `bun run db:generate`.
- `jobs` timestamps are **epoch milliseconds in a `bigint`/`integer`** on both
  dialects, so Go writes one representation. (Every other table keeps its
  existing types.)
- SQL in Go uses `$1`-style placeholders only — SQLite accepts `$NNN`, so one
  query string serves both drivers.
- Go binary is built with `CGO_ENABLED=0`, installed at
  `/usr/local/bin/penombre-worker`.
- Thumbnail cache filenames are unchanged:
  `<root>/.thumbnails/<key with "/"→"_">_<size>.webp` and `..._peaks.json`.
  Peaks JSON stays a bare array of ≤400 numbers in `0..1`, 3 decimals.
- App code: no `console.*` (use `Logger`), await every promise, imports use
  `#lib/...js`. Comments only when they record something the code cannot say.
- Every new env var: `config.defaults.ts`, `docs/env.md`, the guide
  (`docs/worker.md`), `bun run gen:env`. `bun run lint:md` must pass.
- GitHub Actions: `actions/setup-go@v7` (verified latest major tag).

## File Structure

```text
go.mod / go.sum                         # module github.com/orochibraru/penombre
cmd/worker/main.go                      # flags, signals, wiring
internal/jobs/job.go                    # Job, Executor
internal/jobs/thumbnail/thumbnail.go    # image/video/pdf/audio executor
internal/jobs/thumbnail/peaks.go        # BucketPeaks (port of the TS one)
internal/jobs/thumbnail/*_test.go
internal/worker/config.go               # env → Config
internal/worker/store.go                # dialect-aware lease/complete/prune SQL
internal/worker/worker.go               # claim loop, heartbeats, shutdown
internal/worker/registry.go             # type → Executor
internal/worker/*_test.go               # against a temp SQLite file
src/lib/server/db/schema.{pg,sqlite}.ts # + jobs table
src/lib/server/db/schema.ts             # + jobs shim export
src/lib/server/db/index.ts              # SQLite WAL + busy_timeout
src/lib/server/services/jobs.ts         # enqueueJob / awaitJob
src/lib/server/services/worker-process.ts # embedded spawn + restart
src/lib/server/services/storage/thumbnails.ts # enqueue instead of render
Dockerfile                              # go-builder stage
docs/worker.md, docs/env.md, docs/config.json, docs/deployment.md
.pre-commit-config.yaml, package.json, .github/workflows/code_quality.yaml
CLAUDE.md
```

---

### Task 1: SQLite that two processes can share

Two processes writing one SQLite file in rollback-journal mode with no busy
timeout fail with `SQLITE_BUSY` immediately. WAL lets readers run beside the
writer; `busy_timeout` makes a writer wait for the lock instead of failing.

**Files:**

- Modify: `src/lib/server/db/index.ts` (`createSqliteClient`, ~l.40-50)

**Interfaces:**

- Produces: SQLite database file in WAL mode (persistent per file), and the
  app's connection waits up to 5s for a lock.

- [ ] **Step 1: Change the pragmas**

```ts
const client = new SqliteConnection(path, { create: true });
// Off by default in SQLite — required for the schema's cascade-delete FKs.
client.exec("PRAGMA foreign_keys = ON;");
// The Go worker writes the same file.
client.exec("PRAGMA journal_mode = WAL;");
client.exec("PRAGMA busy_timeout = 5000;");
return client;
```

- [ ] **Step 2: Verify**

Run: `bun run dev`, load the app, then
`sqlite3 data/db/penombre.sqlite 'PRAGMA journal_mode;'` Expected: `wal`. Run:
`bun test` Expected: PASS (db is mocked; nothing else changes).

- [ ] **Step 3: Stop — leave uncommitted, report.**

---

### Task 2: The `jobs` table

**Files:**

- Modify: `src/lib/server/db/schema.pg.ts` (append)
- Modify: `src/lib/server/db/schema.sqlite.ts` (append)
- Modify: `src/lib/server/db/schema.ts` (add shim export + types)
- Create: `drizzle/pg/00NN_*.sql`, `drizzle/sqlite/00NN_*.sql` (generated)

**Interfaces:**

- Produces: `jobs` table, columns (snake_case in SQL): `id text pk`,
  `type text`, `status text` (`queued` | `running` | `succeeded` | `failed`),
  `spec text` (JSON), `result text?` (JSON), `error text?`, `dedupe_key text?`,
  `priority integer = 0`, `attempts integer = 0`, `worker_id text?`,
  `heartbeat_at bigint?`, `created_at bigint`, `started_at bigint?`,
  `finished_at bigint?` — all times epoch ms. Indexes:
  `jobs_claim_idx (status, priority, created_at)`,
  `jobs_dedupe_idx (dedupe_key)`.
- Produces (TS): `jobs` from `#lib/server/db/schema.js`, `type Job`,
  `type NewJob`.

- [ ] **Step 1: pg table** — append to `schema.pg.ts` (reuse its existing
      `pgTable`, `text`, `integer`, `bigint`, `index` imports; add any that are
      missing):

```ts
export const jobs = pgTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    status: text("status").default("queued").notNull(),
    spec: text("spec").notNull(),
    result: text("result"),
    error: text("error"),
    dedupeKey: text("dedupe_key"),
    priority: integer("priority").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    workerId: text("worker_id"),
    heartbeatAt: bigint("heartbeat_at", { mode: "number" }),
    createdAt: bigint("created_at", { mode: "number" })
      .$defaultFn(() => Date.now())
      .notNull(),
    startedAt: bigint("started_at", { mode: "number" }),
    finishedAt: bigint("finished_at", { mode: "number" }),
  },
  (table) => [
    index("jobs_claim_idx").on(table.status, table.priority, table.createdAt),
    index("jobs_dedupe_idx").on(table.dedupeKey),
  ],
);
```

- [ ] **Step 2: sqlite table** — append to `schema.sqlite.ts`:

```ts
export const jobs = sqliteTable(
  "jobs",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    status: text("status").default("queued").notNull(),
    spec: text("spec").notNull(),
    result: text("result"),
    error: text("error"),
    dedupeKey: text("dedupe_key"),
    priority: integer("priority").default(0).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    workerId: text("worker_id"),
    heartbeatAt: integer("heartbeat_at", { mode: "number" }),
    createdAt: integer("created_at", { mode: "number" })
      .$defaultFn(() => Date.now())
      .notNull(),
    startedAt: integer("started_at", { mode: "number" }),
    finishedAt: integer("finished_at", { mode: "number" }),
  },
  (table) => [
    index("jobs_claim_idx").on(table.status, table.priority, table.createdAt),
    index("jobs_dedupe_idx").on(table.dedupeKey),
  ],
);
```

- [ ] **Step 3: shim** — in `schema.ts`, beside the other tables:

```ts
export const jobs = (sqliteActive ? sqlite.jobs : pg.jobs) as typeof pg.jobs;
export type Job = typeof pg.jobs.$inferSelect;
export type NewJob = typeof pg.jobs.$inferInsert;
```

- [ ] **Step 4: Generate migrations**

Run: `bun run db:generate` Expected: one new `.sql` in `drizzle/pg/` and one in
`drizzle/sqlite/`, each a `CREATE TABLE "jobs"` / `` `jobs` `` plus the two
indexes. Read both files; nothing else may appear in them.

- [ ] **Step 5: Verify**

Run: `rm -rf data/db && bun run dev`, load the app. Run:
`sqlite3 data/db/penombre.sqlite '.schema jobs'` Expected: the table and both
indexes. Run: `bun run check` Expected: PASS.

- [ ] **Step 6: Stop — leave uncommitted, report.**

---

### Task 3: App-side job client (`enqueueJob` / `awaitJob`)

**Files:**

- Create: `src/lib/server/services/jobs.ts`
- Test: `src/lib/server/services/jobs.test.ts`

**Interfaces:**

- Consumes: `jobs`, `Job` from Task 2; `db`, `Database` from
  `#lib/server/db/index.js`.
- Produces:
  - `type JobStatus = "queued" | "running" | "succeeded" | "failed"`
  - `enqueueJob(input: { type: string; spec: unknown; dedupeKey?: string; priority?: number }, database?: Database): Promise<string>`
    — returns the job id; if a `queued`/`running` row with the same `dedupeKey`
    exists, returns its id instead of inserting.
  - `awaitJob(id: string, options?: { timeoutMs?: number; intervalMs?: number; database?: Database }): Promise<Job | undefined>`
    — polls until `succeeded`/`failed`, returns the row; `undefined` on timeout.
    Defaults: `timeoutMs` 30_000, `intervalMs` 100.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test } from "bun:test";
import type { Job } from "#lib/server/db/schema.js";
import { awaitJob, enqueueJob } from "./jobs";

function fakeDb(rows: Partial<Job>[] = []) {
  const inserted: unknown[] = [];
  const chain = (result: unknown) => {
    const c: Record<string, unknown> = {};
    for (const k of ["from", "where", "limit", "orderBy"]) {
      c[k] = () => c;
    }
    c.then = (resolve: (v: unknown) => void) => resolve(result);
    return c;
  };
  let reads = 0;
  return {
    inserted,
    db: {
      select: () =>
        chain(rows.length ? [rows[Math.min(reads++, rows.length - 1)]] : []),
      insert: () => ({
        values: (v: unknown) => {
          inserted.push(v);
          return Promise.resolve();
        },
      }),
    } as never,
  };
}

describe("enqueueJob", () => {
  test("inserts a queued row with a JSON spec", async () => {
    const { db, inserted } = fakeDb();
    const id = await enqueueJob({ type: "thumbnail", spec: { a: 1 } }, db);
    expect(inserted).toHaveLength(1);
    expect(inserted[0]).toMatchObject({
      id,
      type: "thumbnail",
      spec: '{"a":1}',
    });
  });

  test("reuses a pending job with the same dedupe key", async () => {
    const { db, inserted } = fakeDb([{ id: "existing", status: "queued" }]);
    const id = await enqueueJob(
      { type: "thumbnail", spec: {}, dedupeKey: "k" },
      db,
    );
    expect(id).toBe("existing");
    expect(inserted).toHaveLength(0);
  });
});

describe("awaitJob", () => {
  test("returns the row once it finishes", async () => {
    const { db } = fakeDb([
      { id: "j", status: "running" },
      { id: "j", status: "succeeded", result: "{}" },
    ]);
    const job = await awaitJob("j", { database: db, intervalMs: 1 });
    expect(job?.status).toBe("succeeded");
  });

  test("gives up after the timeout", async () => {
    const { db } = fakeDb([{ id: "j", status: "running" }]);
    const job = await awaitJob("j", {
      database: db,
      intervalMs: 1,
      timeoutMs: 10,
    });
    expect(job).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `bun test src/lib/server/services/jobs.test.ts` Expected: FAIL, cannot
resolve `./jobs`.

- [ ] **Step 3: Implement**

```ts
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { type Database, db } from "#lib/server/db/index.js";
import { type Job, jobs } from "#lib/server/db/schema.js";

export type JobStatus = "queued" | "running" | "succeeded" | "failed";

const PENDING: JobStatus[] = ["queued", "running"];

export async function enqueueJob(
  input: { type: string; spec: unknown; dedupeKey?: string; priority?: number },
  database: Database = db,
): Promise<string> {
  if (input.dedupeKey) {
    const [pending] = await database
      .select({ id: jobs.id })
      .from(jobs)
      .where(
        and(eq(jobs.dedupeKey, input.dedupeKey), inArray(jobs.status, PENDING)),
      )
      .limit(1);
    if (pending) {
      return pending.id;
    }
  }
  const id = randomUUID();
  await database.insert(jobs).values({
    id,
    type: input.type,
    spec: JSON.stringify(input.spec),
    dedupeKey: input.dedupeKey,
    priority: input.priority ?? 0,
  });
  return id;
}

export async function awaitJob(
  id: string,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    database?: Database;
  } = {},
): Promise<Job | undefined> {
  const { timeoutMs = 30_000, intervalMs = 100, database = db } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const [row] = await database
      .select()
      .from(jobs)
      .where(eq(jobs.id, id))
      .limit(1);
    if (!row) {
      return undefined;
    }
    if (row.status === "succeeded" || row.status === "failed") {
      return row;
    }
    await Bun.sleep(intervalMs);
  }
  return undefined;
}
```

Adjust the fake in the test if Drizzle's chain order differs (the fake answers
any `from/where/limit/orderBy` order), but keep the four assertions.

- [ ] **Step 4: Run to verify it passes**

Run: `bun test src/lib/server/services/jobs.test.ts` Expected: 4 pass (×3
reruns, per `bunfig.toml`). Run: `bun run lint:ts` Expected: PASS.

- [ ] **Step 5: Stop — leave uncommitted, report.**

---

### Task 4: Go module + worker core (config, store, loop)

**Files:**

- Create: `go.mod`, `go.sum`
- Create: `internal/jobs/job.go`
- Create: `internal/worker/config.go`, `store.go`, `worker.go`, `registry.go`
- Create: `cmd/worker/main.go`
- Test: `internal/worker/config_test.go`, `internal/worker/store_test.go`,
  `internal/worker/worker_test.go`

**Interfaces:**

- Consumes: the `jobs` table from Task 2 (created by the app's migrations — the
  worker never migrates).
- Produces (Go):
  - `jobs.Job{ID, Type string; Attempts int; Spec json.RawMessage}`,
    `(Job) DecodeSpec(v any) error`,
    `type jobs.Executor func(ctx context.Context, job jobs.Job) (any, error)`
  - `worker.Config{DatabaseURL string; Concurrency int; ID string; PollInterval, LeaseTimeout time.Duration}`,
    `worker.LoadConfig(getenv func(string) string) (Config, error)`
  - `worker.Open(url string) (*Store, error)`, `(*Store) Ready(ctx) error`,
    `Claim(ctx, workerID string, now time.Time, leaseTimeout time.Duration) (*jobs.Job, error)`,
    `Heartbeat(ctx, id, workerID string, now time.Time) (bool, error)`,
    `Complete(ctx, id, workerID string, result any, execErr error, now time.Time) error`,
    `Release(ctx, id, workerID string) error`,
    `Prune(ctx, now time.Time, leaseTimeout time.Duration) error`, `Close()`
  - `worker.Registry map[string]jobs.Executor`,
    `worker.Run(ctx context.Context, cfg Config, store *Store, registry Registry, log *slog.Logger) error`
- Binary: `penombre-worker [--version] [--help]`; env `DATABASE_URL` (required),
  `WORKER_CONCURRENCY` (4), `WORKER_ID` (hostname-pid).

- [ ] **Step 1: Init the module**

```bash
go mod init github.com/orochibraru/penombre
go mod edit -go=1.26
go get modernc.org/sqlite@latest github.com/jackc/pgx/v5@latest
```

- [ ] **Step 2: `internal/jobs/job.go`**

```go
// Package jobs holds what an executor receives. It lives apart from
// internal/worker because the registry imports every executor package.
package jobs

import (
 "context"
 "encoding/json"
)

type Job struct {
 ID       string
 Type     string
 Attempts int
 Spec     json.RawMessage
}

func (j Job) DecodeSpec(v any) error { return json.Unmarshal(j.Spec, v) }

type Executor func(ctx context.Context, job Job) (any, error)
```

- [ ] **Step 3: Failing config test** — `internal/worker/config_test.go`

```go
package worker

import "testing"

func env(m map[string]string) func(string) string {
 return func(k string) string { return m[k] }
}

func TestLoadConfigRequiresDatabaseURL(t *testing.T) {
 if _, err := LoadConfig(env(nil)); err == nil {
  t.Fatal("expected an error without DATABASE_URL")
 }
}

func TestLoadConfigDefaults(t *testing.T) {
 cfg, err := LoadConfig(env(map[string]string{"DATABASE_URL": "file:x.db"}))
 if err != nil {
  t.Fatal(err)
 }
 if cfg.Concurrency != 4 || cfg.ID == "" {
  t.Fatalf("unexpected defaults: %+v", cfg)
 }
}

func TestLoadConfigRejectsBadConcurrency(t *testing.T) {
 _, err := LoadConfig(env(map[string]string{"DATABASE_URL": "file:x.db", "WORKER_CONCURRENCY": "0"}))
 if err == nil {
  t.Fatal("expected an error for WORKER_CONCURRENCY=0")
 }
}
```

Run: `go test ./internal/worker/` Expected: FAIL, `LoadConfig` undefined.

- [ ] **Step 4: `internal/worker/config.go`**

```go
package worker

import (
 "errors"
 "fmt"
 "os"
 "strconv"
 "strings"
 "time"
)

type Config struct {
 DatabaseURL  string
 Concurrency  int
 ID           string
 PollInterval time.Duration
 LeaseTimeout time.Duration
}

func LoadConfig(getenv func(string) string) (Config, error) {
 cfg := Config{
  DatabaseURL:  strings.TrimSpace(getenv("DATABASE_URL")),
  Concurrency:  4,
  ID:           getenv("WORKER_ID"),
  PollInterval: 200 * time.Millisecond,
  LeaseTimeout: 60 * time.Second,
 }
 if cfg.DatabaseURL == "" {
  return cfg, errors.New("DATABASE_URL is required")
 }
 if raw := getenv("WORKER_CONCURRENCY"); raw != "" {
  n, err := strconv.Atoi(raw)
  if err != nil || n < 1 {
   return cfg, fmt.Errorf("WORKER_CONCURRENCY must be a positive integer, got %q", raw)
  }
  cfg.Concurrency = n
 }
 if cfg.ID == "" {
  host, _ := os.Hostname()
  cfg.ID = fmt.Sprintf("%s-%d", host, os.Getpid())
 }
 return cfg, nil
}
```

Run: `go test ./internal/worker/` Expected: PASS.

- [ ] **Step 5: Failing store test** — `internal/worker/store_test.go`. It
      creates the table itself with the same DDL the SQLite migration has (copy
      the `CREATE TABLE` from the Task 2 SQLite migration verbatim into
      `testSchema`).

```go
package worker

import (
 "context"
 "errors"
 "path/filepath"
 "testing"
 "time"
)

const testSchema = "" // paste the generated drizzle/sqlite jobs migration here

func openTestStore(t *testing.T) *Store {
 t.Helper()
 s, err := Open("file:" + filepath.Join(t.TempDir(), "t.sqlite"))
 if err != nil {
  t.Fatal(err)
 }
 t.Cleanup(s.Close)
 if _, err := s.db.Exec(testSchema); err != nil {
  t.Fatal(err)
 }
 return s
}

func insert(t *testing.T, s *Store, id string, priority int, created int64) {
 t.Helper()
 _, err := s.db.Exec(`insert into jobs (id, type, spec, priority, created_at) values ($1, 'thumbnail', '{}', $2, $3)`, id, priority, created)
 if err != nil {
  t.Fatal(err)
 }
}

func status(t *testing.T, s *Store, id string) string {
 t.Helper()
 var st string
 if err := s.db.QueryRow(`select status from jobs where id = $1`, id).Scan(&st); err != nil {
  t.Fatal(err)
 }
 return st
}

func TestClaimOrdersByPriorityThenAge(t *testing.T) {
 s := openTestStore(t)
 ctx := context.Background()
 now := time.UnixMilli(10_000)
 insert(t, s, "old", 0, 1)
 insert(t, s, "urgent", 5, 2)

 job, err := s.Claim(ctx, "w1", now, time.Minute)
 if err != nil || job == nil || job.ID != "urgent" {
  t.Fatalf("got %+v, %v", job, err)
 }
 if job.Attempts != 1 || status(t, s, "urgent") != "running" {
  t.Fatal("claim must mark running and count the attempt")
 }
 job, _ = s.Claim(ctx, "w1", now, time.Minute)
 if job == nil || job.ID != "old" {
  t.Fatalf("second claim: %+v", job)
 }
 if job, _ = s.Claim(ctx, "w1", now, time.Minute); job != nil {
  t.Fatalf("queue should be empty, got %+v", job)
 }
}

func TestStaleLeaseIsReclaimed(t *testing.T) {
 s := openTestStore(t)
 ctx := context.Background()
 insert(t, s, "j", 0, 1)
 if _, err := s.Claim(ctx, "dead", time.UnixMilli(1_000), time.Minute); err != nil {
  t.Fatal(err)
 }
 job, _ := s.Claim(ctx, "w2", time.UnixMilli(1_000+59_000), time.Minute)
 if job != nil {
  t.Fatal("a live lease must not be stolen")
 }
 job, _ = s.Claim(ctx, "w2", time.UnixMilli(1_000+61_000), time.Minute)
 if job == nil || job.Attempts != 2 {
  t.Fatalf("stale lease should be reclaimed: %+v", job)
 }
}

func TestHeartbeatFailsForAnotherWorker(t *testing.T) {
 s := openTestStore(t)
 ctx := context.Background()
 insert(t, s, "j", 0, 1)
 _, _ = s.Claim(ctx, "w1", time.UnixMilli(1), time.Minute)
 ok, err := s.Heartbeat(ctx, "j", "w2", time.UnixMilli(2))
 if err != nil || ok {
  t.Fatalf("heartbeat by a non-owner must report false, got %v %v", ok, err)
 }
 ok, _ = s.Heartbeat(ctx, "j", "w1", time.UnixMilli(2))
 if !ok {
  t.Fatal("owner heartbeat must succeed")
 }
}

func TestCompleteRecordsOutcome(t *testing.T) {
 s := openTestStore(t)
 ctx := context.Background()
 insert(t, s, "ok", 0, 1)
 insert(t, s, "ko", 0, 2)
 _, _ = s.Claim(ctx, "w", time.UnixMilli(3), time.Minute)
 _, _ = s.Claim(ctx, "w", time.UnixMilli(3), time.Minute)
 if err := s.Complete(ctx, "ok", "w", map[string]string{"output": "x"}, nil, time.UnixMilli(4)); err != nil {
  t.Fatal(err)
 }
 if err := s.Complete(ctx, "ko", "w", nil, errors.New("boom"), time.UnixMilli(4)); err != nil {
  t.Fatal(err)
 }
 var result, msg string
 _ = s.db.QueryRow(`select result from jobs where id = 'ok'`).Scan(&result)
 _ = s.db.QueryRow(`select error from jobs where id = 'ko'`).Scan(&msg)
 if status(t, s, "ok") != "succeeded" || result != `{"output":"x"}` {
  t.Fatalf("ok: %s %s", status(t, s, "ok"), result)
 }
 if status(t, s, "ko") != "failed" || msg != "boom" {
  t.Fatalf("ko: %s %s", status(t, s, "ko"), msg)
 }
}

func TestPrune(t *testing.T) {
 s := openTestStore(t)
 ctx := context.Background()
 day := int64(24 * time.Hour / time.Millisecond)
 now := time.UnixMilli(30 * day)
 _, _ = s.db.Exec(`insert into jobs (id, type, spec, status, created_at, finished_at) values
  ('done-old', 't', '{}', 'succeeded', 0, $1),
  ('done-new', 't', '{}', 'succeeded', 0, $2),
  ('fail-old', 't', '{}', 'failed', 0, $3)`,
  now.UnixMilli()-2*int64(time.Hour/time.Millisecond), now.UnixMilli()-1000, now.UnixMilli()-8*day)
 _, _ = s.db.Exec(`insert into jobs (id, type, spec, status, attempts, heartbeat_at, created_at) values
  ('stuck', 't', '{}', 'running', 3, 0, 0)`)
 if err := s.Prune(ctx, now, time.Minute); err != nil {
  t.Fatal(err)
 }
 var n int
 _ = s.db.QueryRow(`select count(*) from jobs where id in ('done-old', 'fail-old')`).Scan(&n)
 if n != 0 {
  t.Fatal("old finished rows must be deleted")
 }
 if status(t, s, "done-new") != "succeeded" || status(t, s, "stuck") != "failed" {
  t.Fatal("recent rows kept; an abandoned job out of attempts is failed")
 }
}
```

Run: `go test ./internal/worker/` Expected: FAIL, `Open` undefined.

- [ ] **Step 6: `internal/worker/store.go`**

```go
package worker

import (
 "context"
 "database/sql"
 "encoding/json"
 "fmt"
 "regexp"
 "strings"
 "time"

 _ "github.com/jackc/pgx/v5/stdlib"
 _ "modernc.org/sqlite"

 "github.com/orochibraru/penombre/internal/jobs"
)

// MaxAttempts bounds re-leasing a job whose worker died mid-run.
const MaxAttempts = 3

var postgresURL = regexp.MustCompile(`(?i)^postgres(ql)?:`)

type Store struct {
 db       *sql.DB
 postgres bool
}

// Open mirrors src/lib/server/db/dialect.ts: anything that is not a Postgres
// URL is a SQLite file.
func Open(url string) (*Store, error) {
 if postgresURL.MatchString(url) {
  db, err := sql.Open("pgx", url)
  if err != nil {
   return nil, err
  }
  return &Store{db: db, postgres: true}, nil
 }
 path := strings.TrimPrefix(strings.TrimPrefix(url, "file:"), "sqlite:")
 path = strings.TrimPrefix(path, "//")
 dsn := "file:" + path + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
 db, err := sql.Open("sqlite", dsn)
 if err != nil {
  return nil, err
 }
 return &Store{db: db}, nil
}

func (s *Store) Close() { _ = s.db.Close() }

// Ready succeeds once the app's migrations have created the table.
func (s *Store) Ready(ctx context.Context) error {
 _, err := s.db.ExecContext(ctx, `select 1 from jobs limit 1`)
 return err
}

func (s *Store) Claim(ctx context.Context, workerID string, now time.Time, leaseTimeout time.Duration) (*jobs.Job, error) {
 lock := ""
 if s.postgres {
  lock = " for update skip locked"
 }
 query := fmt.Sprintf(`update jobs
  set status = 'running', worker_id = $1, heartbeat_at = $2, started_at = $2, attempts = attempts + 1
  where id = (
   select id from jobs
   where status = 'queued'
    or (status = 'running' and heartbeat_at < $3 and attempts < %d)
   order by priority desc, created_at
   limit 1%s
  )
  returning id, type, spec, attempts`, MaxAttempts, lock)
 var job jobs.Job
 var spec string
 err := s.db.QueryRowContext(ctx, query, workerID, now.UnixMilli(), now.Add(-leaseTimeout).UnixMilli()).
  Scan(&job.ID, &job.Type, &spec, &job.Attempts)
 if err == sql.ErrNoRows {
  return nil, nil
 }
 if err != nil {
  return nil, err
 }
 job.Spec = json.RawMessage(spec)
 return &job, nil
}

func (s *Store) Heartbeat(ctx context.Context, id, workerID string, now time.Time) (bool, error) {
 res, err := s.db.ExecContext(ctx,
  `update jobs set heartbeat_at = $1 where id = $2 and worker_id = $3 and status = 'running'`,
  now.UnixMilli(), id, workerID)
 if err != nil {
  return false, err
 }
 n, err := res.RowsAffected()
 return n == 1, err
}

func (s *Store) Complete(ctx context.Context, id, workerID string, result any, execErr error, now time.Time) error {
 status, resultJSON, message := "succeeded", sql.NullString{}, sql.NullString{}
 if execErr != nil {
  status, message = "failed", sql.NullString{String: execErr.Error(), Valid: true}
 } else if result != nil {
  b, err := json.Marshal(result)
  if err != nil {
   return err
  }
  resultJSON = sql.NullString{String: string(b), Valid: true}
 }
 _, err := s.db.ExecContext(ctx,
  `update jobs set status = $1, result = $2, error = $3, finished_at = $4, worker_id = null
  where id = $5 and worker_id = $6`,
  status, resultJSON, message, now.UnixMilli(), id, workerID)
 return err
}

// Release hands an interrupted job back to the queue on shutdown.
func (s *Store) Release(ctx context.Context, id, workerID string) error {
 _, err := s.db.ExecContext(ctx,
  `update jobs set status = 'queued', worker_id = null, heartbeat_at = null
  where id = $1 and worker_id = $2 and status = 'running'`, id, workerID)
 return err
}

func (s *Store) Prune(ctx context.Context, now time.Time, leaseTimeout time.Duration) error {
 ms := now.UnixMilli()
 if _, err := s.db.ExecContext(ctx,
  `update jobs set status = 'failed', error = 'worker lost the job too many times', finished_at = $1, worker_id = null
  where status = 'running' and heartbeat_at < $2 and attempts >= $3`,
  ms, now.Add(-leaseTimeout).UnixMilli(), MaxAttempts); err != nil {
  return err
 }
 _, err := s.db.ExecContext(ctx,
  `delete from jobs where (status = 'succeeded' and finished_at < $1) or (status = 'failed' and finished_at < $2)`,
  now.Add(-time.Hour).UnixMilli(), now.Add(-7*24*time.Hour).UnixMilli())
 return err
}
```

Run: `go test ./internal/worker/` Expected: PASS.

- [ ] **Step 7: Failing loop test** — `internal/worker/worker_test.go`

```go
package worker

import (
 "context"
 "errors"
 "io"
 "log/slog"
 "testing"
 "time"

 "github.com/orochibraru/penombre/internal/jobs"
)

func TestRunExecutesAndRecords(t *testing.T) {
 s := openTestStore(t)
 insert(t, s, "a", 0, 1)
 insert(t, s, "b", 0, 2)
 _, _ = s.db.Exec(`update jobs set type = 'nope' where id = 'b'`)

 ctx, cancel := context.WithCancel(context.Background())
 registry := Registry{"thumbnail": func(context.Context, jobs.Job) (any, error) {
  return map[string]int{"n": 1}, nil
 }}
 cfg := Config{ID: "w", Concurrency: 2, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute}
 done := make(chan error)
 go func() { done <- Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil))) }()

 deadline := time.Now().Add(2 * time.Second)
 for time.Now().Before(deadline) && (status(t, s, "a") != "succeeded" || status(t, s, "b") != "failed") {
  time.Sleep(10 * time.Millisecond)
 }
 cancel()
 if err := <-done; err != nil && !errors.Is(err, context.Canceled) {
  t.Fatal(err)
 }
 if status(t, s, "a") != "succeeded" || status(t, s, "b") != "failed" {
  t.Fatalf("a=%s b=%s", status(t, s, "a"), status(t, s, "b"))
 }
}

func TestShutdownReleasesInFlightJobs(t *testing.T) {
 s := openTestStore(t)
 insert(t, s, "slow", 0, 1)
 started := make(chan struct{})
 registry := Registry{"thumbnail": func(ctx context.Context, _ jobs.Job) (any, error) {
  close(started)
  <-ctx.Done()
  return nil, ctx.Err()
 }}
 ctx, cancel := context.WithCancel(context.Background())
 cfg := Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute}
 done := make(chan error)
 go func() {
  done <- runWithGrace(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil)), 10*time.Millisecond)
 }()
 <-started
 cancel()
 <-done
 if got := status(t, s, "slow"); got != "queued" {
  t.Fatalf("an interrupted job must go back to the queue, got %s", got)
 }
}
```

Run: `go test ./internal/worker/` Expected: FAIL, `Run` undefined.

- [ ] **Step 8: `internal/worker/registry.go` + `worker.go`**

```go
package worker

import "github.com/orochibraru/penombre/internal/jobs"

// Registry maps a job type to its executor. Wired in cmd/worker.
type Registry map[string]jobs.Executor
```

```go
package worker

import (
 "context"
 "errors"
 "fmt"
 "log/slog"
 "sync"
 "time"

 "github.com/orochibraru/penombre/internal/jobs"
)

const (
 heartbeatEvery = 10 * time.Second
 pruneEvery     = time.Minute
 shutdownGrace  = 60 * time.Second
)

var errLostLease = errors.New("lease lost")

func Run(ctx context.Context, cfg Config, store *Store, registry Registry, log *slog.Logger) error {
 return runWithGrace(ctx, cfg, store, registry, log, shutdownGrace)
}

func runWithGrace(ctx context.Context, cfg Config, store *Store, registry Registry, log *slog.Logger, grace time.Duration) error {
 // Executions outlive ctx by up to `grace`, then are cancelled.
 execCtx, cancelExec := context.WithCancel(context.WithoutCancel(ctx))
 defer cancelExec()

 slots := make(chan struct{}, cfg.Concurrency)
 var wg sync.WaitGroup
 lastPrune := time.Time{}
 ticker := time.NewTicker(cfg.PollInterval)
 defer ticker.Stop()

 for {
  if time.Since(lastPrune) > pruneEvery {
   if err := store.Prune(ctx, time.Now(), cfg.LeaseTimeout); err != nil && ctx.Err() == nil {
    log.Warn("prune failed", "err", err)
   }
   lastPrune = time.Now()
  }
  claimed := false
  select {
  case slots <- struct{}{}:
   job, err := store.Claim(ctx, cfg.ID, time.Now(), cfg.LeaseTimeout)
   if err != nil || job == nil {
    <-slots
    if err != nil && ctx.Err() == nil {
     log.Warn("claim failed", "err", err)
    }
    break
   }
   claimed = true
   wg.Add(1)
   go func() {
    defer wg.Done()
    defer func() { <-slots }()
    execute(execCtx, ctx, cfg, store, registry, log, *job)
   }()
  default:
  }
  if claimed {
   continue
  }
  select {
  case <-ctx.Done():
   waited := make(chan struct{})
   go func() { wg.Wait(); close(waited) }()
   select {
   case <-waited:
   case <-time.After(grace):
    cancelExec()
    <-waited
   }
   return ctx.Err()
  case <-ticker.C:
  }
 }
}

func execute(execCtx, runCtx context.Context, cfg Config, store *Store, registry Registry, log *slog.Logger, job jobs.Job) {
 ctx, cancel := context.WithCancelCause(execCtx)
 defer cancel(nil)
 go heartbeat(ctx, cancel, store, cfg.ID, job.ID, log)

 started := time.Now()
 var result any
 var err error
 if run, ok := registry[job.Type]; ok {
  result, err = run(ctx, job)
 } else {
  err = fmt.Errorf("unknown job type %q", job.Type)
 }

 // Detached from ctx: the outcome must be written even when shutting down.
 bg := context.WithoutCancel(ctx)
 switch {
 case errors.Is(context.Cause(ctx), errLostLease):
  log.Warn("job dropped: lease lost", "id", job.ID)
 case runCtx.Err() != nil && ctx.Err() != nil:
  if rerr := store.Release(bg, job.ID, cfg.ID); rerr != nil {
   log.Error("release failed", "id", job.ID, "err", rerr)
  }
 default:
  if cerr := store.Complete(bg, job.ID, cfg.ID, result, err, time.Now()); cerr != nil {
   log.Error("complete failed", "id", job.ID, "err", cerr)
  }
  log.Debug("job done", "id", job.ID, "type", job.Type, "ms", time.Since(started).Milliseconds(), "err", err)
 }
}

func heartbeat(ctx context.Context, cancel context.CancelCauseFunc, store *Store, workerID, jobID string, log *slog.Logger) {
 t := time.NewTicker(heartbeatEvery)
 defer t.Stop()
 for {
  select {
  case <-ctx.Done():
   return
  case <-t.C:
   ok, err := store.Heartbeat(ctx, jobID, workerID, time.Now())
   if err != nil {
    log.Warn("heartbeat failed", "id", jobID, "err", err)
    continue
   }
   if !ok {
    cancel(errLostLease)
    return
   }
  }
 }
}
```

Run: `go test -race ./internal/worker/` Expected: PASS.

- [ ] **Step 9: `cmd/worker/main.go`** (registry is empty until Task 5)

```go
package main

import (
 "context"
 "flag"
 "fmt"
 "log/slog"
 "os"
 "os/signal"
 "syscall"
 "time"

 "github.com/orochibraru/penombre/internal/worker"
)

var version = "dev"

func main() {
 showVersion := flag.Bool("version", false, "print the version and exit")
 flag.Parse()
 if *showVersion {
  fmt.Println(version)
  return
 }

 log := slog.New(slog.NewTextHandler(os.Stderr, nil))
 cfg, err := worker.LoadConfig(os.Getenv)
 if err != nil {
  log.Error("config", "err", err)
  os.Exit(1)
 }
 ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
 defer stop()

 store, err := worker.Open(cfg.DatabaseURL)
 if err != nil {
  log.Error("open database", "err", err)
  os.Exit(1)
 }
 defer store.Close()
 for store.Ready(ctx) != nil {
  log.Info("waiting for the jobs table (the app runs migrations)")
  select {
  case <-ctx.Done():
   return
  case <-time.After(2 * time.Second):
  }
 }

 log.Info("worker started", "id", cfg.ID, "concurrency", cfg.Concurrency, "version", version)
 _ = worker.Run(ctx, cfg, store, worker.Registry{}, log)
 log.Info("worker stopped")
}
```

Run: `go vet ./... && go build -o /tmp/pw ./cmd/worker && /tmp/pw --version`
Expected: `dev`.

- [ ] **Step 10: Stop — leave uncommitted, report.**

---

### Task 5: Thumbnail executor in Go

**Files:**

- Create: `internal/jobs/thumbnail/peaks.go`,
  `internal/jobs/thumbnail/thumbnail.go`
- Test: `internal/jobs/thumbnail/peaks_test.go`,
  `internal/jobs/thumbnail/thumbnail_test.go`
- Modify: `cmd/worker/main.go` (register `"thumbnail"`)

**Interfaces:**

- Consumes: `jobs.Job`, `jobs.Executor` (Task 4).
- Produces: job type `"thumbnail"`, spec
  `{"kind": "image"|"video"|"pdf"|"audio", "source": "<abs path>", "output": "<abs path>", "size": 300, "buckets": 400}`;
  result `{"output": "<abs path>"}`. `thumbnail.Run` is a `jobs.Executor`.
  `thumbnail.BucketPeaks(samples []int16, buckets int) []float64` — identical
  output to the TS `bucketPeaks` it replaces.

- [ ] **Step 1: Failing peaks test** (same vectors as the TS suite it replaces)

```go
package thumbnail

import (
 "encoding/json"
 "testing"
)

func samplesOf(values []int16, per int) []int16 {
 out := make([]int16, 0, len(values)*per)
 for _, v := range values {
  for range per {
   out = append(out, v)
  }
 }
 return out
}

func asJSON(t *testing.T, v any) string {
 b, err := json.Marshal(v)
 if err != nil {
  t.Fatal(err)
 }
 return string(b)
}

func TestScalesLoudestBucketToOne(t *testing.T) {
 if got := asJSON(t, BucketPeaks(samplesOf([]int16{1000, 2000, 4000}, 8), 3)); got != "[0.25,0.5,1]" {
  t.Fatal(got)
 }
}

func TestQuietFileStillFillsTheBar(t *testing.T) {
 if got := asJSON(t, BucketPeaks(samplesOf([]int16{2300, 1150}, 8), 2)); got != "[1,0.5]" {
  t.Fatal(got)
 }
}

func TestSilenceIsNotAmplified(t *testing.T) {
 if p := BucketPeaks(samplesOf([]int16{100, 50}, 8), 2); p[0] >= 0.01 {
  t.Fatal(p)
 }
}

func TestOneEntryPerBucket(t *testing.T) {
 if n := len(BucketPeaks(samplesOf([]int16{1, 2, 3, 4}, 4), 4)); n != 4 {
  t.Fatal(n)
 }
}

func TestEmptyInputIsAnEmptyArray(t *testing.T) {
 if got := asJSON(t, BucketPeaks(nil, 4)); got != "[]" {
  t.Fatal(got)
 }
}
```

Run: `go test ./internal/jobs/thumbnail/` Expected: FAIL, undefined.

- [ ] **Step 2: `peaks.go`**

```go
package thumbnail

import "math"

// Below -40 dBFS a file is treated as silence and not normalised up.
const silenceFloor = 0.01

// BucketPeaks is the loudest sample per slice, scaled so the loudest slice is 1.
// Relative, not absolute: the waveform is the player's scrubber, and a quiet
// master drew a line too thin to click.
func BucketPeaks(samples []int16, buckets int) []float64 {
 per := max(1, len(samples)/buckets)
 peaks := make([]float64, 0, buckets)
 loudest := 0.0
 for b := 0; b < buckets; b++ {
  start := b * per
  if start >= len(samples) {
   break
  }
  end := min(start+per, len(samples))
  peak := 0.0
  for _, s := range samples[start:end] {
   peak = max(peak, math.Abs(float64(s)))
  }
  scaled := peak / 32768
  loudest = max(loudest, scaled)
  peaks = append(peaks, scaled)
 }
 gain := 1.0
 if loudest > silenceFloor {
  gain = 1 / loudest
 }
 for i, p := range peaks {
  peaks[i] = math.Round(p*gain*1000) / 1000
 }
 return peaks
}
```

Run: `go test ./internal/jobs/thumbnail/` Expected: PASS.

- [ ] **Step 3: Failing executor test** — generates real fixtures with ffmpeg,
      skipped where ffmpeg is absent.

```go
package thumbnail

import (
 "context"
 "encoding/json"
 "os"
 "os/exec"
 "path/filepath"
 "strings"
 "testing"

 "github.com/orochibraru/penombre/internal/jobs"
)

func needFFmpeg(t *testing.T) {
 if _, err := exec.LookPath("ffmpeg"); err != nil {
  t.Skip("ffmpeg not installed")
 }
}

func ffmpeg(t *testing.T, args ...string) {
 t.Helper()
 if out, err := exec.Command("ffmpeg", append([]string{"-v", "error", "-y"}, args...)...).CombinedOutput(); err != nil {
  t.Fatalf("%v: %s", err, out)
 }
}

func run(t *testing.T, spec Spec) (string, error) {
 t.Helper()
 raw, _ := json.Marshal(spec)
 _, err := Run(context.Background(), jobs.Job{ID: "j", Type: "thumbnail", Spec: raw})
 return spec.Output, err
}

func TestImageBecomesWebpInsideTheBox(t *testing.T) {
 needFFmpeg(t)
 dir := t.TempDir()
 src := filepath.Join(dir, "in.png")
 ffmpeg(t, "-f", "lavfi", "-i", "color=red:size=800x400", "-frames:v", "1", src)
 out, err := run(t, Spec{Kind: "image", Source: src, Output: filepath.Join(dir, ".thumbnails", "in.png_300.webp"), Size: 300})
 if err != nil {
  t.Fatal(err)
 }
 b, _ := os.ReadFile(out)
 if len(b) < 12 || string(b[8:12]) != "WEBP" {
  t.Fatal("output is not a webp")
 }
 probe, _ := exec.Command("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out).Output()
 if strings.TrimSpace(string(probe)) != "300,150" {
  t.Fatalf("want 300x150, got %s", probe)
 }
}

func TestSmallImageIsNotEnlarged(t *testing.T) {
 needFFmpeg(t)
 dir := t.TempDir()
 src := filepath.Join(dir, "in.png")
 ffmpeg(t, "-f", "lavfi", "-i", "color=blue:size=40x20", "-frames:v", "1", src)
 out, err := run(t, Spec{Kind: "image", Source: src, Output: filepath.Join(dir, "o.webp"), Size: 300})
 if err != nil {
  t.Fatal(err)
 }
 probe, _ := exec.Command("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out).Output()
 if strings.TrimSpace(string(probe)) != "40,20" {
  t.Fatalf("want 40x20, got %s", probe)
 }
}

func TestShortVideoFallsBackToFirstFrame(t *testing.T) {
 needFFmpeg(t)
 dir := t.TempDir()
 src := filepath.Join(dir, "in.mp4")
 ffmpeg(t, "-f", "lavfi", "-i", "testsrc=duration=0.5:size=320x240:rate=10", src)
 if _, err := run(t, Spec{Kind: "video", Source: src, Output: filepath.Join(dir, "o.webp"), Size: 100}); err != nil {
  t.Fatal(err)
 }
}

func TestAudioWritesPeaksJSON(t *testing.T) {
 needFFmpeg(t)
 dir := t.TempDir()
 src := filepath.Join(dir, "in.wav")
 ffmpeg(t, "-f", "lavfi", "-i", "sine=frequency=440:duration=1", src)
 out, err := run(t, Spec{Kind: "audio", Source: src, Output: filepath.Join(dir, "in.wav_peaks.json"), Buckets: 400})
 if err != nil {
  t.Fatal(err)
 }
 var peaks []float64
 b, _ := os.ReadFile(out)
 if err := json.Unmarshal(b, &peaks); err != nil || len(peaks) != 400 {
  t.Fatalf("want 400 peaks, got %d (%v)", len(peaks), err)
 }
}

func TestFailureLeavesNoFile(t *testing.T) {
 needFFmpeg(t)
 dir := t.TempDir()
 src := filepath.Join(dir, "broken.png")
 _ = os.WriteFile(src, []byte("not an image"), 0o644)
 out := filepath.Join(dir, "o.webp")
 if _, err := run(t, Spec{Kind: "image", Source: src, Output: out, Size: 300}); err == nil {
  t.Fatal("expected an error")
 }
 entries, _ := os.ReadDir(dir)
 if len(entries) != 1 {
  t.Fatalf("staging files left behind: %v", entries)
 }
}

func TestUnknownKindIsAnError(t *testing.T) {
 if _, err := run(t, Spec{Kind: "spreadsheet", Source: "x", Output: "y"}); err == nil {
  t.Fatal("expected an error")
 }
}
```

Run: `go test ./internal/jobs/thumbnail/` Expected: FAIL, `Run`/`Spec`
undefined.

- [ ] **Step 4: `thumbnail.go`**

```go
// Package thumbnail renders grid thumbnails (webp) and audio peak data (JSON)
// into the storage root's .thumbnails cache.
package thumbnail

import (
 "bytes"
 "context"
 "encoding/binary"
 "encoding/json"
 "errors"
 "fmt"
 "os"
 "os/exec"
 "path/filepath"

 "github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
 Kind    string `json:"kind"`
 Source  string `json:"source"`
 Output  string `json:"output"`
 Size    int    `json:"size"`
 Buckets int    `json:"buckets"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
 var spec Spec
 if err := job.DecodeSpec(&spec); err != nil {
  return nil, err
 }
 if err := os.MkdirAll(filepath.Dir(spec.Output), 0o755); err != nil {
  return nil, err
 }
 // Staged beside the destination and renamed in: the app serves whatever is
 // at Output the moment it exists, so a partial file must never be there.
 stage := fmt.Sprintf("%s.%s.tmp", spec.Output, job.ID)
 defer os.Remove(stage)

 var err error
 switch spec.Kind {
 case "image":
  err = webp(ctx, spec.Source, stage, spec.Size, false)
 case "video":
  err = webp(ctx, spec.Source, stage, spec.Size, true)
  if err != nil || empty(stage) {
   err = webp(ctx, spec.Source, stage, spec.Size, false)
  }
 case "pdf":
  err = pdf(ctx, spec, stage)
 case "audio":
  err = peaks(ctx, spec, stage)
 default:
  err = fmt.Errorf("unsupported kind %q", spec.Kind)
 }
 if err == nil && empty(stage) {
  err = errors.New("renderer produced no output")
 }
 if err != nil {
  return nil, err
 }
 if err := os.Rename(stage, spec.Output); err != nil {
  return nil, err
 }
 return map[string]string{"output": spec.Output}, nil
}

func empty(path string) bool {
 info, err := os.Stat(path)
 return err != nil || info.Size() == 0
}

// webp fits src inside size×size without enlarging it; seek skips a video's
// usually-black first frame.
func webp(ctx context.Context, src, out string, size int, seek bool) error {
 args := []string{"-v", "error", "-y"}
 if seek {
  args = append(args, "-ss", "1")
 }
 scale := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", size, size)
 args = append(args, "-i", src, "-frames:v", "1", "-vf", scale, "-c:v", "libwebp", "-quality", "80", "-f", "webp", out)
 return command(ctx, "ffmpeg", args...)
}

func pdf(ctx context.Context, spec Spec, out string) error {
 base := out + ".page"
 defer os.Remove(base + ".png")
 if err := command(ctx, "pdftoppm", "-png", "-f", "1", "-l", "1", "-scale-to", fmt.Sprint(spec.Size), "-singlefile", spec.Source, base); err != nil {
  return err
 }
 return webp(ctx, base+".png", out, spec.Size, false)
}

func peaks(ctx context.Context, spec Spec, out string) error {
 cmd := exec.CommandContext(ctx, "ffmpeg", "-v", "error", "-i", spec.Source, "-ac", "1", "-ar", "8000", "-f", "s16le", "-")
 var pcm, stderr bytes.Buffer
 cmd.Stdout, cmd.Stderr = &pcm, &stderr
 if err := cmd.Run(); err != nil {
  return fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
 }
 if pcm.Len() < 2 {
  return errors.New("no audio decoded")
 }
 samples := make([]int16, pcm.Len()/2)
 if err := binary.Read(&pcm, binary.LittleEndian, samples); err != nil {
  return err
 }
 buckets := spec.Buckets
 if buckets <= 0 {
  buckets = 400
 }
 b, err := json.Marshal(BucketPeaks(samples, buckets))
 if err != nil {
  return err
 }
 return os.WriteFile(out, b, 0o644)
}

func command(ctx context.Context, name string, args ...string) error {
 if out, err := exec.CommandContext(ctx, name, args...).CombinedOutput(); err != nil {
  return fmt.Errorf("%s: %w: %s", name, err, out)
 }
 return nil
}
```

Run: `go test ./internal/jobs/thumbnail/` Expected: PASS (or SKIP for the ffmpeg
tests where it is missing — install it: `brew install ffmpeg poppler`).

- [ ] **Step 5: Register it** — in `cmd/worker/main.go`, import
      `"github.com/orochibraru/penombre/internal/jobs/thumbnail"` and pass
      `worker.Registry{"thumbnail": thumbnail.Run}`.

Run: `go vet ./... && go test -race ./...` Expected: PASS.

- [ ] **Step 6: Stop — leave uncommitted, report.**

---

### Task 6: `ThumbnailService` enqueues instead of rendering

**Files:**

- Modify: `src/lib/server/services/storage/thumbnails.ts`
- Modify: `src/lib/server/services/storage/thumbnails.test.ts`
- Modify: `package.json` (remove `sharp`)

**Interfaces:**

- Consumes: `enqueueJob`, `awaitJob` (Task 3); job type `"thumbnail"` and its
  spec (Task 5).
- Produces: unchanged public API — `warm(key, contentType)`,
  `getThumbnail(key, size)`, `generateThumbnail(key, contentType, size)`,
  `deleteThumbnails(key)`, `getLocalOrTempPath(key)`, `WARM_SIZE`,
  `PEAK_BUCKETS`. `warm` now only enqueues (never awaits a render).

- [ ] **Step 1: Replace the tests** — delete the `bucketPeaks` and
      `writeCacheAtomically` suites (both moved to Go), and add:

```ts
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const enqueueJob = mock(async () => "job-1");
const awaitJob = mock(async () => ({ status: "succeeded" }));
mock.module("#lib/server/services/jobs.js", () => ({ enqueueJob, awaitJob }));

const { ThumbnailService } = await import("./thumbnails");

describe("ThumbnailService", () => {
  let root = "";
  const service = () => new ThumbnailService({ storagePath: root } as never);

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "penombre-thumbs-"));
    enqueueJob.mockClear();
    awaitJob.mockClear();
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  test("a cache hit never enqueues", async () => {
    await mkdir(join(root, ".thumbnails"));
    await writeFile(join(root, ".thumbnails", "a_b.png_300.webp"), "cached");
    const result = await service().generateThumbnail(
      "a/b.png",
      "image/png",
      300,
    );
    expect(result?.buffer.toString()).toBe("cached");
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  test("a miss enqueues a resolved spec and serves the worker's file", async () => {
    const output = join(root, ".thumbnails", "song.mp3_peaks.json");
    awaitJob.mockImplementationOnce(async () => {
      await mkdir(join(root, ".thumbnails"), { recursive: true });
      await writeFile(output, "[1]");
      return { status: "succeeded" };
    });
    const result = await service().generateThumbnail(
      "song.mp3",
      "audio/mpeg",
      300,
    );
    expect(result).toEqual({
      buffer: Buffer.from("[1]"),
      contentType: "application/json",
    });
    expect(enqueueJob.mock.calls[0]?.[0]).toMatchObject({
      type: "thumbnail",
      dedupeKey: output,
      spec: {
        kind: "audio",
        source: join(root, "song.mp3"),
        output,
        buckets: 400,
      },
    });
  });

  test("a failed job is a miss, not an error", async () => {
    awaitJob.mockImplementationOnce(async () => ({ status: "failed" }));
    expect(
      await service().generateThumbnail("x.png", "image/png", 100),
    ).toBeNull();
  });

  test("unsupported types are never enqueued", async () => {
    expect(
      await service().generateThumbnail("x.zip", "application/zip", 100),
    ).toBeNull();
    expect(enqueueJob).not.toHaveBeenCalled();
  });

  test("warm enqueues without waiting", async () => {
    await service().warm("v.mp4", "video/mp4");
    expect(enqueueJob).toHaveBeenCalledTimes(1);
    expect(awaitJob).not.toHaveBeenCalled();
  });
});
```

Keep the file's other existing `mock.module` shapes consistent with
`test.setup.ts` (see CLAUDE.md "Test isolation").

Run: `bun test src/lib/server/services/storage/thumbnails.test.ts` Expected:
FAIL (current code renders with sharp/ffmpeg, never enqueues).

- [ ] **Step 2: Rewrite the rendering half of `thumbnails.ts`**

Delete: `writeCacheAtomically`, `SILENCE_FLOOR`, `bucketPeaks`,
`ThumbnailSemaphore` + `thumbnailSemaphore`, `generateVideoThumbnail`,
`generatePdfThumbnail`, `generateAudioPeaks`, `render`, and the `sharp` import.
Keep the type lists, `deleteThumbnails`, `WARM_SIZE`, `PEAK_BUCKETS`,
`getThumbnail`, `getLocalOrTempPath`. Replace `warm` and `generateThumbnail`:

```ts
import { awaitJob, enqueueJob } from "#lib/server/services/jobs.js";

type Kind = "image" | "video" | "pdf" | "audio";

function kindOf(contentType: string): Kind | undefined {
  const is = (list: readonly string[]) => list.includes(contentType);
  if (is(IMAGE_TYPES)) return "image";
  if (is(VIDEO_TYPES)) return "video";
  if (is(DOCUMENT_TYPES)) return "pdf";
  if (is(AUDIO_TYPES)) return "audio";
  return undefined;
}
```

(Format with `curly` per oxlint: braces on each `if`.)

Inside the class:

```ts
 private plan(key: string, contentType: string, size: number) {
  const kind = kindOf(contentType);
  if (!kind) {
   return undefined;
  }
  const safeKey = key.replace(/\//g, "_");
  const output = join(
   this.ctx.storagePath,
   ".thumbnails",
   kind === "audio" ? `${safeKey}_peaks.json` : `${safeKey}_${size}.webp`,
  );
  return {
   output,
   outputType: kind === "audio" ? "application/json" : "image/webp",
   job: {
    type: "thumbnail",
    dedupeKey: output,
    spec: {
     kind,
     source: join(this.ctx.storagePath, key),
     output,
     size,
     buckets: ThumbnailService.PEAK_BUCKETS,
    },
   },
  };
 }

 /** Never throws: a failed enqueue must not fail an upload or a scan. */
 async warm(key: string, contentType: string): Promise<void> {
  const plan = this.plan(key, contentType, ThumbnailService.WARM_SIZE);
  if (!plan || existsSync(plan.output)) {
   return;
  }
  try {
   await enqueueJob(plan.job);
  } catch (error) {
   logger.warn(`[thumbnail] Warm failed for ${key}:`, error);
  }
 }

 async generateThumbnail(
  key: string,
  contentType: string,
  size = 300,
 ): Promise<{ buffer: Buffer; contentType: string } | null> {
  const plan = this.plan(key, contentType, size);
  if (!plan) {
   return null;
  }
  try {
   if (!existsSync(plan.output)) {
    const job = await awaitJob(await enqueueJob({ ...plan.job, priority: 10 }));
    if (job?.status !== "succeeded") {
     logger.warn(`[thumbnail] No thumbnail for ${key}: ${job?.error ?? "timed out"}`);
     return null;
    }
   }
   const bytes = await Bun.file(plan.output).arrayBuffer();
   return { buffer: Buffer.from(bytes), contentType: plan.outputType };
  } catch (error) {
   logger.error(`[thumbnail] Error generating thumbnail for ${key}:`, error);
   return null;
  }
 }
```

`priority: 10` puts a thumbnail someone is looking at ahead of warm-ups queued
by a scan. `source` is the real file: `LocalStorageDriver` is the only driver
and stores keys under `storagePath`.

- [ ] **Step 3: Remove sharp**

Run: `grep -rn '"sharp"' src` Expected: nothing. Then `bun remove sharp`.

- [ ] **Step 4: Verify**

Run: `bun test` Expected: PASS (`scan.test.ts` stubs `warm`, unaffected). Run:
`bun run check && bun run lint:ts` Expected: PASS.

- [ ] **Step 5: Stop — leave uncommitted, report.**

---

### Task 7: Embedded worker process + `WORKER_MODE`

**Files:**

- Modify: `src/lib/server/config.defaults.ts`, `src/lib/server/config.ts`
- Create: `src/lib/server/services/worker-process.ts`
- Test: `src/lib/server/services/worker-process.test.ts`
- Modify: `src/hooks.server.ts` (`init`)
- Modify: `test.setup.ts` (config mock gains `worker`)
- Regenerate: `.example.env`

**Interfaces:**

- Consumes: `getConfig()`, `getDbUrl()`.
- Produces:
  - config `worker: { mode: "embedded" | "external"; concurrency: number }` from
    `WORKER_MODE` (default `embedded`) and `WORKER_CONCURRENCY` (default `4`).
  - `workerCommand(dev: boolean): string[]` — `["go", "run", "./cmd/worker"]` in
    dev, `["/usr/local/bin/penombre-worker"]` otherwise.
  - `startEmbeddedWorker(): void` — no-op when `mode === "external"`; spawns the
    worker with `DATABASE_URL` set to the app's resolved URL, restarts it on
    exit with backoff (1s doubling, capped 30s, reset after 60s up), kills it on
    app exit.

- [ ] **Step 1: Config** — in `config.defaults.ts` add to `defaultConfigValues`:

```ts
 worker: {
  mode: "embedded" as "embedded" | "external",
  concurrency: 4,
 },
```

and to `generateExampleDotenvFile()` a section:

```text
# Background worker: "embedded" runs it inside this container,
# "external" expects a separate penombre-worker container
WORKER_MODE=${defaultConfigValues.worker.mode}
WORKER_CONCURRENCY=${defaultConfigValues.worker.concurrency}
```

In `config.ts`, add a `worker` object to the Zod schema
(`mode: z.enum(["embedded", "external"]).default(...)`,
`concurrency: z.coerce.number().int().positive().default(...)`) and fill it in
`getConfig()` from `env.WORKER_MODE` / `env.WORKER_CONCURRENCY`, following how
`redis` is read at l.303-323. Add the same `worker` shape to every
`#lib/server/config` mock (`test.setup.ts` and any local mocks —
`grep -rn 'mock.module("#lib/server/config' src`), per CLAUDE.md "Test
isolation". Run `bun run gen:env`.

- [ ] **Step 2: Failing test**

```ts
import { describe, expect, test } from "bun:test";
import { nextDelay, workerCommand } from "./worker-process";

describe("workerCommand", () => {
  test("dev runs the Go source", () => {
    expect(workerCommand(true)).toEqual(["go", "run", "./cmd/worker"]);
  });
  test("production runs the installed binary", () => {
    expect(workerCommand(false)).toEqual(["/usr/local/bin/penombre-worker"]);
  });
});

describe("nextDelay", () => {
  test("doubles up to 30s", () => {
    expect(nextDelay(1000, 5_000)).toBe(2000);
    expect(nextDelay(20_000, 5_000)).toBe(30_000);
  });
  test("resets after a minute of uptime", () => {
    expect(nextDelay(16_000, 61_000)).toBe(1000);
  });
});
```

Run: `bun test src/lib/server/services/worker-process.test.ts` Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
import { dev } from "$app/env";
import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import { getDbUrl } from "#lib/server/db/index.js";

const logger = new Logger("Worker");

export function workerCommand(isDev: boolean): string[] {
  return isDev
    ? ["go", "run", "./cmd/worker"]
    : ["/usr/local/bin/penombre-worker"];
}

export function nextDelay(previous: number, uptimeMs: number): number {
  return uptimeMs > 60_000 ? 1000 : Math.min(previous * 2, 30_000);
}

export function startEmbeddedWorker(): void {
  const { worker } = getConfig();
  if (worker.mode === "external") {
    logger.info("WORKER_MODE=external: expecting a separate worker container");
    return;
  }
  let child: ReturnType<typeof Bun.spawn> | undefined;
  let stopping = false;
  let delay = 500;

  const spawn = () => {
    const startedAt = Date.now();
    child = Bun.spawn(workerCommand(dev), {
      env: {
        ...process.env,
        DATABASE_URL: getDbUrl(),
        WORKER_CONCURRENCY: String(worker.concurrency),
      },
      stdout: "inherit",
      stderr: "inherit",
      onExit: (_proc, code) => {
        if (stopping) {
          return;
        }
        delay = nextDelay(delay, Date.now() - startedAt);
        logger.warn(`Worker exited (code ${code}), restarting in ${delay}ms`);
        setTimeout(spawn, delay);
      },
    });
  };
  spawn();

  const stop = () => {
    stopping = true;
    child?.kill("SIGTERM");
  };
  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);
  process.once("exit", stop);
}
```

Check `$app/env` is the right `dev` import for Kit 3 in this repo
(`grep -rn 'from "\$app/env' src | head`) and match it. Guard against HMR
double-spawning in dev the way `library-scan.ts` does (a `globalThis` flag),
since `init` can re-run.

Run: `bun test src/lib/server/services/worker-process.test.ts` Expected: PASS.

- [ ] **Step 4: Wire into `init`** — in `hooks.server.ts`, after
      `runMigrations()` (the worker waits for the table, but starting after
      migrations avoids a burst of "waiting" lines):

```ts
await waitForDatabase();
await runMigrations();
startEmbeddedWorker();
await seedAuth();
```

- [ ] **Step 5: Verify end to end**

Run: `rm -rf data && bun run dev`. Expected in the log: `worker started`. Upload
an image, an mp3, an mp4 and a PDF; the grid shows thumbnails and the track
shows a waveform. Run
`sqlite3 data/db/penombre.sqlite "select type, status, count(*) from jobs group by 1, 2"`
Expected: only `succeeded` rows. Kill the worker (`pkill -f cmd/worker`);
expected: a restart log line and thumbnails keep working.

Run: `bun test && bun run check && bun run lint:ts` Expected: PASS.

- [ ] **Step 6: Stop — leave uncommitted, report.**

---

### Task 8: Image, separate-container mode, tooling, CI, docs

**Files:**

- Modify: `Dockerfile`, `.dockerignore` (ensure `go.mod`, `go.sum`, `cmd/`,
  `internal/` are not excluded)
- Modify: `compose.example.yaml`
- Modify: `.pre-commit-config.yaml`, `package.json`,
  `.github/workflows/code_quality.yaml`
- Create: `docs/worker.md`; Modify: `docs/config.json`, `docs/env.md`,
  `docs/deployment.md`
- Modify: `CLAUDE.md`

**Interfaces:**

- Consumes: everything above.
- Produces: image containing `/usr/local/bin/penombre-worker`; documented
  separate-container deployment.

- [ ] **Step 1: Dockerfile** — add a stage before `app`, and copy the binary in
      `app`:

```dockerfile
FROM --platform=$BUILDPLATFORM golang:1.26-alpine AS go-builder
ARG TARGETOS TARGETARCH APP_VERSION=""
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -trimpath -ldflags "-s -w -X main.version=${APP_VERSION:-dev}" \
    -o /out/penombre-worker ./cmd/worker
```

In the `app` stage, after `apk add`:

```dockerfile
COPY --from=go-builder /out/penombre-worker /usr/local/bin/penombre-worker
```

Run: `docker build --target app -t penombre:worker .` then
`docker run --rm penombre:worker /usr/local/bin/penombre-worker --version`
Expected: `dev`. Then confirm ffmpeg has libwebp:
`docker run --rm penombre:worker ffmpeg -hide_banner -encoders | grep libwebp`
Expected: a `libwebp` line. If absent, add `libwebp` to the `apk add` line and
re-check.

- [ ] **Step 2: Separate container in `compose.example.yaml`** — add, commented
      out, beneath the app service:

```yaml
# Optional: run the background worker in its own container.
# Set WORKER_MODE=external on the app service when you enable this.
# worker:
#   image: orochibraru/penombre:latest
#   command: ["/usr/local/bin/penombre-worker"]
#   restart: unless-stopped
#   healthcheck:
#     disable: true
#   environment:
#     - DATABASE_URL=postgresql://postgres:postgres@db:5432/penombre
#   volumes:
#     - storage_data:/data
#   depends_on:
#     - app
```

The worker must mount storage at **the same path** as the app: specs carry
absolute paths.

- [ ] **Step 3: Tooling** — `package.json` scripts:

```json
"check:go": "go vet ./...",
"test:go": "go test -race ./...",
```

and make `check` run `check:go` too:
`"check": "bun run check:app && bun run check:scripts && bun run check:go"`.

`.pre-commit-config.yaml`, in the first `local` repo:

```yaml
- id: format-go
  name: Formatting (Go)
  entry: gofmt -w
  language: system
  files: \.go$

- id: test-go
  name: Unit Tests (Go)
  entry: go test ./...
  language: system
  pass_filenames: false
  stages: [pre-push]
  files: (\.go$|^go\.(mod|sum)$)
```

and add `\.go$|^go\.(mod|sum)$` to the `check` hook's `files`.

`code_quality.yaml`: in both jobs, after checkout:

```yaml
- name: Setup Go
  uses: actions/setup-go@v7
  with:
    go-version-file: go.mod
```

In `ts-test`, add `sudo apt-get update && sudo apt-get install -y ffmpeg` and a
`- name: Tests (Go)` step running `go test -race ./...`.

Re-verify the action tag first:
`git ls-remote --tags --refs https://github.com/actions/setup-go` — pin the
latest major that exists as a tag.

- [ ] **Step 4: Docs** — `docs/worker.md` (user-facing, 80-column prose): what
      the worker does (thumbnails and waveforms today), that it runs inside the
      container by default, how to run it separately (the compose snippet,
      `WORKER_MODE=external`, same storage mount path, same `DATABASE_URL`), and
      that SQLite across two containers needs the database file on a shared
      local volume (not a network filesystem — WAL requires shared memory on one
      host). Add `{ "slug": "worker", "icon": "cpu" }` to the "Self-hosting"
      category in `docs/config.json`. Add `WORKER_MODE` and `WORKER_CONCURRENCY`
      rows to a new "## Worker" table in `docs/env.md`. Link `worker.md` from
      `docs/deployment.md`.

Run: `bun run lint:md` Expected: PASS.

- [ ] **Step 5: CLAUDE.md** — add a "### Heavy work runs in the Go worker"
      section: the `jobs` table contract (app resolves the spec, Go executes,
      epoch-ms times on both dialects, `$1` placeholders), WAL + busy_timeout
      and why, `WORKER_MODE`, the fact that thumbnails are now written by Go
      (update "A cached thumbnail must appear whole or not at all" to say the
      staging+rename now lives in `internal/jobs/thumbnail`), and add
      `bun run test:go` / `bun run check:go` to Commands.

- [ ] **Step 6: Full verification**

Run: `prek run --all-files && prek run --all-files --hook-stage pre-push`
Expected: all pass. Run: `bun run test:e2e` Expected: PASS — in particular
`waveform.spec.ts` (uploads a track then plays it: the peaks now come from the
worker). Run: `bun run test:e2e:pg` Expected: PASS (exercises the Postgres
`for update skip locked` claim).

- [ ] **Step 7: Stop — leave uncommitted, report.**

---

### Task 9: Library scan listing and media durations in Go

Rulings (2026-09-19): Go does the filesystem and media work; TS keeps every row
decision (`ScanOperations` diffing, `determineCategory`, progress reporting
through `library-scan.ts`, the SSE stream).

- Job type `scan-list`: spec `{"root": "<abs storagePath>"}`. Go walks `root`
  (`filepath.WalkDir`), mirroring `isScannable` in `services/storage/scan.ts`
  exactly: skip any path segment starting with `.` and any `*.meta.json`. Result
  `{"entries": [{"key": "a/b.mp3", "size": 123}]}`, keys relative with `/`
  separators, sorted. Package `internal/jobs/scanlist`, with tests on a temp
  tree.
- Job type `media-probe`: spec `{"path": "<abs>"}`; runs
  `ffprobe -v error -show_entries format=duration -of json <path>`; result
  `{"duration": <seconds float, 0 when absent>}`. Package
  `internal/jobs/mediaprobe`, tests generate a 1s wav with ffmpeg (skip when
  absent).
- TS: `ScanOperations.scan` gets its listing from one `scan-list` job (enqueue +
  `awaitJob` with a 30 min timeout) instead of `driver.listObjectKeys()` + a
  `getObjectSize` per key; the `listing` phase covers that wait. Add
  `probeDuration(absPath): Promise<number>` in `services/storage/media.ts`
  (enqueue `media-probe`, await, `0` on failure) and use it everywhere
  `parseFile` from `music-metadata` is used today (`scan.ts`
  `readMediaDuration`, `files.ts` ~l.495). Remove `music-metadata` and
  `src/music-metadata.d.ts` if nothing else uses them. Update `scan.test.ts` to
  stub the listing instead of the driver.

### Task 10: Zip archives in Go

Ruling (2026-09-19): the worker builds the archive to a temp file and the app
streams that file. The first byte arrives once the archive is complete — the
price of moving the work off the web process; the HTTP contract and headers of
the four zip routes are unchanged.

- Job type `zip`: spec
  `{"output": "<abs>", "entries": [{"source": "<abs file>", "name": "display/path.ext"}]}`.
  Go writes with `archive/zip`, Deflate at level 6 (register a
  `flate.NewWriter(w, 6)` compressor), staged beside `output` and renamed in.
  Duplicate `name`s are kept distinct the way `archiver` does not — append
  `(2)`, `(3)` before the extension. Result `{"output", "bytes"}`. Package
  `internal/jobs/ziparchive`, tests round-trip with `archive/zip` reader.
- TS `ZipService` (`services/storage/zip.ts`): resolve the same entries it does
  today (same DB queries, same display paths via `buildDisplayPathForFile`),
  output to `<getStoragePath()>/.tmp/zips/<uuid>.zip` (a dot-directory, so the
  scan ignores it), enqueue with `priority: 10`, `awaitJob` with a 30 min
  timeout, and return a `ReadableStream` of the file that deletes it when the
  stream ends or is cancelled. Update the four routes (`storage/download`,
  `storage/download/folder/[folder]`, `sharings/[id]/download`,
  `s/[token]/download`) and `service.ts` wrappers. A sweep deletes `.tmp/zips`
  files older than 1h, run from `init()` and hourly. Remove `archiver` (and
  `@types/archiver` if present) once unused.

### Task 11: Transfer copies and trash deletion in Go

Ruling (2026-09-19): HTTP stays synchronous (the route awaits the job, 30 min
timeout); TS computes every destination key and row, Go moves bytes.

- Job type `copy`: spec `{"pairs": [{"source": "<abs>", "dest": "<abs>"}]}`. Go
  copies each (mkdir parents, stage + rename), continuing past failures. Result
  `{"failed": [{"index": 0, "error": "..."}]}`. Package
  `internal/jobs/copyfiles`.
- Job type `delete`: spec `{"files": ["<abs>"], "dirs": ["<abs>"]}`. Go removes
  each file (a missing file is success — mirrors the ENOENT rule in CLAUDE.md
  "Never delete a row whose bytes are still there") and `os.RemoveAll`s each
  dir. Result `{"failedFiles": ["<abs>"], "failedDirs": [...]}`. Package
  `internal/jobs/deletefiles`.
- TS `importTree` (`services/storage/transfer.ts`, `files.ts` `importFile`):
  build every destination (unique names, folder rows as today), run one `copy`
  job for all files, then insert rows only for the pairs that succeeded;
  `failed` counts the rest, so the route's "delete the source only when every
  file landed" rule holds. Warm thumbnails for the copied files.
- TS `emptyTrash` (`services/storage/trash.ts`): one `delete` job for the
  trashed files' bytes and the prefixes of the folders it may delete; keep the
  row of any file in `failedFiles` and every folder that is an ancestor of a
  surviving file, exactly as today; `DELETE_CHUNK` row deletion unchanged.
  Update `trash` tests accordingly.

All three tasks register their executors in `cmd/worker/main.go` and follow Task
6's pattern for tests (mock `#lib/server/services/jobs.js`).
