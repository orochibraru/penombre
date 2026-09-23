// Package ziparchive builds a zip archive from files already on disk. The
// app resolves entries and streams the finished file; this package only
// does the CPU work of writing it.
package ziparchive

import (
	"archive/zip"
	"compress/flate"
	"context"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"strings"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
)

type Entry struct {
	Source string `json:"source"`
	Name   string `json:"name"`
}

type Spec struct {
	Output  string  `json:"output"`
	Entries []Entry `json:"entries"`
	// Encrypt seals the archive, which may hold sealed sources' plaintext.
	Encrypt bool `json:"encrypt"`
}

type Result struct {
	Output string `json:"output"`
	Bytes  int64  `json:"bytes"`
	// Sources gone from disk; the archive is built without them.
	Skipped []string `json:"skipped"`
}

// Run is the jobs.Executor for the "zip" job type: write every entry into a
// staging file beside Output (deflate level 6 unless already compressed),
// then rename into place.
func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, fmt.Errorf("decode spec: %w", err)
	}

	staging := fmt.Sprintf("%s.%s.tmp", s.Output, job.ID)
	f, err := os.Create(staging)
	if err != nil {
		return nil, fmt.Errorf("create staging file: %w", err)
	}
	defer os.Remove(staging) // no-op once renamed into place

	keys := envelope.Default()
	sealed, err := keys.SealTo(f, s.Encrypt)
	if err != nil {
		f.Close()
		return nil, err
	}
	zw := zip.NewWriter(sealed)
	zw.RegisterCompressor(zip.Deflate, func(w io.Writer) (io.WriteCloser, error) {
		return flate.NewWriter(w, 6)
	})

	used := make(map[string]int)
	skipped := []string{}
	for _, e := range s.Entries {
		if err := ctx.Err(); err != nil {
			zw.Close()
			f.Close()
			return nil, err
		}
		src, _, err := keys.OpenFile(e.Source)
		if errors.Is(err, fs.ErrNotExist) {
			skipped = append(skipped, e.Source)
			continue
		}
		if err == nil {
			err = appendFile(zw, src, UniqueName(used, e.Name))
		}
		if err != nil {
			zw.Close()
			f.Close()
			return nil, fmt.Errorf("append %q: %w", e.Source, err)
		}
	}

	if err := errors.Join(zw.Close(), sealed.Close()); err != nil {
		f.Close()
		return nil, fmt.Errorf("close archive: %w", err)
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, fmt.Errorf("stat staging file: %w", err)
	}
	if err := f.Close(); err != nil {
		return nil, fmt.Errorf("close staging file: %w", err)
	}
	if err := os.Rename(staging, s.Output); err != nil {
		return nil, fmt.Errorf("rename into place: %w", err)
	}

	return Result{Output: s.Output, Bytes: info.Size(), Skipped: skipped}, nil
}

func appendFile(zw *zip.Writer, src io.ReadCloser, name string) error {
	defer src.Close()

	w, err := zw.CreateHeader(&zip.FileHeader{Name: name, Method: Method(name)})
	if err != nil {
		return err
	}
	_, err = io.Copy(w, src)
	return err
}

// compressed formats gain nothing from deflate but its CPU time.
var compressed = map[string]bool{}

func init() {
	for _, ext := range strings.Fields(`
		jpg jpeg png gif webp heic heif avif jxl
		mp4 m4v mov mkv webm avi wmv flv mpg mpeg 3gp ogv
		mp3 m4a aac ogg oga opus flac wma
		zip gz tgz bz2 xz zst 7z rar
		docx xlsx pptx odt ods odp epub jar apk`) {
		compressed["."+ext] = true
	}
}

// Method stores already-compressed formats and deflates the rest.
func Method(name string) uint16 {
	if compressed[strings.ToLower(filepath.Ext(name))] {
		return zip.Store
	}
	return zip.Deflate
}

// UniqueName appends " (2)", " (3)", ... before the extension on a repeated
// name, the way `archiver` (the npm package this replaces) did not — it
// silently let a duplicate overwrite the previous entry.
func UniqueName(used map[string]int, name string) string {
	n := used[name]
	used[name]++
	if n == 0 {
		return name
	}
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	return fmt.Sprintf("%s (%d)%s", base, n+1, ext)
}
