/**
 * The signature service as the app runs it: PDFs under an app-owned
 * dot-directory, mail when SMTP is set up, the signed PDF filed next to the
 * document.
 */

import { eq } from "drizzle-orm";
import { baseName } from "#lib/documents.js";
import { Logger } from "#lib/logger.js";
import { getConfig } from "#lib/server/config.js";
import { encryptionEnabled } from "#lib/server/crypto/keyring.js";
import { getDb } from "#lib/server/db/index.js";
import { files, type SignatureRequest, user } from "#lib/server/db/schema.js";
import { Email } from "#lib/server/email.js";
import { FileOrFolderNotFoundError } from "#lib/server/errors.js";
import { getSmtpSettings } from "#lib/server/services/app-settings.js";
import { NotificationService } from "#lib/server/services/notifications.js";
import {
	createUserStorageDriver,
	type StorageDriver,
} from "#lib/server/services/storage/driver.js";
import { StorageService } from "#lib/server/services/storage/index.js";
import { volumeById } from "#lib/server/services/storage-for.js";
import { type PdfStore, SignatureService } from "./service";

export * from "./service";

const logger = new Logger("Signatures");

/**
 * `STORAGE_PATH/.signatures/<request id>/`: outside every user's root, and a
 * dot-directory the scan never lists. Sealed like any file when encryption
 * is on; the sweep walks it too, so a key rotation rewraps it.
 *
 * ponytail: a request deleted with its requester's account leaves its folder
 * here; sweep folders with no row if that ever adds up.
 */
function pdfStore(): PdfStore {
	let driver: StorageDriver | undefined;
	const open = () =>
		(driver ??= createUserStorageDriver(".signatures", encryptionEnabled()));
	return {
		write: (key, bytes) => open().writeObject(key, bytes),
		read: async (key) =>
			(await open().objectExists(key))
				? new Uint8Array(await open().readObject(key))
				: null,
	};
}

async function userRow(id: string) {
	const [row] = await getDb().select().from(user).where(eq(user.id, id));
	return row as NonNullable<App.Locals["user"]> | undefined;
}

/**
 * `<name> (signed).pdf` beside the document, in the document's own tree and
 * as the requester; at the root when its folder is gone.
 */
async function saveBesideDocument(
	request: SignatureRequest,
	bytes: Uint8Array,
): Promise<void> {
	if (!request.fileId) {
		return;
	}
	const [file] = await getDb()
		.select()
		.from(files)
		.where(eq(files.id, request.fileId));
	const owner = file && (await userRow(file.ownerId));
	const volume = file ? await volumeById(file.volumeId) : null;
	if (!(file && owner) || volume === null) {
		return;
	}
	const actor = (await userRow(request.ownerId)) ?? owner;
	const service = new StorageService(owner, volume, actor);
	const name = `${baseName(request.documentName)} (signed).pdf`;
	const folder = file.path.includes("/")
		? file.path.slice(0, file.path.lastIndexOf("/"))
		: undefined;
	const create = (where?: string) =>
		service.createFile({ name, size: bytes.byteLength }, where);
	const created = await create(file.isTrashed ? undefined : folder).catch(
		(error: unknown) => {
			if (error instanceof FileOrFolderNotFoundError) {
				return create(undefined);
			}
			throw error;
		},
	);
	await service.uploadFileBody(created.id ?? "", bytes, { snapshot: false });
}

const notifications = new NotificationService();
let service: SignatureService | undefined;

export function signatures(): SignatureService {
	service ??= new SignatureService({
		database: getDb(),
		store: pdfStore(),
		mailer: async () =>
			(await getSmtpSettings())
				? (to, content) => Email.sendTemplate(to, content)
				: null,
		notify: (input) => notifications.notify(input, getConfig().origin),
		saveSigned: saveBesideDocument,
		origin: () => getConfig().origin,
		warn: (message, error) => logger.warn(message, error),
	});
	return service;
}
