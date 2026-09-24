//go:build !unix

package scanlist

import "io/fs"

// No inode to report: a replaced file is then only re-read, never versioned.
func inode(fs.FileInfo) string { return "" }
