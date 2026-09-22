package worker

import (
	"log/slog"
	"strings"
)

// LookPath matches exec.LookPath's signature so tests can stub it.
type LookPath func(file string) (string, error)

// FFmpegEncoders returns ffmpeg's encoder list (e.g. `ffmpeg -hide_banner
// -encoders`), for checking libwebp support.
type FFmpegEncoders func() (string, error)

const webpEncoderAdvice = "thumbnails will come out zero-byte. macOS: " +
	"brew uninstall ffmpeg && brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-webp " +
	"(Ubuntu/CI's apt-get install ffmpeg already includes it)"

// Preflight logs a visible warning for each binary the Go worker execs
// (ffmpeg, ffprobe, pdftoppm) that is missing from PATH, and separately
// checks ffmpeg's build for the libwebp *encoder*; the plain Homebrew
// ffmpeg formula ships decode-only webp, which silently produces zero-byte
// thumbnails. Non-fatal: it only warns, since a worker with no media traffic
// still has jobs to run (copy, delete, scan-list).
func Preflight(log *slog.Logger, lookPath LookPath, encoders FFmpegEncoders) {
	for _, bin := range []string{"ffmpeg", "ffprobe", "pdftoppm"} {
		if _, err := lookPath(bin); err != nil {
			log.Warn(bin+" not found on PATH; thumbnails/waveforms/PDF previews will fail",
				"fix", "macOS: brew install poppler homebrew-ffmpeg/ffmpeg/ffmpeg --with-webp; Ubuntu/CI: apt-get install ffmpeg poppler-utils")
		}
	}
	if _, err := lookPath("ffmpeg"); err != nil {
		return
	}
	out, err := encoders()
	if err != nil {
		log.Warn("could not check ffmpeg's encoders", "err", err)
		return
	}
	if !strings.Contains(out, "libwebp") {
		log.Warn("ffmpeg lacks the libwebp encoder; "+webpEncoderAdvice, "check", "ffmpeg -encoders | grep libwebp")
	}
}
