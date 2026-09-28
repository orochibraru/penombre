import { expect, test } from "@playwright/test";
import { AUTH_STORAGE_STATE, sameOrigin } from "../helpers";

test.use({ storageState: AUTH_STORAGE_STATE });

test("an API key reaches the drive over WebDAV", async ({
	request,
	playwright,
	baseURL,
}) => {
	const created = await request.post("/api/v1/auth/api-key/create", {
		headers: sameOrigin(),
		data: { name: `webdav-${Date.now()}` },
	});
	expect(created.ok()).toBeTruthy();
	const { key } = (await created.json()) as { key: string };

	// No cookies: Basic must carry this on its own.
	const dav = await playwright.request.newContext({ baseURL });
	const auth = {
		authorization: `Basic ${Buffer.from(`e2e:${key}`).toString("base64")}`,
	};
	const name = `webdav ${Date.now()}+1.txt`;
	const href = `/dav/me/${encodeURIComponent(name)}`;

	const denied = await dav.fetch("/dav/me/", {
		method: "PROPFIND",
		headers: { depth: "0" },
	});
	expect(denied.status()).toBe(401);
	expect(denied.headers()["www-authenticate"]).toContain("Basic");

	const put = await dav.fetch(href, {
		method: "PUT",
		headers: { ...auth, "content-type": "text/plain" },
		data: "hello",
	});
	expect(put.status()).toBe(201);

	const list = await dav.fetch("/dav/me/", {
		method: "PROPFIND",
		headers: { ...auth, depth: "1" },
	});
	expect(list.status()).toBe(207);
	expect(await list.text()).toContain(href);

	expect(await (await dav.fetch(href, { headers: auth })).text()).toBe("hello");
	expect(
		(await dav.fetch(href, { method: "DELETE", headers: auth })).status(),
	).toBe(204);
	await dav.dispose();
});
