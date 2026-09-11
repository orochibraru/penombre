<script lang="ts" module>
	import type { HTMLFormAttributes } from "svelte/elements";
	import type { ButtonVariant } from "$lib/components/ui/button";

	export type DialogSize = "sm" | "md" | "lg" | "fullscreen";

	export interface ResponsiveDialogProps {
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
		/** Callback fired when the submit button is clicked (non-form mode) */
		onsubmit?: () => void;
		/** Overrides the dismiss button's label (defaults to Cancel/Close). */
		cancelLabel?: string;
		/** Form props - if provided, children are wrapped in a form */
		form?: {
			action?: HTMLFormAttributes["action"];
			method?: HTMLFormAttributes["method"];
			enctype?: HTMLFormAttributes["enctype"];
			onsubmit?: (e: SubmitEvent) => void;
		};
	}

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
    import { m } from "$lib/paraglide/messages.js";
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
        onsubmit,
        cancelLabel,
        form,
        children,
        footer,
    }: ResponsiveDialogProps & {
        children: Snippet;
        /** Optional custom footer snippet. If provided, replaces default buttons. */
        footer?: Snippet;
    } = $props();

    const isDesktop = new MediaQuery("(min-width: 768px)");
	/**
	 * Most of these dialogs do their work in the browser and pass no `action`.
	 * Submitting such a form posts to the current page, which has no form
	 * actions — SvelteKit answers 405 and the click appears to do nothing.
	 * So: enhance only a real server action, and stop the native submit
	 * otherwise.
	 */
	function enhanceWhenAction(node: HTMLFormElement) {
		return form?.action ? enhance(node) : undefined;
	}

	function handleSubmit(event: SubmitEvent) {
		if (!form?.action) {
			event.preventDefault();
		}
		form?.onsubmit?.(event);
	}
</script>

{#snippet footerButtons()}
    {#if footer}
        {@render footer()}
    {:else if form || onsubmit}
        <Button
            type={form ? "submit" : "button"}
            variant={submitVariant}
            disabled={submitDisabled}
            onclick={!form && onsubmit ? onsubmit : undefined}
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
            {cancelLabel ?? (form || onsubmit ? m.cancel() : m.close())}
        </Dialog.Close>
    {:else}
        <Drawer.Close
            disabled={loading}
            type="button"
            class={buttonVariants({ variant: "outline" })}
        >
            {cancelLabel ?? (form || onsubmit ? m.cancel() : m.close())}
        </Drawer.Close>
    {/if}
{/snippet}

{#snippet formWrapper(content: Snippet)}
    {#if form}
        <form
            action={form.action}
            method={form.method ?? "POST"}
            enctype={form.enctype}
            onsubmit={handleSubmit}
            use:enhanceWhenAction
        >
            <fieldset disabled={loading} class="flex flex-col gap-4">
                <div
                    class="-mx-1 max-h-[40vh] overflow-y-auto px-1 md:max-h-[50vh]"
                >
                    {@render content()}
                </div>
                {@render footerButtons()}
            </fieldset>
        </form>
    {:else}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="flex flex-col gap-4"
            role="group"
            onkeydown={(e) => {
                if (
                    e.key === "Enter" &&
                    onsubmit &&
                    !submitDisabled &&
                    !loading
                ) {
                    e.preventDefault();
                    onsubmit();
                }
            }}
        >
            <div
                    class="-mx-1 max-h-[40vh] overflow-y-auto px-1 md:max-h-[50vh]"
                >
                {@render content()}
            </div>
            {@render footerButtons()}
        </div>
    {/if}
{/snippet}

{#if isDesktop.current}
    <Dialog.Root bind:open>
        <Dialog.Content
            class={cn("max-h-[85%] overflow-y-auto", sizeClasses[size], contentClass)}
        >
            <Dialog.Header class="min-w-0">
                <Dialog.Title class="wrap-break-word">{title}</Dialog.Title>
                {#if description}
                    <Dialog.Description class="wrap-break-word">
                        {description}
                    </Dialog.Description>
                {/if}
            </Dialog.Header>
            {@render formWrapper(children)}
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Drawer.Root bind:open>
        <Drawer.Content class="z-50">
            <Drawer.Header class="min-w-0">
                <Drawer.Title class="text-lg wrap-break-word">{title}</Drawer.Title>
                {#if description}
                    <Drawer.Description
                        class="text-muted-foreground text-sm wrap-break-word"
                    >
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
