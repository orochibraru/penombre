package transcode_test

import (
	"context"
	"encoding/json"
	"slices"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs"
	"github.com/orochibraru/penombre/internal/jobs/transcode"
)

func TestArgsCapTheHeightAndTheBitrate(t *testing.T) {
	args := transcode.Args("in.avi", "out.tmp", 480)
	for _, want := range []string{"scale=-2:trunc(min(480\\,ih)/2)*2", "1680k", "+faststart", "0:a:0?"} {
		if !slices.Contains(args, want) {
			t.Fatalf("missing %q in %v", want, args)
		}
	}
	if args[len(args)-1] != "out.tmp" {
		t.Fatalf("the output comes last: %v", args)
	}
}

func TestAnAbsurdHeightIsRefused(t *testing.T) {
	for _, height := range []int{0, 100, 4320} {
		raw, _ := json.Marshal(transcode.Spec{Source: "x", Output: "y", Height: height})
		if _, err := transcode.Run(context.Background(), jobs.Job{ID: "j", Spec: raw}); err == nil {
			t.Fatalf("height %d was accepted", height)
		}
	}
}
