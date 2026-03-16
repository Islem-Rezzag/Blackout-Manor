import {
  type EngineState,
  getNeighboringRooms,
  validateAction,
} from "@blackout-manor/engine";
import type {
  AgentActionProposal,
  PhaseId,
  PlayerId,
  RoleId,
  RoomId,
  TaskState,
} from "@blackout-manor/shared";

import type { PhaseActionBudget } from "../config/actionBudgets";
import type { AgentDecisionCandidate } from "../model/types";

const DEFAULT_CONFIDENCE = 0.62;
const DEFAULT_INTENT = "confident" as const;

const sameRoomPlayerIds = (
  state: EngineState,
  actorId: PlayerId,
  roomId: RoomId,
) =>
  state.players
    .filter(
      (player) =>
        player.id !== actorId &&
        player.status === "alive" &&
        player.roomId === roomId,
    )
    .map((player) => player.id);

const createBaseProposal = (
  state: EngineState,
  actorId: PlayerId,
): Pick<
  AgentActionProposal,
  "actorId" | "phaseId" | "confidence" | "emotionalIntent"
> => ({
  actorId,
  phaseId: state.phaseId,
  confidence: DEFAULT_CONFIDENCE,
  emotionalIntent: DEFAULT_INTENT,
});

const isLegalProposal = (state: EngineState, proposal: AgentActionProposal) =>
  validateAction(state, proposal).isLegal;

const activeOrRoomTasks = (
  state: EngineState,
  actorId: PlayerId,
  roomId: RoomId,
) => {
  const actor = state.players.find((player) => player.id === actorId);

  return state.tasks.filter((task) => {
    const actorAssigned =
      task.assignedPlayerIds.includes(actorId) ||
      task.assignedPlayerIds.length < (task.kind === "two-person" ? 2 : 1);

    return (
      task.status !== "completed" &&
      task.status !== "blocked" &&
      actorAssigned &&
      (task.roomId === roomId || task.taskId === actor?.activeTaskId)
    );
  });
};

const roleSpecificActions = (
  state: EngineState,
  actorId: PlayerId,
  role: RoleId,
  roomId: RoomId,
) => {
  const proposals: AgentActionProposal[] = [];
  const baseProposal = createBaseProposal(state, actorId);
  const roomPlayers = sameRoomPlayerIds(state, actorId, roomId);
  const unfinishedTwoPersonTask = state.tasks.find(
    (task) => task.kind === "two-person" && task.status !== "completed",
  );

  if (role === "shadow") {
    for (const targetPlayerId of roomPlayers) {
      const target = state.players.find(
        (player) => player.id === targetPlayerId,
      );

      if (target?.team !== "household") {
        continue;
      }

      proposals.push({
        ...baseProposal,
        actionId: "eliminate",
        targetPlayerId,
      });
    }

    proposals.push({
      ...baseProposal,
      actionId: "trigger-blackout",
    });
    proposals.push({
      ...baseProposal,
      actionId: "jam-door",
      targetRoomId: roomId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "loop-cameras",
      targetRoomId: "surveillance-hall",
    });

    for (const task of state.tasks.slice(0, 4)) {
      proposals.push({
        ...baseProposal,
        actionId: "forge-ledger-entry",
        taskId: task.taskId,
      });
      proposals.push({
        ...baseProposal,
        actionId: "mimic-task-audio",
        taskId: task.taskId,
      });
    }

    proposals.push({
      ...baseProposal,
      actionId: "plant-false-clue",
      targetRoomId: roomId,
      clueId: `clue-${state.tick}-${actorId}`,
    });

    if (unfinishedTwoPersonTask) {
      proposals.push({
        ...baseProposal,
        actionId: "delay-two-person-task",
        taskId: unfinishedTwoPersonTask.taskId,
      });
    }
  }

  if (role === "investigator") {
    proposals.push({
      ...baseProposal,
      actionId: "recover-clue",
      targetRoomId: roomId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "dust-room",
      targetRoomId: roomId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "ask-forensic-question",
      question: "What detail most challenges the current story?",
    });
  }

  if (role === "steward") {
    for (const targetPlayerId of roomPlayers) {
      proposals.push({
        ...baseProposal,
        actionId: "escort-player",
        targetPlayerId,
      });
    }

    proposals.push({
      ...baseProposal,
      actionId: "seal-room",
      targetRoomId: roomId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "unlock-service-passage",
    });
  }

  return proposals;
};

const meetingActions = (state: EngineState, actorId: PlayerId) => {
  const actor = state.players.find((player) => player.id === actorId);
  const baseProposal = createBaseProposal(state, actorId);
  const targets = state.players
    .filter((player) => player.id !== actorId && player.status === "alive")
    .map((player) => player.id);
  const proposals: AgentActionProposal[] = [];

  for (const targetPlayerId of targets) {
    proposals.push({
      ...baseProposal,
      actionId: "comfort",
      targetPlayerId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "reassure",
      targetPlayerId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "press",
      targetPlayerId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "apologize",
      targetPlayerId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "confide",
      targetPlayerId,
    });
    proposals.push({
      ...baseProposal,
      actionId: "promise",
      targetPlayerId,
      promiseText: "I will not push your name without proof.",
    });
  }

  if (actor?.role === "investigator") {
    proposals.push({
      ...baseProposal,
      actionId: "ask-forensic-question",
      question: "Which claim leaves the biggest gap in the timeline?",
    });
  }

  return proposals;
};

const voteActions = (state: EngineState, actorId: PlayerId) => {
  const baseProposal = createBaseProposal(state, actorId);
  const targets = state.players
    .filter((player) => player.id !== actorId && player.status === "alive")
    .map((player) => player.id);
  const proposals: AgentActionProposal[] = [];

  for (const targetPlayerId of targets) {
    proposals.push({
      ...baseProposal,
      actionId: "vote-player",
      targetPlayerId,
    });
  }

  proposals.push({
    ...baseProposal,
    actionId: "skip-vote",
  });

  return proposals;
};

const reportActions = (
  state: EngineState,
  actorId: PlayerId,
  role: RoleId,
  roomId: RoomId,
) => {
  if (role !== "investigator") {
    return [];
  }

  const baseProposal = createBaseProposal(state, actorId);

  return [
    {
      ...baseProposal,
      actionId: "recover-clue",
      targetRoomId: roomId,
    } satisfies AgentActionProposal,
    {
      ...baseProposal,
      actionId: "dust-room",
      targetRoomId: roomId,
    } satisfies AgentActionProposal,
    {
      ...baseProposal,
      actionId: "ask-forensic-question",
      question: "Which room most likely changed the timeline?",
    } satisfies AgentActionProposal,
  ];
};

const roamActions = (
  state: EngineState,
  actorId: PlayerId,
  role: RoleId,
  roomId: RoomId,
) => {
  const baseProposal = createBaseProposal(state, actorId);
  const proposals: AgentActionProposal[] = [];

  for (const [discoveredPlayerId, bodyRoomId] of Object.entries(
    state.bodyLocations,
  ) as Array<[PlayerId, RoomId]>) {
    if (
      bodyRoomId === roomId &&
      !state.reportedBodyIds.includes(discoveredPlayerId)
    ) {
      proposals.push({
        ...baseProposal,
        actionId: "report-body",
        discoveredPlayerId,
      });
    }
  }

  proposals.push({
    ...baseProposal,
    actionId: "call-meeting",
    reason: "Emergency bell",
  });

  for (const task of activeOrRoomTasks(state, actorId, roomId)) {
    proposals.push({
      ...baseProposal,
      actionId:
        task.taskId ===
          state.players.find((player) => player.id === actorId)?.activeTaskId ||
        task.progress > 0
          ? "continue-task"
          : "start-task",
      taskId: task.taskId,
    });
  }

  for (const targetRoomId of getNeighboringRooms(
    roomId,
    state.servicePassageUnlocked,
  )) {
    proposals.push({
      ...baseProposal,
      actionId: "move",
      targetRoomId,
    });
  }

  proposals.push(...roleSpecificActions(state, actorId, role, roomId));

  return proposals;
};

const describeTask = (task: TaskState | undefined) =>
  task ? `${task.taskId} in ${task.roomId}` : "unknown task";

const describeCandidate = (
  state: EngineState,
  proposal: AgentActionProposal,
) => {
  switch (proposal.actionId) {
    case "move":
      return `Move to ${proposal.targetRoomId}.`;
    case "start-task":
    case "continue-task":
      return `${proposal.actionId} ${describeTask(
        state.tasks.find((task) => task.taskId === proposal.taskId),
      )}.`;
    case "report-body":
      return `Report ${proposal.discoveredPlayerId}.`;
    case "vote-player":
      return `Vote for ${proposal.targetPlayerId}.`;
    case "skip-vote":
      return "Skip the vote.";
    case "eliminate":
      return `Eliminate ${proposal.targetPlayerId}.`;
    case "promise":
      return `Promise safety to ${proposal.targetPlayerId}.`;
    case "comfort":
    case "reassure":
    case "press":
    case "apologize":
    case "confide":
    case "escort-player":
      return `${proposal.actionId} ${proposal.targetPlayerId}.`;
    case "jam-door":
    case "loop-cameras":
    case "seal-room":
      return `${proposal.actionId} at ${proposal.targetRoomId}.`;
    case "recover-clue":
    case "dust-room":
      return `${proposal.actionId} in ${proposal.targetRoomId}.`;
    case "ask-forensic-question":
      return `Ask: ${proposal.question}`;
    case "forge-ledger-entry":
    case "mimic-task-audio":
    case "delay-two-person-task":
      return `${proposal.actionId} for ${proposal.taskId}.`;
    case "plant-false-clue":
      return `Plant clue in ${proposal.targetRoomId}.`;
    case "trigger-blackout":
    case "unlock-service-passage":
      return proposal.actionId;
    case "call-meeting":
      return proposal.reason;
    default:
      return proposal.actionId;
  }
};

const rawProposalsForPhase = (
  state: EngineState,
  actorId: PlayerId,
  role: RoleId,
  roomId: RoomId,
  phaseId: PhaseId,
) => {
  switch (phaseId) {
    case "roam":
      return roamActions(state, actorId, role, roomId);
    case "report":
      return reportActions(state, actorId, role, roomId);
    case "meeting":
      return meetingActions(state, actorId);
    case "vote":
      return voteActions(state, actorId);
    default:
      return [];
  }
};

export const createDecisionCandidates = (
  state: EngineState,
  actorId: PlayerId,
  budget: PhaseActionBudget,
): AgentDecisionCandidate[] => {
  const actor = state.players.find((player) => player.id === actorId);

  if (!actor || actor.status !== "alive" || actor.roomId === null) {
    return [];
  }

  const seen = new Set<string>();
  const candidates: AgentDecisionCandidate[] = [];

  for (const proposal of rawProposalsForPhase(
    state,
    actorId,
    actor.role,
    actor.roomId,
    state.phaseId,
  )) {
    if (!isLegalProposal(state, proposal)) {
      continue;
    }

    const key = JSON.stringify(proposal);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    candidates.push({
      index: candidates.length,
      label: describeCandidate(state, proposal),
      allowSpeech: state.phaseId === "meeting",
      template: proposal,
    });

    if (candidates.length >= budget.maxCandidateActions) {
      break;
    }
  }

  return candidates;
};
