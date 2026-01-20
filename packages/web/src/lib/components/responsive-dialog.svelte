<script lang="ts" module>
    import type { HTMLFormAttributes } from "svelte/elements";
    import type { ButtonVariant } from "$lib/components/ui/button";

    export type DialogSize = "sm" | "md" | "lg" | "fullscreen";

    export type ResponsiveDialogProps = {
        open: boolean;
        loading?: boolean;
        title: string;
        description?: string;
        /** Dialog size: sm, md, lg, or fullscreen. Default is md */
        size?: DialogSize;
        contentClass?: string;
        /** Label for the submit button */
        submitLabel?: string;
        /** Label shown on submit button while loading */
        loadingLabel?: string;
        /** Button variant for submit button (e.g., "destructive") */
        submitVariant?: ButtonVariant;
        /** If true, submit button is disabled */
        submitDisabled?: boolean;
        /** Form props - if provided, children are wrapped in a form */
        form?: {
            action?: HTMLFormAttributes["action"];
            method?: HTMLFormAttributes["method"];
            enctype?: HTMLFormAttributes["enctype"];
            onsubmit?: (e: SubmitEvent) => void;
        };
    };

    const sizeClasses: Record<DialogSize, string> = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "md:max-w-3xl lg:max-w-5xl xl:max-w-7xl",
        fullscreen: "!max-w-none !w-screen !h-screen !rounded-none",
    };
</script>

<script lang="ts">
    import type { Snippet } from "svelte";
    import { MediaQuery } from "svelte/reactivity";
    import { Button, buttonVariants } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog/index";
    import * as Drawer from "$lib/components/ui/drawer/index";
    import { cn } from "$lib/utils";
    import { enhance } from "$app/forms";

    let {
        open = $bindable(false),
        loading = $bindable(false),
        title,
        description,
        size = "md",
        contentClass,
        submitLabel = "Submit",
        loadingLabel = "Loading...",
        submitVariant = "default",
        submitDisabled = false,
        form,
        children,
        footer,
    }: ResponsiveDialogProps & {
        children: Snippet;
        /** Optional custom footer snippet. If provided, replaces default buttons. */
        footer?: Snippet;
    } = $props();

    const isDesktop = new MediaQuery("(min-width: 768px)");
</script>

{#snippet footerButtons()}
    {#if footer}
        {@render footer()}
    {:else}
        <Button
            type={form ? "submit" : "button"}
            variant={submitVariant}
            disabled={submitDisabled}
            {loading}
        >
            {loading ? loadingLabel : submitLabel}
        </Button>
    {/if}
    {#if isDesktop.current}
        <Dialog.Close
            disabled={loading}
            type="button"
            class={buttonVariants({ variant: "outline" })}
        >
            Cancel
        </Dialog.Close>
    {:else}
        <Drawer.Close
            disabled={loading}
            type="button"
            class={buttonVariants({ variant: "outline" })}
        >
            Cancel
        </Drawer.Close>
    {/if}
{/snippet}

{#snippet formWrapper(content: Snippet)}
    {#if form}
        <form
            action={form.action}
            method={form.method ?? "POST"}
            enctype={form.enctype}
            onsubmit={form.onsubmit}
            use:enhance
        >
            <fieldset disabled={loading} class="flex flex-col gap-4">
                <div class="overflow-y-auto max-h-[40vh] md:max-h-[50vh]">
                    {@render content()}
                </div>
                {@render footerButtons()}
            </fieldset>
        </form>
    {:else}
        <div class="overflow-y-auto max-h-[40vh] md:max-h-[50vh]">
            {@render content()}
        </div>
        {@render footerButtons()}
    {/if}
{/snippet}

{#if isDesktop.current}
    <Dialog.Root bind:open>
        <Dialog.Content
            class={cn("max-h-[70%] pb-16", sizeClasses[size], contentClass)}
        >
            <Dialog.Header>
                <Dialog.Title>{title}</Dialog.Title>
                {#if description}
                    <Dialog.Description>{description}</Dialog.Description>
                {/if}
            </Dialog.Header>
            {@render formWrapper(children)}
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Drawer.Root bind:open>
        <Drawer.Content class="z-50">
            <Drawer.Header>
                <Drawer.Title class="text-lg">{title}</Drawer.Title>
                {#if description}
                    <Drawer.Description class="text-sm text-muted-foreground">
                        {description}
                    </Drawer.Description>
                {/if}
            </Drawer.Header>
            <div class="p-4 flex flex-col gap-2">
                {@render formWrapper(children)}
            </div>
        </Drawer.Content>
    </Drawer.Root>
{/if}
