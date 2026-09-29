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

/** Sign-in, coming back to `url` afterwards (home needs no `next`). */
export function signInReturningTo(url: {
	pathname: string;
	search: string;
}): string {
	const back = url.pathname + url.search;
	return back === "/"
		? "/auth/sign-in"
		: `/auth/sign-in?next=${encodeURIComponent(back)}`;
}
