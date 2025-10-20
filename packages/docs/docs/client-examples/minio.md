---
title: Minio
description: Set up OIDC for Minio
---

## Opendrive Setup

1. Create a new Group named `consoleAdmin` (case sensitive)
   - Adding your user to the `consoleAdmin` group logs you into Minio as an administrator. You can also add groups for the other built in policies, please see [ Minio Documentation ](https://min.io/docs/minio/linux/administration/identity-access-management/policy-based-access-control.html#built-in-policies) for more details.
2. Create a new OIDC Client and name it Minio (or whatever you want)
   - Set Callback URLs: `https://minio-console.example.com/oauth_callback`, or leave blank to autofill on first login.
   - Note `Client ID` and `Client Secret` for next steps

## Minio Setup

1. Log into Minio using admin (or root) credentials
2. Under Administrator, select Identity, then select OpenID
3. Click Create Configuration and enter the following:
   - Config URL: `https://auth.example.com/.well-known/openid-configuration`
   - Client ID: Your Client ID from Opendrive
   - Client Secret: Your Client Secret from Opendrive.
   - Claim Name: `groups`
   - Display Name: Opendrive (or anything you want)
   - Scopes: `openid,profile,email,groups`
   - Redirect URI: `https://minio-console.example.com/oauth_callback`

## Notes

- You will need to enter your Client Secret every time you edit the OpenID configuration. It may be best to simply regenerate a new one on Opendrive and enter that when required instead of managing the secret.
- If your are using `MINIO_BROWSER_REDIRECT_URL=https://minio.example.com/minio-console/` in your Minio configuration, then use `https://minio.example.com/minio-console/oauth_callback` for Callback URLs in Opendrive and Redirect URI in Minio OpenID configuration.
