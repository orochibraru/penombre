package thumbnail

import (
	"encoding/binary"
	"math"
)

// Below -40 dBFS a file is treated as silence and not normalised up.
const silenceFloor = 0.01

// BucketPeaks is the loudest sample per slice of s16le PCM, scaled so the
// loudest slice is 1. Relative, not absolute: the waveform is the player's
// scrubber, and a quiet master drew a line too thin to click. Read in place:
// a copy into []int16 doubled the memory of a long recording.
func BucketPeaks(pcm []byte, buckets int) []float64 {
	n := len(pcm) / 2
	per := max(1, n/buckets)
	peaks := make([]float64, 0, buckets)
	loudest := 0.0
	for b := 0; b < buckets; b++ {
		start := b * per
		if start >= n {
			break
		}
		end := min(start+per, n)
		peak := 0.0
		for i := start; i < end; i++ {
			s := int16(binary.LittleEndian.Uint16(pcm[2*i:]))
			peak = max(peak, math.Abs(float64(s)))
		}
		scaled := peak / 32768
		loudest = max(loudest, scaled)
		peaks = append(peaks, scaled)
	}
	gain := 1.0
	if loudest > silenceFloor {
		gain = 1 / loudest
	}
	for i, p := range peaks {
		peaks[i] = math.Round(p*gain*1000) / 1000
	}
	return peaks
}
