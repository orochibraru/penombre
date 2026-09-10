/**
 * Available disk space for a path.
 *
 * Prefers fs.statfsSync and falls back to shelling out to `df -k`, since
 * statfsSync is unavailable on some runtimes and container filesystems.
 */

import * as fs from "node:fs";
import { Logger } from "$lib/logger";

const logger = new Logger("DiskSpace");

/** Total and available bytes for the filesystem holding a path. */
export interface DiskSpace {
	total: number;
	available: number;
}

/** Disk space via fs.statfsSync, or undefined when unsupported */
function fromStatfs(path: string): DiskSpace | undefined {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: statfsSync types are complex
		const anyFs = fs as unknown as { statfsSync?: (p: string) => any };
		if (typeof anyFs.statfsSync !== "function") {
			return;
		}
		const sfs = anyFs.statfsSync(path);
		const blockSize = Number(sfs?.bsize ?? sfs?.frsize ?? 4096);
		const availBlocks = Number(sfs?.bavail ?? sfs?.bfree ?? 0);
		const totalBlocks = Number(sfs?.blocks ?? 0);
		if (Number.isFinite(blockSize) && Number.isFinite(availBlocks)) {
			return {
				total: Number.isFinite(totalBlocks) ? blockSize * totalBlocks : 0,
				available: blockSize * availBlocks,
			};
		}
	} catch (err) {
		logger.warn("statfsSync unavailable or failed:", err);
	}
}

/** Index of the "Available" column in `df` output, with positional fallbacks */
function findAvailableColumn(headers: string[], values: string[]): number {
	const availIdx = headers.findIndex((h) => /avail|available/i.test(h));
	if (availIdx !== -1) {
		return availIdx;
	}
	const mountedIdx = headers.findIndex((h) => /mounted/i.test(h));
	if (mountedIdx > 0) {
		return mountedIdx - 2;
	}
	return values.length >= 4 ? values.length - 2 : -1;
}

/** Disk space by shelling out to `df -k`, or undefined when it fails */
function fromDf(path: string): DiskSpace | undefined {
	try {
		const proc = Bun.spawnSync(["df", "-k", path]);
		const output = new TextDecoder().decode(proc.stdout || new Uint8Array());
		const lines = output.trim().split("\n");
		const headerLine = lines[0];
		const valueLine = lines[1];
		if (!(headerLine && valueLine)) {
			logger.warn("Failed to parse df output:", output);
			return;
		}

		const values = valueLine.trim().split(/\s+/);
		const headers = headerLine.trim().split(/\s+/);
		const availIdx = findAvailableColumn(headers, values);
		const availStr = values[availIdx];
		const availKiB = availStr ? Number.parseInt(availStr, 10) : Number.NaN;
		if (Number.isFinite(availKiB)) {
			// The size column sits two left of "Available" in every df layout
			// we handle; a miss just means an unknown total, not a failure.
			const totalStr = values[availIdx - 2];
			const totalKiB = totalStr ? Number.parseInt(totalStr, 10) : Number.NaN;
			return {
				total: Number.isFinite(totalKiB) ? totalKiB * 1024 : 0,
				available: availKiB * 1024,
			};
		}
		logger.warn("Failed to parse df output:", output);
	} catch (err) {
		logger.warn("df command failed:", err);
	}
}

/** Total and available bytes at `path`, each 0 when undeterminable */
export function diskSpace(path: string): DiskSpace {
	return fromStatfs(path) ?? fromDf(path) ?? { total: 0, available: 0 };
}

/** Available bytes at `path`, or 0 when it cannot be determined */
export function availableDiskSpace(path: string): number {
	return diskSpace(path).available;
}
