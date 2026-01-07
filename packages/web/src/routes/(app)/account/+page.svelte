<script lang="ts">
    import { LogOutIcon } from "@lucide/svelte";
    import { handleSignOut } from "$lib/auth-helpers";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Label from "$lib/components/ui/label/label.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";

    onMount(() => {
        title.set("Account - Details");
    });

    const { data } = $props();
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
    <Button onclick={() => handleSignOut()} class="w-full" variant="outline">
        Sign out
        <LogOutIcon />
    </Button>
</div>
