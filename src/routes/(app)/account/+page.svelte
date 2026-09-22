<script lang="ts">
	import { DownloadIcon, SaveIcon } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { clickDownload } from "#lib/components/file/wrapper.svelte.js";
	import Button from "#lib/components/ui/button/button.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import Input from "#lib/components/ui/input/input.svelte";
	import Label from "#lib/components/ui/label/label.svelte";
	import { mapFormError } from "#lib/form-errors.js";
	import { enhance } from "#lib/forms.js";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";

	onMount(() => {
		title.set(m.title_account_details());
	});

	const { data, form } = $props();

	let email = $derived(data.user.email);
	let name = $derived(data.user.name);
	let hasChanged = $state(false);
	let loading = $state(false);

	// Depends only on the fields, so it re-runs on every keystroke without
	// caring whether a previous submit's `form` result is still around.
	$effect(() => {
		hasChanged = email !== data.user.email || name !== data.user.name;
	});

	// Depends only on `form`, which changes once per submission and never on
	// a keystroke; the split is what stops a stale `form.success` re-firing
	// the toast (and disabling Save) on every character typed afterward.
	$effect(() => {
		if (form?.success) {
			toast.success(m.toast_account_updated());
			hasChanged = false;
		} else if (form?.error) {
			toast.error(m.toast_account_update_error(), {
				description: mapFormError(form.error),
			});
		}
	});

	/** A same-origin `<a download>` click, not `fetch` + blob: the browser
	 * streams a multi-gigabyte archive straight to disk instead of buffering
	 * it in JS memory. */
	function downloadExport(url: string, filename: string) {
		clickDownload(url, filename);
		toast.info(m.toast_export_started());
	}
</script>

<div class="flex w-full flex-col gap-4">
    <Card.Root>
        <Card.Header>
            <Card.Title>{m.account_details()}</Card.Title>
        </Card.Header>
        <Card.Content>
            <form
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
                        <Label for="account-email">{m.email()}</Label>
                        <Input
                            id="account-email"
                            type="email"
                            autocomplete="email"
                            name="email"
                            bind:value={email}
                        />
                    </div>
                    <div class="flex w-full flex-col gap-1.5">
                        <Label for="account-name">{m.name()}</Label>
                        <Input
                            id="account-name"
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
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.account_export_title()}</Card.Title>
            <Card.Description>{m.account_export_description()}</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-wrap gap-3">
            <Button
                variant="outline"
                onclick={() =>
                    downloadExport(
                        "/api/v1/account/export",
                        "penombre-export.zip",
                    )}
            >
                <DownloadIcon />
                {m.account_export_files()}
            </Button>
            <Button
                variant="outline"
                onclick={() =>
                    downloadExport(
                        "/api/v1/account/data",
                        "penombre-account-data.json",
                    )}
            >
                <DownloadIcon />
                {m.account_export_data()}
            </Button>
        </Card.Content>
    </Card.Root>
</div>
