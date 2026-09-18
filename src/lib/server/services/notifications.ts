/**
 * Notifications: telling someone that something happened to their stuff.
 *
 * Rows are structured, never prose — `type` plus an actor and a resource name,
 * rendered by the client through paraglide. Storing a finished sentence would
 * freeze it in whatever locale the *writer* happened to be using, which is the
 * wrong person entirely.
 *
 * Emailing is opt-in per user (`emailNotifications`), except for a share,
 * and always requires SMTP, so an instance with no mail configured simply
 * never sends and nothing has to be turned off.
 */

import { and, count, desc, eq, inArray, isNull, ne } from "drizzle-orm";
import { Logger } from "#lib/logger.js";
import { getDb } from "#lib/server/db/index.js";
import { fileNotes, notifications, user } from "#lib/server/db/schema.js";
import { Email } from "#lib/server/email.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";
import { getUserPreferences } from "#lib/server/services/preferences.js";

const logger = new Logger("NotificationService");

export type NotificationType = "note" | "share";

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
};

function emailBody(input: NotificationInput, origin: string): string {
	const who = input.actorName ?? "Someone";
	const what = input.resourceName ?? "an item";
	const line =
		input.type === "note"
			? `${who} left a note on ${what}.`
			: `${who} shared ${what} with you.`;
	return input.link ? `${line}\n\n${origin}${input.link}` : line;
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

	/**
	 * Record one notification, and email it when the recipient asked for that.
	 *
	 * Never throws: a notification is a side effect of some other action that
	 * has already succeeded, and failing an upload or a note because the bell
	 * could not be rung would be the wrong trade. Failures are logged.
	 */
	async notify(input: NotificationInput, origin?: string): Promise<void> {
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
			return;
		}

		await this.email(input, origin).catch((error) => {
			logger.warn("Could not email notification", error);
		});
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
		// A share is addressed to one person by another, so it is always mailed;
		// the preference governs the rest.
		if (input.type !== "share") {
			const prefs = await getUserPreferences(input.userId);
			if (!prefs.emailNotifications) {
				return;
			}
		}
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

		const message = await Email.create({
			to: recipient.email,
			subject: emailSubject[input.type],
			content: emailBody(input, origin ?? ""),
		});
		await message.send();
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
