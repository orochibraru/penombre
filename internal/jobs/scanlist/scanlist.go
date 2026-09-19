// Package scanlist walks a storage root and lists the scannable entries on
// disk, mirroring isScannable in services/storage/scan.ts exactly: any path
// segment starting with "." is skipped, and so is a "*.meta.json" sidecar.
package scanlist

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Root string `json:"root"`
}

type Entry struct {
	Key  string `json:"key"`
	Size int64  `json:"size"`
}

type Result struct {
	Entries []Entry `json:"entries"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, err
	}

	entries := []Entry{}
	err := filepath.WalkDir(s.Root, func(path string, d fs.DirEntry, err error) error {
		// Gone mid-walk (a sync client at work) is skipped; anything else,
		// EACCES above all, fails the pass rather than dropping rows.
		if errors.Is(err, fs.ErrNotExist) && path != s.Root {
			return nil
		}
		if err != nil {
			return err
		}
		if path == s.Root {
			return nil
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if d.IsDir() {
			if strings.HasPrefix(d.Name(), ".") {
				return filepath.SkipDir
			}
			return nil
		}
		if strings.HasPrefix(d.Name(), ".") || strings.HasSuffix(d.Name(), ".meta.json") {
			return nil
		}
		info, err := d.Info()
		if err == nil && d.Type()&fs.ModeSymlink != 0 {
			info, err = os.Stat(path)
			if err == nil && info.IsDir() {
				return nil
			}
		}
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(s.Root, path)
		if err != nil {
			return err
		}
		entries = append(entries, Entry{Key: filepath.ToSlash(rel), Size: info.Size()})
		return nil
	})
	if err != nil {
		return nil, err
	}

	sort.Slice(entries, func(i, j int) bool { return entries[i].Key < entries[j].Key })
	return Result{Entries: entries}, nil
}
