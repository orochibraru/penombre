// Package thumbnail renders grid thumbnails (webp) and audio peak data (JSON)
// into the storage root's .thumbnails cache.
package thumbnail

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Kind    string `json:"kind"`
	Source  string `json:"source"`
	Output  string `json:"output"`
	Size    int    `json:"size"`
	Buckets int    `json:"buckets"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var spec Spec
	if err := job.DecodeSpec(&spec); err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(spec.Output), 0o755); err != nil {
		return nil, err
	}
	// Staged beside the destination and renamed in: the app serves whatever is
	// at Output the moment it exists, so a partial file must never be there.
	stage := fmt.Sprintf("%s.%s.tmp", spec.Output, job.ID)
	defer os.Remove(stage)

	var err error
	switch spec.Kind {
	case "image":
		err = webp(ctx, spec.Source, stage, spec.Size, false)
	case "video":
		err = webp(ctx, spec.Source, stage, spec.Size, true)
		if err != nil || empty(stage) {
			err = webp(ctx, spec.Source, stage, spec.Size, false)
		}
	case "pdf":
		err = pdf(ctx, spec, stage)
	case "audio":
		err = peaks(ctx, spec, stage)
	default:
		err = fmt.Errorf("unsupported kind %q", spec.Kind)
	}
	if err == nil && empty(stage) {
		err = errors.New("renderer produced no output")
	}
	if err != nil {
		return nil, err
	}
	if err := os.Rename(stage, spec.Output); err != nil {
		return nil, err
	}
	return map[string]string{"output": spec.Output}, nil
}

func empty(path string) bool {
	info, err := os.Stat(path)
	return err != nil || info.Size() == 0
}

// webp fits src inside size×size without enlarging it; seek skips a video's
// usually-black first frame.
func webp(ctx context.Context, src, out string, size int, seek bool) error {
	args := []string{"-v", "error", "-y"}
	if seek {
		args = append(args, "-ss", "1")
	}
	scale := fmt.Sprintf("scale=w=min(%d\\,iw):h=min(%d\\,ih):force_original_aspect_ratio=decrease", size, size)
	args = append(args, "-i", src, "-frames:v", "1", "-vf", scale, "-c:v", "libwebp", "-quality", "80", "-f", "webp", out)
	return command(ctx, "ffmpeg", args...)
}

func pdf(ctx context.Context, spec Spec, out string) error {
	base := out + ".page"
	defer os.Remove(base + ".png")
	if err := command(ctx, "pdftoppm", "-png", "-f", "1", "-l", "1", "-scale-to", fmt.Sprint(spec.Size), "-singlefile", spec.Source, base); err != nil {
		return err
	}
	return webp(ctx, base+".png", out, spec.Size, false)
}

func peaks(ctx context.Context, spec Spec, out string) error {
	cmd := exec.CommandContext(ctx, "ffmpeg", "-v", "error", "-i", spec.Source, "-ac", "1", "-ar", "8000", "-f", "s16le", "-")
	var pcm, stderr bytes.Buffer
	cmd.Stdout, cmd.Stderr = &pcm, &stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	if pcm.Len() < 2 {
		return errors.New("no audio decoded")
	}
	buckets := spec.Buckets
	if buckets <= 0 {
		buckets = 400
	}
	b, err := json.Marshal(BucketPeaks(pcm.Bytes(), buckets))
	if err != nil {
		return err
	}
	return os.WriteFile(out, b, 0o644)
}

func command(ctx context.Context, name string, args ...string) error {
	if out, err := exec.CommandContext(ctx, name, args...).CombinedOutput(); err != nil {
		return fmt.Errorf("%s: %w: %s", name, err, out)
	}
	return nil
}
