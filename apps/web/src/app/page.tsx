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
    title: "Thin web shell",
    description:
      "Next.js boots the runtime and keeps developer-facing routes separate from the primary live match path.",
    bullets: ["App Router", "/game primary route", "/play compatibility only"],
  },
  {
    title: "Realtime server",
    description:
      "Colyseus and Express host room definitions, health checks, and future match orchestration.",
    bullets: ["Lobby room stub", "Match room stub", "Validated server env"],
  },
  {
    title: "Developer surfaces",
    description:
      "Replay theater, fairness analytics, and the control-room shell stay available for contributors without shaping live mode.",
    bullets: ["/dev hub", "/dev/fairness", "Replay and benchmark tools"],
  },
  {
    title: "Playable client",
    description:
      "A Phaser canvas client renders the manor in demo or live rooms while the server stays authoritative and the shell stays minimal.",
    bullets: ["/game/[roomId]", "Canvas-rendered manor", "Mock or live room"],
  },
] as const;

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero">
        <span className="eyebrow">Blackout Manor</span>
        <h1>{env.NEXT_PUBLIC_APP_NAME}</h1>
        <p>
          Enter the manor through the full-screen live runtime, keep the server
          authoritative, and reserve replay, fairness, and debugging surfaces
          for explicit contributor workflows.
        </p>
        <div className="hero-actions">
          <a className="hero-link hero-link-primary" href="/game/demo">
            Enter demo room
          </a>
          <a className="hero-link" href="/dev">
            Open developer routes
          </a>
        </div>
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
