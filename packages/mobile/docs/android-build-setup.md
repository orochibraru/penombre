# Android Build Setup

Local Gradle build for the Penombre Android app.

## Requirements

| Tool           | Version | Notes                                                    |
| -------------- | ------- | -------------------------------------------------------- |
| JDK            | 17+     | Use [Temurin](https://adoptium.net/)                     |
| Android Studio | Latest  | Installs Android SDK and NDK                             |
| Android SDK    | API 36  | Set via `compileSdk` in `app/build.gradle`               |
| Node.js        | 22+     | Required by Gradle scripts that resolve paths via `node` |

### Set environment variables

Add to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk   # macOS default
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Verify:

```bash
adb version
```

### Install SDK components

In Android Studio → **SDK Manager**, install:

- **SDK Platform**: Android 16.0 (API 36)
- **SDK Build-Tools**: 36.x
- **NDK (Side by side)**: version matching `ndkVersion` in `android/build.gradle`
- **CMake**: latest

## Building

All commands run from `packages/mobile`.

### Debug APK (for emulator / USB testing)

```bash
bun run build:android:debug
# Equivalent: cd android && ./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK (for distribution)

```bash
bun run build:android
# Equivalent: cd android && ./gradlew assembleRelease
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

> The release build currently uses the **debug keystore** (`android/app/debug.keystore`). For Play Store distribution, see [Signing a release build](#signing-a-release-build) below.

## Gradle wrapper

The project uses Gradle **8.14.3** via the wrapper (`android/gradlew`). Never install or invoke Gradle globally — always use `./gradlew`.

The wrapper downloads Gradle automatically on first run to `~/.gradle/wrapper/dists`.

## Key build config

| Property         | Value                              | File                                           |
| ---------------- | ---------------------------------- | ---------------------------------------------- |
| `compileSdk`     | 36                                 | `android/build.gradle` (via `rootProject.ext`) |
| `minSdk`         | set in `rootProject.ext`           | `android/build.gradle`                         |
| `targetSdk`      | 36                                 | `android/build.gradle` (via `rootProject.ext`) |
| `hermesEnabled`  | `true`                             | `android/gradle.properties`                    |
| `newArchEnabled` | `true`                             | `android/gradle.properties`                    |
| `applicationId`  | `com.anonymous.opendrive`          | `android/app/build.gradle`                     |
| Architectures    | `armeabi-v7a,arm64-v8a,x86,x86_64` | `android/gradle.properties`                    |

To build for a single architecture only (faster local builds):

```bash
cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64
```

## Signing a release build

The release build is currently signed with the debug keystore. To sign properly for distribution:

**1. Generate a keystore** (once):

```bash
keytool -genkeypair -v \
  -keystore android/app/penombre-release.keystore \
  -alias penombre \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

**2. Add signing config** to `android/gradle.properties`:

```properties
PENOMBRE_STORE_FILE=penombre-release.keystore
PENOMBRE_STORE_PASSWORD=<your-store-password>
PENOMBRE_KEY_ALIAS=penombre
PENOMBRE_KEY_PASSWORD=<your-key-password>
```

**3. Update `android/app/build.gradle`** `signingConfigs.release`:

```groovy
release {
    storeFile file(PENOMBRE_STORE_FILE)
    storePassword PENOMBRE_STORE_PASSWORD
    keyAlias PENOMBRE_KEY_ALIAS
    keyPassword PENOMBRE_KEY_PASSWORD
}
```

> Do **not** commit the keystore or `gradle.properties` passwords to git.

## Common issues

**`ANDROID_HOME` not set**
Gradle can't find the SDK. Set the env var as shown above and restart your terminal.

**`node` not found during Gradle sync**
The `settings.gradle` and `app/build.gradle` call `node` to resolve package paths. Ensure Node is on your `PATH` and that `bun install` has been run in `packages/mobile`.

**Build fails after adding a native module**
Run `bun install` then rebuild — Expo autolinking wires new native modules into `settings.gradle` automatically.

**Out of memory**
Increase the JVM heap in `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```
