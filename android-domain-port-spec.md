# Android Domain Port Specification

## Purpose

This document defines what logic from the current JavaScript app should be ported into pure Kotlin domain code for the Android app.

The rule is simple:
- business logic and state rules should become platform-agnostic Kotlin code
- UI rendering details should be reimplemented natively in Compose

## Porting Principles

### Preserve behavior, not syntax
We are not translating JavaScript line by line. We are preserving rules, invariants, and outcomes.

### Prefer pure Kotlin for core rules
Anything that can be expressed as deterministic state transformation should live outside Compose.

### Keep Firebase and UI separate
Repositories talk to Firebase.
Use-cases/reducers transform models.
Compose renders state and dispatches actions.

## Logic Areas to Port

### 1. Firestore document mapping

Source:
- `lib/firestoreClient.js`

Port target:
- Kotlin mappers for roster documents
- tactical card document mapping

Responsibilities:
- decode Firestore data into app models
- normalize field types
- handle missing/optional values defensively

Android note:
- if Android uses the Firebase SDK instead of the REST API, we still need the same normalization rules even if the transport changes

### 2. Roster parsing and normalization

Source:
- `lib/rosterParser.js`

Port target:
- pure Kotlin parser/use-case, e.g. `ParseRosterUseCase`

Responsibilities:
- resolve active upgrade indices against available upgrades
- compute size-specific upgrade costs
- calculate unit total cost
- normalize tactical card details
- normalize faction/faction card labels
- sort units in canonical type order
- build slot summaries and resource totals

Test expectation:
- Kotlin output should match current fixture-based expectations in spirit and structure

### 3. Favorites/history merge rules

Source:
- `lib/cloudSync.js`

Port target:
- pure Kotlin merge utilities

Responsibilities:
- merge local and cloud seed histories
- dedupe seeds
- preserve ordering rules
- merge favorites by seed
- enforce max recent count

### 4. Game library merge rules

Source:
- `lib/cloudSync.js`

Port target:
- pure Kotlin merge utilities for active/completed games

Responsibilities:
- normalize records
- prefer newer records using timestamps
- ensure completed records supersede in-progress records
- resolve active game selection

### 5. Play Mode state machine

Source:
- `web/public/modules/play-state.js`

Port target:
- reducer/store or use-case based domain layer

Responsibilities:
- create initial play state
- build unit trackers from roster
- health and shield tracking
- deployment/activation state
- round and phase progression
- score/resource updates
- snapshot/undo behavior if retained
- winner/breakdown summaries

Recommended approach:
- model this as immutable state plus actions/reducer functions

### 6. Linked match consensus rules

Source:
- `web/public/modules/play-state.js`
- `lib/cloudSync.js`

Port target:
- pure Kotlin linked-consensus logic plus repository sync layer

Responsibilities:
- create normalized linked consensus state
- represent player/opponent approvals
- decide when both sides have approved a pass or end-game request
- protect side ownership semantics

### 7. Cloud sync orchestration

Source:
- `lib/cloudSync.js`

Port target:
- repository layer with thin orchestration helpers

Responsibilities:
- sign-in state observation
- fetch cloud library and seed history
- write cloud updates
- subscribe to linked match updates
- create and join linked matches

Android note:
- Firebase SDK usage will differ from web dynamic imports, but behavior targets should remain aligned

## Logic That Should Not Be Ported Literally

These areas should be redesigned for Android instead of copied:
- HTML rendering from `player-aid.js`
- HTML rendering from `roster-card.js`
- browser-only diagnostics and DOM handling in `web/public/app.js`
- Puppeteer/image rendering endpoints from `web/server.js`
- Discord formatter output from `lib/formatter.js` except where useful as a display-reference for grouping/order

## Proposed Kotlin Domain Model Areas

Suggested model groups:
- `Roster`
- `RosterUnit`
- `RosterUpgrade`
- `TacticalCard`
- `SeedHistory`
- `FavoriteSeed`
- `GameLibrary`
- `PlayState`
- `PlayUnitTracker`
- `LinkedMatch`
- `LinkedConsensus`

Suggested use-case groups:
- `LoadRosterBySeed`
- `ParseRoster`
- `MergeSeedHistory`
- `MergeGameLibrary`
- `CreatePlayState`
- `AdvancePlayPhase`
- `AdjustUnitHealth`
- `ToggleUnitActivation`
- `CreateLinkedMatch`
- `JoinLinkedMatch`
- `SyncLinkedMatch`

## Testing Strategy for the Port

### Fixture-backed tests
Use the existing known roster fixtures and expectations from this repo as the first parity anchor.

Good first tests:
- parsed faction/faction card values
- unit ordering
- upgrade cost calculation
- tactical card mapping
- favorites/history merge behavior
- play unit tracker creation

### Reducer tests
For Play Mode, the most important tests are action/result tests:
- create game
- deploy unit
- damage/heal unit
- advance phase
- reset round trackers
- apply linked approvals

### Repository tests
Mock Firebase repositories and verify:
- sign-in transitions
- merge behavior
- linked match subscriptions

## Open Questions to Resolve During Implementation

- whether anonymous auth is required for linked join on Android or only signed-in flows will be allowed
- whether Play Mode state should support undo/history in v1
- whether tactical-card artwork URLs need native image rendering in v1 or text-first display is enough
- whether the Android app needs the full breadth of Player Aid merging behavior at launch or a simplified but correct version first
