import { loadVolumeListing } from "../listing";

/**
 * A volume's own trash.
 *
 * Without it a file trashed on a mount would be gone for good: `/trash` lists
 * the caller's own rows, and a volume's belong to the shared owner.
 */
export const load = ({ params, locals, depends }) => {
	depends("app:files", "app:trash");
	return loadVolumeListing(params.volume, undefined, locals, { trash: true });
};
