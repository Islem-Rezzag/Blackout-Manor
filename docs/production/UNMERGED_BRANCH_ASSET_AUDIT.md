# Unmerged Branch Asset Audit

## Scope

This audit was prepared for Asset Pipeline V2 from updated `origin/main`. It treats old production-art and planning branches as reference material only.

Do not merge old stacked branches blindly. Do not cherry-pick them wholesale. Do not start new work from them. Any useful idea must be reimplemented against current `main` with current tests, source metadata, and product boundaries intact.

## Branch: `origin/feat/production-art-vertical-slice`

Status: unmerged relative to `origin/main`.

Commits on the branch:

```text
2c228b9 docs: add engineering audit baseline
ae5d6e0 feat: add secondary dressing and surveillance-set polish
bf7d895 feat: extend production-art manor treatment across full house
84f614d feat: add production-art vertical slice for manor showcase
```

Files touched:

```text
A docs/production/ENGINEERING_AUDIT_V2.md
M packages/client-game/src/bootstrap/assetManifest.ts
M packages/client-game/src/bootstrap/inlineEnvironmentArt.ts
M packages/client-game/src/index.test.ts
M packages/client-game/src/scenes/MeetingScene.ts
M packages/client-game/src/stage/ManorWorldStage.ts
M packages/client-game/src/stage/importedArt.ts
M packages/client-game/src/ui/SurveillanceConsole.ts
```

Reference value:

- Reuse the idea that room, corridor, threshold, and prop swaps need stable asset keys and tests.
- Reuse the idea that surveillance presentation should remain in the same runtime language as the manor.
- Do not reuse the broad renderer edits in this branch for Asset Pipeline V2.
- Do not reuse its premium-looking inline art as final runtime art in this branch.

Later branch decision:

- Ignore for this milestone except as reference.
- Consider deleting later after any still-useful production-art ideas are converted into clean main-based prompts.

## Branch: `origin/feat/production-art-gap-audit`

Status: unmerged relative to `origin/main`.

Commits on the branch:

```text
145e472 docs: integrate planning pack and execution guides
```

Files touched:

```text
A .agents/skills/asset-license-guard/SKILL.md
A .agents/skills/asset-license-guard/agents/openai.yaml
A .agents/skills/benchmark-safety-guard/SKILL.md
A .agents/skills/benchmark-safety-guard/agents/openai.yaml
A .agents/skills/manor-plan-orchestrator/SKILL.md
A .agents/skills/manor-plan-orchestrator/agents/openai.yaml
A .agents/skills/production-art-guard/SKILL.md
A .agents/skills/production-art-guard/agents/openai.yaml
A .agents/skills/spectator-runtime-guard/SKILL.md
A .agents/skills/spectator-runtime-guard/agents/openai.yaml
M AGENTS.md
A PLANS.md
M README.md
A START_HERE.md
A WORKFLOW.md
A docs/ACTIVE_DOCS.md
M docs/architecture/README.md
A docs/project/PROJECT_CHARTER.md
M docs/release/merge-readiness.md
A plans/BM-0001-blackout-manor-program.md
A plans/ROADMAP.md
A plans/templates/execplan-template.md
```

Reference value:

- Reuse the narrow asset-license and production-art guardrail ideas.
- Do not add the old plugin/agent YAML bundle in Asset Pipeline V2.
- Do not add unrelated planning, benchmark, spectator-runtime, roadmap, or orchestrator skills in this branch.

Codex skill decision:

- Added only `.agents/skills/asset-license-guard/SKILL.md`.
- Added only `.agents/skills/production-art-guard/SKILL.md`.
- Rewrote both skills to point at Asset Pipeline V2 and current source-ledger expectations.
- Did not add `.agents/skills/*/agents/openai.yaml`.
- Did not bundle a Codex plugin.

Later branch decision:

- Keep as migrated reference only.
- Consider deleting after confirming the two scoped skills and any still-needed planning docs have been recreated cleanly on `main`.

## Branch: `origin/feat/agent-visibility-projector`

Status: unmerged by commit graph relative to `origin/main`, but Prompt 2 functionality is already present on current `main` as `packages/agents/src/runtime/AgentObservationProjector.ts`.

Commits on the branch:

```text
d57a8ae fix: preserve fair projected observations
e6b6bdb feat: project per-agent visible observations
2c228b9 docs: add engineering audit baseline
ae5d6e0 feat: add secondary dressing and surveillance-set polish
bf7d895 feat: extend production-art manor treatment across full house
84f614d feat: add production-art vertical slice for manor showcase
```

Files touched:

```text
A docs/production/ENGINEERING_AUDIT_V2.md
M packages/agents/src/heart/policy/index.ts
M packages/agents/src/index.ts
A packages/agents/src/runtime/AgentObservationProjector.test.ts
A packages/agents/src/runtime/AgentObservationProjector.ts
M packages/agents/src/runtime/observation.ts
M packages/agents/src/runtime/socialStateStore.ts
M packages/client-game/src/bootstrap/assetManifest.ts
M packages/client-game/src/bootstrap/inlineEnvironmentArt.ts
M packages/client-game/src/index.test.ts
M packages/client-game/src/scenes/MeetingScene.ts
M packages/client-game/src/stage/ManorWorldStage.ts
M packages/client-game/src/stage/importedArt.ts
M packages/client-game/src/ui/SurveillanceConsole.ts
```

Reference value:

- Do not reuse this branch for Asset Pipeline V2. It is stacked with old production-art work and agent runtime work.
- Do not start from it; current `main` already contains the required Prompt 2 file.
- Do not merge it for art-pipeline work because it can reintroduce stale renderer changes.

Later branch decision:

- Confirm Prompt 2 parity separately if needed, then delete or archive the stale branch.

## Engineering Audit V2 Note

`docs/production/ENGINEERING_AUDIT_V2.md` does not exist on updated `main` at the time of this audit. It exists on the old stacked production-art branch and on the stale agent-visibility branch because that branch includes the production-art stack.

If this document is still needed later, recreate or merge it through a dedicated docs branch after review. Do not pull it in as part of an old stacked branch merge.

## Asset Pipeline Ideas Reused

- Stable asset keys by runtime surface.
- Manifest/source separation.
- Tests that assert renderer-facing keys resolve.
- Fallback discipline for current placeholders and future production swaps.
- Source/license guardrails before any asset import.

## Asset Pipeline Ideas Not Reused

- Broad `ManorWorldStage.ts` and `MeetingScene.ts` renderer changes.
- Premium inline runtime art from old branches.
- Branch-specific production-art room/corridor selectors.
- Stacked agent-runtime changes from the old visibility branch.
- Planning docs and skills unrelated to asset safety.

## Final Warning

The old branches are useful for context, not as integration bases. Asset Pipeline V2 must stay main-based, additive, test-backed, and free of final art imports.
