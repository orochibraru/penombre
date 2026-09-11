# Authentication

Configure authentication methods for your Penombre instance. Penombre supports
multiple authentication methods powered by
[Better Auth](https://www.better-auth.com/).

## Auth secret

`AUTH_SECRET` is required and used to sign session tokens. Generate a secure
random value:

```bash
openssl rand -hex 32
```

> **Danger** — never reuse the same secret across environments. Rotating the
> secret invalidates all existing sessions.

## Email and password

Enabled by default. Users sign in with an email address and a password.

| Variable              | Description                   | Default |
| --------------------- | ----------------------------- | ------- |
| `ENABLE_EMAIL_SIGNIN` | Enable email/password sign-in | `true`  |
| `MIN_PASSWORD_LENGTH` | Minimum password length       | `8`     |

### Email verification

If SMTP is configured, Penombre sends a verification email on signup with a link
the user must click before they can sign in. Without SMTP, email verification is
skipped.

| Variable        | Description          | Default             |
| --------------- | -------------------- | ------------------- |
| `SMTP_ENABLED`  | Enable SMTP          | `false`             |
| `SMTP_HOST`     | SMTP server hostname | Required if enabled |
| `SMTP_PORT`     | SMTP server port     | `587`               |
| `SMTP_USER`     | SMTP username        | Required if enabled |
| `SMTP_PASSWORD` | SMTP password        | Required if enabled |
| `SMTP_FROM`     | Sender address       | Required if enabled |
| `SMTP_SECURE`   | Use TLS              | `false`             |

Set `SMTP_SECURE=true` for port 465 (implicit TLS) and `false` for port 587
(STARTTLS).

### Forgot password

Password reset is available when SMTP is enabled. Users receive an email with a
reset link. If SMTP is disabled, the forgot-password flow is not available.

## OAuth

Penombre supports any **OIDC-compliant** provider (Google, GitHub, Authentik,
Pocket ID, etc.). Enable it with `ENABLE_OAUTH_SIGNIN=true` and configure one or
more providers using environment variables.

### Provider configuration

Each provider is configured with the naming pattern
`OAUTH_<PROVIDER>_<SETTING>`, where `<PROVIDER>` is an uppercase identifier of
your choice.

| Variable                         | Description            | Default                |
| -------------------------------- | ---------------------- | ---------------------- |
| `OAUTH_<PROVIDER>_CLIENT_ID`     | OAuth client ID        | Required               |
| `OAUTH_<PROVIDER>_CLIENT_SECRET` | OAuth client secret    | Required               |
| `OAUTH_<PROVIDER>_DISCOVERY_URL` | OIDC discovery URL     | Required               |
| `OAUTH_<PROVIDER>_ENABLED`       | Enable this provider   | `true`                 |
| `OAUTH_<PROVIDER>_PRETTY_NAME`   | Display name in the UI | Provider name          |
| `OAUTH_<PROVIDER>_PKCE`          | Use PKCE               | `true`                 |
| `OAUTH_<PROVIDER>_SCOPES`        | Comma-separated scopes | `openid,profile,email` |

The discovery URL must point to the provider's
`/.well-known/openid-configuration` endpoint. Penombre auto-discovers
authorization, token, and userinfo endpoints from it.

### Example: Pocket ID

```bash
ENABLE_OAUTH_SIGNIN=true

OAUTH_POCKET_ID_CLIENT_ID=05a0dd79-...
OAUTH_POCKET_ID_CLIENT_SECRET=U8QJvEK8...
OAUTH_POCKET_ID_DISCOVERY_URL=https://auth.example.com/.well-known/openid-configuration
OAUTH_POCKET_ID_PRETTY_NAME=Pocket ID
```

### Example: Google

```bash
ENABLE_OAUTH_SIGNIN=true

OAUTH_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-...
OAUTH_GOOGLE_DISCOVERY_URL=https://accounts.google.com/.well-known/openid-configuration
OAUTH_GOOGLE_PRETTY_NAME=Google
```

### Redirect URI

When registering your OAuth application, set the redirect URI to:

```text
https://<your-domain>/api/v1/auth/callback/<provider-name>
```

The `<provider-name>` is the lowercase, hyphenated version of `<PROVIDER>`. For
example, `OAUTH_POCKET_ID_*` becomes `pocket-id`, so the callback URL is:

```text
https://cloud.example.com/api/v1/auth/callback/pocket-id
```

## Skipping the sign-in screen

If OIDC is your only way in, the sign-in screen is one pointless click. Set
`AUTH_AUTO_REDIRECT_PROVIDER` to a provider name and Penombre redirects to that
provider as soon as someone lands on `/auth/sign-in` — the form is never
rendered.

```bash
ENABLE_OAUTH_SIGNIN=true
AUTH_AUTO_REDIRECT_PROVIDER=pocket-id

OAUTH_POCKET_ID_CLIENT_ID=05a0dd79-...
OAUTH_POCKET_ID_CLIENT_SECRET=U8QJvEK8...
OAUTH_POCKET_ID_DISCOVERY_URL=https://auth.example.com/.well-known/openid-configuration
```

The value is the **provider name**, i.e. the lowercase, hyphenated version of
`<PROVIDER>` — `OAUTH_POCKET_ID_*` becomes `pocket-id`, the same name used in
the callback URL.

| Variable                      | Description                     | Default |
| ----------------------------- | ------------------------------- | ------- |
| `AUTH_AUTO_REDIRECT_PROVIDER` | Provider to redirect to on load | /       |

> **Escape hatch** — `/auth/sign-in?form` always renders the sign-in form, even
> with auto-redirect on. Use it to sign in with email or a passkey when your
> provider is down or misconfigured, so a broken IdP can't lock you out of your
> own instance.

Sign-out still works, but if your provider keeps its own session you may be
signed straight back in. Log out of the provider too for a full sign-out.

## Adding people to an instance

Sign-in is **email first**: the address is entered on its own, and Penombre then
asks for whatever that account actually needs.

- **A known account with a password** gets the password field.
- **A known account without one** — an address an admin registered — goes to
  `/auth/onboarding` to choose a password. No admin ever sees it, and no mail
  server is involved.
- **An unknown address** is told to ask an admin. Whether an address can sign
  itself up is governed by **Admin → Settings → Sign-ups**, including an
  optional allow-list of email domains.

Admins add people under **Admin → Users**: enter an email (and optionally a
name), and the account is created with no credential at all. That absent
credential is what marks it as an invitation — the sign-in flow sees it and
routes the person to onboarding. Tick **Email invite** (available once SMTP is
configured) to have Penombre mail them the sign-in link.

There is deliberately **no way for an admin to set someone's password**. A
password a second person has chosen and passed along is a password that lives in
whatever channel carried it, and its owner believes it is theirs alone.

> Email-first sign-in does reveal whether an address has an account here, which
> a combined email-and-password form does not. That is the accepted trade of
> every email-first flow; better-auth's rate limiter caps how fast the lookup
> can be walked.

On their first sign-in, everyone gets a short walkthrough to pick an accent,
typeface, corner style and default layout. It can be skipped, and everything in
it lives in **Settings → Appearance** afterwards.

## Adding a password to an OAuth account

An account created through an OAuth provider has no password of its own. When
`ENABLE_EMAIL_SIGNIN` is also on, **Account → Security** offers **Set a
password** for such accounts, so the same person can sign in either way — handy
when the identity provider is down or unreachable.

The form only appears while the account genuinely has no password; once one is
set it becomes the ordinary **Change password** flow, which asks for the current
password first. Setting a password never detaches the OAuth provider — both
sign-in methods keep working.

If `ENABLE_EMAIL_SIGNIN` is `false`, the whole section is hidden and the
underlying action refuses: there would be no form to use the password on.

## Passwordless sign-in

Two optional methods let someone sign in without typing a password. Both are
turned on under **Admin → Settings → Sign-in methods**, both require working
SMTP (the toggles stay disabled until mail is configured), and both take effect
**after the next restart** — better-auth builds its plugin list once at boot.

| Method                    | What the person gets                           |
| ------------------------- | ---------------------------------------------- |
| **Emailed sign-in link**  | A one-time link that signs them in when opened |
| **Emailed one-time code** | A short code to type into the sign-in form     |

Both appear on the sign-in screen once the address has been entered, alongside
the password field. Neither can create an account: they only sign in an address
that already exists, so opening them does not open sign-ups.

> A sign-in link is a bearer credential — anyone holding the URL is signed in.
> Treat a forwarded link the way you would treat a forwarded password.

## Two-factor authentication

Penombre supports TOTP two-factor: the six-digit codes an authenticator app
generates. It is always available — anyone can turn it on from **Account →
Security** — and an admin can make it compulsory.

Turning it on takes a password (to prove it is really you), then shows the
secret to add to an authenticator app together with a set of **backup codes**.
The codes are shown once and each works a single time; they are the way back in
if the phone is lost. Enrolment is only complete once a generated code has been
entered back, so a secret that never made it into an app cannot lock anyone out.

Signing in afterwards asks for a code at `/auth/two-factor`, which also accepts
a backup code. **Don't ask again on this device** remembers the browser so the
prompt is not repeated on every sign-in.

### Requiring it for everyone

**Admin → Settings → Security → Require two-factor authentication** forces
enrolment. Anyone who has not set it up is redirected to **Account → Security**
on their next page load and cannot use the rest of the app until they have. The
setting shows how many accounts are still outstanding before you turn it on.

> Penombre bundles no QR encoder, so enrolment offers a tappable `otpauth://`
> link (which opens the authenticator app directly on a phone) and the secret in
> text for manual entry, rather than a QR image.

## Which methods may be turned off

Sign-in methods cannot be switched off in a way that locks people out. Saving
**Admin → Settings** is refused when either is true:

1. **Nothing would be left.** At least one method — email and password, an
   emailed link, an emailed code, or an OAuth provider — has to remain.
2. **Accounts still depend on the one being removed.** Turning off email and
   password while some accounts have never linked an OAuth provider would strand
   exactly those people, so the save is refused and the message names how many
   they are. The same applies to removing an OAuth provider that is somebody's
   only way in.

The emailed link and code are exempt from the second rule: they authenticate an
address rather than a stored credential, so no account depends on them and
turning one off orphans nobody.

To get past a refusal, give the affected accounts another method first (or
delete them), then save again.

## Passkeys

Passkeys (WebAuthn/FIDO2) allow passwordless authentication using biometrics or
hardware security keys. They are always available — register one from **Account
→ Security**, and sign in with it from the **Sign in with a passkey** button.

Passkeys work with:

- Platform authenticators (Touch ID, Face ID, Windows Hello)
- Roaming authenticators (YubiKey, security keys)

> **Warning** — a passkey is bound to the hostname of your `ORIGIN`, which is
> what WebAuthn calls the relying-party ID. Three consequences:
>
> - Changing `ORIGIN` to a different hostname invalidates every existing
>   passkey; users have to register again.
> - `ORIGIN` must be the hostname people actually browse. Registering at
>   `http://localhost:5173` and then signing in at `http://192.168.1.10:3000`
>   fails, because the browser will not offer a credential issued for another
>   host.
> - Except on `localhost`, WebAuthn requires HTTPS. Behind a reverse proxy,
>   `ORIGIN` must be the public `https://` URL — see
>   [Reverse proxy](reverse-proxy.md).

Registration is not gated on how recently you signed in. Better Auth's default
is to refuse a passkey enrolment on a session older than a day; on a drive
people stay signed into for weeks that rejected essentially everyone, so
Penombre turns that freshness check off for this one endpoint. The challenge is
still bound to the session that asked for it, so nobody can enrol a passkey for
somebody else's account.

## API keys

API keys provide programmatic access to the Penombre API. Users can create and
manage API keys from the settings page.

Keys are sent via request headers:

```bash
# Preferred
curl -H "x-api-key: pen_..." https://cloud.example.com/api/v1/storage/files

# Alternative
curl -H "Authorization: Bearer pen_..." https://cloud.example.com/api/v1/storage/files
```

API keys are rate-limited to **100 requests per minute** in production. Each key
tracks its own request count and automatically refills.

## Initial admin account

A fresh instance has **no accounts and no default credentials**. On first start
every URL redirects to `/auth/setup`, a one-off screen that creates the
administrator: email, an optional name, and a password you choose.

Once any account exists the setup screen redirects to sign-in and its action
refuses, so it cannot be used later to add a second "first" administrator.

> Earlier versions seeded `admin@example.com` / `Admin1234!` from `ADMIN_EMAIL`
> and `ADMIN_PASSWORD`. Those variables are **gone** — a published default
> password on an internet-facing instance is a vulnerability, not a convenience.
> Existing instances are unaffected: they already have accounts, so the setup
> screen never appears. Remove the two variables from your `.env`.

The one exception is [auth bypass](simple-mode.md): with no authentication at
all there is nobody to sign in, so a single credential-less owner is created to
own the files.

## Rate limiting

In production, all authentication endpoints are rate-limited to **100 requests
per 15 minutes per IP address**. This protects against brute-force attacks. Rate
limiting is disabled in development mode.

## No authentication at all

[Simple mode](simple-mode.md) can run with authentication switched off entirely
— `BYPASS_AUTH=true`, no sign-in screen, every visitor is the shared owner. Only
do this behind your own auth proxy or on a trusted network. See
[No sign-in at all](simple-mode.md#no-sign-in-at-all).
