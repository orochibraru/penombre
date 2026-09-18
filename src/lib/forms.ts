import { toast } from "svelte-sonner";
import { m } from "#lib/paraglide/messages.js";
import {
	type ActionResult,
	deserialize,
	enhance as kitEnhance,
	type SubmitFunction,
} from "$app/forms";

/**
 * A body that is not an ActionResult — SvelteKit's cross-site 403, a proxy's
 * error page — parses to an object with no `type`, and `applyAction` drops it
 * without rendering anything.
 */
function reportNonActionResult(result: ActionResult) {
	const body = result as { type?: string; message?: string };
	if (body.type) {
		return;
	}
	toast.error(m.error_title(), {
		description: body.message || m.request_failed(),
	});
}

/** `enhance`, but a response the runtime cannot read is reported, not swallowed. */
export function enhance(form: HTMLFormElement, submit?: SubmitFunction) {
	return kitEnhance(form, async (input) => {
		const callback = await submit?.(input);
		return async (options) => {
			reportNonActionResult(options.result);
			if (typeof callback === "function") {
				await callback(options);
				return;
			}
			await options.update();
		};
	});
}

/** `deserialize`, but a body that is not an ActionResult is reported, not thrown. */
export function deserializeAction(body: string): ActionResult {
	let result: ActionResult;
	try {
		result = deserialize(body);
	} catch {
		// No action URL to report; callers read `type`, never hand this to `update`.
		result = { type: "failure", status: 400, location: "" };
		toast.error(m.error_title(), { description: m.request_failed() });
		return result;
	}
	reportNonActionResult(result);
	return result;
}
