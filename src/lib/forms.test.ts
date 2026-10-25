import { describe, expect, mock, test } from "bun:test";

const errors: { description?: string }[] = [];

mock.module("svelte-sonner", () => ({
	toast: {
		error: (_title: string, opts?: { description?: string }) => {
			errors.push(opts ?? {});
		},
	},
}));

type Submit = (input: unknown) => Promise<unknown>;
const submits: Submit[] = [];

// Stands in for SvelteKit's own deserialize: JSON.parse, which throws on a
// body that is not JSON. Its enhance keeps the submit function to call.
mock.module("$app/forms", () => ({
	deserialize: (body: string) => JSON.parse(body),
	enhance: (_form: unknown, submit: Submit) => {
		submits.push(submit);
		return { destroy: () => undefined };
	},
}));

const { deserializeAction, enhance } = await import("./forms");

/** Submits through the enhanced form and answers with `result`. */
async function submitWith(
	submit: Parameters<typeof enhance>[1],
	result: unknown,
) {
	submits.length = 0;
	enhance({} as HTMLFormElement, submit);
	const respond = (await submits[0]?.({ action: "?/save" })) as (options: {
		result: unknown;
		update: () => Promise<void>;
	}) => Promise<void>;
	const updates: unknown[] = [];
	await respond({
		result,
		update: async () => {
			updates.push(result);
		},
	});
	return updates;
}

describe("enhance", () => {
	test("updates the page after an action result, reporting nothing", async () => {
		errors.length = 0;
		const updates = await submitWith(undefined, {
			type: "success",
			status: 200,
		});
		expect(updates).toHaveLength(1);
		expect(errors).toHaveLength(0);
	});

	test("reports a response that is not an action result", async () => {
		errors.length = 0;
		await submitWith(undefined, {});
		expect(errors).toHaveLength(1);
		expect(errors[0]?.description).toBe(
			"The server rejected the request. Check your instance URL and try again.",
		);
	});

	test("hands the result to the form's own callback instead of updating", async () => {
		errors.length = 0;
		const seen: unknown[] = [];
		const inputs: unknown[] = [];
		const updates = await submitWith(
			async (input) => {
				inputs.push(input);
				return async ({ result }) => {
					seen.push(result);
				};
			},
			{ type: "failure", status: 400 },
		);
		expect(inputs).toEqual([{ action: "?/save" }]);
		expect(seen).toEqual([{ type: "failure", status: 400 }]);
		expect(updates).toHaveLength(0);
	});

	test("updates when the form's submit returns no callback", async () => {
		const updates = await submitWith(async () => undefined, {
			type: "redirect",
			status: 303,
			location: "/",
		});
		expect(updates).toHaveLength(1);
	});
});

describe("deserializeAction", () => {
	test("passes an action result through untouched", () => {
		errors.length = 0;
		const result = deserializeAction(
			JSON.stringify({ type: "success", status: 200 }),
		);
		expect(result).toEqual({ type: "success", status: 200 });
		expect(errors).toHaveLength(0);
	});

	test("reports a JSON body that is not an action result", () => {
		errors.length = 0;
		deserializeAction(
			JSON.stringify({
				message: "Cross-site POST form submissions are forbidden",
			}),
		);
		expect(errors[0]?.description).toBe(
			"Cross-site POST form submissions are forbidden",
		);
	});

	test("reports a body that is not JSON at all", () => {
		errors.length = 0;
		const result = deserializeAction("<html>502 Bad Gateway</html>");
		expect(result.type).toBe("failure");
		expect(errors).toHaveLength(1);
	});
});
