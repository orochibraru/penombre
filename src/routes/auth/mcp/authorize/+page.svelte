<script lang="ts">
	import { BotIcon } from "@lucide/svelte";
	import * as Alert from "#lib/components/ui/alert/index.js";
	import Button from "#lib/components/ui/button/button.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { page } from "$app/state";

	const { data, form } = $props();

	const problem = $derived(form?.problem ?? data.problem);
	const query = $derived(page.url.searchParams.toString());
</script>

<div class="flex flex-col gap-6">
    <div class="flex flex-col items-center gap-2 text-center">
        <div
            class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg"
        >
            <BotIcon class="size-5" />
        </div>
        {#if data.client}
            <h1 class="text-2xl font-bold">
                {m.mcp_authorize_title({ client: data.client.name })}
            </h1>
            <p class="text-muted-foreground font-mono text-xs">
                {data.client.host} → {data.client.redirectHost}
            </p>
        {/if}
    </div>

    {#if problem || !data.client}
        <Alert.Root variant="destructive">
            <Alert.Title>{m.error_title()}</Alert.Title>
            <Alert.Description>
                {m.mcp_authorize_invalid()}
                <code class="mt-1 block text-xs">{problem}</code>
            </Alert.Description>
        </Alert.Root>
    {:else}
        <p class="text-muted-foreground text-center text-sm text-balance">
            {m.mcp_authorize_description()}
        </p>
        <!-- Plain POSTs: the answer is a redirect to the client, which fetch cannot follow. -->
        <form method="POST" class="grid grid-cols-2 gap-3">
            <Button type="submit" variant="outline" formaction="?/deny&{query}">
                {m.device_deny()}
            </Button>
            <Button type="submit" formaction="?/approve&{query}">
                {m.device_approve()}
            </Button>
        </form>
    {/if}
</div>
