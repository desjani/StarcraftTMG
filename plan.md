# Android App Plan for StarCraft TMG

## Goal

Build a native Android app that delivers the core value of the existing StarCraft TMG web app in a phone/tablet-friendly experience.

The Android app should:
- feel native, not like a wrapped website
- preserve the current app's core behavior and game logic
- support Firebase auth, Firestore-backed cloud sync, and offline usage
- cover the most important gameplay surfaces first: Roster Card, Player Aid, and Play Mode

The Android app should not initially include:
- Discord export
- JSON export
- print-focused Player Aid flows
- reuse of the old mobile web/PWA implementation

## Product Intent

The current app serves three related purposes:
- roster lookup and viewing by seed code
- player assistance during a game
- linked live play and cloud-backed state

The Android version should be treated as a new client for the same product. We should reuse the existing domain rules and feature behavior, but rebuild the UI and state flow natively in Kotlin and Jetpack Compose.

## Source of Truth in the Current Repo

The current web app already defines the behaviors we need to preserve.

Primary logic to port:
- `lib/firestoreClient.js`
  Firestore roster and tactical-card fetch behavior
- `lib/rosterParser.js`
  raw shared roster to clean normalized roster model
- `lib/cloudSync.js`
  auth, cloud state merge rules, linked match creation/join/sync
- `web/public/modules/play-state.js`
  play mode state machine and tracker rules
- `web/public/modules/player-aid.js`
  player aid display logic and feature inventory
- `web/public/modules/roster-card.js`
  roster card display logic and options

These files are important because they tell us what the Android app actually needs to do, not just what the web UI looks like.

## Architecture Decision

Recommended Android stack:
- Kotlin
- Jetpack Compose
- Navigation Compose
- ViewModel + StateFlow
- Hilt
- Firebase Auth
- Firestore with offline persistence
- DataStore for local preferences and light local state
- Coil for remote images if needed

Recommended module structure:
- `app`
  Android entry point, navigation shell, theme, app wiring
- `core:model`
  roster, tactical card, auth, library, and play-state models
- `core:data`
  Firestore/Auth repositories, local persistence, sync adapters
- `core:domain`
  parser logic, merge logic, play reducers/use-cases
- `feature:roster`
- `feature:playeraid`
- `feature:play`
- `feature:auth`
- `feature:settings`

This structure keeps business rules separate from Compose UI and makes future iOS/shared-logic work more realistic.

## Scope

### Included in v1
- Roster lookup by seed
- Native roster card screen
- Player aid screen
- Favorites and recent history
- Firebase auth
- Cloud sync for user state
- Offline support
- Play Mode for local games
- Linked Play Mode with Firestore real-time sync
- Phone and tablet responsive layouts

### Explicitly deferred
- Discord text/image publishing
- JSON export
- print/export flows
- attempting one-to-one UI parity with desktop-only layouts

## Delivery Strategy

Build in this order:

1. Android foundation
- create project scaffold
- set up Compose, navigation, Hilt, Firebase, DataStore
- establish environment/config strategy

2. Domain port
- port roster parser and related data models to Kotlin
- port tactical-card enrichment logic
- port favorites/history merge rules
- port linked play state and consensus logic into pure Kotlin

3. Roster feature
- seed entry
- roster loading states
- roster card display options
- favorites and recent seeds

4. Player Aid feature
- render native player aid from parsed roster
- preserve useful toggles from web
- adapt layout for phone and tablet

5. Play Mode feature
- local game setup and game state tracking
- score/resource/activation/health tracking
- round and phase flow

6. Linked Play and cloud hardening
- create/join linked match
- Firestore real-time sync
- end-game consensus
- local/cloud merge and recovery cases

7. QA and release prep
- unit tests
- UI tests
- offline verification
- accessibility
- Play Store prep

## Project Phases

### Phase 0: Discovery and mapping

Deliverables:
- feature map of the existing app
- domain port specification
- Android screen flow
- build roadmap

Exit criteria:
- we have a screen-by-screen parity target
- we know which JS logic becomes pure Kotlin domain code
- we know what is intentionally out of scope

### Phase 1: Android scaffold

Tasks:
- create Android Studio project
- configure Gradle, package naming, signing strategy, and environments
- add Compose, Hilt, Navigation, Firebase dependencies
- create base theme and app shell

Exit criteria:
- app builds and launches on emulator
- navigation shell works
- Firebase config is wired for dev builds

### Phase 2: Domain and data layer

Tasks:
- define Kotlin models for roster, tactical cards, history, favorites, play state
- port parser logic from `lib/rosterParser.js`
- implement Firestore repositories for rosters and linked matches
- implement local persistence for settings/history
- port cloud merge rules from `lib/cloudSync.js`

Exit criteria:
- a seed can be loaded and parsed on Android
- parser parity is backed by tests
- local persistence works

### Phase 3: Roster Card feature

Tasks:
- seed search/load screen
- roster summary and units list
- display toggles for stats, upgrades, tactical cards, supply breakdown
- favorites/history UI
- error handling and retry states

Exit criteria:
- roster lookup is stable and usable on phone and tablet

### Phase 4: Player Aid feature

Tasks:
- native player aid rendering
- upgrade/stat/activation/tactical toggles
- merged vs expanded aid modes where appropriate
- layout polish for dense gameplay information

Exit criteria:
- player aid is usable during a live game on both phone and tablet

### Phase 5: Play Mode

Tasks:
- new game flow
- local game state reducer/store
- health, activation, score, supply, mission trackers
- round/phase transitions
- save and restore active games

Exit criteria:
- a full local game can be created and tracked without linked sync

### Phase 6: Linked play and sync

Tasks:
- create linked match code
- join linked match
- subscribe to remote updates
- sync side-specific and shared state
- consensus workflows for pass/end-game flows
- handle reconnect and offline recovery cases

Exit criteria:
- two devices can complete a linked game reliably

### Phase 7: QA, polish, release

Tasks:
- add automated tests for parser, reducers, merge rules
- add Compose UI tests for critical screens
- verify offline behavior and sync recovery
- prepare screenshots, icon, privacy disclosures, and release checklist

Exit criteria:
- app is stable enough for internal testing or Play Store submission

## Recommended First Sprint

The first sprint should focus on de-risking the port rather than trying to build the whole app.

Sprint 1 goals:
- scaffold the Android project
- create Kotlin domain models
- port roster parser logic
- connect Firestore roster reads
- build a simple seed lookup screen
- render a first-pass native roster view
- add tests against known fixture expectations from this repo

Why this first:
- it proves the data model
- it proves Firebase access
- it gives a visible result quickly
- it creates the base that every later feature depends on

## Major Risks

### Risk 1: Hidden business logic in UI code
The web app contains a lot of behavior in app orchestration and UI modules, especially around Play Mode.

Mitigation:
- move Android behavior into pure domain/reducer layers early
- document parity rules before implementation

### Risk 2: Linked play complexity
Real-time sync, side ownership, consensus, and reconnection behavior are the hardest part of the app.

Mitigation:
- build local-only play first
- port linked rules as tested pure Kotlin logic before wiring UI

### Risk 3: Scope creep from "feature parity"
If parity is not defined precisely, the work can balloon.

Mitigation:
- define parity screen by screen
- explicitly document deferred features

### Risk 4: Firebase environment/config differences
The web app's assumptions around auth domains and hosting do not map directly to Android.

Mitigation:
- define Android Firebase config separately
- validate auth flows early

## Immediate Planning Deliverables

This repo should include these planning docs:
- [android-feature-map.md](/home/jared/Documents/Git/StarcraftTMG/android-feature-map.md)
- [android-domain-port-spec.md](/home/jared/Documents/Git/StarcraftTMG/android-domain-port-spec.md)
- [android-screen-flow.md](/home/jared/Documents/Git/StarcraftTMG/android-screen-flow.md)
- [android-build-roadmap.md](/home/jared/Documents/Git/StarcraftTMG/android-build-roadmap.md)

Together they define:
- what the Android app must include
- what logic we should port from JS to Kotlin
- how screens fit together
- how to execute the work in a low-risk order

## Definition of Success

The Android app is successful when:
- a user can sign in and load a roster by seed
- the roster is rendered accurately in a native Android UI
- favorites/history and cloud sync behave reliably
- Player Aid is practical during gameplay
- Play Mode works locally and in linked matches
- the app works well on both phones and tablets
- the app feels like a real Android product, not a compromised copy of the website
