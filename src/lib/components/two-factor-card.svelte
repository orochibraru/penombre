<script lang="ts">
	import { ShieldCheckIcon, ShieldIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { refreshAll } from "$app/navigation";
	import { authClient } from "$lib/auth-client";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { m } from "$lib/paraglide/messages.js";

	let {
		enabled,
		required,
		hasPassword,
	}: { enabled: boolean; required: boolean; hasPassword: boolean } = $props();

	/**
	 * Enrolment is two steps on purpose: better-auth turns the flag on when
	 * `enable` returns, but a secret nobody has successfully scanned is a
	 * lockout waiting to happen — so the code is confirmed before this card
	 * calls it done, and the backup codes stay on screen until then.
	 */
	let password = $state("");
	let code = $state("");
	let loading = $state(false);
	let totpUri = $state("");
	let backupCodes = $state<string[]>([]);
	let confirmed = $state(false);

	/** The shared secret, pulled out of the URI for manual entry. */
	const secret = $derived(
		totpUri ? new URL(totpUri).searchParams.get("secret") : null,
	);

	async function enable() {
		loading = true;
		// "totp" explicitly: the other method mails a code, which is a
		// different feature and returns neither a URI nor backup codes.
		const { data, error } = await authClient.twoFactor.enable({
			password,
			method: "totp",
		});
		loading = false;
		if (error) {
			toast.error(error.message || m.two_factor_enable_failed());
			return;
		}
		password = "";
		if (data?.method === "totp") {
			totpUri = data.totpURI;
			backupCodes = data.backupCodes;
		}
	}

	async function confirm() {
		loading = true;
		const { error } = await authClient.twoFactor.verifyTotp({ code });
		loading = false;
		if (error) {
			toast.error(error.message || m.two_factor_invalid());
			return;
		}
		confirmed = true;
		code = "";
		toast.success(m.two_factor_enabled_toast());
		await refreshAll();
	}

	async function disable() {
		loading = true;
		const { error } = await authClient.twoFactor.disable({ password });
		loading = false;
		if (error) {
			toast.error(error.message || m.two_factor_disable_failed());
			return;
		}
		password = "";
		totpUri = "";
		backupCodes = [];
		confirmed = false;
		toast.success(m.two_factor_disabled_toast());
		await refreshAll();
	}
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            {m.two_factor_title_card()}
            {#if enabled}
                <Badge variant="secondary">
                    <ShieldCheckIcon class="size-3" />
                    {m.two_factor_on()}
                </Badge>
            {:else if required}
                <Badge variant="outline">{m.two_factor_required_badge()}</Badge>
            {/if}
        </Card.Title>
        <Card.Description>{m.two_factor_card_description()}</Card.Description>
    </Card.Header>
    <Card.Content class="flex flex-col gap-4">
        {#if !hasPassword}
            <p class="text-muted-foreground text-sm">
                {m.two_factor_needs_password()}
            </p>
        {:else if enabled}
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex min-w-56 flex-1 flex-col gap-2">
                    <Label for="tf-disable-password">{m.password()}</Label>
                    <Input
                        id="tf-disable-password"
                        type="password"
                        autocomplete="current-password"
                        bind:value={password}
                    />
                </div>
                <Button variant="destructive" {loading} onclick={disable}>
                    {m.two_factor_disable()}
                </Button>
            </div>
            {#if required}
                <p class="text-muted-foreground text-xs">
                    {m.two_factor_required_hint()}
                </p>
            {/if}
        {:else if totpUri && !confirmed}
            <!-- No QR encoder is bundled: the link opens an authenticator app
                 directly on a phone, and the secret covers everything else. -->
            <div class="flex flex-col gap-2">
                <p class="text-sm">{m.two_factor_scan()}</p>
                <a
                    href={totpUri}
                    class="text-primary text-sm break-all underline"
                >
                    {m.two_factor_open_app()}
                </a>
                {#if secret}
                    <div class="flex flex-col gap-1">
                        <span class="text-muted-foreground text-xs">
                            {m.two_factor_manual_secret()}
                        </span>
                        <code
                            class="bg-muted rounded-lg px-3 py-2 font-mono text-sm break-all"
                        >
                            {secret}
                        </code>
                    </div>
                {/if}
            </div>

            {#if backupCodes.length > 0}
                <div class="flex flex-col gap-1">
                    <span class="text-sm font-medium">
                        {m.two_factor_backup_codes()}
                    </span>
                    <span class="text-muted-foreground text-xs">
                        {m.two_factor_backup_codes_hint()}
                    </span>
                    <ul
                        class="bg-muted/40 mt-1 grid gap-1 rounded-lg border p-3 font-mono text-xs sm:grid-cols-2"
                    >
                        {#each backupCodes as backupCode (backupCode)}
                            <li>{backupCode}</li>
                        {/each}
                    </ul>
                </div>
            {/if}

            <div class="flex flex-wrap items-end gap-3">
                <div class="flex min-w-48 flex-1 flex-col gap-2">
                    <Label for="tf-confirm">{m.two_factor_code()}</Label>
                    <Input
                        id="tf-confirm"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        placeholder="123456"
                        bind:value={code}
                    />
                </div>
                <Button {loading} onclick={confirm}>
                    {m.two_factor_confirm()}
                </Button>
            </div>
        {:else}
            <div class="flex flex-wrap items-end gap-3">
                <div class="flex min-w-56 flex-1 flex-col gap-2">
                    <Label for="tf-password">{m.password()}</Label>
                    <Input
                        id="tf-password"
                        type="password"
                        autocomplete="current-password"
                        bind:value={password}
                    />
                </div>
                <Button variant="outline" {loading} onclick={enable}>
                    <ShieldIcon class="size-4" />
                    {m.two_factor_enable()}
                </Button>
            </div>
        {/if}
    </Card.Content>
</Card.Root>
