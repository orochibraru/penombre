import { signingPage } from "#lib/server/services/signatures/page.js";

/** A signer's page. Public: the token is the whole credential. */
const page = signingPage((event) => event.params.token ?? null);

export const load = page.load;
export const actions = page.actions;
