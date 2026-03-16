# Contributing

## Ground Rules
- The deterministic engine is the only authority on game state.
- Agents may propose actions but never mutate state directly.
- Official public mode uses one model pack for every agent.
- Do not expose private chain-of-thought in UI, telemetry, or logs.
- Every new feature needs tests and replay fixtures.
- Keep code and assets clearly separated.
- Prefer additive, modular changes over cross-cutting rewrites.

## Setup
```bash
corepack prepare pnpm@10.32.1 --activate
pnpm install
pnpm dev
```

Copy `.env.example` to `.env` before starting the apps.

## Before Opening a PR
Run the full local quality bar.

```bash
pnpm ci:quality
pnpm test:e2e
pnpm fairness:check
```

If your change affects simulations, meetings, roles, or scoring, include or update replay fixtures in the relevant package.

## Coding Guidelines
- Keep the engine deterministic and side-effect free.
- Validate all network and model payloads at the edge.
- Preserve browser-first performance and readability.
- Use data-driven content instead of hard-coding season content into engine logic.
- Document production-facing behavior in `docs/` when adding new surfaces.

## Testing Expectations
- Unit tests for all new rules, contracts, and serializers.
- Replay fixtures for behavior that must remain stable across seeds.
- Playwright smoke coverage for new release-critical user flows.
- Fairness suite updates when balance logic or thresholds change.

## Branches and Commits
- Create branches with the `codex/` prefix when using Codex-generated changes.
- Keep commits focused and explain behavior, not just file movement.

## Questions
Stop and ask only when blocked by a true product decision. Otherwise make the narrowest reasonable assumption, implement it, and document the assumption in the PR.
