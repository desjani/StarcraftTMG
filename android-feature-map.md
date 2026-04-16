# Android Feature Map

## Purpose

This document maps the existing web app's feature set into an Android feature inventory so we can define parity deliberately instead of vaguely aiming for "everything."

## Existing Product Surfaces

The current project has three user-facing surfaces:
- web app
- Discord bot
- linked live play/cloud sync

For Android, the web app and cloud-sync behavior are the main source of truth. The Discord bot is useful for understanding formatting intent, but Discord-specific publishing is out of scope for the Android app.

## Android v1 Feature Inventory

### 1. Roster Lookup

User value:
- enter a seed and load a saved roster quickly

Current repo signals:
- `web/public/app.js`
- `lib/firestoreClient.js`
- `lib/rosterParser.js`

Android parity target:
- seed input
- load action
- loading state
- not found / network / invalid seed handling
- parsed roster display

Priority:
- Must have

### 2. Roster Card

User value:
- view a compact, readable roster summary suitable for list review and game prep

Current repo signals:
- `web/public/modules/roster-card.js`

Android parity target:
- faction and faction card header
- minerals, gas, supply, resource totals
- units grouped in existing canonical order
- tactical card section
- display options for upgrades, stats, size, cost, tactical card metadata, and slot breakdown

Priority:
- Must have

### 3. Favorites and Seed History

User value:
- quickly revisit commonly used rosters

Current repo signals:
- `web/public/app.js`
- `lib/cloudSync.js`

Android parity target:
- recent seeds
- saved favorites
- rename favorites
- local persistence
- cloud merge when signed in

Priority:
- Must have

### 4. Player Aid

User value:
- use the roster as an in-game reference rather than just a list viewer

Current repo signals:
- `web/public/modules/player-aid.js`
- related render/helper modules

Android parity target:
- readable unit-by-unit aid
- unit stats
- upgrades and abilities
- tactical cards
- activation-oriented information
- view modes/toggles where they materially improve usability

Deferred from web:
- print-focused workflows

Priority:
- Must have

### 5. Local Play Mode

User value:
- track an actual game on one device without needing the browser app

Current repo signals:
- `web/public/modules/play-state.js`
- `web/public/app.js`

Android parity target:
- new game setup
- player/opponent names and rosters
- score tracking
- resource tracking
- phase and round progression
- activation toggles
- unit health tracking
- save/restore active games locally

Priority:
- Must have

### 6. Linked Play Mode

User value:
- play across two devices with synchronized state

Current repo signals:
- `lib/cloudSync.js`
- `web/public/app.js`
- `web/public/modules/play-state.js`

Android parity target:
- create linked match
- join linked match by code
- sync shared state and side-specific state
- ready states
- pass / phase progression consensus
- end-game consensus

Priority:
- Must have, but later than local play

### 7. Authentication

User value:
- preserve data and support linked/cloud features

Current repo signals:
- `lib/cloudSync.js`

Android parity target:
- Google sign-in
- email/password sign-in and account creation
- password reset
- optional anonymous participation if needed for joining linked play
- clear signed-in/signed-out state

Priority:
- Must have

### 8. Cloud Sync

User value:
- keep favorites, history, and game state available across devices

Current repo signals:
- `lib/cloudSync.js`

Android parity target:
- sync favorites/history
- sync game library
- local/cloud merge
- conflict resolution using current app behavior as baseline

Priority:
- Must have

### 9. Offline Support

User value:
- app remains usable at the table with unstable connectivity

Current repo signals:
- Firebase/Firestore usage already aligns with this goal

Android parity target:
- Firestore offline persistence enabled
- locally cached app state remains visible
- clear handling when sync is pending or unavailable

Priority:
- Must have

## Explicit Non-Goals for Android v1

- Discord posting/export flows
- JSON export
- image export of roster cards
- print layouts
- porting the old `/mobile/` PWA as-is

## Parity Notes

Parity should mean:
- same important data
- same important rules
- same major gameplay interactions

Parity should not mean:
- same HTML structure
- same exact tab layout
- same desktop-specific controls

## Recommended Priority Order

1. Roster lookup and roster card
2. Favorites/history plus auth
3. Player Aid
4. Local Play Mode
5. Linked Play Mode
6. polish, tablet optimization, release prep
