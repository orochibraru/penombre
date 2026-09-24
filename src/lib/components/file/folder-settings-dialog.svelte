<script lang="ts">
	import { toast } from "svelte-sonner";
	import { api, type paths } from "#lib/api/index.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import { m } from "#lib/paraglide/messages.js";

	type Loaded =
		paths["/api/v1/storage/folder/{path}/settings"]["get"]["responses"][200]["content"]["application/json"]["data"];

	let {
		open = $bindable(false),
		folderId,
		folderName,
	}: {
		open: boolean;
		folderId: string;
		folderName: string;
	} = $props();

	let loaded = $state<Loaded | null>(null);
	let saving = $state(false);
	let versioning = $state<"inherit" | "on" | "off">("inherit");
	let maxVersions = $state("");

	$effect(() => {
		if (open && folderId) {
			void load();
		}
	});

	async function load() {
		loaded = null;
		const { data, error } = await api.GET(
			"/api/v1/storage/folder/{path}/settings",
			{ params: { path: { path: folderId } } },
		);
		if (error || !data?.data) {
			toast.error(m.folder_settings_load_error());
			open = false;
			return;
		}
		loaded = data.data;
		const set = data.data.settings.versioning;
		versioning = set === undefined ? "inherit" : set ? "on" : "off";
		maxVersions = data.data.settings.maxVersions?.toString() ?? "";
	}

	async function save() {
		const max = maxVersions.trim() ? Number(maxVersions) : undefined;
		if (max !== undefined && !(Number.isInteger(max) && max >= 1)) {
			toast.error(m.folder_settings_max_invalid());
			return;
		}
		saving = true;
		const { error } = await api.PUT("/api/v1/storage/folder/{path}/settings", {
			params: { path: { path: folderId } },
			body: {
				versioning: versioning === "inherit" ? undefined : versioning === "on",
				maxVersions: max,
			},
		});
		saving = false;
		if (error) {
			toast.error(m.folder_settings_save_error());
			return;
		}
		toast.success(m.folder_settings_saved());
		open = false;
	}

	const inheritedLabel = $derived(
		loaded?.inherited.enabled
			? m.folder_settings_on()
			: m.folder_settings_off(),
	);
</script>

<ResponsiveDialog
    bind:open
    title={m.folder_settings_title()}
    description={folderName}
    size="sm"
    submitLabel={m.save_changes()}
    loading={saving}
    submitDisabled={!loaded}
    onsubmit={save}
>
    {#if loaded}
        <div class="flex min-w-0 flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label for="folder-versioning">{m.folder_settings_versioning()}</Label>
                <select
                    id="folder-versioning"
                    bind:value={versioning}
                    class="border-input bg-transparent ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-hidden"
                >
                    <option value="inherit">
                        {m.folder_settings_inherit({ value: inheritedLabel })}
                    </option>
                    <option value="on">{m.folder_settings_on()}</option>
                    <option value="off">{m.folder_settings_off()}</option>
                </select>
                <p class="text-muted-foreground text-xs">
                    {m.folder_settings_versioning_hint()}
                </p>
            </div>
            <div class="flex flex-col gap-2">
                <Label for="folder-max-versions">{m.folder_settings_max()}</Label>
                <Input
                    id="folder-max-versions"
                    inputmode="numeric"
                    placeholder={String(loaded.inherited.max)}
                    bind:value={maxVersions}
                    class="w-32"
                />
                <p class="text-muted-foreground text-xs">
                    {m.folder_settings_max_hint({ max: String(loaded.adminMax) })}
                </p>
            </div>
        </div>
    {:else}
        <p class="text-muted-foreground text-sm">{m.versions_loading()}</p>
    {/if}
</ResponsiveDialog>
