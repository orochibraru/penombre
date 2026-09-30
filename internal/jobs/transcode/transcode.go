// Package transcode renders a video as an H.264/AAC MP4 no taller than a given
// height: what plays when the original's format or bitrate will not.
package transcode

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Source string `json:"source"`
	Output string `json:"output"`
	Height int    `json:"height"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var spec Spec
	if err := job.DecodeSpec(&spec); err != nil {
		return nil, err
	}
	if spec.Height < 144 || spec.Height > 2160 {
		return nil, fmt.Errorf("unsupported height %d", spec.Height)
	}
	// ponytail: an MP4 with its index up front needs a seekable output, so it
	// is written as plaintext, which must never sit beside sealed files. A
	// sealed source gets no rendition until there is a seekable sealed writer.
	sealed, err := envelope.SniffFile(spec.Source)
	if err != nil {
		return nil, err
	}
	if sealed {
		return nil, errors.New("sealed source: no rendition")
	}
	if err := os.MkdirAll(filepath.Dir(spec.Output), 0o755); err != nil {
		return nil, err
	}
	// Staged and renamed in: the app serves Output the moment it exists.
	stage := fmt.Sprintf("%s.%s.tmp", spec.Output, job.ID)
	defer os.Remove(stage)
	cmd := exec.CommandContext(ctx, "ffmpeg", Args(spec.Source, stage, spec.Height)...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("ffmpeg: %w: %s", err, stderr.String())
	}
	if err := os.Rename(stage, spec.Output); err != nil {
		return nil, err
	}
	return map[string]string{"output": spec.Output}, nil
}

// Args is the ffmpeg command line. The picture is never enlarged, and both
// sides come out even, which x264 requires. The bitrate is capped per height
// so the point of a lower rendition, a slower link, holds for any source.
func Args(source, output string, height int) []string {
	rate := height * 7 / 2 // kbit/s: 1680 at 480p, 2520 at 720p
	return []string{
		"-v", "error", "-y",
		"-i", source,
		"-map", "0:v:0", "-map", "0:a:0?", "-sn", "-dn",
		"-vf", fmt.Sprintf("scale=-2:trunc(min(%d\\,ih)/2)*2", height),
		"-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
		"-maxrate", fmt.Sprintf("%dk", rate), "-bufsize", fmt.Sprintf("%dk", rate*2),
		"-pix_fmt", "yuv420p",
		"-c:a", "aac", "-b:a", "128k", "-ac", "2",
		// The index first, so playback starts on the first bytes.
		"-movflags", "+faststart",
		"-f", "mp4", output,
	}
}
