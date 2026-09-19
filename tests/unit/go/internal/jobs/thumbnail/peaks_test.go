package thumbnail_test

import (
	"encoding/binary"
	"encoding/json"
	"testing"

	"github.com/orochibraru/penombre/internal/jobs/thumbnail"
)

func samplesOf(values []int16, per int) []byte {
	out := make([]byte, 0, len(values)*per*2)
	for _, v := range values {
		for range per {
			out = binary.LittleEndian.AppendUint16(out, uint16(v))
		}
	}
	return out
}

func asJSON(t *testing.T, v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func TestScalesLoudestBucketToOne(t *testing.T) {
	if got := asJSON(t, thumbnail.BucketPeaks(samplesOf([]int16{1000, 2000, 4000}, 8), 3)); got != "[0.25,0.5,1]" {
		t.Fatal(got)
	}
}

func TestQuietFileStillFillsTheBar(t *testing.T) {
	if got := asJSON(t, thumbnail.BucketPeaks(samplesOf([]int16{2300, 1150}, 8), 2)); got != "[1,0.5]" {
		t.Fatal(got)
	}
}

func TestSilenceIsNotAmplified(t *testing.T) {
	if p := thumbnail.BucketPeaks(samplesOf([]int16{100, 50}, 8), 2); p[0] >= 0.01 {
		t.Fatal(p)
	}
}

func TestOneEntryPerBucket(t *testing.T) {
	if n := len(thumbnail.BucketPeaks(samplesOf([]int16{1, 2, 3, 4}, 4), 4)); n != 4 {
		t.Fatal(n)
	}
}

func TestEmptyInputIsAnEmptyArray(t *testing.T) {
	if got := asJSON(t, thumbnail.BucketPeaks(nil, 4)); got != "[]" {
		t.Fatal(got)
	}
}

func TestNegativeSamplesCountByMagnitude(t *testing.T) {
	if got := asJSON(t, thumbnail.BucketPeaks(samplesOf([]int16{-32768, 16384}, 4), 2)); got != "[1,0.5]" {
		t.Fatal(got)
	}
}
