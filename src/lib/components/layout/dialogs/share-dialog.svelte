<script lang="ts">
	import {
		CheckIcon,
		LinkIcon,
		SearchIcon,
		UsersIcon,
		XIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api, type ObjectItem } from "$lib/api";
	import ResponsiveDialog from "$lib/components/responsive-dialog.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { m } from "$lib/paraglide/messages.js";
	import { isFolderItem } from "$lib/utils";

	interface Props {
		open: boolean;
		item: ObjectItem | null;
	}

	interface Recipient {
		id: string;
		name: string;
		email: string;
		image: string | null;
	}

	interface ResourceShare {
		sharedWithId: string;
		permission: "read" | "write" | "admin";
		user: Recipient;
	}

	let { open = $bindable(false), item = $bindable(null) }: Props = $props();

	let tab = $state("link");

	// --- Link tab -----------------------------------------------------------
	let password = $state("");
	let expiresInDays = $state("0");
	let requiresAuth = $state(false);
	let loading = $state(false);
	let createdUrl = $state("");
	let copied = $state(false);

	// --- People tab ---------------------------------------------------------
	let query = $state("");
	let results: Recipient[] = $state([]);
	let searching = $state(false);
	let permission = $state<"read" | "write" | "admin">("read");
	let shares: ResourceShare[] = $state([]);

	/** `{resourceType, resourceId}` for the item, or null when there is none. */
	const target = $derived.by(() => {
		if (!item) {
			return null;
		}
		const isFolder = isFolderItem(item);
		return {
			// Folder keys carry a trailing slash; file rows key by id.
			resourceType: (isFolder ? "folder" : "file") as "folder" | "file",
			resourceId: isFolder
				? item.key.slice(0, -1)
				: (item.metadata.id ?? item.key),
		};
	});

	const expiryOptions = [
		{ value: "0", label: m.share_expiry_never() },
		{ value: "1", label: m.share_expiry_days({ count: "1" }) },
		{ value: "7", label: m.share_expiry_days({ count: "7" }) },
		{ value: "30", label: m.share_expiry_days({ count: "30" }) },
	];

	const permissionOptions = [
		{ value: "read", label: m.permission_read() },
		{ value: "write", label: m.permission_write() },
		{ value: "admin", label: m.permission_admin() },
	];

	const expiryLabel = $derived(
		expiryOptions.find((o) => o.value === expiresInDays)?.label ??
			m.share_expiry_never(),
	);
	const permissionLabel = $derived(
		permissionOptions.find((o) => o.value === permission)?.label ??
			m.permission_read(),
	);

	// Reset between openings so a previous item's link or people never linger.
	$effect(() => {
		if (open) {
			return;
		}
		tab = "link";
		password = "";
		expiresInDays = "0";
		requiresAuth = false;
		createdUrl = "";
		copied = false;
		query = "";
		results = [];
		shares = [];
		permission = "read";
	});

	// Who this item is already shared with, refreshed whenever it opens.
	$effect(() => {
		if (!(open && target)) {
			return;
		}
		void loadShares(target);
	});

	async function loadShares(t: {
		resourceType: "file" | "folder";
		resourceId: string;
	}) {
		const { data } = await api.GET("/api/v1/sharings", {
			params: { query: t },
		});
		shares = (data?.data as ResourceShare[] | undefined) ?? [];
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
			const found = (data?.data as Recipient[] | undefined) ?? [];
			const already = new Set(shares.map((s) => s.user.id));
			results = found.filter((r) => !already.has(r.id));
		} finally {
			searching = false;
		}
	}

	async function shareWith(recipient: Recipient) {
		if (!target) {
			return;
		}
		loading = true;
		try {
			const { error } = await api.POST("/api/v1/sharings", {
				body: { ...target, userIds: [recipient.id], permission },
			});
			if (error) {
				toast.error(m.toast_share_user_error());
				return;
			}
			toast.success(m.toast_shared_with({ name: recipient.name }));
			query = "";
			results = [];
			await loadShares(target);
		} finally {
			loading = false;
		}
	}

	async function revokeUser(share: ResourceShare) {
		if (!target) {
			return;
		}
		const { error } = await api.DELETE("/api/v1/sharings/{id}", {
			params: { path: { id: share.sharedWithId } },
		});
		if (error) {
			toast.error(m.toast_share_revoke_error());
			return;
		}
		await loadShares(target);
	}

	async function createLink() {
		if (!target) {
			return;
		}
		loading = true;
		try {
			const { data, error } = await api.POST("/api/v1/shares", {
				body: {
					...target,
					...(password ? { password } : {}),
					expiresInDays: Number(expiresInDays),
					requiresAuth,
				},
			});

			if (error || !data?.data) {
				toast.error(m.toast_share_create_error());
				return;
			}

			createdUrl = `${window.location.origin}/s/${data.data.token}`;
			toast.success(m.toast_share_created());
		} finally {
			loading = false;
		}
	}

	async function copyLink() {
		await navigator.clipboard.writeText(createdUrl);
		copied = true;
		toast.success(m.toast_link_copied());
	}

	const initials = (name: string) =>
		name
			.split(" ")
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");

	// The footer button only drives the link tab; the people tab acts inline.
	const submitLabel = $derived(
		tab === "people" ? undefined : createdUrl ? m.copy_link() : m.create_link(),
	);
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    size="sm"
    title={m.share_dialog_title()}
    description={item?.metadata.name ?? ""}
    submitLabel={submitLabel ?? ""}
    loadingLabel={m.creating()}
    onsubmit={tab === "people"
        ? undefined
        : createdUrl
          ? copyLink
          : createLink}
    cancelLabel={tab === "people" || createdUrl ? m.done() : undefined}
>
    <Tabs.Root bind:value={tab} class="w-full gap-4">
        <Tabs.List class="grid w-full grid-cols-2">
            <Tabs.Trigger value="link">
                <LinkIcon />
                {m.share_tab_link()}
            </Tabs.Trigger>
            <Tabs.Trigger value="people">
                <UsersIcon />
                {m.share_tab_people()}
            </Tabs.Trigger>
        </Tabs.List>

        <!-- Anonymous capability URL -->
        <Tabs.Content value="link" class="flex flex-col gap-5">
            {#if createdUrl}
                <div class="flex flex-col items-center gap-3 py-2 text-center">
                    <div
                        class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xs"
                    >
                        {#if copied}
                            <CheckIcon class="size-5" />
                        {:else}
                            <LinkIcon class="size-5" />
                        {/if}
                    </div>
                    <p class="text-sm font-medium">{m.share_link()}</p>
                    <Input
                        readonly
                        value={createdUrl}
                        class="bg-muted/50 text-center font-mono text-xs"
                        onfocus={(e) => e.currentTarget.select()}
                    />
                    <p class="text-muted-foreground text-xs text-balance">
                        {m.share_link_hint()}
                    </p>
                </div>
            {:else}
                <div class="flex flex-col gap-2">
                    <Label for="share-password">
                        {m.share_password_optional()}
                    </Label>
                    <Input
                        id="share-password"
                        type="password"
                        autocomplete="off"
                        bind:value={password}
                        placeholder={m.share_password_placeholder()}
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <Label for="share-expiry">{m.share_expiry()}</Label>
                    <Select.Root type="single" bind:value={expiresInDays}>
                        <Select.Trigger id="share-expiry" class="w-full">
                            {expiryLabel}
                        </Select.Trigger>
                        <Select.Content>
                            {#each expiryOptions as option (option.value)}
                                <Select.Item value={option.value}>
                                    {option.label}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                </div>

                <Label
                    class="hover:bg-muted/50 has-data-[state=checked]:border-ring has-data-[state=checked]:bg-muted/50 flex cursor-pointer items-start gap-3 rounded-xs border p-3 transition-colors"
                >
                    <Checkbox bind:checked={requiresAuth} class="mt-0.5" />
                    <span class="text-sm font-normal">
                        {m.share_requires_auth()}
                    </span>
                </Label>
            {/if}
        </Tabs.Content>

        <!-- Named accounts on this instance -->
        <Tabs.Content value="people" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <Label for="share-people">{m.share_add_people()}</Label>
                <div class="flex gap-2">
                    <div class="relative flex-1">
                        <SearchIcon
                            class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                        />
                        <Input
                            id="share-people"
                            autocomplete="off"
                            class="pl-8"
                            placeholder={m.share_people_placeholder()}
                            value={query}
                            oninput={(e) => onQuery(e.currentTarget.value)}
                        />
                    </div>
                    <Select.Root
                        type="single"
                        value={permission}
                        onValueChange={(v) =>
                            (permission = v as "read" | "write" | "admin")}
                    >
                        <Select.Trigger class="w-32 shrink-0">
                            {permissionLabel}
                        </Select.Trigger>
                        <Select.Content>
                            {#each permissionOptions as option (option.value)}
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
                            class="hover:bg-muted/60 flex items-center gap-2.5 rounded-xs p-2 text-left transition-colors"
                            onclick={() => shareWith(person)}
                        >
                            <span
                                class="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-xs text-xs font-medium"
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

            <div class="flex flex-col gap-1">
                <p class="text-muted-foreground text-xs font-medium">
                    {m.share_people_with_access()}
                </p>
                {#each shares as share (share.sharedWithId)}
                    <div class="flex items-center gap-2.5 rounded-xs p-2">
                        <span
                            class="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-xs text-xs font-medium"
                            aria-hidden="true"
                        >
                            {initials(share.user.name)}
                        </span>
                        <span class="min-w-0 flex-1">
                            <span class="block truncate text-sm">
                                {share.user.name}
                            </span>
                            <span
                                class="text-muted-foreground block truncate text-xs"
                            >
                                {share.user.email}
                            </span>
                        </span>
                        <span class="text-muted-foreground shrink-0 text-xs">
                            {permissionOptions.find(
                                (o) => o.value === share.permission,
                            )?.label}
                        </span>
                        <Button
                            variant="ghost"
                            size="icon"
                            class="text-muted-foreground hover:text-destructive size-8 shrink-0"
                            aria-label={m.revoke()}
                            onclick={() => revokeUser(share)}
                        >
                            <XIcon class="size-4" />
                        </Button>
                    </div>
                {:else}
                    <p class="text-muted-foreground px-2 py-3 text-sm">
                        {m.share_nobody_yet()}
                    </p>
                {/each}
            </div>
        </Tabs.Content>
    </Tabs.Root>
</ResponsiveDialog>
