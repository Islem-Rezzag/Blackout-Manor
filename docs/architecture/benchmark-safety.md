# Benchmark Safety

This document locks the benchmark-safety boundary after the embodied spectator overhaul. It exists to make the live-route, replay-route, and dev-analytics split auditable.

## Route Ownership
- `/game` bootstraps into `/game/[roomId]`.
- `/game/[roomId]` is the live spectator runtime and mounts `GameRuntimeHost` with `surface="live"`.
- `/dev/play?view=replay` is the replay-oriented dev route and mounts `GameRuntimeHost` with `surface="dev-replay"`.
- `/dev/play` keeps the legacy control-room shell for contributor workflows only.
- `/dev/fairness` is the fairness and replay-backed EQ surface.
- `/fairness` redirects to `/dev/fairness`.
- `/play` remains compatibility-only and does not replace `/game`.

## Live-Route Guarantees
- `/game` does not mount `BlackoutGameShell`.
- `/game` does not mount `FairnessDashboard`.
- `/game` does not expose replay-backed EQ metrics, fairness thresholds, suspicion graphs, or contributor analytics panels.
- `/game` remains game-first and runtime-owned, with the observation HUD and in-world presentation as the default spectator surface.
- Live mode stays free of hidden-role analytics, fairness charts, and private reasoning traces.

## Replay And Dev Guarantees
- Replay uses the same client-game runtime pipeline, but only through the dev replay surface.
- Fairness and EQ reporting stay in `/dev/fairness` and the exported JSON reports, not in `/game`.
- The dev shell may show richer post-match or replay-oriented interpretation, but those surfaces must not define the live route.

## Privacy And Authority Guarantees
- Engine authority remains in `packages/engine` and the authoritative server flow.
- Presentation upgrades do not mutate match state.
- Replay-backed EQ metrics derive from replay events, replay frames, and public/post-match data only.
- Private chain-of-thought, hidden reasoning traces, and pre-public secret-intent signals remain out of UI, replay export, and fairness reporting.

## Current Hardening Checks
- `tests/e2e/play.spec.ts`
  - verifies `/game/demo` renders the runtime without replay or fairness surfaces
  - verifies `/game/demo?view=replay&source=open` stays on the live runtime instead of crossing into dev replay mode
  - verifies `/dev/play?view=replay` still loads the replay runtime
  - verifies `/fairness` remains behind `/dev/fairness`
- `apps/web/src/features/game/runtimeSurface.test.ts`
  - verifies the live surface refuses replay-mode connection building
  - verifies replay-mode connection building is limited to the dev replay surface

## Review Rule
Any future change that adds analytics, fairness data, replay-only interpretation, or hidden-role information to `/game` fails this safety boundary unless the product spec explicitly changes.
