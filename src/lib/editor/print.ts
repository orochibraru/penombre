/**
 * Print one element, alone, from a throwaway frame.
 *
 * A print stylesheet on the page itself would have to undo the app shell:
 * the editor scrolls inside a fixed-height box, so everything below the
 * first screen was clipped from the printout. The frame carries the page's
 * own stylesheets, so the text prints the way it looks, in the light theme,
 * with none of the chrome around it.
 */
const PRINT_CSS = `
@page { margin: 2cm; }
html, body { background: none !important; margin: 0; }
body::before, body::after { display: none !important; }
[data-print-root] { padding: 0 !important; min-height: 0 !important; }
[data-background-color] { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
select { display: none !important; }
`;

/** Loaded, failed, or two seconds gone: a stuck stylesheet must not eat the click. */
const loaded = (node: HTMLLinkElement | HTMLImageElement): Promise<void> =>
	new Promise((resolve) => {
		const done = () => resolve();
		node.addEventListener("load", done, { once: true });
		node.addEventListener("error", done, { once: true });
		setTimeout(done, 2000);
	});

export async function printElement(
	source: HTMLElement,
	title: string,
): Promise<void> {
	const frame = document.createElement("iframe");
	frame.setAttribute("aria-hidden", "true");
	frame.style.cssText =
		"position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
	document.body.append(frame);
	const view = frame.contentWindow;
	const doc = frame.contentDocument;
	if (!(view && doc)) {
		frame.remove();
		return;
	}

	const styles = [
		...document.querySelectorAll('link[rel="stylesheet"], style'),
	].map((node) => node.outerHTML);
	doc.open();
	doc.write(
		`<!doctype html><html><head><meta charset="utf-8"><base href="${location.origin}/"><style>${PRINT_CSS}</style>${styles.join("")}</head><body></body></html>`,
	);
	doc.close();
	doc.title = title;

	const clone = doc.importNode(source, true);
	clone.removeAttribute("contenteditable");
	clone.setAttribute("data-print-root", "");
	doc.body.append(clone);

	const pending = [
		...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
	].filter((link) => !link.sheet);
	const images = [...doc.images].filter((image) => !image.complete);
	await Promise.all([...pending, ...images].map(loaded));

	view.addEventListener("afterprint", () => frame.remove(), { once: true });
	view.focus();
	view.print();
}
