package worker_test

import (
	"bytes"
	"errors"
	"log/slog"
	"strings"
	"testing"

	"github.com/orochibraru/penombre/internal/worker"
)

func lookPath(missing ...string) worker.LookPath {
	miss := map[string]bool{}
	for _, m := range missing {
		miss[m] = true
	}
	return func(bin string) (string, error) {
		if miss[bin] {
			return "", errors.New("not found")
		}
		return "/usr/bin/" + bin, nil
	}
}

func encoders(out string, err error) worker.FFmpegEncoders {
	return func() (string, error) { return out, err }
}

func preflightLog(t *testing.T, lookPath worker.LookPath, enc worker.FFmpegEncoders) string {
	t.Helper()
	var buf bytes.Buffer
	log := slog.New(slog.NewTextHandler(&buf, nil))
	worker.Preflight(log, lookPath, enc)
	return buf.String()
}

func TestPreflightSilentWhenEverythingIsPresent(t *testing.T) {
	out := preflightLog(t, lookPath(), encoders("libx264\nlibwebp\n", nil))
	if out != "" {
		t.Fatalf("expected no warnings, got %q", out)
	}
}

func TestPreflightWarnsOnEachMissingBinary(t *testing.T) {
	out := preflightLog(t, lookPath("ffmpeg", "pdftoppm"), encoders("", nil))
	if !strings.Contains(out, "ffmpeg not found") {
		t.Errorf("missing ffmpeg warning: %q", out)
	}
	if !strings.Contains(out, "pdftoppm not found") {
		t.Errorf("missing pdftoppm warning: %q", out)
	}
	if strings.Contains(out, "ffprobe not found") {
		t.Errorf("ffprobe is present, should not warn: %q", out)
	}
}

func TestPreflightSkipsEncoderCheckWhenFFmpegIsMissing(t *testing.T) {
	calls := 0
	enc := func() (string, error) {
		calls++
		return "", nil
	}
	preflightLog(t, lookPath("ffmpeg"), enc)
	if calls != 0 {
		t.Fatal("encoders() should not run when ffmpeg is missing")
	}
}

func TestPreflightWarnsWhenLibwebpEncoderIsMissing(t *testing.T) {
	out := preflightLog(t, lookPath(), encoders("libx264\n", nil))
	if !strings.Contains(out, "libwebp encoder") {
		t.Fatalf("expected a libwebp warning, got %q", out)
	}
}

func TestPreflightWarnsIfEncodersCannotBeChecked(t *testing.T) {
	out := preflightLog(t, lookPath(), encoders("", errors.New("boom")))
	if !strings.Contains(out, "could not check ffmpeg's encoders") {
		t.Fatalf("expected a check-failure warning, got %q", out)
	}
}
