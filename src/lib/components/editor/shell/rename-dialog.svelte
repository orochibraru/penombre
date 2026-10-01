<script lang="ts">
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { baseName } from "#lib/documents.js";
	import { m } from "#lib/paraglide/messages.js";

	/** Renames the file on screen; the extension stays as it is. */
	let {
		open = $bindable(false),
		name,
		onrename,
	}: {
		open: boolean;
		name: string;
		onrename: (title: string) => Promise<boolean>;
	} = $props();

	let title = $state("");
	let loading = $state(false);

	$effect(() => {
		if (open) {
			title = baseName(name);
		}
	});

	async function submit() {
		const next = title.trim();
		if (!next) {
			return;
		}
		loading = true;
		if (await onrename(next)) {
			open = false;
		}
		loading = false;
	}
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    size="sm"
    title={m.shell_rename_title()}
    description={name}
    submitLabel={m.rename()}
    submitDisabled={!title.trim()}
    onsubmit={submit}
>
    <div class="flex flex-col gap-2">
        <Label for="shell-rename">{m.shell_rename_label()}</Label>
        <Input id="shell-rename" bind:value={title} autocomplete="off" />
    </div>
</ResponsiveDialog>
