package ziparchive_test

import (
	"archive/zip"
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/ziparchive"
)

func writeTemp(t *testing.T, dir, name, content string) string {
	t.Helper()
	p := filepath.Join(dir, name)
	if err := os.WriteFile(p, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	return p
}

func mustJob(t *testing.T, s ziparchive.Spec) jobs.Job {
	t.Helper()
	b, err := json.Marshal(s)
	if err != nil {
		t.Fatal(err)
	}
	return jobs.Job{ID: "test", Type: "zip", Spec: b}
}

func readZip(t *testing.T, path string) map[string]string {
	t.Helper()
	r, err := zip.OpenReader(path)
	if err != nil {
		t.Fatalf("open zip: %v", err)
	}
	defer r.Close()
	out := make(map[string]string)
	for _, f := range r.File {
		if want := ziparchive.Method(f.Name); f.Method != want {
			t.Errorf("entry %q: method = %d, want %d", f.Name, f.Method, want)
		}
		rc, err := f.Open()
		if err != nil {
			t.Fatal(err)
		}
		data, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			t.Fatal(err)
		}
		out[f.Name] = string(data)
	}
	return out
}

func TestRun_RoundTrip(t *testing.T) {
	dir := t.TempDir()
	a := writeTemp(t, dir, "a.txt", "hello")
	b := writeTemp(t, dir, "b.txt", "world")
	output := filepath.Join(dir, "out.zip")

	job := mustJob(t, ziparchive.Spec{
		Output: output,
		Entries: []ziparchive.Entry{
			{Source: a, Name: "docs/a.txt"},
			{Source: b, Name: "docs/b.jpg"},
		},
	})

	res, err := ziparchive.Run(context.Background(), job)
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	r, ok := res.(ziparchive.Result)
	if !ok {
		t.Fatalf("result type = %T, want ziparchive.Result", res)
	}
	if r.Output != output {
		t.Errorf("Output = %q, want %q", r.Output, output)
	}
	if r.Bytes <= 0 {
		t.Errorf("Bytes = %d, want > 0", r.Bytes)
	}
	if _, err := os.Stat(output + ".tmp"); !os.IsNotExist(err) {
		t.Errorf("staging file left behind: %v", err)
	}

	got := readZip(t, output)
	want := map[string]string{"docs/a.txt": "hello", "docs/b.jpg": "world"}
	if len(got) != len(want) {
		t.Fatalf("got %d entries, want %d: %v", len(got), len(want), got)
	}
	for name, content := range want {
		if got[name] != content {
			t.Errorf("entry %q = %q, want %q", name, got[name], content)
		}
	}
}

func TestRun_DuplicateNamesGetSuffixed(t *testing.T) {
	dir := t.TempDir()
	a := writeTemp(t, dir, "a.txt", "first")
	b := writeTemp(t, dir, "b.txt", "second")
	c := writeTemp(t, dir, "c.txt", "third")
	output := filepath.Join(dir, "out.zip")

	job := mustJob(t, ziparchive.Spec{
		Output: output,
		Entries: []ziparchive.Entry{
			{Source: a, Name: "file.txt"},
			{Source: b, Name: "file.txt"},
			{Source: c, Name: "file.txt"},
		},
	})

	if _, err := ziparchive.Run(context.Background(), job); err != nil {
		t.Fatalf("Run: %v", err)
	}

	got := readZip(t, output)
	want := map[string]string{
		"file.txt":     "first",
		"file (2).txt": "second",
		"file (3).txt": "third",
	}
	for name, content := range want {
		if got[name] != content {
			t.Errorf("entry %q = %q, want %q (got %v)", name, got[name], content, got)
		}
	}
}

// A volume file deleted outside Penombre keeps its row until the next scan;
// it must not make every download of its folder fail.
func TestRun_MissingSourceIsSkipped(t *testing.T) {
	dir := t.TempDir()
	a := writeTemp(t, dir, "a.txt", "hello")
	missing := filepath.Join(dir, "does-not-exist.txt")
	output := filepath.Join(dir, "out.zip")

	out, err := ziparchive.Run(context.Background(), mustJob(t, ziparchive.Spec{
		Output:  output,
		Entries: []ziparchive.Entry{{Source: missing, Name: "gone.txt"}, {Source: a, Name: "a.txt"}},
	}))
	if err != nil {
		t.Fatal(err)
	}
	if skipped := out.(ziparchive.Result).Skipped; len(skipped) != 1 || skipped[0] != missing {
		t.Fatalf("skipped = %v", skipped)
	}
	if got := readZip(t, output); len(got) != 1 || got["a.txt"] != "hello" {
		t.Fatalf("got %v", got)
	}
}

func TestRun_UnreadableSourceFails(t *testing.T) {
	dir := t.TempDir()
	output := filepath.Join(dir, "out.zip")

	job := mustJob(t, ziparchive.Spec{Output: output, Entries: []ziparchive.Entry{{Source: dir, Name: "a.txt"}}})
	if _, err := ziparchive.Run(context.Background(), job); err == nil {
		t.Fatal("Run: want an error for a source that cannot be read")
	}
	if _, err := os.Stat(output); !os.IsNotExist(err) {
		t.Errorf("output should not exist after a failed run")
	}
	if left, _ := filepath.Glob(output + ".*tmp"); len(left) != 0 {
		t.Errorf("staging file left behind: %v", left)
	}
}

// Two workers on one job after a lost lease must not share a staging file.
func TestRun_StagingIsPerJob(t *testing.T) {
	dir := t.TempDir()
	a := writeTemp(t, dir, "a.txt", "hello")
	output := filepath.Join(dir, "out.zip")
	other := output + ".tmp"
	writeTemp(t, dir, filepath.Base(other), "another writer")

	if _, err := ziparchive.Run(context.Background(), mustJob(t, ziparchive.Spec{Output: output, Entries: []ziparchive.Entry{{Source: a, Name: "a.txt"}}})); err != nil {
		t.Fatal(err)
	}
	if b, _ := os.ReadFile(other); string(b) != "another writer" {
		t.Fatal("a fixed staging name let one run clobber another's")
	}
}

func TestRun_CancelledContext(t *testing.T) {
	dir := t.TempDir()
	a := writeTemp(t, dir, "a.txt", "hello")
	output := filepath.Join(dir, "out.zip")

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	job := mustJob(t, ziparchive.Spec{
		Output:  output,
		Entries: []ziparchive.Entry{{Source: a, Name: "a.txt"}},
	})

	if _, err := ziparchive.Run(ctx, job); err == nil {
		t.Fatal("Run: want error on a cancelled context, got nil")
	}
	if _, err := os.Stat(output); !os.IsNotExist(err) {
		t.Errorf("output should not exist after cancellation")
	}
	if left, _ := filepath.Glob(output + ".*tmp"); len(left) != 0 {
		t.Errorf("staging file left behind after cancellation: %v", left)
	}
}

func TestUniqueName(t *testing.T) {
	used := map[string]int{}
	cases := []struct{ in, want string }{
		{"a.txt", "a.txt"},
		{"a.txt", "a (2).txt"},
		{"a.txt", "a (3).txt"},
		{"noext", "noext"},
		{"noext", "noext (2)"},
	}
	for i, c := range cases {
		got := ziparchive.UniqueName(used, c.in)
		if got != c.want {
			t.Errorf("call #%d UniqueName(%q) = %q, want %q", i, c.in, got, c.want)
		}
	}
}

func TestSealedSourcesAndSealedArchive(t *testing.T) {
	keys := envelope.Keyring{Current: bytes.Repeat([]byte{3}, 32)}
	envelope.SetDefault(keys)
	t.Cleanup(func() { envelope.SetDefault(envelope.Keyring{}) })
	dir := t.TempDir()
	var sealed bytes.Buffer
	w, _ := envelope.NewWriter(&sealed, keys.Current)
	w.Write([]byte("secret"))
	w.Close()
	src := writeTemp(t, dir, "s", sealed.String())
	plain := writeTemp(t, dir, "p", "plain")
	out := filepath.Join(dir, "out.zip")

	if _, err := ziparchive.Run(context.Background(), mustJob(t, ziparchive.Spec{
		Output:  out,
		Entries: []ziparchive.Entry{{Source: src, Name: "s.txt"}, {Source: plain, Name: "p.txt"}},
		Encrypt: true,
	})); err != nil {
		t.Fatal(err)
	}
	if ok, _ := envelope.SniffFile(out); !ok {
		t.Fatal("archive is not sealed")
	}
	f, size, err := keys.OpenFile(out)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	r, err := zip.NewReader(f.(io.ReaderAt), size)
	if err != nil {
		t.Fatal(err)
	}
	for _, entry := range r.File {
		rc, _ := entry.Open()
		b, _ := io.ReadAll(rc)
		rc.Close()
		if want := map[string]string{"s.txt": "secret", "p.txt": "plain"}[entry.Name]; string(b) != want {
			t.Fatalf("%s = %q", entry.Name, b)
		}
	}
}

func TestMethod_StoresCompressedFormats(t *testing.T) {
	for name, want := range map[string]uint16{
		"a/photo.JPG": zip.Store,
		"clip.mp4":    zip.Store,
		"song.flac":   zip.Store,
		"bundle.zip":  zip.Store,
		"notes.txt":   zip.Deflate,
		"take.wav":    zip.Deflate,
		"noext":       zip.Deflate,
	} {
		if got := ziparchive.Method(name); got != want {
			t.Errorf("Method(%q) = %d, want %d", name, got, want)
		}
	}
}
