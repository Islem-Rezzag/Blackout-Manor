import { WorkspaceCard } from "@/components/WorkspaceCard";
import { env } from "@/env";

const workspaceCards = [
  {
    title: "Monorepo foundation",
    description:
      "pnpm and Turborepo wire the apps, libraries, and shared tooling together.",
    bullets: [
      "Strict TypeScript",
      "Biome lint and format",
      "Vitest and Playwright",
    ],
  },
  {
    title: "Web shell",
    description:
      "Next.js provides the entrypoint for the future player, spectator, and replay surfaces.",
    bullets: ["App Router", "React 19", "Validated public env"],
  },
  {
    title: "Realtime server",
    description:
      "Colyseus and Express host room definitions, health checks, and future match orchestration.",
    bullets: ["Lobby room stub", "Match room stub", "Validated server env"],
  },
  {
    title: "Fairness dashboard",
    description:
      "Seed-swap tournaments export season balance metrics to JSON and render them in the web UI.",
    bullets: ["/fairness route", "Role-normalized win rates", "CI thresholds"],
  },
  {
    title: "Playable client",
    description:
      "A Phaser canvas client renders the manor in mock mode or against a live Colyseus room while the server stays authoritative.",
    bullets: ["/play route", "Canvas-rendered manor", "Mock or live room"],
  },
] as const;

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Blackout Manor</span>
        <h1>{env.NEXT_PUBLIC_APP_NAME}</h1>
        <p>
          No game logic yet. This workspace is the operational baseline for the
          manor, the server, and the packages that will hold HEART, replay,
          content, and data layers.
        </p>
        <p>
          Fairness telemetry is available at <a href="/fairness">/fairness</a>.
        </p>
        <p>
          Canvas gameplay is available at <a href="/play">/play</a>.
        </p>
      </section>
      <section className="workspace-grid" aria-label="Workspace overview">
        {workspaceCards.map((card) => (
          <WorkspaceCard
            key={card.title}
            title={card.title}
            description={card.description}
            bullets={[...card.bullets]}
          />
        ))}
      </section>
    </main>
  );
}
