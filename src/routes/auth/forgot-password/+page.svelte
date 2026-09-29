<script lang="ts">
	import { cn } from "tailwind-variants";
	import * as Alert from "#lib/components/ui/alert/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import Input from "#lib/components/ui/input/input.svelte";
	import { enhance } from "#lib/forms.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { page } from "$app/state";

	const { data, form } = $props();
	$title = m.forgot_password_title();

	let loading = $state(false);
	const initial = page.url.searchParams.get("email") ?? "";
</script>

<form
    class={cn("flex flex-col gap-6")}
    method="POST"
    use:enhance={() => {
        loading = true;
        return async ({ update }) => {
            await update({ reset: false });
            loading = false;
        };
    }}
>
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-1 text-center">
                <h1 class="text-2xl font-bold">{m.forgot_password_title()}</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    {m.forgot_password_description()}
                </p>
            </div>
            {#if form?.sent}
                <Alert.Root>
                    <Alert.Description>
                        {m.password_link_sent({ email: form.sent })}
                    </Alert.Description>
                </Alert.Root>
            {:else if !data.canMail || form?.unavailable}
                <Alert.Root variant="destructive">
                    <Alert.Description>
                        {m.password_link_unavailable()}
                    </Alert.Description>
                </Alert.Root>
            {:else if form?.limited}
                <Alert.Root variant="destructive">
                    <Alert.Description>{m.password_link_limited()}</Alert.Description>
                </Alert.Root>
            {/if}
            <Field.Field>
                <Field.Label for="email">{m.email()}</Field.Label>
                <Input
                    autocomplete="email"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    value={initial}
                    required
                />
            </Field.Field>
            <Field.Field>
                <Button
                    class="w-full"
                    type="submit"
                    {loading}
                    disabled={!data.canMail}
                >
                    {m.reset_password()}
                </Button>
            </Field.Field>
        </Field.Group>
    </Field.FieldSet>
    <div class="text-center text-sm">
        <p>
            {m.remembered_password()}
            <a
                href={"/auth/sign-in"}
                class="underline hover:text-primary transition-colors"
            >
                {m.sign_in()}
            </a>
        </p>
    </div>
</form>
