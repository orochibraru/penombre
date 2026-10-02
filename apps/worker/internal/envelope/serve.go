package envelope

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"io"
	"net"
	"net/http"
	"os"
	"time"
)

// Serve exposes src on a loopback URL for ffmpeg and ffprobe, which need a
// seekable input: a pipe fails on an MP4 whose index sits at the end. The
// path is a random 128-bit token. It stops when ctx ends or stop is called.
func Serve(ctx context.Context, src io.ReaderAt, size int64) (url string, stop func(), err error) {
	token := make([]byte, 16)
	if _, err := rand.Read(token); err != nil {
		return "", nil, err
	}
	path := "/" + hex.EncodeToString(token)
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return "", nil, err
	}
	server := &http.Server{
		ReadHeaderTimeout: 10 * time.Second,
		Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.URL.Path != path {
				http.NotFound(w, r)
				return
			}
			http.ServeContent(w, r, "", time.Time{}, io.NewSectionReader(src, 0, size))
		}),
	}
	go func() {
		if err := server.Serve(ln); err != nil && !errors.Is(err, http.ErrServerClosed) {
			ln.Close()
		}
	}()
	serveCtx, cancel := context.WithCancel(ctx)
	go func() {
		<-serveCtx.Done()
		server.Close()
	}()
	return "http://" + ln.Addr().String() + path, cancel, nil
}

// Input returns what to hand ffmpeg for path: path itself when plain, a
// loopback URL when sealed. Call stop once the tool has exited.
func Input(ctx context.Context, k Keyring, path string) (input string, stop func(), err error) {
	sealed, err := SniffFile(path)
	if err != nil || !sealed {
		return path, func() {}, err
	}
	f, err := os.Open(path)
	if err != nil {
		return "", nil, err
	}
	url, cancel, err := serveFile(ctx, k, f)
	if err != nil {
		f.Close()
		return "", nil, err
	}
	return url, func() { cancel(); f.Close() }, nil
}

func serveFile(ctx context.Context, k Keyring, f *os.File) (string, func(), error) {
	info, err := f.Stat()
	if err != nil {
		return "", nil, err
	}
	r, err := k.Open(f, info.Size())
	if err != nil {
		return "", nil, err
	}
	return Serve(ctx, r, r.Size())
}
