import { loadShareListing } from "../listing";

export const load = ({ params, locals, depends }) => {
	depends("app:files");
	return loadShareListing(params.share, params.path, locals);
};
