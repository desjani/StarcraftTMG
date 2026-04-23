# Codebase Cleanup Roadmap

Updated: 2026-04-23

## Why this plan exists

This repo has clearly accumulated iteration residue. The biggest current signals are:

- `web/public/app.js` is about 7,566 lines and still mixes import flow, Firestore/cloud persistence, play-mode state, linked-session sync, and DOM rendering.
- `web/server.js` is about 650 lines and mixes API routes, static hosting concerns, analytics persistence, and reporting behavior.
- `web/public/modules/` exists, but the main browser entrypoint still owns too much orchestration.
- `/mobile` is currently generated from the main desktop shell and then patched with mobile-only CSS and DOM surgery, which makes cleanup and reuse harder.

The goal is not "split files for the sake of splitting files." The goal is:

1. Make the codebase easier for humans and AI tools to ingest.
2. Remove dead code and duplicated logic.
3. Reduce circular dependencies and hidden state coupling.
4. Establish clean seams so future features do not collapse back into `app.js`.

## Current hotspots

### Tier 1

- `web/public/app.js`
- `web/server.js`
- `web/public/index.html`
- `scripts/build-pages.mjs`

### Tier 2

- `lib/cloudSync.js`
- `lib/firestoreClient.js`
- `web/public/mobile/mobile.css`
- `web/public/mobile/mobile-aid-bar.js`

### Existing reusable foundations worth preserving

- `lib/seedCleaner.js`
- `lib/gameData.js`
- `web/public/modules/linked-logic.js`
- `web/public/modules/play-state.js`
- `web/public/modules/player-aid.js`
- `web/public/modules/render-helpers.js`
- `web/public/modules/roster-card.js`

## Principles

- Prefer replacement over compatibility layers unless a live migration actually requires both paths.
- Keep seed as the primary interchange contract; do not re-inflate a derived roster contract as the new center of gravity.
- Separate pure logic from DOM effects, network effects, and persistence.
- Every extracted module should have one clear reason to exist.
- Do not create tiny files that only forward calls; extract coherent slices.
- Delete dead code aggressively once the replacement path is verified.

## Target architecture

### Browser app

Split `web/public/app.js` into a thin boot file plus focused feature modules:

- `web/public/bootstrap/app-shell.js`
  Initializes DOM refs, event wiring, boot order, and top-level state container.
- `web/public/features/seed-import/`
  JSON upload flow, NewRecruit detection, generated-seed handling, in-memory imported seed cache.
- `web/public/features/roster-load/`
  Seed lookup, seed history, favorites, output refresh triggers.
- `web/public/features/cloud-auth/`
  Auth state, sign-in/sign-out, cloud ownership checks.
- `web/public/features/cloud-seeds/`
  Save/delete/update uploaded seeds in cloud.
- `web/public/features/play-mode/`
  Play-mode initialization, play-mode rendering, event dispatch.
- `web/public/features/linked-play/`
  Match creation/join, sync scheduling, payload apply orchestration, ownership gating.
- `web/public/features/json-preview/`
  JSON tab rendering and copy/export actions.
- `web/public/state/`
  Centralized mutable state and pure selectors.
- `web/public/dom/`
  DOM-query helpers, event delegation helpers, modal helpers, toast helpers.

### Server

Split `web/server.js` into:

- `web/server/index.js`
  Express boot only.
- `web/server/routes/`
  `format.js`, `roster.js`, `json.js`, `card.js`, `analytics.js`, `static.js`
- `web/server/analytics/`
  persistence, buckets, authorization, daily report scheduling
- `web/server/services/`
  roster loading/formatting adapters

## Work phases

## Phase 1: Audit and map

Deliverables:

- dependency map for browser and server
- dead-code candidate list
- circular-dependency list
- module-boundary proposal
- "do not touch yet" list for risky areas

Concrete actions:

- Trace every top-level import from `web/public/app.js`.
- Identify globals and mutable singletons.
- Identify DOM-heavy functions vs pure data transforms.
- Identify functions that can move without changing behavior.
- Search for orphaned code paths, duplicate helpers, commented-out legacy blocks, and unreachable UI branches.
- Check for browser imports that cross awkward boundaries, especially mixed `/lib` and `web/public` reuse.

Acceptance criteria:

- no refactor yet, just a trustworthy map
- every major `app.js` region assigned to a future destination module

## Phase 2: Extract pure logic first

Extract lowest-risk logic out of `app.js` before moving UI code:

- seed-id helpers
- import-format detection
- uploaded-seed cache helpers
- current-seed selectors
- linked payload normalization adapters
- serialization / dedupe helpers for sync

Acceptance criteria:

- extracted modules have no direct DOM access
- behavior stays unchanged
- tests added where feasible

## Phase 3: Extract feature controllers

Move orchestration into feature folders:

- seed import controller
- roster loading controller
- cloud seed controller
- play mode controller
- linked play controller

Acceptance criteria:

- `app.js` becomes a boot/orchestration file, not the implementation surface
- each controller exposes explicit public methods
- cross-feature communication happens through state + events, not hidden globals

## Phase 4: Server split

Break `web/server.js` into route and analytics modules.

Acceptance criteria:

- route handlers are small
- analytics logic no longer lives inline with route declarations
- static/mobile hosting rules are isolated and easy to reason about

## Phase 5: Delete and tighten

- delete dead code discovered during extraction
- delete shadow helpers duplicated across browser/server
- reduce ambiguous names
- add import-boundary notes in module headers where useful

Acceptance criteria:

- no new compatibility shims unless justified
- no unused exports in touched files
- no stale mobile-preview assumptions left in shared logic

## Suggested execution order

1. Audit `web/public/app.js` into named regions.
2. Extract pure seed/import utilities.
3. Extract linked-play orchestration.
4. Extract cloud-auth and cloud-seed persistence.
5. Shrink `app.js` to boot + wiring.
6. Split `web/server.js`.
7. Delete dead code and run final grep-based cleanup.

## Risks to watch

- Hidden reliance on top-level mutable variables in `app.js`
- Circular movement between play-state and linked-play logic
- Browser/server shared modules accidentally pulling in browser-only behavior
- Cleanup that reintroduces old enriched-roster contracts instead of seed+lookup
- Existing user edits in `web/public/*.js` that should not be overwritten blindly

## Definition of done

- `web/public/app.js` is under 1,500 lines
- no single browser feature file exceeds about 600-800 lines without a clear reason
- no generated `/mobile` hacks remain inside general desktop feature logic
- server boot, routes, and analytics are separate modules
- tests still pass, and manual browser smoke tests cover lookup, JSON view, play mode, linked play, and import

## Prompts

### Prompt 1: Audit prompt

```text
You are auditing the StarcraftTMG repo for structural cleanup, not adding features.

Context:
- `web/public/app.js` is the main browser hotspot and is too large.
- `web/server.js` mixes route handling, analytics, and hosting concerns.
- The goal is to split the codebase into smaller, AI-ingestable modules while removing dead code, duplicate logic, circular dependencies, and unnecessary steps.
- Preserve the current seed-first contract. Do not reintroduce a richer roster contract as a central API.
- Prefer replacement over backwards-compatibility layers unless a migration truly requires both paths.

Tasks:
1. Build a concrete dependency and responsibility map for `web/public/app.js` and `web/server.js`.
2. List dead-code candidates, duplicate logic, hidden globals, and circular-dependency risks.
3. Propose a destination file/module for each major responsibility.
4. Identify the lowest-risk extraction order.
5. Output:
   - audit findings ordered by severity
   - proposed target folder/file structure
   - phased extraction plan
   - explicit "leave alone for now" risks

Constraints:
- Be specific to this repo.
- Do not hand-wave with generic refactor advice.
- Prefer fewer, coherent modules over a huge number of tiny wrappers.
```

### Prompt 2: Extraction prompt

```text
Refactor the StarcraftTMG browser app incrementally.

Primary goal:
- Shrink `web/public/app.js` by moving coherent logic into smaller modules with explicit responsibilities.

Rules:
- Preserve behavior.
- Extract pure logic before DOM-heavy code.
- Keep seed as the primary interchange contract.
- Do not add compatibility baggage for deprecated shapes unless necessary.
- Delete dead code once the replacement path is verified.
- Avoid creating placeholder wrapper files that only re-export one function without adding structure.
- Keep imports sane and reduce circular dependency risk.

Required workflow:
1. Identify one extraction slice.
2. Move it into a focused module.
3. Update the call sites.
4. Run relevant tests.
5. Summarize behavior risk.
6. Continue to the next slice until the target milestone is met.

Target milestone for this pass:
- move one full concern out of `web/public/app.js`
- reduce global coupling
- leave the repo in a working state
```

### Prompt 3: Cleanup-and-delete prompt

```text
Review the StarcraftTMG repo after refactor work and aggressively identify code that should now be deleted.

Focus:
- unused helpers
- duplicate logic
- stale compatibility branches
- unreachable UI paths
- commented-out legacy blocks
- imports/exports no longer used

Requirements:
- show the exact file and reason for each deletion candidate
- distinguish between safe-delete and verify-before-delete
- prefer simplification over preservation
- do not propose keeping code "just in case" unless there is a real runtime dependency
```
