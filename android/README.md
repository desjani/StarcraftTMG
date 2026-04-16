# SC Adjutant Android

This directory contains the native Android app for StarCraft TMG.

## Current status

This build is now beyond the initial scaffold and is suitable for an internal alpha-style test pass.

Implemented today:
- native Jetpack Compose app shell
- roster lookup by seed using the same Firestore source as the web app
- Kotlin port of the roster parser
- roster summary screen with display toggles
- first-pass Player Aid screen
- local persistence for:
  - recent seeds
  - favorite rosters
  - active local game
  - local game library
- local Play Mode with:
  - game setup form
  - round/phase progression
  - score and resource tracking
  - unit deployment toggles
  - movement/assault/combat activation toggles
  - unit health tracking
  - completed/in-progress game library
- Firebase-backed cloud foundation with:
  - anonymous sign-in
  - optional Google sign-in via Credential Manager
  - cloud status in Settings
  - manual sync action
  - merge logic for recent seeds, favorites, and local game library

## Not finished yet

Still missing before full planned feature parity:
- email/password auth flows
- linked multiplayer match creation/join/sync UI
- end-game consensus workflow for linked games
- broader UI polish and device QA

## Opening the project

1. Open the `android/` directory in Android Studio.
2. Use JDK 17 or JDK 21 for Gradle.
3. Let Gradle sync the project.
4. Ensure your Android SDK is installed and configured in Android Studio.
5. Optional for Google sign-in: set `SCADJUTANT_GOOGLE_WEB_CLIENT_ID` in `android/local.properties` to your Firebase OAuth web client ID.
6. Run the `app` configuration on an emulator or device with internet access.

## Google sign-in setup

The app can now use Google sign-in, but it is intentionally gated behind a local config value so the repo can build without shipping credentials. The app's Firebase identity is now aligned to the registered Android app, while the OAuth web client ID stays local.

1. Open your Firebase project for the Android app.
2. Find the OAuth web client ID used for Firebase Authentication.
3. Add this line to `android/local.properties`:

   `SCADJUTANT_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com`

4. Resync Gradle in Android Studio.

If the value is missing, the app still builds and the Settings screen will show that Google sign-in is not configured yet.

## Suggested alpha test checklist

1. Load a roster by seed.
2. Verify it appears in recent seeds.
3. Favorite the roster.
4. Start a local game from that roster.
5. Update score, resources, phase, deployment, activation, and health.
6. End the game and verify it lands in the completed library.
7. Sign in anonymously in Settings.
8. Run cloud sync and confirm there are no errors.
9. If Google sign-in is configured, sign in with Google or upgrade an anonymous account and sync again.

## Notes

- The app still reads roster data through the Firestore REST API, so it does not require `google-services.json` for roster lookup.
- The repo environment used to generate this build did not have a local Android SDK, so final build and device verification still need to happen in Android Studio on your machine.
- Gradle wrapper setup has been validated with `./gradlew help` under Java 17 in this repo environment.
