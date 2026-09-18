<script lang="ts">
	import {
		ArrowLeftIcon,
		HardDriveIcon,
		LockIcon,
		Trash2Icon,
		UsersIcon,
	} from "@lucide/svelte";
	import type { ObjectList } from "#lib/api/index.js";
	import FileLayout from "#lib/components/file/layout.svelte";
	import DriveMembersDialog from "#lib/components/layout/dialogs/drive-members-dialog.svelte";
	import Badge from "#lib/components/ui/badge/badge.svelte";
	import Button from "#lib/components/ui/button/button.svelte";
	import type { DriveRole } from "#lib/drives.js";
	import { m } from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { invalidate } from "$app/navigation";
	import { page } from "$app/state";

	interface Props {
		data: {
			drive: { id: string; name: string; role: DriveRole; readOnly: boolean };
			files: { data: ObjectList | undefined; err: unknown };
			title?: string;
			preferences?: Record<string, unknown>;
		};
	}

	const { data }: Props = $props();

	let membersOpen = $state(false);

	// The same header serves the drive's listings and its trash; the trash is
	// a leaf, so from there the button goes back rather than deeper.
	const inTrash = $derived(page.url.pathname.endsWith("/trash"));

	$effect(() => {
		title.set(data.title ?? data.drive.name);
	});
</script>

<div class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center gap-2">
        <HardDriveIcon class="text-primary size-4" />
        <h1 class="text-lg font-semibold tracking-tight">
            {data.drive.name}
        </h1>
        {#if data.drive.readOnly}
            <Badge variant="secondary">
                <LockIcon />
                {m.volume_read_only()}
            </Badge>
        {/if}
        <div class="ml-auto flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                href={inTrash
                    ? `/drives/${data.drive.id}`
                    : `/drives/${data.drive.id}/trash`}
            >
                {#if inTrash}
                    <ArrowLeftIcon />
                    {data.drive.name}
                {:else}
                    <Trash2Icon />
                    {m.nav_trash()}
                {/if}
            </Button>
            <Button variant="outline" size="sm" onclick={() => (membersOpen = true)}>
                <UsersIcon />
                {m.drive_members()}
            </Button>
        </div>
    </div>

    <FileLayout data={data.files} preferences={data.preferences} />
</div>

<DriveMembersDialog
    bind:open={membersOpen}
    drive={data.drive}
    onchanged={() => invalidate("app:files")}
/>
