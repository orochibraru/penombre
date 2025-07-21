import { listFilesByCategory } from "$lib/api/helpers/storage";

import { error } from "@sveltejs/kit";

export const load = async ({ params }) => {
  const { data: files, err } = await listFilesByCategory(params.category);

  if (err) {
    return error(err.code, err.message);
  }

  return {
    files,
    category: params.category,
  };
};
