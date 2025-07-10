import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export function getTempDir() {
	const tempDir = path.join(process.cwd(), 'temp');
	if (!existsSync(tempDir)) {
		mkdirSync(tempDir, { recursive: true });
	}

	return tempDir;
}
