# Mobile app

The Penombre app for Android and iOS is at an early stage: it signs in, lists
your drive natively and opens everything else in the instance's own web
interface. There is no store release yet; it is built from `mobile/` in the
repository.

## Signing in

Enter your server's address and tap **Sign in**. Your phone's browser opens
Penombre, you sign in the way you usually do (passkeys and OAuth included, since
it is the real browser), and approve **Sign in Penombre on your phone**. The
browser hands the app a one-time code and closes.

The app then holds an ordinary session, the same kind a browser gets. It shows
under **Account → Sessions** as `Penombre mobile · <model>`; revoking it there
signs the phone out on its next request. **Sign out** in the app revokes it too.

The server needs no configuration for this. Instances older than the release
that added the app answer the sign-in page with a 404: update the server.

## What it does today

- Browse **My drive**: folders natively, with paging for large folders.
- Opening an image, video or track shows the web viewer; any other file opens
  raw.
- The globe button opens the whole web interface, already signed in, for
  everything the app does not do natively yet.

## Plain HTTP

The app allows plain `http://` addresses, since a self-hosted instance is often
reached on a LAN before it has a certificate. Passkeys still need the domain
they were created on: a passkey made for `https://files.example.com` cannot sign
in to `http://192.168.1.20:3000`.
