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
    import { route } from "$lib/ROUTES";
    import { onMount } from "svelte";

    let { data } = $props();

    let loading: boolean = $state(false);
    let email: string = $state("");
    let password: string = $state("");
    let error: boolean = $state(false);
    let errorMessage: string = $state("");

    onMount(() => {
        title.set("Sign In");
    });

    const defaultErrorMessage =
        "There was an error when signing in. Please try again.";

    async function handleOauthSignin(provider: string) {
        loading = true;
        return toast.promise(oauthSignInPromise(provider), {
            loading: `Signing in with ${provider}...`,
            success: `Redirecting to ${provider}...`,
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
            loading: "Signing in...",
            success: "Signed in successfully!",
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
            console.log(res.data);
            if (res.data.url) {
                goto(res.data.url);
            }
        } catch (e) {
            console.error(e);
            error = true;
            throw e;
        }
    }

    async function emailSignInPromise() {
        if (!email || !password) {
            throw new Error("Email and password are required");
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

            goto(route("/"));
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
                <h1 class="text-2xl font-bold">Login to your account</h1>
                {#if data.authConfig.enableEmailSignIn}
                    <p class="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                    </p>
                {:else if data.authConfig.oauthProviders.length > 0 && data.authConfig.enableOAuthSignIn}
                    <p class="text-muted-foreground text-sm text-balance">
                        Choose one of the providers below to login to your
                        account
                    </p>
                {/if}
            </div>
            {#if error}
                <Alert.Root class="mb-2" variant="destructive">
                    <Alert.Title>Oops.</Alert.Title>
                    <Alert.Description>
                        {errorMessage}
                    </Alert.Description>
                </Alert.Root>
            {/if}
            {#if data.authConfig.enableEmailSignIn}
                <Field.Field>
                    <Field.Label for="email">Email</Field.Label>
                    <Input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="m@example.com"
                        required
                    />
                </Field.Field>
                <Field.Field>
                    <div class="flex items-center">
                        <Field.Label for="password">Password</Field.Label>
                        <a
                            href={route("/auth/forgot-password")}
                            class="ms-auto text-sm underline hover:text-primary transition-colors"
                        >
                            Forgot your password?
                        </a>
                    </div>
                    <Input
                        id="password"
                        bind:value={password}
                        type="password"
                        required
                    />
                </Field.Field>
                <Field.Field>
                    <Button class="w-full" type="submit" {loading}>
                        Submit
                    </Button>
                </Field.Field>
                {#if data.authConfig.oauthProviders.length > 0}
                    <Field.Separator>Or continue with</Field.Separator>
                {/if}
            {/if}
            {#if data.authConfig.oauthProviders.length > 0}
                {#each data.authConfig.oauthProviders as provider}
                    {#if provider.enabled}
                        <Button
                            variant="outline"
                            class="w-full"
                            {loading}
                            onclick={() => handleOauthSignin(provider.name)}
                        >
                            {#if !data.authConfig.enableEmailSignIn}
                                Continue with
                            {/if}
                            {provider.prettyName ?? provider.name}
                        </Button>
                    {/if}
                {/each}
            {/if}
        </Field.Group>
    </Field.FieldSet>
    <div class="grid gap-6">
        <div class="text-center text-sm">
            Don&apos;t have an account? Too bad.
        </div>
    </div>
</form>
