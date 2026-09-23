package worker_test

import (
	"context"
	"database/sql"
	"errors"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	"github.com/orochibraru/penombre/internal/worker"
)

// openTestStore applies the app's real SQLite migrations, so the queries
// here run against exactly the schema the app creates. It also opens a
// second *sql.DB on the same file, since the exported Store API has no way
// to seed rows or read back internal state directly.
func openTestStore(t *testing.T) (*worker.Store, *sql.DB) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "t.sqlite")
	dsn := "file:" + path + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"

	s, err := worker.Open("file:" + path)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(s.Close)

	raw, err := sql.Open("sqlite", dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = raw.Close() })

	migrations, err := filepath.Glob("../../../../../drizzle/sqlite/*.sql")
	if err != nil || len(migrations) == 0 {
		t.Fatalf("no migrations found: %v", err)
	}
	sort.Strings(migrations)
	for _, path := range migrations {
		sqlText, err := os.ReadFile(path)
		if err != nil {
			t.Fatal(err)
		}
		for _, stmt := range strings.Split(string(sqlText), "--> statement-breakpoint") {
			if stmt = strings.TrimSpace(stmt); stmt == "" {
				continue
			}
			if _, err := raw.Exec(stmt); err != nil {
				t.Fatalf("%s: %v", filepath.Base(path), err)
			}
		}
	}
	return s, raw
}

func insert(t *testing.T, db *sql.DB, id string, priority int, created int64) {
	t.Helper()
	_, err := db.Exec(`insert into jobs (id, type, spec, priority, created_at) values ($1, 'thumbnail', '{}', $2, $3)`, id, priority, created)
	if err != nil {
		t.Fatal(err)
	}
}

func status(t *testing.T, db *sql.DB, id string) string {
	t.Helper()
	var st string
	if err := db.QueryRow(`select status from jobs where id = $1`, id).Scan(&st); err != nil {
		t.Fatal(err)
	}
	return st
}

// age backdates a job's heartbeat, standing in for a worker gone silent.
func age(t *testing.T, db *sql.DB, id string, by time.Duration) {
	t.Helper()
	if _, err := db.Exec(`update jobs set heartbeat_at = heartbeat_at - $1 where id = $2`, by.Milliseconds(), id); err != nil {
		t.Fatal(err)
	}
}

func TestClaimOrdersByPriorityThenAge(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "old", 0, 1)
	insert(t, db, "urgent", 5, 2)

	job, err := s.Claim(ctx, "w1", time.Minute)
	if err != nil || job == nil || job.ID != "urgent" {
		t.Fatalf("got %+v, %v", job, err)
	}
	if job.Attempts != 1 || status(t, db, "urgent") != "running" {
		t.Fatal("claim must mark running and count the attempt")
	}
	job, _ = s.Claim(ctx, "w1", time.Minute)
	if job == nil || job.ID != "old" {
		t.Fatalf("second claim: %+v", job)
	}
	if job, _ = s.Claim(ctx, "w1", time.Minute); job != nil {
		t.Fatalf("queue should be empty, got %+v", job)
	}
}

func TestStaleLeaseIsReclaimed(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "j", 0, 1)
	if _, err := s.Claim(ctx, "dead", time.Minute); err != nil {
		t.Fatal(err)
	}
	age(t, db, "j", 59*time.Second)
	if job, _ := s.Claim(ctx, "w2", time.Minute); job != nil {
		t.Fatal("a live lease must not be stolen")
	}
	age(t, db, "j", 2*time.Second)
	job, _ := s.Claim(ctx, "w2", time.Minute)
	if job == nil || job.Attempts != 2 {
		t.Fatalf("stale lease should be reclaimed: %+v", job)
	}
}

func TestHeartbeatFailsForAnotherWorker(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "j", 0, 1)
	_, _ = s.Claim(ctx, "w1", time.Minute)
	ok, err := s.Heartbeat(ctx, "j", "w2")
	if err != nil || ok {
		t.Fatalf("heartbeat by a non-owner must report false, got %v %v", ok, err)
	}
	ok, _ = s.Heartbeat(ctx, "j", "w1")
	if !ok {
		t.Fatal("owner heartbeat must succeed")
	}
}

func TestCompleteRecordsOutcomeAndDropsTheSpec(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "ok", 0, 1)
	insert(t, db, "ko", 0, 2)
	_, _ = db.Exec(`update jobs set spec = '{"pairs":["a lot"]}'`)
	_, _ = s.Claim(ctx, "w", time.Minute)
	_, _ = s.Claim(ctx, "w", time.Minute)
	if err := s.Complete(ctx, "ok", "w", map[string]string{"output": "x"}, nil); err != nil {
		t.Fatal(err)
	}
	if err := s.Complete(ctx, "ko", "w", nil, errors.New("boom")); err != nil {
		t.Fatal(err)
	}
	var result, msg, spec string
	_ = db.QueryRow(`select result from jobs where id = 'ok'`).Scan(&result)
	_ = db.QueryRow(`select error, spec from jobs where id = 'ko'`).Scan(&msg, &spec)
	if status(t, db, "ok") != "succeeded" || result != `{"output":"x"}` {
		t.Fatalf("ok: %s %s", status(t, db, "ok"), result)
	}
	if status(t, db, "ko") != "failed" || msg != "boom" {
		t.Fatalf("ko: %s %s", status(t, db, "ko"), msg)
	}
	if spec != "{}" {
		t.Fatalf("a finished job keeps no spec, got %s", spec)
	}
}

func TestPrune(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	now := time.Now().UnixMilli()
	day := int64(24 * time.Hour / time.Millisecond)
	_, _ = db.Exec(`insert into jobs (id, type, spec, status, created_at, finished_at) values
		('done-old', 't', '{}', 'succeeded', 0, $1),
		('done-new', 't', '{}', 'succeeded', 0, $2),
		('fail-old', 't', '{}', 'failed', 0, $3)`,
		now-2*int64(time.Hour/time.Millisecond), now-1000, now-8*day)
	_, _ = db.Exec(`insert into jobs (id, type, spec, status, attempts, heartbeat_at, created_at) values
		('stuck', 't', '{}', 'running', 3, 0, 0)`)
	if err := s.Prune(ctx, time.Minute); err != nil {
		t.Fatal(err)
	}
	var n int
	_ = db.QueryRow(`select count(*) from jobs where id in ('done-old', 'fail-old')`).Scan(&n)
	if n != 0 {
		t.Fatal("old finished rows must be deleted")
	}
	if status(t, db, "done-new") != "succeeded" || status(t, db, "stuck") != "failed" {
		t.Fatal("recent rows kept; an abandoned job out of attempts is failed")
	}
}

func seenAt(t *testing.T, db *sql.DB, id string) int64 {
	t.Helper()
	var at int64
	if err := db.QueryRow(`select seen_at from workers where id = $1`, id).Scan(&at); err != nil {
		t.Fatal(err)
	}
	return at
}

// Stamped by the database, not this process: the app compares it against the
// database's clock, and a worker host's drift must not make it look dead.
func TestBeatStampsTheDatabaseClock(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	if err := s.Beat(ctx, "w1"); err != nil {
		t.Fatal(err)
	}
	_, _ = db.Exec(`update workers set seen_at = 0`)
	if err := s.Beat(ctx, "w1"); err != nil {
		t.Fatal(err)
	}
	var dbNow int64
	_ = db.QueryRow(`select cast((julianday('now') - 2440587.5) * 86400000 as integer)`).Scan(&dbNow)
	if got := seenAt(t, db, "w1"); dbNow-got > 5000 || got > dbNow {
		t.Fatalf("seen_at = %d, database now = %d", got, dbNow)
	}
}

// A stale lease is rare and must not starve behind a permanent backlog.
func TestClaimReclaimsAStaleLeaseBeforeTheQueue(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "stale", 0, 1)
	if _, err := s.Claim(ctx, "dead", time.Minute); err != nil {
		t.Fatal(err)
	}
	age(t, db, "stale", 61*time.Second)
	insert(t, db, "urgent", 10, 2)
	job, _ := s.Claim(ctx, "w2", time.Minute)
	if job == nil || job.ID != "stale" {
		t.Fatalf("got %+v", job)
	}
}

func TestPruneForgetsSilentWorkers(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	_ = s.Beat(ctx, "gone")
	_ = s.Beat(ctx, "here")
	_, _ = db.Exec(`update workers set seen_at = seen_at - $1 where id = 'gone'`, (48 * time.Hour).Milliseconds())
	if err := s.Prune(ctx, time.Minute); err != nil {
		t.Fatal(err)
	}
	var n int
	_ = db.QueryRow(`select count(*) from workers`).Scan(&n)
	if n != 1 {
		t.Fatalf("expected only the live worker to remain, have %d", n)
	}
}

func TestRequesterAlive(t *testing.T) {
	s, db := openTestStore(t)
	ctx := context.Background()
	insert(t, db, "legacy", 0, 1)
	insert(t, db, "live", 0, 2)
	insert(t, db, "orphan", 0, 3)
	now := time.Now().UnixMilli()
	_, _ = db.Exec(`insert into app_instances (id, seen_at) values ('app-live', $1), ('app-dead', $2)`, now, now-120_000)
	_, _ = db.Exec(`update jobs set requested_by = 'app-live' where id = 'live'`)
	_, _ = db.Exec(`update jobs set requested_by = 'app-dead' where id = 'orphan'`)
	for id, want := range map[string]bool{"legacy": true, "live": true, "orphan": false} {
		got, err := s.RequesterAlive(ctx, id, 30*time.Second)
		if err != nil || got != want {
			t.Fatalf("%s: got %v %v, want %v", id, got, err, want)
		}
	}
}

// The result is the only record of bytes a dead requester never accounted
// for; the app deletes it once reconciled.
func TestPruneKeepsUnreconciledCopyAndDeleteResults(t *testing.T) {
	s, db := openTestStore(t)
	old := time.Now().UnixMilli() - 8*24*int64(time.Hour/time.Millisecond)
	_, _ = db.Exec(`insert into jobs (id, type, spec, status, result, created_at, finished_at) values
		('copy', 'copy', '{}', 'succeeded', '{"copied":[]}', 0, $1),
		('delete', 'delete', '{}', 'failed', '{"deleted":[]}', 0, $1),
		('thumb', 'thumbnail', '{}', 'succeeded', '{}', 0, $1),
		('no-result', 'copy', '{}', 'failed', null, 0, $1)`, old)
	_, _ = db.Exec(`insert into app_instances (id, seen_at) values ('gone', 0)`)
	if err := s.Prune(context.Background(), time.Minute); err != nil {
		t.Fatal(err)
	}
	var ids []string
	rows, _ := db.Query(`select id from jobs order by id`)
	for rows.Next() {
		var id string
		_ = rows.Scan(&id)
		ids = append(ids, id)
	}
	_ = rows.Close()
	if strings.Join(ids, ",") != "copy,delete" {
		t.Fatalf("kept %v", ids)
	}
	var n int
	_ = db.QueryRow(`select count(*) from app_instances`).Scan(&n)
	if n != 0 {
		t.Fatal("a long-silent app instance must be forgotten")
	}
}

func TestEncryptionKeyIDReadsTheAppMarker(t *testing.T) {
	s, raw := openTestStore(t)
	ctx := context.Background()
	if id, err := s.EncryptionKeyID(ctx); err != nil || id != "" {
		t.Fatalf("no settings row: %q, %v", id, err)
	}
	if _, err := raw.Exec(`insert into app_settings (id, settings, updated_at) values ('instance', '{"encryptionKeyId":"abcd"}', 0)`); err != nil {
		t.Fatal(err)
	}
	if id, err := s.EncryptionKeyID(ctx); err != nil || id != "abcd" {
		t.Fatalf("got %q, %v", id, err)
	}
}
