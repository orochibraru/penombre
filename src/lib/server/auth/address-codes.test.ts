import { describe, expect, test } from "bun:test";
import { isAddressCode } from "./address-codes";

describe("isAddressCode", () => {
	test("address flows are not sign-in", () => {
		const send = "/email-otp/send-verification-otp";
		expect(isAddressCode(send, { type: "email-verification" })).toBe(true);
		expect(isAddressCode(send, { type: "change-email" })).toBe(true);
		expect(isAddressCode("/email-otp/verify-email", {})).toBe(true);
		expect(isAddressCode("/email-otp/request-email-change", {})).toBe(true);
		expect(isAddressCode("/email-otp/change-email", {})).toBe(true);
	});

	test("sign-in and reset codes are", () => {
		const send = "/email-otp/send-verification-otp";
		expect(isAddressCode(send, { type: "sign-in" })).toBe(false);
		expect(isAddressCode(send, { type: "forget-password" })).toBe(false);
		expect(isAddressCode(send, undefined)).toBe(false);
		expect(isAddressCode("/sign-in/email-otp", {})).toBe(false);
		expect(isAddressCode("/email-otp/reset-password", {})).toBe(false);
		expect(isAddressCode("/email-otp/check-verification-otp", {})).toBe(false);
	});
});
