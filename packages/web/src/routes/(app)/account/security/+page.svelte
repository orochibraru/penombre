<script lang="ts">
    import { enhance } from "$app/forms";
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Input } from "$lib/components/ui/input";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
    import {
        CheckCircle2Icon,
        CircleCheckIcon,
        EllipsisVerticalIcon,
    } from "@lucide/svelte";
    import { authClient } from "$lib/auth-client";
    import { invalidateAll } from "$app/navigation";
    import * as Alert from "$lib/components/ui/alert/index.js";

    onMount(() => {
        title.set("Account - Security");
    });

    const { data, form } = $props();

    let changePasswordDialogOpen: boolean = $state(false);
    let deleteApiKeyDialogOpen: boolean = $state(false);
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
            loading: "Changing password...",
            success: "Password changed successfully",
            error: "Failed to change password",
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
            loading: "Deleting API key...",
            success: "API key deleted successfully",
            error: "Failed to delete API key",
        });
    }
</script>

<section>
    <h2 class="text-lg font-medium">Password Management</h2>

    <div class="flex">
        <Button
            onclick={() => (changePasswordDialogOpen = true)}
            variant="destructive">Change Password</Button
        >
    </div>
</section>

<section>
    {#if form?.success && form?.apiKey}
        <Alert.Root class="bg-primary/10 border-primary mb-3">
            <CircleCheckIcon class="text-primary" />
            <Alert.Title class="text-primary"
                >Success! Your API key has been created.</Alert.Title
            >
            <Alert.Description class="text-primary">
                <p>
                    Please copy your API key now. You won't be able to see it
                    again!
                </p>
                <pre class="mt-2 p-2 bg-muted rounded">{form.apiKey}</pre>
            </Alert.Description>
        </Alert.Root>
    {/if}
    <div class="mb-3">
        <h2 class="text-lg font-medium">API Keys ({data.apiKeys.total})</h2>

        <p class="text-xs text-muted-foreground">
            API keys allow you to access your account programmatically.
        </p>
    </div>

    <div class="mb-3">
        <form action="?/createApiKey" use:enhance method="POST">
            <fieldset>
                <Input
                    required
                    name="name"
                    placeholder="API Key Name"
                    class="w-full"
                />
                <Button type="submit" class="mt-2">Create API Key</Button>
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
                                Created at: {new Date(
                                    apiKey.createdAt,
                                ).toLocaleString()}
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Expires at:{" "}
                                {apiKey.expiresAt
                                    ? new Date(
                                          apiKey.expiresAt,
                                      ).toLocaleString()
                                    : "Never"}
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
                                        Delete
                                    </DropdownMenu.Item>
                                </DropdownMenu.Group>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-sm text-muted-foreground">No API keys found.</p>
        {/if}
    </div>
</section>

<ResponsiveDialog
    bind:open={deleteApiKeyDialogOpen}
    bind:loading
    title="Confirm API key deletion"
    description="This will delete your API key."
    submitLabel="Delete"
    loadingLabel="Deleting..."
    onsubmit={() => handleDeleteApiKey(apiKeyToDelete)}
>
    <p>
        Are you sure you want to delete this API key? This action cannot be
        undone.
    </p>
</ResponsiveDialog>

<ResponsiveDialog
    bind:open={changePasswordDialogOpen}
    bind:loading
    title="Change Password"
    description="This will change your account password."
    submitLabel="Change"
    loadingLabel="Changing..."
    form={{ action: "?/changePassword" }}
>
    <div class="flex flex-col gap-3">
        <Input
            required
            type="password"
            bind:value={currentPassword}
            placeholder="Current password"
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
            bind:value={newPassword}
            placeholder="New password"
            class="w-full"
            aria-invalid={newPasswordError !== ""}
        />
        <Input
            required
            type="password"
            bind:value={newPasswordConfirm}
            placeholder="Confirm new password"
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
