package worker_test

import (
	"testing"

	"github.com/orochibraru/penombre/internal/worker"
)

func env(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func TestLoadConfigRequiresDatabaseURL(t *testing.T) {
	if _, err := worker.LoadConfig(env(nil)); err == nil {
		t.Fatal("expected an error without DATABASE_URL")
	}
}

func TestLoadConfigDefaults(t *testing.T) {
	cfg, err := worker.LoadConfig(env(map[string]string{"DATABASE_URL": "file:x.db"}))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Concurrency != 4 || cfg.ID == "" {
		t.Fatalf("unexpected defaults: %+v", cfg)
	}
}

func TestLoadConfigRejectsBadConcurrency(t *testing.T) {
	_, err := worker.LoadConfig(env(map[string]string{"DATABASE_URL": "file:x.db", "WORKER_CONCURRENCY": "0"}))
	if err == nil {
		t.Fatal("expected an error for WORKER_CONCURRENCY=0")
	}
}

func TestLoadConfigReadsTheParentPID(t *testing.T) {
	cfg, err := worker.LoadConfig(func(k string) string {
		return map[string]string{"DATABASE_URL": "file:x", "WORKER_PARENT_PID": "42"}[k]
	})
	if err != nil || cfg.ParentPID != 42 {
		t.Fatalf("got %d, %v", cfg.ParentPID, err)
	}
}
