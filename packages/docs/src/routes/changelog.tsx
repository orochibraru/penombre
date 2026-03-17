import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { HomeLayout } from "fumadocs-ui/layouts/home";
import { baseOptions } from "@/lib/layout.shared";

const loadChangelog = createServerFn({ method: "GET" }).handler(async () => {
	const { readFileSync } = await import("node:fs");
	const { resolve } = await import("node:path");
	// process.cwd() during build is packages/docs; go up two levels to monorepo root
	return readFileSync(resolve(process.cwd(), "../../CHANGELOG.md"), "utf-8");
});

export const Route = createFileRoute("/changelog")({
	component: ChangelogPage,
	loader: async () => {
		const content = await loadChangelog();
		return { entries: parseChangelog(content) };
	},
});

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

interface CommitRef {
	hash: string;
	url: string;
}

interface ChangeItem {
	text: string;
	ref: CommitRef | null;
}

interface ChangeSection {
	type: string;
	items: ChangeItem[];
}

interface VersionEntry {
	version: string;
	compareUrl: string | null;
	sections: ChangeSection[];
}

const SECTION_LABELS: Record<string, string> = {
	"🚀 Enhancements": "Enhancements",
	"🩹 Fixes": "Fixes",
	"💅 Refactors": "Refactors",
	"🏡 Chore": "Chore",
	"🔥 Performance": "Performance",
	"❤️ Contributors": "__contributors",
};

function parseItem(raw: string): ChangeItem {
	// Match trailing ([hash](url)) — already a link
	const linkedRef = raw.match(
		/\s*\(?\[([a-f0-9]{7,})\]\((https?:\/\/[^)]+)\)\)?$/,
	);
	if (linkedRef) {
		return {
			text: raw.slice(0, raw.length - linkedRef[0].length).trim(),
			ref: { hash: linkedRef[1], url: linkedRef[2] },
		};
	}
	// Match trailing (hash) — plain 7-char hex
	const plainRef = raw.match(/\s*\(([a-f0-9]{6,})\)$/);
	if (plainRef) {
		return {
			text: raw.slice(0, raw.length - plainRef[0].length).trim(),
			ref: {
				hash: plainRef[1],
				url: `https://github.com/orochibraru/penombre/commit/${plainRef[1]}`,
			},
		};
	}
	// Match (#NUM) PR references
	const prRef = raw.match(/\s*\(#(\d+)\)$/);
	if (prRef) {
		return {
			text: raw.slice(0, raw.length - prRef[0].length).trim(),
			ref: {
				hash: `#${prRef[1]}`,
				url: `https://github.com/orochibraru/penombre/pull/${prRef[1]}`,
			},
		};
	}
	return { text: raw.trim(), ref: null };
}

function parseChangelog(content: string): VersionEntry[] {
	const lines = content.split("\n");
	const entries: VersionEntry[] = [];
	let current: VersionEntry | null = null;
	let currentSection: ChangeSection | null = null;

	for (const raw of lines) {
		const line = raw.trim();
		if (line.startsWith("## ")) {
			const version = line.slice(3).trim();
			current = { version, compareUrl: null, sections: [] };
			currentSection = null;
			entries.push(current);
		} else if (line.startsWith("[compare changes]") && current) {
			const m = line.match(/\(([^)]+)\)/);
			if (m) current.compareUrl = m[1];
		} else if (line.startsWith("### ") && current) {
			const typeRaw = line.slice(4).trim();
			if (SECTION_LABELS[typeRaw] === "__contributors") {
				currentSection = null;
			} else {
				const label = SECTION_LABELS[typeRaw] ?? typeRaw;
				currentSection = { type: label, items: [] };
				current.sections.push(currentSection);
			}
		} else if (line.startsWith("- ") && currentSection) {
			currentSection.items.push(parseItem(line.slice(2)));
		}
	}

	return entries;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

const SECTION_COLORS: Record<string, string> = {
	Enhancements: "text-emerald-600 dark:text-emerald-400",
	Fixes: "text-amber-600 dark:text-amber-400",
	Refactors: "text-violet-600 dark:text-violet-400",
	Performance: "text-sky-600 dark:text-sky-400",
	Chore: "text-fd-muted-foreground",
};

const SECTION_BG: Record<string, string> = {
	Enhancements: "bg-emerald-100 dark:bg-emerald-900/30",
	Fixes: "bg-amber-100 dark:bg-amber-900/30",
	Refactors: "bg-violet-100 dark:bg-violet-900/30",
	Performance: "bg-sky-100 dark:bg-sky-900/30",
	Chore: "bg-fd-muted",
};

function ItemText({ text }: { text: string }) {
	// Bold **label:** pattern
	const boldMatch = text.match(/^\*\*(.+?):\*\*\s*(.*)/);
	if (boldMatch) {
		return (
			<span>
				<span className="font-semibold">{boldMatch[1]}:</span> {boldMatch[2]}
			</span>
		);
	}
	return <span>{text}</span>;
}

function Section({ section }: { section: ChangeSection }) {
	const color = SECTION_COLORS[section.type] ?? "text-fd-foreground";
	const bg = SECTION_BG[section.type] ?? "bg-fd-muted";
	return (
		<div>
			<span
				className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${color} ${bg} mb-2`}
			>
				{section.type}
			</span>
			<ul className="space-y-1">
				{section.items.map((item, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static list
					<li
						key={i}
						className="flex items-start gap-2 text-sm text-fd-foreground"
					>
						<span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-fd-border" />
						<span className="flex-1">
							<ItemText text={item.text} />
							{item.ref && (
								<a
									href={item.ref.url}
									target="_blank"
									rel="noopener noreferrer"
									className="ml-1.5 font-mono text-xs text-fd-muted-foreground hover:text-fd-primary"
								>
									{item.ref.hash}
								</a>
							)}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function VersionCard({ entry }: { entry: VersionEntry }) {
	const hasSections = entry.sections.length > 0;
	return (
		<div className="flex gap-6">
			{/* Timeline spine */}
			<div className="flex flex-col items-center">
				<div className="size-3 shrink-0 rounded-full border-2 border-fd-primary bg-fd-background mt-1" />
				<div className="w-px flex-1 bg-fd-border mt-1" />
			</div>
			{/* Content */}
			<div className="flex-1 pb-10">
				<div className="flex flex-wrap items-center gap-3 mb-4">
					<h2 className="text-xl font-bold text-fd-foreground">
						{entry.version}
					</h2>
					{entry.compareUrl && (
						<a
							href={entry.compareUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-fd-muted-foreground hover:text-fd-primary border border-fd-border rounded px-2 py-0.5"
						>
							compare changes →
						</a>
					)}
					{!hasSections && (
						<span className="text-xs text-fd-muted-foreground italic">
							No changes recorded
						</span>
					)}
				</div>
				{hasSections && (
					<div className="space-y-5">
						{entry.sections.map((section) => (
							<Section key={section.type} section={section} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function ChangelogPage() {
	const { entries } = Route.useLoaderData();
	return (
		<HomeLayout {...baseOptions()}>
			<div className="mx-auto w-full max-w-3xl px-4 py-16">
				<div className="mb-12">
					<h1 className="text-4xl font-bold tracking-tight text-fd-foreground">
						Changelog
					</h1>
					<p className="mt-2 text-fd-muted-foreground">
						All notable changes to Penombre, most recent first.
					</p>
				</div>
				<div>
					{entries.map((entry) => (
						<VersionCard key={entry.version} entry={entry} />
					))}
				</div>
			</div>
		</HomeLayout>
	);
}
