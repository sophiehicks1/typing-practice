# Android WebView wrapper

This folder wraps the web app in a minimal Android WebView so it can ship as an
installable APK. It is deliberately tiny:

- A single `MainActivity` shows a full-screen `WebView`.
- The WebView loads `file:///android_asset/index.html` -- the same single, fully
  inlined build the web download uses -- so the app runs **completely offline**
  and requests **no permissions** (not even `INTERNET`).
- There are no third-party dependencies; `WebView` is part of the framework.

## How it is built in CI

`.github/workflows/release.yml` builds the web app, copies
`dist/index.html` into `app/src/main/assets/index.html`, then runs
`gradle assembleDebug`. The resulting APK is attached to each GitHub Release as
`typing-practice.apk`.

The APK is **debug-signed** using the committed `debug.keystore` (password is the
well-known `android`). This is deliberately not a secret -- it only produces
debug-signed APKs for sideloading. Committing it means every release is signed
with the **same certificate**, so installs update in place instead of Gradle
minting a throwaway key on each CI runner. The `versionCode` is derived from the
CI run number so it increases with every release (Android requires a higher
`versionCode` to update). It is not a Play Store release build -- see below.

## Build it locally

You need a JDK (17+) and the Android SDK. Then, from the repo root:

```bash
npm ci
npm run build
cp dist/index.html android/app/src/main/assets/index.html
cd android
gradle assembleDebug            # or: ./gradlew assembleDebug if you add a wrapper
```

The APK lands at `android/app/build/outputs/apk/debug/app-debug.apk`.

> The web build is copied in, not committed. `app/src/main/assets/index.html` is
> git-ignored, so always run the copy step before building.

## Installing the APK

Because it is not distributed through the Play Store, you sideload it: enable
"install unknown apps" for whichever app opens the file (browser or file
manager), then open the APK.

## Turning this into a Play Store / release build

The current setup produces a debug-signed APK on purpose (zero secrets). To ship
a proper release build you would:

1. Generate a keystore and store it plus its passwords as GitHub Actions secrets.
2. Add a `signingConfigs { release { ... } }` block in `app/build.gradle` reading
   those secrets, and wire it into `buildTypes.release`.
3. Build `assembleRelease` (or `bundleRelease` for an `.aab`) in CI.

Everything else in this folder stays the same.
