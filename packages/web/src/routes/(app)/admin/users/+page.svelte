<script lang="ts">
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_admin_users());
    });

    const { data } = $props();
</script>

<h2 class="text-lg font-medium">{m.user_management()}</h2>
<p>
    This instance currently has {data.users.total} user{data.users.total === 1
        ? ""
        : "s"}.
</p>

<ul>
    {#each data.users.users as user}
        <li>{user.name} - {user.email}</li>
    {/each}
</ul>
