"use client";

import type { ClientGameState } from "@blackout-manor/client-game";
import type { CSSProperties, RefObject } from "react";

import type { LiveUiModel } from "./uiModel";

type LiveGamePanelsProps = {
  model: LiveUiModel;
  state: ClientGameState | null;
  hostRef: RefObject<HTMLDivElement | null>;
};

export function LiveGamePanels({ model, state, hostRef }: LiveGamePanelsProps) {
  return (
    <section className="play-board">
      <div className="play-stage-column">
        <div className="game-frame play-stage">
          <div ref={hostRef} className="game-canvas-host" />
          <div className="stage-topline">
            <div className="stage-chip stage-chip-wide">
              <span className="stage-chip-label">Phase</span>
              <strong>{model.phaseLabel}</strong>
              <span>{model.timerLabel}</span>
            </div>
            <div className="stage-chip">
              <span className="stage-chip-label">View</span>
              <strong>{model.surfaceMode}</strong>
            </div>
            <div className="stage-chip">
              <span className="stage-chip-label">FPS</span>
              <strong>{state?.fpsEstimate ?? 0}</strong>
            </div>
          </div>

          <div className="stage-objective">
            <span className="eyebrow">Night Objective</span>
            <h2>{model.objective}</h2>
            <p>{model.objectiveDetail}</p>
          </div>

          <div className="stage-room-strip">
            {model.roomCards.slice(0, 5).map((room) => (
              <article
                key={room.roomId}
                className={`room-strip-card${room.isCurrent ? " current" : ""}${room.isFlagged ? " flagged" : ""}`}
              >
                <span>{room.label}</span>
                <strong>{room.occupantCount} in room</strong>
                <small>
                  {room.lightLevel} / {room.doorState}
                </small>
              </article>
            ))}
          </div>

          {model.showLobby ? (
            <section className="overlay-panel lobby-screen">
              <div className="lobby-copy">
                <span className="eyebrow">Cast Parlor</span>
                <h2>The storm seals the doors.</h2>
                <p>
                  Ten masks wait for the first movement. The engine is live, the
                  manor is authoritative, and every public story starts counting
                  now.
                </p>
              </div>
              <div className="lobby-grid">
                {model.castCards.slice(0, 6).map((player) => (
                  <article key={player.id} className="portrait-card">
                    <div
                      className="portrait-orb"
                      style={
                        {
                          "--portrait-a": player.colorA,
                          "--portrait-b": player.colorB,
                        } as CSSProperties
                      }
                    />
                    <strong>{player.displayName}</strong>
                    <span>{player.roomLabel}</span>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {model.roleReveal ? (
            <section className="overlay-panel role-reveal-screen">
              <span className="eyebrow">Private Reveal</span>
              <h2>{model.roleReveal.title}</h2>
              <p>{model.roleReveal.subtitle}</p>
              {model.roleReveal.knownAllyLabels.length > 0 ? (
                <div className="ally-line">
                  <span>Known allies</span>
                  <strong>{model.roleReveal.knownAllyLabels.join(", ")}</strong>
                </div>
              ) : null}
            </section>
          ) : null}

          {model.meeting ? (
            <section className="overlay-panel meeting-screen">
              <header className="meeting-header">
                <div>
                  <span className="eyebrow">Meeting Floor</span>
                  <h2>{model.meeting.headline}</h2>
                </div>
                <div className="meeting-timer">{model.meeting.timerLabel}</div>
              </header>
              <div className="meeting-portraits">
                {model.meeting.portraits.slice(0, 8).map((player) => (
                  <article key={player.id} className="meeting-portrait">
                    <div
                      className="portrait-orb"
                      style={
                        {
                          "--portrait-a": player.colorA,
                          "--portrait-b": player.colorB,
                        } as CSSProperties
                      }
                    />
                    <strong>{player.displayName}</strong>
                    <span>{Math.round(player.suspicion * 100)} suspicion</span>
                    {player.contradictionCount > 0 ? (
                      <em>{player.contradictionCount} contradiction marker</em>
                    ) : null}
                  </article>
                ))}
              </div>
              <div className="meeting-evidence-grid">
                {model.meeting.evidenceCards.slice(0, 4).map((card) => (
                  <article key={card.id} className="evidence-card">
                    <span>{card.tag}</span>
                    <strong>{card.title}</strong>
                    <p>{card.detail}</p>
                  </article>
                ))}
              </div>
              {model.meeting.contradictionMarkers.length > 0 ? (
                <div className="contradiction-strip">
                  {model.meeting.contradictionMarkers.map((marker) => (
                    <article
                      key={marker.playerId}
                      className="contradiction-marker"
                    >
                      <strong>{marker.displayName}</strong>
                      <span>{marker.reason}</span>
                    </article>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        {model.postMatch ? (
          <section className="support-panel postmatch-panel">
            <header>
              <span className="eyebrow">Post Match</span>
              <h2>{model.postMatch.headline}</h2>
            </header>
            <div className="stat-grid">
              {model.postMatch.stats.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <aside className="play-rail">
        <section className="support-panel">
          <span className="eyebrow">Transcript</span>
          <h2>Live floor</h2>
          <div className="transcript-list">
            {model.transcript.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>

        <section className="support-panel">
          <span className="eyebrow">Evidence</span>
          <h2>Current stack</h2>
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
          <span className="eyebrow">Confessional</span>
          <h2>Round read</h2>
          {model.confessional ? (
            <>
              <blockquote>{model.confessional.quote}</blockquote>
              <p>{model.confessional.detail}</p>
            </>
          ) : (
            <p>The manor has not produced a defining beat yet.</p>
          )}
        </section>

        <section className="support-panel">
          <span className="eyebrow">Cast</span>
          <h2>Pressure board</h2>
          <div className="cast-rail">
            {model.castCards.map((player) => (
              <article key={player.id} className="cast-rail-card">
                <div
                  className="portrait-orb small"
                  style={
                    {
                      "--portrait-a": player.colorA,
                      "--portrait-b": player.colorB,
                    } as CSSProperties
                  }
                />
                <div>
                  <strong>{player.displayName}</strong>
                  <span>{player.roomLabel}</span>
                </div>
                <div className="cast-rail-metrics">
                  <em>{Math.round(player.suspicion * 100)}</em>
                  <small>suspicion</small>
                </div>
              </article>
            ))}
          </div>
          {!model.analyticsUnlocked ? (
            <p className="analysis-lock">
              Hidden-role analytics stay sealed in live player mode. Spectator
              replay opens the deeper dossier after the match.
            </p>
          ) : null}
        </section>

        {model.alerts.length > 0 ? (
          <section className="support-panel danger-panel">
            <span className="eyebrow">Alerts</span>
            <h2>Manor state</h2>
            <div className="alert-stack">
              {model.alerts.map((alert) => (
                <p key={alert}>{alert}</p>
              ))}
            </div>
          </section>
        ) : null}
      </aside>
    </section>
  );
}
