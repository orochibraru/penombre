<script lang="ts">
    import { onMount } from "svelte";
    import { dev } from "$app/environment";
    import { page } from "$app/state";
    import { Button } from "$lib/components/ui/button";
    import { route } from "$lib/ROUTES";
    import { title } from "$lib/store/title";
    import { cn } from "$lib/utils";
    import { m } from "$lib/paraglide/messages.js";

    type Props = {
        normalHeight: boolean;
    };

    const { normalHeight = false }: Props = $props();

    onMount(() => {
        $title = m.error_page_title();
    });
</script>

<div
    class={cn(
        "flex flex-col items-center justify-center gap-2 p-5",
        normalHeight ? "h-full" : "h-screen",
    )}
>
    <div class="flex flex-col gap-5 p-5 text-center">
        <h1 class="text-center text-[5rem] font-bold text-gray-700">
            {page.status ?? 500}
        </h1>

        {#if page.status === 404}
            <p class="text-2xl text-gray-800">{m.error_not_found()}</p>
            {#if dev}
                <p class="text-lg">{page.error?.message}</p>
            {:else}
                <p class="text-lg">
                    {m.error_not_found_description()}
                </p>
            {/if}
        {:else if page.status >= 401 && page.status <= 403}
            <p class="text-2xl text-gray-800">{m.error_no_access()}</p>
            <p class="text-lg">{m.error_unauthorized()}</p>
        {:else}
            <p class="text-2xl text-gray-800">{m.error_something_wrong()}</p>
            {#if dev || page.status === 403 || page.status === 401}
                <p class="max-w-3xl overflow-x-auto text-lg">
                    {page.error?.message}
                </p>
            {:else}
                <p class="text-lg">
                    {m.error_contact_admin()}
                </p>
            {/if}
        {/if}

        {#if page.error?.errorId && page.status === 500}
            <p class="text-muted-foreground max-w-[700px] text-center text-lg">
                {m.error_id({ errorId: page.error.errorId })}
            </p>
        {/if}
    </div>

    <Button href={route("/")}>{m.go_back_home()}</Button>
</div>
