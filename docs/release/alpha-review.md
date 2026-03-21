# Alpha Review Guide

Blackout Manor is currently a spectator-first alpha on the `feat/world-first-runtime` branch.

## What To Review First
- `/`: launcher / attract-mode entry
- `/game`: bootstrap route
- `/game/demo`: easiest direct route into the runtime
- `/dev/play?view=replay`: replay route
- `/dev/fairness`: fairness and replay-backed EQ route

## Recommended Review Sequence
1. Run `pnpm dev`
2. Open `/`
3. Enter the demo room through `/game/demo`
4. Try surveillance controls in the live runtime
5. Run `pnpm sim --seed 42 --mode fast`
6. Run `pnpm replay:open artifacts/replays/fast-42.replay.json`
7. Open `/dev/play?view=replay&source=open`
8. Run `pnpm fairness:report`
9. Open `/dev/fairness`

## What Is Already Strong
- game-first routing
- world-first runtime
- surveillance observation mode
- upgraded manor rendering
- improved character readability and HUD
- replay-backed EQ analytics in dev tooling

## What Is Still Alpha
- some art remains placeholder or procedural
- this is not the final public release
- reviewer docs are still being tightened

## Important Boundaries
- live routes are `/game` and `/game/[roomId]`
- replay and fairness live behind `/dev`
- EQ analytics use replay/public data only
- no private chain-of-thought is exposed
