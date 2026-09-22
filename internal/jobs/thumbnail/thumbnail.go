// Package thumbnail renders grid thumbnails (webp) and audio peak data (JSON)
// into the storage root's .thumbnails cache.
package thumbnail

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Kind    string `json:"kind"`
	Source  string `json:"source"`
	Output  string `json:"output"`
	Size    int    `json:"size"`
	Buckets int    `json:"buckets"`
	// Encrypt seals the output: the cache sits beside sealed originals.
	Encrypt bool `json:"encrypt"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var spec Spec
	if err := job.DecodeSpec(&spec); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(spec.Output), 0o755); err != nil {
		return nil, err
	}
	keys := envelope.Default()

	// Rendered to memory, never to a plaintext temp file beside sealed data.
	var out []byte
	var err error
	switch spec.Kind {
	case "image":
		out, err = webpFrom(ctx, keys, spec.Source, spec.Size, false)
	case "video":
		out, err = webpFrom(ctx, keys, spec.Source, spec.Size, true)
		if err != nil || len(out) == 0 {
			out, err = webpFrom(ctx, keys, spec.Source, spec.Size, false)
		}
	case "pdf":
		out, err = pdf(ctx, keys, spec)
	case "audio":
		out, err = peaks(ctx, keys, spec)
	default:
		err = fmt.Errorf("unsupported kind %q", spec.Kind)
	}
	if err == nil && len(out) == 0 {
		err = errors.New("renderer produced no output")
	}
	if err != nil {
		return nil, err
	}
	// Staged beside the destination and renamed in: the app serves whatever is
	// at Output the moment it exists, so a partial file must never be there.
	stage := fmt.Sprintf("%s.%s.tmp", spec.Output, job.ID)
	defer os.Remove(stage)
	if err := writeStage(stage, out, keys, spec.Encrypt); err != nil {
		return nil, err
	}
	if err := os.Rename(stage, spec.Output); err != nil {
		return nil, err
	}
	return map[string]string{"output": spec.Output}, nil
}

func writeStage(stage string, data []byte, keys envelope.Keyring, seal bool) error {
	f, err := os.Create(stage)
	if err != nil {
		return err
	}
	w, err := keys.SealTo(f, seal)
	if err == nil {
		_, err = w.Write(data)
	}
	if err == nil {
		err = w.Close()
	}
	return errors.Join(err, f.Close())
}

// webpFrom opens src (a loopback URL when it is sealed) and renders it.
func webpFrom(ctx context.Context, keys envelope.Keyring, src string, size int, seek bool) ([]byte, error) {
	input, stop, err := envelope.Input(ctx, keys, src)
	if err != nil {
		return nil, err
	}
	defer stop()
	return webp(ctx, input, nil, size, seek)
}

// webp fits the input inside size×size without enlarging it; seek skips a
// video's usually-black first frame.
func webp(ctx context.Context, input string, stdin io.Reader, size int, seek bool) ([]byte, error) {
	args := []string{"-v", "error", "-y"}
	if seek {
		args = append(args, "-ss", "1")
	}
	scale := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", size, size)
	args = append(args, "-i", input, "-frames:v", "1", "-vf", scale, "-c:v", "libwebp", "-quality", "80", "-f", "webp", "pipe:1")
	return output(ctx, stdin, "ffmpeg", args...)
}

// pdf passes a plain source by path, so poppler can seek; a sealed one goes on
// stdin, which pdftoppm buffers whole since it cannot take a URL.
func pdf(ctx context.Context, keys envelope.Keyring, spec Spec) ([]byte, error) {
	sealed, err := envelope.SniffFile(spec.Source)
	if err != nil {
		return nil, err
	}
	input := spec.Source
	var stdin io.Reader
	if sealed {
		src, _, err := keys.OpenFile(spec.Source)
		if err != nil {
			return nil, err
		}
		defer src.Close()
		input, stdin = "-", src
	}
	png, err := output(ctx, stdin, "pdftoppm", "-png", "-f", "1", "-l", "1", "-scale-to", fmt.Sprint(spec.Size), "-singlefile", input)
	if err != nil {
		return nil, err
	}
	return webp(ctx, "pipe:0", bytes.NewReader(png), spec.Size, false)
}

func peaks(ctx context.Context, keys envelope.Keyring, spec Spec) ([]byte, error) {
	input, stop, err := envelope.Input(ctx, keys, spec.Source)
	if err != nil {
		return nil, err
	}
	defer stop()
	pcm, err := output(ctx, nil, "ffmpeg", "-v", "error", "-i", input, "-ac", "1", "-ar", "8000", "-f", "s16le", "-")
	if err != nil {
		return nil, err
	}
	if len(pcm) < 2 {
		return nil, errors.New("no audio decoded")
	}
	buckets := spec.Buckets
	if buckets <= 0 {
		buckets = 400
	}
	return json.Marshal(BucketPeaks(pcm, buckets))
}

func output(ctx context.Context, stdin io.Reader, name string, args ...string) ([]byte, error) {
	cmd := exec.CommandContext(ctx, name, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdin, cmd.Stdout, cmd.Stderr = stdin, &stdout, &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("%s: %w: %s", name, err, stderr.String())
	}
	return stdout.Bytes(), nil
}
