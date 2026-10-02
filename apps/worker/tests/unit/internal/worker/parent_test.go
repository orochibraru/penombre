package worker_test

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/orochibraru/penombre/internal/worker"
)

func TestWatchParentCancelsOnceTheParentIsGone(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	done := make(chan struct{})
	go func() {
		worker.WatchParent(ctx, os.Getppid()+1, time.Millisecond, cancel)
		close(done)
	}()
	select {
	case <-done:
	case <-time.After(2 * time.Second):
		t.Fatal("a different parent must cancel")
	}
	if ctx.Err() == nil {
		t.Fatal("ctx must be cancelled")
	}
}

func TestWatchParentLeavesALiveParentAlone(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Millisecond)
	defer cancel()
	cancelled := false
	worker.WatchParent(ctx, os.Getppid(), time.Millisecond, func() { cancelled = true })
	if cancelled {
		t.Fatal("the parent is still there")
	}
}
