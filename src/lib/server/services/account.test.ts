import { describe, expect, it } from "bun:test";
import { type RequirementSources, unmetRequirements } from "./account";

const sources = (over: Partial<Record<keyof RequirementSources, boolean>>) =>
	({
		passkeyRequired: () => Promise.resolve(over.passkeyRequired ?? false),
		twoFactorRequired: () => Promise.resolve(over.twoFactorRequired ?? false),
		passkeyEnabled: () => Promise.resolve(over.passkeyEnabled ?? true),
		hasPasskey: () => Promise.resolve(over.hasPasskey ?? false),
	}) satisfies RequirementSources;

describe("unmetRequirements", () => {
	const user = { id: "u1", twoFactorEnabled: false };

	it("asks for nothing when nothing is required", async () => {
		expect(await unmetRequirements(user, sources({}))).toEqual([]);
	});

	it("asks for what is required and missing", async () => {
		const both = sources({ twoFactorRequired: true, passkeyRequired: true });
		expect(await unmetRequirements(user, both)).toEqual([
			"twoFactor",
			"passkey",
		]);
	});

	it("forgets what the account already has", async () => {
		const both = sources({
			twoFactorRequired: true,
			passkeyRequired: true,
			hasPasskey: true,
		});
		expect(
			await unmetRequirements({ id: "u1", twoFactorEnabled: true }, both),
		).toEqual([]);
	});

	it("never asks for a passkey the instance cannot register", async () => {
		const off = sources({ passkeyRequired: true, passkeyEnabled: false });
		expect(await unmetRequirements(user, off)).toEqual([]);
	});
});
