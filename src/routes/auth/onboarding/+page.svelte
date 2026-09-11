<script lang="ts">
	import { KeyRoundIcon } from "@lucide/svelte";
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
    action="?/setPassword"
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
                    <KeyRoundIcon class="size-5" />
                </div>
                <h1 class="text-2xl font-bold">{m.onboarding_password_title()}</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    {m.onboarding_password_description({ email: data.email })}
                </p>
            </div>

            {#if form?.error}
                <Alert.Root variant="destructive">
                    <Alert.Title>{m.error_title()}</Alert.Title>
                    <Alert.Description>{form.error}</Alert.Description>
                </Alert.Root>
            {/if}

            <input type="hidden" name="email" value={data.email} />

            <Field.Field>
                <Field.Label for="password">{m.new_password()}</Field.Label>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    autocomplete="new-password"
                    minlength={data.minLength}
                    required
                />
                <p class="text-muted-foreground text-xs">
                    {m.onboarding_password_rules({
                        count: String(data.minLength),
                    })}
                    {#if data.requireStrong}
                        {m.onboarding_password_strong()}
                    {/if}
                </p>
            </Field.Field>

            <Field.Field>
                <Field.Label for="confirm">{m.confirm_new_password()}</Field.Label>
                <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    autocomplete="new-password"
                    required
                />
            </Field.Field>

            <Field.Field>
                <Button class="w-full" type="submit" {loading}>
                    {m.onboarding_password_submit()}
                </Button>
            </Field.Field>
        </Field.Group>
    </Field.FieldSet>
</form>
