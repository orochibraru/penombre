<script lang="ts">
	import { SmartphoneIcon } from "@lucide/svelte";
	import * as Alert from "#lib/components/ui/alert/index.js";
	import Button from "#lib/components/ui/button/button.svelte";
	import { m } from "#lib/paraglide/messages.js";
	import { page } from "$app/state";

	const { data, form } = $props();
</script>

<div class="flex flex-col gap-6">
    <div class="flex flex-col items-center gap-2 text-center">
        <div
            class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg"
        >
            <SmartphoneIcon class="size-5" />
        </div>
        {#if data.device}
            <h1 class="text-2xl font-bold">
                {m.mobile_authorize_title({ device: data.device })}
            </h1>
        {/if}
    </div>

    {#if !data.device || form?.invalid}
        <Alert.Root variant="destructive">
            <Alert.Title>{m.error_title()}</Alert.Title>
            <Alert.Description>{m.mobile_authorize_invalid()}</Alert.Description>
        </Alert.Root>
    {:else}
        <p class="text-muted-foreground text-center text-sm text-balance">
            {m.mobile_authorize_description()}
        </p>
        <!-- A plain POST: the answer is a redirect to the app's scheme, which fetch cannot follow. -->
        <form method="POST" action="?/approve&{page.url.searchParams.toString()}">
            <Button type="submit" class="w-full">{m.device_approve()}</Button>
        </form>
    {/if}
</div>
