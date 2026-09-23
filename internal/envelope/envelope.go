// Package envelope reads and writes Penombre's sealed file format (v1): a
// 76-byte header carrying the file's own key wrapped by the instance key,
// then AES-256-GCM chunks of 64 KiB. Mirrors src/lib/server/crypto/envelope.ts.
package envelope

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"os"
	"sync"
)

const (
	HeaderSize  = 76
	ChunkSize   = 64 << 10
	TagSize     = 16
	KeySize     = 32
	sealedChunk = ChunkSize + TagSize
	magicSize   = 8
	idSize      = 8
	nonceSize   = 12
)

var magic = []byte("PNMBENC\x01")

var ErrCorrupt = errors.New("sealed file is corrupt or truncated")

// KeyMissingError names a key id no loaded key matches.
type KeyMissingError struct{ ID string }

func (e KeyMissingError) Error() string {
	return fmt.Sprintf("sealed with key %s, not loaded (set ENCRYPTION_KEY on the worker)", e.ID)
}

// Keyring is the instance key plus retired ones kept to read older files.
type Keyring struct {
	Current  []byte
	Previous [][]byte
}

// Enabled reports whether new bytes are sealed.
func (k Keyring) Enabled() bool { return len(k.Current) == KeySize }

func KeyID(kek []byte) []byte {
	mac := hmac.New(sha256.New, kek)
	mac.Write([]byte("penombre/key-id/v1"))
	return mac.Sum(nil)[:idSize]
}

// find returns the key matching id, and whether it is the current one.
func (k Keyring) find(id []byte) ([]byte, bool) {
	if k.Current != nil && subtle.ConstantTimeCompare(KeyID(k.Current), id) == 1 {
		return k.Current, true
	}
	for _, key := range k.Previous {
		if subtle.ConstantTimeCompare(KeyID(key), id) == 1 {
			return key, false
		}
	}
	return nil, false
}

// Has reports whether a key with this hex id is loaded.
func (k Keyring) Has(id string) bool {
	raw, err := hex.DecodeString(id)
	if err != nil {
		return false
	}
	key, _ := k.find(raw)
	return key != nil
}

var (
	defaultMu   sync.RWMutex
	defaultRing Keyring
)

// SetDefault installs the worker's keyring, once at boot.
func SetDefault(k Keyring) {
	defaultMu.Lock()
	defer defaultMu.Unlock()
	defaultRing = k
}

func Default() Keyring {
	defaultMu.RLock()
	defer defaultMu.RUnlock()
	return defaultRing
}

func IsSealed(prefix []byte) bool {
	return len(prefix) >= magicSize && bytes.Equal(prefix[:magicSize], magic)
}

// SniffFile reports whether the file at path starts with the envelope magic.
func SniffFile(path string) (bool, error) {
	f, err := os.Open(path)
	if err != nil {
		return false, err
	}
	defer f.Close()
	buf := make([]byte, magicSize)
	n, err := io.ReadFull(f, buf)
	if errors.Is(err, io.ErrUnexpectedEOF) || errors.Is(err, io.EOF) {
		return false, nil
	}
	if err != nil {
		return false, err
	}
	return IsSealed(buf[:n]), nil
}

func SealedSize(plain int64) int64 {
	chunks := max(1, (plain+ChunkSize-1)/ChunkSize)
	return HeaderSize + plain + TagSize*chunks
}

func PlainSize(sealed int64) (int64, error) {
	n := sealed - HeaderSize
	if n < TagSize {
		return 0, ErrCorrupt
	}
	chunks := (n + sealedChunk - 1) / sealedChunk
	if n-(chunks-1)*sealedChunk < TagSize {
		return 0, ErrCorrupt
	}
	return n - TagSize*chunks, nil
}

func gcm(key []byte) (cipher.AEAD, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	return cipher.NewGCM(block)
}

// SealHeader wraps dek under kek with the given 12-byte nonce.
func SealHeader(kek, dek, nonce []byte) ([]byte, error) {
	if len(kek) != KeySize || len(dek) != KeySize || len(nonce) != nonceSize {
		return nil, errors.New("envelope: bad key or nonce length")
	}
	aead, err := gcm(kek)
	if err != nil {
		return nil, err
	}
	h := make([]byte, 0, HeaderSize)
	h = append(h, magic...)
	h = append(h, KeyID(kek)...)
	h = append(h, nonce...)
	return aead.Seal(h, nonce, dek, h[:magicSize+idSize]), nil
}

// OpenHeader unwraps the file key; current is false for a retired key.
func (k Keyring) OpenHeader(h []byte) (dek []byte, current bool, err error) {
	if len(h) < HeaderSize || !IsSealed(h) {
		return nil, false, ErrCorrupt
	}
	id := h[magicSize : magicSize+idSize]
	kek, current := k.find(id)
	if kek == nil {
		return nil, false, KeyMissingError{ID: hex.EncodeToString(id)}
	}
	aead, err := gcm(kek)
	if err != nil {
		return nil, false, err
	}
	nonce := h[16:28]
	dek, err = aead.Open(nil, nonce, h[28:HeaderSize], h[:16])
	if err != nil {
		return nil, false, ErrCorrupt
	}
	return dek, current, nil
}

// Rewrap re-seals a header's file key under the current key, fresh nonce.
func (k Keyring) Rewrap(h []byte) ([]byte, error) {
	if !k.Enabled() {
		return nil, errors.New("envelope: no current key to rewrap with")
	}
	dek, _, err := k.OpenHeader(h)
	if err != nil {
		return nil, err
	}
	nonce := make([]byte, nonceSize)
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return SealHeader(k.Current, dek, nonce)
}

func chunkNonce(i int64, last bool) []byte {
	n := make([]byte, nonceSize)
	binary.BigEndian.PutUint64(n[3:11], uint64(i))
	if last {
		n[11] = 1
	}
	return n
}

// Reader decrypts a sealed file with random access. Safe for concurrent use.
type Reader struct {
	src    io.ReaderAt
	aead   cipher.AEAD
	size   int64
	chunks int64

	mu     sync.Mutex
	cached int64
	plain  []byte
}

// Open validates the header of a sealed file of sealedSize bytes.
func (k Keyring) Open(src io.ReaderAt, sealedSize int64) (*Reader, error) {
	h := make([]byte, HeaderSize)
	if _, err := src.ReadAt(h, 0); err != nil {
		return nil, ErrCorrupt
	}
	dek, _, err := k.OpenHeader(h)
	if err != nil {
		return nil, err
	}
	size, err := PlainSize(sealedSize)
	if err != nil {
		return nil, err
	}
	aead, err := gcm(dek)
	if err != nil {
		return nil, err
	}
	r := &Reader{src: src, aead: aead, size: size, chunks: max(1, (size+ChunkSize-1)/ChunkSize), cached: -1}
	// The last chunk's flag is what catches truncation, so check it up front:
	// a range read that never reaches the end must still refuse a cut file.
	if err := r.chunk(r.chunks - 1); err != nil {
		return nil, err
	}
	return r, nil
}

func (r *Reader) Size() int64 { return r.size }

// chunk decrypts chunk i into the cache. Caller holds mu.
func (r *Reader) chunk(i int64) error {
	if r.cached == i {
		return nil
	}
	length := int64(sealedChunk)
	if i == r.chunks-1 {
		length = r.size - i*ChunkSize + TagSize
	}
	buf := make([]byte, length)
	if _, err := r.src.ReadAt(buf, HeaderSize+i*sealedChunk); err != nil && !errors.Is(err, io.EOF) {
		return err
	}
	plain, err := r.aead.Open(buf[:0], chunkNonce(i, i == r.chunks-1), buf, nil)
	if err != nil {
		r.cached = -1
		return ErrCorrupt
	}
	r.cached, r.plain = i, plain
	return nil
}

func (r *Reader) ReadAt(p []byte, off int64) (int, error) {
	if off >= r.size {
		return 0, io.EOF
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	n := 0
	for n < len(p) && off < r.size {
		i := off / ChunkSize
		if err := r.chunk(i); err != nil {
			return n, err
		}
		c := copy(p[n:], r.plain[off-i*ChunkSize:])
		n += c
		off += int64(c)
	}
	if n < len(p) {
		return n, io.EOF
	}
	return n, nil
}

// OpenFile opens path as plaintext: sealed files through k, others as is.
func (k Keyring) OpenFile(path string) (io.ReadSeekCloser, int64, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, 0, err
	}
	info, err := f.Stat()
	if err != nil {
		f.Close()
		return nil, 0, err
	}
	prefix := make([]byte, magicSize)
	if n, _ := f.ReadAt(prefix, 0); !IsSealed(prefix[:n]) {
		return f, info.Size(), nil
	}
	r, err := k.Open(f, info.Size())
	if err != nil {
		f.Close()
		return nil, 0, err
	}
	return sectionCloser{io.NewSectionReader(r, 0, r.Size()), f}, r.Size(), nil
}

type sectionCloser struct {
	*io.SectionReader
	io.Closer
}

// Writer seals everything written to it. Close writes the final chunk.
type Writer struct {
	dst  io.Writer
	aead cipher.AEAD
	buf  []byte
	i    int64
}

func NewWriter(dst io.Writer, kek []byte) (*Writer, error) {
	dek := make([]byte, KeySize)
	nonce := make([]byte, nonceSize)
	if _, err := rand.Read(dek); err != nil {
		return nil, err
	}
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	return NewWriterWith(dst, kek, dek, nonce)
}

// NewWriterWith takes the file key and wrap nonce; NewWriter picks them at
// random. Fixed values are for test vectors only.
func NewWriterWith(dst io.Writer, kek, dek, nonce []byte) (*Writer, error) {
	h, err := SealHeader(kek, dek, nonce)
	if err != nil {
		return nil, err
	}
	aead, err := gcm(dek)
	if err != nil {
		return nil, err
	}
	if _, err := dst.Write(h); err != nil {
		return nil, err
	}
	return &Writer{dst: dst, aead: aead, buf: make([]byte, 0, ChunkSize+1)}, nil
}

func (w *Writer) Write(p []byte) (int, error) {
	n := len(p)
	for len(p) > 0 {
		take := min(len(p), ChunkSize+1-len(w.buf))
		w.buf = append(w.buf, p[:take]...)
		p = p[take:]
		// A full chunk is only known not to be the last once a byte follows it.
		if len(w.buf) > ChunkSize {
			if err := w.flush(w.buf[:ChunkSize], false); err != nil {
				return 0, err
			}
			w.buf = append(w.buf[:0], w.buf[ChunkSize])
		}
	}
	return n, nil
}

func (w *Writer) flush(plain []byte, last bool) error {
	_, err := w.dst.Write(w.aead.Seal(nil, chunkNonce(w.i, last), plain, nil))
	w.i++
	return err
}

func (w *Writer) Close() error { return w.flush(w.buf, true) }

// ErrNoKey is sealing asked of a process that has no current key.
var ErrNoKey = errors.New("asked to seal, but no ENCRYPTION_KEY is loaded")

// SealTo seals what is written to the result into w when seal is set, else
// passes it through. Closing it ends the envelope, never w itself.
func (k Keyring) SealTo(w io.Writer, seal bool) (io.WriteCloser, error) {
	if !seal {
		return nopCloser{w}, nil
	}
	if !k.Enabled() {
		return nil, ErrNoKey
	}
	return NewWriter(w, k.Current)
}

type nopCloser struct{ io.Writer }

func (nopCloser) Close() error { return nil }
