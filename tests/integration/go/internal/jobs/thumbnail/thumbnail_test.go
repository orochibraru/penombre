package thumbnail_test

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/thumbnail"
)

func needFFmpeg(t *testing.T) {
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
}

func ffmpeg(t *testing.T, args ...string) {
	t.Helper()
	if out, err := exec.Command("ffmpeg", append([]string{"-v", "error", "-y"}, args...)...).CombinedOutput(); err != nil {
		t.Fatalf("%v: %s", err, out)
	}
}

func run(t *testing.T, spec thumbnail.Spec) (string, error) {
	t.Helper()
	raw, _ := json.Marshal(spec)
	_, err := thumbnail.Run(context.Background(), jobs.Job{ID: "j", Type: "thumbnail", Spec: raw})
	return spec.Output, err
}

func TestImageBecomesWebpInsideTheBox(t *testing.T) {
	needFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "in.png")
	ffmpeg(t, "-f", "lavfi", "-i", "color=red:size=800x400", "-frames:v", "1", src)
	out, err := run(t, thumbnail.Spec{Kind: "image", Source: src, Output: filepath.Join(dir, ".thumbnails", "in.png_300.webp"), Size: 300})
	if err != nil {
		t.Fatal(err)
	}
	b, _ := os.ReadFile(out)
	if len(b) < 12 || string(b[8:12]) != "WEBP" {
		t.Fatal("output is not a webp")
	}
	probe, _ := exec.Command("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out).Output()
	if strings.TrimSpace(string(probe)) != "300,150" {
		t.Fatalf("want 300x150, got %s", probe)
	}
}

func TestSmallImageIsNotEnlarged(t *testing.T) {
	needFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "in.png")
	ffmpeg(t, "-f", "lavfi", "-i", "color=blue:size=40x20", "-frames:v", "1", src)
	out, err := run(t, thumbnail.Spec{Kind: "image", Source: src, Output: filepath.Join(dir, "o.webp"), Size: 300})
	if err != nil {
		t.Fatal(err)
	}
	probe, _ := exec.Command("ffprobe", "-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", out).Output()
	if strings.TrimSpace(string(probe)) != "40,20" {
		t.Fatalf("want 40x20, got %s", probe)
	}
}

func TestShortVideoFallsBackToFirstFrame(t *testing.T) {
	needFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "in.mp4")
	ffmpeg(t, "-f", "lavfi", "-i", "testsrc=duration=0.5:size=320x240:rate=10", src)
	if _, err := run(t, thumbnail.Spec{Kind: "video", Source: src, Output: filepath.Join(dir, "o.webp"), Size: 100}); err != nil {
		t.Fatal(err)
	}
}

func TestAudioWritesPeaksJSON(t *testing.T) {
	needFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "in.wav")
	ffmpeg(t, "-f", "lavfi", "-i", "sine=frequency=440:duration=1", src)
	out, err := run(t, thumbnail.Spec{Kind: "audio", Source: src, Output: filepath.Join(dir, "in.wav_peaks.json"), Buckets: 400})
	if err != nil {
		t.Fatal(err)
	}
	var peaks []float64
	b, _ := os.ReadFile(out)
	if err := json.Unmarshal(b, &peaks); err != nil || len(peaks) != 400 {
		t.Fatalf("want 400 peaks, got %d (%v)", len(peaks), err)
	}
}

func TestFailureLeavesNoFile(t *testing.T) {
	needFFmpeg(t)
	dir := t.TempDir()
	src := filepath.Join(dir, "broken.png")
	_ = os.WriteFile(src, []byte("not an image"), 0o644)
	out := filepath.Join(dir, "o.webp")
	if _, err := run(t, thumbnail.Spec{Kind: "image", Source: src, Output: out, Size: 300}); err == nil {
		t.Fatal("expected an error")
	}
	entries, _ := os.ReadDir(dir)
	if len(entries) != 1 {
		t.Fatalf("staging files left behind: %v", entries)
	}
}

// minimalPDF is one blank 200x100pt page, xref offsets computed so pdftoppm
// reads it without repair.
func minimalPDF() []byte {
	objects := []string{
		"<< /Type /Catalog /Pages 2 0 R >>",
		"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
		"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 100] >>",
	}
	var b strings.Builder
	b.WriteString("%PDF-1.4\n")
	offsets := make([]int, len(objects))
	for i, o := range objects {
		offsets[i] = b.Len()
		fmt.Fprintf(&b, "%d 0 obj\n%s\nendobj\n", i+1, o)
	}
	xref := b.Len()
	fmt.Fprintf(&b, "xref\n0 %d\n0000000000 65535 f \n", len(objects)+1)
	for _, off := range offsets {
		fmt.Fprintf(&b, "%010d 00000 n \n", off)
	}
	fmt.Fprintf(&b, "trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n", len(objects)+1, xref)
	return []byte(b.String())
}

// Covers pdftoppm's -singlefile output naming, which the app never sees.
func TestPDFFirstPageBecomesWebp(t *testing.T) {
	needFFmpeg(t)
	if _, err := exec.LookPath("pdftoppm"); err != nil {
		t.Skip("pdftoppm not installed")
	}
	dir := t.TempDir()
	src := filepath.Join(dir, "doc.pdf")
	if err := os.WriteFile(src, minimalPDF(), 0o644); err != nil {
		t.Fatal(err)
	}
	out, err := run(t, thumbnail.Spec{Kind: "pdf", Source: src, Output: filepath.Join(dir, "doc.pdf_300.webp"), Size: 300})
	if err != nil {
		t.Fatal(err)
	}
	b, _ := os.ReadFile(out)
	if len(b) < 12 || string(b[8:12]) != "WEBP" {
		t.Fatal("output is not a webp")
	}
	if left, _ := filepath.Glob(filepath.Join(dir, "*.png")); len(left) != 0 {
		t.Fatalf("intermediate page left behind: %v", left)
	}
}
