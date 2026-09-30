// Fills the test account's drive with folders and files of every kind, so the
// app has something to show and the signed-in flow something to find. Signs in
// over the API, so the account needs a password. Safe to run again: whatever
// is already there by name is left alone.
//
//   mise run mobile:seed        (or as part of mise run mobile:e2e)
import { join } from "node:path";

const server = process.env.PENOMBRE_E2E_SERVER ?? "http://localhost:5173";
const fixtures = join(import.meta.dir, "../../e2e/fixtures");

/** The flow opens this one and expects it empty and starred. */
const EMPTY_STARRED = "Maestro";

/** Folder name → the files inside it, as `name: fixture`. "" is the root. */
const DRIVE: Record<string, Record<string, string>> = {
	"": {
		"Poster.jpg": "showcase-photo.jpg",
		"Setlist.md": "showcase-notes.md",
		"Contract.pdf": "showcase-report.pdf",
		"Tour budget.csv": "showcase-budget.csv",
	},
	"Live sets": {
		"Olympia, opening.mp3": "showcase-track.mp3",
		"Soundcheck.wav": "test-audio.wav",
		"Olympia, full show.mp4": "showcase-video.mp4",
		// Long enough to still be playing when a flow looks at it.
		"Olympia, encore.mp4": "mobile-video.mp4",
		// A format no phone plays: the app offers to convert it.
		"Rehearsal.avi": "mobile-video.avi",
	},
	Documents: {
		"Rider.docx": "office-report.docx",
		"Merch stock.xlsx": "office-report.xlsx",
		"Pitch deck.pptx": "office-report.pptx",
		"Stems backup.zip": "showcase-backup.zip",
	},
	[EMPTY_STARRED]: {},
};
const STARRED_FILES = new Set(["Poster.jpg"]);

interface Entry {
	key: string;
	type: string;
	metadata: { id: string; name?: string };
}

let token = "";

async function call(path: string, init: RequestInit = {}) {
	const form = init.body instanceof FormData;
	const response = await fetch(`${server}${path}`, {
		...init,
		headers: {
			origin: server,
			...(form ? {} : { "content-type": "application/json" }),
			...(token ? { authorization: `Bearer ${token}` } : {}),
		},
	});
	if (!response.ok) {
		throw new Error(`${path}: ${response.status} ${await response.text()}`);
	}
	return response.json();
}

async function list(folder: string): Promise<Entry[]> {
	const entries: Entry[] = [];
	let cursor: string | null = null;
	do {
		const route = folder ? `/${encodeURIComponent(folder)}` : "";
		const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
		const { data } = await call(`/api/v1/storage/list${route}${query}`);
		entries.push(...data.list);
		cursor = data.nextCursor ?? null;
	} while (cursor);
	return entries;
}

const named = (entries: Entry[], type: string, name: string) =>
	entries.find((e) => e.type === type && (e.metadata.name ?? e.key) === name);

({ token } = await call("/api/v1/auth/sign-in/email", {
	method: "POST",
	body: JSON.stringify({
		email: process.env.PENOMBRE_E2E_EMAIL,
		password: process.env.PENOMBRE_E2E_PASSWORD,
	}),
}));

let created = 0;
const root = await list("");
for (const [folder, files] of Object.entries(DRIVE)) {
	// At the drive's root a folder's path is its key.
	let path = "";
	if (folder) {
		path =
			named(root, "folder", folder)?.key ??
			(
				await call("/api/v1/storage/folder", {
					method: "POST",
					body: JSON.stringify({ name: folder }),
				}).then((answer) => {
					created++;
					return answer;
				})
			).data.path;
	}
	const present = folder ? await list(path) : root;
	for (const [name, fixture] of Object.entries(files)) {
		if (named(present, "file", name)) {
			continue;
		}
		const bytes = Bun.file(join(fixtures, fixture));
		const query = path ? `?folder=${encodeURIComponent(path)}` : "";
		const { data } = await call(`/api/v1/storage/file${query}`, {
			method: "POST",
			body: JSON.stringify({ name, size: bytes.size }),
		});
		const body = new FormData();
		body.append("file", bytes, name);
		await call(`/api/v1/storage/file/${data.metadata.id}/upload`, {
			method: "POST",
			body,
		});
		created++;
		if (STARRED_FILES.has(name)) {
			await call(`/api/v1/storage/file/${data.metadata.id}`, {
				method: "PUT",
				body: JSON.stringify({ isStarred: true }),
			});
		}
	}
	if (folder === EMPTY_STARRED) {
		// A run that stopped halfway leaves what it made in here.
		for (const left of present) {
			const key = encodeURIComponent(`${path}/${left.key.replace(/\/$/, "")}`);
			await call(
				left.type === "folder"
					? `/api/v1/storage/folder/${key}/trash`
					: `/api/v1/storage/file/${left.metadata.id}`,
				left.type === "folder"
					? { method: "POST", body: "{}" }
					: { method: "PUT", body: JSON.stringify({ isTrashed: true }) },
			);
		}
		await call(`/api/v1/storage/folder/${encodeURIComponent(path)}`, {
			method: "PUT",
			body: JSON.stringify({ isStarred: true }),
		});
	}
}

async function upload(
	name: string,
	fixture: string,
	query = "",
): Promise<string> {
	const bytes = Bun.file(join(fixtures, fixture));
	const { data } = await call(`/api/v1/storage/file${query}`, {
		method: "POST",
		body: JSON.stringify({ name, size: bytes.size }),
	});
	const body = new FormData();
	body.append("file", bytes, name);
	await call(`/api/v1/storage/file/${data.metadata.id}/upload${query}`, {
		method: "POST",
		body,
	});
	created++;
	return data.metadata.id;
}

// Earlier versions: the same name uploaded again keeps the old bytes. A track's
// can be played from its versions.
const setlist = named(await list(""), "file", "Setlist.md");
if (setlist) {
	const { data } = await call(
		`/api/v1/storage/file/${setlist.metadata.id}/versions`,
	);
	if (data.versions.length === 0) {
		const body = new FormData();
		body.append(
			"file",
			Bun.file(join(fixtures, "showcase-script.ts")),
			"Setlist.md",
		);
		await call(`/api/v1/storage/file/${setlist.metadata.id}/upload`, {
			method: "POST",
			body,
		});
		created++;
	}
}

const live = named(await list(""), "folder", "Live sets");
const soundcheck =
	live &&
	named(await list(live.key.replace(/\/$/, "")), "file", "Soundcheck.wav");
if (soundcheck) {
	const { data } = await call(
		`/api/v1/storage/file/${soundcheck.metadata.id}/versions`,
	);
	if (data.versions.length === 0) {
		const body = new FormData();
		body.append(
			"file",
			Bun.file(join(fixtures, "test-audio.wav")),
			"Soundcheck.wav",
		);
		await call(`/api/v1/storage/file/${soundcheck.metadata.id}/upload`, {
			method: "POST",
			body,
		});
		created++;
	}
}

// Something in the trash.
const { data: trash } = await call("/api/v1/storage/file/trash");
if (!named(trash.list, "file", "Old flyer.jpg")) {
	const id = await upload("Old flyer.jpg", "showcase-photo.jpg");
	await call(`/api/v1/storage/file/${id}`, {
		method: "PUT",
		body: JSON.stringify({ isTrashed: true }),
	});
}

// A shared drive with something in it.
const { data: drives } = await call("/api/v1/drives");
const band =
	drives.find((drive: { name: string }) => drive.name === "The band") ??
	(
		await call("/api/v1/drives", {
			method: "POST",
			body: JSON.stringify({ name: "The band" }),
		})
	).data;
const { data: shared } = await call(`/api/v1/storage/list?drive=${band.id}`);
if (!named(shared.list, "file", "Stage plot.pdf")) {
	await upload("Stage plot.pdf", "showcase-report.pdf", `?drive=${band.id}`);
}

await call("/api/v1/auth/sign-out", { method: "POST", body: "{}" });
process.stdout.write(
	created ? `Seeded ${created} items\n` : "Drive already seeded\n",
);
