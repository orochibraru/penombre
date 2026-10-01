import { z } from "zod";
import { defineRoute } from "#lib/server/openapi/index.js";
import { storageServiceFor } from "#lib/server/services/storage-for.js";

/**
 * Self-service "export everything I own": one route for the caller's own
 * files as a ZIP (reusing the existing bulk-download job machinery), one for
 * their account data as JSON.
 */

export const exportAccountFiles = defineRoute({
	method: "get",
	path: "/api/v1/account/export",
	summary: "Export owned files",
	description:
		"Streams every top-level file and folder the caller owns as one ZIP archive.",
	tags: ["Account"],
	response: z.any().describe("Binary ZIP stream"),
	errors: [404, 500],
	service: storageServiceFor,
});

const accountDataSchema = z.object({
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		createdAt: z.string(),
	}),
	preferences: z.record(z.string(), z.unknown()),
	activity: z.array(
		z.object({
			id: z.string(),
			action: z.string(),
			message: z.string(),
			link: z.string().nullable(),
			level: z.string(),
			createdAt: z.string(),
		}),
	),
});

export const exportAccountData = defineRoute({
	method: "get",
	path: "/api/v1/account/data",
	summary: "Export account data",
	description:
		"Returns the caller's profile, preferences and activity as JSON.",
	tags: ["Account"],
	response: accountDataSchema,
	errors: [404, 500],
});

const signInMethodSchema = z.enum([
	"password",
	"passkey",
	"magicLink",
	"emailOtp",
]);

export const accountOverviewSchema = z.object({
	user: z.object({
		id: z.string(),
		name: z.string(),
		email: z.string(),
		image: z.string().nullable(),
		role: z.string(),
		emailVerified: z.boolean(),
		twoFactorEnabled: z.boolean(),
		createdAt: z.string(),
	}),
	hasPassword: z.boolean(),
	passwordRules: z.object({
		minLength: z.number(),
		requireStrong: z.boolean(),
	}),
	signInMethods: z.array(signInMethodSchema),
	preferredSignInMethod: signInMethodSchema.nullable(),
	passkeySignInEnabled: z.boolean(),
	emailSignInEnabled: z.boolean(),
	twoFactorRequired: z.boolean(),
	requirements: z.array(z.enum(["twoFactor", "passkey"])),
	smtpAvailable: z.boolean(),
	simpleMode: z.boolean(),
	driveOnly: z.boolean(),
	versioning: z.boolean(),
});

export const getAccountOverview = defineRoute({
	method: "get",
	path: "/api/v1/account/overview",
	summary: "Your account and what it can change",
	description:
		"The profile, the sign-in methods the account can use and the instance rules a settings screen needs, in one call.",
	tags: ["Account"],
	response: accountOverviewSchema,
	errors: [500],
});

export const updateAccountProfile = defineRoute({
	method: "patch",
	path: "/api/v1/account/profile",
	summary: "Change your name",
	description:
		"The address changes with emailed codes instead: `POST /api/v1/auth/email-otp/send-verification-otp` (type `email-verification`) to the current address, then `email-otp/request-email-change` with that code and the new address, then `email-otp/change-email` with the code sent there.",
	tags: ["Account"],
	body: z.object({
		name: z.string().min(1).max(200).optional(),
	}),
	response: accountOverviewSchema,
	errors: [400, 500],
});

export const saveAccountPassword = defineRoute({
	method: "post",
	path: "/api/v1/account/password",
	summary: "Set or change your password",
	description:
		"Sets a first password when the account has none, otherwise changes it and needs `currentPassword`. Checked against the instance's password rules.",
	tags: ["Account"],
	body: z.object({
		currentPassword: z.string().optional(),
		newPassword: z.string().min(1),
		confirm: z.string().min(1),
	}),
	response: z.object({ saved: z.boolean() }),
	errors: [400, 500],
});

export const setAccountSignInMethod = defineRoute({
	method: "put",
	path: "/api/v1/account/sign-in-method",
	summary: "Choose your preferred sign-in method",
	description:
		"The method the sign-in page offers first. `null` clears it; a method the account cannot use is refused.",
	tags: ["Account"],
	body: z.object({ method: signInMethodSchema.nullable() }),
	response: z.object({ method: signInMethodSchema.nullable() }),
	errors: [400, 500],
});

export const accountSessionSchema = z.object({
	id: z.string(),
	current: z.boolean(),
	userAgent: z.string().nullable(),
	ipAddress: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	expiresAt: z.string(),
});

export const listAccountSessions = defineRoute({
	method: "get",
	path: "/api/v1/account/sessions",
	summary: "List your sessions",
	description:
		"Every device signed in to the account, most recently active first. Tokens are never returned.",
	tags: ["Account"],
	response: z.array(accountSessionSchema),
	errors: [500],
});

export const revokeAccountSession = defineRoute({
	method: "delete",
	path: "/api/v1/account/sessions/{id}",
	summary: "Sign a device out",
	description: "Ends one of your own sessions.",
	tags: ["Account"],
	params: z.object({ id: z.string().min(1) }),
	response: z.object({ revoked: z.boolean() }),
	errors: [404, 500],
});

export const getAccountStorage = defineRoute({
	method: "get",
	path: "/api/v1/account/storage",
	summary: "Your storage usage",
	description:
		"What the drive holds, by category, what the trash and earlier versions take, and the disk behind it. In simple mode, the shared drive's.",
	tags: ["Account"],
	response: z.object({
		used: z.number(),
		fileCount: z.number(),
		trashedBytes: z.number(),
		trashedCount: z.number(),
		versionBytes: z.number(),
		versionCount: z.number(),
		byCategory: z.array(
			z.object({ category: z.string(), bytes: z.number(), count: z.number() }),
		),
		largestFiles: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				size: z.number(),
				updatedAt: z.string(),
			}),
		),
		disk: z.object({ total: z.number(), available: z.number() }),
	}),
	errors: [403, 500],
});
