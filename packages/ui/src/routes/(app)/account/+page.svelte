<script lang="ts">
    import { LogOutIcon } from "@lucide/svelte";
    import { getAuthClient, handleSignOut } from "$lib/api/helpers/auth";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Label from "$lib/components/ui/label/label.svelte";
    import { title } from "$lib/store/title";
    import Badge from "$lib/components/ui/badge/badge.svelte";
    import { page } from "$app/state";

    $title = "Account";

    const { data } = $props();

    const authClient = getAuthClient(page.url.origin);
</script>

<div class="w-full max-w-lg">
    <h2 class="mb-5 text-lg font-medium">Account Details</h2>
    <form class="mb-5">
        <fieldset disabled class="flex flex-col gap-5">
            {#if data.user.image}
                <img
                    src={data.user.image}
                    alt={data.user.name}
                    class="max-w-20 rounded-full"
                />
            {/if}
            <div class="flex w-full flex-col gap-1.5">
                <Label>Email</Label>
                <Input
                    type="email"
                    autocomplete="email"
                    value={data.user.email}
                />
            </div>
            <div class="flex w-full flex-col gap-1.5">
                <Label>Name</Label>
                <Input type="text" autocomplete="name" value={data.user.name} />
            </div>
        </fieldset>
    </form>
    <Button
        onclick={() => handleSignOut(authClient)}
        class="w-full"
        variant="outline"
    >
        Sign out
        <LogOutIcon />
    </Button>
</div>

<div class="w-full">
    <h2 class="text-lg font-medium">Activity Log</h2>
    {#if !data.activity || data.activity?.length === 0}
        <p class="mt-3 text-sm text-muted-foreground">No recent activity.</p>
    {:else}
        <ul class="mt-3 space-y-2">
            {#each data.activity as item}
                <li class="rounded-md border p-3">
                    <div class="flex justify-between">
                        <Badge>{item.action}</Badge>
                        <p class="text-sm text-muted-foreground">
                            {new Date(item.createdAt).toLocaleString()}
                        </p>
                    </div>
                    <p class="text-sm text-muted-foreground">{item.message}</p>
                </li>
            {/each}
        </ul>
    {/if}
</div>
