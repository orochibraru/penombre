import { getConfig } from "#lib/server/config.js";

export const load = () => ({ version: getConfig().appVersion });
