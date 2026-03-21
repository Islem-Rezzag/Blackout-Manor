import {
  AgentDecisionGateway,
  type AgentDecisionResolvedTrace,
  type AgentModelInvocation,
  createDecisionCandidates,
  getActionBudgetForPhase,
  MockModelAdapter,
} from "@blackout-manor/agents";
import {
  advanceServerTick,
  bootstrapMatch,
  buildReplayLog,
  dispatchAction,
  type EngineState,
  getDefaultMatchConfig,
  shuffleDeterministically,
  validateAction,
} from "@blackout-manor/engine";
import {
  DEFAULT_TIMINGS,
  type MatchConfig,
  type PlayerId,
} from "@blackout-manor/shared";

import { aggregateReplayEqMetrics, createReplayEqMetrics } from "./eq";
import { createFairnessMetrics, fairnessThresholdsPassed } from "./metrics";
import { createPersonaRotationSchedule } from "./scheduler";
import type {
  InstrumentedSimulationRun,
  PersonaRotationScheduleEntry,
  SeedSwapTournamentOptions,
  SeedSwapTournamentResult,
  TournamentDecisionTrace,
} from "./types";

const ROAM_ACTIONS_PER_TICK = 5;
const REPORT_ACTIONS_PER_PHASE = 1;
const MEETING_ACTIONS_PER_PHASE = 4;

const createHeadlessConfig = (seed: number, matchId: string): MatchConfig => ({
  ...getDefaultMatchConfig(matchId, seed),
  speedProfileId: "headless-regression",
  timings: {
    ...DEFAULT_TIMINGS["headless-regression"],
    roamRoundSeconds: 7,
    discussionSeconds: 4,
    voteSeconds: 2,
    hardCapSeconds: 48,
  },
});

const getLivingPlayers = (state: EngineState) =>
  state.players.filter((player) => player.status === "alive");

const getActorOrderForTick = (state: EngineState) =>
  shuffleDeterministically(
    getLivingPlayers(state).map((player) => player.id),
    state.seed + state.tick + state.currentRound * 97,
  ).items;

const hashString = (value: string) =>
  [...value].reduce(
    (total, character) => Math.imul(total ^ character.charCodeAt(0), 16777619),
    2166136261,
  ) >>> 0;

const chooseTournamentSelection = (invocation: AgentModelInvocation) => {
  const planByIndex = new Map(
    invocation.policy.candidatePlans.map((plan) => [plan.candidateIndex, plan]),
  );
  const rankedPlans = [...invocation.policy.candidatePlans].sort(
    (left, right) =>
      right.score - left.score || left.candidateIndex - right.candidateIndex,
  );
  const window = rankedPlans.filter(
    (plan, index) =>
      index < 3 && plan.score >= (rankedPlans[0]?.score ?? 0) - 10,
  );
  const chosenPlan =
    window[
      Math.abs(hashString(invocation.decisionKey)) % Math.max(1, window.length)
    ] ?? rankedPlans[0];
  const candidate = invocation.candidates.find(
    (entry) => entry.index === chosenPlan?.candidateIndex,
  );

  if (!chosenPlan || !candidate) {
    return {
      candidateIndex: invocation.candidates[0]?.index ?? 0,
      confidence: 0.6,
      emotionalIntent: "confident" as const,
    };
  }

  const plan = planByIndex.get(candidate.index);

  return {
    candidateIndex: candidate.index,
    confidence: Math.max(0.55, Math.min(0.92, chosenPlan.score / 100)),
    emotionalIntent: chosenPlan.recommendedIntent,
    ...(plan?.suggestedSpeech ? { speech: plan.suggestedSpeech } : {}),
    ...(plan?.suggestedPrivateSummary
      ? { privateSummary: plan.suggestedPrivateSummary }
      : {}),
  };
};

const buildDecisionTrace = (
  trace: AgentDecisionResolvedTrace,
  state: EngineState,
  sequence: number,
  scheduleEntry: PersonaRotationScheduleEntry,
): TournamentDecisionTrace => {
  const actor = state.players.find((player) => player.id === trace.actorId);
  const personaAssignment = scheduleEntry.assignments.find(
    (assignment) => assignment.playerId === trace.actorId,
  );

  if (!actor || !personaAssignment) {
    throw new Error(`Missing actor context for ${trace.actorId}.`);
  }

  return {
    ...trace,
    sequence,
    actorRole: actor.role,
    actorTeam: actor.team,
    actorDisplayName: actor.displayName,
    actorPersonaId: personaAssignment.personaId,
    ...("targetPlayerId" in trace.proposal
      ? { actionTargetPlayerId: trace.proposal.targetPlayerId }
      : {}),
  };
};

const createTournamentGateway = (
  traceSink: Map<string, AgentDecisionResolvedTrace>,
) =>
  new AgentDecisionGateway({
    adapter: new MockModelAdapter(async (invocation) =>
      chooseTournamentSelection(invocation),
    ),
    instrumentation: {
      onResolved(trace) {
        traceSink.set(trace.decisionKey, trace);
      },
    },
  });

const takeDecision = async (
  gateway: AgentDecisionGateway,
  traceSink: Map<string, AgentDecisionResolvedTrace>,
  state: EngineState,
  actorId: PlayerId,
  scheduleEntry: PersonaRotationScheduleEntry,
  traces: TournamentDecisionTrace[],
) => {
  const decisionKey = `${state.config.matchId}:${state.phaseId}:${state.tick}:${state.eventLog.length}:${actorId}`;
  const candidates = createDecisionCandidates(
    state,
    actorId,
    getActionBudgetForPhase(state.phaseId),
  );

  if (candidates.length === 0) {
    return state;
  }

  const result = await gateway.decide({
    decisionKey,
    matchId: state.config.matchId,
    speedProfileId: state.config.speedProfileId,
    actorId,
    phaseId: state.phaseId,
    state,
  });

  if (!result) {
    return state;
  }

  const legality = validateAction(state, result.proposal);

  if (!legality.isLegal) {
    return state;
  }

  const transition = dispatchAction(state, result.proposal);
  const actionSequence = transition.events.find(
    (event) => event.type === "action-recorded",
  )?.sequence;
  const preparedTrace = traceSink.get(decisionKey);

  if (preparedTrace && typeof actionSequence === "number") {
    traces.push(
      buildDecisionTrace(preparedTrace, state, actionSequence, scheduleEntry),
    );
  }

  return transition.state;
};

export const runInstrumentedSimulation = async (
  scheduleEntry: PersonaRotationScheduleEntry,
): Promise<InstrumentedSimulationRun> => {
  const config = createHeadlessConfig(
    scheduleEntry.matchSeed,
    scheduleEntry.matchId,
  );
  const players = scheduleEntry.assignments.map((assignment) => ({
    id: assignment.playerId,
    displayName: assignment.displayName,
    isBot: true,
  }));
  const traceSink = new Map<string, AgentDecisionResolvedTrace>();
  const gateway = createTournamentGateway(traceSink);
  const traces: TournamentDecisionTrace[] = [];
  let state = bootstrapMatch(config, players).state;
  const reportActorsByPhase = new Set<string>();
  const meetingActorsByPhase = new Set<string>();
  const maxTicks = config.timings.hardCapSeconds + 15;

  for (
    let step = 0;
    step < maxTicks && state.phaseId !== "resolution";
    step += 1
  ) {
    if (state.phaseId === "report") {
      const phaseKey = `${state.phaseId}:${state.phaseStartedAtTick}`;
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        const actorPhaseKey = `${phaseKey}:${actorId}`;

        if (reportActorsByPhase.has(actorPhaseKey)) {
          continue;
        }

        state = await takeDecision(
          gateway,
          traceSink,
          state,
          actorId,
          scheduleEntry,
          traces,
        );
        reportActorsByPhase.add(actorPhaseKey);
        actionsTaken += 1;

        if (
          state.phaseId !== "report" ||
          actionsTaken >= REPORT_ACTIONS_PER_PHASE
        ) {
          break;
        }
      }
    }

    if (state.phaseId === "meeting") {
      const phaseKey = `${state.phaseId}:${state.phaseStartedAtTick}`;
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        const actorPhaseKey = `${phaseKey}:${actorId}`;

        if (meetingActorsByPhase.has(actorPhaseKey)) {
          continue;
        }

        state = await takeDecision(
          gateway,
          traceSink,
          state,
          actorId,
          scheduleEntry,
          traces,
        );
        meetingActorsByPhase.add(actorPhaseKey);
        actionsTaken += 1;

        if (
          state.phaseId !== "meeting" ||
          actionsTaken >= MEETING_ACTIONS_PER_PHASE
        ) {
          break;
        }
      }
    }

    if (state.phaseId === "vote") {
      for (const actorId of getActorOrderForTick(state)) {
        state = await takeDecision(
          gateway,
          traceSink,
          state,
          actorId,
          scheduleEntry,
          traces,
        );

        if (state.phaseId !== "vote") {
          break;
        }
      }
    }

    if (state.phaseId === "roam") {
      let actionsTaken = 0;

      for (const actorId of getActorOrderForTick(state)) {
        state = await takeDecision(
          gateway,
          traceSink,
          state,
          actorId,
          scheduleEntry,
          traces,
        );
        actionsTaken += 1;

        if (state.phaseId !== "roam" || actionsTaken >= ROAM_ACTIONS_PER_TICK) {
          break;
        }
      }
    }

    if (state.phaseId === "resolution") {
      break;
    }

    state = advanceServerTick(state, 1).state;
  }

  return {
    scheduleEntry,
    replay: buildReplayLog(state),
    winner: state.winner,
    traces,
    events: state.eventLog,
  };
};

export const runSeedSwapTournament = async (
  options: SeedSwapTournamentOptions,
): Promise<SeedSwapTournamentResult> => {
  const scheduleEntries = createPersonaRotationSchedule(options.baseSeeds, {
    ...(typeof options.rotationPairsPerSeed === "number"
      ? { rotationPairsPerSeed: options.rotationPairsPerSeed }
      : {}),
    ...(options.matchPrefix ? { matchPrefix: options.matchPrefix } : {}),
  }).slice(0, options.maxRuns ?? Number.POSITIVE_INFINITY);
  const runs: InstrumentedSimulationRun[] = [];

  for (const entry of scheduleEntries) {
    runs.push(await runInstrumentedSimulation(entry));
  }

  const summary = createFairnessMetrics(runs);
  const eqMetrics = aggregateReplayEqMetrics(
    runs.map((run) => createReplayEqMetrics(run.replay)),
  );
  const report = {
    formatVersion: "1.0.0" as const,
    generatedAt: options.nowIso ?? new Date().toISOString(),
    simulationCount: runs.length,
    passed: fairnessThresholdsPassed(summary.thresholds),
    thresholds: summary.thresholds,
    schedule: {
      baseSeeds: [...options.baseSeeds],
      rotationPairsPerSeed: options.rotationPairsPerSeed ?? 5,
      scheduleEntries,
    },
    overallWinRates: summary.overallWinRates,
    roleNormalizedWinRates: summary.roleNormalizedWinRates,
    specialRoleSwing: summary.specialRoleSwing,
    personaCoverage: summary.personaCoverage,
    metrics: summary.metrics,
    eqMetrics,
    runs: summary.runSummaries,
  };

  return {
    report,
    runs,
  };
};
