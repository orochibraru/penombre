// Package copyfiles copies bytes for a cross-location transfer. TypeScript
// has already computed every destination path and row; this only moves
// bytes on disk, continuing past a failed pair rather than aborting the
// whole batch.
package copyfiles

import (
	"context"
	"io"
	"os"
	"path/filepath"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Pair struct {
	Source string `json:"source"`
	Dest   string `json:"dest"`
}

type Spec struct {
	Pairs []Pair `json:"pairs"`
}

type Failure struct {
	Index int    `json:"index"`
	Error string `json:"error"`
}

type Result struct {
	Failed []Failure `json:"failed"`
}

// Run copies each pair's bytes: mkdir the destination's parents, stage into a
// temp file beside it, then rename into place so a reader never observes a
// partially written file. Interrupted (shutdown, timeout), it reports every
// pair it did not reach as failed rather than erroring: the caller then
// inserts rows for exactly the pairs that landed.
func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, err
	}
	res := Result{Failed: []Failure{}}
	for i, p := range s.Pairs {
		if err := ctx.Err(); err != nil {
			res.Failed = append(res.Failed, Failure{Index: i, Error: "interrupted: " + err.Error()})
			continue
		}
		if err := copyOne(p.Source, p.Dest); err != nil {
			res.Failed = append(res.Failed, Failure{Index: i, Error: err.Error()})
		}
	}
	return res, nil
}

func copyOne(src, dest string) error {
	dir := filepath.Dir(dest)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()

	staged, err := os.CreateTemp(dir, ".copy-*")
	if err != nil {
		return err
	}
	stagedPath := staged.Name()
	if _, err := io.Copy(staged, in); err != nil {
		staged.Close()
		os.Remove(stagedPath)
		return err
	}
	if err := staged.Close(); err != nil {
		os.Remove(stagedPath)
		return err
	}
	if err := os.Rename(stagedPath, dest); err != nil {
		os.Remove(stagedPath)
		return err
	}
	return nil
}
