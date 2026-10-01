import { defineDOMEventHandler } from "prosekit/core";

/**
 * Where a link in a document may take the reader: the web and mail, never a
 * `javascript:` or `data:` URL, which a document written by someone else can
 * carry and which would run on the instance's origin.
 */
export function safeHref(href: string | null, base: string): string | null {
	if (!href) {
		return null;
	}
	try {
		const url = new URL(href, base);
		return ["http:", "https:", "mailto:"].includes(url.protocol)
			? url.href
			: null;
	} catch {
		return null;
	}
}

/**
 * A document read, not edited, has live links. Each opens in a new tab, and
 * only when it is safe; editing never follows them, the caret goes there.
 */
export function defineSafeLinks() {
	return defineDOMEventHandler("click", (_view, event) => {
		const link =
			event.target instanceof Element ? event.target.closest("a[href]") : null;
		if (!link) {
			return false;
		}
		event.preventDefault();
		const href = safeHref(link.getAttribute("href"), location.href);
		if (href) {
			window.open(href, "_blank", "noopener,noreferrer");
		}
		return true;
	});
}
