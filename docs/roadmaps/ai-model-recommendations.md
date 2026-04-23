# AI Model Recommendations For This Repo

Verified against official OpenAI docs on 2026-04-23.

Primary sources:

- https://developers.openai.com/api/docs/models
- https://developers.openai.com/api/docs/models/gpt-5.4
- https://developers.openai.com/api/docs/models/gpt-5.4-mini
- https://developers.openai.com/api/docs/models/gpt-5-codex

## Short version

Use:

- `gpt-5.4-mini` for most repo scanning, summarization, grep triage, test-failure diagnosis, and bounded refactor passes.
- `gpt-5.4` for architecture work, high-risk refactors, cross-file cleanup plans, and tricky bug investigations.
- `gpt-5-codex` for agentic coding sessions that will actually edit code across many files over longer horizons.
- `gpt-5.4-nano` only for very cheap mechanical tasks such as classification, renaming suggestions, or simple structured extraction.

## Why these recommendations

As of 2026-04-23, OpenAI’s model guide says:

- if you are not sure where to start, use `gpt-5.4`
- use `gpt-5.4-mini` or `gpt-5.4-nano` when optimizing for latency and cost
- `gpt-5.4-mini` is the strongest mini model for coding, computer use, and subagents
- `gpt-5-codex` is optimized for agentic coding tasks in Codex-like environments

## Model matrix

| Task | Recommended model | Reasoning effort | Why |
| --- | --- | --- | --- |
| Repo audit, grep triage, dead-code candidate scan | `gpt-5.4-mini` | `low` or `medium` | Cheap enough for broad passes, still strong at coding-context comprehension |
| File-by-file extraction plan | `gpt-5.4-mini` | `medium` | Good default for planning bounded refactors |
| High-level architecture decisions | `gpt-5.4` | `medium` or `high` | Better when the decision spans contracts, module boundaries, and migration sequencing |
| Large risky refactor touching play mode + linked sync | `gpt-5.4` | `high` | Higher reliability for coupled stateful logic |
| Long-running coding agent session | `gpt-5-codex` | default / medium | Purpose-fit for agentic coding workflows |
| Small mechanical cleanup batches | `gpt-5.4-mini` | `low` | Best balance for repetitive cleanup |
| Cheap classification / tagging / manifest generation | `gpt-5.4-nano` | `none` or `low` | Lowest-cost option when correctness demands are modest |
| Final review of a big cleanup PR | `gpt-5.4` | `high` | Better at spotting regressions and weak assumptions |

## Suggested workflow by phase

### 1. Audit phase

- Start with `gpt-5.4-mini`
- Ask for dependency map, dead-code candidates, and extraction slices
- Escalate only the ambiguous/high-risk slices to `gpt-5.4`

### 2. Incremental refactor phase

- Use `gpt-5.4-mini` for most individual extraction passes
- Use `gpt-5-codex` if you want an agent to own a longer multi-file coding task end-to-end
- Reserve `gpt-5.4` for the most coupled areas, especially linked play or state synchronization

### 3. Review phase

- Use `gpt-5.4` for final risk review
- If rate limits are tight, use `gpt-5.4-mini` first and only escalate findings that look uncertain

## Rate-limit efficiency strategy

- Do broad discovery with `gpt-5.4-mini`, not `gpt-5.4`
- Keep prompts scoped to one subsystem at a time
- Attach exact file lists instead of the whole repo whenever possible
- Ask for structured outputs: risks, target files, plan, verification
- Use `gpt-5.4` only for synthesis and hard decisions
- Use `gpt-5-codex` only when there is actual code execution/editing value in an agentic workflow

## Prompt templates for efficient usage

### Cheap audit prompt

```text
Audit only these files for dead code, circular dependencies, duplicate logic, and extraction seams:
- web/public/app.js
- web/public/modules/*.js
- web/server.js

Output:
1. findings by severity
2. exact refactor slices
3. delete-now vs verify-first candidates

Do not propose broad architecture changes outside these files.
```

### Escalation prompt

```text
I already ran a low-cost audit. Now evaluate only the high-risk decisions:
- shared seed contract boundaries
- linked play state ownership
- module boundaries between shared logic and browser DOM code

I want the smallest safe architecture that reduces coupling without adding compatibility baggage.
```

### Agentic coding prompt

```text
Own this coding task end-to-end:
- extract one coherent subsystem into smaller files
- preserve behavior
- run relevant tests
- report residual risk

Stay within these files unless necessary:
- [list files]
```

## Practical recommendation for this repo

For the two roadmap efforts in this repo:

- Cleanup planning: start with `gpt-5.4-mini`, escalate final architecture choices to `gpt-5.4`.
- Cleanup implementation: use `gpt-5.4-mini` for bounded slices, `gpt-5-codex` for longer autonomous coding sessions.
- Mobile rebuild planning: use `gpt-5.4` for the initial IA/architecture pass because the current mobile path is structurally flawed.
- Mobile rebuild implementation: use `gpt-5.4-mini` for individual screen builds, escalate integrated play-mode/linked-flow work to `gpt-5.4` or `gpt-5-codex`.

## Notes

- Model recommendations are the most drift-prone part of this document. Re-check the official model guide before a major implementation sprint or if pricing/availability matters.
- If your primary constraint is cost, bias harder toward `gpt-5.4-mini`.
- If your primary constraint is correctness in a coupled subsystem, pay for `gpt-5.4`.
