package worker

import "github.com/orochibraru/penombre/internal/jobs"

// Registry maps a job type to its executor. Wired in cmd/worker.
type Registry map[string]jobs.Executor
