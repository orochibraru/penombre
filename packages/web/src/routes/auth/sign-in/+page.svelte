<script lang="ts">
    import { toast } from "svelte-sonner";
    import { goto } from "$app/navigation";
    import * as Alert from "$lib/components/ui/alert/index";
    import { Button } from "$lib/components/ui/button/index";
    import { title } from "$lib/store/title";
    import { cn } from "$lib/utils.js";
    import { authClient } from "$lib/auth-client";
    import Input from "$lib/components/ui/input/input.svelte";
    import * as Field from "$lib/components/ui/field/index.js";
    import { resolve } from "$app/paths";

    import { onMount } from "svelte";
    import { m } from "$lib/paraglide/messages.js";

    let { data } = $props();

    let loading: boolean = $state(false);
    let email: string = $state("");
    let password: string = $state("");
    let error: boolean = $state(false);
    let errorMessage: string = $state("");

    onMount(() => {
        title.set(m.sign_in());
    });

    async function passkeySignIn() {
        if (
            !PublicKeyCredential.isConditionalMediationAvailable ||
            !PublicKeyCredential.isConditionalMediationAvailable()
        ) {
            toast.error("Passkey not supported");
            return;
        }
        loading = true;
        const { error } = await authClient.signIn.passkey({
            autoFill: true,
        });

        if (error) {
            loading = false;
            throw new Error(error.message ?? "Error signing in with passkey");
        }

        goto(resolve("/"), { replaceState: true, invalidateAll: true });
    }

    async function handlePasskeySignIn() {
        return toast.promise(passkeySignIn(), {
            loading: m.signing_in_with_passkey(),
            success: m.signed_in_success(),
            error: (e) => {
                loading = false;
                errorMessage = defaultErrorMessage;

                if (e instanceof Error) {
                    errorMessage = e.message;
                    return e.message;
                }

                return defaultErrorMessage;
            },
        });
    }

    const defaultErrorMessage = m.sign_in_error();

    async function handleOauthSignin(provider: string) {
        loading = true;
        return toast.promise(oauthSignInPromise(provider), {
            loading: m.signing_in_with_provider({ provider }),
            success: m.redirecting_to_provider({ provider }),
            error: (e) => {
                loading = false;
                errorMessage = defaultErrorMessage;

                if (e instanceof Error) {
                    errorMessage = e.message;
                    return e.message;
                }
                return defaultErrorMessage;
            },
        });
    }

    async function handleEmailSignin() {
        loading = true;
        return toast.promise(emailSignInPromise(), {
            loading: m.signing_in(),
            success: m.signed_in_success(),
            error: (e) => {
                loading = false;
                errorMessage = defaultErrorMessage;

                if (e instanceof Error) {
                    errorMessage = e.message;
                    return e.message;
                }

                return defaultErrorMessage;
            },
        });
    }

    async function oauthSignInPromise(provider: string) {
        try {
            const res = await authClient.signIn.oauth2({
                providerId: provider,
            });
            if (res.error) {
                error = true;
                console.error(res.error);
                throw new Error(
                    res.error.message || "Error signing in with OAuth2",
                );
            }
            if (res.data.url) {
                goto(res.data.url, { replaceState: true, invalidateAll: true });
            }
        } catch (e) {
            console.error(e);
            error = true;
            throw e;
        }
    }

    async function emailSignInPromise() {
        if (!email || !password) {
            throw new Error(m.email_password_required());
        }
        try {
            const res = await authClient.signIn.email({ email, password });
            if (res.error) {
                error = true;
                console.error(res.error);
                throw new Error(
                    res.error.message ||
                        "Error signing in with email and password",
                );
            }

            goto(resolve("/"), { replaceState: true, invalidateAll: true });
        } catch (e) {
            error = true;
            console.error(e);
            throw e;
        }
    }
</script>

<form
    class={cn("flex flex-col gap-6")}
    onsubmit={(e) => {
        e.preventDefault();
        handleEmailSignin();
    }}
    method="POST"
>
    <Field.FieldSet>
        <Field.Group>
            <div class="flex flex-col items-center gap-1 text-center">
                <h1 class="text-2xl font-bold">
                    {m.sign_in_message()}
                </h1>
                {#if data.authConfig.enableEmailSignIn}
                    <p class="text-muted-foreground text-sm text-balance">
                        {m.sign_in_email_description()}
                    </p>
                {:else if data.authConfig.oauthProviders.length > 0 && data.authConfig.enableOAuthSignIn}
                    <p class="text-muted-foreground text-sm text-balance">
                        {m.sign_in_oauth_description()}
                    </p>
                {/if}
            </div>
            {#if error}
                <Alert.Root class="mb-2" variant="destructive">
                    <Alert.Title>{m.error_title()}</Alert.Title>
                    <Alert.Description>
                        {errorMessage}
                    </Alert.Description>
                </Alert.Root>
            {/if}

            {#if data.authConfig.enableEmailSignIn}
                <Field.Field>
                    <Field.Label for="email">{m.email()}</Field.Label>
                    <Input
                        id="email"
                        autocomplete="email webauthn"
                        type="email"
                        bind:value={email}
                        placeholder="m@example.com"
                        required
                    />
                </Field.Field>
                <Field.Field>
                    <div class="flex items-center">
                        <Field.Label for="password">{m.password()}</Field.Label>
                        <a
                            href={"/auth/forgot-password"}
                            class="ms-auto text-sm underline hover:text-primary transition-colors"
                        >
                            {m.forgot_password()}
                        </a>
                    </div>
                    <Input
                        id="password"
                        autocomplete="current-password webauthn"
                        bind:value={password}
                        type="password"
                        required
                    />
                </Field.Field>
                <Field.Field>
                    <Button class="w-full" type="submit" {loading}>
                        {m.sign_in()}
                    </Button>
                </Field.Field>
                {#if data.authConfig.enableOAuthSignIn && data.authConfig.oauthProviders.length > 0}
                    <Field.Separator>{m.or_continue_with()}</Field.Separator>
                {/if}
            {/if}
            {#if data.authConfig.enableOAuthSignIn && data.authConfig.oauthProviders.length > 0}
                {#each data.authConfig.oauthProviders as provider}
                    {#if provider.enabled}
                        <Button
                            variant="outline"
                            class="w-full"
                            {loading}
                            onclick={() => handleOauthSignin(provider.name)}
                        >
                            {#if !data.authConfig.enableEmailSignIn}
                                {m.continue_with()}
                            {/if}
                            {provider.prettyName ?? provider.name}
                        </Button>
                    {/if}
                {/each}
            {/if}
            <Button
                variant="outline"
                class="w-full"
                {loading}
                onclick={handlePasskeySignIn}
            >
                Sign in with a passkey
            </Button>
        </Field.Group>
    </Field.FieldSet>
    <div class="grid gap-6">
        <div class="text-center text-sm">
            {m.no_account()}
        </div>
    </div>
</form>
