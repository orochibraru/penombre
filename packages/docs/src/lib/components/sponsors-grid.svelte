<script lang="ts">
	type RawSponsor = {
		name: string | null;
		login: string;
		avatar: string;
		link: string;
		org: boolean;
	};

	type Sponsor = { login: string; name: string | null; url: string; avatarUrl: string };

	async function fetchSponsors(): Promise<Sponsor[]> {
		const res = await fetch(
			'https://raw.githubusercontent.com/pocket-id/resources/refs/heads/main/sponsors.json',
			{
				cache: 'no-store'
			}
		);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);

		const raw = (await res.json()) as RawSponsor[] | { sponsors: RawSponsor[] };
		const items = Array.isArray(raw) ? raw : (raw?.sponsors ?? []);
		return items.map((s) => ({
			login: s.login,
			name: s.name,
			url: s.link,
			avatarUrl: s.avatar
		}));
	}

	const sponsorsPromise = fetchSponsors();
</script>

{#await sponsorsPromise}
	<div class="text-muted-foreground">Loading sponsors…</div>
{:then sponsors}
	{#if sponsors.length}
		<div class="m-5 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-4">
			{#each sponsors as s (s.login)}
				<a
					href={s.url}
					target="_blank"
					rel="noreferrer"
					class="group hover:bg-accent flex w-full flex-col items-center gap-2 rounded-md border p-3"
				>
					<img
						src={s.avatarUrl}
						alt={s.name ?? s.login}
						class="border-ghost size-16 rounded-full"
						loading="lazy"
					/>
					<div
						class="w-full max-w-full truncate text-center text-sm font-medium"
						title={s.name ?? s.login}
					>
						{s.name ?? s.login}
					</div>
					<div
						class="text-muted-foreground w-full max-w-full truncate text-center text-xs"
						title={`@${s.login}`}
					>
						@{s.login}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="space-y-3">
			<p class="text-muted-foreground">
				Live sponsor list unavailable. Visit their GitHub Sponsors pages from the links
				above.
			</p>
		</div>
	{/if}
{:catch err}
	<div class="space-y-3">
		<p class="text-muted-foreground">Live sponsor list unavailable. Error: {err.message}</p>
	</div>
{/await}
