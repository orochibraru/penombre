import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import {
	Activity,
	Clock,
	Download,
	FolderOpen,
	KeyRound,
	Server,
	Share2,
	ShieldCheck,
	Smartphone,
	Tag,
	Trash2,
	Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
	{
		icon: FolderOpen,
		title: "File Management",
		description:
			"Upload, download, move and organize files and folders with a clean, responsive interface.",
	},
	{
		icon: Tag,
		title: "Smart Categories",
		description:
			"Files are automatically categorized by type — images, documents, music, video, and more.",
	},
	{
		icon: Smartphone,
		title: "Mobile App",
		description:
			"Native iOS and Android experience built with Expo and React Native, sharing the same typed API.",
	},
	{
		icon: ShieldCheck,
		title: "Flexible Authentication",
		description:
			"Email/password, OAuth 2.0 / OIDC providers, WebAuthn passkeys, and API key access — powered by Better Auth.",
	},
	{
		icon: Share2,
		title: "Sharing & Permissions",
		description:
			"Share files and folders with other users with configurable read, write, or admin permissions.",
	},
	{
		icon: Clock,
		title: "Recent Files",
		description:
			"Quickly jump back to recently modified files without digging through your folder tree.",
	},
	{
		icon: Trash2,
		title: "Soft Trash",
		description:
			"Accidentally deleted something? Files are moved to trash first and can be fully recovered.",
	},
	{
		icon: Activity,
		title: "Activity Log",
		description:
			"A full audit trail of every create, rename, move, delete, and share action across your drive.",
	},
	{
		icon: KeyRound,
		title: "API Keys",
		description:
			"Generate scoped API keys with optional expiry and rate limits for programmatic access.",
	},
	{
		icon: Download,
		title: "Rich Previews",
		description:
			"Automatic thumbnails for images, videos, and PDFs. Audio metadata extracted on upload.",
	},
	{
		icon: Users,
		title: "Admin Panel",
		description:
			"Manage users, assign roles, ban accounts, and impersonate users straight from the UI.",
	},
	{
		icon: Server,
		title: "Self-Hosted",
		description:
			"Deploy with a single Docker Compose command. Your data stays on your infrastructure, always.",
	},
];

function FeatureCard({
	icon: Icon,
	title,
	description,
}: {
	icon: React.ElementType;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-5">
			<div className="flex size-10 items-center justify-center rounded-lg bg-fd-primary/10 text-fd-primary">
				<Icon size={20} />
			</div>
			<h3 className="font-semibold text-fd-foreground">{title}</h3>
			<p className="text-sm leading-relaxed text-fd-muted-foreground">
				{description}
			</p>
		</div>
	);
}

export default function HomePage() {
	return (
		<>
			{/* Hero */}
			<section className="flex flex-col items-center gap-6 px-4 py-20 text-center">
				<div className="inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-4 py-1.5 text-xs font-medium text-fd-muted-foreground">
					Open Source · Self-Hosted · MIT License
				</div>
				<h1 className="max-w-3xl text-balance text-5xl font-bold tracking-tight text-fd-foreground md:text-6xl">
					Your data. <span className="text-fd-primary">Your server.</span> Your
					drive.
				</h1>
				<p className="max-w-xl text-balance text-lg text-fd-muted-foreground">
					Penombre is a modern, self-hosted cloud storage solution with web and
					mobile clients. All the convenience of a cloud drive — none of the
					third-party surveillance.
				</p>
				<div className="flex flex-wrap items-center justify-center gap-3">
					<Link
						href="/docs/"
						className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
					>
						Get Started
					</Link>
					<a
						href="https://github.com/orochibraru/penombre"
						target="_blank"
						rel="noopener noreferrer"
						className="rounded-lg border border-fd-border bg-fd-card px-5 py-2.5 text-sm font-semibold text-fd-foreground transition-colors hover:bg-fd-accent"
					>
						View on GitHub
					</a>
				</div>
			</section>

			{/* Screenshot */}
			<section className="mx-auto w-full max-w-5xl px-4 pb-16">
				<div className="overflow-hidden rounded-2xl border border-fd-border shadow-xl">
					<Image
						src="/screenshot.png"
						alt="Penombre web interface"
						width={1200}
						height={800}
						className="w-full"
					/>
				</div>
			</section>

			{/* Features */}
			<section className="mx-auto w-full max-w-6xl px-4 pb-24">
				<div className="mb-12 text-center">
					<h2 className="text-3xl font-bold tracking-tight text-fd-foreground">
						Everything you need in a drive
					</h2>
					<p className="mt-3 text-fd-muted-foreground">
						Built for individuals and teams who want cloud storage without the
						trade-offs.
					</p>
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{features.map((f) => (
						<FeatureCard key={f.title} {...f} />
					))}
				</div>
			</section>

			{/* Self-hosted callout */}
			<section className="mx-auto w-full px-4 pb-24">
				<div className="flex flex-col items-center gap-6 rounded-2xl border border-fd-border bg-fd-card px-8 py-14">
					<div className="flex size-14 items-center justify-center rounded-2xl bg-fd-primary/10 text-fd-primary">
						<Server size={28} />
					</div>
					<div className="text-center">
						<h2 className="text-2xl font-bold text-fd-foreground">
							Easy deployment
						</h2>
						<p className="mt-2 text-fd-muted-foreground">
							Ship Penombre to any server with Docker Compose. PostgreSQL,
							storage volumes, and health checks are included out of the box.
						</p>
					</div>
					<DynamicCodeBlock
						lang="bash"
						code={`
curl -o compose.yaml https://raw.githubusercontent.com/orochibraru/penombre/refs/heads/main/compose.example.yaml
curl -o .env https://raw.githubusercontent.com/orochibraru/penombre/refs/heads/main/.example.env
docker compose up
`}
					/>
					<Link
						href="/docs/"
						className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-semibold text-fd-primary-foreground transition-opacity hover:opacity-90"
					>
						Read the docs
					</Link>
				</div>
			</section>
		</>
	);
}
