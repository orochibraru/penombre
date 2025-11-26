import { extname, join } from "node:path";

const server = Bun.serve({
	port: 5173,
	async fetch(req) {
		const url = new URL(req.url);
		const root = "./frontend"; // Your static folder

		// 1. Construct the absolute file path
		// We remove the leading slash from pathname to join correctly
		const filePath = join(root, url.pathname);

		// 2. Check if the specific file exists on disk
		const file = Bun.file(filePath);
		const exists = await file.exists(); // Check existence asynchronously

		// 3. IF FILE EXISTS: Serve it directly
		if (exists) {
			return new Response(file);
		}

		// 4. IF FILE MISSING: Handle Routing (SPA Fallback)
		// We only fallback to index.html if the request looks like a page navigation
		// (i.e., it doesn't have a file extension like .css, .js, .png)
		const isAsset = extname(url.pathname) !== "";

		if (!isAsset) {
			return new Response(Bun.file(join(root, "index.html")));
		}

		// 5. GENUINE 404: It was a missing asset (e.g., missing-image.png)
		return new Response("404: File Not Found", { status: 404 });
	},
});

console.log(`Listening on http://localhost:${server.port}`);
