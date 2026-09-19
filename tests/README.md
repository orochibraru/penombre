# Go tests

TypeScript tests stay next to their source (`src/lib/server/services/*.test.ts`,
run by `bun test`) — this tree is Go only, by deliberate choice (no Go tests
beside the code, see the root `CLAUDE.md`).

Every `*_test.go` for `cmd/` and `internal/` lives under
`tests/unit/go/<same path as the package>` or
`tests/integration/go/<same path>`, as an external test package (e.g.
`internal/worker/store.go` is covered by
`tests/unit/go/internal/worker/store_test.go`, `package worker_test`). Split by
what the test needs:

- **`tests/unit/go`**: neither a database nor an external binary (a temp
  directory is fine).
- **`tests/integration/go`**: opens SQLite/Postgres, or execs
  `ffmpeg`/`ffprobe`/`pdftoppm`. A file needing both is split in two.

Run everything: `bun run test:go` (`go test -race` over `cmd/`, `internal/` and
both trees here). Scoped: `bun run test:go:unit` and
`bun run test:go:integration`.

Since a test package can't reach unexported identifiers, a package's job types
(`Spec`, `Result`, …) are exported as its wire contract, and `internal/worker`'s
`Config.ShutdownGrace` field exists so a shutdown test can shorten the grace
period without calling an unexported function. A test needing a package's
internal DB state opens a second `*sql.DB` on the same SQLite file rather than
reaching into a private field. No `export_test.go` shims in `cmd/` or
`internal/`.
