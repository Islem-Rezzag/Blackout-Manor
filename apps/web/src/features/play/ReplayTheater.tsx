"use client";

import type { ChangeEventHandler } from "react";

import type { ReplayUiModel } from "./uiModel";

type ReplayTheaterProps = {
  status: "idle" | "loading" | "ready" | "error";
  model: ReplayUiModel | null;
  replayUrl: string | null;
  highlightsUrl: string | null;
  onFrameChange: ChangeEventHandler<HTMLInputElement>;
};

const SignalGraph = ({
  points,
  accentClassName,
}: {
  points: ReplayUiModel["trustSeries"];
  accentClassName: string;
}) => {
  if (points.length === 0) {
    return <div className="graph-empty">No signal yet.</div>;
  }

  const polyline = points
    .map((point, index) => {
      const x =
        points.length === 1
          ? 0
          : (index / Math.max(1, points.length - 1)) * 100;
      const y = 90 - point.value * 80;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={`signal-graph ${accentClassName}`} viewBox="0 0 100 100">
      <title>{accentClassName} signal graph</title>
      <polyline points={polyline} />
    </svg>
  );
};

export function ReplayTheater({
  status,
  model,
  replayUrl,
  highlightsUrl,
  onFrameChange,
}: ReplayTheaterProps) {
  if (status === "loading") {
    return (
      <section className="replay-shell">
        <div className="support-panel replay-loading">
          <span className="eyebrow">Replay Theater</span>
          <h2>Loading the official replay dossier</h2>
          <p>
            Pulling the deterministic event log, relationship curves, and
            highlight markers for post-match analysis.
          </p>
        </div>
      </section>
    );
  }

  if (status === "error" || !model) {
    return (
      <section className="replay-shell">
        <div className="support-panel replay-loading">
          <span className="eyebrow">Replay Theater</span>
          <h2>Replay unavailable</h2>
          <p>
            The saved replay dossier could not be loaded. Use live or spectator
            mode until a replay file is available.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="replay-shell" data-testid="replay-theater">
      <header className="replay-header">
        <div>
          <span className="eyebrow">Replay Theater</span>
          <h2>{model.summary.title}</h2>
          <p>{model.summary.subtitle}</p>
        </div>
        <div className="replay-badges">
          <span className="play-badge">{model.summary.winnerLabel}</span>
          <span className="play-badge">
            Tick {model.currentFrame.tick} / {model.currentFrame.phaseLabel}
          </span>
        </div>
      </header>

      <div className="replay-stage-layout">
        <section className="support-panel replay-stage-panel">
          <div className="scrubber-header">
            <div>
              <span className="eyebrow">Timeline</span>
              <h3>Scrub the night</h3>
            </div>
            <strong>
              Frame {model.frameIndex + 1} / {model.totalFrames}
            </strong>
          </div>
          <input
            className="timeline-scrubber"
            data-testid="timeline-scrubber"
            type="range"
            min={0}
            max={Math.max(0, model.totalFrames - 1)}
            value={model.frameIndex}
            onChange={onFrameChange}
          />
          <div className="replay-room-grid">
            {model.stageRooms.map((room) => (
              <article
                key={room.roomId}
                className={`replay-room-card${room.flagged ? " flagged" : ""}`}
              >
                <span>{room.label}</span>
                <strong>{room.occupants.length} present</strong>
                <small>
                  {room.lightLevel} / {room.doorState}
                </small>
                <p>{room.occupants.join(", ") || "Empty"}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="play-rail replay-rail">
          <section className="support-panel">
            <span className="eyebrow">Highlights</span>
            <h3>Betrayal markers</h3>
            <div className="highlight-list">
              {model.highlightMarkers.map((marker) => (
                <article key={marker.id} className="highlight-card">
                  <strong>{marker.title}</strong>
                  <span>
                    Tick {marker.tick} / {marker.kind}
                  </span>
                  <p>{marker.description}</p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="replay-analytics-grid">
        <section className="support-panel">
          <span className="eyebrow">Trust Graph</span>
          <h3>Average relational trust</h3>
          <SignalGraph points={model.trustSeries} accentClassName="trust" />
        </section>

        <section className="support-panel">
          <span className="eyebrow">Suspicion Graph</span>
          <h3>Average suspect pressure</h3>
          <SignalGraph
            points={model.suspicionSeries}
            accentClassName="suspicion"
          />
        </section>

        <section className="support-panel">
          <span className="eyebrow">Evidence Cards</span>
          <h3>Selected frame dossier</h3>
          <div className="evidence-stack">
            {model.evidenceCards.map((card) => (
              <article key={card.id} className="evidence-card compact">
                <span>{card.tag}</span>
                <strong>{card.title}</strong>
                <p>{card.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <span className="eyebrow">Promise Ledger</span>
          <h3>Trust given, trust broken</h3>
          <div className="ledger-list">
            {model.promiseLedger.map((entry) => (
              <article key={entry.id} className="ledger-entry">
                <strong>
                  {entry.actorName} -&gt; {entry.targetName}
                </strong>
                <span>
                  {entry.kind} / tick {entry.tick} / {entry.status}
                </span>
                <p>{entry.resolution}</p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="support-panel export-panel">
        <div>
          <span className="eyebrow">Export</span>
          <h3>Post-match package</h3>
          <p>
            Download the full replay JSON or the extracted highlight package for
            clip cutting, review, and season notes.
          </p>
        </div>
        <div className="export-actions">
          {replayUrl ? (
            <a
              className="export-button"
              href={replayUrl}
              download="blackout-manor-replay.json"
            >
              Download replay JSON
            </a>
          ) : null}
          {highlightsUrl ? (
            <a
              className="export-button subtle"
              href={highlightsUrl}
              download="blackout-manor-highlights.json"
            >
              Download highlights
            </a>
          ) : null}
        </div>
      </section>
    </section>
  );
}
