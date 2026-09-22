package envelope_test

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/orochibraru/penombre/internal/envelope"
)

type vectorCase struct {
	Plain        int    `json:"plain"`
	SealedSize   int    `json:"sealedSize"`
	SealedHex    string `json:"sealedHex,omitempty"`
	SealedSha256 string `json:"sealedSha256"`
}

type vectors struct {
	Kek    string       `json:"kek"`
	Dek    string       `json:"dek"`
	Nonce  string       `json:"nonce"`
	KeyID  string       `json:"keyId"`
	Plains string       `json:"plaintext"`
	Cases  []vectorCase `json:"cases"`
}

func fixturePath() string {
	_, file, _, _ := runtime.Caller(0)
	return filepath.Join(filepath.Dir(file), "../../../../fixtures/envelope-v1.json")
}

func pattern(n int) []byte {
	b := make([]byte, n)
	for i := range b {
		b[i] = byte(i % 251)
	}
	return b
}

func unhex(t *testing.T, s string) []byte {
	t.Helper()
	b, err := hex.DecodeString(s)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func sealWith(t *testing.T, kek, dek, nonce, plain []byte) []byte {
	t.Helper()
	var out bytes.Buffer
	w, err := envelope.NewWriterWith(&out, kek, dek, nonce)
	if err != nil {
		t.Fatal(err)
	}
	// Odd write sizes, so chunking never depends on how bytes arrive.
	for rest := plain; len(rest) > 0; {
		n := min(len(rest), 7000)
		if _, err := w.Write(rest[:n]); err != nil {
			t.Fatal(err)
		}
		rest = rest[n:]
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}

func TestSharedVectors(t *testing.T) {
	kek := make([]byte, 32)
	dek := make([]byte, 32)
	nonce := make([]byte, 12)
	for i := range kek {
		kek[i], dek[i] = byte(i), byte(0x20+i)
	}
	for i := range nonce {
		nonce[i] = byte(0x40 + i)
	}
	if os.Getenv("PENOMBRE_WRITE_VECTORS") == "1" {
		v := vectors{Kek: hex.EncodeToString(kek), Dek: hex.EncodeToString(dek), Nonce: hex.EncodeToString(nonce),
			KeyID: hex.EncodeToString(envelope.KeyID(kek)), Plains: "byte i = i % 251"}
		for _, n := range []int{0, 1, 65536, 65537} {
			sealed := sealWith(t, kek, dek, nonce, pattern(n))
			sum := sha256.Sum256(sealed)
			c := vectorCase{Plain: n, SealedSize: len(sealed), SealedSha256: hex.EncodeToString(sum[:])}
			if n < 64 {
				c.SealedHex = hex.EncodeToString(sealed)
			}
			v.Cases = append(v.Cases, c)
		}
		b, _ := json.MarshalIndent(v, "", "\t")
		if err := os.WriteFile(fixturePath(), append(b, '\n'), 0o644); err != nil {
			t.Fatal(err)
		}
	}

	raw, err := os.ReadFile(fixturePath())
	if err != nil {
		t.Fatal(err)
	}
	var v vectors
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatal(err)
	}
	if got := hex.EncodeToString(envelope.KeyID(unhex(t, v.Kek))); got != v.KeyID {
		t.Fatalf("key id %s, want %s", got, v.KeyID)
	}
	ring := envelope.Keyring{Current: unhex(t, v.Kek)}
	for _, c := range v.Cases {
		sealed := sealWith(t, unhex(t, v.Kek), unhex(t, v.Dek), unhex(t, v.Nonce), pattern(c.Plain))
		sum := sha256.Sum256(sealed)
		if hex.EncodeToString(sum[:]) != c.SealedSha256 || len(sealed) != c.SealedSize {
			t.Fatalf("plain %d: sealed bytes differ from the vector", c.Plain)
		}
		if c.SealedHex != "" && hex.EncodeToString(sealed) != c.SealedHex {
			t.Fatalf("plain %d: hex differs", c.Plain)
		}
		if envelope.SealedSize(int64(c.Plain)) != int64(len(sealed)) {
			t.Fatalf("SealedSize(%d) wrong", c.Plain)
		}
		r, err := ring.Open(bytes.NewReader(sealed), int64(len(sealed)))
		if err != nil {
			t.Fatal(err)
		}
		got, _ := io.ReadAll(io.NewSectionReader(r, 0, r.Size()))
		if !bytes.Equal(got, pattern(c.Plain)) {
			t.Fatalf("plain %d: round trip differs", c.Plain)
		}
	}
}

func seal(t *testing.T, kek, plain []byte) []byte {
	t.Helper()
	var out bytes.Buffer
	w, err := envelope.NewWriter(&out, kek)
	if err != nil {
		t.Fatal(err)
	}
	w.Write(plain)
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return out.Bytes()
}

func key(b byte) []byte { return bytes.Repeat([]byte{b}, 32) }

func TestPlainSizeInvertsSealedSize(t *testing.T) {
	for _, n := range []int64{0, 1, 65535, 65536, 65537, 131072, 131073, 10 << 20} {
		got, err := envelope.PlainSize(envelope.SealedSize(n))
		if err != nil || got != n {
			t.Fatalf("PlainSize(SealedSize(%d)) = %d, %v", n, got, err)
		}
	}
	if _, err := envelope.PlainSize(envelope.HeaderSize + 15); err == nil {
		t.Fatal("a chunk shorter than its tag must be refused")
	}
}

func TestEveryRangeBoundary(t *testing.T) {
	plain := pattern(3*envelope.ChunkSize + 5)
	sealed := seal(t, key(1), plain)
	r, err := envelope.Keyring{Current: key(1)}.Open(bytes.NewReader(sealed), int64(len(sealed)))
	if err != nil {
		t.Fatal(err)
	}
	cs := envelope.ChunkSize
	edges := []int{0, 1, cs - 1, cs, cs + 1, 2*cs - 1, 2 * cs, 3*cs - 1, 3 * cs, len(plain) - 1}
	for _, start := range edges {
		for _, end := range edges {
			if end < start {
				continue
			}
			got := make([]byte, end-start+1)
			if _, err := r.ReadAt(got, int64(start)); err != nil && !errors.Is(err, io.EOF) {
				t.Fatal(err)
			}
			if !bytes.Equal(got, plain[start:end+1]) {
				t.Fatalf("range %d-%d differs", start, end)
			}
		}
	}
}

func TestTamperingIsRefused(t *testing.T) {
	ring := envelope.Keyring{Current: key(1)}
	sealed := seal(t, key(1), pattern(2*envelope.ChunkSize+10))
	open := func(b []byte) error {
		r, err := ring.Open(bytes.NewReader(b), int64(len(b)))
		if err != nil {
			return err
		}
		_, err = io.ReadAll(io.NewSectionReader(r, 0, r.Size()))
		return err
	}
	if err := open(sealed); err != nil {
		t.Fatal(err)
	}
	// Cut at a chunk boundary: every remaining chunk is intact, only the
	// last-chunk flag can tell.
	cut := sealed[:envelope.HeaderSize+2*(envelope.ChunkSize+envelope.TagSize)]
	if err := open(cut); err == nil {
		t.Fatal("truncation at a chunk boundary was accepted")
	}
	if err := open(sealed[:len(sealed)-1]); err == nil {
		t.Fatal("truncation mid-chunk was accepted")
	}
	for _, at := range []int{3, 10, 20, 40, envelope.HeaderSize + 5, len(sealed) - 1} {
		flipped := bytes.Clone(sealed)
		flipped[at] ^= 1
		if err := open(flipped); err == nil {
			t.Fatalf("flipped byte %d was accepted", at)
		}
	}
}

func TestWrongKeyIsNamed(t *testing.T) {
	sealed := seal(t, key(1), []byte("x"))
	_, err := envelope.Keyring{Current: key(2)}.Open(bytes.NewReader(sealed), int64(len(sealed)))
	var missing envelope.KeyMissingError
	if !errors.As(err, &missing) || missing.ID != hex.EncodeToString(envelope.KeyID(key(1))) {
		t.Fatalf("want KeyMissingError naming the key, got %v", err)
	}
}

func TestRewrapKeepsContent(t *testing.T) {
	sealed := seal(t, key(1), []byte("hello"))
	ring := envelope.Keyring{Current: key(2), Previous: [][]byte{key(1)}}
	if _, current, err := ring.OpenHeader(sealed); err != nil || current {
		t.Fatalf("old key should open as not current: %v", err)
	}
	h, err := ring.Rewrap(sealed[:envelope.HeaderSize])
	if err != nil {
		t.Fatal(err)
	}
	moved := append(h, sealed[envelope.HeaderSize:]...)
	r, err := envelope.Keyring{Current: key(2)}.Open(bytes.NewReader(moved), int64(len(moved)))
	if err != nil {
		t.Fatal(err)
	}
	got, _ := io.ReadAll(io.NewSectionReader(r, 0, r.Size()))
	if string(got) != "hello" {
		t.Fatalf("got %q", got)
	}
}

func TestLoadKeyring(t *testing.T) {
	env := map[string]string{
		"ENCRYPTION_KEY":          "AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE=",
		"ENCRYPTION_KEY_PREVIOUS": " AgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI= ,",
	}
	k, err := envelope.LoadKeyring(func(name string) string { return env[name] })
	if err != nil || !bytes.Equal(k.Current, key(1)) || len(k.Previous) != 1 || !bytes.Equal(k.Previous[0], key(2)) {
		t.Fatalf("got %v, %v", k, err)
	}
	file := filepath.Join(t.TempDir(), "key")
	os.WriteFile(file, []byte(env["ENCRYPTION_KEY"]+"\n"), 0o600)
	env["ENCRYPTION_KEY_FILE"] = file
	if _, err := envelope.LoadKeyring(func(name string) string { return env[name] }); err == nil {
		t.Fatal("both the key and the file were accepted")
	}
	delete(env, "ENCRYPTION_KEY")
	if k, err := envelope.LoadKeyring(func(name string) string { return env[name] }); err != nil || !bytes.Equal(k.Current, key(1)) {
		t.Fatalf("file key: %v", err)
	}
	env["ENCRYPTION_KEY_PREVIOUS"] = "c2hvcnQ="
	if _, err := envelope.LoadKeyring(func(name string) string { return env[name] }); err == nil {
		t.Fatal("a short key was accepted")
	}
}

func TestOpenFilePassesPlainThrough(t *testing.T) {
	dir := t.TempDir()
	plain := filepath.Join(dir, "p")
	sealed := filepath.Join(dir, "s")
	os.WriteFile(plain, []byte("plain"), 0o644)
	os.WriteFile(sealed, seal(t, key(1), []byte("secret")), 0o644)
	ring := envelope.Keyring{Current: key(1)}
	for path, want := range map[string]string{plain: "plain", sealed: "secret"} {
		f, size, err := ring.OpenFile(path)
		if err != nil {
			t.Fatal(err)
		}
		got, _ := io.ReadAll(f)
		f.Close()
		if string(got) != want || size != int64(len(want)) {
			t.Fatalf("%s: got %q (%d)", path, got, size)
		}
	}
}

func TestServeAnswersRangesOnlyOnItsToken(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "s")
	plain := pattern(envelope.ChunkSize + 100)
	os.WriteFile(path, seal(t, key(1), plain), 0o644)
	url, stop, err := envelope.Input(context.Background(), envelope.Keyring{Current: key(1)}, path)
	if err != nil {
		t.Fatal(err)
	}
	defer stop()
	req, _ := http.NewRequest("GET", url, nil)
	req.Header.Set("Range", "bytes=65530-65545")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	got, _ := io.ReadAll(resp.Body)
	resp.Body.Close()
	if resp.StatusCode != http.StatusPartialContent || !bytes.Equal(got, plain[65530:65546]) {
		t.Fatalf("status %d, body differs", resp.StatusCode)
	}
	other, err := http.Get(url[:strings.LastIndex(url, "/")] + "/guess")
	if err != nil {
		t.Fatal(err)
	}
	other.Body.Close()
	if other.StatusCode != http.StatusNotFound {
		t.Fatalf("a wrong token got %d", other.StatusCode)
	}
	if in, _, _ := envelope.Input(context.Background(), envelope.Keyring{}, filepath.Join(dir, "missing")); in == url {
		t.Fatal("unexpected")
	}
}
