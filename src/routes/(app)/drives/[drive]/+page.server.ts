import { loadDriveListing } from "./listing";

export const load = ({ params, locals, depends }) => {
	depends("app:files");
	return loadDriveListing(params.drive, undefined, locals);
};
