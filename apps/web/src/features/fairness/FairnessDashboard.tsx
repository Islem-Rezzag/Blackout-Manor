import type { TournamentFairnessReport } from "@blackout-manor/replay-viewer";

type FairnessDashboardProps = {
  report: TournamentFairnessReport;
  source: "latest" | "sample";
};

const asPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const asSignedScore = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(3)}`;

export function FairnessDashboard({ report, source }: FairnessDashboardProps) {
  return (
    <main className="fairness-shell">
      <section className="fairness-hero">
        <div>
          <span className="eyebrow">Fairness And EQ Suite</span>
          <h1>Season 01 balance and replay telemetry</h1>
          <p>
            {report.simulationCount} seeded simulations, persona rotation
            scheduling, threshold checks, and replay-backed EQ analytics
            exported as JSON for repeatable balance review.
          </p>
        </div>
        <div
          className={`status-pill ${report.passed ? "pass" : "fail"}`}
          aria-live="polite"
        >
          <strong>{report.passed ? "Pass" : "Fail"}</strong>
          <span>{source === "latest" ? "Latest export" : "Sample export"}</span>
        </div>
      </section>

      <section className="fairness-grid">
        <article className="metric-card">
          <h2>Overall Win Rates</h2>
          <div className="metric-list">
            {report.overallWinRates.map((entry) => (
              <div key={entry.teamId} className="metric-row">
                <span>{entry.teamId}</span>
                <strong>{asPercent(entry.winRate)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="metric-card">
          <h2>Special Role Swing</h2>
          <div className="metric-list">
            <div className="metric-row">
              <span>Investigator</span>
              <strong>{asPercent(report.specialRoleSwing.investigator)}</strong>
            </div>
            <div className="metric-row">
              <span>Steward</span>
              <strong>{asPercent(report.specialRoleSwing.steward)}</strong>
            </div>
          </div>
        </article>

        <article className="metric-card metric-card-wide">
          <h2>Threshold Checks</h2>
          <div className="threshold-table">
            {report.thresholds.map((threshold) => (
              <div key={threshold.id} className="threshold-row">
                <div>
                  <strong>{threshold.label}</strong>
                  <p>
                    Actual: {asPercent(threshold.actual)}
                    {typeof threshold.min === "number"
                      ? ` | min ${asPercent(threshold.min)}`
                      : ""}
                    {typeof threshold.max === "number"
                      ? ` | max ${asPercent(threshold.max)}`
                      : ""}
                  </p>
                </div>
                <span
                  className={`threshold-badge ${threshold.pass ? "pass" : "fail"}`}
                >
                  {threshold.pass ? "Pass" : "Fail"}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="metric-card metric-card-wide">
          <h2>Social Metrics</h2>
          <div className="metric-grid">
            <div className="metric-block">
              <span>Evidence-grounded accusation rate</span>
              <strong>
                {asPercent(report.metrics.evidenceGroundedAccusationRate.rate)}
              </strong>
            </div>
            <div className="metric-block">
              <span>Witness stabilization rate</span>
              <strong>
                {asPercent(report.metrics.witnessStabilizationRate.rate)}
              </strong>
            </div>
            <div className="metric-block">
              <span>Promise break composite cost</span>
              <strong>
                {report.metrics.promiseBreakCost.compositeCost.toFixed(3)}
              </strong>
            </div>
            <div className="metric-block">
              <span>False-accusation repair score</span>
              <strong>
                {report.metrics.falseAccusationRepairScore.repairScore.toFixed(
                  3,
                )}
              </strong>
            </div>
            <div className="metric-block">
              <span>Suspicion calibration Brier</span>
              <strong>
                {report.metrics.suspicionCalibration.brierScore.toFixed(3)}
              </strong>
            </div>
            <div className="metric-block">
              <span>ToM prediction Brier</span>
              <strong>
                {report.metrics.tomPredictionBrier.brierScore.toFixed(3)}
              </strong>
            </div>
          </div>
        </article>

        <article className="metric-card metric-card-wide">
          <h2>Replay-backed EQ Metrics</h2>
          <p className="analysis-lock">
            These EQ metrics are derived from replay events, replay frames, and
            public speech only. They do not use private summaries or hidden
            model reasoning.
          </p>
          <div className="metric-grid">
            <div className="metric-block">
              <span>Contradiction handling</span>
              <strong>
                {asPercent(report.eqMetrics.contradictionHandling.handlingRate)}
              </strong>
              <small>
                {report.eqMetrics.contradictionHandling.handledCount}/
                {report.eqMetrics.contradictionHandling.contradictionCount}{" "}
                contradictions acted on
              </small>
            </div>
            <div className="metric-block">
              <span>False accusation recovery</span>
              <strong>
                {asPercent(
                  report.eqMetrics.falseAccusationRecovery.recoveryRate,
                )}
              </strong>
              <small>
                {report.eqMetrics.falseAccusationRecovery.recoveredCount}/
                {report.eqMetrics.falseAccusationRecovery.falseAccusationCount}{" "}
                false accusations repaired
              </small>
            </div>
            <div className="metric-block">
              <span>Witness stabilization</span>
              <strong>
                {asPercent(
                  report.eqMetrics.witnessStabilization.stabilizationRate,
                )}
              </strong>
              <small>
                {report.eqMetrics.witnessStabilization.stabilizedCount}/
                {report.eqMetrics.witnessStabilization.calmingAttemptCount}{" "}
                calming attempts stabilized a witness
              </small>
            </div>
            <div className="metric-block">
              <span>Promise keeping</span>
              <strong>
                {asPercent(report.eqMetrics.promiseIntegrity.keptRate)}
              </strong>
              <small>
                {report.eqMetrics.promiseIntegrity.keptCount} kept /
                {report.eqMetrics.promiseIntegrity.brokenCount} broken
              </small>
            </div>
            <div className="metric-block">
              <span>Alliance shift volatility</span>
              <strong>
                {asPercent(report.eqMetrics.allianceShift.volatilityRate)}
              </strong>
              <small>
                {report.eqMetrics.allianceShift.shiftCount}/
                {report.eqMetrics.allianceShift.allianceEpisodeCount} public
                alliance episodes turned hostile
              </small>
            </div>
            <div className="metric-block">
              <span>Evidence-grounded accusation quality</span>
              <strong>
                {asPercent(
                  report.eqMetrics.evidenceGroundedAccusationQuality
                    .groundedPrecision,
                )}
              </strong>
              <small>
                {
                  report.eqMetrics.evidenceGroundedAccusationQuality
                    .groundedShadowHitCount
                }
                /
                {
                  report.eqMetrics.evidenceGroundedAccusationQuality
                    .groundedCount
                }{" "}
                grounded accusations landed on Shadows
              </small>
            </div>
            <div className="metric-block">
              <span>Meeting influence quality</span>
              <strong>
                {asSignedScore(
                  report.eqMetrics.meetingInfluenceQuality.influenceScore,
                )}
              </strong>
              <small>
                {report.eqMetrics.meetingInfluenceQuality.correctInfluenceCount}{" "}
                correct /
                {
                  report.eqMetrics.meetingInfluenceQuality
                    .misleadingInfluenceCount
                }{" "}
                misleading influence turns
              </small>
            </div>
          </div>
        </article>

        <article className="metric-card metric-card-wide">
          <h2>Role-normalized Win Rates</h2>
          <div className="metric-list">
            {report.roleNormalizedWinRates.map((entry) => (
              <div key={entry.roleId} className="metric-row">
                <span>
                  {entry.roleId} ({entry.appearances} appearances)
                </span>
                <strong>{asPercent(entry.winRate)}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="metric-card metric-card-wide">
          <h2>Persona Coverage</h2>
          <div className="persona-table">
            {report.personaCoverage.slice(0, 8).map((entry) => (
              <div key={entry.personaId} className="persona-row">
                <div>
                  <strong>{entry.displayName}</strong>
                  <p>
                    Shadow {entry.shadowAppearances} | Household{" "}
                    {entry.householdAppearances}
                  </p>
                </div>
                <span>{entry.appearances} total</span>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
