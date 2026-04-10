# Penombre Mobile

React Native / Expo app for [Penombre](https://github.com/nicholasgasior/penombre) — a self-hosted cloud storage platform.

## Stack

- **Expo SDK 55** with React Native 0.83.4
- **Expo Router** — file-based navigation
- **NativeWind** — TailwindCSS utility classes via `className`
- **SWR** + **openapi-fetch** — typed API client generated from the OpenAPI spec
- **Better Auth** — session-based auth with Expo support

## Getting started

**Prerequisites:** Node 22+, Bun, and either Android Studio (Android) or Xcode (iOS).

```bash
# From the monorepo root
bun install

# Start the dev server
cd packages/mobile
bun run dev
```

Then press `a` to open on Android emulator or `i` for iOS simulator.

## Development commands

| Command           | Description                                    |
| ----------------- | ---------------------------------------------- |
| `bun run dev`     | Start Expo dev server                          |
| `bun run android` | Run on connected Android device / emulator     |
| `bun run ios`     | Run on iOS simulator                           |
| `bun run check`   | TypeScript type-check                          |
| `bun run gen:api` | Regenerate API types from `assets/api.v1.json` |

## Building

| Command                       | Output                                                 |
| ----------------------------- | ------------------------------------------------------ |
| `bun run build:android`       | Release APK → `android/app/build/outputs/apk/release/` |
| `bun run build:android:debug` | Debug APK → `android/app/build/outputs/apk/debug/`     |
| `bun run build:ios`           | Release simulator build (requires CocoaPods + Xcode)   |
| `bun run build:ios:debug`     | Debug simulator build (requires CocoaPods + Xcode)     |

For full Android build setup (SDK, NDK, signing), see [docs/android-build-setup.md](docs/android-build-setup.md).

For iOS builds, install CocoaPods first:

```bash
gem install --user-install cocoapods
```

Also ensure the iOS platform is installed in Xcode:

1. Open Xcode.
2. Go to Settings, then Components.
3. Install the iOS platform/runtime matching your Xcode version.

## Environment

Copy `.env.example` to `.env` and set:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000   # URL of the Penombre web server
```

## API types

Types are generated from the web package's OpenAPI spec. To regenerate after backend changes:

```bash
# From monorepo root
bun run gen:api
```

Do **not** manually edit `lib/api.v1.d.ts` or `assets/api.v1.json`.
