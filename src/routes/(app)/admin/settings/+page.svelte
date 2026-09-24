<script lang="ts">
	import {
		ClockIcon,
		HistoryIcon,
		InfoIcon,
		KeyRoundIcon,
		LockIcon,
		MailIcon,
		PencilIcon,
		PlusIcon,
		SendIcon,
		Trash2Icon,
		UserPlusIcon,
	} from "@lucide/svelte";
	import { onMount, untrack } from "svelte";
	import { toast } from "svelte-sonner";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { CopyButton } from "#lib/components/ui/copy-button/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { enhance } from "#lib/forms.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";

	onMount(() => {
		title.set(m.admin_nav_settings());
	});

	const { data, form } = $props();

	type ProviderRow = (typeof data.providers)[number];

	let saving = $state(false);
	let testing = $state(false);

	/** Which stored provider is open for editing, and whether a new one is. */
	let editing = $state<string | null>(null);
	let adding = $state(false);

	/**
	 * Passwordless methods are unusable without mail, so the checkboxes follow
	 * the SMTP block live rather than waiting for a save to reject them.
	 */
	// untrack: this seeds the checkbox once from the server, after which the
	// user owns it — re-reading `data` here would fight their edits.
	let smtpOn = $state(
		untrack(() =>
			data.provided.smtp
				? data.smtpAvailable
				: (data.settings.smtp?.enabled ?? false),
		),
	);
	const canSendMail = $derived(
		data.provided.smtp ? data.smtpAvailable : smtpOn,
	);

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		} else if (form?.tested) {
			toast.success(m.admin_smtp_test_sent({ email: form.tested }));
		} else if (form?.providerSaved) {
			toast.success(m.admin_oauth_saved({ name: form.providerSaved }));
		} else if (form?.providerRemoved) {
			toast.success(m.admin_oauth_removed({ name: form.providerRemoved }));
		} else if (form?.success) {
			toast.success(m.toast_settings_saved());
		}
	});
</script>

<form
    method="POST"
    action="?/save"
    class="flex w-full flex-col gap-4"
    use:enhance={({ action }) => {
        const isTest = action.search === "?/testEmail";
        if (isTest) {
            testing = true;
        } else {
            saving = true;
        }
        return async ({ update }) => {
            await update({ reset: false });
            saving = false;
            testing = false;
        };
    }}
>
    <div class="grid gap-4 xl:grid-cols-2">
        <Card.Root>
            <Card.Header>
                <Card.Title class="flex items-center gap-2">
                    <LockIcon class="size-4" />
                    {m.admin_security()}
                </Card.Title>
                <Card.Description>
                    {m.admin_security_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col gap-4">
                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="requirePasskey"
                        checked={data.settings.requirePasskey}
                        class="mt-0.5"
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="font-medium">{m.admin_require_passkey()}</span>
                        <span class="text-muted-foreground text-xs">
                            {m.admin_require_passkey_hint()}
                        </span>
                    </span>
                </Label>

                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="requireTwoFactor"
                        checked={data.settings.requireTwoFactor}
                        class="mt-0.5"
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="font-medium">
                            {m.admin_require_two_factor()}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            {data.twoFactorPending > 0
                                ? m.admin_require_two_factor_pending({
                                      count: String(data.twoFactorPending),
                                  })
                                : m.admin_require_two_factor_hint()}
                        </span>
                    </span>
                </Label>

                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="requireStrongPassword"
                        checked={data.settings.requireStrongPassword}
                        class="mt-0.5"
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="font-medium">
                            {m.admin_strong_password()}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            {m.admin_strong_password_hint()}
                        </span>
                    </span>
                </Label>

                <div class="flex flex-col gap-2">
                    <Label for="minPasswordLength">
                        {m.admin_min_password_length()}
                    </Label>
                    <Input
                        id="minPasswordLength"
                        name="minPasswordLength"
                        type="number"
                        min="8"
                        max="128"
                        value={data.settings.minPasswordLength}
                        class="w-32"
                    />
                    <p class="text-muted-foreground text-xs">
                        {m.admin_min_password_length_hint({
                            env: String(data.env.minPasswordLength),
                        })}
                    </p>
                </div>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <Card.Title class="flex items-center gap-2">
                    <UserPlusIcon class="size-4" />
                    {m.admin_signups()}
                </Card.Title>
                <Card.Description>
                    {m.admin_signups_description()}
                </Card.Description>
            </Card.Header>
            <Card.Content class="flex flex-col gap-4">
                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="allowSignups"
                        checked={data.settings.allowSignups}
                        class="mt-0.5"
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="font-medium">{m.admin_allow_signups()}</span>
                        <span class="text-muted-foreground text-xs">
                            {m.admin_allow_signups_hint()}
                        </span>
                    </span>
                </Label>

                <div class="flex flex-col gap-2">
                    <Label for="allowedEmailDomains">
                        {m.admin_allowed_domains()}
                    </Label>
                    <Input
                        id="allowedEmailDomains"
                        name="allowedEmailDomains"
                        placeholder="example.com, team.org"
                        value={(data.settings.allowedEmailDomains ?? []).join(", ")}
                    />
                    <p class="text-muted-foreground text-xs">
                        {m.admin_allowed_domains_hint()}
                    </p>
                </div>
            </Card.Content>
        </Card.Root>
    </div>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.admin_sign_in_methods()}</Card.Title>
            <Card.Description>
                {m.admin_sign_in_methods_description()}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
            <!-- Only when something here really is env-owned: the passwordless
                 toggles below are database-backed and editable. -->
            {#if data.provided.emailSignIn || data.provided.passkeySignIn}
                <div
                    class="text-muted-foreground bg-muted/40 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                >
                    <InfoIcon class="mt-px size-3.5 shrink-0" />
                    <span>{m.admin_env_read_only_some()}</span>
                </div>
            {/if}

            <div class="flex flex-col gap-2">
                {#if data.provided.emailSignIn}
                    <div
                        class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                        <span class="text-sm">{m.admin_email_sign_in()}</span>
                        <Badge
                            variant={data.env.emailSignIn
                                ? "secondary"
                                : "outline"}
                        >
                            {data.env.emailSignIn ? m.enabled() : m.disabled()}
                        </Badge>
                    </div>
                {:else}
                    <Label
                        class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                        <Checkbox
                            name="emailSignInEnabled"
                            checked={data.settings.emailSignInEnabled ?? true}
                        />
                        <span class="grid gap-1 font-normal">
                            <span class="text-sm font-medium">
                                {m.admin_email_sign_in()}
                            </span>
                            <span class="text-muted-foreground text-xs">
                                {m.admin_email_sign_in_usage({
                                    count: String(data.usage.credentialAccounts),
                                })}
                            </span>
                        </span>
                    </Label>
                {/if}

                {#if data.provided.passkeySignIn}
                    <div
                        class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                        <span class="text-sm">{m.admin_passkey_sign_in()}</span>
                        <Badge
                            variant={data.env.passkeySignIn
                                ? "secondary"
                                : "outline"}
                        >
                            {data.env.passkeySignIn ? m.enabled() : m.disabled()}
                        </Badge>
                    </div>
                {:else}
                    <Label
                        class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                    >
                        <Checkbox
                            name="passkeySignInEnabled"
                            checked={data.settings.passkeySignInEnabled ?? true}
                        />
                        <span class="grid gap-1 font-normal">
                            <span class="text-sm font-medium">
                                {m.admin_passkey_sign_in()}
                            </span>
                            <span class="text-muted-foreground text-xs">
                                {m.admin_email_sign_in_usage({
                                    count: String(data.usage.passkeyUsers),
                                })}
                            </span>
                        </span>
                    </Label>
                {/if}

                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
                    data-disabled={!canSendMail}
                >
                    <Checkbox
                        name="magicLinkEnabled"
                        checked={data.settings.magicLinkEnabled ?? false}
                        disabled={!canSendMail}
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="text-sm font-medium">
                            {m.admin_magic_link()}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            {canSendMail
                                ? m.admin_magic_link_hint()
                                : m.admin_needs_smtp()}
                        </span>
                    </span>
                </Label>

                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
                    data-disabled={!canSendMail}
                >
                    <Checkbox
                        name="emailOtpEnabled"
                        checked={data.settings.emailOtpEnabled ?? false}
                        disabled={!canSendMail}
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="text-sm font-medium">
                            {m.admin_email_otp()}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            {canSendMail
                                ? m.admin_email_otp_hint()
                                : m.admin_needs_smtp()}
                        </span>
                    </span>
                </Label>

            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <MailIcon class="size-4" />
                {m.admin_smtp()}
            </Card.Title>
            <Card.Description>{m.admin_smtp_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
            {#if data.provided.smtp}
                <div
                    class="text-muted-foreground bg-muted/40 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
                >
                    <InfoIcon class="mt-px size-3.5 shrink-0" />
                    <span>{m.admin_env_read_only()}</span>
                </div>
            {:else}
                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="smtpEnabled"
                        bind:checked={smtpOn}
                    />
                    <span class="text-sm font-medium">
                        {m.admin_smtp_enable()}
                    </span>
                </Label>

                <div class="grid gap-3 sm:grid-cols-2">
                    <div class="flex flex-col gap-2">
                        <Label for="smtpHost">{m.admin_smtp_host()}</Label>
                        <Input
                            id="smtpHost"
                            name="smtpHost"
                            placeholder="smtp.example.com"
                            value={data.settings.smtp?.host ?? ""}
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <Label for="smtpPort">{m.admin_smtp_port()}</Label>
                        <Input
                            id="smtpPort"
                            name="smtpPort"
                            type="number"
                            min="1"
                            max="65535"
                            value={data.settings.smtp?.port ?? 587}
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <Label for="smtpUser">{m.admin_smtp_user()}</Label>
                        <Input
                            id="smtpUser"
                            name="smtpUser"
                            autocomplete="off"
                            value={data.settings.smtp?.user ?? ""}
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <Label for="smtpPassword">
                            {m.admin_smtp_password()}
                        </Label>
                        <Input
                            id="smtpPassword"
                            name="smtpPassword"
                            type="password"
                            autocomplete="new-password"
                            placeholder={data.settings.smtp?.hasPassword
                                ? "••••••••"
                                : ""}
                        />
                        {#if data.settings.smtp?.hasPassword}
                            <p class="text-muted-foreground text-xs">
                                {m.admin_smtp_password_hint()}
                            </p>
                        {/if}
                    </div>
                    <div class="flex flex-col gap-2 sm:col-span-2">
                        <Label for="smtpFrom">{m.admin_smtp_from()}</Label>
                        <Input
                            id="smtpFrom"
                            name="smtpFrom"
                            placeholder="noreply@example.com"
                            value={data.settings.smtp?.from ?? ""}
                        />
                    </div>
                </div>

                <Label
                    class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                    <Checkbox
                        name="smtpSecure"
                        checked={data.settings.smtp?.secure ?? false}
                    />
                    <span class="grid gap-1 font-normal">
                        <span class="text-sm font-medium">
                            {m.admin_smtp_secure()}
                        </span>
                        <span class="text-muted-foreground text-xs">
                            {m.admin_smtp_secure_hint()}
                        </span>
                    </span>
                </Label>
            {/if}

            <!-- Posts the fields as they stand rather than what is saved, so a
                 configuration can be proven before it is committed. -->
            <div class="flex flex-wrap items-center gap-3">
                <Button
                    type="submit"
                    formaction="?/testEmail"
                    variant="outline"
                    loading={testing}
                >
                    <SendIcon class="size-4" />
                    {m.admin_smtp_test()}
                </Button>
                <span class="text-muted-foreground text-xs">
                    {m.admin_smtp_test_hint()}
                </span>
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <InfoIcon class="size-4" />
                {m.admin_version_check()}
            </Card.Title>
            <Card.Description>
                {m.admin_version_check_description()}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
            <Label
                class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors data-disabled:cursor-not-allowed data-disabled:opacity-60"
                data-disabled={data.provided.versionCheck ? "" : undefined}
            >
                <Checkbox
                    name="versionCheckEnabled"
                    checked={data.versionCheckEnabled}
                    disabled={data.provided.versionCheck}
                    class="mt-0.5"
                />
                <span class="grid gap-1 font-normal">
                    <span class="font-medium">{m.admin_version_check_enabled()}</span>
                    <span class="text-muted-foreground text-xs">
                        {data.provided.versionCheck
                            ? m.admin_env_read_only()
                            : m.admin_version_check_hint()}
                    </span>
                </span>
            </Label>

            <div class="flex flex-col gap-2">
                <Label for="releaseChannel">{m.admin_release_channel()}</Label>
                <select
                    id="releaseChannel"
                    name="releaseChannel"
                    value={data.releaseChannel}
                    disabled={data.provided.releaseChannel}
                    class="border-input bg-transparent ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="stable">{m.admin_release_channel_stable()}</option>
                    <option value="canary">{m.admin_release_channel_canary()}</option>
                </select>
                <p class="text-muted-foreground text-xs">
                    {data.provided.releaseChannel
                        ? m.admin_env_read_only()
                        : m.admin_release_channel_hint()}
                </p>
            </div>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <ClockIcon class="size-4" />
                {m.admin_data_retention()}
            </Card.Title>
            <Card.Description>
                {m.admin_data_retention_description()}
            </Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-2">
            <Label for="retentionDays">{m.admin_data_retention_days()}</Label>
            <Input
                id="retentionDays"
                name="retentionDays"
                type="number"
                min="1"
                disabled={data.provided.dataRetention}
                value={data.retentionDays ?? ""}
                class="w-32"
            />
            <p class="text-muted-foreground text-xs">
                {data.provided.dataRetention
                    ? m.admin_env_read_only()
                    : m.admin_data_retention_hint()}
            </p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <HistoryIcon class="size-4" />
                {m.admin_versioning()}
            </Card.Title>
            <Card.Description>{m.admin_versioning_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-4">
            <Label
                class="hover:bg-muted/40 flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
            >
                <Checkbox
                    name="versioningEnabled"
                    checked={data.settings.versioningEnabled ?? false}
                    class="mt-0.5"
                />
                <span class="grid gap-1 font-normal">
                    <span class="font-medium">{m.admin_versioning_enabled()}</span>
                    <span class="text-muted-foreground text-xs">
                        {m.admin_versioning_enabled_hint()}
                    </span>
                </span>
            </Label>
            <div class="flex flex-col gap-2">
                <Label for="maxVersionsPerFile">{m.admin_versioning_max()}</Label>
                <Input
                    id="maxVersionsPerFile"
                    name="maxVersionsPerFile"
                    type="number"
                    min="1"
                    max="1000"
                    value={data.settings.maxVersionsPerFile ?? 10}
                    class="w-32"
                />
                <p class="text-muted-foreground text-xs">{m.admin_versioning_max_hint()}</p>
            </div>
        </Card.Content>
    </Card.Root>

    <div>
        <Button type="submit" loading={saving}>{m.save_changes()}</Button>
    </div>
</form>

<!-- Outside the settings form above: each provider is saved on its own, and a
     form cannot nest inside another. -->
<Card.Root class="mt-4">
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <KeyRoundIcon class="size-4" />
            {m.admin_oauth()}
        </Card.Title>
        <Card.Description>
            {m.admin_oauth_description()}
        </Card.Description>
        <Card.Action>
            <Button
                variant="outline"
                size="sm"
                onclick={() => {
                    adding = !adding;
                    editing = null;
                }}
            >
                <PlusIcon class="size-4" />
                {m.admin_oauth_add()}
            </Button>
        </Card.Action>
    </Card.Header>
    <Card.Content class="flex flex-col gap-3">
        {#each data.env.providers as provider (provider.name)}
            <div
                class="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2.5"
            >
                <span class="min-w-0 text-sm">
                    {provider.prettyName}
                    <span class="text-muted-foreground ml-2 font-mono text-xs">
                        {provider.name}
                    </span>
                </span>
                <div class="flex items-center gap-2">
                    <Badge variant="outline">{m.admin_oauth_from_env()}</Badge>
                    <Badge variant={provider.enabled ? "secondary" : "outline"}>
                        {provider.enabled ? m.enabled() : m.disabled()}
                    </Badge>
                </div>
            </div>
        {/each}

        {#each data.providers as provider (provider.name)}
            <div class="rounded-lg border" data-provider={provider.name}>
                <div
                    class="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                >
                    <span class="min-w-0 text-sm">
                        {provider.prettyName || provider.name}
                        <span class="text-muted-foreground ml-2 font-mono text-xs">
                            {provider.name}
                        </span>
                    </span>
                    <div class="flex items-center gap-2">
                        <Badge variant={provider.enabled ? "secondary" : "outline"}>
                            {provider.enabled ? m.enabled() : m.disabled()}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onclick={() => {
                                adding = false;
                                editing =
                                    editing === provider.name ? null : provider.name;
                            }}
                        >
                            <PencilIcon class="size-3.5" />
                            {m.admin_oauth_edit()}
                        </Button>
                        <form method="POST" action="?/deleteProvider" use:enhance>
                            <input
                                type="hidden"
                                name="providerName"
                                value={provider.name}
                            />
                            <Button
                                type="submit"
                                variant="ghost"
                                size="sm"
                                class="text-destructive"
                            >
                                <Trash2Icon class="size-3.5" />
                                {m.admin_oauth_remove()}
                            </Button>
                        </form>
                    </div>
                </div>
                {#if editing === provider.name}
                    {@render providerForm(provider)}
                {/if}
            </div>
        {/each}

        {#if adding}
            <div class="rounded-lg border">
                {@render providerForm(undefined)}
            </div>
        {:else if data.providers.length === 0 && data.env.providers.length === 0}
            <p class="text-muted-foreground px-1 text-sm">
                {m.admin_no_providers()}
            </p>
        {/if}
    </Card.Content>
</Card.Root>

{#snippet providerForm(provider?: ProviderRow)}
    <form
        method="POST"
        action="?/saveProvider"
        class="grid gap-4 border-t p-3 sm:grid-cols-2"
        use:enhance={() => {
            return async ({ result, update }) => {
                await update({ reset: false });
                // Only close on success, or a rejected save takes the typed
                // values off the screen with it.
                if (result.type === "success") {
                    editing = null;
                    adding = false;
                }
            };
        }}
    >
        <div class="flex flex-col gap-2">
            <Label for="{provider?.name ?? 'new'}-name">
                {m.admin_oauth_id()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-name"
                name="providerName"
                value={provider?.name ?? ""}
                readonly={!!provider}
                placeholder="authentik"
                required
            />
            <p class="text-muted-foreground text-xs">{m.admin_oauth_id_hint()}</p>
        </div>

        <div class="flex flex-col gap-2">
            <Label for="{provider?.name ?? 'new'}-pretty">
                {m.admin_oauth_pretty_name()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-pretty"
                name="prettyName"
                value={provider?.prettyName ?? ""}
                placeholder="Authentik"
            />
            <p class="text-muted-foreground text-xs">
                {m.admin_oauth_pretty_name_hint()}
            </p>
        </div>

        <div class="flex flex-col gap-2 sm:col-span-2">
            <Label for="{provider?.name ?? 'new'}-discovery">
                {m.admin_oauth_discovery()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-discovery"
                name="discoveryUrl"
                type="url"
                value={provider?.discoveryUrl ?? ""}
                placeholder="https://id.example.com/.well-known/openid-configuration"
                required
            />
            <p class="text-muted-foreground text-xs">
                {m.admin_oauth_discovery_hint()}
            </p>
        </div>

        <div class="flex flex-col gap-2">
            <Label for="{provider?.name ?? 'new'}-client">
                {m.admin_oauth_client_id()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-client"
                name="clientId"
                autocomplete="off"
                value={provider?.clientId ?? ""}
                required
            />
        </div>

        <div class="flex flex-col gap-2">
            <Label for="{provider?.name ?? 'new'}-secret">
                {m.admin_oauth_client_secret()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-secret"
                name="clientSecret"
                type="password"
                autocomplete="new-password"
                required={!provider}
            />
            {#if provider}
                <p class="text-muted-foreground text-xs">
                    {m.admin_oauth_client_secret_hint()}
                </p>
            {/if}
        </div>

        <div class="flex flex-col gap-2 sm:col-span-2">
            <Label for="{provider?.name ?? 'new'}-scopes">
                {m.admin_oauth_scopes()}
            </Label>
            <Input
                id="{provider?.name ?? 'new'}-scopes"
                name="scopes"
                value={provider?.scopes ?? ""}
                placeholder="openid, profile, email"
            />
            <p class="text-muted-foreground text-xs">
                {m.admin_oauth_scopes_hint()}
            </p>
        </div>

        <Label
            class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
        >
            <Checkbox name="pkce" checked={provider?.pkce ?? true} />
            <span class="text-sm font-medium">{m.admin_oauth_pkce()}</span>
        </Label>

        <Label
            class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
        >
            <Checkbox name="enabled" checked={provider?.enabled ?? true} />
            <span class="text-sm font-medium">{m.admin_oauth_enabled()}</span>
        </Label>

        <!-- The IdP needs this exact address, and it is derived from the id,
             so it is shown rather than left to be guessed. -->
        <div
            class="text-muted-foreground bg-muted/40 flex items-center gap-2 rounded-lg px-3 py-2 text-xs sm:col-span-2"
        >
            <InfoIcon class="size-3.5 shrink-0" />
            <span class="min-w-0 flex-1">
                {m.admin_oauth_callback()}
                <span class="text-foreground ml-1 font-mono break-all">
                    {provider?.callbackUrl ??
                        `${data.origin}/api/v1/auth/callback/<id>`}
                </span>
            </span>
            {#if provider}
                <CopyButton text={provider.callbackUrl} class="size-7 shrink-0" />
            {/if}
        </div>

        <div class="flex items-center gap-2 sm:col-span-2">
            <Button type="submit" size="sm">{m.save_changes()}</Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onclick={() => {
                    editing = null;
                    adding = false;
                }}
            >
                {m.cancel()}
            </Button>
        </div>
    </form>
{/snippet}
