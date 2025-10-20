---
title: Immich
description: Configure Immich photo management with Opendrive
---

## Create OIDC Client in Opendrive

1. Create a new OIDC Client in Opendrive (e.g., `immich`).
2. Set the callback URLs:
   ```
   https://<IMMICH-DOMAIN>/auth/login
   https://<IMMICH-DOMAIN>/user-settings
   app.immich:///oauth-callback
   ```
3. Copy the **Client ID**, **Client Secret**, and **OIDC Discovery URL**.

## Configure Immich

1. Open Immich and navigate to:
   **`Administration > Settings > Authentication Settings > OAuth`**
2. Enable **Login with OAuth**.
3. Fill in the required fields:
   - **Issuer URL**: Paste the `OIDC Discovery URL` from Opendrive.
   - **Client ID**: Paste the `Client ID` from Opendrive.
   - **Client Secret**: Paste the `Client Secret` from Opendrive.
4. _(Optional)_ Change `Button Text` to `Login with Opendrive`.
5. Save the settings.
6. Test the OAuth login to ensure it works.
