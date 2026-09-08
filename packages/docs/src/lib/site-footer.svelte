<script lang="ts">
	import { config } from "$lib/config";
</script>

<footer class="border-t border-(--border) py-10">
	<div
		class="mx-auto flex flex-col items-center gap-3 px-6 text-center text-sm text-(--text-subtle) sm:flex-row sm:justify-between sm:text-left"
	>
		<p>{config.footer.note}</p>
		<div class="flex gap-5">
			{#each config.footer.links as link (link.href)}
				<a
					href={link.href}
					target={link.href.startsWith("http") ? "_blank" : null}
					rel={link.href.startsWith("http") ? "noreferrer" : null}
					class="hover:text-(--text-muted)">{link.label}</a
				>
			{/each}
		</div>
	</div>
</footer>
