<script lang="ts">
	import { SearchIcon, XIcon } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select/index.js";
	import type { DriveRole } from "$lib/drives";
	import { m } from "$lib/paraglide/messages.js";

	interface Person {
		id: string;
		name: string;
		email: string;
		image: string | null;
	}

	interface Member {
		userId: string;
		name: string;
		email: string;
		image: string | null;
		role: DriveRole;
		owner: boolean;
	}

	interface Props {
		open: boolean;
		drive: { id: string; name: string; role: DriveRole } | null;
		/** Called after anything changed, so the caller can reload its data. */
		onchanged?: () => void;
	}

	let { open = $bindable(false), drive = null, onchanged }: Props = $props();

	let members: Member[] = $state([]);
	let query = $state("");
	let results: Person[] = $state([]);
	let searching = $state(false);
	let loading = $state(false);
	let role = $state<DriveRole>("editor");

	const manages = $derived(drive?.role === "manager");

	const roleOptions = [
		{ value: "manager", label: m.drive_role_manager() },
		{ value: "editor", label: m.drive_role_editor() },
		{ value: "viewer", label: m.drive_role_viewer() },
	];

	const roleLabel = (value: string) =>
		roleOptions.find((option) => option.value === value)?.label ?? value;

	$effect(() => {
		if (open && drive) {
			void loadMembers(drive.id);
		} else {
			query = "";
			results = [];
		}
	});

	async function loadMembers(driveId: string) {
		const { data } = await api.GET("/api/v1/drives/{id}/members", {
			params: { path: { id: driveId } },
		});
		members = (data?.data as Member[] | undefined) ?? [];
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function onQuery(value: string) {
		query = value;
		clearTimeout(searchTimer);
		if (!value.trim()) {
			results = [];
			return;
		}
		// Debounced: one request per pause, not per keystroke.
		searchTimer = setTimeout(() => void runSearch(value), 250);
	}

	async function runSearch(value: string) {
		searching = true;
		try {
			const { data } = await api.GET("/api/v1/users/search", {
				params: { query: { q: value } },
			});
			const found = (data?.data as Person[] | undefined) ?? [];
			const already = new Set(members.map((member) => member.userId));
			results = found.filter((person) => !already.has(person.id));
		} finally {
			searching = false;
		}
	}

	async function add(person: Person) {
		if (!drive) {
			return;
		}
		loading = true;
		try {
			const { error } = await api.POST("/api/v1/drives/{id}/members", {
				params: { path: { id: drive.id } },
				body: { userIds: [person.id], role },
			});
			if (error) {
				toast.error(m.drive_member_add_error());
				return;
			}
			toast.success(m.toast_shared_with({ name: person.name }));
			query = "";
			results = [];
			await loadMembers(drive.id);
			onchanged?.();
		} finally {
			loading = false;
		}
	}

	async function changeRole(member: Member, next: DriveRole) {
		if (!drive || member.role === next) {
			return;
		}
		const { error } = await api.POST("/api/v1/drives/{id}/members", {
			params: { path: { id: drive.id } },
			body: { userIds: [member.userId], role: next },
		});
		if (error) {
			toast.error(m.drive_member_add_error());
			return;
		}
		await loadMembers(drive.id);
		onchanged?.();
	}

	async function remove(member: Member) {
		if (!drive) {
			return;
		}
		const { error } = await api.DELETE("/api/v1/drives/{id}/members/{userId}", {
			params: { path: { id: drive.id, userId: member.userId } },
		});
		if (error) {
			toast.error(m.drive_member_remove_error());
			return;
		}
		toast.success(m.drive_member_removed());
		await loadMembers(drive.id);
		onchanged?.();
	}

	const initials = (name: string) =>
		name
			.split(" ")
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    size="sm"
    title={m.drive_members()}
    description={drive?.name ?? m.drive_members_description()}
    cancelLabel={m.done()}
>
    <div class="flex min-w-0 flex-col gap-4">
        {#if manages}
            <div class="flex flex-col gap-2">
                <Label for="drive-people">{m.share_add_people()}</Label>
                <div class="flex gap-2">
                    <div class="relative flex-1">
                        <SearchIcon
                            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                        />
                        <Input
                            id="drive-people"
                            autocomplete="off"
                            class="pl-8"
                            placeholder={m.share_people_placeholder()}
                            value={query}
                            oninput={(e) => onQuery(e.currentTarget.value)}
                        />
                    </div>
                    <Select.Root
                        type="single"
                        value={role}
                        onValueChange={(value) => (role = value as DriveRole)}
                    >
                        <Select.Trigger class="w-32 shrink-0">
                            {roleLabel(role)}
                        </Select.Trigger>
                        <Select.Content>
                            {#each roleOptions as option (option.value)}
                                <Select.Item value={option.value}>
                                    {option.label}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            {#if query.trim()}
                <div class="flex flex-col gap-1">
                    {#each results as person (person.id)}
                        <button
                            type="button"
                            class="hover:bg-muted/60 flex items-center gap-2.5 rounded-lg p-2 text-left transition-colors"
                            onclick={() => add(person)}
                        >
                            <span
                                class="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                                aria-hidden="true"
                            >
                                {initials(person.name)}
                            </span>
                            <span class="min-w-0">
                                <span class="block truncate text-sm">
                                    {person.name}
                                </span>
                                <span
                                    class="text-muted-foreground block truncate text-xs"
                                >
                                    {person.email}
                                </span>
                            </span>
                        </button>
                    {:else}
                        <p class="text-muted-foreground px-2 py-3 text-sm">
                            {searching ? m.searching() : m.share_no_matches()}
                        </p>
                    {/each}
                </div>
            {/if}
        {/if}

        <div class="flex min-w-0 flex-col gap-1">
            <p class="text-muted-foreground text-xs font-medium">
                {m.share_people_with_access()}
            </p>
            {#each members as member (member.userId)}
                <div class="flex min-w-0 items-center gap-2.5 rounded-lg p-2">
                    <span
                        class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                        aria-hidden="true"
                    >
                        {initials(member.name)}
                    </span>
                    <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm">{member.name}</span>
                        <span
                            class="text-muted-foreground block truncate text-xs"
                        >
                            {member.email}
                        </span>
                    </span>
                    {#if member.owner}
                        <span class="text-muted-foreground shrink-0 text-xs">
                            {m.drive_role_owner()}
                        </span>
                    {:else if manages}
                        <Select.Root
                            type="single"
                            value={member.role}
                            onValueChange={(value) =>
                                changeRole(member, value as DriveRole)}
                        >
                            <Select.Trigger class="w-28 shrink-0">
                                {roleLabel(member.role)}
                            </Select.Trigger>
                            <Select.Content>
                                {#each roleOptions as option (option.value)}
                                    <Select.Item value={option.value}>
                                        {option.label}
                                    </Select.Item>
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="text-muted-foreground hover:text-destructive size-8 shrink-0"
                            aria-label={m.revoke()}
                            onclick={() => remove(member)}
                        >
                            <XIcon class="size-4" />
                        </Button>
                    {:else}
                        <span class="text-muted-foreground shrink-0 text-xs">
                            {roleLabel(member.role)}
                        </span>
                    {/if}
                </div>
            {/each}
            {#if !manages}
                <p class="text-muted-foreground px-2 pt-2 text-xs">
                    {m.drive_manager_only()}
                </p>
            {/if}
        </div>
    </div>
</ResponsiveDialog>
