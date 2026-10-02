package worker

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/orochibraru/penombre/internal/envelope"
)

type Config struct {
	DatabaseURL  string
	Concurrency  int
	ID           string
	PollInterval time.Duration
	LeaseTimeout time.Duration
	// ShutdownGrace bounds how long Run waits for in-flight jobs after ctx is
	// cancelled before cancelling them. Zero uses the default (60s).
	ShutdownGrace time.Duration
	// Timeouts overrides the per-type execution timeout.
	Timeouts map[string]time.Duration
	// ParentPID is the app that spawned this embedded worker; 0 when external.
	ParentPID int
	Keyring   envelope.Keyring
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
	if raw := getenv("WORKER_PARENT_PID"); raw != "" {
		n, err := strconv.Atoi(raw)
		if err != nil {
			return cfg, fmt.Errorf("WORKER_PARENT_PID must be a pid, got %q", raw)
		}
		cfg.ParentPID = n
	}
	keyring, err := envelope.LoadKeyring(getenv)
	if err != nil {
		return cfg, err
	}
	cfg.Keyring = keyring
	if cfg.ID == "" {
		host, _ := os.Hostname()
		cfg.ID = fmt.Sprintf("%s-%d", host, os.Getpid())
	}
	return cfg, nil
}
