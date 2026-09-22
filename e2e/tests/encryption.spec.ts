import { execFileSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, sameOrigin } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

/** Set by `playwright.pg.config.ts`: only that shard runs with a key. */
const encrypted = Boolean(process.env.E2E_ENCRYPTION_KEY);
const project = process.env.E2E_COMPOSE_PROJECT ?? "penombre-e2e";
const CONTENT = "plain words that must not be on disk when sealed";

async function upload(page: Page, location: string): Promise<string> {
	const created = await page.request.post(`/api/v1/storage/file${location}`, {
		data: { name: `enc-${Date.now()}.txt`, size: CONTENT.length },
	});
	expect(created.ok()).toBeTruthy();
	const { id, finalName } = (await created.json()).data;
	const sent = await page.request.post(
		`/api/v1/storage/file/${id}/upload${location}`,
		{
			headers: sameOrigin(),
			multipart: {
				file: {
					name: "f.txt",
					mimeType: "text/plain",
					buffer: Buffer.from(CONTENT),
				},
			},
		},
	);
	expect(sent.ok()).toBeTruthy();
	const raw = await page.request.get(
		`/api/v1/storage/file/${encodeURIComponent(finalName)}?raw=true${location.replace("?", "&")}`,
	);
	expect(await raw.text()).toBe(CONTENT);
	return finalName as string;
}

/** The first bytes of the stored file, read inside the app container. */
function onDisk(key: string): string {
	return execFileSync("docker", [
		"compose",
		"-f",
		"compose.e2e.yaml",
		"-p",
		project,
		"exec",
		"-T",
		"app",
		"sh",
		"-c",
		`head -c 7 "$(find /data -name '${key}' -type f | head -1)"`,
	]).toString();
}

test.describe("Encryption at rest", () => {
	test("a personal upload is sealed on disk only where a key is set", async ({
		page,
	}) => {
		const key = await upload(page, "");
		expect(onDisk(key)).toBe(encrypted ? "PNMBENC" : CONTENT.slice(0, 7));
	});

	test("a volume without _ENCRYPT stays plaintext on disk", async ({
		page,
	}) => {
		const key = await upload(page, "?volume=e2e");
		expect(onDisk(key)).toBe(CONTENT.slice(0, 7));
	});
});
