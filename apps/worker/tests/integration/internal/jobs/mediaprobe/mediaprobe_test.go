package mediaprobe_test

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/mediaprobe"
)

func requireFFmpeg(t *testing.T) {
	t.Helper()
	if _, err := exec.LookPath("ffmpeg"); err != nil {
		t.Skip("ffmpeg not installed")
	}
	if _, err := exec.LookPath("ffprobe"); err != nil {
		t.Skip("ffprobe not installed")
	}
}

func oneSecondWav(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "tone.wav")
	cmd := exec.Command("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=8000:cl=mono",
		"-t", "1", path)
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("ffmpeg: %v\n%s", err, out)
	}
	return path
}

func run(t *testing.T, paths ...string) map[string]float64 {
	t.Helper()
	spec, err := json.Marshal(map[string][]string{"paths": paths})
	if err != nil {
		t.Fatal(err)
	}
	out, err := mediaprobe.Run(context.Background(), jobs.Job{Spec: spec})
	if err != nil {
		t.Fatal(err)
	}
	return out.(mediaprobe.Result).Durations
}

func TestProbesEveryPathInOneJob(t *testing.T) {
	requireFFmpeg(t)
	wav := oneSecondWav(t)
	text := filepath.Join(t.TempDir(), "not-media.txt")
	if err := os.WriteFile(text, []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}
	missing := filepath.Join(t.TempDir(), "does-not-exist.wav")

	got := run(t, wav, text, missing)

	if d := got[wav]; d < 0.9 || d > 1.1 {
		t.Fatalf("duration = %v, want ~1.0", d)
	}
	if d, ok := got[text]; !ok || d != 0 {
		t.Fatalf("an unreadable file is probed as 0, got %v %v", d, ok)
	}
	if _, ok := got[missing]; ok {
		t.Fatal("a missing file must be absent, so the app retries it")
	}
}

func TestSealedFileIsProbedThroughLoopbackAndKeyedByItsPath(t *testing.T) {
	requireFFmpeg(t)
	keys := envelope.Keyring{Current: bytes.Repeat([]byte{4}, 32)}
	envelope.SetDefault(keys)
	t.Cleanup(func() { envelope.SetDefault(envelope.Keyring{}) })
	wav := oneSecondWav(t)
	plain, _ := os.ReadFile(wav)
	var sealed bytes.Buffer
	w, _ := envelope.NewWriter(&sealed, keys.Current)
	w.Write(plain)
	w.Close()
	os.WriteFile(wav, sealed.Bytes(), 0o644)

	if d := run(t, wav)[wav]; d < 0.9 || d > 1.1 {
		t.Fatalf("sealed wav: want ~1s, got %v", d)
	}
	envelope.SetDefault(envelope.Keyring{})
	if d, known := run(t, wav)[wav]; known {
		t.Fatalf("without its key a sealed file must stay unknown, got %v", d)
	}
}
