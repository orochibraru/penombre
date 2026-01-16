import { join, resolve } from "node:path";
import { cwd } from "node:process";
import { Logger } from "$lib/logger";

export const logger = new Logger("StorageService");

export const DEFAULT_STORAGE_PATH = join(
	cwd(),
	resolve(Bun.env.STORAGE_PATH || "/data/storage"),
);
