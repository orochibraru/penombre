<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Account - Sessions");
    });

    const { data } = $props();
</script>

<h2 class="text-lg font-medium">Session Management</h2>
<ul>
    {#each data.sessions as session}
        <li>
            {session.ipAddress} - Last active: {new Date(
                session.createdAt,
            ).toLocaleString()}
        </li>
    {/each}
</ul>
