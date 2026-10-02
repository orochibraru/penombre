package worker

import (
	"context"
	"os"
	"time"
)

// WatchParent cancels when the app that spawned this worker is gone. A killed
// app (OOM, SIGKILL) never sends SIGTERM, and an orphaned worker would keep
// running jobs nobody awaits — next to the one the restarted app spawns.
func WatchParent(ctx context.Context, pid int, every time.Duration, cancel context.CancelFunc) {
	if pid == 0 {
		return
	}
	t := time.NewTicker(every)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if os.Getppid() != pid {
				cancel()
				return
			}
		}
	}
}
