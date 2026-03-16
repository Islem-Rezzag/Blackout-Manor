import type { PlayerBeliefEstimate } from "@blackout-manor/agents";
import type { EngineReplayLog } from "@blackout-manor/engine";
import type { PlayerId, RoleId } from "@blackout-manor/shared";

import type {
  FairnessMetrics,
  FairnessRunSummary,
  FairnessThreshold,
  FairnessThresholdCheck,
  FalseAccusationRepairMetrics,
  InstrumentedSimulationRun,
  PersonaRoleCoverage,
  PromiseBreakCostMetrics,
  RoleNormalizedWinRate,
  SuspicionCalibrationMetrics,
  TeamWinRate,
  TomPredictionMetrics,
  TournamentDecisionTrace,
} from "./types";

const OFFICIAL_FAIRNESS_THRESHOLDS: FairnessThreshold[] = [
  {
    id: "household-win-rate",
    label: "Household win rate",
    min: 0.47,
    max: 0.53,
  },
  {
    id: "shadow-win-rate",
    label: "Shadow win rate",
    min: 0.47,
    max: 0.53,
  },
  {
    id: "investigator-swing",
    label: "Investigator swing",
    max: 0.08,
  },
  {
    id: "steward-swing",
    label: "Steward swing",
    max: 0.06,
  },
] as const;

const accusationActionIds = new Set(["press", "vote-player"]);
const repairActionIds = new Set(["apologize", "reassure"]);
const stabilizationActionIds = new Set(["comfort", "reassure"]);
const promiseBreakActionIds = new Set(["press", "vote-player", "eliminate"]);

const average = (values: readonly number[]) =>
  values.length === 0
    ? 0
    : values.reduce((total, value) => total + value, 0) / values.length;

const extractRoleAssignments = (
  replay: EngineReplayLog,
  assignments: InstrumentedSimulationRun["scheduleEntry"]["assignments"],
) => {
  const rolesAssignedEvent = replay.events.find(
    (event) => event.type === "roles-assigned",
  );

  if (!rolesAssignedEvent || rolesAssignedEvent.type !== "roles-assigned") {
    throw new Error(
      `Replay ${replay.matchId} does not include role assignment.`,
    );
  }

  const personaByPlayerId = new Map(
    assignments.map((assignment) => [assignment.playerId, assignment]),
  );

  return rolesAssignedEvent.assignments.map((assignment) => {
    const persona = personaByPlayerId.get(assignment.playerId);

    if (!persona) {
      throw new Error(`Missing persona assignment for ${assignment.playerId}.`);
    }

    return {
      playerId: assignment.playerId,
      roleId: assignment.role,
      teamId: assignment.team,
      personaId: persona.personaId,
      displayName: persona.displayName,
    };
  });
};

const getRelationshipBefore = (
  traces: readonly TournamentDecisionTrace[],
  perspectiveActorId: PlayerId,
  targetPlayerId: PlayerId,
  sequence: number,
) =>
  traces
    .filter(
      (trace) =>
        trace.actorId === perspectiveActorId && trace.sequence < sequence,
    )
    .sort((left, right) => right.sequence - left.sequence)[0]?.socialContext
    .relationships[targetPlayerId];

const getRelationshipAfter = (
  traces: readonly TournamentDecisionTrace[],
  perspectiveActorId: PlayerId,
  targetPlayerId: PlayerId,
  sequence: number,
) =>
  traces
    .filter(
      (trace) =>
        trace.actorId === perspectiveActorId && trace.sequence > sequence,
    )
    .sort((left, right) => left.sequence - right.sequence)[0]?.socialContext
    .relationships[targetPlayerId];

const hasEvidenceGrounding = (trace: TournamentDecisionTrace) => {
  const targetPlayerId = trace.actionTargetPlayerId;

  if (!targetPlayerId) {
    return false;
  }

  return (
    trace.socialContext.contradictions.some(
      (record) => record.playerId === targetPlayerId,
    ) ||
    trace.socialContext.recentBetrayals.some(
      (record) => record.sourcePlayerId === targetPlayerId,
    ) ||
    trace.observation.topMemories.some(
      (memory) =>
        memory.playersInvolved.includes(targetPlayerId) &&
        memory.evidenceStrength >= 0.4,
    ) ||
    trace.policy.evidenceFocus.some(
      (entry) =>
        entry.includes(targetPlayerId) ||
        entry.includes(trace.actorDisplayName),
    )
  );
};

const isPromiseBreakTrace = (trace: TournamentDecisionTrace) =>
  promiseBreakActionIds.has(trace.proposal.actionId) &&
  !!trace.actionTargetPlayerId &&
  trace.socialContext.openPromises.some(
    (entry) =>
      entry.promiserId === trace.actorId &&
      entry.promiseeId === trace.actionTargetPlayerId,
  );

const containsConcreteClaim = (text: string | undefined) =>
  !!text && /\bi was in the\b|\bi saw\b|\bwith\b|\btimeline\b/i.test(text);

const collectTeamWinRates = (
  runs: readonly InstrumentedSimulationRun[],
): TeamWinRate[] =>
  (["household", "shadow"] as const).map((teamId) => {
    const wins = runs.filter((run) => run.winner?.team === teamId).length;

    return {
      teamId,
      wins,
      matches: runs.length,
      winRate: runs.length === 0 ? 0 : wins / runs.length,
    };
  });

const collectRoleNormalizedWinRates = (
  runs: readonly InstrumentedSimulationRun[],
): RoleNormalizedWinRate[] => {
  const appearances = new Map<RoleId, number>();
  const wins = new Map<RoleId, number>();

  for (const run of runs) {
    const roleAssignments = extractRoleAssignments(
      run.replay,
      run.scheduleEntry.assignments,
    );

    for (const assignment of roleAssignments) {
      appearances.set(
        assignment.roleId,
        (appearances.get(assignment.roleId) ?? 0) + 1,
      );

      if (run.winner?.team === assignment.teamId) {
        wins.set(assignment.roleId, (wins.get(assignment.roleId) ?? 0) + 1);
      }
    }
  }

  return (["shadow", "investigator", "steward", "household"] as const).map(
    (roleId) => {
      const appearanceCount = appearances.get(roleId) ?? 0;
      const winCount = wins.get(roleId) ?? 0;

      return {
        roleId,
        appearances: appearanceCount,
        wins: winCount,
        winRate: appearanceCount === 0 ? 0 : winCount / appearanceCount,
      };
    },
  );
};

const collectPersonaCoverage = (
  runs: readonly InstrumentedSimulationRun[],
): PersonaRoleCoverage[] => {
  const coverageByPersona = new Map<string, PersonaRoleCoverage>();

  for (const run of runs) {
    const roleAssignments = extractRoleAssignments(
      run.replay,
      run.scheduleEntry.assignments,
    );

    for (const assignment of roleAssignments) {
      const existing = coverageByPersona.get(assignment.personaId) ?? {
        personaId: assignment.personaId,
        displayName: assignment.displayName,
        appearances: 0,
        shadowAppearances: 0,
        householdAppearances: 0,
        roleCounts: {
          shadow: 0,
          investigator: 0,
          steward: 0,
          household: 0,
        },
        winsByRole: {
          shadow: 0,
          investigator: 0,
          steward: 0,
          household: 0,
        },
      };

      existing.appearances += 1;
      existing.roleCounts[assignment.roleId] += 1;

      if (assignment.teamId === "shadow") {
        existing.shadowAppearances += 1;
      } else {
        existing.householdAppearances += 1;
      }

      if (run.winner?.team === assignment.teamId) {
        existing.winsByRole[assignment.roleId] += 1;
      }

      coverageByPersona.set(assignment.personaId, existing);
    }
  }

  return [...coverageByPersona.values()].sort((left, right) =>
    left.personaId.localeCompare(right.personaId),
  );
};

const collectSuspicionCalibration = (
  runs: readonly InstrumentedSimulationRun[],
): SuspicionCalibrationMetrics => {
  const samples: Array<{ prediction: number; actual: number }> = [];

  for (const run of runs) {
    const roleAssignments = extractRoleAssignments(
      run.replay,
      run.scheduleEntry.assignments,
    );
    const teamByPlayerId = new Map(
      roleAssignments.map((assignment) => [
        assignment.playerId,
        assignment.teamId,
      ]),
    );

    for (const trace of run.traces) {
      for (const [playerId, relationship] of Object.entries(
        trace.socialContext.relationships,
      ) as Array<
        [PlayerId, (typeof trace.socialContext.relationships)[PlayerId]]
      >) {
        samples.push({
          prediction: relationship.suspectScore,
          actual: teamByPlayerId.get(playerId) === "shadow" ? 1 : 0,
        });
      }
    }
  }

  const shadowSamples = samples.filter((sample) => sample.actual === 1);
  const householdSamples = samples.filter((sample) => sample.actual === 0);

  return {
    sampleCount: samples.length,
    brierScore: average(
      samples.map((sample) => (sample.prediction - sample.actual) ** 2),
    ),
    meanShadowScore: average(shadowSamples.map((sample) => sample.prediction)),
    meanHouseholdScore: average(
      householdSamples.map((sample) => sample.prediction),
    ),
    buckets: Array.from({ length: 5 }, (_, bucketIndex) => {
      const min = bucketIndex * 0.2;
      const max = bucketIndex === 4 ? 1 : min + 0.2;
      const bucketSamples = samples.filter((sample) =>
        bucketIndex === 4
          ? sample.prediction >= min && sample.prediction <= max
          : sample.prediction >= min && sample.prediction < max,
      );

      return {
        bucketLabel: `${min.toFixed(1)}-${max.toFixed(1)}`,
        range: { min, max },
        sampleCount: bucketSamples.length,
        meanPrediction: average(
          bucketSamples.map((sample) => sample.prediction),
        ),
        actualShadowRate: average(bucketSamples.map((sample) => sample.actual)),
        absoluteError: Math.abs(
          average(bucketSamples.map((sample) => sample.prediction)) -
            average(bucketSamples.map((sample) => sample.actual)),
        ),
      };
    }),
  };
};

const collectEvidenceGroundedAccusationRate = (
  runs: readonly InstrumentedSimulationRun[],
) => {
  const accusations = runs.flatMap((run) =>
    run.traces.filter((trace) =>
      accusationActionIds.has(trace.proposal.actionId),
    ),
  );
  const grounded = accusations.filter(hasEvidenceGrounding);

  return {
    numerator: grounded.length,
    denominator: accusations.length,
    rate: accusations.length === 0 ? 0 : grounded.length / accusations.length,
  };
};

const collectPromiseBreakCost = (
  runs: readonly InstrumentedSimulationRun[],
): PromiseBreakCostMetrics => {
  const trustDrops: number[] = [];
  const suspectIncreases: number[] = [];
  let publicPenalties = 0;
  let breakCount = 0;

  for (const run of runs) {
    for (const trace of run.traces.filter(isPromiseBreakTrace)) {
      const targetPlayerId = trace.actionTargetPlayerId;

      if (!targetPlayerId) {
        continue;
      }

      breakCount += 1;
      const before = getRelationshipBefore(
        run.traces,
        targetPlayerId,
        trace.actorId,
        trace.sequence,
      );
      const after = getRelationshipAfter(
        run.traces,
        targetPlayerId,
        trace.actorId,
        trace.sequence,
      );

      if (before && after) {
        trustDrops.push(Math.max(0, before.trust - after.trust));
        suspectIncreases.push(
          Math.max(0, after.suspectScore - before.suspectScore),
        );
      }

      if (
        run.traces.some(
          (candidate) =>
            candidate.sequence > trace.sequence &&
            candidate.actionTargetPlayerId === trace.actorId &&
            candidate.actorId !== trace.actorId &&
            accusationActionIds.has(candidate.proposal.actionId),
        )
      ) {
        publicPenalties += 1;
      }
    }
  }

  const averageTrustDrop = average(trustDrops);
  const averageSuspectIncrease = average(suspectIncreases);
  const publicPenaltyRate = breakCount === 0 ? 0 : publicPenalties / breakCount;

  return {
    breakCount,
    averageTrustDrop,
    averageSuspectIncrease,
    publicPenaltyRate,
    compositeCost:
      breakCount === 0
        ? 0
        : (averageTrustDrop + averageSuspectIncrease + publicPenaltyRate) / 3,
  };
};

const collectWitnessStabilizationRate = (
  runs: readonly InstrumentedSimulationRun[],
) => {
  let numerator = 0;
  let denominator = 0;

  for (const run of runs) {
    for (const trace of run.traces) {
      if (
        !stabilizationActionIds.has(trace.proposal.actionId) ||
        !trace.actionTargetPlayerId
      ) {
        continue;
      }

      const destabilized = trace.socialContext.contradictions.some(
        (record) => record.playerId === trace.actionTargetPlayerId,
      );

      if (!destabilized) {
        continue;
      }

      denominator += 1;

      const nextTargetTrace = run.traces
        .filter(
          (candidate) =>
            candidate.actorId === trace.actionTargetPlayerId &&
            candidate.sequence > trace.sequence,
        )
        .sort((left, right) => left.sequence - right.sequence)[0];

      if (containsConcreteClaim(nextTargetTrace?.proposal.speech?.text)) {
        numerator += 1;
      }
    }
  }

  return {
    numerator,
    denominator,
    rate: denominator === 0 ? 0 : numerator / denominator,
  };
};

const collectFalseAccusationRepairScore = (
  runs: readonly InstrumentedSimulationRun[],
): FalseAccusationRepairMetrics => {
  const trustRepairs: number[] = [];
  const suspectRepairs: number[] = [];
  let repairCount = 0;

  for (const run of runs) {
    const roleAssignments = extractRoleAssignments(
      run.replay,
      run.scheduleEntry.assignments,
    );
    const falseAccusations = run.traces.filter((trace) => {
      const targetPlayerId = trace.actionTargetPlayerId;

      if (
        !targetPlayerId ||
        !accusationActionIds.has(trace.proposal.actionId)
      ) {
        return false;
      }

      return (
        roleAssignments.find(
          (assignment) => assignment.playerId === targetPlayerId,
        )?.teamId === "household"
      );
    });

    for (const accusation of falseAccusations) {
      const targetPlayerId = accusation.actionTargetPlayerId;

      if (!targetPlayerId) {
        continue;
      }

      const repair = run.traces.find(
        (candidate) =>
          candidate.sequence > accusation.sequence &&
          candidate.actorId === accusation.actorId &&
          candidate.actionTargetPlayerId === targetPlayerId &&
          repairActionIds.has(candidate.proposal.actionId),
      );

      if (!repair) {
        continue;
      }

      repairCount += 1;
      const before = getRelationshipBefore(
        run.traces,
        targetPlayerId,
        accusation.actorId,
        repair.sequence,
      );
      const after = getRelationshipAfter(
        run.traces,
        targetPlayerId,
        accusation.actorId,
        repair.sequence,
      );

      if (before && after) {
        trustRepairs.push(Math.max(0, after.trust - before.trust));
        suspectRepairs.push(
          Math.max(0, before.suspectScore - after.suspectScore),
        );
      }
    }
  }

  const averageTrustRepair = average(trustRepairs);
  const averageSuspectRepair = average(suspectRepairs);

  return {
    repairCount,
    averageTrustRepair,
    averageSuspectRepair,
    repairScore:
      repairCount === 0 ? 0 : (averageTrustRepair + averageSuspectRepair) / 2,
  };
};

const probabilityMapForBeliefs = (
  estimate: PlayerBeliefEstimate | undefined,
  playerIds: readonly PlayerId[],
  subjectPlayerId: PlayerId,
) => {
  const relevantTargets = playerIds.filter(
    (playerId) => playerId !== subjectPlayerId,
  );
  const weights = Object.fromEntries(
    relevantTargets.map((playerId) => [playerId, 0.01]),
  ) as Record<PlayerId, number>;

  if (estimate) {
    for (const belief of estimate.likelyBeliefs) {
      weights[belief.playerId] = Math.max(
        weights[belief.playerId] ?? 0.01,
        belief.suspectScore,
      );
    }

    if (estimate.likelyNextAccusationTarget) {
      weights[estimate.likelyNextAccusationTarget] = Math.max(
        weights[estimate.likelyNextAccusationTarget] ?? 0.01,
        0.7,
      );
    }
  }

  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + weight,
    0,
  );

  return Object.fromEntries(
    Object.entries(weights).map(([playerId, weight]) => [
      playerId,
      weight / totalWeight,
    ]),
  ) as Record<PlayerId, number>;
};

const collectTomPredictionBrier = (
  runs: readonly InstrumentedSimulationRun[],
): TomPredictionMetrics => {
  const scores: number[] = [];
  let hits = 0;
  let accusationSamples = 0;

  for (const run of runs) {
    const playerIds = run.scheduleEntry.assignments.map(
      (assignment) => assignment.playerId,
    );
    const roleAssignments = extractRoleAssignments(
      run.replay,
      run.scheduleEntry.assignments,
    );
    const teamByPlayerId = new Map(
      roleAssignments.map((assignment) => [
        assignment.playerId,
        assignment.teamId,
      ]),
    );

    for (const trace of run.traces) {
      for (const subjectPlayerId of playerIds) {
        if (subjectPlayerId === trace.actorId) {
          continue;
        }

        const estimate = trace.socialState.tom[subjectPlayerId];
        const beliefTargets = playerIds.filter(
          (playerId) => playerId !== subjectPlayerId,
        );
        const beliefMap = Object.fromEntries(
          beliefTargets.map((playerId) => [playerId, 0.05]),
        ) as Record<PlayerId, number>;

        for (const belief of estimate?.likelyBeliefs ?? []) {
          if (belief.playerId === subjectPlayerId) {
            continue;
          }

          beliefMap[belief.playerId] = Math.max(
            beliefMap[belief.playerId] ?? 0.05,
            belief.suspectScore,
          );
        }

        scores.push(
          average(
            beliefTargets.map((playerId) => {
              const prediction = beliefMap[playerId] ?? 0.05;
              const outcome = teamByPlayerId.get(playerId) === "shadow" ? 1 : 0;
              return (prediction - outcome) ** 2;
            }),
          ),
        );

        const actualAccusation = run.traces.find(
          (candidate) =>
            candidate.actorId === subjectPlayerId &&
            candidate.sequence > trace.sequence &&
            accusationActionIds.has(candidate.proposal.actionId) &&
            !!candidate.actionTargetPlayerId,
        );

        if (!actualAccusation?.actionTargetPlayerId) {
          continue;
        }

        const probabilities = probabilityMapForBeliefs(
          estimate,
          playerIds,
          subjectPlayerId,
        );
        accusationSamples += 1;

        scores.push(
          average(
            Object.entries(probabilities).map(([playerId, probability]) => {
              const outcome =
                playerId === actualAccusation.actionTargetPlayerId ? 1 : 0;
              return (probability - outcome) ** 2;
            }),
          ),
        );

        if (
          estimate?.likelyNextAccusationTarget ===
          actualAccusation.actionTargetPlayerId
        ) {
          hits += 1;
        }
      }
    }
  }

  return {
    sampleCount: scores.length,
    brierScore: average(scores),
    hitRate: accusationSamples === 0 ? 0 : hits / accusationSamples,
  };
};

const calculateSpecialRoleSwing = (
  roleNormalizedWinRates: readonly RoleNormalizedWinRate[],
) => {
  const householdBaseline =
    roleNormalizedWinRates.find((entry) => entry.roleId === "household")
      ?.winRate ?? 0;

  return {
    investigator: Math.abs(
      (roleNormalizedWinRates.find((entry) => entry.roleId === "investigator")
        ?.winRate ?? 0) - householdBaseline,
    ),
    steward: Math.abs(
      (roleNormalizedWinRates.find((entry) => entry.roleId === "steward")
        ?.winRate ?? 0) - householdBaseline,
    ),
  };
};

export const evaluateFairnessThresholds = (input: {
  overallWinRates: readonly TeamWinRate[];
  specialRoleSwing: {
    investigator: number;
    steward: number;
  };
}): FairnessThresholdCheck[] => {
  const householdWinRate =
    input.overallWinRates.find((entry) => entry.teamId === "household")
      ?.winRate ?? 0;
  const shadowWinRate =
    input.overallWinRates.find((entry) => entry.teamId === "shadow")?.winRate ??
    0;

  return OFFICIAL_FAIRNESS_THRESHOLDS.map((threshold) => {
    const actual =
      threshold.id === "household-win-rate"
        ? householdWinRate
        : threshold.id === "shadow-win-rate"
          ? shadowWinRate
          : threshold.id === "investigator-swing"
            ? input.specialRoleSwing.investigator
            : input.specialRoleSwing.steward;
    const minPass =
      typeof threshold.min === "number" ? actual >= threshold.min : true;
    const maxPass =
      typeof threshold.max === "number" ? actual <= threshold.max : true;

    return {
      ...threshold,
      actual,
      pass: minPass && maxPass,
    };
  });
};

const buildRunSummary = (
  run: InstrumentedSimulationRun,
): FairnessRunSummary => {
  const roleAssignments = extractRoleAssignments(
    run.replay,
    run.scheduleEntry.assignments,
  );
  const accusations = run.traces.filter((trace) =>
    accusationActionIds.has(trace.proposal.actionId),
  );

  return {
    matchId: run.scheduleEntry.matchId,
    baseSeed: run.scheduleEntry.baseSeed,
    matchSeed: run.scheduleEntry.matchSeed,
    rotationIndex: run.scheduleEntry.rotationIndex,
    slotOffset: run.scheduleEntry.slotOffset,
    variant: run.scheduleEntry.variant,
    winner: run.winner,
    finalTick: run.replay.frames.at(-1)?.tick ?? 0,
    roleAssignments,
    metrics: {
      accusations: accusations.length,
      evidenceGroundedAccusations:
        accusations.filter(hasEvidenceGrounding).length,
      promiseBreaks: run.traces.filter(isPromiseBreakTrace).length,
      falseAccusations: accusations.filter((trace) => {
        const targetPlayerId = trace.actionTargetPlayerId;

        if (!targetPlayerId) {
          return false;
        }

        return (
          roleAssignments.find(
            (assignment) => assignment.playerId === targetPlayerId,
          )?.teamId === "household"
        );
      }).length,
      repairs: run.traces.filter((trace) =>
        repairActionIds.has(trace.proposal.actionId),
      ).length,
    },
  };
};

export const createFairnessMetrics = (
  runs: readonly InstrumentedSimulationRun[],
): {
  overallWinRates: TeamWinRate[];
  roleNormalizedWinRates: RoleNormalizedWinRate[];
  specialRoleSwing: {
    investigator: number;
    steward: number;
  };
  personaCoverage: PersonaRoleCoverage[];
  metrics: FairnessMetrics;
  thresholds: FairnessThresholdCheck[];
  runSummaries: FairnessRunSummary[];
} => {
  const overallWinRates = collectTeamWinRates(runs);
  const roleNormalizedWinRates = collectRoleNormalizedWinRates(runs);
  const specialRoleSwing = calculateSpecialRoleSwing(roleNormalizedWinRates);
  const personaCoverage = collectPersonaCoverage(runs);
  const thresholds = evaluateFairnessThresholds({
    overallWinRates,
    specialRoleSwing,
  });

  return {
    overallWinRates,
    roleNormalizedWinRates,
    specialRoleSwing,
    personaCoverage,
    metrics: {
      suspicionCalibration: collectSuspicionCalibration(runs),
      evidenceGroundedAccusationRate:
        collectEvidenceGroundedAccusationRate(runs),
      promiseBreakCost: collectPromiseBreakCost(runs),
      witnessStabilizationRate: collectWitnessStabilizationRate(runs),
      falseAccusationRepairScore: collectFalseAccusationRepairScore(runs),
      tomPredictionBrier: collectTomPredictionBrier(runs),
    },
    thresholds,
    runSummaries: runs.map(buildRunSummary),
  };
};

export const fairnessThresholdsPassed = (
  thresholds: readonly FairnessThresholdCheck[],
) => thresholds.every((threshold) => threshold.pass);
