<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import Button from "$lib/components/ui/button/button.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";

    onMount(() => {
        title.set("Account - Sessions");
    });

    const { data } = $props();

    async function revokeSession(sessionToken: string) {
        const { error } = await authClient.revokeSession({
            token: sessionToken,
        });

        if (error) {
            throw new Error(error.message || "Failed to revoke session");
        }

        await invalidateAll();
    }

    async function handleRevokeSession(sessionToken: string) {
        return toast.promise(revokeSession(sessionToken), {
            loading: "Revoking session...",
            success: "Session revoked successfully",
            error: (e) => {
                if (e instanceof Error) {
                    return e.message;
                }

                return "Failed to revoke session";
            },
        });
    }
</script>

<h2 class="text-lg font-medium">Session Management</h2>
<ul class="flex flex-col gap-2">
    {#each data.sessions as session}
        <li
            class="p-2 border rounded-xl flex justify-between items-center gap-2"
        >
            <div>
                {#if session.token === data.session.token}
                    <span class="text-green-500">Current session</span>
                {/if}
                <p>
                    {session.ipAddress}
                </p>
                <p>
                    Last active: {new Date(session.createdAt).toLocaleString()}
                </p>
                <p>
                    Expires: {new Date(session.expiresAt).toLocaleString()}
                </p>
                <p>
                    Device: {session.userAgent}
                </p>
            </div>
            <Button
                onclick={() => handleRevokeSession(session.token)}
                variant="destructive"
                size="sm"
                disabled={session.token === data.session.token}
            >
                Revoke
            </Button>
        </li>
    {/each}
</ul>
