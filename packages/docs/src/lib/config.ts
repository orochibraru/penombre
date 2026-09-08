/**
 * The one file you edit. Everything site-specific lives here : nothing under
 * `src/routes` or the rest of `src/lib` hardcodes a project name, URL or a
 * line of marketing copy, so re-theming this site for another project is a
 * single-file change (plus `docs/*.md` and `static/favicon.svg`).
 */

export interface Feature {
	title: string;
	body: string;
}

export interface FooterLink {
	label: string;
	href: string;
}

export interface LandingConfig {
	/** Small pill above the headline. Omit for no pill. */
	badge?: string;
	/**
	 * The hero headline. Whatever substring of it also appears in `accent`
	 * below gets the gradient treatment — one string, not three, so the
	 * sentence stays readable here as the sentence it renders as.
	 */
	headline: string;
	/** A substring of `headline` to highlight. Omit to leave it plain. */
	accent?: string;
	subheadline: string;
	/** Optional terminal card under the hero: the command a visitor runs first. */
	snippet?: { caption: string; command: string };
	features: Feature[];
	/** Optional band under the features: what the thing is built on. */
	stack?: { title: string; body: string; items: string[] };
	cta: { title: string; body: string; label: string };
}

export interface DocsConfig {
	/** Site name : header wordmark, `<title>` suffix. */
	name: string;
	/** One-liner for the `<meta name="description">`. */
	description: string;
	/** A letter or two for the header's logo mark. */
	logo: string;
	/**
	 * The project's repository. Used for the header/footer "Source" links and,
	 * more importantly, as the base for rewriting relative markdown links that
	 * point at files this site doesn't publish (`../compose.yaml`) — those
	 * become links into the repo's own file browser. Unset : such links render
	 * as plain text rather than dead hrefs that would fail the prerender crawl.
	 */
	repoUrl?: string;
	/** Branch the above links resolve against. */
	repoBranch: string;
	/**
	 * Reading order of `docs/*.md`, by slug (filename minus `.md`). Drives the
	 * sidebar, the prev/next links and which guide `/docs` redirects to.
	 * Anything not listed sorts after, alphabetically, rather than silently
	 * vanishing from the nav.
	 */
	order: string[];
	/**
	 * Path to an OpenAPI spec served as a static asset (drop the file in
	 * `static/`), enabling the `/docs/api` Swagger UI page. Unset : no API
	 * page, no sidebar link, and `swagger-ui-dist` can come out of
	 * package.json.
	 */
	openapi?: string;
	/** The landing page at `/`. Set to `null` for a docs-only site (`/` redirects to the first guide). */
	landing: LandingConfig | null;
	footer: { note: string; links: FooterLink[] };
}

export const config: DocsConfig = {
	name: "Penombre",
	description: "Your self-hosted cloud drive.",
	logo: "P",
	repoUrl: "https://github.com/orochibraru/penombre",
	repoBranch: "main",
	order: [
		"getting-started",
		"env",
		"deployment",
		"storage",
		"simple-mode",
		"backup",
		"reverse-proxy",
		"troubleshooting",
		"authentication",
		"architecture",
	],
	openapi: "/api.v1.json",
	landing: {
		badge: "Open source · Self-hosted · MIT License",
		headline: "Your data. Your server. Your drive.",
		accent: "Your server.",
		subheadline:
			"Penombre is a modern, self-hosted cloud storage solution with web and mobile clients. All the convenience of a cloud drive — none of the third-party surveillance.",
		snippet: {
			caption: "your server",
			command: "docker compose up -d",
		},
		features: [
			{
				title: "File management",
				body: "Upload, download, move and organize files and folders with a clean, responsive interface.",
			},
			{
				title: "Smart categories",
				body: "Files are automatically categorized by type — images, documents, music, video, and more.",
			},
			{
				title: "Mobile app",
				body: "Native iOS and Android experience built with Expo and React Native, sharing the same typed API.",
			},
			{
				title: "Flexible authentication",
				body: "Email/password, OAuth 2.0 / OIDC providers, WebAuthn passkeys, and API key access — powered by Better Auth.",
			},
			{
				title: "Sharing & permissions",
				body: "Share files and folders with other users with configurable read, write, or admin permissions.",
			},
			{
				title: "Recent files",
				body: "Quickly jump back to recently modified files without digging through your folder tree.",
			},
			{
				title: "Soft trash",
				body: "Accidentally deleted something? Files are moved to trash first and can be fully recovered.",
			},
			{
				title: "Activity log",
				body: "A full audit trail of every create, rename, move, delete, and share action across your drive.",
			},
			{
				title: "API keys",
				body: "Generate scoped API keys with optional expiry and rate limits for programmatic access.",
			},
			{
				title: "Rich previews",
				body: "Automatic thumbnails for images, videos, and PDFs. Audio metadata extracted on upload.",
			},
			{
				title: "Admin panel",
				body: "Manage users, assign roles, ban accounts, and impersonate users straight from the UI.",
			},
			{
				title: "Self-hosted",
				body: "Deploy with a single Docker Compose command. Your data stays on your infrastructure, always.",
			},
		],
		stack: {
			title: "Built on boring, solid pieces",
			body: "Nothing exotic to operate: one container, one database, and a volume for your files.",
			items: [
				"SvelteKit + Svelte 5",
				"Bun",
				"PostgreSQL + Drizzle ORM",
				"Better Auth",
				"TailwindCSS 4",
				"Expo + React Native",
				"Docker Compose",
			],
		},
		cta: {
			title: "Read the docs, then deploy it.",
			body: "PostgreSQL, storage volumes, and health checks are included out of the box.",
			label: "Get started →",
		},
	},
	footer: {
		note: "Penombre — your self-hosted cloud drive. MIT licensed.",
		links: [
			{ label: "Docs", href: "/docs" },
			{ label: "Source", href: "https://github.com/orochibraru/penombre" },
			{
				label: "Releases",
				href: "https://github.com/orochibraru/penombre/releases",
			},
		],
	},
};
