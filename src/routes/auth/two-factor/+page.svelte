<script lang="ts">
	import { ShieldCheckIcon } from "@lucide/svelte";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { authClient } from "$lib/auth-client";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { m } from "$lib/paraglide/messages.js";

	/**
	 * The second step of a sign-in that needs another factor.
	 *
	 * Reached by better-auth's `onTwoFactorRedirect`, at which point the
	 * session is half-established: the password was right, but nothing is
	 * usable until a code lands.
	 */
	let code = $state("");
	let useBackup = $state(false);
	let trustDevice = $state(false);
	let loading = $state(false);
	let errorMessage = $state("");

	async function verify() {
		loading = true;
		errorMessage = "";

		const { error } = useBackup
			? await authClient.twoFactor.verifyBackupCode({ code })
			: await authClient.twoFactor.verifyTotp({ code, trustDevice });

		loading = false;
		if (error) {
			errorMessage = error.message || m.two_factor_invalid();
			return;
		}
		await goto(resolve("/"), { replaceState: true, invalidateAll: true });
	}
</script>

<form
    class="flex flex-col gap-6"
    onsubmit={(event) => {
        event.preventDefault();
        void verify();
    }}
>
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-2 text-center">
                <div
                    class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-lg"
                >
                    <ShieldCheckIcon class="size-5" />
                </div>
                <h1 class="text-2xl font-bold">{m.two_factor_title()}</h1>
                <p class="text-muted-foreground text-sm text-balance">
                    {useBackup
                        ? m.two_factor_backup_description()
                        : m.two_factor_description()}
                </p>
            </div>

            {#if errorMessage}
                <Alert.Root variant="destructive">
                    <Alert.Title>{m.error_title()}</Alert.Title>
                    <Alert.Description>{errorMessage}</Alert.Description>
                </Alert.Root>
            {/if}

            <Field.Field>
                <Field.Label for="code">
                    {useBackup ? m.two_factor_backup_code() : m.two_factor_code()}
                </Field.Label>
                <Input
                    id="code"
                    bind:value={code}
                    inputmode={useBackup ? "text" : "numeric"}
                    autocomplete="one-time-code"
                    placeholder={useBackup ? "XXXXX-XXXXX" : "123456"}
                    required
                />
            </Field.Field>

            {#if !useBackup}
                <Label class="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        bind:checked={trustDevice}
                        class="accent-primary size-3.5"
                    />
                    {m.two_factor_trust_device()}
                </Label>
            {/if}

            <Field.Field>
                <Button class="w-full" type="submit" {loading}>
                    {m.two_factor_verify()}
                </Button>
            </Field.Field>

            <button
                type="button"
                class="hover:text-primary text-sm underline transition-colors"
                onclick={() => {
                    useBackup = !useBackup;
                    code = "";
                    errorMessage = "";
                }}
            >
                {useBackup ? m.two_factor_use_app() : m.two_factor_use_backup()}
            </button>
        </Field.Group>
    </Field.FieldSet>
</form>
