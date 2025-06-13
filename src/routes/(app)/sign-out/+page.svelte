<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { onMount } from 'svelte';

	onMount(async () => {
		await authClient.signOut();
		goto('/', { invalidateAll: true });
	});
</script>

<h2>Signing you out...</h2>
