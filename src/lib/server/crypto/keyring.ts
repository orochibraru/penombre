import { type AppConfig, getConfig } from "#lib/server/config.js";
import type { Keyring } from "./envelope";

export function keyring(): Keyring {
	// Absent from the unit tests' config mock.
	const encryption = getConfig().encryption as
		| AppConfig["encryption"]
		| undefined;
	return { current: encryption?.key, previous: encryption?.previous ?? [] };
}

/** Whether new bytes on personal and shared drives are sealed. */
export function encryptionEnabled(): boolean {
	return keyring().current !== undefined;
}
