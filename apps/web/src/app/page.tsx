import { env } from "@/env";

const launchMoments = [
  "Ten masked guests enter the manor under stormlight.",
  "Two hidden Shadows move through the same rooms as everyone else.",
  "Reports, meetings, votes, and betrayals unfold inside the live runtime.",
] as const;

const devLinks = [
  { href: "/dev/play", label: "Replay and control room" },
  { href: "/dev/fairness", label: "Fairness and benchmark tools" },
] as const;

export default function HomePage() {
  return (
    <main className="launcher-shell">
      <section className="launcher-stage" aria-labelledby="launcher-title">
        <div className="launcher-atmosphere" aria-hidden="true">
          <span className="launcher-rain launcher-rain-left" />
          <span className="launcher-rain launcher-rain-right" />
          <span className="launcher-lightning" />
        </div>

        <div className="launcher-copy">
          <span className="eyebrow">Blackout Manor</span>
          <p className="launcher-kicker">A storm-trapped social thriller</p>
          <h1 id="launcher-title">{env.NEXT_PUBLIC_APP_NAME}</h1>
          <p className="launcher-description">
            Enter the manor through the full-screen runtime, watch the cast move
            room to room, and let the live camera follow reports, meetings, and
            shifting suspicion without falling back into toolroom framing.
          </p>

          <div className="launcher-actions">
            <a
              className="launcher-link launcher-link-primary"
              href="/game"
              data-testid="launcher-enter-game"
            >
              Enter game
            </a>
            <a
              className="launcher-link"
              href={`/game/${env.NEXT_PUBLIC_MATCH_ROOM_ID ?? "demo"}`}
            >
              Watch demo room
            </a>
          </div>

          <p className="launcher-footnote">
            Contributor and debug routes remain available separately under{" "}
            <a href="/dev">/dev</a>.
          </p>
        </div>

        <aside className="launcher-brief" aria-label="Match overview">
          <div className="launcher-brief-card">
            <span className="eyebrow">Tonight’s setup</span>
            <strong>10 agents. 1 manor. 2 hidden killers.</strong>
            <p>
              The live route is now game-first: enter the runtime directly or
              watch the default room bootstrap under <code>/game</code>.
            </p>
          </div>
          <div className="launcher-brief-timeline">
            {launchMoments.map((moment, index) => (
              <div key={moment} className="launcher-moment">
                <span>{`0${index + 1}`}</span>
                <p>{moment}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="launcher-support" aria-label="Secondary access">
        <div className="launcher-support-copy">
          <span className="eyebrow">Secondary access</span>
          <h2>
            Developer and contributor surfaces stay out of the player path
          </h2>
          <p>
            Replay, fairness, and shell-heavy inspection routes still exist, but
            they no longer define the public entry. Use them only when you
            explicitly need tooling.
          </p>
        </div>
        <div className="launcher-support-links">
          {devLinks.map((link) => (
            <a
              key={link.href}
              className="launcher-support-link"
              href={link.href}
            >
              <span className="eyebrow">Route</span>
              <strong>{link.label}</strong>
              <small>{link.href}</small>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
