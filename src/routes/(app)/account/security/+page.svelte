<script lang="ts">
	import {
		CircleCheckIcon,
		EllipsisVerticalIcon,
		KeyRoundIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import { refreshAll } from "$app/navigation";
	import { authClient } from "$lib/auth-client";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import TwoFactorCard from "$lib/components/two-factor-card.svelte";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_account_security());
	});

	const { data, form } = $props();

	let changePasswordDialogOpen: boolean = $state(false);
	let setPasswordDialogOpen: boolean = $state(false);
	let deleteApiKeyDialogOpen: boolean = $state(false);
	let passkeyToDelete: string = $state("");
	let deletePasskeyDialogOpen: boolean = $state(false);
	let apiKeyToDelete: string = $state("");
	let loading: boolean = $state(false);
	let newPasswordError: string = $state("");
	let currentPassword: string = $state("");
	let newPassword: string = $state("");
	let newPasswordConfirm: string = $state("");

	function passwordChangeHandler(e: SubmitEvent) {
		e.preventDefault();
		loading = true;

		return new Promise<void>((resolve) => {
			setTimeout(() => {
				loading = false;
				changePasswordDialogOpen = false;
				resolve();
			}, 1000);
		});
	}

	function handleChangePassword(e: SubmitEvent) {
		return toast.promise(passwordChangeHandler(e), {
			loading: m.toast_changing_password(),
			success: m.toast_password_changed(),
			error: m.toast_change_password_error(),
		});
	}

	async function deleteApiKeyHandler(keyId: string) {
		loading = true;
		const promise = await authClient.apiKey.delete({
			keyId,
		});

		if (promise.error) {
			throw new Error(promise.error.message);
		}

		await refreshAll();

		deleteApiKeyDialogOpen = false;
		apiKeyToDelete = "";
		loading = false;
	}

	function handleDeleteApiKey(keyId: string) {
		return toast.promise(deleteApiKeyHandler(keyId), {
			loading: m.toast_deleting_api_key(),
			success: m.toast_api_key_deleted(),
			error: m.toast_delete_api_key_error(),
		});
	}

	async function registerPasskey() {
		loading = true;
		const { error } = await authClient.passkey.addPasskey({
			useAutoRegister: true,
		});

		loading = false;

		if (error) {
			if (error.message) {
				throw new Error(String(error.message));
			}
			throw new Error("Failed to register passkey");
		}

		await refreshAll();
	}

	function handleRegisterPasskey() {
		return toast.promise(registerPasskey(), {
			loading: m.toast_registering_passkey(),
			success: m.toast_passkey_registered(),
			error: m.toast_register_passkey_error(),
		});
	}

	// The action flips `data.hasPassword`, so the section swaps itself — this
	// just closes the dialog and confirms.
	$effect(() => {
		if (form?.passwordSet) {
			setPasswordDialogOpen = false;
			toast.success(m.toast_password_set());
		}
	});

	async function handleDeletePasskey(passkeyId: string) {
		loading = true;
		const promise = await authClient.passkey.deletePasskey({
			id: passkeyId,
		});

		if (promise.error) {
			throw new Error(promise.error.message);
		}

		await refreshAll();

		deletePasskeyDialogOpen = false;
		passkeyToDelete = "";
		loading = false;
	}
</script>

<div class="flex w-full flex-col gap-4">
<!-- Password Management -->
{#if data.emailSignInEnabled}
    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                {m.password_management()}
                {#if data.hasPassword}
                    <Badge variant="secondary">
                        <KeyRoundIcon class="size-3" />
                        {m.password_set()}
                    </Badge>
                {/if}
            </Card.Title>
            <Card.Description>
                {data.hasPassword
                    ? m.change_password_description()
                    : m.set_password_description()}
            </Card.Description>
            <Card.Action>
                {#if data.hasPassword}
                    <Button
                        onclick={() => (changePasswordDialogOpen = true)}
                        variant="outline"
                    >
                        {m.change_password()}
                    </Button>
                {:else}
                    <Button
                        onclick={() => (setPasswordDialogOpen = true)}
                        variant="outline"
                    >
                        {m.set_password()}
                    </Button>
                {/if}
            </Card.Action>
        </Card.Header>
    </Card.Root>
{/if}

<TwoFactorCard
    enabled={data.twoFactorEnabled}
    required={data.twoFactorRequired}
    hasPassword={data.hasPassword}
/>

<!-- Passkeys -->
<Card.Root>
    <Card.Header>
        <Card.Title>{m.passkeys()}</Card.Title>
        <Card.Description>{m.passkeys_description()}</Card.Description>
        <Card.Action>
            <Button variant="outline" onclick={() => handleRegisterPasskey()}>
                {m.register_passkey()}
            </Button>
        </Card.Action>
    </Card.Header>
    <Card.Content>
    <div class="flex flex-col gap-2">
        {#if data.passkeys.length > 0}
            {#each data.passkeys as passkey}
                <div
                    class="border rounded-lg w-full p-3 flex items-center justify-between"
                >
                    <div>
                        <p class="text-sm">{passkey.name}</p>
                        <p class="text-xs text-muted-foreground">
                            {m.created_at({
                                date: new Date(
                                    passkey.createdAt,
                                ).toLocaleString(),
                            })}
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        onclick={() => {
                            passkeyToDelete = passkey.id;
                            deletePasskeyDialogOpen = true;
                        }}>{m.delete()}</Button
                    >
                </div>
            {/each}
        {:else}
            <p class="text-sm text-muted-foreground">{m.no_passkeys()}</p>
        {/if}
    </div>
    </Card.Content>
</Card.Root>

<!-- API Keys -->
<Card.Root>
    <Card.Header>
        <Card.Title>
            {m.api_keys_title({ count: String(data.apiKeys.total) })}
        </Card.Title>
        <Card.Description>{m.api_keys_description()}</Card.Description>
    </Card.Header>
    <Card.Content>
    {#if form?.success && form?.apiKey}
        <Alert.Root class="bg-primary/10 border-primary mb-3">
            <CircleCheckIcon class="text-primary" />
            <Alert.Title class="text-primary"
                >{m.api_key_created_success()}</Alert.Title
            >
            <Alert.Description class="text-primary">
                <p>
                    {m.api_key_copy_warning()}
                </p>
                <pre class="mt-2 p-2 bg-muted rounded">{form.apiKey}</pre>
            </Alert.Description>
        </Alert.Root>
    {/if}
    <div class="mb-3">
        <form action="?/createApiKey" use:enhance method="POST">
            <fieldset>
                <Input
                    required
                    name="name"
                    placeholder={m.api_key_name_placeholder()}
                    class="w-full"
                />
                <Button type="submit" class="mt-2">{m.create_api_key()}</Button>
            </fieldset>
        </form>
    </div>

    <div class="flex">
        {#if data.apiKeys.total > 0}
            <ul class="w-full flex flex-col gap-2">
                {#each data.apiKeys.apiKeys as apiKey}
                    <li
                        class="border rounded-lg w-full p-1 px-3 flex items-center justify-between"
                    >
                        <div>
                            <p class="text-sm">{apiKey.name}</p>
                            <p class="text-xs text-muted-foreground">
                                {m.created_at({
                                    date: new Date(
                                        apiKey.createdAt,
                                    ).toLocaleString(),
                                })}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                {m.expires_at({
                                    date: apiKey.expiresAt
                                        ? new Date(
                                              apiKey.expiresAt,
                                          ).toLocaleString()
                                        : m.never(),
                                })}
                            </p>
                        </div>

                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                <Button variant="ghost">
                                    <EllipsisVerticalIcon />
                                </Button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                                <DropdownMenu.Group>
                                    <DropdownMenu.Item
                                        variant="destructive"
                                        onclick={() => {
                                            deleteApiKeyDialogOpen = true;
                                            apiKeyToDelete = apiKey.id;
                                        }}
                                    >
                                        {m.delete()}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-sm text-muted-foreground">{m.no_api_keys()}</p>
        {/if}
    </div>
    </Card.Content>
</Card.Root>

</div>

<!-- Delete Passkey Dialog -->
<ResponsiveDialog
    bind:open={deletePasskeyDialogOpen}
    bind:loading
    title={m.confirm_passkey_deletion()}
    description={m.passkey_deletion_description()}
    submitLabel={m.delete()}
    loadingLabel={m.deleting()}
    submitVariant="destructive"
    onsubmit={() => handleDeletePasskey(passkeyToDelete)}
>
    <p>
        {m.confirm_passkey_deletion_body()}
    </p>
</ResponsiveDialog>

<!-- Delete API Key Dialog -->
<ResponsiveDialog
    bind:open={deleteApiKeyDialogOpen}
    bind:loading
    title={m.confirm_api_key_deletion()}
    description={m.api_key_deletion_description()}
    submitVariant="destructive"
    submitLabel={m.delete()}
    loadingLabel={m.deleting()}
    onsubmit={() => handleDeleteApiKey(apiKeyToDelete)}
>
    <p>
        {m.confirm_api_key_deletion_body()}
    </p>
</ResponsiveDialog>

<!-- Change Password Dialog -->
<ResponsiveDialog
    bind:open={changePasswordDialogOpen}
    bind:loading
    title={m.change_password()}
    description={m.change_password_description()}
    submitLabel={m.change()}
    loadingLabel={m.changing()}
    form={{ action: "?/changePassword" }}
>
    <div class="flex flex-col gap-3">
        <Input
            required
            type="password"
            name="currentPassword"
            autocomplete="current-password"
            bind:value={currentPassword}
            placeholder={m.current_password()}
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
            name="newPassword"
            autocomplete="new-password"
            bind:value={newPassword}
            placeholder={m.new_password()}
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
            name="newPasswordConfirm"
            autocomplete="new-password"
            bind:value={newPasswordConfirm}
            placeholder={m.confirm_new_password()}
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        {#if newPasswordError}
            <p class="text-xs text-red-600">
                {newPasswordError}
            </p>
        {/if}
    </div>
</ResponsiveDialog>

<!-- Set Password Dialog (OAuth accounts with no credential yet) -->
<ResponsiveDialog
    bind:open={setPasswordDialogOpen}
    bind:loading
    title={m.set_password()}
    description={m.set_password_description()}
    submitLabel={m.set_password()}
    loadingLabel={m.saving()}
    form={{ action: "?/setPassword" }}
>
    <div class="flex flex-col gap-3">
        <Input
            required
            type="password"
            name="newPassword"
            autocomplete="new-password"
            placeholder={m.new_password()}
            class="w-full"
        />
        <Input
            required
            type="password"
            name="newPasswordConfirm"
            autocomplete="new-password"
            placeholder={m.confirm_new_password()}
            class="w-full"
        />
    </div>
</ResponsiveDialog>
