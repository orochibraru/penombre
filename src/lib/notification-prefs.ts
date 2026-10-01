/**
 * Who gets told what, and where: each notification type on each channel.
 * Shared by the server, which honours it where it notifies, and the settings
 * pages, which show it; the mobile app mirrors `resolve` for the phone.
 */

export const NOTIFICATION_TYPES = [
	"note",
	"share",
	"signature_completed",
	"signature_declined",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * `inApp`: the bell, on the web and in the app; `phone`: the app's own
 * notifications while it is closed, which need the in-app row to exist;
 * `email`: a copy by mail, when the instance can send any.
 */
export const NOTIFICATION_CHANNELS = ["inApp", "email", "phone"] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationChoices = Partial<
	Record<NotificationType, Partial<Record<NotificationChannel, boolean>>>
>;

/** Addressed by someone to someone, or the outcome of their own request. */
const MAILED_BY_DEFAULT = new Set<NotificationType>([
	"share",
	"signature_completed",
	"signature_declined",
]);

/**
 * The channels one type goes to. What the person chose wins; otherwise the
 * bell and the phone are on, and email follows the older all-or-nothing
 * `emailNotifications` switch, except for what is always mailed.
 */
export function resolveChannels(
	prefs: {
		notifications?: NotificationChoices;
		emailNotifications?: boolean;
	},
	type: NotificationType,
): Record<NotificationChannel, boolean> {
	const chosen = prefs.notifications?.[type] ?? {};
	const inApp = chosen.inApp ?? true;
	return {
		inApp,
		email:
			chosen.email ??
			(MAILED_BY_DEFAULT.has(type) || (prefs.emailNotifications ?? false)),
		// Without the row there is nothing for the phone to find.
		phone: inApp && (chosen.phone ?? true),
	};
}

/** Every type's channels, for a settings page. */
export function resolveAll(prefs: {
	notifications?: NotificationChoices;
	emailNotifications?: boolean;
}): Record<NotificationType, Record<NotificationChannel, boolean>> {
	return Object.fromEntries(
		NOTIFICATION_TYPES.map((type) => [type, resolveChannels(prefs, type)]),
	) as Record<NotificationType, Record<NotificationChannel, boolean>>;
}
