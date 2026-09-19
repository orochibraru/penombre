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
	// now is the database's clock in epoch ms. Every timestamp the app also
	// compares (seen_at, heartbeat_at) is stamped with it, so a worker on a
	// host with a drifting clock is not taken for dead.
	now string
}

const (
	sqliteNow   = `cast((julianday('now') - 2440587.5) * 86400000 as integer)`
	postgresNow = `(extract(epoch from clock_timestamp()) * 1000)::bigint`
)

// Open mirrors src/lib/server/db/dialect.ts: anything that is not a Postgres
// URL is a SQLite file.
func Open(url string) (*Store, error) {
	if postgresURL.MatchString(url) {
		db, err := sql.Open("pgx", url)
		if err != nil {
			return nil, err
		}
		return &Store{db: db, postgres: true, now: postgresNow}, nil
	}
	path := strings.TrimPrefix(strings.TrimPrefix(url, "file:"), "sqlite:")
	path = strings.TrimPrefix(path, "//")
	dsn := "file:" + path + "?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(1)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	return &Store{db: db, now: sqliteNow}, nil
}

func (s *Store) Close() { _ = s.db.Close() }

// Ready succeeds once the app's migrations have created the tables.
func (s *Store) Ready(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `select 1 from jobs, workers, app_instances limit 1`)
	return err
}

// Beat tells the app this worker is alive; it fails a job fast without one.
func (s *Store) Beat(ctx context.Context, workerID string) error {
	_, err := s.db.ExecContext(ctx, fmt.Sprintf(
		`insert into workers (id, seen_at) values ($1, %s)
		on conflict (id) do update set seen_at = excluded.seen_at`, s.now),
		workerID)
	return err
}

// RequesterAlive reports whether the app instance that enqueued a job still
// heartbeats. A job with no recorded requester counts as alive.
func (s *Store) RequesterAlive(ctx context.Context, jobID string, silence time.Duration) (bool, error) {
	var alive bool
	err := s.db.QueryRowContext(ctx, fmt.Sprintf(
		`select j.requested_by is null or exists (
			select 1 from app_instances a where a.id = j.requested_by and a.seen_at >= %s - $2
		) from jobs j where j.id = $1`, s.now),
		jobID, silence.Milliseconds()).Scan(&alive)
	return alive, err
}

// Claim takes a job whose lease went stale first, then the queue by priority.
// Two statements rather than one `or`, so each can use jobs_claim_idx.
func (s *Store) Claim(ctx context.Context, workerID string, leaseTimeout time.Duration) (*jobs.Job, error) {
	// A copy/delete gets the same MaxAttempts real runs, then one more claim
	// that only records what they left (see execute).
	stale := fmt.Sprintf(`status = 'running' and heartbeat_at < %s - $2 and (attempts < %d or (type in ('copy', 'delete') and attempts <= %d))`, s.now, MaxAttempts, MaxAttempts)
	job, err := s.claimWhere(ctx, stale, workerID, leaseTimeout.Milliseconds())
	if job != nil || err != nil {
		return job, err
	}
	return s.claimWhere(ctx, `status = 'queued'`, workerID)
}

// claimWhere binds $1 = worker id, then any extra args from $2.
func (s *Store) claimWhere(ctx context.Context, where string, args ...any) (*jobs.Job, error) {
	lock := ""
	if s.postgres {
		lock = " for update skip locked"
	}
	query := fmt.Sprintf(`update jobs
		set status = 'running', worker_id = $1, heartbeat_at = %[3]s, started_at = %[3]s, attempts = attempts + 1
		where id = (
			select id from jobs
			where %[1]s
			order by priority desc, created_at
			limit 1%[2]s
		)
		returning id, type, spec, attempts`, where, lock, s.now)
	var job jobs.Job
	var spec string
	err := s.db.QueryRowContext(ctx, query, args...).
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

func (s *Store) Heartbeat(ctx context.Context, id, workerID string) (bool, error) {
	res, err := s.db.ExecContext(ctx, fmt.Sprintf(
		`update jobs set heartbeat_at = %s where id = $1 and worker_id = $2 and status = 'running'`, s.now),
		id, workerID)
	if err != nil {
		return false, err
	}
	n, err := res.RowsAffected()
	return n == 1, err
}

// Complete records the outcome. The spec, which can be megabytes for a large
// copy, is dropped: nothing reads it once the job is over.
func (s *Store) Complete(ctx context.Context, id, workerID string, result any, execErr error) error {
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
	_, err := s.db.ExecContext(ctx, fmt.Sprintf(
		`update jobs set status = $1, result = $2, error = $3, finished_at = %s, worker_id = null, spec = '{}'
		where id = $4 and worker_id = $5`, s.now),
		status, resultJSON, message, id, workerID)
	return err
}

// Release hands an interrupted job back to the queue on shutdown.
func (s *Store) Release(ctx context.Context, id, workerID string) error {
	_, err := s.db.ExecContext(ctx,
		`update jobs set status = 'queued', worker_id = null, heartbeat_at = null
		where id = $1 and worker_id = $2 and status = 'running'`, id, workerID)
	return err
}

func (s *Store) Prune(ctx context.Context, leaseTimeout time.Duration) error {
	// A copy/delete whose recording run crashed too keeps its spec as the
	// result: every path it may have touched, for the app to check on disk.
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(
		`update jobs set status = 'failed', error = 'worker lost the job too many times', finished_at = %[1]s, worker_id = null,
			result = case when type in ('copy', 'delete') then spec end, spec = '{}'
		where status = 'running' and heartbeat_at < %[1]s - $1
			and (attempts > $2 or (attempts = $2 and type not in ('copy', 'delete')))`, s.now),
		leaseTimeout.Milliseconds(), MaxAttempts); err != nil {
		return err
	}
	// A copy/delete result is the only record of bytes its dead requester
	// never accounted for; the app deletes it once reconciled, never Prune.
	if _, err := s.db.ExecContext(ctx, fmt.Sprintf(
		`delete from jobs where ((status = 'succeeded' and finished_at < %[1]s - $1) or (status = 'failed' and finished_at < %[1]s - $2))
		and not (type in ('copy', 'delete') and result is not null)`, s.now),
		time.Hour.Milliseconds(), (7 * 24 * time.Hour).Milliseconds()); err != nil {
		return err
	}
	for _, table := range []string{"workers", "app_instances"} {
		if _, err := s.db.ExecContext(ctx, fmt.Sprintf(`delete from %s where seen_at < %s - $1`, table, s.now), (24 * time.Hour).Milliseconds()); err != nil {
			return err
		}
	}
	return nil
}
