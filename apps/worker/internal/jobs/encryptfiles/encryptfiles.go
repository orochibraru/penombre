// Package encryptfiles seals the plaintext files already under a storage
// root and rewraps files sealed with a retired key, a budget at a time.
package encryptfiles

import (
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Root        string   `json:"root"`
	Excludes    []string `json:"excludes"`
	Budget      int      `json:"budget"`
	BudgetBytes int64    `json:"budgetBytes"`
	// After resumes the walk past this path, the previous pass's Next, so a
	// pass never re-sniffs what earlier passes already sealed.
	After string `json:"after"`
	// RewrapOnly moves sealed files off retired keys and leaves plaintext
	// alone: a mounted volume's own files are never rewritten.
	RewrapOnly bool `json:"rewrapOnly"`
}

type Failure struct {
	Path  string `json:"path"`
	Error string `json:"error"`
}

type Result struct {
	Sealed    int   `json:"sealed"`
	Rewrapped int   `json:"rewrapped"`
	Bytes     int64 `json:"bytes"`
	// More: the budget ran out or a file changed mid-rewrite; run again from
	// Next ("" restarts the walk).
	More   bool      `json:"more"`
	Next   string    `json:"next"`
	Failed []Failure `json:"failed"`
}

// stage matches another writer's `<name>.<uuid>.tmp` (thumbnail renders).
var stage = regexp.MustCompile(`.\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tmp$`)

// skip leaves out what is not a stored file: other writers' stage files
// (dot-named or `<name>.<uuid>.tmp`) and legacy `.meta.json` sidecars, which
// the boot migration reads as plaintext.
func skip(name string) bool {
	return strings.HasPrefix(name, ".") || strings.HasSuffix(name, ".meta.json") || stage.MatchString(name)
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, err
	}
	keys := envelope.Default()
	if !keys.Enabled() {
		return nil, envelope.ErrNoKey
	}
	res := Result{Failed: []Failure{}}
	last := ""
	err := filepath.WalkDir(s.Root, func(path string, d fs.DirEntry, err error) error {
		if errors.Is(err, fs.ErrNotExist) && path != s.Root {
			return nil
		}
		if err != nil {
			return err
		}
		if ctx.Err() != nil {
			return ctx.Err()
		}
		if s.After != "" && !isAncestor(path, s.After) && walkOrder(path, s.After) <= 0 {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			if d.Name() == ".tmp" || excluded(path, s.Excludes) {
				return filepath.SkipDir
			}
			return nil
		}
		if !d.Type().IsRegular() || skip(d.Name()) {
			return nil
		}
		work, err := pending(keys, path)
		if work == seal && s.RewrapOnly {
			last = path
			return nil
		}
		if err != nil || work == none {
			if err != nil && !errors.Is(err, fs.ErrNotExist) {
				res.Failed = append(res.Failed, Failure{Path: path, Error: err.Error()})
			}
			last = path
			return nil
		}
		if res.Sealed+res.Rewrapped >= s.Budget || (s.BudgetBytes > 0 && res.Bytes >= s.BudgetBytes) {
			res.More, res.Next = true, last
			return fs.SkipAll
		}
		last = path
		size := int64(0)
		if info, err := d.Info(); err == nil {
			size = info.Size()
		}
		switch err := rewrite(keys, path, job.ID, work); {
		case errors.Is(err, errChanged):
			res.More = true
		case err != nil:
			res.Failed = append(res.Failed, Failure{Path: path, Error: err.Error()})
		case work == seal:
			res.Sealed++
			res.Bytes += size
		default:
			res.Rewrapped++
			res.Bytes += size
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

// walkOrder compares two paths in WalkDir's order: component by component,
// a directory before its contents.
func walkOrder(a, b string) int {
	ca := strings.Split(a, string(filepath.Separator))
	cb := strings.Split(b, string(filepath.Separator))
	for i := 0; i < len(ca) && i < len(cb); i++ {
		if c := strings.Compare(ca[i], cb[i]); c != 0 {
			return c
		}
	}
	return len(ca) - len(cb)
}

func isAncestor(dir, path string) bool {
	return strings.HasPrefix(path, dir+string(filepath.Separator))
}

func excluded(path string, excludes []string) bool {
	for _, e := range excludes {
		if path == e || strings.HasPrefix(path, e+string(filepath.Separator)) {
			return true
		}
	}
	return false
}

type task int

const (
	none task = iota
	seal
	rewrap
)

func pending(keys envelope.Keyring, path string) (task, error) {
	f, err := os.Open(path)
	if err != nil {
		return none, err
	}
	defer f.Close()
	h := make([]byte, envelope.HeaderSize)
	n, _ := io.ReadFull(f, h)
	if !envelope.IsSealed(h[:n]) {
		return seal, nil
	}
	_, current, err := keys.OpenHeader(h[:n])
	if err != nil {
		return none, err
	}
	if current {
		return none, nil
	}
	return rewrap, nil
}

var errChanged = errors.New("changed while being sealed")

// rewrite stages the new form beside path, then renames it in only if the
// source is still the file it read. A rewrap copies too: rewriting the
// header in place would lose the file to a torn write.
func rewrite(keys envelope.Keyring, path, jobID string, work task) error {
	src, err := os.Open(path)
	if err != nil {
		return err
	}
	defer src.Close()
	before, err := src.Stat()
	if err != nil {
		return err
	}
	stagePath := filepath.Join(filepath.Dir(path), fmt.Sprintf(".%s.%s.tmp", filepath.Base(path), jobID))
	out, err := os.OpenFile(stagePath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, before.Mode().Perm())
	if err != nil {
		return err
	}
	defer os.Remove(stagePath)
	if err := errors.Join(write(keys, src, out, work), out.Sync(), out.Close()); err != nil {
		return err
	}
	// ponytail: a write landing between this stat and the rename is lost;
	// the window is microseconds and only touches files still plaintext
	// (or on a retired key). A per-file lock shared with the app closes it.
	after, err := os.Stat(path)
	if err != nil {
		return err
	}
	if !os.SameFile(before, after) || before.Size() != after.Size() || !before.ModTime().Equal(after.ModTime()) {
		return errChanged
	}
	return os.Rename(stagePath, path)
}

func write(keys envelope.Keyring, src *os.File, out *os.File, work task) error {
	if work == rewrap {
		h := make([]byte, envelope.HeaderSize)
		if _, err := io.ReadFull(src, h); err != nil {
			return err
		}
		h, err := keys.Rewrap(h)
		if err != nil {
			return err
		}
		if _, err := out.Write(h); err != nil {
			return err
		}
		_, err = io.Copy(out, src)
		return err
	}
	w, err := envelope.NewWriter(out, keys.Current)
	if err != nil {
		return err
	}
	if _, err := io.Copy(w, src); err != nil {
		return err
	}
	return w.Close()
}
