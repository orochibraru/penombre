import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const LOG_DIR = "/tmp/opendrive-debug";
const LOG_FILE = join(LOG_DIR, "upload.log");

// Ensure log directory exists
if (!existsSync(LOG_DIR)) {
	mkdirSync(LOG_DIR, { recursive: true });
}

export function debugLog(context: string, message: string, data?: unknown) {
	const timestamp = new Date().toISOString();
	const logLine = `[${timestamp}] [${context}] ${message}${data ? ` | ${JSON.stringify(data)}` : ""}\n`;

	try {
		appendFileSync(LOG_FILE, logLine);
	} catch (e) {
		console.error("Failed to write debug log:", e);
	}
}

export function clearDebugLog() {
	try {
		const { writeFileSync } = require("node:fs");
		writeFileSync(
			LOG_FILE,
			`=== Debug log cleared at ${new Date().toISOString()} ===\n`,
		);
	} catch (e) {
		console.error("Failed to clear debug log:", e);
	}
}
