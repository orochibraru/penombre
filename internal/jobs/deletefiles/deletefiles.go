// Package deletefiles removes bytes for emptying the trash. TypeScript has
// already decided which rows survive; this only removes files and
// directories, continuing past a failure rather than aborting the batch.
package deletefiles

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Files []string `json:"files"`
	Dirs  []string `json:"dirs"`
	// Context is opaque here, echoed into the result so an app that was not
	// the requester can still map these paths back to rows.
	Context json.RawMessage `json:"context,omitempty"`
}

// Result names every path either way: the spec is dropped once the job ends,
// and a reconciler must know whose bytes are gone.
type Result struct {
	Deleted     []string        `json:"deleted"`
	DeletedDirs []string        `json:"deletedDirs"`
	FailedFiles []string        `json:"failedFiles"`
	FailedDirs  []string        `json:"failedDirs"`
	Context     json.RawMessage `json:"context,omitempty"`
}

// Run removes each file — a file already gone is success, mirroring the
// ENOENT rule in CLAUDE.md "Never delete a row whose bytes are still there"
// — then calls os.RemoveAll on each directory. Files go first so a
// directory's RemoveAll only ever meets files that individually failed to
// delete. A directory holding a file that failed to delete is never
// RemoveAll'd: TS keeps that file's row (and its ancestor folders') on a
// failure, and sweeping the directory anyway would delete those surviving
// bytes out from under the kept row. Such a directory is reported in
// FailedDirs instead. Interrupted (shutdown, timeout), everything not yet
// reached is reported failed rather than erroring, so the caller keeps
// exactly the rows whose bytes may still be there.
func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, err
	}
	res := Result{Deleted: []string{}, DeletedDirs: []string{}, FailedFiles: []string{}, FailedDirs: []string{}, Context: s.Context}
	for _, f := range s.Files {
		var err error
		if ctx.Err() != nil {
			// Not reached — but an earlier, crashed attempt may have been.
			// Gone is gone either way; only bytes still there keep a row.
			_, err = os.Lstat(f)
			if err == nil {
				err = ctx.Err()
			}
		} else {
			err = os.Remove(f)
		}
		if err != nil && !errors.Is(err, os.ErrNotExist) {
			res.FailedFiles = append(res.FailedFiles, f)
			continue
		}
		res.Deleted = append(res.Deleted, f)
	}
	for _, d := range s.Dirs {
		if ctx.Err() != nil || holdsAFailedFile(d, res.FailedFiles) {
			res.FailedDirs = append(res.FailedDirs, d)
			continue
		}
		if err := os.RemoveAll(d); err != nil {
			res.FailedDirs = append(res.FailedDirs, d)
			continue
		}
		res.DeletedDirs = append(res.DeletedDirs, d)
	}
	return res, nil
}

func holdsAFailedFile(dir string, failedFiles []string) bool {
	for _, f := range failedFiles {
		if rel, err := filepath.Rel(dir, f); err == nil &&
			rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
			return true
		}
	}
	return false
}
