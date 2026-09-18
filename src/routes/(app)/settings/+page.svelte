<script lang="ts">
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { api } from "#lib/api/index.js";
	import LanguageDropdown from "#lib/components/language-dropdown.svelte";
	import * as Card from "#lib/components/ui/card/index.js";
	import { Checkbox } from "#lib/components/ui/checkbox/index.js";
	import { Label } from "#lib/components/ui/label/index.js";
	import * as m from "#lib/paraglide/messages.js";
	import { title } from "#lib/store/title.js";
	import { invalidate } from "$app/navigation";

	const { data } = $props();

	onMount(() => {
		title.set(m.title_settings_general());
	});

	const emailNotifications = $derived(
		data.preferences?.emailNotifications ?? false,
	);

	async function setEmailNotifications(value: boolean) {
		const { error } = await api.PUT("/api/v1/preferences", {
			body: { emailNotifications: value },
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
        </Card.Header>
        <Card.Content>
            <Label
                class="hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-60"
                data-disabled={!data.smtpAvailable}
            >
                <Checkbox
                    checked={emailNotifications}
                    disabled={!data.smtpAvailable}
                    onCheckedChange={setEmailNotifications}
                />
                <span class="grid gap-1 font-normal">
                    <span class="text-sm font-medium">
                        {m.settings_email_notifications()}
                    </span>
                    <span class="text-muted-foreground text-xs">
                        {data.smtpAvailable
                            ? m.settings_email_notifications_hint()
                            : m.settings_email_notifications_no_smtp()}
                    </span>
                </span>
            </Label>
        </Card.Content>
    </Card.Root>
</div>
