import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";

const CODE_SIGN_IN = "/sign-in/email-otp";
const MAGIC_LINK = "/magic-link/verify";

interface AfterHooks {
	hooks?: { after?: { matcher: (context: { path?: string }) => boolean }[] };
}

/**
 * better-auth challenges password sign-ins only, so an emailed code or link
 * signed a two-factor account in with its mailbox alone. Its own challenge
 * now runs on both.
 */
export function challengeCodeSignIn<T>(plugin: T): T {
	for (const hook of (plugin as AfterHooks).hooks?.after ?? []) {
		const matches = hook.matcher.bind(hook);
		hook.matcher = (context) =>
			matches(context) ||
			context.path === CODE_SIGN_IN ||
			context.path === MAGIC_LINK;
	}
	return plugin;
}

type Returned =
	| { twoFactorRedirect?: boolean; body?: { twoFactorRedirect?: boolean } }
	| undefined;

/**
 * Where a magic link goes once the challenge took its session: the
 * two-factor page, carrying where the link was going. Null when there was
 * no challenge (a trusted device, a failed link).
 */
export function challengePage(
	returned: unknown,
	callbackURL: string | undefined,
): string | null {
	const answer = returned as Returned;
	if (!(answer?.twoFactorRedirect ?? answer?.body?.twoFactorRedirect)) {
		return null;
	}
	const next = new URL(
		decodeURIComponent(callbackURL ?? "/"),
		"http://penombre.invalid",
	);
	const path = next.origin === "http://penombre.invalid" ? next : null;
	const query = path
		? `?next=${encodeURIComponent(path.pathname + path.search)}`
		: "";
	return `/auth/two-factor${query}`;
}

/**
 * The challenge answers JSON, which a link opened in a browser would show as
 * a page. Listed after `twoFactor`, so its hook has already run.
 */
export const magicLinkChallenge = {
	id: "magic-link-two-factor",
	hooks: {
		after: [
			{
				matcher: (context) => context.path === MAGIC_LINK,
				handler: createAuthMiddleware((ctx) => {
					const page = challengePage(
						ctx.context.returned,
						typeof ctx.query?.callbackURL === "string"
							? ctx.query.callbackURL
							: undefined,
					);
					return page ? Promise.reject(ctx.redirect(page)) : Promise.resolve();
				}),
			},
		],
	},
} satisfies BetterAuthPlugin;
