<script lang="ts">
	import {
		GlobeIcon,
		MonitorIcon,
		type LucideIcon,
		SmartphoneIcon,
		TabletIcon,
	} from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";
	import { refreshAll } from "$app/navigation";
	import { authClient } from "$lib/auth-client";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as m from "$lib/paraglide/messages.js";
	import { title } from "$lib/store/title";

	onMount(() => {
		title.set(m.title_account_sessions());
	});

	const { data } = $props();

	/**
	 * A readable device and platform from the user agent.
	 *
	 * Deliberately coarse: the point is to help someone recognise their own
	 * sessions at a glance, not to fingerprint them. Anything unrecognised
	 * falls back to a globe rather than dumping the raw string.
	 */
	function describe(userAgent: string | null | undefined): {
		icon: LucideIcon;
		label: string;
	} {
		const ua = (userAgent ?? "").toLowerCase();
		if (!ua) {
			return { icon: GlobeIcon, label: m.unknown() };
		}

		const isTablet = ua.includes("ipad") || ua.includes("tablet");
		const isPhone =
			!isTablet &&
			(ua.includes("iphone") ||
				ua.includes("android") ||
				ua.includes("mobile"));

		const platform = ua.includes("iphone")
			? "iPhone"
			: ua.includes("ipad")
				? "iPad"
				: ua.includes("android")
					? "Android"
					: ua.includes("mac os")
						? "macOS"
						: ua.includes("windows")
							? "Windows"
							: ua.includes("linux")
								? "Linux"
								: m.unknown();

		const browser = ua.includes("edg/")
			? "Edge"
			: ua.includes("chrome") && !ua.includes("chromium")
				? "Chrome"
				: ua.includes("firefox")
					? "Firefox"
					: ua.includes("safari")
						? "Safari"
						: null;

		return {
			icon: isPhone ? SmartphoneIcon : isTablet ? TabletIcon : MonitorIcon,
			label: browser ? `${platform} · ${browser}` : platform,
		};
	}

	async function revokeSession(sessionToken: string) {
		const { error } = await authClient.revokeSession({ token: sessionToken });
		if (error) {
			throw new Error(error.message || "Failed to revoke session");
		}
		await refreshAll();
	}

	function handleRevokeSession(sessionToken: string) {
		return toast.promise(revokeSession(sessionToken), {
			loading: m.toast_revoking_session(),
			success: m.toast_session_revoked(),
			error: (e) =>
				e instanceof Error ? e.message : m.toast_revoke_session_error(),
		});
	}
</script>

<div class="flex w-full flex-col gap-4">
    {#each data.sessions as session (session.token)}
        {@const device = describe(session.userAgent)}
        {@const isCurrent = session.token === data.session.token}
        {@const Icon = device.icon}
        <Card.Root>
            <Card.Content
                class="flex flex-wrap items-center justify-between gap-4"
            >
                <div class="flex min-w-0 items-center gap-3">
                    <div
                        class="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg"
                    >
                        <Icon class="size-4" />
                    </div>
                    <div class="min-w-0">
                        <p class="flex flex-wrap items-center gap-2 text-sm">
                            <span class="font-medium">{device.label}</span>
                            {#if isCurrent}
                                <Badge variant="secondary">
                                    {m.current_session()}
                                </Badge>
                            {/if}
                        </p>
                        <p
                            class="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 text-xs"
                        >
                            <span class="tabular-nums">
                                {session.ipAddress || m.unknown()}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span class="tabular-nums">
                                {m.last_active({
                                    date: new Date(
                                        session.createdAt,
                                    ).toLocaleString(),
                                })}
                            </span>
                        </p>
                        <p class="text-muted-foreground text-xs tabular-nums">
                            {m.expires({
                                date: new Date(
                                    session.expiresAt,
                                ).toLocaleString(),
                            })}
                        </p>
                    </div>
                </div>

                <Button
                    onclick={() => handleRevokeSession(session.token)}
                    variant="outline"
                    size="sm"
                    class="shrink-0"
                    disabled={isCurrent}
                >
                    {m.revoke()}
                </Button>
            </Card.Content>
        </Card.Root>
    {/each}
</div>
