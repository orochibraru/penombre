package encryptfiles_test

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"os"
	"path/filepath"
	"testing"

	"github.com/orochibraru/penombre/internal/envelope"
	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/encryptfiles"
)

func key(b byte) []byte { return bytes.Repeat([]byte{b}, 32) }

func run(t *testing.T, keys envelope.Keyring, spec encryptfiles.Spec) encryptfiles.Result {
	t.Helper()
	envelope.SetDefault(keys)
	t.Cleanup(func() { envelope.SetDefault(envelope.Keyring{}) })
	raw, _ := json.Marshal(spec)
	got, err := encryptfiles.Run(context.Background(), jobs.Job{ID: "j", Type: "encrypt", Spec: raw})
	if err != nil {
		t.Fatal(err)
	}
	return got.(encryptfiles.Result)
}

func write(t *testing.T, path, content string) {
	t.Helper()
	os.MkdirAll(filepath.Dir(path), 0o755)
	if err := os.WriteFile(path, []byte(content), 0o640); err != nil {
		t.Fatal(err)
	}
}

func sealed(t *testing.T, path string) bool {
	t.Helper()
	ok, err := envelope.SniffFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return ok
}

func plaintext(t *testing.T, keys envelope.Keyring, path string) string {
	t.Helper()
	f, _, err := keys.OpenFile(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	b, _ := io.ReadAll(f)
	return string(b)
}

func TestSealsWhatIsPlainAndLeavesTheRest(t *testing.T) {
	root := t.TempDir()
	keys := envelope.Keyring{Current: key(1)}
	write(t, filepath.Join(root, "user-1", "a.txt"), "alpha")
	write(t, filepath.Join(root, "user-1", ".thumbnails", "a.txt_300.webp"), "thumb")
	write(t, filepath.Join(root, "user-1", ".thumbnails", "a.txt_300.webp.11111111-2222-3333-4444-555555555555.tmp"), "stage")
	write(t, filepath.Join(root, "user-1", ".copy-123"), "stage")
	write(t, filepath.Join(root, "user-1", "old.meta.json"), "{}")
	write(t, filepath.Join(root, ".tmp", "zips", "x.zip"), "zip")
	write(t, filepath.Join(root, "mounted", "song.mp3"), "library")

	res := run(t, keys, encryptfiles.Spec{Root: root, Excludes: []string{filepath.Join(root, "mounted")}, Budget: 100})
	if res.Sealed != 2 || res.More || len(res.Failed) != 0 {
		t.Fatalf("got %+v", res)
	}
	if !sealed(t, filepath.Join(root, "user-1", "a.txt")) || !sealed(t, filepath.Join(root, "user-1", ".thumbnails", "a.txt_300.webp")) {
		t.Fatal("a stored file or its thumbnail stayed plaintext")
	}
	for _, left := range []string{
		"user-1/.thumbnails/a.txt_300.webp.11111111-2222-3333-4444-555555555555.tmp",
		"user-1/.copy-123", "user-1/old.meta.json", ".tmp/zips/x.zip", "mounted/song.mp3",
	} {
		if sealed(t, filepath.Join(root, left)) {
			t.Fatalf("%s was sealed", left)
		}
	}
	if got := plaintext(t, keys, filepath.Join(root, "user-1", "a.txt")); got != "alpha" {
		t.Fatalf("content %q", got)
	}
	info, _ := os.Stat(filepath.Join(root, "user-1", "a.txt"))
	if info.Mode().Perm() != 0o640 {
		t.Fatalf("mode %v not kept", info.Mode().Perm())
	}
	entries, _ := os.ReadDir(filepath.Join(root, "user-1"))
	if len(entries) != 4 {
		t.Fatalf("stage files left behind: %v", entries)
	}

	again := run(t, keys, encryptfiles.Spec{Root: root, Budget: 100, Excludes: []string{filepath.Join(root, "mounted")}})
	if again.Sealed != 0 || again.Rewrapped != 0 || again.More {
		t.Fatalf("second pass was not a no-op: %+v", again)
	}
}

func TestBudgetStopsAndResumesPastWhatItDid(t *testing.T) {
	root := t.TempDir()
	for _, name := range []string{"a", "b/x", "b/y", "c"} {
		write(t, filepath.Join(root, name), name)
	}
	keys := envelope.Keyring{Current: key(1)}
	res := run(t, keys, encryptfiles.Spec{Root: root, Budget: 2})
	if res.Sealed != 2 || !res.More || res.Next != filepath.Join(root, "b", "x") {
		t.Fatalf("got %+v", res)
	}
	// A file before the cursor is not looked at again.
	os.WriteFile(filepath.Join(root, "a"), []byte("plain again"), 0o640)
	res = run(t, keys, encryptfiles.Spec{Root: root, Budget: 2, After: res.Next})
	if res.Sealed != 2 || res.More || sealed(t, filepath.Join(root, "a")) {
		t.Fatalf("got %+v", res)
	}
	if !sealed(t, filepath.Join(root, "b", "y")) || !sealed(t, filepath.Join(root, "c")) {
		t.Fatal("the rest was not sealed")
	}
}

func TestByteBudget(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "a"), "12345")
	write(t, filepath.Join(root, "b"), "12345")
	res := run(t, envelope.Keyring{Current: key(1)}, encryptfiles.Spec{Root: root, Budget: 100, BudgetBytes: 5})
	if res.Sealed != 1 || res.Bytes != 5 || !res.More || res.Next != filepath.Join(root, "a") {
		t.Fatalf("got %+v", res)
	}
}

func TestRewrapsRetiredKeys(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "f")
	old := envelope.Keyring{Current: key(1)}
	write(t, path, "secret")
	run(t, old, encryptfiles.Spec{Root: root, Budget: 10})

	rotated := envelope.Keyring{Current: key(2), Previous: [][]byte{key(1)}}
	res := run(t, rotated, encryptfiles.Spec{Root: root, Budget: 10})
	if res.Rewrapped != 1 || res.Sealed != 0 {
		t.Fatalf("got %+v", res)
	}
	if got := plaintext(t, envelope.Keyring{Current: key(2)}, path); got != "secret" {
		t.Fatalf("content %q after rewrap", got)
	}
}

func TestUnknownKeyIsReportedNotTouched(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "f")
	write(t, path, "secret")
	run(t, envelope.Keyring{Current: key(1)}, encryptfiles.Spec{Root: root, Budget: 10})
	before, _ := os.ReadFile(path)

	res := run(t, envelope.Keyring{Current: key(2)}, encryptfiles.Spec{Root: root, Budget: 10})
	after, _ := os.ReadFile(path)
	if len(res.Failed) != 1 || !bytes.Equal(before, after) {
		t.Fatalf("got %+v", res)
	}
}

func TestRefusesWithoutAKey(t *testing.T) {
	raw, _ := json.Marshal(encryptfiles.Spec{Root: t.TempDir(), Budget: 1})
	envelope.SetDefault(envelope.Keyring{})
	if _, err := encryptfiles.Run(context.Background(), jobs.Job{ID: "j", Spec: raw}); err == nil {
		t.Fatal("ran with no key")
	}
}

func TestRewrapOnlyLeavesPlaintextAlone(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "sealed"), "s")
	run(t, envelope.Keyring{Current: key(1)}, encryptfiles.Spec{Root: root, Budget: 10})
	write(t, filepath.Join(root, "library.mp3"), "plain")

	res := run(t, envelope.Keyring{Current: key(2), Previous: [][]byte{key(1)}}, encryptfiles.Spec{Root: root, Budget: 10, RewrapOnly: true})
	if res.Rewrapped != 1 || res.Sealed != 0 || res.More || sealed(t, filepath.Join(root, "library.mp3")) {
		t.Fatalf("got %+v", res)
	}
}
