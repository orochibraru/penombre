package envelope

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strings"
)

// LoadKeyring reads ENCRYPTION_KEY or ENCRYPTION_KEY_FILE, and
// ENCRYPTION_KEY_PREVIOUS. Mirrors resolveEncryption in config.ts.
func LoadKeyring(getenv func(string) string) (Keyring, error) {
	var k Keyring
	raw := strings.TrimSpace(getenv("ENCRYPTION_KEY"))
	if file := strings.TrimSpace(getenv("ENCRYPTION_KEY_FILE")); file != "" {
		if raw != "" {
			return k, errors.New("set ENCRYPTION_KEY or ENCRYPTION_KEY_FILE, not both")
		}
		b, err := os.ReadFile(file)
		if err != nil {
			return k, fmt.Errorf("ENCRYPTION_KEY_FILE: %w", err)
		}
		raw = strings.TrimSpace(string(b))
	}
	if raw != "" {
		key, err := decodeKey(raw)
		if err != nil {
			return k, fmt.Errorf("ENCRYPTION_KEY: %w", err)
		}
		k.Current = key
	}
	for _, part := range strings.Split(getenv("ENCRYPTION_KEY_PREVIOUS"), ",") {
		if part = strings.TrimSpace(part); part == "" {
			continue
		}
		key, err := decodeKey(part)
		if err != nil {
			return k, fmt.Errorf("ENCRYPTION_KEY_PREVIOUS: %w", err)
		}
		k.Previous = append(k.Previous, key)
	}
	return k, nil
}

func decodeKey(raw string) ([]byte, error) {
	key, err := base64.StdEncoding.DecodeString(raw)
	if err != nil || len(key) != KeySize {
		return nil, errors.New("must be 32 bytes, base64 (openssl rand -base64 32)")
	}
	return key, nil
}
