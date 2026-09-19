// Package mediaprobe reads media files' durations with ffprobe.
package mediaprobe

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"os"
	"os/exec"
	"strconv"
	"strings"

	"github.com/orochibraru/penombre/internal/jobs"
)

type Spec struct {
	Paths []string `json:"paths"`
}

// Result maps each probed path to seconds. 0 is definitive: a file with no
// duration (an image) or one ffprobe rejects as not media. Anything else that
// went wrong — the file missing, an I/O error, a truncated upload — leaves the
// path out, which the app treats as "try again later".
type Result struct {
	Durations map[string]float64 `json:"durations"`
}

type ffprobeOutput struct {
	Format struct {
		Duration string `json:"duration"`
	} `json:"format"`
}

func Run(ctx context.Context, job jobs.Job) (any, error) {
	var s Spec
	if err := job.DecodeSpec(&s); err != nil {
		return nil, err
	}
	durations := make(map[string]float64, len(s.Paths))
	for _, path := range s.Paths {
		if err := ctx.Err(); err != nil {
			return nil, err
		}
		if _, err := os.Stat(path); err != nil {
			continue
		}
		d, known, err := probe(ctx, path)
		if err != nil {
			return nil, err
		}
		if known {
			durations[path] = d
		}
	}
	return Result{Durations: durations}, nil
}

// notMedia is ffprobe's verdict on a file it can read but cannot parse.
const notMedia = "Invalid data found when processing input"

// probe errors only when no probe can succeed (ffprobe missing): that fails
// the job, so nothing is recorded as a duration of 0.
func probe(ctx context.Context, path string) (seconds float64, known bool, err error) {
	var stderr bytes.Buffer
	cmd := exec.CommandContext(ctx, "ffprobe",
		"-v", "error", "-show_entries", "format=duration", "-of", "json", path)
	cmd.Stderr = &stderr
	out, err := cmd.Output()
	if errors.Is(err, exec.ErrNotFound) {
		return 0, false, err
	}
	if err != nil {
		return 0, strings.Contains(stderr.String(), notMedia), nil
	}
	var p ffprobeOutput
	if json.Unmarshal(out, &p) != nil {
		return 0, false, nil
	}
	// Absent for a file with no duration (an image): 0 is the answer.
	seconds, _ = strconv.ParseFloat(p.Format.Duration, 64)
	return seconds, true, nil
}
