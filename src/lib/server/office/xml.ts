/**
 * A small XML tree, enough for the OOXML parts we rewrite.
 *
 * OOXML is machine-written and well-formed — no DTDs, no entity declarations,
 * no mixed encodings — so the parser below can stay this short. Namespaces are
 * left as literal prefixes (`w:p`, `a:t`) rather than resolved: every part we
 * touch declares the usual prefixes, and matching on the written name is what
 * every fixture in the wild actually needs.
 *
 * Anything the parser does not model — the prolog, comments, processing
 * instructions, CDATA — survives as a `raw` node and is written back byte for
 * byte, so a part is only ever changed where we meant to change it.
 */
export interface XmlElement {
	type: "element";
	name: string;
	/**
	 * Values are `string | undefined` on purpose: an attribute that is not
	 * there reads as undefined at runtime whatever the index signature says,
	 * and typing it honestly is what keeps every `?? ""` below meaningful.
	 */
	attrs: Record<string, string | undefined>;
	children: XmlNode[];
}

export interface XmlText {
	type: "text";
	text: string;
}

export interface XmlRaw {
	type: "raw";
	text: string;
}

export type XmlNode = XmlElement | XmlText | XmlRaw;

export interface XmlDocument {
	/** Prolog, comments and whitespace ahead of the root, kept verbatim. */
	prolog: XmlNode[];
	root: XmlElement;
}

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
	// Only the handful an HTML serialiser actually emits; anything else is
	// left as written rather than guessed at.
	nbsp: "\u00a0",
};

export function decodeXml(text: string): string {
	return text.replace(
		/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g,
		(whole, body: string) => {
			if (body.startsWith("#x") || body.startsWith("#X")) {
				return String.fromCodePoint(Number.parseInt(body.slice(2), 16));
			}
			if (body.startsWith("#")) {
				return String.fromCodePoint(Number.parseInt(body.slice(1), 10));
			}
			return NAMED_ENTITIES[body] ?? whole;
		},
	);
}

export function encodeXml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

function encodeAttribute(value: string): string {
	return encodeXml(value).replace(/"/g, "&quot;");
}

export class XmlParseError extends Error {}

/**
 * `<![CDATA[…]]>`, `<!-- … -->`, `<?…?>` and `<!…>` all survive verbatim.
 * Returns the index just past the section, or -1 when `open` starts none.
 */
function readVerbatim(source: string, open: number, sink: XmlNode[]): number {
	const delimiters: [string, string][] = [
		["<![CDATA[", "]]>"],
		["<!--", "-->"],
		["<?", "?>"],
		["<!", ">"],
	];
	for (const [prefix, suffix] of delimiters) {
		if (!source.startsWith(prefix, open)) {
			continue;
		}
		const close = source.indexOf(suffix, open + prefix.length);
		if (close === -1) {
			throw new XmlParseError(`Unterminated ${prefix}`);
		}
		const end = close + suffix.length;
		sink.push({ type: "raw", text: source.slice(open, end) });
		return end;
	}
	return -1;
}

interface ParseState {
	prolog: XmlNode[];
	stack: XmlElement[];
	root: XmlElement | null;
}

/** Where the node being read belongs: the open element, or the prolog. */
function sinkOf(state: ParseState): XmlNode[] {
	const open = state.stack.at(-1);
	return open ? open.children : state.prolog;
}

function closeElement(state: ParseState, name: string): void {
	const open = state.stack.pop();
	if (!open || open.name !== name) {
		throw new XmlParseError(
			`Closing </${name}> does not match <${open?.name ?? "?"}>`,
		);
	}
}

function openElement(
	state: ParseState,
	tag: string,
	voidElements?: ReadonlySet<string>,
): void {
	const closed = tag.endsWith("/");
	const node = parseTag(closed ? tag.slice(0, -1) : tag);
	const selfClosing = closed || voidElements?.has(node.name) === true;
	if (state.stack.length === 0) {
		if (state.root) {
			throw new XmlParseError("Second root element");
		}
		state.root = node;
	} else {
		sinkOf(state).push(node);
	}
	if (!selfClosing) {
		state.stack.push(node);
	}
}

/**
 * Elements that never have a closing tag. Empty for XML; HTML needs the list
 * because `<br>` and `<img>` are written without the slash.
 */
export interface ParseOptions {
	voidElements?: ReadonlySet<string>;
}

export function parseXml(
	source: string,
	options: ParseOptions = {},
): XmlDocument {
	const state: ParseState = { prolog: [], stack: [], root: null };
	let at = 0;

	while (at < source.length) {
		const open = source.indexOf("<", at);
		if (open === -1) {
			break;
		}
		if (open > at) {
			sinkOf(state).push({
				type: "text",
				text: decodeXml(source.slice(at, open)),
			});
		}

		const verbatim = readVerbatim(source, open, sinkOf(state));
		if (verbatim !== -1) {
			at = verbatim;
			continue;
		}

		const close = findTagEnd(source, open);
		const tag = source.slice(open + 1, close);
		at = close + 1;

		if (tag.startsWith("/")) {
			closeElement(state, tag.slice(1).trim());
		} else {
			openElement(state, tag, options.voidElements);
		}
	}

	if (!state.root) {
		throw new XmlParseError("No root element");
	}
	if (state.stack.length > 0) {
		throw new XmlParseError(`Unclosed <${state.stack[0]?.name}>`);
	}
	return { prolog: state.prolog, root: state.root };
}

/** The `>` that ends a tag, skipping any inside a quoted attribute value. */
function findTagEnd(source: string, open: number): number {
	let quote: string | null = null;
	for (let at = open + 1; at < source.length; at++) {
		const char = source[at];
		if (quote) {
			if (char === quote) {
				quote = null;
			}
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === ">") {
			return at;
		}
	}
	throw new XmlParseError("Unterminated tag");
}

const ATTRIBUTE = /([^\s=/]+)\s*=\s*("([^"]*)"|'([^']*)')/g;

function parseTag(tag: string): XmlElement {
	const match = /^([^\s/>]+)/.exec(tag);
	if (!match?.[1]) {
		throw new XmlParseError(`Unnamed element in <${tag}>`);
	}
	const attrs: Record<string, string | undefined> = {};
	const rest = tag.slice(match[1].length);
	ATTRIBUTE.lastIndex = 0;
	let attribute = ATTRIBUTE.exec(rest);
	while (attribute) {
		attrs[attribute[1] as string] = decodeXml(
			attribute[3] ?? attribute[4] ?? "",
		);
		attribute = ATTRIBUTE.exec(rest);
	}
	return { type: "element", name: match[1], attrs, children: [] };
}

export function serializeNode(node: XmlNode): string {
	if (node.type === "text") {
		return encodeXml(node.text);
	}
	if (node.type === "raw") {
		return node.text;
	}
	const attrs = Object.entries(node.attrs)
		.filter(([, value]) => value !== undefined)
		.map(([key, value]) => ` ${key}="${encodeAttribute(value as string)}"`)
		.join("");
	if (node.children.length === 0) {
		return `<${node.name}${attrs}/>`;
	}
	return `<${node.name}${attrs}>${node.children.map(serializeNode).join("")}</${node.name}>`;
}

export function serializeXml(document: XmlDocument): string {
	return (
		document.prolog.map(serializeNode).join("") + serializeNode(document.root)
	);
}

// =========================================================================
// Walking
// =========================================================================

export function isElement(node: XmlNode): node is XmlElement {
	return node.type === "element";
}

/** Direct children with the given tag name. */
export function childrenNamed(parent: XmlElement, name: string): XmlElement[] {
	return parent.children.filter(
		(child): child is XmlElement => isElement(child) && child.name === name,
	);
}

/** The first direct child with the given tag name. */
export function childNamed(
	parent: XmlElement,
	name: string,
): XmlElement | undefined {
	return childrenNamed(parent, name)[0];
}

/** The first descendant with the given tag name, depth first. */
export function findElement(
	parent: XmlElement,
	name: string,
): XmlElement | undefined {
	for (const child of parent.children) {
		if (!isElement(child)) {
			continue;
		}
		if (child.name === name) {
			return child;
		}
		const found = findElement(child, name);
		if (found) {
			return found;
		}
	}
	return undefined;
}

/** Every descendant with the given tag name, depth first. */
export function findElements(parent: XmlElement, name: string): XmlElement[] {
	const found: XmlElement[] = [];
	for (const child of parent.children) {
		if (!isElement(child)) {
			continue;
		}
		if (child.name === name) {
			found.push(child);
		}
		found.push(...findElements(child, name));
	}
	return found;
}

/** All text below an element, concatenated. */
export function textContent(element: XmlElement): string {
	return element.children
		.map((child) => {
			if (child.type === "text") {
				return child.text;
			}
			return isElement(child) ? textContent(child) : "";
		})
		.join("");
}

export function element(
	name: string,
	attrs: Record<string, string | undefined> = {},
	children: XmlNode[] = [],
): XmlElement {
	return { type: "element", name, attrs, children };
}

export function text(value: string): XmlText {
	return { type: "text", text: value };
}

// =========================================================================
// HTML
// =========================================================================

/** Written without a closing tag, so the parser must not wait for one. */
const VOID_ELEMENTS: ReadonlySet<string> = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"source",
	"track",
	"wbr",
]);

/**
 * The editors' HTML, parsed with the same tree.
 *
 * It is only ever asked to read markup a serialiser wrote — ProseKit's own
 * output, or ours — so it demands well-formedness rather than implementing
 * HTML's tag-omission rules, and says so loudly when it does not get it.
 * A body is wrapped so a fragment with several top-level blocks has a root.
 */
export function parseHtmlFragment(source: string): XmlElement {
	return parseXml(`<body>${source}</body>`, { voidElements: VOID_ELEMENTS })
		.root;
}
