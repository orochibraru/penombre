<script lang="ts">
	import { ShieldPlusIcon } from "@lucide/svelte";
	import { enhance } from "$app/forms";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input";
	import { m } from "$lib/paraglide/messages.js";

	const { data, form } = $props();

	let loading = $state(false);
</script>

<form
    method="POST"
    action="?/create"
    class="flex flex-col gap-6"
    use:enhance={() => {
        loading = true;
        return async ({ update }) => {
            await update();
            loading = false;
        };
    }}
>
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-2 text-center">
                <div
                    class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg"
                >
                    <ShieldPlusIcon class="size-5" />
                </div>
                <h1 class="text-2xl font-bold">{m.setup_title()}</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    {m.setup_description()}
                </p>
            </div>

            {#if form?.error}
                <Alert.Root variant="destructive">
                    <Alert.Title>{m.error_title()}</Alert.Title>
                    <Alert.Description>{form.error}</Alert.Description>
                </Alert.Root>
            {/if}

            <Field.Field>
                <Field.Label for="setup-email">{m.email()}</Field.Label>
                <Input
                    id="setup-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    placeholder="you@example.com"
                    required
                />
            </Field.Field>

            <Field.Field>
                <Field.Label for="setup-name">{m.setup_name()}</Field.Label>
                <Input
                    id="setup-name"
                    name="name"
                    autocomplete="name"
                    placeholder={m.setup_name_placeholder()}
                />
            </Field.Field>

            <Field.Field>
                <Field.Label for="setup-password">{m.password()}</Field.Label>
                <Input
                    id="setup-password"
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    minlength={data.minPasswordLength}
                    required
                />
                <Field.Description>
                    {m.setup_password_hint({
                        count: String(data.minPasswordLength),
                    })}
                </Field.Description>
            </Field.Field>

            <Field.Field>
                <Field.Label for="setup-password-confirm">
                    {m.confirm_new_password()}
                </Field.Label>
                <Input
                    id="setup-password-confirm"
                    name="passwordConfirm"
                    type="password"
                    autocomplete="new-password"
                    minlength={data.minPasswordLength}
                    required
                />
            </Field.Field>

            <Field.Field>
                <Button class="w-full" type="submit" {loading}>
                    {m.setup_submit()}
                </Button>
            </Field.Field>
        </Field.Group>
    </Field.FieldSet>
</form>
