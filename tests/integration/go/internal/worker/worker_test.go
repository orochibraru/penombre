package worker_test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"testing"
	"time"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/worker"
)

func TestRunExecutesAndRecords(t *testing.T) {
	s, db := openTestStore(t)
	insert(t, db, "a", 0, 1)
	insert(t, db, "b", 0, 2)
	_, _ = db.Exec(`update jobs set type = 'nope' where id = 'b'`)

	ctx, cancel := context.WithCancel(context.Background())
	registry := worker.Registry{"thumbnail": func(context.Context, jobs.Job) (any, error) {
		return map[string]int{"n": 1}, nil
	}}
	cfg := worker.Config{ID: "w", Concurrency: 2, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute}
	done := make(chan error)
	go func() { done <- worker.Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil))) }()

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) && (status(t, db, "a") != "succeeded" || status(t, db, "b") != "failed") {
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	if err := <-done; err != nil && !errors.Is(err, context.Canceled) {
		t.Fatal(err)
	}
	if status(t, db, "a") != "succeeded" || status(t, db, "b") != "failed" {
		t.Fatalf("a=%s b=%s", status(t, db, "a"), status(t, db, "b"))
	}
}

func TestShutdownReleasesInFlightJobs(t *testing.T) {
	s, db := openTestStore(t)
	insert(t, db, "slow", 0, 1)
	started := make(chan struct{})
	registry := worker.Registry{"thumbnail": func(ctx context.Context, _ jobs.Job) (any, error) {
		close(started)
		<-ctx.Done()
		return nil, ctx.Err()
	}}
	ctx, cancel := context.WithCancel(context.Background())
	cfg := worker.Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute, ShutdownGrace: 10 * time.Millisecond}
	done := make(chan error)
	go func() {
		done <- worker.Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	<-started
	cancel()
	<-done
	if got := status(t, db, "slow"); got != "queued" {
		t.Fatalf("an interrupted job must go back to the queue, got %s", got)
	}
}

func TestRunStampsLivenessWhileIdle(t *testing.T) {
	s, db := openTestStore(t)
	ctx, cancel := context.WithCancel(context.Background())
	cfg := worker.Config{ID: "idle", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute}
	done := make(chan error)
	go func() {
		done <- worker.Run(ctx, cfg, s, worker.Registry{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
	}()
	deadline := time.Now().Add(2 * time.Second)
	var n int
	for time.Now().Before(deadline) && n == 0 {
		_ = db.QueryRow(`select count(*) from workers where id = 'idle'`).Scan(&n)
		time.Sleep(10 * time.Millisecond)
	}
	cancel()
	<-done
	if n != 1 {
		t.Fatal("an idle worker must still report itself alive")
	}
}

func runUntil(t *testing.T, cfg worker.Config, s *worker.Store, registry worker.Registry, until func() bool) {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error)
	go func() { done <- worker.Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil))) }()
	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) && !until() {
		time.Sleep(5 * time.Millisecond)
	}
	cancel()
	<-done
}

// Requeued, a copy would run after its awaiting request is gone and leave
// bytes no row points at; it reports what it did instead.
func TestShutdownCompletesCallerBoundJobsInsteadOfRequeuing(t *testing.T) {
	s, db := openTestStore(t)
	insert(t, db, "copy", 0, 1)
	_, _ = db.Exec(`update jobs set type = 'copy'`)
	started := make(chan struct{})
	registry := worker.Registry{"copy": func(ctx context.Context, _ jobs.Job) (any, error) {
		close(started)
		<-ctx.Done()
		return map[string]string{"partial": "yes"}, nil
	}}
	ctx, cancel := context.WithCancel(context.Background())
	// A long grace: a caller-bound job must not wait it out.
	cfg := worker.Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute, ShutdownGrace: time.Minute}
	done := make(chan error)
	go func() { done <- worker.Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil))) }()
	<-started
	cancel()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
		t.Fatal("a caller-bound job must stop at shutdown, not after the grace")
	}
	var result string
	_ = db.QueryRow(`select result from jobs where id = 'copy'`).Scan(&result)
	if got := status(t, db, "copy"); got != "succeeded" || result != `{"partial":"yes"}` {
		t.Fatalf("got %s %s", got, result)
	}
}

func TestAJobPastItsTimeoutFails(t *testing.T) {
	s, db := openTestStore(t)
	insert(t, db, "hung", 0, 1)
	registry := worker.Registry{"thumbnail": func(ctx context.Context, _ jobs.Job) (any, error) {
		<-ctx.Done()
		return nil, ctx.Err()
	}}
	cfg := worker.Config{
		ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute,
		Timeouts: map[string]time.Duration{"thumbnail": 20 * time.Millisecond},
	}
	runUntil(t, cfg, s, registry, func() bool { return status(t, db, "hung") == "failed" })
	var msg string
	_ = db.QueryRow(`select error from jobs where id = 'hung'`).Scan(&msg)
	if status(t, db, "hung") != "failed" || !strings.Contains(msg, "timed out") {
		t.Fatalf("got %s %q", status(t, db, "hung"), msg)
	}
}

// Past a lease without renewing it, the app has failed the job; bytes must
// not keep moving behind that outcome.
func TestAJobWhoseLeaseCannotBeRenewedIsStopped(t *testing.T) {
	s, db := openTestStore(t)
	insert(t, db, "j", 0, 1)
	stopped := make(chan struct{})
	registry := worker.Registry{"thumbnail": func(ctx context.Context, _ jobs.Job) (any, error) {
		_, _ = db.Exec(`drop table jobs`) // every heartbeat now errors
		<-ctx.Done()
		close(stopped)
		return nil, ctx.Err()
	}}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	cfg := worker.Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: 60 * time.Millisecond}
	go func() { _ = worker.Run(ctx, cfg, s, registry, slog.New(slog.NewTextHandler(io.Discard, nil))) }()
	select {
	case <-stopped:
	case <-time.After(3 * time.Second):
		t.Fatal("the job kept running with no lease")
	}
}

// An external worker must not finish a copy nobody will apply: it stops at
// the next item and records what it did, for the app to reconcile.
func TestACallerBoundJobWhoseRequesterDiedStops(t *testing.T) {
	for name, seen := range map[string]string{
		"dead before it starts": "0",
		"dies while it runs":    "cast((julianday('now') - 2440587.5) * 86400000 as integer)",
	} {
		t.Run(name, func(t *testing.T) {
			s, db := openTestStore(t)
			insert(t, db, "copy", 0, 1)
			_, _ = db.Exec(`update jobs set type = 'copy', requested_by = 'app'`)
			_, _ = db.Exec(`insert into app_instances (id, seen_at) values ('app', ` + seen + `)`)
			registry := worker.Registry{"copy": func(ctx context.Context, _ jobs.Job) (any, error) {
				// The app stops beating mid-run.
				_, _ = db.Exec(`update app_instances set seen_at = 0`)
				<-ctx.Done()
				return map[string]string{"stopped": context.Cause(ctx).Error()}, nil
			}}
			cfg := worker.Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: 60 * time.Millisecond}
			runUntil(t, cfg, s, registry, func() bool { return status(t, db, "copy") == "succeeded" })
			var result string
			_ = db.QueryRow(`select result from jobs where id = 'copy'`).Scan(&result)
			if !strings.Contains(result, "awaiting this job is gone") {
				t.Fatalf("got %s %q", status(t, db, "copy"), result)
			}
		})
	}
}

// A caller-bound job gets the same MaxAttempts real runs as any other, then
// one claim that only records; a crash there too finalizes it with its spec
// as the result, so nothing is reclaimed forever and nothing goes unrecorded.
func TestACallerBoundJobOutOfAttempts(t *testing.T) {
	cause := func(ctx context.Context, _ jobs.Job) (any, error) {
		return map[string]string{"cause": fmt.Sprint(context.Cause(ctx))}, nil
	}
	cfg := worker.Config{ID: "w", Concurrency: 1, PollInterval: 5 * time.Millisecond, LeaseTimeout: time.Minute}
	result := func(db *sql.DB) string {
		var r sql.NullString
		_ = db.QueryRow(`select result from jobs where id = 'copy'`).Scan(&r)
		return r.String
	}

	t.Run("the third run is real", func(t *testing.T) {
		s, db := openTestStore(t)
		insert(t, db, "copy", 0, 1)
		_, _ = db.Exec(`update jobs set type = 'copy', status = 'running', attempts = 2, heartbeat_at = 0`)
		runUntil(t, cfg, s, worker.Registry{"copy": cause}, func() bool { return status(t, db, "copy") == "succeeded" })
		if result(db) != `{"cause":"\u003cnil\u003e"}` {
			t.Fatalf("got %q", result(db))
		}
	})

	t.Run("after that it only records", func(t *testing.T) {
		s, db := openTestStore(t)
		insert(t, db, "copy", 0, 1)
		_, _ = db.Exec(`update jobs set type = 'copy', status = 'running', attempts = 3, heartbeat_at = 0`)
		if err := s.Prune(context.Background(), time.Minute); err != nil || status(t, db, "copy") != "running" {
			t.Fatalf("Prune must leave it for the recording run: %v", err)
		}
		runUntil(t, cfg, s, worker.Registry{"copy": cause}, func() bool { return status(t, db, "copy") == "succeeded" })
		if !strings.Contains(result(db), "too many times") {
			t.Fatalf("got %q", result(db))
		}
	})

	t.Run("a crashed recording run is finalized with its spec", func(t *testing.T) {
		s, db := openTestStore(t)
		insert(t, db, "copy", 0, 1)
		_, _ = db.Exec(`update jobs set type = 'copy', status = 'running', attempts = 4, heartbeat_at = 0, spec = '{"pairs":[{"dest":"/d"}]}'`)
		if err := s.Prune(context.Background(), time.Minute); err != nil {
			t.Fatal(err)
		}
		if status(t, db, "copy") != "failed" || result(db) != `{"pairs":[{"dest":"/d"}]}` {
			t.Fatalf("got %s %q", status(t, db, "copy"), result(db))
		}
	})
}
