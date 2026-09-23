<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { authClient } from "#lib/auth-client.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import * as Field from "#lib/components/ui/field/index.js";
	import Input from "#lib/components/ui/input/input.svelte";
	import { deserializeAction } from "#lib/forms.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { cn } from "#lib/utils.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";

	let { data } = $props();

	let loading: boolean = $state(false);
	let email: string = $state("");
	let password: string = $state("");
	let error: boolean = $state(false);
	let errorMessage: string = $state("");

	/** The last account signed in on this device, to skip the email step. */
	const REMEMBERED = "penombre:sign-in-email";

	function remember(address: string | undefined) {
		try {
			if (address) {
				localStorage.setItem(REMEMBERED, address);
			} else {
				localStorage.removeItem(REMEMBERED);
			}
		} catch {
			// Storage blocked: the device simply does not remember.
		}
	}

	onMount(() => {
		title.set(m.sign_in());
		let saved: string | null = null;
		try {
			saved = localStorage.getItem(REMEMBERED);
		} catch {
			saved = null;
		}
		if (saved && data.authConfig.enableEmailSignIn) {
			email = saved;
			void lookupEmail(true);
		}
	});

	/** The WebAuthn prompt was dismissed or blocked, not a server failure. */
	const isCancel = (code: string | undefined) =>
		code === "AUTH_CANCELLED" || !!code?.startsWith("ERROR_");

	async function handlePasskeySignIn() {
		// `window.PublicKeyCredential` is the real support check. The old one
		// awaited nothing — `isConditionalMediationAvailable()` returns a
		// promise, which is always truthy, so it never caught anything.
		if (typeof PublicKeyCredential === "undefined") {
			toast.error(m.toast_passkey_not_supported());
			return;
		}
		loading = true;
		// No `autoFill`: that is conditional mediation, which only surfaces
		// through an `autocomplete="webauthn"` field and shows nothing when a
		// button is clicked. This is the deliberate, modal ceremony.
		const { data: signedIn, error: err } = await authClient.signIn.passkey();
		loading = false;

		if (err) {
			// A cancel, or a browser refusing a prompt nobody clicked for: the
			// passkey button is still there to try again.
			if ("code" in err && isCancel(err.code)) {
				return;
			}
			error = true;
			// The inline alert below is this flow's only surface; no toast, so
			// the same failure is not said twice.
			errorMessage = mapAuthError("code" in err ? err.code : undefined);
			return;
		}

		remember(signedIn?.user?.email ?? (email || undefined));
		toast.success(m.signed_in_success());
		goto(resolve("/(app)"), { replace: true, refreshAll: true });
	}

	const defaultErrorMessage = m.sign_in_error();

	/**
	 * better-auth's own error messages are English prose meant for a
	 * developer console, not a translated UI; and they used to reach fr/de/es
	 * visitors verbatim. `code` is the stable, localizable part; only a few
	 * are reachable from this page, so anything else falls back to the
	 * generic message rather than growing an exhaustive table nobody keeps
	 * in sync with better-auth's own list.
	 */
	function mapAuthError(code: string | undefined): string {
		switch (code) {
			case "INVALID_EMAIL_OR_PASSWORD":
			case "INVALID_PASSWORD":
				return m.sign_in_error_invalid_credentials();
			case "EMAIL_NOT_VERIFIED":
				return m.sign_in_error_email_not_verified();
			case "USER_NOT_FOUND":
			case "USER_EMAIL_NOT_FOUND":
				return m.sign_in_error_user_not_found();
			case "INVALID_TOKEN":
			case "TOKEN_EXPIRED":
				return m.sign_in_error_invalid_token();
			case "PROVIDER_NOT_FOUND":
				return m.sign_in_error_provider_not_found();
			default:
				return defaultErrorMessage;
		}
	}

	function handleOauthSignin(provider: string) {
		loading = true;
		// The toast is this flow's only surface; the message is already
		// translated at the throw site, in `oauthSignInPromise`.
		return toast.promise(oauthSignInPromise(provider), {
			loading: m.signing_in_with_provider({ provider }),
			success: m.redirecting_to_provider({ provider }),
			error: (e) => {
				loading = false;
				return e instanceof Error ? e.message : defaultErrorMessage;
			},
		});
	}

	function handleEmailSignin() {
		loading = true;
		// The toast is this flow's only surface; the message is already
		// translated at the throw site, in `emailSignInPromise`.
		return toast.promise(emailSignInPromise(), {
			loading: m.signing_in(),
			success: m.signed_in_success(),
			error: (e) => {
				loading = false;
				return e instanceof Error ? e.message : defaultErrorMessage;
			},
		});
	}

	async function oauthSignInPromise(provider: string) {
		const res = await authClient.signIn.social({
			provider,
		});
		if (res.error) {
			throw new Error(mapAuthError(res.error.code));
		}
		if (res.data.url) {
			window.location.href = res.data.url;
		}
	}

	/** True once the address has been resolved to an existing account. */
	let knownEmail = $state(false);

	/** Set once a code has been mailed, which swaps the password field out. */
	let otpSent = $state(false);
	let otp = $state("");

	type Method = "password" | "passkey" | "magicLink" | "emailOtp";
	/** What this account can use, and the one it asked to see first. */
	let methods = $state<Method[]>([]);
	let preferred = $state<Method | null>(null);
	let showAll = $state(false);

	const focused = $derived(knownEmail && !!preferred && !showAll);
	const offers = (method: Method) =>
		knownEmail &&
		methods.includes(method) &&
		(!focused || preferred === method);
	const showPassword = $derived(knownEmail && !otpSent && offers("password"));
	const showPasskey = $derived(
		data.authConfig.enablePasskeySignIn &&
			(!focused || preferred === "passkey"),
	);

	function forgetAccount() {
		knownEmail = false;
		password = "";
		otpSent = false;
		otp = "";
		methods = [];
		preferred = null;
		showAll = false;
		remember(undefined);
	}

	/**
	 * Mail a one-time link. The callback lands on the app, and better-auth
	 * inserts the two-factor challenge itself when the account requires one.
	 */
	async function magicLinkSignIn() {
		const { error: err } = await authClient.signIn.magicLink({
			email,
			callbackURL: "/",
		});
		if (err) {
			throw new Error(mapAuthError(err.code));
		}
	}

	function handleMagicLink() {
		if (!email) {
			return;
		}
		// The link signs in on whichever tab opens it, not here.
		remember(email);
		loading = true;
		// The toast is this flow's only surface; the message is already
		// translated at the throw site, in `magicLinkSignIn`.
		return toast.promise(magicLinkSignIn(), {
			loading: m.sign_in_sending_link(),
			success: () => {
				loading = false;
				return m.sign_in_link_sent();
			},
			error: (e) => {
				loading = false;
				return e instanceof Error ? e.message : defaultErrorMessage;
			},
		});
	}

	async function sendOtp() {
		const { error: err } = await authClient.emailOtp.sendVerificationOtp({
			email,
			type: "sign-in",
		});
		if (err) {
			throw new Error(mapAuthError(err.code));
		}
		otpSent = true;
	}

	function handleSendOtp() {
		if (!email) {
			return;
		}
		loading = true;
		return toast.promise(sendOtp(), {
			loading: m.sign_in_sending_code(),
			success: () => {
				loading = false;
				return m.sign_in_code_sent();
			},
			error: (e) => {
				loading = false;
				return e instanceof Error ? e.message : defaultErrorMessage;
			},
		});
	}

	async function otpSignInPromise() {
		const { error: err } = await authClient.signIn.emailOtp({ email, otp });
		if (err) {
			throw new Error(mapAuthError(err.code));
		}
		remember(email);
		goto(resolve("/(app)"), { replace: true, refreshAll: true });
	}

	function handleOtpSignin() {
		loading = true;
		return toast.promise(otpSignInPromise(), {
			loading: m.signing_in(),
			success: m.signed_in_success(),
			error: (e) => {
				loading = false;
				return e instanceof Error ? e.message : defaultErrorMessage;
			},
		});
	}

	/**
	 * Resolve what to ask for next.
	 *
	 * An account with no credential is one an admin registered, so it goes to
	 * onboarding to choose a password rather than being asked for one.
	 */
	async function lookupEmail(remembered = false) {
		if (!email) {
			return;
		}
		loading = true;
		error = false;
		try {
			const body = new FormData();
			body.set("email", email);
			const res = await fetch("?/lookup", {
				method: "POST",
				body,
				headers: { accept: "application/json" },
			});
			const payload = deserializeAction(await res.text());

			if (payload.type === "failure") {
				// A remembered account that is gone: start over quietly.
				if (remembered) {
					email = "";
					remember(undefined);
					return;
				}
				error = true;
				errorMessage =
					(payload.data?.error as string | undefined) ?? m.sign_in_error();
				return;
			}
			if (payload.type !== "success") {
				return;
			}

			const step = payload.data?.step;
			if (step === "onboarding") {
				// Onboarding now needs the token from the admin's invite link;
				// this address alone cannot reach it any more.
				error = true;
				errorMessage = m.sign_in_pending_invite();
				return;
			}
			methods = (payload.data?.methods as Method[] | undefined) ?? [];
			preferred = (payload.data?.preferred as Method | null) ?? null;
			showAll = false;
			knownEmail = true;
			if (preferred === "passkey") {
				loading = false;
				void handlePasskeySignIn();
			}
		} catch (e) {
			error = true;
			errorMessage = e instanceof Error ? e.message : m.sign_in_error();
		} finally {
			loading = false;
		}
	}

	async function emailSignInPromise() {
		if (!(email && password)) {
			throw new Error(m.email_password_required());
		}
		const res = await authClient.signIn.email({ email, password });
		if (res.error) {
			throw new Error(mapAuthError(res.error.code));
		}

		remember(email);
		goto(resolve("/(app)"), { replace: true, refreshAll: true });
	}
</script>

<form
    class={cn("flex flex-col gap-6")}
    onsubmit={(e) => {
        e.preventDefault();
        if (otpSent) {
            handleOtpSignin();
        } else if (showPassword) {
            handleEmailSignin();
        } else {
            void lookupEmail();
        }
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
                    <!-- Once the address is settled it is locked, and the way
                         back sits on the label row so the two fields stay
                         adjacent instead of being pushed apart by a link. -->
                    <div class="flex items-center">
                        <Field.Label for="email">{m.email()}</Field.Label>
                        {#if knownEmail}
                            <button
                                type="button"
                                class="hover:text-primary ms-auto text-sm underline transition-colors"
                                onclick={forgetAccount}
                            >
                                {m.sign_in_change_email()}
                            </button>
                        {/if}
                    </div>
                    <Input
                        id="email"
                        autocomplete="email webauthn"
                        type="email"
                        bind:value={email}
                        placeholder="m@example.com"
                        disabled={knownEmail}
                        required={!knownEmail}
                    />
                </Field.Field>
                {#if !knownEmail}
                    <Field.Field>
                        <Button class="w-full" type="submit" {loading}>
                            {m.continue()}
                        </Button>
                    </Field.Field>
                {/if}
                <!-- Hidden until the address is known. `required` is bound to
                     the same flag: a hidden required control blocks submit. -->
                <Field.Field class={showPassword ? "" : "hidden"}>
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
                        required={showPassword}
                    />
                </Field.Field>
                <Field.Field class={showPassword ? "" : "hidden"}>
                    <Button class="w-full" type="submit" {loading}>
                        {m.sign_in()}
                    </Button>
                </Field.Field>

                <!-- The emailed code replaces the password step rather than
                     sitting beside it: two submit paths in one form is how the
                     wrong one ends up firing. -->
                {#if otpSent}
                    <Field.Field>
                        <Field.Label for="otp">{m.sign_in_code()}</Field.Label>
                        <Input
                            id="otp"
                            inputmode="numeric"
                            autocomplete="one-time-code"
                            bind:value={otp}
                            placeholder="123456"
                            required
                        />
                        <Field.Description>
                            {m.sign_in_code_hint({ email })}
                        </Field.Description>
                    </Field.Field>
                    <Field.Field>
                        <Button class="w-full" type="submit" {loading}>
                            {m.sign_in()}
                        </Button>
                    </Field.Field>
                {/if}

                {#if offers("magicLink") || offers("emailOtp")}
                    <div class="flex flex-col gap-2">
                        {#if offers("magicLink")}
                            <Button
                                type="button"
                                variant="outline"
                                class="w-full"
                                {loading}
                                onclick={handleMagicLink}
                            >
                                {m.sign_in_email_link()}
                            </Button>
                        {/if}
                        {#if offers("emailOtp") && !otpSent}
                            <Button
                                type="button"
                                variant="outline"
                                class="w-full"
                                {loading}
                                onclick={handleSendOtp}
                            >
                                {m.sign_in_email_code()}
                            </Button>
                        {/if}
                    </div>
                {/if}
                {#if !focused && data.authConfig.enableOAuthSignIn && data.authConfig.oauthProviders.length > 0}
                    <Field.Separator>{m.or_continue_with()}</Field.Separator>
                {/if}
            {:else}
                <!-- Hidden fields for passkey sign-in -->
                <label class="sr-only" for="name">Username:</label>
                <input
                    class="sr-only"
                    type="text"
                    name="name"
                    autocomplete="username webauthn"
                />
                <label class="sr-only" for="password">Password:</label>
                <input
                    class="sr-only"
                    type="password"
                    name="password"
                    autocomplete="current-password webauthn"
                />
            {/if}
            {#if !focused && data.authConfig.enableOAuthSignIn && data.authConfig.oauthProviders.length > 0}
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
            {#if showPasskey}
                <Button
                    variant={focused ? "default" : "outline"}
                    class="w-full"
                    {loading}
                    onclick={handlePasskeySignIn}
                >
                    {m.sign_in_with_passkey()}
                </Button>
            {/if}
            {#if focused}
                <button
                    type="button"
                    class="hover:text-primary text-sm underline transition-colors"
                    onclick={() => (showAll = true)}
                >
                    {m.sign_in_more_ways()}
                </button>
            {/if}
        </Field.Group>
    </Field.FieldSet>
    <div class="grid gap-6">
        <div class="text-center text-sm">
            {m.no_account()}
        </div>
    </div>
</form>
