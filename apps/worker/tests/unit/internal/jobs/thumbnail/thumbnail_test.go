package thumbnail_test

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/thumbnail"
)

// The remaining thumbnail.Run behaviour (image/video/pdf/audio rendering)
// execs ffmpeg/pdftoppm and lives in tests/integration/go instead.

func run(t *testing.T, spec thumbnail.Spec) (string, error) {
	t.Helper()
	raw, _ := json.Marshal(spec)
	_, err := thumbnail.Run(context.Background(), jobs.Job{ID: "j", Type: "thumbnail", Spec: raw})
	return spec.Output, err
}

func TestUnknownKindIsAnError(t *testing.T) {
	if _, err := run(t, thumbnail.Spec{Kind: "spreadsheet", Source: "x", Output: "y"}); err == nil {
		t.Fatal("expected an error")
	}
}
