---
title: RomM
description: Configure RomM with Opendrive authentication
---

1. Create a new OIDC Client in Opendrive (e.g., `RomM`).
2. Set the Callback URL to `https://{romm_host}/api/oauth/openid`, or leave blank to autofill on first login.
3. _(Optional)_ Find and upload a logo from [Self-Hosted Dashboard Icons](https://selfh.st/icons)
4. Configure RomM environment variables
   - `OIDC_ENABLED`: Set to `true` to enable OIDC authentication.
   - `OIDC_PROVIDER`: The lowercase name of the provider (`pocketid`).
   - `OIDC_CLIENT_ID`: The client ID copied from Opendrive.
   - `OIDC_CLIENT_SECRET`: The client secret copied from Opendrive.
   - `OIDC_REDIRECT_URI`: The redirect URI configured in the Opendrive provider, in the format `https://{romm_host}/api/oauth/openid`.
   - `OIDC_SERVER_APPLICATION_URL`: The authorization URL for you Opendrive instance, e.g. `https://id.host.local`.

5. Set up your email address in RomM. This email has to match your user email in Opendrive.
