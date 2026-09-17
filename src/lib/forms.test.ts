import { describe, expect, mock, test } from "bun:test";

const errors: { description?: string }[] = [];

mock.module("svelte-sonner", () => ({
	toast: {
		error: (_title: string, opts?: { description?: string }) => {
			errors.push(opts ?? {});
		},
	},
}));

// Stands in for SvelteKit's own deserialize: JSON.parse, which throws on a
// body that is not JSON.
mock.module("$app/forms", () => ({
	deserialize: (body: string) => JSON.parse(body),
	enhance: () => undefined,
}));

const { deserializeAction } = await import("./forms");

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
