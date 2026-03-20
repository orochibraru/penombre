<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { authClient } from "$lib/auth-client";
    import Button from "$lib/components/ui/button/button.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { toast } from "svelte-sonner";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_account_sessions());
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
            loading: m.toast_revoking_session(),
            success: m.toast_session_revoked(),
            error: (e) => {
                if (e instanceof Error) {
                    return e.message;
                }

                return m.toast_revoke_session_error();
            },
        });
    }
</script>

<h2 class="text-lg font-medium">{m.session_management()}</h2>
<ul class="flex flex-col gap-2">
    {#each data.sessions as session}
        <li
            class="p-2 border rounded-xl flex justify-between items-center gap-2"
        >
            <div>
                {#if session.token === data.session.token}
                    <span class="text-green-500">{m.current_session()}</span>
                {/if}
                <p>
                    {session.ipAddress}
                </p>
                <p>
                    {m.last_active({
                        date: new Date(session.createdAt).toLocaleString(),
                    })}
                </p>
                <p>
                    {m.expires({
                        date: new Date(session.expiresAt).toLocaleString(),
                    })}
                </p>
                <p>
                    {m.device({ userAgent: session.userAgent ?? m.unknown() })}
                </p>
            </div>
            <Button
                onclick={() => handleRevokeSession(session.token)}
                variant="destructive"
                size="sm"
                disabled={session.token === data.session.token}
            >
                {m.revoke()}
            </Button>
        </li>
    {/each}
</ul>
