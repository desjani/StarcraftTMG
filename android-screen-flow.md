# Android Screen Flow

## Purpose

This document proposes the Android app's primary screens and navigation flow based on the current web app's capabilities and the goals in `plan.md`.

## Navigation Model

Recommended top-level navigation:
- Roster
- Player Aid
- Play
- Library
- Settings

This should likely be a bottom navigation bar on phones and a navigation rail on larger screens.

## Screen List

### 1. Launch / Bootstrap

Responsibilities:
- initialize Firebase
- restore signed-in state
- restore local preferences
- restore last active game if any

Possible outcomes:
- proceed into app shell
- show recoverable startup error state if critical config is broken

### 2. Roster Screen

Responsibilities:
- accept seed input
- load roster
- show loading/error/success states
- expose roster display options

Primary actions:
- load seed
- open favorites/history picker
- save favorite
- jump to Player Aid
- jump to Play setup

Tablet note:
- on tablet, roster results and history/favorites can coexist in a two-pane layout

### 3. Favorites / Recent Seeds Sheet or Library Panel

Responsibilities:
- show favorites
- show recent seeds
- load a selected seed
- rename/remove favorites

Phone pattern:
- modal bottom sheet or separate Library tab

Tablet pattern:
- persistent side pane when space permits

### 4. Player Aid Screen

Responsibilities:
- render a gameplay-focused view of the loaded roster
- expose toggles for stats, upgrades, tactical cards, activation details, merged vs expanded views as appropriate

Primary actions:
- collapse/expand sections
- switch between filtered/merged views
- jump into Play setup using the current roster

Tablet note:
- use wider layouts to reduce scrolling and keep tactical/summary data visible

### 5. New Game Flow

Responsibilities:
- create a local or linked game
- collect player/opponent names
- choose player seed and optional opponent seed
- set mission, game size, game length, starting supply, supply per round

Recommended UX:
- use a dedicated setup screen or multi-step sheet rather than many tiny dialogs

Branches:
- Local game
- Create linked game
- Join linked game

### 6. Play Dashboard

Responsibilities:
- show active game state
- expose round/phase controls
- show score/resource/supply state
- show player and opponent roster summaries
- support quick transitions into trackers

Primary actions:
- advance phase
- swap active board side if needed
- end game
- open health/activation panels

### 7. Unit Tracker / Health Detail

Responsibilities:
- modify current health pools
- toggle deployed state
- toggle activation states

Phone pattern:
- sheet or detail screen

Tablet pattern:
- side-by-side list/detail

### 8. Linked Match Join / Status Screen

Responsibilities:
- enter join code
- show linked readiness state
- display sync status and remote participant presence

Primary actions:
- join match
- retry
- leave match

### 9. Library Screen

Responsibilities:
- show in-progress games
- show completed games
- restore a saved game

Primary actions:
- open game
- archive/remove if supported

### 10. Auth Screen or Auth Sheet

Responsibilities:
- sign in with Google
- sign in/create account with email/password
- reset password
- sign out

Recommended UX:
- make auth a modal/sheet from Settings or from sync-gated flows, not necessarily a dedicated startup gate

### 11. Settings Screen

Responsibilities:
- account state
- sync status
- visual preferences
- gameplay defaults where useful
- about/debug/build info

## Recommended Primary User Flows

### Flow A: Quick roster lookup
1. Open app
2. Enter seed
3. View roster card
4. Save to favorites or jump to Player Aid

### Flow B: Game prep
1. Open app
2. Load roster from favorites/history
3. Review Player Aid
4. Start new local or linked game

### Flow C: Local play session
1. Open Play
2. Create new local game
3. Pick player/opponent rosters
4. Track game state until complete
5. Save to game library

### Flow D: Linked play session
1. Open Play
2. Create linked game or join by code
3. Wait for both players to be ready
4. Track synchronized game state
5. Resolve end-game consensus
6. Save completed result

## Responsive Layout Guidance

### Phone
- single-column layouts
- bottom sheets for secondary controls
- focus on fast thumb-driven actions during play

### Tablet
- multi-pane layouts
- persistent navigation rail
- side-by-side roster and aid/play panels where practical

## Initial MVP Navigation Recommendation

For the first implementation milestone, keep navigation simpler:
- Roster
- Play
- Settings

Player Aid can be launched from Roster first, and Library can start as a section inside Play or Roster until the app grows into a fuller shell.
