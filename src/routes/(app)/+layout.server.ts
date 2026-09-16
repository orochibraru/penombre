import { redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { resolve } from "$app/paths";
import { api } from "$lib/api";
import { uploadSchema } from "$lib/schemas/upload";
import { getConfig, getVolumes, isSimpleMode } from "$lib/server/config";
import { isTwoFactorRequired } from "$lib/server/services/app-settings";
import { drivesService } from "$lib/server/services/drives";
import { SharingService } from "$lib/server/services/sharings";

const sharings = new SharingService();

export const load = async ({ fetch, url, locals, depends }) => {
	depends("app:preferences");
	// The sidebar's trash and starred badges come from this load, so any
	// change to the drive has to re-run it or they keep the boot's numbers.
	depends("app:files");
	// The sidebar lists the caller's shared drives, so creating or leaving one
	// has to re-run this load.
	depends("app:drives");
	// And the items shared with the caller.
	depends("app:shares");

	if (!(locals.user && locals.session)) {
		return redirect(302, resolve("/auth/sign-in"));
	}

	// Enrolment gate. The security page is exempt or the redirect would loop —
	// it is where the enrolment card lives, so that is where people are sent.
	if (
		!(
			locals.user.twoFactorEnabled ||
			url.pathname.startsWith("/account/security")
		) &&
		(await isTwoFactorRequired())
	) {
		return redirect(302, resolve("/account/security"));
	}

	const [activityResult, fileCount, preferences, versionCheck] =
		await Promise.all([
			api.GET("/api/v1/activity", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/storage/file/counts", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/preferences", { fetch, baseUrl: url.origin }),
			api.GET("/api/v1/version/check", { fetch, baseUrl: url.origin }),
		]);

	// Parse counts, default to 0 if failed
	let counts = { trash: 0, starred: 0 };
	if (fileCount.error) {
		// Count fetch failure is non-critical, fall through to defaults
	} else if (fileCount.data?.data) {
		counts = fileCount.data.data as { trash: number; starred: number };
	}

	const isAdmin = locals.user.role === "admin";

	// Simple mode is one drive shared by everyone; a second sharing model on
	// top of that would mean nothing, so the whole feature is hidden there.
	const [drives, sharedWithMe] = isSimpleMode()
		? [[], []]
		: await Promise.all([
				drivesService.listForUser(locals.user.id),
				sharings.listSharedWithMe(locals.user.id),
			]);

	const config = getConfig();

	return {
		user: locals.user,
		config,
		session: locals.session,
		activity: activityResult.data?.data,
		counts,
		preferences: preferences.data?.data,
		uploadForm: await superValidate({}, zod4(uploadSchema)),
		authCookie: "123",
		isAdmin,
		drives,
		sharedWithMe,
		// Mounted volumes appear in the sidebar as extra drives. Simple mode
		// shares each one whole; full mode gives every user a subdirectory.
		volumes: getVolumes().map((volume) => ({
			name: volume.name,
			label: volume.label,
			readOnly: volume.readOnly,
		})),
		versionCheck: versionCheck.data?.data,
	};
};
