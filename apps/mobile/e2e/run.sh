#!/bin/sh
# Runs the Maestro flows on the Android emulator and, on a Mac, the iOS
# simulator, against a Penombre server that is already running.
# Run it as `mise run mobile:e2e`: mise provides adb, the emulator and Maestro.
# Name platforms to run only those: `mise run mobile:e2e ios`. `seed` only
# fills the test account's drive (`mise run mobile:seed`).
#
#   PENOMBRE_E2E_SERVER    the server, default http://localhost:5173
#   PENOMBRE_E2E_EMAIL     with PENOMBRE_E2E_PASSWORD, an account that signs in
#   PENOMBRE_E2E_PASSWORD  with a password: also runs the signed-in flow
set -eu

root="$(cd "$(dirname "$0")/../../.." && pwd)"
# Like every other local setting, these may live in the repo's .env.
for name in PENOMBRE_E2E_SERVER PENOMBRE_E2E_EMAIL PENOMBRE_E2E_PASSWORD; do
  eval "set=\${$name:-}"
  if [ -z "$set" ] && [ -f "$root/.env" ]; then
    value="$(sed -n "s/^$name=//p" "$root/.env" | tail -1 | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/")"
    [ -z "$value" ] || export "$name=$value"
  fi
done
server="${PENOMBRE_E2E_SERVER:-http://localhost:5173}"
platforms="${*:-android ios}"
flow="$root/apps/mobile/e2e/sign-in-screen.yaml"
signed_in=
if [ -n "${PENOMBRE_E2E_EMAIL:-}" ] && [ -n "${PENOMBRE_E2E_PASSWORD:-}" ]; then
  flow="$root/apps/mobile/e2e/signed-in.yaml"
  signed_in=1
fi

# Retried: a dev server answers 500 for a moment while it reloads.
curl -fsS -o /dev/null -m 5 --retry 5 --retry-delay 2 --retry-all-errors "$server/auth/sign-in" || {
  echo "No Penombre server at $server: start one (bun run dev) or set PENOMBRE_E2E_SERVER" >&2
  exit 1
}

flows() {
  maestro --platform "$1" test \
    -e SERVER="$server" \
    -e EMAIL="${PENOMBRE_E2E_EMAIL:-}" \
    -e PASSWORD="${PENOMBRE_E2E_PASSWORD:-}" \
    "$flow"
  [ -n "$signed_in" ] || return 0
  PENOMBRE_E2E_SERVER="$server" bun "$root/apps/mobile/e2e/verify.ts"
  # The QR code's link, fresh: it is good for one sign-in and two minutes.
  maestro --platform "$1" test \
    -e LINK="$(PENOMBRE_E2E_SERVER="$server" bun "$root/apps/mobile/e2e/pair.ts")" \
    "$root/apps/mobile/e2e/paired.yaml"
}

[ -z "$signed_in" ] || PENOMBRE_E2E_SERVER="$server" bun "$root/apps/mobile/e2e/seed.ts"

for platform in $platforms; do
  case "$platform" in
    android)
      adb devices | grep -qw device || mise run mobile:emulator
      mise run mobile:run:android
      # The device's localhost must reach the server's port on this machine.
      port="$(printf '%s' "$server" | sed -nE 's#^[a-z]+://[^:/]+:([0-9]+).*#\1#p')"
      [ -n "$port" ] && adb reverse "tcp:$port" "tcp:$port" >/dev/null
      flows android
      ;;
    ios)
      [ "$(uname)" = Darwin ] || { echo "Skipping iOS: not a Mac"; continue; }
      mise run mobile:run:ios
      flows ios
      ;;
    seed) ;;
    *)
      echo "Unknown platform $platform (android, ios)" >&2
      exit 1
      ;;
  esac
done
