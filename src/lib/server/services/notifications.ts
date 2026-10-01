/**
 * Notifications: telling someone that something happened to their stuff.
 *
 * Rows are structured, never prose — `type` plus an actor and a resource name,
 * rendered by the client through paraglide. Storing a finished sentence would
 * freeze it in whatever locale the *writer* happened to be using, which is the
 * wrong person entirely.
 *
 * Each person chooses, per type, whether it rings the bell (and so the phone)
 * and whether it is mailed (`#lib/notification-prefs.ts`). Mail always
 * requires SMTP, so an instance with no mail configured simply never sends
 * and nothing has to be turned off.
 */

import { and, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import {
	type NotificationType,
	resolveChannels,
} from "#lib/notification-prefs.js";
import { getDb } from "#lib/server/db/index.js";
import { fileNotes, notifications, user } from "#lib/server/db/schema.js";
import { Email } from "#lib/server/email.js";
import type { EmailContent } from "#lib/server/email-template.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";

const logger = new Logger("NotificationService");

export type { NotificationType } from "#lib/notification-prefs.js";

export interface NotificationInput {
	/** Who to tell. */
	userId: string;
	type: NotificationType;
	actorName?: string | null;
	resourceName?: string | null;
	link?: string | null;
}

export interface NotificationRow {
	id: string;
	type: NotificationType;
	actorName: string | null;
	resourceName: string | null;
	link: string | null;
	read: boolean;
	createdAt: string;
}

/** The subject line for each kind, for the optional email copy. */
const emailSubject: Record<NotificationType, string> = {
	note: "New note on one of your files",
	share: "Something was shared with you",
	signature_completed: "A document is signed",
	signature_declined: "A signature was declined",
};

const emailLine: Record<
	NotificationType,
	(who: string, what: string) => string
> = {
	note: (who, what) => `${who} left a note on ${what}.`,
	share: (who, what) => `${who} shared ${what} with you.`,
	signature_completed: (_who, what) =>
		`Everyone signed ${what}. The signed PDF is ready.`,
	signature_declined: (who, what) => `${who} declined to sign ${what}.`,
};

function emailContent(input: NotificationInput, origin: string): EmailContent {
	const who = input.actorName ?? "Someone";
	const what = input.resourceName ?? "an item";
	return {
		subject: emailSubject[input.type],
		heading: emailSubject[input.type],
		lines: [emailLine[input.type](who, what)],
		...(input.link
			? { action: { label: "Open it", url: `${origin}${input.link}` } }
			: {}),
		footnote:
			"You can choose which notifications are emailed to you in your settings.",
	};
}

function toRow(row: {
	id: string;
	type: NotificationType;
	actorName: string | null;
	resourceName: string | null;
	link: string | null;
	readAt: Date | null;
	createdAt: Date;
}): NotificationRow {
	return {
		id: row.id,
		type: row.type,
		actorName: row.actorName,
		resourceName: row.resourceName,
		link: row.link,
		read: row.readAt !== null,
		createdAt: row.createdAt.toISOString(),
	};
}

const selection = {
	id: notifications.id,
	type: notifications.type,
	actorName: notifications.actorName,
	resourceName: notifications.resourceName,
	link: notifications.link,
	readAt: notifications.readAt,
	createdAt: notifications.createdAt,
};

export class NotificationService {
	private get db() {
		return getDb();
	}

	/** Whose choices decide the channels; tests stub it on the instance. */
	private readonly preferences = getUserPreferences;

	/**
	 * Record one notification, and email it when the recipient asked for that.
	 *
	 * Never throws: a notification is a side effect of some other action that
	 * has already succeeded, and failing an upload or a note because the bell
	 * could not be rung would be the wrong trade. Failures are logged.
	 */
	async notify(input: NotificationInput, origin?: string): Promise<void> {
		let channels: { inApp: boolean; email: boolean };
		try {
			channels = resolveChannels(
				await this.preferences(input.userId),
				input.type,
			);
		} catch (error) {
			logger.error("Could not read notification preferences", error);
			return;
		}
		if (channels.inApp) {
			await this.record(input);
		}
		if (channels.email) {
			await this.email(input, origin).catch((error) => {
				logger.warn("Could not email notification", error);
			});
		}
	}

	private async record(input: NotificationInput): Promise<void> {
		try {
			await this.db.insert(notifications).values({
				id: crypto.randomUUID(),
				userId: input.userId,
				type: input.type,
				actorName: input.actorName ?? null,
				resourceName: input.resourceName ?? null,
				link: input.link ?? null,
			});
		} catch (error) {
			logger.error("Could not record notification", error);
		}
	}

	/** Fan one notification out to several recipients. */
	async notifyMany(
		userIds: string[],
		input: Omit<NotificationInput, "userId">,
		origin?: string,
	): Promise<void> {
		// Deduped: a file's owner can also be a participant in its note thread,
		// and being told twice about one note is noise.
		for (const userId of new Set(userIds)) {
			await this.notify({ ...input, userId }, origin);
		}
	}

	private async email(
		input: NotificationInput,
		origin?: string,
	): Promise<void> {
		// Checked before reading the address so an instance without mail does
		// no work at all per notification.
		if (!(await getSmtpSettings())) {
			return;
		}

		const [recipient] = await this.db
			.select({ email: user.email })
			.from(user)
			.where(eq(user.id, input.userId))
			.limit(1);
		if (!recipient?.email) {
			return;
		}

		await Email.sendTemplate(
			recipient.email,
			emailContent(input, origin ?? ""),
		);
	}

	async list(userId: string, limit = 30): Promise<NotificationRow[]> {
		const rows = await this.db
			.select(selection)
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);
		return rows.map(toRow);
	}

	async unreadCount(userId: string): Promise<number> {
		const [row] = await this.db
			.select({ total: count() })
			.from(notifications)
			.where(
				and(eq(notifications.userId, userId), isNull(notifications.readAt)),
			);
		return Number(row?.total ?? 0);
	}

	/**
	 * Mark some or all of a user's notifications read.
	 *
	 * Scoped by `userId` as well as by id, so a guessed id belonging to someone
	 * else matches nothing rather than clearing their bell.
	 */
	async markRead(userId: string, ids?: string[]): Promise<number> {
		if (ids && ids.length === 0) {
			return 0;
		}
		const updated = await this.db
			.update(notifications)
			.set({ readAt: new Date() })
			.where(
				and(
					eq(notifications.userId, userId),
					isNull(notifications.readAt),
					...(ids ? [inArray(notifications.id, ids)] : []),
				),
			)
			.returning({ id: notifications.id });
		return updated.length;
	}

	/** Everyone who has written a note on this file, except `exceptUserId`. */
	async noteParticipants(
		fileId: string,
		exceptUserId: string,
	): Promise<string[]> {
		const rows = await this.db
			.selectDistinct({ userId: fileNotes.userId })
			.from(fileNotes)
			.where(
				and(eq(fileNotes.fileId, fileId), ne(fileNotes.userId, exceptUserId)),
			);
		return rows.map((row) => row.userId);
	}
}
