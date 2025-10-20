---
title: Pinepods
description: Configure Pinepods with Opendrive authentication
---

## Create OIDC Client in Opendrive

1. Create a new OIDC Client in Opendrive (e.g., `Pinepods`).
2. Set the Callback URL to `https://<pinepods-url>/api/auth/callback`, or leave blank to autofill on first login.
3. Copy the **Client ID**, **Client Secret**, **Authorization URL**, **Token URL**, and **Userinfo URL**.
4. _(Optional)_ Find and upload a logo from [Self-Hosted Dashboard Icons](https://selfh.st/icons)

## Configure Pinepods through the UI

Note: Only Admin users can configure OIDC/SSO settings.

1. Open Pinepods and navigate to: **`Settings > Admin Settings > OIDC/SSO Settings`**
2. Fill in the required fields:
   - **Provider Name**: Set to `Opendrive`.
   - **Client ID**: Paste the `Client ID` from Opendrive.
   - **Client Secret**: Paste the `Client Secret` from Opendrive.
   - **Authorization URL**: Paste the `Authorization URL` from Opendrive.
   - **Token URL**: Paste the `Token URL` from Opendrive.
   - **User Info URL**: Paste the `Userinfo URL` from Opendrive.
3. _(Optional)_ Update button text e.g. _Login with Opendrive_
