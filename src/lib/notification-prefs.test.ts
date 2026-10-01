import { describe, expect, it } from "bun:test";
import { resolveAll, resolveChannels } from "./notification-prefs";

describe("resolveChannels", () => {
	it("keeps today's behaviour when nothing was chosen", () => {
		expect(resolveChannels({}, "note")).toEqual({
			inApp: true,
			email: false,
			phone: true,
		});
		expect(resolveChannels({ emailNotifications: true }, "note").email).toBe(
			true,
		);
		// A share was always mailed, whatever the old switch said.
		expect(resolveChannels({}, "share").email).toBe(true);
	});

	it("lets a choice override the defaults", () => {
		const prefs = {
			emailNotifications: true,
			notifications: { note: { email: false }, share: { email: false } },
		};
		expect(resolveChannels(prefs, "note").email).toBe(false);
		expect(resolveChannels(prefs, "share").email).toBe(false);
	});

	it("never sends to the phone what the bell does not keep", () => {
		const prefs = { notifications: { share: { inApp: false, phone: true } } };
		expect(resolveChannels(prefs, "share")).toMatchObject({
			inApp: false,
			phone: false,
		});
	});

	it("resolves every type at once", () => {
		expect(Object.keys(resolveAll({}))).toEqual([
			"note",
			"share",
			"signature_completed",
			"signature_declined",
		]);
	});
});
