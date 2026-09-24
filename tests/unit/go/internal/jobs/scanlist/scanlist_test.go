package scanlist_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/scanlist"
)

func run(t *testing.T, root string) scanlist.Result {
	t.Helper()
	spec, err := json.Marshal(map[string]string{"root": root})
	if err != nil {
		t.Fatal(err)
	}
	out, err := scanlist.Run(context.Background(), jobs.Job{Spec: spec})
	if err != nil {
		t.Fatal(err)
	}
	return out.(scanlist.Result)
}

func write(t *testing.T, path string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
}

func TestListsOrdinaryFilesAtAnyDepth(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "notes.md"), "x")
	write(t, filepath.Join(root, "Music/Album/track1.mp3"), "12345")

	out := run(t, root)

	keys := make([]string, len(out.Entries))
	for i, e := range out.Entries {
		keys[i] = e.Key
	}
	if len(keys) != 2 || keys[0] != "Music/Album/track1.mp3" || keys[1] != "notes.md" {
		t.Fatalf("got %v", keys)
	}
	for _, e := range out.Entries {
		if e.Key == "notes.md" && e.Size != 1 {
			t.Fatalf("notes.md size = %d, want 1", e.Size)
		}
		if e.Key == "Music/Album/track1.mp3" && e.Size != 5 {
			t.Fatalf("track size = %d, want 5", e.Size)
		}
	}
}

func TestSkipsHiddenEntriesAtAnyDepth(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, ".DS_Store"), "x")
	write(t, filepath.Join(root, ".thumbnails/abc.webp"), "x")
	write(t, filepath.Join(root, "Music/.hidden/track.mp3"), "x")
	write(t, filepath.Join(root, "kept.txt"), "x")

	out := run(t, root)

	if len(out.Entries) != 1 || out.Entries[0].Key != "kept.txt" {
		t.Fatalf("got %+v", out.Entries)
	}
}

func TestSkipsLegacyMetadataSidecars(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "file.txt.meta.json"), "x")
	write(t, filepath.Join(root, "file.txt"), "x")

	out := run(t, root)

	if len(out.Entries) != 1 || out.Entries[0].Key != "file.txt" {
		t.Fatalf("got %+v", out.Entries)
	}
}

func TestEmptyRootListsNothing(t *testing.T) {
	out := run(t, t.TempDir())
	if len(out.Entries) != 0 {
		t.Fatalf("got %+v", out.Entries)
	}
}

func TestKeysUseForwardSlashes(t *testing.T) {
	root := t.TempDir()
	write(t, filepath.Join(root, "a", "b", "c.mp3"), "x")

	out := run(t, root)

	if len(out.Entries) != 1 || out.Entries[0].Key != "a/b/c.mp3" {
		t.Fatalf("got %+v", out.Entries)
	}
}

// A media manager's library is often symlinks; the link's own few bytes as
// the stored size truncated every stream served from it.
func TestSymlinksReportTheirTarget(t *testing.T) {
	root := t.TempDir()
	outside := t.TempDir()
	write(t, filepath.Join(outside, "track.mp3"), "0123456789")
	if err := os.MkdirAll(filepath.Join(outside, "dir"), 0o755); err != nil {
		t.Fatal(err)
	}
	for name, target := range map[string]string{
		"linked.mp3": filepath.Join(outside, "track.mp3"),
		"dirlink":    filepath.Join(outside, "dir"),
		"broken.mp3": filepath.Join(outside, "gone.mp3"),
	} {
		if err := os.Symlink(target, filepath.Join(root, name)); err != nil {
			t.Fatal(err)
		}
	}

	out := run(t, root)

	if len(out.Entries) != 1 || out.Entries[0].Key != "linked.mp3" || out.Entries[0].Size != 10 {
		t.Fatalf("got %+v", out.Entries)
	}
}

func TestReportsModificationTime(t *testing.T) {
	root := t.TempDir()
	path := filepath.Join(root, "take.mp3")
	write(t, path, "x")
	at := time.Date(2026, 2, 24, 19, 35, 0, 0, time.UTC)
	if err := os.Chtimes(path, at, at); err != nil {
		t.Fatal(err)
	}

	out := run(t, root)

	if len(out.Entries) != 1 || out.Entries[0].MTime != at.UnixMilli() {
		t.Fatalf("got %+v, want mtime %d", out.Entries, at.UnixMilli())
	}
}
