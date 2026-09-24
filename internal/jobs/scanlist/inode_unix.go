//go:build unix

package scanlist

import (
	"io/fs"
	"strconv"
	"syscall"
)

func inode(info fs.FileInfo) string {
	if st, ok := info.Sys().(*syscall.Stat_t); ok {
		return strconv.FormatUint(uint64(st.Ino), 10)
	}
	return ""
}
