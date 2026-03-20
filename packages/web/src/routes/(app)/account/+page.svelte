<script lang="ts">
    import { SaveIcon } from "@lucide/svelte";
    import Button from "$lib/components/ui/button/button.svelte";
    import Input from "$lib/components/ui/input/input.svelte";
    import Label from "$lib/components/ui/label/label.svelte";
    import { title } from "$lib/store/title";
    import { onMount } from "svelte";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import * as m from "$lib/paraglide/messages.js";

    onMount(() => {
        title.set(m.title_account_details());
    });

    const { data, form } = $props();

    let email = $derived(data.user.email);
    let name = $derived(data.user.name);
    let hasChanged = $state(false);
    let loading = $state(false);

    $effect(() => {
        if (email !== data.user.email || name !== data.user.name) {
            hasChanged = true;
        } else {
            hasChanged = false;
        }

        if (form?.success) {
            toast.success(m.toast_account_updated());
            hasChanged = false;
        }

        if (form?.error) {
            toast.error(m.toast_account_update_error(), {
                description: form.error,
            });
        }
    });
</script>

<div class="w-full max-w-lg">
    <h2 class="mb-5 text-lg font-medium">{m.account_details()}</h2>
    <form
        class="mb-5"
        method="POST"
        use:enhance={() => {
            loading = true;

            return async ({ update }) => {
                await update();
                loading = false;
            };
        }}
        action="?/updateAccount"
    >
        <fieldset class="flex flex-col gap-5" disabled={loading}>
            {#if data.user.image}
                <img
                    src={data.user.image}
                    alt={name}
                    class="max-w-20 rounded-full"
                />
            {/if}
            <div class="flex w-full flex-col gap-1.5">
                <Label>{m.email()}</Label>
                <Input
                    type="email"
                    autocomplete="email"
                    name="email"
                    bind:value={email}
                />
            </div>
            <div class="flex w-full flex-col gap-1.5">
                <Label>{m.name()}</Label>
                <Input
                    type="text"
                    autocomplete="name"
                    name="name"
                    bind:value={name}
                />
            </div>
            <Button
                class="w-full"
                disabled={!hasChanged}
                {loading}
                type="submit"
            >
                {m.save()}
                <SaveIcon />
            </Button>
        </fieldset>
    </form>
</div>
