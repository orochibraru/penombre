<script lang="ts">
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import { withLocation } from "#lib/components/file/file-links.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Input } from "#lib/components/ui/input/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import { TEMPLATE_IDS } from "#lib/slides/templates/index.js";
	import { goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import TemplateGallery from "./template-gallery.svelte";

	/**
	 * New presentation: pick a template, name it, and land in the editor.
	 * The server writes the `.pptx` from the template, so the file is a real
	 * PowerPoint deck from its first second.
	 */
	let { open = $bindable(false), folder }: { open: boolean; folder?: string } =
		$props();

	let template = $state(TEMPLATE_IDS[0] ?? "midnight");
	let name = $state("");
	let loading = $state(false);

	async function create() {
		loading = true;
		const { data, error } = await api.POST("/api/v1/documents/presentation", {
			body: {
				// The contract's enum is the same list as TEMPLATE_IDS.
				template: template as never,
				name: name.trim() || m.slides_untitled(),
				folder,
			},
		});
		loading = false;
		const id = data?.data?.id;
		if (error || !id) {
			toast.error(m.slides_create_error());
			return;
		}
		open = false;
		name = "";
		await goto(withLocation(resolve("/(app)/edit/[fileId]", { fileId: id })));
	}
</script>

<ResponsiveDialog
	bind:open
	bind:loading
	title={m.slides_new_presentation()}
	description={m.slides_choose_template()}
	size="lg"
	submitLabel={m.create()}
	loadingLabel={m.create()}
	bodyClass="max-h-[70vh]"
	onsubmit={() => void create()}
>
	<div class="flex flex-col gap-4">
		<label class="flex flex-col gap-1.5">
			<span class="text-sm font-medium">{m.name()}</span>
			<Input bind:value={name} placeholder={m.slides_untitled()} maxlength={200} />
		</label>
		<TemplateGallery bind:selected={template} />
	</div>
</ResponsiveDialog>
