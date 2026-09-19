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
	beatEvery            = 5 * time.Second
	pruneEvery           = time.Minute
	defaultShutdownGrace = 60 * time.Second
)

var errLostLease = errors.New("lease lost")

// callerBound jobs have a caller that writes rows from the outcome. Requeued
// on shutdown, one would run later with nobody awaiting it — bytes no row
// points at (copy) or rows whose bytes are gone (delete). They stop at the
// next item instead and report what they did. Mirrors CALLER_BOUND in
// src/lib/server/services/jobs.ts.
var callerBound = map[string]bool{"copy": true, "delete": true}

// timeouts bound one execution, so a job hung on a dead mount fails rather
// than holding a settle-mode caller forever. Generous on purpose.
var timeouts = map[string]time.Duration{
	"thumbnail":   10 * time.Minute,
	"media-probe": time.Hour,
	"scan-list":   time.Hour,
	"zip":         2 * time.Hour,
	"copy":        6 * time.Hour,
	"delete":      2 * time.Hour,
}

const defaultTimeout = time.Hour

// Run drains in-flight jobs for up to cfg.ShutdownGrace (default 60s) after
// ctx is cancelled, then cancels them.
func Run(ctx context.Context, cfg Config, store *Store, registry Registry, log *slog.Logger) error {
	grace := cfg.ShutdownGrace
	if grace <= 0 {
		grace = defaultShutdownGrace
	}
	// Executions outlive ctx by up to `grace`, then are cancelled.
	execCtx, cancelExec := context.WithCancel(context.WithoutCancel(ctx))
	defer cancelExec()

	slots := make(chan struct{}, cfg.Concurrency)
	var wg sync.WaitGroup
	lastPrune, lastBeat := time.Time{}, time.Time{}
	ticker := time.NewTicker(cfg.PollInterval)
	defer ticker.Stop()

	for {
		if time.Since(lastPrune) > pruneEvery {
			if err := store.Prune(ctx, cfg.LeaseTimeout); err != nil && ctx.Err() == nil {
				log.Warn("prune failed", "err", err)
			}
			lastPrune = time.Now()
		}
		if time.Since(lastBeat) > beatEvery {
			if err := store.Beat(ctx, cfg.ID); err != nil && ctx.Err() == nil {
				log.Warn("liveness beat failed", "err", err)
			}
			lastBeat = time.Now()
		}
		claimed := false
		select {
		case slots <- struct{}{}:
			job, err := store.Claim(ctx, cfg.ID, cfg.LeaseTimeout)
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
	parent := execCtx
	if callerBound[job.Type] {
		// No shutdown grace: stop at the next item and report what was done.
		parent = runCtx
	}
	timeout, ok := cfg.Timeouts[job.Type]
	if !ok {
		timeout, ok = timeouts[job.Type]
	}
	if !ok {
		timeout = defaultTimeout
	}
	bounded, cancelTimeout := context.WithTimeout(parent, timeout)
	defer cancelTimeout()
	ctx, cancel := context.WithCancelCause(bounded)
	defer cancel(nil)
	go heartbeat(ctx, cancel, store, cfg.ID, job.ID, cfg.LeaseTimeout, log)

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
	case runCtx.Err() != nil && ctx.Err() != nil && !callerBound[job.Type]:
		if rerr := store.Release(bg, job.ID, cfg.ID); rerr != nil {
			log.Error("release failed", "id", job.ID, "err", rerr)
		}
	default:
		if errors.Is(err, context.DeadlineExceeded) {
			err = fmt.Errorf("timed out after %s: %w", timeout, err)
		}
		if cerr := store.Complete(bg, job.ID, cfg.ID, result, err); cerr != nil {
			log.Error("complete failed", "id", job.ID, "err", cerr)
		}
		log.Debug("job done", "id", job.ID, "type", job.Type, "ms", time.Since(started).Milliseconds(), "err", err)
	}
}

// heartbeat keeps the lease. Unable to renew it for a whole lease, the job is
// given up: the app has failed it by then and must not see bytes move after.
func heartbeat(ctx context.Context, cancel context.CancelCauseFunc, store *Store, workerID, jobID string, lease time.Duration, log *slog.Logger) {
	// Six chances per lease (10s at the default 60s).
	t := time.NewTicker(lease / 6)
	defer t.Stop()
	renewed := time.Now()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			ok, err := store.Heartbeat(ctx, jobID, workerID)
			if err != nil {
				log.Warn("heartbeat failed", "id", jobID, "err", err)
				if time.Since(renewed) > lease {
					cancel(errLostLease)
					return
				}
				continue
			}
			renewed = time.Now()
			if !ok {
				cancel(errLostLease)
				return
			}
		}
	}
}
