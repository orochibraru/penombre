/**
 * Where sign-in returns to: a same-site path from `?next=`, else `fallback`.
 * Never `//host`, `/\host` or a scheme, which would be an open redirect.
 */
export function nextPath(
	url: { searchParams: { get(name: string): string | null } },
	fallback: string,
): string {
	const next = url.searchParams.get("next");
	return next && /^\/(?![/\\])/.test(next) ? next : fallback;
}
