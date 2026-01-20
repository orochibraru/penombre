<script lang="ts">
    import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import { Input } from "$lib/components/ui/input";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    onMount(() => {
        title.set("Account - Security");
    });

    const { data } = $props();

    let changePasswordDialogOpen: boolean = $state(false);
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
</script>

<h2 class="text-lg font-medium">Password Management</h2>

<div class="flex">
    <Button
        onclick={() => (changePasswordDialogOpen = true)}
        variant="destructive">Change Password</Button
    >
</div>

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
