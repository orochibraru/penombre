<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import LanguageDropdown from "#lib/components/language-dropdown.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import {
		NOTIFICATION_CHANNELS,
		NOTIFICATION_TYPES,
		type NotificationChannel,
		type NotificationType,
		resolveAll,
	} from "#lib/notification-prefs.js";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { invalidate } from "$app/navigation";

	const { data } = $props();

	onMount(() => {
		title.set(m.title_settings_general());
	});

	const channels = $derived(resolveAll(data.preferences ?? {}));

	const typeLabel: Record<NotificationType, () => string> = {
		note: m.notif_type_note,
		share: m.notif_type_share,
		signature_completed: m.notif_type_signature_completed,
		signature_declined: m.notif_type_signature_declined,
	};
	const channelLabel: Record<NotificationChannel, () => string> = {
		inApp: m.notif_channel_in_app,
		email: m.notif_channel_email,
		phone: m.notif_channel_phone,
	};

	/** Mail needs SMTP; the phone only shows what the bell keeps. */
	function disabled(type: NotificationType, channel: NotificationChannel) {
		if (channel === "email") {
			return !data.smtpAvailable;
		}
		return channel === "phone" && !channels[type].inApp;
	}

	/**
	 * Saves the whole grid with the one change: the preference is replaced as
	 * a whole, and a partial one would reset every other choice to its default.
	 */
	async function choose(
		type: NotificationType,
		channel: NotificationChannel,
		value: boolean,
	) {
		const next = structuredClone($state.snapshot(channels));
		next[type][channel] = value;
		const { error } = await api.PUT("/api/v1/preferences", {
			body: {
				notifications: next,
				// Older clients read the single switch: keep it truthful.
				emailNotifications: NOTIFICATION_TYPES.some((t) => next[t].email),
			},
		});
		if (error) {
			toast.error(m.toast_account_update_error());
			return;
		}
		await invalidate("app:preferences");
		toast.success(m.toast_preferences_saved());
	}
</script>

<div class="flex flex-col gap-4">
    <Card.Root>
        <Card.Content>
            <LanguageDropdown />
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header>
            <Card.Title>{m.notifications_title()}</Card.Title>
            <Card.Description>{m.notif_settings_hint()}</Card.Description>
        </Card.Header>
        <Card.Content class="flex flex-col gap-3">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-muted-foreground text-xs">
                            <th class="py-2 pe-3 text-start font-normal"></th>
                            {#each NOTIFICATION_CHANNELS as channel (channel)}
                                <th class="px-2 py-2 text-center font-normal">
                                    {channelLabel[channel]()}
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each NOTIFICATION_TYPES as type (type)}
                            <tr class="border-t">
                                <th class="py-3 pe-3 text-start font-medium">
                                    {typeLabel[type]()}
                                </th>
                                {#each NOTIFICATION_CHANNELS as channel (channel)}
                                    <td class="px-2 py-3 text-center">
                                        <Checkbox
                                            aria-label={`${typeLabel[type]()} · ${channelLabel[channel]()}`}
                                            checked={channels[type][channel]}
                                            disabled={disabled(type, channel)}
                                            onCheckedChange={(value) =>
                                                void choose(type, channel, value === true)}
                                        />
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="text-muted-foreground text-xs">
                {data.smtpAvailable
                    ? m.notif_phone_hint()
                    : `${m.settings_email_notifications_no_smtp()} ${m.notif_phone_hint()}`}
            </p>
        </Card.Content>
    </Card.Root>
</div>
