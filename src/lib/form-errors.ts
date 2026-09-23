/**
 * Maps a server action's error code to a translated message.
 *
 * The server has no per-request locale (paraglide runs client-side, off
 * `localStorage`/a cookie), so a `fail()` can only hand back a stable code,
 * never a finished English sentence, which used to reach every locale
 * verbatim. Shared across the account, security and onboarding forms rather
 * than duplicated per page, since several of them fail the same ways
 * (a password mismatch, a stale session).
 */

import { m } from "#lib/paraglide/messages.js";

export function mapFormError(
	code: string | undefined,
	params?: { count?: string },
): string {
	switch (code) {
		case "MISSING_FIELDS":
			return m.form_error_missing_fields();
		case "UNAUTHORIZED":
			return m.form_error_unauthorized();
		case "EMAIL_CHANGE_REQUIRES_SMTP":
			return m.form_error_email_change_requires_smtp();
		case "EMAIL_UPDATE_FAILED":
			return m.form_error_email_update_failed();
		case "ACCOUNT_UPDATE_FAILED":
			return m.form_error_account_update_failed();
		case "SIGN_IN_METHOD_UNAVAILABLE":
			return m.form_error_sign_in_method_unavailable();
		case "API_KEY_NAME_REQUIRED":
			return m.form_error_api_key_name_required();
		case "API_KEY_CREATE_FAILED":
			return m.form_error_api_key_create_failed();
		case "INVALID_FORM":
			return m.form_error_invalid_form();
		case "PASSWORD_MISMATCH":
			return m.form_error_password_mismatch();
		case "EMAIL_SIGNIN_DISABLED":
			return m.form_error_email_signin_disabled();
		case "PASSWORD_TOO_SHORT":
			return m.form_error_password_too_short({ count: params?.count ?? "" });
		case "SET_PASSWORD_FAILED":
			return m.form_error_set_password_failed();
		case "CHANGE_PASSWORD_FAILED":
			return m.form_error_change_password_failed();
		case "INVITE_INVALID":
			return m.form_error_invite_invalid();
		case "PASSWORD_NOT_STRONG":
			return m.form_error_password_not_strong();
		case "INVITE_EXPIRED":
			return m.form_error_invite_expired();
		case "INVITE_NO_ACCOUNT":
			return m.form_error_invite_no_account();
		case "ONBOARDING_FAILED":
			return m.form_error_onboarding_failed();
		default:
			return m.form_error_generic();
	}
}
