// Package jobs holds what an executor receives. It lives apart from
// internal/worker because the registry imports every executor package.
package jobs

import (
	"context"
	"encoding/json"
)

type Job struct {
	ID       string
	Type     string
	Attempts int
	Spec     json.RawMessage
}

func (j Job) DecodeSpec(v any) error { return json.Unmarshal(j.Spec, v) }

type Executor func(ctx context.Context, job Job) (any, error)
