const devLinks = [
  {
    href: "/game/demo",
    title: "Enter demo room",
    description:
      "Launch the primary live product surface with minimal shell chrome.",
  },
  {
    href: "/dev/play",
    title: "Control room",
    description:
      "Open the legacy shell with player, spectator, and replay tooling for development.",
  },
  {
    href: "/dev/play?view=replay",
    title: "Replay theater",
    description:
      "Load the post-match dossier, scrub the night, and inspect promise ledgers.",
  },
  {
    href: "/dev/fairness",
    title: "Fairness dashboard",
    description:
      "Open the analytics surface for seed runs, balance checks, and contributor review.",
  },
] as const;

export default function DevPage() {
  return (
    <main className="page-shell dev-shell">
      <section className="hero">
        <span className="eyebrow">Developer Surfaces</span>
        <h1>Blackout Manor toolroom</h1>
        <p>
          The main player path now lives under <a href="/game/demo">/game</a>.
          This area keeps the control-room shell, replay entry points, and
          analytics surfaces available without shaping the default live match
          experience.
        </p>
      </section>
      <section className="dev-link-grid" aria-label="Developer routes">
        {devLinks.map((link) => (
          <a key={link.href} className="dev-link-card" href={link.href}>
            <span className="eyebrow">Route</span>
            <h2>{link.title}</h2>
            <p>{link.description}</p>
            <strong>{link.href}</strong>
          </a>
        ))}
      </section>
    </main>
  );
}
