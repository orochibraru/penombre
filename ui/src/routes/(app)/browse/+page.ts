import { listFiles } from "$lib/api/helpers/storage";
import { error } from "@sveltejs/kit";

export const load = async () => {
  const { data: files, err } = await listFiles();

  if (err) {
    return error(err.code, err.message);
  }

  return { files };
};
