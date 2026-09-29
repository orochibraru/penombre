import { describe, expect, test } from "bun:test";
import { passwordProblem } from "./password-rules";

const strict = { minLength: 8, requireStrong: true };

describe("passwordProblem", () => {
	test("checks match, length and strength, in that order", () => {
		expect(passwordProblem("a", "b", strict)?.error).toBe("PASSWORD_MISMATCH");
		expect(passwordProblem("Ab1!", "Ab1!", strict)).toEqual({
			error: "PASSWORD_TOO_SHORT",
			errorParams: { count: "8" },
		});
		expect(passwordProblem("simplepass1", "simplepass1", strict)?.error).toBe(
			"PASSWORD_NOT_STRONG",
		);
		expect(
			passwordProblem("Strong-pass-42", "Strong-pass-42", strict),
		).toBeNull();
		expect(
			passwordProblem("simplepass1", "simplepass1", {
				minLength: 8,
				requireStrong: false,
			}),
		).toBeNull();
	});
});
