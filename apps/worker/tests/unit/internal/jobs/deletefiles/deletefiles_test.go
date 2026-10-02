package deletefiles_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/deletefiles"
)

func mustJob(t *testing.T, s deletefiles.Spec) jobs.Job {
	t.Helper()
	b, err := json.Marshal(s)
	if err != nil {
		t.Fatal(err)
	}
	return jobs.Job{ID: "j", Type: "delete", Spec: b}
}

func TestRunRemovesFilesAndDirs(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "a.txt")
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	sub := filepath.Join(dir, "folder")
	if err := os.MkdirAll(filepath.Join(sub, "nested"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(sub, "nested", "b.txt"), []byte("y"), 0o644); err != nil {
		t.Fatal(err)
	}

	got, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Files: []string{file}, Dirs: []string{sub}}))
	if err != nil {
		t.Fatal(err)
	}
	res := got.(deletefiles.Result)
	if len(res.FailedFiles) != 0 || len(res.FailedDirs) != 0 {
		t.Fatalf("expected no failures, got %#v", res)
	}
	if _, err := os.Stat(file); !os.IsNotExist(err) {
		t.Fatal("file should be gone")
	}
	if _, err := os.Stat(sub); !os.IsNotExist(err) {
		t.Fatal("directory should be gone")
	}
}

func TestRunTreatsAMissingFileAsSuccess(t *testing.T) {
	dir := t.TempDir()
	missing := filepath.Join(dir, "gone.txt")

	got, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Files: []string{missing}}))
	if err != nil {
		t.Fatal(err)
	}
	res := got.(deletefiles.Result)
	if len(res.FailedFiles) != 0 {
		t.Fatalf("a missing file must not be reported as failed: %#v", res.FailedFiles)
	}
}

func TestRunTreatsAMissingDirAsSuccess(t *testing.T) {
	dir := t.TempDir()
	missing := filepath.Join(dir, "gone")

	got, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Dirs: []string{missing}}))
	if err != nil {
		t.Fatal(err)
	}
	res := got.(deletefiles.Result)
	if len(res.FailedDirs) != 0 {
		t.Fatalf("a missing directory must not be reported as failed: %#v", res.FailedDirs)
	}
}

func TestRunReportsAFileThatCannotBeRemoved(t *testing.T) {
	dir := t.TempDir()
	// os.Remove refuses a non-empty directory (ENOTEMPTY), which stands in
	// here for a permission failure that stat can't distinguish from ENOENT.
	notEmpty := filepath.Join(dir, "not-empty")
	if err := os.MkdirAll(filepath.Join(notEmpty, "child"), 0o755); err != nil {
		t.Fatal(err)
	}

	got, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Files: []string{notEmpty}}))
	if err != nil {
		t.Fatal(err)
	}
	res := got.(deletefiles.Result)
	if len(res.FailedFiles) != 1 || res.FailedFiles[0] != notEmpty {
		t.Fatalf("expected the entry to be reported as failed, got %#v", res.FailedFiles)
	}
}

func TestRunSkipsADirectoryHoldingAFailedFile(t *testing.T) {
	dir := t.TempDir()
	sub := filepath.Join(dir, "sub")
	// os.Remove refuses a non-empty directory, standing in for a file that
	// fails to delete (e.g. a permission error) while living under `sub`.
	locked := filepath.Join(sub, "locked")
	if err := os.MkdirAll(filepath.Join(locked, "child"), 0o755); err != nil {
		t.Fatal(err)
	}
	kept := filepath.Join(sub, "kept.txt")
	if err := os.WriteFile(kept, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}

	got, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Files: []string{locked}, Dirs: []string{sub}}))
	if err != nil {
		t.Fatal(err)
	}
	res := got.(deletefiles.Result)
	if len(res.FailedFiles) != 1 || res.FailedFiles[0] != locked {
		t.Fatalf("expected the locked entry to be reported as a failed file, got %#v", res.FailedFiles)
	}
	if len(res.FailedDirs) != 1 || res.FailedDirs[0] != sub {
		t.Fatalf("expected sub to be reported as a failed dir, got %#v", res.FailedDirs)
	}
	if _, statErr := os.Stat(sub); statErr != nil {
		t.Fatalf("sub must survive since it still holds a file that failed to delete: %v", statErr)
	}
	if _, statErr := os.Stat(kept); statErr != nil {
		t.Fatalf("a sibling file under sub must not be swept away by a skipped RemoveAll: %v", statErr)
	}
}

// An interrupted delete must still report, so the caller keeps exactly the
// rows whose bytes may still be there.
func TestRunStopsOnCancellationAndReportsTheRest(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "a.txt")
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	out, err := deletefiles.Run(ctx, mustJob(t, deletefiles.Spec{Files: []string{file}, Dirs: []string{dir}}))
	if err != nil {
		t.Fatal(err)
	}
	if res := out.(deletefiles.Result); len(res.FailedFiles) != 1 || len(res.FailedDirs) != 1 {
		t.Fatalf("everything unreached must be reported failed, got %#v", res)
	}
	if _, statErr := os.Stat(file); statErr != nil {
		t.Fatal("no delete should have run after cancellation")
	}
}

// Stopped before reaching a file an earlier, crashed attempt already
// removed: its bytes are gone, so it is reported deleted and its row can go.
func TestAnUnreachedFileAlreadyGoneCountsAsDeleted(t *testing.T) {
	dir := t.TempDir()
	gone := filepath.Join(dir, "gone.txt")
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	out, err := deletefiles.Run(ctx, mustJob(t, deletefiles.Spec{Files: []string{gone}, Context: []byte(`{"root":"/r"}`)}))
	if err != nil {
		t.Fatal(err)
	}
	res := out.(deletefiles.Result)
	if len(res.Deleted) != 1 || len(res.FailedFiles) != 0 || string(res.Context) != `{"root":"/r"}` {
		t.Fatalf("got %#v", res)
	}
}

func TestResultNamesWhatWasDeleted(t *testing.T) {
	dir := t.TempDir()
	file := filepath.Join(dir, "sub", "a.txt")
	if err := os.MkdirAll(filepath.Dir(file), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(file, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	out, err := deletefiles.Run(context.Background(), mustJob(t, deletefiles.Spec{Files: []string{file}, Dirs: []string{filepath.Dir(file)}}))
	if err != nil {
		t.Fatal(err)
	}
	res := out.(deletefiles.Result)
	if len(res.Deleted) != 1 || res.Deleted[0] != file || len(res.DeletedDirs) != 1 {
		t.Fatalf("got %#v", res)
	}
}
