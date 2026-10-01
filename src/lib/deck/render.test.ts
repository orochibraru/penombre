import { describe, expect, test } from "bun:test";
import { renderInline, renderSlide, safeUrl } from "./render";

const html = (markdown: string) => renderSlide(markdown).html;

describe("blocks", () => {
	test("headings, paragraphs and line breaks", () => {
		expect(html("# One\n### Three\n\nfirst\nsecond")).toBe(
			"<h1>One</h1><h3>Three</h3><p>first<br>second</p>",
		);
	});

	test("nested bullets", () => {
		expect(html("- a\n  - b\n  - c\n- d")).toBe(
			"<ul><li>a<ul><li>b</li><li>c</li></ul></li><li>d</li></ul>",
		);
	});

	test("numbered lists keep their start", () => {
		expect(html("3. c\n4. d")).toBe('<ol start="3"><li>c</li><li>d</li></ol>');
		expect(html("1. a\n   - b")).toBe("<ol><li>a<ul><li>b</li></ul></li></ol>");
	});

	test("a list changing kind at one level starts a new list", () => {
		expect(html("- a\n1. b")).toBe("<ul><li>a</li></ul><ol><li>b</li></ol>");
	});

	test("fenced code is escaped and left alone", () => {
		expect(html("```js\nconst a = '<b>';\n**no**\n```")).toBe(
			"<pre><code>const a = &#39;&lt;b&gt;&#39;;\n**no**</code></pre>",
		);
	});

	test("blockquotes hold blocks", () => {
		expect(html("> # Q\n> text")).toBe(
			"<blockquote><h1>Q</h1><p>text</p></blockquote>",
		);
	});

	test("tables, with alignment as classes", () => {
		expect(html("| a | b |\n| :-: | --: |\n| 1 | 2 \\| 3 |")).toBe(
			'<table><thead><tr><th class="deck-align-center">a</th><th class="deck-align-right">b</th></tr></thead><tbody><tr><td class="deck-align-center">1</td><td class="deck-align-right">2 | 3</td></tr></tbody></table>',
		);
	});

	test("a fitting heading renders as a heading", () => {
		expect(html("# <!-- fit --> Big")).toBe("<h1>Big</h1>");
	});

	test("comments are not shown", () => {
		expect(html("# A\n<!-- secret -->")).toBe("<h1>A</h1>");
	});

	test("deep nesting is capped rather than recursed", () => {
		expect(() => html(">".repeat(50_000))).not.toThrow();
		const deep = Array.from(
			{ length: 200 },
			(_v, i) => `${" ".repeat(i * 2)}- x`,
		);
		expect(html(deep.join("\n")).match(/<ul>/g)?.length).toBe(8);
	});
});

describe("inline", () => {
	test("emphasis, strike and code", () => {
		expect(renderInline("**b** *i* _j_ ~~s~~ `c*d*`")).toBe(
			"<strong>b</strong> <em>i</em> <em>j</em> <del>s</del> <code>c*d*</code>",
		);
	});

	test("underscores inside words are not emphasis", () => {
		expect(renderInline("snake_case_name")).toBe("snake_case_name");
	});

	test("backslash escapes", () => {
		expect(renderInline("\\*not\\*")).toBe("*not*");
	});

	test("links open elsewhere and keep emphasis out of the URL", () => {
		expect(renderInline("[**go**](https://a.b/x_y_z*q*)")).toBe(
			'<a href="https://a.b/x_y_z*q*" target="_blank" rel="noopener noreferrer"><strong>go</strong></a>',
		);
	});

	test("images take Marp's size keywords", () => {
		expect(renderInline("![w:200 A cat](cat.png)")).toBe(
			'<img src="cat.png" alt="A cat" width="200">',
		);
	});
});

describe("backgrounds", () => {
	test("`bg` pictures leave the flow", () => {
		const slide = renderSlide("![bg contain](a.jpg)\n# T");
		expect(slide.html).toBe("<h1>T</h1>");
		expect(slide.backgrounds).toEqual([{ src: "a.jpg", contain: true }]);
		expect(slide.split).toBeNull();
	});

	test("`bg left` splits the slide", () => {
		expect(renderSlide("![bg left:40%](a.jpg)").split).toBe("left");
	});

	test("an unsafe background is dropped", () => {
		expect(renderSlide("![bg](javascript:alert(1))").backgrounds).toEqual([]);
	});
});

describe("safety", () => {
	const attacks = [
		"<script>alert(1)</script>",
		"<img src=x onerror=alert(1)>",
		"[x](javascript:alert(1))",
		"[x](JaVaScRiPt:alert(1))",
		"[x](vbscript:msgbox(1))",
		"[x](data:text/html;base64,PHNjcmlwdD4=)",
		"[x](data:image/svg+xml;base64,PHN2Zz4=)",
		"![x](data:text/html;base64,PHNjcmlwdD4=)",
		"![x](javascript:alert(1))",
		'![a" onerror="alert(1)](x.png)',
		'[a](x.png" onclick="alert(1))',
		"[a](javascript&#58;alert(1))",
		"[a](\u00000\u0000)",
		"| <b> | x |\n| --- | --- |\n| <i> | y |",
		"```\n</code><script>\n```",
		"> <svg onload=alert(1)>",
		"- <iframe src=javascript:alert(1)>",
	];

	const ALLOWED = new Set(
		"p br h1 h2 h3 h4 h5 h6 ul ol li strong em del code pre blockquote table thead tbody tr th td a img".split(
			" ",
		),
	);

	/** Every element and attribute, as a real HTML tokenizer sees them. */
	async function elements(markup: string) {
		const found: { tag: string; attributes: [string, string][] }[] = [];
		await new HTMLRewriter()
			.on("*", {
				element(element) {
					found.push({
						tag: element.tagName,
						attributes: [...element.attributes],
					});
				},
			})
			.transform(new Response(markup))
			.text();
		return found;
	}

	for (const attack of attacks) {
		test(`escapes ${JSON.stringify(attack)}`, async () => {
			const out = html(attack);
			expect(out).not.toContain("\0");
			for (const { tag, attributes } of await elements(out)) {
				expect(ALLOWED.has(tag)).toBe(true);
				for (const [name, value] of attributes) {
					expect(name.startsWith("on")).toBe(false);
					const url = value.replace(/&amp;/g, "&").replace(/&quot;/g, '"');
					if (name === "href") {
						expect(url).not.toMatch(/^\s*(?:javascript|vbscript|data):/i);
					}
					if (name === "src") {
						expect(url).not.toMatch(
							/^\s*(?:javascript|vbscript|data:(?!image\/))/i,
						);
					}
				}
			}
		});
	}

	test("allows what a slide needs", () => {
		expect(safeUrl("https://a.b/c.png", true)).toBe("https://a.b/c.png");
		expect(safeUrl("images/c.png", true)).toBe("images/c.png");
		expect(safeUrl("data:image/png;base64,AAAA", true)).toBe(
			"data:image/png;base64,AAAA",
		);
		expect(safeUrl("mailto:a@b.c", false)).toBe("mailto:a@b.c");
	});

	test("refuses the rest", () => {
		expect(safeUrl("data:image/png;base64,AAAA", false)).toBeNull();
		expect(safeUrl("mailto:a@b.c", true)).toBeNull();
		expect(safeUrl("java\tscript:alert(1)", false)).toBeNull();
		expect(safeUrl("file:///etc/passwd", true)).toBeNull();
	});

	test("an image with an unsafe source shows its text", () => {
		expect(renderInline("![alt](javascript:x)")).toBe("alt");
	});
});
