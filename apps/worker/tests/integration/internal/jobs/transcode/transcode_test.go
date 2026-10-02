package transcode_test

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/transcode"
)

func ffmpeg(t *testing.T, args ...string) {
	t.Helper()
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
	if out, err := exec.Command("ffmpeg", append([]string{"-v", "error", "-y"}, args...)...).CombinedOutput(); err != nil {
		t.Fatalf("%v: %s", err, out)
	}
}

func probe(t *testing.T, path, entries string) string {
	t.Helper()
	out, err := exec.Command("ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", entries, "-of", "csv=p=0", path).Output()
	if err != nil {
		t.Fatal(err)
	}
	return strings.TrimSpace(string(out))
}

func run(t *testing.T, spec transcode.Spec) error {
	t.Helper()
	raw, _ := json.Marshal(spec)
	_, err := transcode.Run(context.Background(), jobs.Job{ID: "j", Type: "transcode", Spec: raw})
	return err
}

// An AVI no browser plays comes out as H.264 in an MP4, scaled down.
func TestAviBecomesASmallerMp4(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "in.avi")
	ffmpeg(t, "-f", "lavfi", "-i", "testsrc=duration=1:size=1280x721:rate=10", "-c:v", "mpeg4", src)
	out := filepath.Join(dir, ".thumbnails", "in.avi_480p.mp4")
	if err := run(t, transcode.Spec{Source: src, Output: out, Height: 480}); err != nil {
		t.Fatal(err)
	}
	if got := probe(t, out, "stream=codec_name,width,height"); got != "h264,852,480" {
		t.Fatalf("want h264,852,480, got %s", got)
	}
	left, _ := filepath.Glob(out + ".*.tmp")
	if len(left) != 0 {
		t.Fatalf("stage file left behind: %v", left)
	}
}

func TestASmallSourceIsNotEnlarged(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "in.mp4")
	ffmpeg(t, "-f", "lavfi", "-i", "testsrc=duration=1:size=320x180:rate=10", "-pix_fmt", "yuv420p", src)
	out := filepath.Join(dir, "out.mp4")
	if err := run(t, transcode.Spec{Source: src, Output: out, Height: 720}); err != nil {
		t.Fatal(err)
	}
	if got := probe(t, out, "stream=width,height"); got != "320,180" {
		t.Fatalf("want 320,180, got %s", got)
	}
}

// A failed render must leave nothing the app would serve.
func TestAFailedRenderLeavesNoOutput(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "in.mp4")
	if err := os.WriteFile(src, []byte("not a video"), 0o644); err != nil {
		t.Fatal(err)
	}
	ffmpeg(t, "-version")
	out := filepath.Join(dir, "out.mp4")
	if err := run(t, transcode.Spec{Source: src, Output: out, Height: 480}); err == nil {
		t.Fatal("garbage was transcoded")
	}
	if entries, _ := os.ReadDir(dir); len(entries) != 1 {
		t.Fatalf("want only the source left, got %v", entries)
	}
}
