<script lang="ts">
    import { enhance } from "$app/forms";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Input } from "$lib/components/ui/input";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import { CircleCheckIcon, EllipsisVerticalIcon } from "@lucide/svelte";
    import { authClient } from "$lib/auth-client";
    import { invalidateAll } from "$app/navigation";
    import * as Alert from "$lib/components/ui/alert/index.js";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_account_security());
    });

    const { data, form } = $props();

    let changePasswordDialogOpen: boolean = $state(false);
    let deleteApiKeyDialogOpen: boolean = $state(false);
    let passkeyToDelete: string = $state("");
    let deletePasskeyDialogOpen: boolean = $state(false);
    let apiKeyToDelete: string = $state("");
    let loading: boolean = $state(false);
    let newPasswordError: string = $state("");
    let currentPassword: string = $state("");
    let newPassword: string = $state("");
    let newPasswordConfirm: string = $state("");

    async function passwordChangeHandler(e: SubmitEvent) {
        e.preventDefault();
        loading = true;

        setTimeout(() => {
            loading = false;
            changePasswordDialogOpen = false;
        }, 1000);
    }

    async function handleChangePassword(e: SubmitEvent) {
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

        await invalidateAll();

        deleteApiKeyDialogOpen = false;
        apiKeyToDelete = "";
        loading = false;
    }

    async function handleDeleteApiKey(keyId: string) {
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

        await invalidateAll();
    }

    async function handleRegisterPasskey() {
        return toast.promise(registerPasskey(), {
            loading: m.toast_registering_passkey(),
            success: m.toast_passkey_registered(),
            error: m.toast_register_passkey_error(),
        });
    }

    async function handleDeletePasskey(passkeyId: string) {
        loading = true;
        const promise = await authClient.passkey.deletePasskey({
            id: passkeyId,
        });

        if (promise.error) {
            throw new Error(promise.error.message);
        }

        await invalidateAll();

        deletePasskeyDialogOpen = false;
        passkeyToDelete = "";
        loading = false;
    }
</script>

<!-- Password Management -->
<section class="p-3 border rounded-xl">
    <h2 class="text-lg font-medium">{m.password_management()}</h2>

    <div class="flex">
        <Button
            onclick={() => (changePasswordDialogOpen = true)}
            variant="destructive">{m.change_password()}</Button
        >
    </div>
</section>

<!-- Passkeys -->
<section class="p-3 border rounded-xl">
    <div class="flex justify-between items-center">
        <div>
            <h2 class="text-lg font-medium">{m.passkeys()}</h2>
            <p class="text-xs text-muted-foreground">
                {m.passkeys_description()}
            </p>
        </div>
        <Button onclick={() => handleRegisterPasskey()}>
            {m.register_passkey()}
        </Button>
    </div>

    <div class="flex flex-col gap-2 mt-3">
        {#if data.passkeys.length > 0}
            {#each data.passkeys as passkey}
                <div
                    class="border rounded-xl w-full p-3 flex items-center justify-between"
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
</section>

<!-- API Keys -->
<section class="p-3 border rounded-xl">
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
        <h2 class="text-lg font-medium">
            {m.api_keys_title({ count: String(data.apiKeys.total) })}
        </h2>

        <p class="text-xs text-muted-foreground">
            {m.api_keys_description()}
        </p>
    </div>

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
                        class="border rounded-xl w-full p-1 px-3 flex items-center justify-between"
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
</section>

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
            bind:value={currentPassword}
            placeholder={m.current_password()}
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
            bind:value={newPassword}
            placeholder={m.new_password()}
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
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
