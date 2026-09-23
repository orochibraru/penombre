import process from "node:process";

interface Variant {
	declarations?: string[];
	match?: Record<string, string>;
}
type Message = string | Variant[];

const settings = await Bun.file("project.inlang/settings.json").json();
const baseLocale: string = settings.baseLocale;
const locales: string[] = settings.locales;

async function load(locale: string): Promise<Record<string, Message>> {
	const { $schema: _, ...messages } = await Bun.file(
		`messages/${locale}.json`,
	).json();
	return messages;
}

/** The inputs a message reads: `{name}` tokens and declared inputs, minus locals. */
function variables(message: Message): string[] {
	const texts =
		typeof message === "string"
			? [message]
			: message.flatMap((v) => Object.values(v.match ?? {}));
	const declarations =
		typeof message === "string"
			? []
			: message.flatMap((v) => v.declarations ?? []);
	const locals = new Set(
		declarations.flatMap((d) => d.match(/^local (\w+)/)?.[1] ?? []),
	);
	const found = new Set([
		...texts.flatMap((t) => [...t.matchAll(/\{(\w+)\}/g)].map((m) => m[1])),
		...declarations.flatMap((d) => d.match(/^input (\w+)/)?.[1] ?? []),
	]);
	return [...found].filter((name) => !locals.has(name)).sort();
}

const base = await load(baseLocale);
const problems: string[] = [];

for (const locale of locales.filter((l) => l !== baseLocale)) {
	const messages = await load(locale);
	for (const key of Object.keys(base)) {
		if (!(key in messages)) {
			problems.push(`${locale}: missing ${key}`);
			continue;
		}
		const expected = variables(base[key]).join(",");
		const actual = variables(messages[key]).join(",");
		if (expected !== actual) {
			problems.push(`${locale}: ${key} uses {${actual}}, not {${expected}}`);
		}
	}
	for (const key of Object.keys(messages)) {
		if (!(key in base)) {
			problems.push(`${locale}: ${key} is not in ${baseLocale}`);
		}
	}
}

if (problems.length > 0) {
	console.error(problems.join("\n"));
	console.error(`${problems.length} i18n problem(s)`);
	process.exit(1);
}
console.log(
	`${locales.length} locales, ${Object.keys(base).length} keys, all in parity.`,
);
