<script lang="ts">
	import { toast } from "svelte-sonner";
	import { withLocation } from "#lib/components/file/file-links.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Input } from "#lib/components/ui/input/index.js";
	import { createTextFile } from "#lib/document-requests.js";
	import * as m from "#lib/paraglide/messages.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";

	interface Props {
		open: boolean;
	}

	let { open = $bindable(false) }: Props = $props();

	let name: string = $state("untitled.txt");
	let loading: boolean = $state(false);
	let inputRef: HTMLInputElement | null = $state(null);

	$effect(() => {
		if (open && inputRef) {
			setTimeout(() => inputRef?.select(), 0);
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		const id = await createTextFile(
			name.trim(),
			"",
			undefined,
			page.params.path || undefined,
		);
		loading = false;
		if (!id) {
			toast.error(m.new_document_error());
			return;
		}
		open = false;
		name = "untitled.txt";
		await goto(withLocation(resolve("/(app)/edit/[fileId]", { fileId: id })));
	}
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    title={m.new_text_file_title()}
    description={m.new_text_file_description()}
    submitLabel={m.create()}
    loadingLabel={m.creating()}
    form={{ onsubmit: handleSubmit }}
>
    <Input
        required
        type="text"
        bind:value={name}
        bind:ref={inputRef}
        class="w-full font-mono"
    />
</ResponsiveDialog>
