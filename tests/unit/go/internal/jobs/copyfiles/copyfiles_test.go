package copyfiles_test

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/copyfiles"
)

func mustJob(t *testing.T, spec any) jobs.Job {
	t.Helper()
	b, err := json.Marshal(spec)
	if err != nil {
		t.Fatal(err)
	}
	return jobs.Job{ID: "j", Type: "copy", Spec: b}
}

func TestRunCopiesAndCreatesParents(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "a.txt")
	if err := os.WriteFile(src, []byte("hello"), 0o644); err != nil {
		t.Fatal(err)
	}
	dest := filepath.Join(dir, "nested", "sub", "b.txt")

	job := mustJob(t, copyfiles.Spec{Pairs: []copyfiles.Pair{{Source: src, Dest: dest}}})
	got, err := copyfiles.Run(context.Background(), job)
	if err != nil {
		t.Fatal(err)
	}
	res, ok := got.(copyfiles.Result)
	if !ok || len(res.Failed) != 0 {
		t.Fatalf("expected no failures, got %#v", got)
	}
	content, err := os.ReadFile(dest)
	if err != nil {
		t.Fatal(err)
	}
	if string(content) != "hello" {
		t.Fatalf("dest content = %q", content)
	}
	// The source must survive a copy.
	if _, err := os.Stat(src); err != nil {
		t.Fatalf("source was removed: %v", err)
	}
}

func TestRunContinuesPastAFailure(t *testing.T) {
	dir := t.TempDir()
	ok := filepath.Join(dir, "ok.txt")
	if err := os.WriteFile(ok, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	missing := filepath.Join(dir, "missing.txt")

	job := mustJob(t, copyfiles.Spec{Pairs: []copyfiles.Pair{
		{Source: missing, Dest: filepath.Join(dir, "out1.txt")},
		{Source: ok, Dest: filepath.Join(dir, "out2.txt")},
	}})
	got, err := copyfiles.Run(context.Background(), job)
	if err != nil {
		t.Fatal(err)
	}
	res := got.(copyfiles.Result)
	if len(res.Failed) != 1 || res.Failed[0].Index != 0 {
		t.Fatalf("expected pair 0 to fail, got %#v", res.Failed)
	}
	if _, err := os.Stat(filepath.Join(dir, "out2.txt")); err != nil {
		t.Fatalf("the second pair should have copied: %v", err)
	}
}

// An interrupted copy must still report: the caller inserts rows for what
// landed, so erroring out would orphan every pair already copied.
func TestRunStopsOnCancellationAndReportsTheRest(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "a.txt")
	if err := os.WriteFile(src, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	job := mustJob(t, copyfiles.Spec{Pairs: []copyfiles.Pair{{Source: src, Dest: filepath.Join(dir, "out.txt")}}})
	out, err := copyfiles.Run(ctx, job)
	if err != nil {
		t.Fatal(err)
	}
	if res := out.(copyfiles.Result); len(res.Failed) != 1 || res.Failed[0].Index != 0 {
		t.Fatalf("the unreached pair must be reported failed, got %#v", res.Failed)
	}
	if _, statErr := os.Stat(filepath.Join(dir, "out.txt")); statErr == nil {
		t.Fatal("no copy should have run after cancellation")
	}
}

func TestRunLeavesNoStagedFileOnFailure(t *testing.T) {
	dir := t.TempDir()
	missing := filepath.Join(dir, "missing.txt")
	dest := filepath.Join(dir, "out.txt")

	job := mustJob(t, copyfiles.Spec{Pairs: []copyfiles.Pair{{Source: missing, Dest: dest}}})
	if _, err := copyfiles.Run(context.Background(), job); err != nil {
		t.Fatal(err)
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Fatalf("expected no leftover files, got %v", entries)
	}
}

// The spec is dropped when the job ends; a process that was not the
// requester reconciles from the result alone, so it names every destination
// and hands the app's context back.
func TestResultNamesEveryDestinationAndEchoesTheContext(t *testing.T) {
	dir := t.TempDir()
	src := filepath.Join(dir, "a.txt")
	if err := os.WriteFile(src, []byte("x"), 0o644); err != nil {
		t.Fatal(err)
	}
	ok, bad := filepath.Join(dir, "ok.txt"), filepath.Join(dir, "bad.txt")
	out, err := copyfiles.Run(context.Background(), mustJob(t, map[string]any{
		"pairs":   []copyfiles.Pair{{Source: src, Dest: ok}, {Source: filepath.Join(dir, "missing"), Dest: bad}},
		"context": map[string]string{"root": "/r"},
	}))
	if err != nil {
		t.Fatal(err)
	}
	res := out.(copyfiles.Result)
	if len(res.Copied) != 1 || res.Copied[0] != ok || len(res.Failed) != 1 || res.Failed[0].Dest != bad {
		t.Fatalf("got %#v", res)
	}
	if string(res.Context) != `{"root":"/r"}` {
		t.Fatalf("context = %s", res.Context)
	}
}

func TestSealingMatrix(t *testing.T) {
	keys := envelope.Keyring{Current: bytes.Repeat([]byte{1}, 32)}
	envelope.SetDefault(keys)
	t.Cleanup(func() { envelope.SetDefault(envelope.Keyring{}) })
	dir := t.TempDir()
	plain := filepath.Join(dir, "plain")
	os.WriteFile(plain, []byte("content"), 0o644)
	var sealedBytes bytes.Buffer
	w, _ := envelope.NewWriter(&sealedBytes, keys.Current)
	w.Write([]byte("content"))
	w.Close()
	sealed := filepath.Join(dir, "sealed")
	os.WriteFile(sealed, sealedBytes.Bytes(), 0o644)

	cases := []struct {
		src         string
		encrypt     bool
		wantSealed  bool
		wantRawCopy bool
	}{
		{plain, false, false, true},
		{plain, true, true, false},
		{sealed, true, true, true},
		{sealed, false, false, false},
	}
	for i, c := range cases {
		dest := filepath.Join(dir, "out", fmt.Sprint(i))
		res, err := copyfiles.Run(context.Background(), mustJob(t, copyfiles.Spec{Pairs: []copyfiles.Pair{{Source: c.src, Dest: dest, Encrypt: c.encrypt}}}))
		if err != nil || len(res.(copyfiles.Result).Failed) != 0 {
			t.Fatalf("case %d: %v %+v", i, err, res)
		}
		isSealed, _ := envelope.SniffFile(dest)
		if isSealed != c.wantSealed {
			t.Fatalf("case %d: sealed = %v", i, isSealed)
		}
		srcBytes, _ := os.ReadFile(c.src)
		destBytes, _ := os.ReadFile(dest)
		if bytes.Equal(srcBytes, destBytes) != c.wantRawCopy {
			t.Fatalf("case %d: raw copy = %v", i, !c.wantRawCopy)
		}
		f, _, _ := keys.OpenFile(dest)
		got, _ := io.ReadAll(f)
		f.Close()
		if string(got) != "content" {
			t.Fatalf("case %d: content %q", i, got)
		}
	}
}
