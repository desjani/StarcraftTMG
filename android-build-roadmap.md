# Android Build Roadmap

## Purpose

This roadmap breaks the Android app effort into concrete execution steps with low-risk sequencing.

## Guiding Strategy

Do the work in a way that proves the hardest assumptions early:
- can we load and parse rosters cleanly on Android
- can we preserve game logic outside the UI
- can Firebase auth and linked sync behave well in a native app

## Milestone 0: Planning Complete

Deliverables:
- `plan.md`
- `android-feature-map.md`
- `android-domain-port-spec.md`
- `android-screen-flow.md`
- this roadmap

Completion criteria:
- scope is explicit
- parity target is explicit
- first sprint is defined

## Milestone 1: Android Project Scaffold

Tasks:
- create Android Studio project
- choose package name
- configure min SDK and target SDK
- set up Compose, Hilt, Navigation, Firebase BOM, DataStore
- add dev build variant if needed
- commit baseline project that launches

Completion criteria:
- app builds locally
- emulator launch works
- CI strategy is at least sketched

## Milestone 2: Core Models and Parser Port

Tasks:
- define Kotlin models for roster domain
- port Firestore roster/tactical-card mapping
- port `rosterParser` logic
- add fixture-based unit tests

Completion criteria:
- Android tests confirm correct parsed output for representative seeds
- parser logic is independent from UI

## Milestone 3: Roster Lookup MVP

Tasks:
- create seed entry screen
- wire Firestore roster loading
- render first-pass roster details in Compose
- handle loading, empty, invalid, and network states

Completion criteria:
- user can enter a seed and see a correct roster on device

## Milestone 4: Roster Card UX and Local Persistence

Tasks:
- implement polished native roster card screen
- add toggles for upgrades/stats/tactical display
- store recent seeds locally
- add favorites
- restore last viewed roster/session state if desired

Completion criteria:
- roster browsing feels useful as a standalone app feature

## Milestone 5: Auth and Cloud User State

Tasks:
- add Google sign-in
- add email/password auth
- add password reset
- sync recent/favorite data to cloud
- implement merge rules between local and cloud state

Completion criteria:
- signed-in users retain data across devices

## Milestone 6: Player Aid

Tasks:
- design the native Player Aid presentation
- implement aid toggles and condensed/expanded sections
- optimize for in-game readability
- add tablet-specific layout improvements

Completion criteria:
- Player Aid is usable during a real match

## Milestone 7: Local Play Mode

Tasks:
- define Play Mode reducer/store
- implement game setup flow
- add round/phase/resource/score trackers
- add unit health and activation tracking
- persist active and completed games locally

Completion criteria:
- a user can play and track a full local game on one device

## Milestone 8: Linked Match Infrastructure

Tasks:
- design Firestore schema usage for Android linked matches
- implement create/join flows
- subscribe to shared and side-specific state
- expose sync/ready indicators

Completion criteria:
- two devices can connect to the same linked match reliably

## Milestone 9: Linked Consensus and Recovery

Tasks:
- implement pass/end-game consensus rules
- handle reconnects and app restarts
- verify conflict handling and stale-state recovery

Completion criteria:
- linked play is robust enough for normal real-world use

## Milestone 10: QA and Release Prep

Tasks:
- unit tests for parser, merge logic, and play reducers
- Compose UI tests for major flows
- manual testing on phone/tablet and portrait/landscape
- accessibility pass
- performance and battery sanity check
- Play Store assets and policy review

Completion criteria:
- app is ready for internal or public release

## Suggested First Sprint Backlog

Keep the first sprint narrow and de-risking-focused.

Sprint backlog:
- create Android project
- add core dependencies
- define roster models
- port parser
- add fixture tests
- build seed lookup screen
- render basic roster summary

Expected outcome:
- we can prove the Android client can correctly load and understand game data before investing in large UI and multiplayer work

## Suggested Repo/Workstream Structure Once Development Starts

When Android work begins, create a dedicated top-level folder such as:
- `android/`

Then split work into these streams:
- foundation and build setup
- domain/data port
- roster feature
- player aid feature
- play mode
- auth/sync
- QA/release

## Decision Gates

Pause and reassess at these points:

### Gate 1: After parser parity
Question:
- does the Kotlin model cleanly represent the current roster data without awkward compromises

### Gate 2: After local play mode
Question:
- is the Play Mode reducer stable enough before adding linked sync complexity

### Gate 3: After linked play prototype
Question:
- is the linked experience reliable enough to continue toward release, or do we need to narrow v1

## Recommended Immediate Next Action

The next practical step is to start Milestone 1:
- scaffold the Android project in a new `android/` directory
- then immediately tackle the parser/domain port before broader UI work
