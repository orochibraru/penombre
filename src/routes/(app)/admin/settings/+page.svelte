<script lang="ts">
	import { InfoIcon, LockIcon, UserPlusIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.admin_nav_settings());
	});

	const { data, form } = $props();

	let saving = $state(false);

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		} else if (form?.success) {
			toast.success(m.toast_settings_saved());
		}
	});
</script>

<form
    method="POST"
    action="?/save"
    class="flex w-full flex-col gap-4"
    use:enhance={() => {
        saving = true;
        return async ({ update }) => {
            await update({ reset: false });
            saving = false;
        };
    }}
>
    <div class="grid items-start gap-4 xl:grid-cols-2">
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
            <div
                class="text-muted-foreground bg-muted/40 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
            >
                <InfoIcon class="mt-px size-3.5 shrink-0" />
                <span>{m.admin_env_read_only()}</span>
            </div>

            <div class="flex flex-col gap-2">
                <div
                    class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                >
                    <span class="text-sm">{m.admin_email_sign_in()}</span>
                    <Badge variant={data.env.emailSignIn ? "secondary" : "outline"}>
                        {data.env.emailSignIn ? m.enabled() : m.disabled()}
                    </Badge>
                </div>

                {#each data.env.providers as provider (provider.name)}
                    <div
                        class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
                    >
                        <span class="min-w-0 text-sm">
                            {provider.prettyName}
                            <span class="text-muted-foreground ml-2 font-mono text-xs">
                                {provider.name}
                            </span>
                        </span>
                        <Badge variant={provider.enabled ? "secondary" : "outline"}>
                            {provider.enabled ? m.enabled() : m.disabled()}
                        </Badge>
                    </div>
                {:else}
                    <p class="text-muted-foreground px-1 text-sm">
                        {m.admin_no_providers()}
                    </p>
                {/each}
            </div>
        </Card.Content>
    </Card.Root>

    <div>
        <Button type="submit" loading={saving}>{m.save_changes()}</Button>
    </div>
</form>
