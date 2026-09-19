// Package deletefiles removes bytes for emptying the trash. TypeScript has
// already decided which rows survive; this only removes files and
// directories, continuing past a failure rather than aborting the batch.
package deletefiles

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Files []string `json:"files"`
	Dirs  []string `json:"dirs"`
}

type Result struct {
	FailedFiles []string `json:"failedFiles"`
	FailedDirs  []string `json:"failedDirs"`
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
	res := Result{FailedFiles: []string{}, FailedDirs: []string{}}
	for _, f := range s.Files {
		if ctx.Err() != nil {
			res.FailedFiles = append(res.FailedFiles, f)
			continue
		}
		if err := os.Remove(f); err != nil && !errors.Is(err, os.ErrNotExist) {
			res.FailedFiles = append(res.FailedFiles, f)
		}
	}
	for _, d := range s.Dirs {
		if ctx.Err() != nil {
			res.FailedDirs = append(res.FailedDirs, d)
			continue
		}
		if holdsAFailedFile(d, res.FailedFiles) {
			res.FailedDirs = append(res.FailedDirs, d)
			continue
		}
		if err := os.RemoveAll(d); err != nil {
			res.FailedDirs = append(res.FailedDirs, d)
		}
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
