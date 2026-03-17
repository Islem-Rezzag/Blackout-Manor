# Presentation Direction

Blackout Manor should play like a real game, not like a dashboard wrapped around a simulation.

The main thing a player sees and feels in live mode should come from `packages/client-game`. That package is the product surface for the manor, the camera, the avatars, the HUD, meetings, transitions, atmosphere, and all other moment-to-moment match presentation. The job of `apps/web` is smaller: load the game, provide route entry points, and host secondary tools when a player or contributor asks for them.

That distinction matters because the project now has several successful support surfaces: replay theater, fairness analytics, contributor tooling, debug views, and admin APIs. Those tools are valuable, but they should not shape the default live match UX. A person entering `/game/[roomId]` should feel like they launched a full-screen game. They should not feel like they opened a control room with a canvas embedded inside it.

Nothing in this direction changes the simulation contract. The deterministic engine still owns game state. The server still validates all intents. The current roles, round flow, replay guarantees, persistence model, and fairness assumptions all stay in place. This is a presentation and ownership correction, not a gameplay rewrite.

The practical rule is simple:

- Put live match feel, player readability, and full-screen immersion in `packages/client-game`.
- Keep `apps/web` a thin shell that boots the runtime and stays deliberate.
- Move deep analytics, contributor affordances, debug controls, and admin workflows away from the default live player path unless they are explicitly requested.
- Treat `/game/[roomId]` as the primary live route, `/game` as a bootstrap or redirect entry, and `/play` as legacy or dev-only compatibility language.

When future work is ambiguous, prefer the option that makes the live match feel more like a premium browser game and less like an internal operations surface.
