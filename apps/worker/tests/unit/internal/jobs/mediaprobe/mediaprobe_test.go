package mediaprobe_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/mediaprobe"
)

// Probing a real file execs ffprobe/ffmpeg and lives in tests/integration/go
// instead.

func TestCancelledContextFails(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	spec, _ := json.Marshal(map[string][]string{"paths": {"/x"}})
	if _, err := mediaprobe.Run(ctx, jobs.Job{Spec: spec}); err == nil {
		t.Fatal("want the context error")
	}
}

// fakeFFprobe puts an ffprobe on PATH that fails with the given stderr.
func fakeFFprobe(t *testing.T, stderr string) {
	t.Helper()
	dir := t.TempDir()
	script := "#!/bin/sh\necho '" + stderr + "' >&2\nexit 1\n"
	if err := os.WriteFile(filepath.Join(dir, "ffprobe"), []byte(script), 0o755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir)
}

func probe(t *testing.T) (map[string]float64, error) {
	t.Helper()
	file := filepath.Join(t.TempDir(), "a.mp3")
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	spec, _ := json.Marshal(map[string][]string{"paths": {file}})
	out, err := mediaprobe.Run(context.Background(), jobs.Job{Spec: spec})
	if err != nil {
		return nil, err
	}
	return out.(mediaprobe.Result).Durations, nil
}

// A hiccup stored as 0 would never be retried: 0 means "has no duration".
func TestATransientFailureIsLeftUnknown(t *testing.T) {
	fakeFFprobe(t, "a.mp3: Input/output error")
	got, err := probe(t)
	if err != nil || len(got) != 0 {
		t.Fatalf("want no entry, got %v %v", got, err)
	}
}

func TestNotMediaIsADefinitiveZero(t *testing.T) {
	fakeFFprobe(t, "a.mp3: Invalid data found when processing input")
	got, err := probe(t)
	if err != nil || len(got) != 1 {
		t.Fatalf("want one 0 entry, got %v %v", got, err)
	}
	for _, d := range got {
		if d != 0 {
			t.Fatalf("got %v", d)
		}
	}
}

func TestAMissingFFprobeFailsTheJob(t *testing.T) {
	t.Setenv("PATH", t.TempDir())
	if _, err := probe(t); err == nil {
		t.Fatal("without ffprobe nothing may be recorded")
	}
}

// A caller joining this job with another batch must know what was tried.
func TestResultListsWhatWasProbed(t *testing.T) {
	fakeFFprobe(t, "a.mp3: Input/output error")
	dir := t.TempDir()
	here := filepath.Join(dir, "a.mp3")
	if err := os.WriteFile(here, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	gone := filepath.Join(dir, "gone.mp3")
	spec, _ := json.Marshal(map[string][]string{"paths": {here, gone}})
	out, err := mediaprobe.Run(context.Background(), jobs.Job{Spec: spec})
	if err != nil {
		t.Fatal(err)
	}
	if p := out.(mediaprobe.Result).Probed; len(p) != 2 || p[0] != here || p[1] != gone {
		t.Fatalf("probed = %v", p)
	}
}

// A path whose bytes are gone must still count as tried, so it backs off
// like an unreadable file instead of being re-sampled every sweep.
func TestAMissingPathIsProbed(t *testing.T) {
	missing := filepath.Join(t.TempDir(), "gone.mp3")
	spec, _ := json.Marshal(map[string][]string{"paths": {missing}})
	out, err := mediaprobe.Run(context.Background(), jobs.Job{Spec: spec})
	if err != nil {
		t.Fatal(err)
	}
	result := out.(mediaprobe.Result)
	if len(result.Durations) != 0 {
		t.Fatalf("want no duration, got %v", result.Durations)
	}
	if p := result.Probed; len(p) != 1 || p[0] != missing {
		t.Fatalf("probed = %v", p)
	}
}
