# Codebase Cleanup Prompt Sequence

Updated: 2026-04-23

This is the run order for cleaning up the StarcraftTMG codebase while using rate limits efficiently.

## Ground rules for every prompt

Paste this block at the top of every run:

```text
Repo: StarcraftTMG

Cleanup goals:
- break large files into smaller, coherent modules that are easier for humans and AI tools to ingest
- remove dead code, duplicate logic, circular dependencies, and unnecessary steps
- preserve behavior unless a stale path is explicitly being removed

Repo-specific constraints:
- keep seed as the primary interchange contract
- do not reintroduce a central enriched/parsing-derived roster contract
- prefer replacement over backwards-compatibility layers unless a live migration truly requires both paths
- do `/data` lookups at point of use rather than inflating the seed format
- when reviewing JSON output behavior, ensure the JSON UI/API stays bound to the standardized seed shape, not a derived roster object

Cleanup priorities:
- `web/public/app.js`
- `web/server.js`
- `web/public/index.html`
- `scripts/build-pages.mjs`
- `lib/cloudSync.js`
- `lib/firestoreClient.js`

Important risk areas:
- linked play state and sync logic
- hidden globals in `web/public/app.js`
- circular movement between shared logic and browser DOM code
- accidental reintroduction of deprecated roster abstractions

Output style:
- be specific to this repo
- give exact files
- prefer deletion/simplification over preservation
- distinguish safe conclusions from uncertain ones
```

## Run order

1. `gpt-5.4-mini`: cheap structural audit
2. `gpt-5.4-mini`: extraction slicing and sequencing
3. `gpt-5.4`: architecture arbitration for risky boundaries
4. `gpt-5.4-mini` or `gpt-5-codex`: implementation passes
5. `gpt-5.4-mini`: dead-code sweep after each major extraction
6. `gpt-5.4`: final review of the cleanup branch

## Stage 1: Cheap structural audit

### Model

`gpt-5.4-mini` with `low` or `medium` reasoning

### Prompt

```text
[Paste the shared ground-rules block first]

Task:
Audit the current cleanup hotspots only:
- `web/public/app.js`
- `web/public/modules/*.js`
- `web/server.js`
- `scripts/build-pages.mjs`
- `lib/cloudSync.js`
- `lib/firestoreClient.js`

I want a structural audit, not code changes.

Produce:
1. findings ordered by severity
2. dead-code candidates
3. duplicate logic candidates
4. circular-dependency risks
5. hidden-global / mutable-state risks
6. a responsibility map for `web/public/app.js`
7. a responsibility map for `web/server.js`

Constraints:
- stay specific to the listed files
- do not give generic refactor advice
- do not propose broad architecture changes yet
- call out anything that looks dangerous to move early

Format:
- Severity findings
- Responsibility map
- Delete-now candidates
- Verify-first candidates
- High-risk zones
```

### Expected outcome

- a trustworthy map of what is actually wrong
- a first pass at what can be deleted vs what needs verification

## Stage 2: Extraction slicing and sequence plan

### Model

`gpt-5.4-mini` with `medium` reasoning

### Prompt

```text
[Paste the shared ground-rules block first]

Using the audit findings, design the smallest safe extraction plan for the cleanup.

Target outcome:
- shrink `web/public/app.js` dramatically
- split `web/server.js` into explicit concerns
- avoid circular dependency growth
- preserve the seed-first contract

Required output:
1. a destination module/file for each major responsibility currently inside `web/public/app.js`
2. a destination module/file for each major responsibility currently inside `web/server.js`
3. the exact extraction order, from lowest risk to highest risk
4. what should be extracted as pure logic before any DOM-heavy moves
5. what should explicitly be deferred until later

Rules:
- prefer coherent modules over lots of tiny wrappers
- do not solve mobile rebuild here except where current mobile assumptions contaminate shared cleanup
- call out which slices are testable with `npm test`
- call out which slices require browser verification

Format:
- Browser target structure
- Server target structure
- Extraction order
- Pure-logic-first slices
- Browser-repro-required slices
- Do-not-touch-yet slices
```

### Expected outcome

- an ordered task list you can hand to an implementation model

## Stage 3: High-risk architecture arbitration

### Model

`gpt-5.4` with `medium` or `high` reasoning

### Prompt

```text
[Paste the shared ground-rules block first]

I already have a cheap audit and a proposed extraction sequence. I want you to evaluate only the high-risk architecture decisions.

Focus:
- boundaries between shared logic and browser DOM code
- linked play ownership, sync orchestration, and state mutation boundaries
- whether cloud/auth logic should live in shared services or browser feature modules
- how to shrink `web/public/app.js` without reintroducing hidden coupling elsewhere
- how to split `web/server.js` without scattering route-specific business logic into too many files

Decide:
1. the smallest safe target architecture
2. which modules must stay pure
3. which boundaries are most likely to create circular imports
4. which parts should remain temporarily centralized during the refactor
5. what should be explicitly forbidden during implementation

Constraints:
- do not produce a grand redesign
- optimize for safe cleanup in the existing repo
- preserve seed-first data flow
- prefer replacement over compatibility layers

Format:
- Recommended architecture decisions
- Rejected alternatives
- Non-negotiable boundaries
- Temporary compromises allowed during refactor
- Failure modes to watch for
```

### Expected outcome

- decisions for the ambiguous areas before code starts moving

## Stage 4A: Bounded implementation slices

### Model

`gpt-5.4-mini` with `medium` reasoning

Use this when the slice is narrow and well understood.

### Prompt

```text
[Paste the shared ground-rules block first]

Implement one cleanup slice only.

Scope for this pass:
- [insert one exact slice, for example: "extract seed import helpers and uploaded-seed cache logic out of `web/public/app.js`"]

Files allowed:
- [list exact files]

Required workflow:
1. identify the exact functions/state in scope
2. extract them into the new module(s)
3. update call sites
4. delete obsolete code in the touched files
5. run relevant tests
6. summarize residual risk

Rules:
- preserve behavior
- do not widen scope unless absolutely necessary
- do not add placeholder wrappers
- do not add compatibility logic for deprecated shapes unless required
- if browser-only verification is needed, say so explicitly

Output:
- files changed
- what moved
- what was deleted
- tests run
- remaining risk
```

## Stage 4B: Long-running agentic implementation

### Model

`gpt-5-codex`

Use this when the slice spans many files or requires sustained agentic editing.

### Prompt

```text
[Paste the shared ground-rules block first]

Own this cleanup task end-to-end.

Task:
- [insert one larger subsystem, for example: "extract linked-play orchestration out of `web/public/app.js` into focused modules while preserving behavior"]

Success criteria:
- the subsystem is moved into coherent files
- obsolete code is deleted
- imports remain sane
- circular dependency risk is reduced, not increased
- relevant tests are run
- browser-verification needs are called out clearly

Working rules:
- stay within these files unless necessary:
  - [list files]
- preserve current behavior
- do not reintroduce enriched roster abstractions
- keep pure logic separate from DOM effects
- prefer finishing one subsystem cleanly over partially touching many subsystems

Final report:
- files changed
- architecture result
- deleted code
- tests run
- unresolved risks
```

## Stage 5: Post-extraction dead-code sweep

### Model

`gpt-5.4-mini` with `low` reasoning

### Prompt

```text
[Paste the shared ground-rules block first]

Review the repo after this cleanup slice and find code that should now be deleted.

Focus:
- unused helpers
- duplicate logic
- stale compatibility branches
- unreachable UI paths
- unused imports/exports
- wrapper modules that no longer justify their existence

Deliver:
1. safe-delete candidates
2. verify-before-delete candidates
3. exact file references
4. a short reason for each candidate

Bias:
- simplify aggressively
- do not keep code "just in case"
```

## Stage 6: Final cleanup review

### Model

`gpt-5.4` with `high` reasoning

### Prompt

```text
[Paste the shared ground-rules block first]

Review this cleanup branch as a high-risk refactor review.

Focus:
- behavioral regressions
- hidden coupling that still remains
- circular dependency risks
- places where cleanup accidentally spread responsibilities instead of reducing them
- contract regressions around seed JSON behavior
- test gaps

Required output:
1. findings ordered by severity
2. exact files involved
3. what still blocks calling this cleanup good
4. residual verification required in browser

Review standard:
- prioritize bugs, regressions, and structural risks
- keep summaries brief
- if there are no findings, say so explicitly and list remaining verification gaps
```

## Recommended model assignment by task type

### Use `gpt-5.4-mini` for

- initial audits
- extraction sequencing
- bounded refactor slices
- dead-code sweeps
- cheap follow-up reviews

### Use `gpt-5.4` for

- architecture arbitration
- linked-play and state-boundary decisions
- final branch review
- any cleanup step where correctness matters more than cost

### Use `gpt-5-codex` for

- longer multi-file implementation runs
- agentic coding passes where you want one model to own the whole slice

### Avoid using expensive models for

- broad grep triage
- simple delete-candidate scans
- small mechanical renames

## Practical run example

1. Run Stage 1 with `gpt-5.4-mini`.
2. Run Stage 2 with `gpt-5.4-mini`.
3. Run Stage 3 with `gpt-5.4`.
4. For each extraction slice:
   - run Stage 4A with `gpt-5.4-mini` if narrow
   - or Stage 4B with `gpt-5-codex` if broad
   - then run Stage 5 with `gpt-5.4-mini`
5. When the branch is structurally complete, run Stage 6 with `gpt-5.4`.

## Suggested first implementation slices

Run these in this order unless the audit changes the priority:

1. seed/import helpers from `web/public/app.js`
2. current-seed selectors and state helpers
3. linked-play orchestration boundaries
4. cloud-auth and uploaded-seed persistence
5. `web/server.js` route split
6. final dead-code deletion pass
