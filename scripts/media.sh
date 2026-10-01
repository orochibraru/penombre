#!/bin/sh
# Retakes every picture that shows Penombre off, then lays out the feature
# graphics around them. Run it as `mise run media`; name parts to run only
# those: `mise run media mobile graphics`.
#
#   web       docs/images/*.webp (both themes) and graphics/src/web.webp,
#             from the E2E stack, rebuilt from this tree first
#   desktop   graphics/src/desktop.webp, the sync app's own snapshot test
#   mobile    graphics/src/mobile-*.webp, the iOS simulator against the same
#             stack (a Mac with a simulator runtime)
#   graphics  graphics/*.webp and the Play Store's feature graphic
#
# Everything runs against the E2E stack's throwaway admin, never a real
# account: E2E_EMAIL / E2E_PASSWORD, as the E2E suite reads them.
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root"
parts="${*:-web desktop mobile graphics}"
server="http://localhost:3001"
email="${E2E_EMAIL:-admin@example.com}"
password="${E2E_PASSWORD:-Admin1234!}"
src="$root/docs/images/graphics/src"
work="$(mktemp -d)"

stack() {
  [ -n "${stack_up:-}" ] && return 0
  docker compose -f compose.e2e.yaml -p penombre-e2e up --build --wait
  stack_up=1
}

# PNG to WebP, `width` wide when given.
webp() {
  bun -e '
    const [from, to, width] = process.argv.slice(1);
    let image = new Bun.Image(await Bun.file(from).bytes());
    if (width) image = image.resize(Number(width));
    await Bun.write(to, await image.webp({ quality: 90 }).bytes());
  ' "$@"
}

for part in $parts; do
  case "$part" in
    web)
      stack
      bun run screenshots
      ;;
    desktop)
      (cd desktop && PENOMBRE_SYNC_SNAPSHOTS="$work" cargo test --quiet snapshots)
      webp "$work/syncing-dark.png" "$src/desktop.webp"
      ;;
    mobile)
      [ "$(uname)" = Darwin ] || { echo "The mobile shots need a Mac" >&2; exit 1; }
      stack
      # The account exists once the E2E setup has onboarded it.
      bunx playwright test --config playwright.config.ts --project=setup >/dev/null
      mise run mobile:ios
      device=$(xcrun simctl list devices booted | grep -m1 -oE '[0-9A-F-]{36}')
      appearance=$(xcrun simctl ui "$device" appearance)
      restore() {
        xcrun simctl ui "$device" appearance "$appearance" || true
        xcrun simctl status_bar "$device" clear || true
      }
      trap restore EXIT
      xcrun simctl ui "$device" appearance dark
      xcrun simctl status_bar "$device" override --time 9:41 \
        --batteryState charged --batteryLevel 100 --cellularBars 4 --wifiBars 3
      export PENOMBRE_E2E_SERVER="$server" PENOMBRE_E2E_EMAIL="$email" PENOMBRE_E2E_PASSWORD="$password"
      PENOMBRE_SEED_SHOWCASE=1 bun mobile/e2e/seed.ts
      # The seed has just signed in, and sign-in is rate-limited.
      link=""
      for attempt in 1 2 3 4 5; do
        link="$(bun mobile/e2e/pair.ts || true)"
        [ -n "$link" ] && break
        sleep 10
      done
      [ -n "$link" ] || { echo "No pairing link from $server" >&2; exit 1; }
      # Pinned: a phone plugged into the Mac must never be the one driven.
      maestro --device "$device" test --test-output-dir "$work" \
        -e LINK="$link" mobile/e2e/showcase.yaml
      for shot in mobile-drive mobile-player; do
        webp "$(find "$work" -name "$shot.png" | head -1)" "$src/$shot.webp" 720
      done
      restore
      trap - EXIT
      ;;
    graphics)
      bun scripts/feature-graphics.ts
      ;;
    *)
      echo "Unknown part $part (web, desktop, mobile, graphics)" >&2
      exit 1
      ;;
  esac
done
rm -rf "$work"
