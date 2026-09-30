/**
 * A video's lower renditions, as the player asks for them. The server renders
 * one on first request (`services/storage/renditions.ts`); until then its
 * bytes are a 404, so a player prepares before it switches.
 */

export const RENDITION_HEIGHTS = [720, 480] as const;
export type RenditionHeight = (typeof RENDITION_HEIGHTS)[number];
export type Quality = "original" | RenditionHeight;

function parse(raw: string): URL {
	return new URL(raw, globalThis.location?.href ?? "http://localhost");
}

/** The rendition's bytes, from the URL of the original's. */
export function renditionUrl(raw: string, height: RenditionHeight): string {
	const url = parse(raw);
	url.searchParams.set("rendition", String(height));
	return url.href;
}

function prepareUrl(raw: string, height: RenditionHeight): string {
	const url = parse(raw);
	url.pathname += `/renditions/${height}`;
	url.searchParams.delete("raw");
	return url.href;
}

/** An earlier version is served by its own route, which renders nothing. */
export function canConvert(raw: string): boolean {
	return !parse(raw).pathname.includes("/versions/");
}

export interface Prepared {
	status: "ready" | "failed" | "unavailable" | "aborted";
	error?: string;
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Asks until the rendition exists. Each request is a long poll on the server;
 * the floor only keeps a server that answers at once from being hammered.
 */
export async function prepareRendition(
	raw: string,
	height: RenditionHeight,
	signal?: AbortSignal,
	/** What a test swaps: the request, and the floor between two of them. */
	{
		fetcher = fetch,
		floorMs = 1500,
	}: { fetcher?: typeof fetch; floorMs?: number } = {},
): Promise<Prepared> {
	const url = prepareUrl(raw, height);
	try {
		for (;;) {
			const asked = Date.now();
			const response = await fetcher(url, { method: "POST", signal });
			if (!response.ok) {
				return { status: "failed" };
			}
			const { data } = (await response.json()) as {
				data: { status: Prepared["status"] | "preparing"; error?: string };
			};
			if (data.status !== "preparing") {
				return { status: data.status, error: data.error };
			}
			await pause(Math.max(floorMs - (Date.now() - asked), 0));
			if (signal?.aborted) {
				return { status: "aborted" };
			}
		}
	} catch (error) {
		if (signal?.aborted) {
			return { status: "aborted" };
		}
		return { status: "failed", error: String(error) };
	}
}
