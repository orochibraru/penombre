# TODO

The backlog, and the only one. Filled by the `devex`, `ui-ux`, `privacy` and
`cynic` agents (`.claude/agents/`) and by hand. No priority order beyond
**[SECURITY]** first. Size: `[S]` an hour, `[M]` a day, `[L]` more. Done means
deleted.

## DevEx

- [ ] [M] E2E specs share one instance and one drive, so several upload the same
      fixture names and only the shard split keeps them apart: run the whole
      suite in one shard and `upload.spec` finds `test-upload (1).txt`. That is
      also why `workers: 1`. Give each spec its own scope (a per-worker user, or
      a folder per spec) and turn on parallel workers; sharding is a workaround
      for isolation nobody has done.
- [ ] [S] `bun test` locally never touches Redis, while CI sets `REDIS_URL` and
      runs one, so a cache-shaped bug passes here and fails there (it did: the
      rate limiter held a closed client). Either run `test:docker` in the
      pre-push hook when the cache changes, or start a throwaway Redis in the
      unit-test script.
