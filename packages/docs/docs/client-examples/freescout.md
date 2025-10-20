---
title: FreeScout
description: Enable OIDC authentication for FreeScout helpdesk
---

## Requirements

- [FreeScout OAuth Social Login Module](https://freescout.net/module/oauth-login/) (one-time fee)
- HTTPS connection to your FreeScout server

## Create OIDC Client in Opendrive

1. Create a new OIDC Client in Opendrive (e.g., `freescout`).
2. Set the **Callback URL** to the value below. After creating the OAuth provider (in the next section), update this to the generated **Redirect URI** from FreeScout, -OR- leave blank to autofill on first login.
   ```
   https://<FREESCOUT-DOMAIN>/oauth-login/callback/*
   ```
3. _Optional:_ Download a PNG or SVG **logo** from the [FreeScout project](https://github.com/freescout-help-desk/freescout/tree/dist/public/img) and upload.
4. Copy the **Client ID**, **Client Secret**, and **OIDC Discovery URL** for use in the next section.

## Configure FreeScout

1. Open FreeScout and navigate to:
   **`Manage > Settings > OAuth`**
2. Enable the **Active** checkmark.
3. Fill in the required fields:
   - **Provider**: Choose `Custom Oauth Provider`
   - **Name**: Type in `Opendrive` or similar.
   - **Redirect URI**: Copy and paste this to the **Callback URLs** field in Opendrive (from first section).
   - **Logout URI**: Leave the generated value provided by FreeScout.
   - **Client ID**: Paste the `Client ID` from Opendrive.
   - **Client Secret**: Paste the `Client Secret` from Opendrive.
   - **Authorization URL**: Paste the `Authorization URL` from Opendrive.
   - **Token URL**: Paste the `Token URL` from Opendrive.
   - **User Info URL**: Paste the `Userinfo URL` from Opendrive.
   - **User Info Method**: Choose `POST`.
   - **Proxy URL, Field Mappings, Scopes**: Leave blank (unless otherwise necessary for your environment).
4. Save the settings.
5. Test the OAuth login to ensure it works.

### Optional Config

- If desired, enable the **Auto-Create Users** option, to auto create non-existing users in FreeScout from Opendrive.

- If desired, enable the **Force OAuth Login** option, to force using Opendrive. Do not enable this until fully tested. To disable review the [module documentation](https://freescout.net/module/oauth-login/).

- Enabling **Debug Mode** is useful for examining the OAuth transaction in the FreeScout logs. You can disable when tested.
