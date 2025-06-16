<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { route } from '$lib/ROUTES';
	import { authClient } from '$lib/auth-client';
	import Darkmode from '$lib/components/darkmode.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	async function handleSignOut() {
		await authClient.signOut();
		goto('/', { invalidateAll: true });
	}
</script>

<header
	class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
>
	<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
		<Sidebar.Trigger class="-ml-1" />
		<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
		<h1 class="text-base font-medium">Dashboard</h1>
		<div class="ml-auto flex items-center gap-2">
			<Darkmode />
			{#if page.data.session}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => handleSignOut()}
					class="dark:text-foreground hidden sm:flex"
				>
					Sign out
				</Button>
			{:else}
				<Button
					href={route('/auth/sign-in')}
					variant="ghost"
					size="sm"
					class="dark:text-foreground hidden sm:flex"
				>
					Auth
				</Button>
			{/if}
		</div>
	</div>
</header>
