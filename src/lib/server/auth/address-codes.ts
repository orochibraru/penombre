const ADDRESS_PATHS = new Set([
	"/email-otp/verify-email",
	"/email-otp/request-email-change",
	"/email-otp/change-email",
]);

/**
 * Whether an emailed-code request proves an address rather than signs anyone
 * in. Those stay open while code sign-in is off: verifying or changing an
 * address needs mail, not that sign-in method.
 */
export function isAddressCode(path: string, body: unknown): boolean {
	if (ADDRESS_PATHS.has(path)) {
		return true;
	}
	const type = (body as { type?: unknown } | undefined)?.type;
	return (
		path === "/email-otp/send-verification-otp" &&
		(type === "email-verification" || type === "change-email")
	);
}
