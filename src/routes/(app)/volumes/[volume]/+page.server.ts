import { loadVolumeListing } from "./listing";

export const load = ({ params, locals, depends }) => {
	depends("app:files");
	return loadVolumeListing(params.volume, undefined, locals);
};
