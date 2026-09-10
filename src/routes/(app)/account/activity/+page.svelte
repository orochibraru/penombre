<script lang="ts">
	import { onMount } from "svelte";
	import ActivityLog from "$lib/components/activity-log.svelte";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_account_activity());
	});

	const { data } = $props();
</script>

<ActivityLog entries={data.activity ?? []} empty={m.no_recent_activity()} />
