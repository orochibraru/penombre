<script lang="ts">
	import { LaptopIcon } from "@lucide/svelte";
	import * as Alert from "#lib/components/ui/alert/index.js";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Field from "#lib/components/ui/field/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { enhance } from "#lib/forms.js";
	import { m } from "#lib/paraglide/messages.js";

	const { data, form } = $props();

	let loading = $state(false);
</script>

<div class="flex flex-col gap-6">
    <div class="flex flex-col items-center gap-2 text-center">
        <div
            class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg"
        >
            <LaptopIcon class="size-5" />
        </div>
        <h1 class="text-2xl font-bold">{m.device_title()}</h1>
    </div>

    {#if form?.decision === "approved"}
        <p class="text-center text-sm">{m.device_approved()}</p>
    {:else if form?.decision === "denied"}
        <p class="text-center text-sm">{m.device_denied()}</p>
    {:else if !data.userCode}
        <form method="GET" class="flex flex-col gap-4">
            <Field.Field>
                <Field.Label for="device-code">{m.device_code_label()}</Field.Label>
                <Input
                    id="device-code"
                    name="user_code"
                    autocomplete="off"
                    autocapitalize="characters"
                    class="text-center font-mono tracking-widest"
                    required
                />
            </Field.Field>
            <Button type="submit">{m.device_continue()}</Button>
        </form>
    {:else if !data.pending || form?.invalid}
        <Alert.Root variant="destructive">
            <Alert.Title>{m.error_title()}</Alert.Title>
            <Alert.Description>{m.device_invalid()}</Alert.Description>
        </Alert.Root>
    {:else}
        <p class="text-muted-foreground text-center text-sm text-balance">
            {m.device_description()}
        </p>
        <p
            class="bg-muted rounded-lg py-3 text-center font-mono text-2xl tracking-widest"
        >
            {data.userCode}
        </p>
        <form
            method="POST"
            class="grid grid-cols-2 gap-3"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update();
                    loading = false;
                };
            }}
        >
            <input type="hidden" name="userCode" value={data.userCode} />
            <Button
                type="submit"
                variant="outline"
                formaction="?/deny"
                disabled={loading}
            >
                {m.device_deny()}
            </Button>
            <Button type="submit" formaction="?/approve" disabled={loading}>
                {m.device_approve()}
            </Button>
        </form>
    {/if}
</div>
