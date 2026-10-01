<script lang="ts">
	import {
		ArrowUpIcon,
		CopyIcon,
		MailCheckIcon,
		PlusIcon,
		SearchIcon,
		SignatureIcon,
		XIcon,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import ResponsiveDialog from "#lib/components/responsive-dialog.svelte";
	import { Button, buttonVariants } from "#lib/components/ui/button/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Input } from "#lib/components/ui/input/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as Select from "#lib/components/ui/select/index.js";
	import { Textarea } from "#lib/components/ui/textarea/index.js";
	import { m } from "#lib/paraglide/messages.js";
	import type { StorageLocation } from "#lib/storage-location.js";
	import { copyText } from "#lib/utils.js";
	import { page } from "$app/state";

	/**
	 * Ask people to sign a document: accounts found by search, anyone else by
	 * name and address. Once sent, it shows each signer's link — the only time
	 * a link is shown, since the server keeps it hashed.
	 */
	interface Props {
		open: boolean;
		fileId: string;
		/** Shown in the title. */
		fileName: string;
		/** Where the document lives, as the storage routes take it. */
		location?: StorageLocation;
		onClose?: () => void;
		/** After the request went out, with its id. */
		onSent?: (requestId: string) => void;
	}

	let {
		open = $bindable(false),
		fileId,
		fileName,
		location = {},
		onClose,
		onSent,
	}: Props = $props();

	interface Person {
		userId?: string;
		name: string;
		email: string;
	}
	interface Issued {
		signerId: string;
		name: string;
		email: string;
		url: string;
		emailed: boolean;
	}

	const me = $derived(
		(page.data as { user?: { id: string; name: string; email: string } }).user,
	);

	let people: Person[] = $state([]);
	let query = $state("");
	let results: Person[] = $state([]);
	let searching = $state(false);
	let guestName = $state("");
	let guestEmail = $state("");
	let message = $state("");
	let sequential = $state(false);
	let days = $state("30");
	let loading = $state(false);
	let issued: Issued[] | null = $state(null);

	const DAY_OPTIONS = ["7", "14", "30", "90"];
	const guestValid = $derived(
		guestName.trim().length > 0 &&
			/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim()),
	);

	let wasOpen = false;
	$effect(() => {
		if (open) {
			wasOpen = true;
			return;
		}
		people = [];
		query = "";
		results = [];
		message = "";
		sequential = false;
		issued = null;
		if (wasOpen) {
			wasOpen = false;
			onClose?.();
		}
	});

	const taken = (email: string) =>
		people.some((person) => person.email.toLowerCase() === email.toLowerCase());

	function add(person: Person) {
		if (!taken(person.email)) {
			people = [...people, person];
		}
		query = "";
		results = [];
	}

	function addGuest() {
		if (!guestValid) {
			return;
		}
		add({ name: guestName.trim(), email: guestEmail.trim() });
		guestName = "";
		guestEmail = "";
	}

	function moveUp(index: number) {
		const next = [...people];
		const [person] = next.splice(index, 1);
		if (person) {
			next.splice(index - 1, 0, person);
			people = next;
		}
	}

	let searchTimer: ReturnType<typeof setTimeout> | undefined;
	function onQuery(value: string) {
		query = value;
		clearTimeout(searchTimer);
		if (value.trim().length < 3) {
			results = [];
			return;
		}
		searchTimer = setTimeout(() => void search(value), 250);
	}

	async function search(value: string) {
		searching = true;
		try {
			const { data } = await api.GET("/api/v1/users/search", {
				params: { query: { q: value } },
			});
			results = (data?.data ?? [])
				.filter((found) => !taken(found.email))
				.map((found) => ({
					userId: found.id,
					name: found.name,
					email: found.email,
				}));
		} finally {
			searching = false;
		}
	}

	async function send() {
		loading = true;
		try {
			const { data, error } = await api.POST("/api/v1/signatures", {
				params: { query: location },
				body: {
					fileId,
					signers: people.map((person) =>
						person.userId
							? { userId: person.userId }
							: { name: person.name, email: person.email },
					),
					message: message.trim() || undefined,
					sequential,
					expiresInDays: Number(days),
				},
			});
			if (error || !data?.data) {
				toast.error(m.sign_request_failed(), {
					description: (error as { message?: string } | undefined)?.message,
				});
				return;
			}
			issued = data.data.links;
			onSent?.(data.data.request.id);
		} finally {
			loading = false;
		}
	}

	async function copy(url: string) {
		if (await copyText(url)) {
			toast.success(m.toast_link_copied());
		}
	}
</script>

<ResponsiveDialog
    bind:open
    bind:loading
    title={issued ? m.sign_request_sent_title() : m.sign_request_title()}
    description={fileName}
    bodyClass="max-h-[60vh] md:max-h-[65vh]"
    submitLabel={m.sign_request_send()}
    loadingLabel={m.sign_request_sending()}
    submitDisabled={people.length === 0}
    cancelLabel={issued ? m.done() : undefined}
    onsubmit={issued ? undefined : send}
>
    {#if issued}
        <div class="flex min-w-0 flex-col gap-3">
            <p class="text-muted-foreground text-sm">
                {issued.every((link) => link.emailed)
                    ? m.sign_request_sent_emailed()
                    : m.sign_request_sent_copy()}
            </p>
            {#each issued as link (link.signerId)}
                <div class="flex min-w-0 items-center gap-2 rounded-lg border p-2">
                    <div class="min-w-0 flex-1">
                        <p class="truncate text-sm font-medium">{link.name}</p>
                        <p class="text-muted-foreground truncate text-xs">
                            {link.email}
                        </p>
                    </div>
                    {#if link.emailed}
                        <MailCheckIcon
                            class="text-primary size-4 shrink-0"
                            aria-label={m.sign_request_emailed()}
                        />
                    {/if}
                    {#if me && link.email === me.email.toLowerCase()}
                        <a
                            class={buttonVariants({ size: "sm" })}
                            href={link.url}
                            target="_blank"
                            rel="noopener"
                        >
                            <SignatureIcon />
                            {m.sign_request_sign_now()}
                        </a>
                    {/if}
                    <Button
                        variant="ghost"
                        size="icon"
                        class="size-8 shrink-0"
                        aria-label={m.sign_copy_link()}
                        onclick={() => copy(link.url)}
                    >
                        <CopyIcon class="size-4" />
                    </Button>
                </div>
            {/each}
            <p class="text-muted-foreground text-xs">{m.sign_request_link_warning()}</p>
        </div>
    {:else}
        <div class="flex min-w-0 flex-col gap-4">
            <div class="flex min-w-0 flex-col gap-2">
                <Label for="sign-people">{m.sign_request_signers()}</Label>
                <div class="relative">
                    <SearchIcon
                        class="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
                    />
                    <Input
                        id="sign-people"
                        autocomplete="off"
                        class="pl-8"
                        placeholder={m.share_people_placeholder()}
                        value={query}
                        oninput={(e) => onQuery(e.currentTarget.value)}
                    />
                </div>
                {#if query.trim().length >= 3}
                    <div class="flex flex-col gap-1">
                        {#each results as person (person.userId)}
                            <button
                                type="button"
                                class="hover:bg-muted/60 flex min-w-0 flex-col rounded-lg p-2 text-left transition-colors"
                                onclick={() => add(person)}
                            >
                                <span class="truncate text-sm">{person.name}</span>
                                <span class="text-muted-foreground truncate text-xs">
                                    {person.email}
                                </span>
                            </button>
                        {:else}
                            <p class="text-muted-foreground px-2 py-2 text-sm">
                                {searching ? m.searching() : m.share_no_matches()}
                            </p>
                        {/each}
                    </div>
                {/if}
                <div class="flex flex-col gap-2 sm:flex-row">
                    <Input
                        placeholder={m.sign_request_guest_name()}
                        aria-label={m.sign_request_guest_name()}
                        autocomplete="off"
                        bind:value={guestName}
                    />
                    <Input
                        type="email"
                        placeholder={m.sign_request_guest_email()}
                        aria-label={m.sign_request_guest_email()}
                        autocomplete="off"
                        bind:value={guestEmail}
                        onkeydown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                addGuest();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        class="shrink-0"
                        disabled={!guestValid}
                        onclick={addGuest}
                    >
                        <PlusIcon />
                        {m.sign_request_add()}
                    </Button>
                </div>
                {#if me && !taken(me.email)}
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        class="self-start"
                        onclick={() => me && add({ userId: me.id, name: me.name, email: me.email })}
                    >
                        <PlusIcon />
                        {m.sign_request_add_me()}
                    </Button>
                {/if}
            </div>

            {#if people.length > 0}
                <ol class="flex min-w-0 flex-col gap-1">
                    {#each people as person, index (person.email)}
                        <li class="flex min-w-0 items-center gap-2 rounded-lg border p-2">
                            {#if sequential}
                                <span
                                    class="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                                >
                                    {index + 1}
                                </span>
                            {/if}
                            <div class="min-w-0 flex-1">
                                <p class="truncate text-sm">{person.name}</p>
                                <p class="text-muted-foreground truncate text-xs">
                                    {person.email}
                                </p>
                            </div>
                            {#if sequential && index > 0}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="size-8 shrink-0"
                                    aria-label={m.sign_request_move_up()}
                                    onclick={() => moveUp(index)}
                                >
                                    <ArrowUpIcon class="size-4" />
                                </Button>
                            {/if}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="text-muted-foreground hover:text-destructive size-8 shrink-0"
                                aria-label={m.sign_request_remove()}
                                onclick={() => (people = people.filter((_, i) => i !== index))}
                            >
                                <XIcon class="size-4" />
                            </Button>
                        </li>
                    {/each}
                </ol>
            {/if}

            <div class="flex items-start gap-3">
                <Checkbox id="sign-order" bind:checked={sequential} class="mt-0.5" />
                <Label for="sign-order" class="flex flex-col items-start gap-0.5 font-normal">
                    <span class="text-sm">{m.sign_request_in_order()}</span>
                    <span class="text-muted-foreground text-xs">
                        {m.sign_request_in_order_hint()}
                    </span>
                </Label>
            </div>

            <div class="flex flex-col gap-2">
                <Label for="sign-message">{m.sign_request_message()}</Label>
                <Textarea
                    id="sign-message"
                    rows={3}
                    maxlength={2000}
                    placeholder={m.sign_request_message_placeholder()}
                    bind:value={message}
                />
            </div>

            <div class="flex items-center justify-between gap-3">
                <Label for="sign-days">{m.sign_request_expires()}</Label>
                <Select.Root type="single" value={days} onValueChange={(value) => (days = value)}>
                    <Select.Trigger id="sign-days" class="w-36">
                        {m.sign_request_days({ count: days })}
                    </Select.Trigger>
                    <Select.Content>
                        {#each DAY_OPTIONS as option (option)}
                            <Select.Item value={option}>
                                {m.sign_request_days({ count: option })}
                            </Select.Item>
                        {/each}
                    </Select.Content>
                </Select.Root>
            </div>

            <p class="text-muted-foreground text-xs">{m.sign_request_honest()}</p>
        </div>
    {/if}
</ResponsiveDialog>
