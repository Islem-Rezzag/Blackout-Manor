# Engineering Audit V2

Date: 2026-05-05
Workspace: `C:\Users\moham\Downloads\Blackout Manor`
Purpose: verified engineering baseline before major UI or agent refactor.

## Source Material Reviewed

- `AGENTS.md`
- `README.md`
- `docs/architecture/system-overview.md`
- `docs/design/SPECTATOR_MODE_BIBLE.md`
- `package.json`

## Environment

- OS shell: PowerShell
- Node: `v22.16.0`
- Corepack: `0.32.0`
- pnpm required by repo: `pnpm@10.32.1`
- pnpm used for audit: `10.32.1`
- Package manager activation command: `corepack prepare pnpm@10.32.1 --activate`

Initial shell state did not have a `pnpm` command on PATH. The repo-pinned pnpm was activated through Corepack and then invoked as `corepack pnpm ...`. No package manager downgrade was performed.

## Install Result

Command:

```powershell
corepack pnpm install
```

Result: passed, exit code `0`.

Notable output:

```text
Scope: all 10 workspace projects
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 817ms using pnpm v10.32.1
```

The lockfile was already current. No dependency update was required.

## Quality Gate Results

### `pnpm ci:quality`

Command:

```powershell
corepack pnpm ci:quality
```

Result: passed, exit code `0`.

Expanded command:

```text
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Observed package scope:

```text
@blackout-manor/agents
@blackout-manor/client-game
@blackout-manor/content
@blackout-manor/db
@blackout-manor/engine
@blackout-manor/replay-viewer
@blackout-manor/server
@blackout-manor/shared
@blackout-manor/web
```

Sub-results:

- `biome check .`: passed; `Checked 239 files in 606ms. No fixes applied.`
- `turbo run lint`: passed; `9 successful, 9 total`.
- `turbo run typecheck`: passed; `9 successful, 9 total`.
- `turbo run test`: passed; `18 successful, 18 total`.
- `turbo run build`: passed; `9 successful, 9 total`.
- `@blackout-manor/web` production build passed under `Next.js 16.1.6 (Turbopack)`.

Non-failing warnings:

- `@blackout-manor/db:test` and `@blackout-manor/server:test` emitted Node's experimental SQLite warning:
  `ExperimentalWarning: SQLite is an experimental feature and might change at any time`.

Failing packages: none.
Failing tests: none.

### `pnpm test:e2e`

Command:

```powershell
corepack pnpm test:e2e
```

Result: passed, exit code `0`.

Observed output:

```text
Running 7 tests using 2 workers
7 passed (15.1s)
```

Passing tests:

- `tests\e2e\home.spec.ts`: `renders the public launcher`
- `tests\e2e\play.spec.ts`: `presents the public root as a game-first launcher`
- `tests\e2e\play.spec.ts`: `renders the live manor canvas`
- `tests\e2e\play.spec.ts`: `keeps /game on the live runtime even if dev replay query params are present`
- `tests\e2e\play.spec.ts`: `keeps the legacy play route as a compatibility redirect`
- `tests\e2e\play.spec.ts`: `loads replay through the runtime from the dev shell`
- `tests\e2e\play.spec.ts`: `keeps fairness behind the dev route`

Failing packages: none.
Failing tests: none.

### `pnpm fairness:check`

Command:

```powershell
corepack pnpm fairness:check
```

Result: passed, exit code `0`.

Expanded command:

```text
pnpm build:runtime
tsx scripts/fairness-report.ts --count 100 --assert-thresholds
```

Runtime build result:

```text
Packages in scope: @blackout-manor/agents, @blackout-manor/client-game, @blackout-manor/content, @blackout-manor/db, @blackout-manor/engine, @blackout-manor/replay-viewer, @blackout-manor/shared
Tasks: 7 successful, 7 total
```

Fairness output:

```text
base-seeds: 1001, 1038, 1075, 1112, 1149, 1186, 1223, 1260, 1297, 1334
simulation-count: 100
passed: true
eq.contradiction-handling: 0.000
eq.witness-stabilization: 0.000
eq.meeting-influence: -1.000
report: C:\Users\moham\Downloads\Blackout Manor\artifacts\fairness\latest\fairness-report.json
dashboard: C:\Users\moham\Downloads\Blackout Manor\apps\web\public\data\fairness-report.latest.json
```

Failing packages: none.
Failing tests: none.

Note: `fairness:check` regenerated the tracked dashboard JSON timestamp. Because the only tracked diff was `generatedAt`, it was restored so this audit does not introduce an unrelated generated-data churn change.

## Suspected Causes And Risks

No active quality, e2e, or fairness failures were reproduced in this environment.

Residual setup risks:

- A fresh shell may not expose `pnpm` directly until Corepack activates the repo-pinned version.
- Node's built-in SQLite API is still experimental in this Node 22.16.0 runtime, which explains the non-failing DB/server test warnings.
- `fairness:check` writes both an artifact report and the public dashboard JSON. Future audit runs may create timestamp-only tracked diffs unless the workflow separates verification from dashboard refresh.
- The fairness gate passes even with `eq.meeting-influence: -1.000`; do not treat that value as a failure without first reviewing the metric semantics and thresholds.

## Low-Risk Fixes Applied

No code fixes were applied.

Repository changes made by this audit:

- Added `docs/production/ENGINEERING_AUDIT_V2.md`.

Existing modified docs in the working tree were not edited:

- `docs/architecture/migration-plan.md`
- `docs/local-quickstart.md`
- `docs/release/alpha-review.md`

## Recommended PR Split

1. Baseline audit PR: add this audit document only.
2. Toolchain/onboarding PR: document Corepack activation explicitly wherever setup assumes `pnpm` is already on PATH.
3. Verification hygiene PR: decide whether `fairness:check` should avoid rewriting tracked dashboard output, or whether dashboard refreshes should be a separate intentional command.
4. SQLite warning PR, only if needed: evaluate Node SQLite stability expectations and whether DB/server tests should suppress, pin around, or accept the current warning.
5. Major UI or agent refactors: start only after the baseline PR is merged and should remain separate from tooling and generated-output hygiene.

## What Should Not Be Touched Yet

- Do not change deterministic engine authority, rules, timers, visibility, outcomes, or replay event semantics.
- Do not change official public model-pack fairness assumptions, per-agent budgets, prompts, cooldowns, or action schemas.
- Do not expose private reasoning traces in UI, logs, analytics, or replay exports.
- Do not reshape `packages/client-game` live presentation as part of this audit.
- Do not move live gameplay responsibility into `apps/web` host chrome or secondary dashboard surfaces.
- Do not treat `/play` as the primary route; `/game/[roomId]` remains the live route.
- Do not adjust fairness thresholds or EQ metric semantics as part of a UI or agent refactor.
- Do not churn generated fairness dashboard data unless that is the explicit purpose of the PR.

