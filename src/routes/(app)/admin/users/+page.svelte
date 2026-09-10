<script lang="ts">
	import {
		EllipsisVerticalIcon,
		ShieldIcon,
		UserPlusIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { enhance } from "$app/forms";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { m } from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";
	import { usersCountLabel } from "$lib/utils";

	onMount(() => {
		title.set(m.title_admin_users());
	});

	const { data, form } = $props();

	let pendingForm: HTMLFormElement | null = $state(null);

	$effect(() => {
		if (form?.error) {
			toast.error(form.error);
		} else if (form?.invited) {
			toast.success(m.toast_user_invited({ email: form.invited }));
		}
	});

	/** Submit a hidden form for one row action without a dialog per action. */
	function submit(
		action: string,
		fields: Record<string, string>,
		formEl: HTMLFormElement | null,
	) {
		if (!formEl) {
			return;
		}
		formEl.action = action;
		for (const [name, value] of Object.entries(fields)) {
			const input = formEl.elements.namedItem(name);
			if (input instanceof HTMLInputElement) {
				input.value = value;
			}
		}
		formEl.requestSubmit();
	}

	const initials = (name: string) =>
		name
			.split(" ")
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase() ?? "")
			.join("");
</script>

<div class="flex flex-col gap-5">
    <p class="text-muted-foreground text-sm">
        {usersCountLabel(data.users.total)}
    </p>

    <form
        method="POST"
        class="hidden"
        bind:this={pendingForm}
        use:enhance={() =>
            async ({ update }) => {
                await update({ reset: false });
            }}
    >
        <input type="hidden" name="userId" />
        <input type="hidden" name="role" />
        <input type="hidden" name="banned" />
    </form>

    <Card.Root>
        <Card.Header>
            <Card.Title class="flex items-center gap-2">
                <UserPlusIcon class="size-4" />
                {m.admin_invite_user()}
            </Card.Title>
            <Card.Description>{m.admin_invite_hint()}</Card.Description>
        </Card.Header>
        <Card.Content>
            <form
                method="POST"
                action="?/inviteUser"
                class="flex flex-wrap items-end gap-3"
                use:enhance={() =>
                    async ({ update }) => {
                        await update();
                    }}
            >
                <div class="flex min-w-56 flex-1 flex-col gap-2">
                    <Label for="invite-email">{m.email()}</Label>
                    <Input
                        id="invite-email"
                        name="email"
                        type="email"
                        required
                        placeholder="name@example.com"
                    />
                </div>
                <div class="flex min-w-40 flex-1 flex-col gap-2">
                    <Label for="invite-name">{m.admin_invite_name()}</Label>
                    <Input
                        id="invite-name"
                        name="name"
                        placeholder={m.admin_invite_name_placeholder()}
                    />
                </div>
                <Button type="submit">{m.admin_invite_submit()}</Button>
            </form>
        </Card.Content>
    </Card.Root>

    <div class="flex flex-col gap-2">
        {#each data.users.users as user (user.id)}
            <Card.Root
                class="hover:border-primary/40 gap-0 py-3 transition-colors"
            >
                <Card.Content
                    class="flex flex-wrap items-center justify-between gap-3 px-4"
                >
                    <div class="flex min-w-0 items-center gap-3">
                        {#if user.image}
                            <img
                                src={user.image}
                                alt=""
                                class="size-9 shrink-0 rounded-lg object-cover"
                            />
                        {:else}
                            <span
                                class="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium"
                                aria-hidden="true"
                            >
                                {initials(user.name)}
                            </span>
                        {/if}
                        <div class="min-w-0">
                            <p
                                class="flex items-center gap-2 truncate text-sm font-medium"
                            >
                                {user.name}
                                {#if user.role === "admin"}
                                    <Badge
                                        variant="outline"
                                        class="border-primary/40 bg-primary/10 text-primary"
                                    >
                                        <ShieldIcon />
                                        {m.admin()}
                                    </Badge>
                                {/if}
                                {#if user.banned}
                                    <Badge variant="destructive">
                                        {m.admin_user_banned()}
                                    </Badge>
                                {/if}
                            </p>
                            <p
                                class="text-muted-foreground truncate text-xs"
                            >
                                {user.email}
                            </p>
                        </div>
                    </div>

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
                                onclick={() =>
                                    submit(
                                        "?/setRole",
                                        {
                                            userId: user.id,
                                            role:
                                                user.role === "admin"
                                                    ? "user"
                                                    : "admin",
                                        },
                                        pendingForm,
                                    )}
                            >
                                {user.role === "admin"
                                    ? m.admin_demote()
                                    : m.admin_promote()}
                            </DropdownMenu.Item>
                            <DropdownMenu.Item
                                onclick={() =>
                                    submit(
                                        "?/setBanned",
                                        {
                                            userId: user.id,
                                            banned: user.banned
                                                ? "false"
                                                : "true",
                                        },
                                        pendingForm,
                                    )}
                            >
                                {user.banned ? m.admin_unban() : m.admin_ban()}
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                                variant="destructive"
                                onclick={() =>
                                    submit(
                                        "?/removeUser",
                                        { userId: user.id },
                                        pendingForm,
                                    )}
                            >
                                {m.delete()}
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Root>
                </Card.Content>
            </Card.Root>
        {/each}
    </div>
</div>
