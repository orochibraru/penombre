<script lang="ts">
	import {
		EllipsisVerticalIcon,
		HardDriveIcon,
		PlusIcon,
		UsersIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { invalidate } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { api } from "$lib/api";
	import DriveMembersDialog from "$lib/components/layout/dialogs/drive-members-dialog.svelte";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index";
	import { Input } from "$lib/components/ui/input";
	import type { DriveRole, DriveSummary } from "$lib/drives";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	const { data } = $props();

	$title = m.drives_title();

	const drives = $derived((data.drives ?? []) as DriveSummary[]);

	let createOpen = $state(false);
	let newName = $state("");
	let creating = $state(false);

	let membersOpen = $state(false);
	let membersDrive: DriveSummary | null = $state(null);

	let renameOpen = $state(false);
	let renameTarget: DriveSummary | null = $state(null);
	let renameName = $state("");

	let deleteOpen = $state(false);
	let deleteTarget: DriveSummary | null = $state(null);

	const roleLabels: Record<DriveRole, string> = {
		manager: m.drive_role_manager(),
		editor: m.drive_role_editor(),
		viewer: m.drive_role_viewer(),
	};

	async function create(event: SubmitEvent) {
		event.preventDefault();
		creating = true;
		const { error } = await api.POST("/api/v1/drives", {
			body: { name: newName.trim() },
		});
		creating = false;
		if (error) {
			toast.error(m.drive_create_error());
			return;
		}
		toast.success(m.drive_created());
		createOpen = false;
		newName = "";
		await invalidate("app:drives");
	}

	async function rename(event: SubmitEvent) {
		event.preventDefault();
		if (!renameTarget) {
			return;
		}
		const { error } = await api.PUT("/api/v1/drives/{id}", {
			params: { path: { id: renameTarget.id } },
			body: { name: renameName.trim() },
		});
		if (error) {
			toast.error(m.drive_rename_error());
			return;
		}
		toast.success(m.drive_renamed());
		renameOpen = false;
		await invalidate("app:drives");
	}

	async function remove() {
		if (!deleteTarget) {
			return;
		}
		const { error } = await api.DELETE("/api/v1/drives/{id}", {
			params: { path: { id: deleteTarget.id } },
		});
		if (error) {
			toast.error(m.drive_delete_error());
			return;
		}
		toast.success(m.drive_deleted());
		deleteOpen = false;
		await invalidate("app:drives");
	}
</script>

<div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="flex flex-col gap-1">
            <h1 class="text-lg font-semibold tracking-tight">
                {m.drives_title()}
            </h1>
            <p class="text-muted-foreground text-sm">
                {m.drives_description()}
            </p>
        </div>
        <Button
            onclick={() => {
                newName = "";
                createOpen = true;
            }}
        >
            <PlusIcon />
            {m.drive_new()}
        </Button>
    </div>

    {#if drives.length === 0}
        <Card.Root>
            <Card.Content
                class="flex flex-col items-center gap-2 py-12 text-center"
            >
                <HardDriveIcon class="text-muted-foreground size-6" />
                <p class="text-lg font-medium">{m.drives_empty()}</p>
                <p class="text-muted-foreground text-sm">
                    {m.drives_empty_hint()}
                </p>
            </Card.Content>
        </Card.Root>
    {:else}
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {#each drives as drive (drive.id)}
                <Card.Root>
                    <Card.Header>
                        <Card.Title class="flex min-w-0 items-center gap-2">
                            <HardDriveIcon class="text-primary size-4 shrink-0" />
                            <a
                                class="truncate hover:underline"
                                href={resolve("/(app)/drives/[drive]", {
                                    drive: drive.id,
                                })}
                            >
                                {drive.name}
                            </a>
                        </Card.Title>
                        <Card.Description>
                            <Badge variant="secondary">
                                {drive.owner
                                    ? m.drive_role_owner()
                                    : roleLabels[drive.role]}
                            </Badge>
                        </Card.Description>
                        <Card.Action>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger>
                                    {#snippet child({ props })}
                                        <Button
                                            {...props}
                                            variant="ghost"
                                            size="icon"
                                            aria-label={m.menu()}
                                        >
                                            <EllipsisVerticalIcon />
                                        </Button>
                                    {/snippet}
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end">
                                    <DropdownMenu.Item
                                        onclick={() => {
                                            membersDrive = drive;
                                            membersOpen = true;
                                        }}
                                    >
                                        <UsersIcon />
                                        {m.drive_members()}
                                    </DropdownMenu.Item>
                                    {#if drive.role === "manager"}
                                        <DropdownMenu.Item
                                            onclick={() => {
                                                renameTarget = drive;
                                                renameName = drive.name;
                                                renameOpen = true;
                                            }}
                                        >
                                            {m.drive_rename()}
                                        </DropdownMenu.Item>
                                    {/if}
                                    {#if drive.owner}
                                        <DropdownMenu.Item
                                            variant="destructive"
                                            onclick={() => {
                                                deleteTarget = drive;
                                                deleteOpen = true;
                                            }}
                                        >
                                            {m.drive_delete()}
                                        </DropdownMenu.Item>
                                    {/if}
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Card.Action>
                    </Card.Header>
                </Card.Root>
            {/each}
        </div>
    {/if}
</div>

<ResponsiveDialog
    bind:open={createOpen}
    bind:loading={creating}
    size="sm"
    title={m.drive_new()}
    description={m.drives_description()}
    submitLabel={m.drive_create()}
    loadingLabel={m.creating()}
    form={{ onsubmit: create }}
>
    <Input
        required
        bind:value={newName}
        placeholder={m.drive_name_placeholder()}
        aria-label={m.drive_name()}
    />
</ResponsiveDialog>

<ResponsiveDialog
    bind:open={renameOpen}
    size="sm"
    title={m.drive_rename()}
    submitLabel={m.rename()}
    form={{ onsubmit: rename }}
>
    <Input
        required
        bind:value={renameName}
        placeholder={m.drive_name_placeholder()}
        aria-label={m.drive_name()}
    />
</ResponsiveDialog>

<ResponsiveDialog
    bind:open={deleteOpen}
    size="sm"
    title={m.drive_delete()}
    submitLabel={m.delete()}
    submitVariant="destructive"
    onsubmit={remove}
>
    <p class="text-muted-foreground text-sm">
        {m.drive_delete_description()}
    </p>
</ResponsiveDialog>

<DriveMembersDialog
    bind:open={membersOpen}
    drive={membersDrive}
    onchanged={() => invalidate("app:drives")}
/>
