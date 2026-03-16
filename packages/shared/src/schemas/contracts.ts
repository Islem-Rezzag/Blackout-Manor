import { z } from "zod";

import {
  ACTION_IDS,
  BODY_LANGUAGE_IDS,
  CLIENT_MESSAGE_TYPE_IDS,
  DOOR_STATE_IDS,
  EMOTION_LABEL_IDS,
  EMOTIONAL_INTENT_IDS,
  EVENT_IDS,
  LIGHT_LEVEL_IDS,
  MEMORY_CATEGORY_IDS,
  PHASE_IDS,
  PLAYER_STATUS_IDS,
  ROLE_IDS,
  ROOM_CHANNEL_IDS,
  ROOM_IDS,
  SPEECH_CHANNEL_IDS,
  SPEED_PROFILE_IDS,
  TASK_IDS,
  TASK_KIND_IDS,
  TASK_STATUS_IDS,
  TEAM_IDS,
} from "../constants";

const idPattern = /^[a-zA-Z0-9:_-]+$/;

const createIdentifierSchema = (label: string) =>
  z
    .string()
    .min(1)
    .max(64)
    .regex(idPattern, `${label} must be a compact identifier.`);

const normalizedScoreSchema = z.number().min(0).max(1);
const padAxisSchema = z.number().min(-1).max(1);
const tickSchema = z.number().int().nonnegative();

export const RoleIdSchema = z.enum(ROLE_IDS);
export const TeamIdSchema = z.enum(TEAM_IDS);
export const SpeedProfileIdSchema = z.enum(SPEED_PROFILE_IDS);
export const PhaseIdSchema = z.enum(PHASE_IDS);
export const RoomIdSchema = z.enum(ROOM_IDS);
export const RoomChannelIdSchema = z.enum(ROOM_CHANNEL_IDS);
export const TaskIdSchema = z.enum(TASK_IDS);
export const TaskKindIdSchema = z.enum(TASK_KIND_IDS);
export const TaskStatusIdSchema = z.enum(TASK_STATUS_IDS);
export const PlayerStatusIdSchema = z.enum(PLAYER_STATUS_IDS);
export const LightLevelIdSchema = z.enum(LIGHT_LEVEL_IDS);
export const DoorStateIdSchema = z.enum(DOOR_STATE_IDS);
export const EmotionalIntentIdSchema = z.enum(EMOTIONAL_INTENT_IDS);
export const EmotionLabelIdSchema = z.enum(EMOTION_LABEL_IDS);
export const BodyLanguageIdSchema = z.enum(BODY_LANGUAGE_IDS);
export const SpeechChannelIdSchema = z.enum(SPEECH_CHANNEL_IDS);
export const MemoryCategoryIdSchema = z.enum(MEMORY_CATEGORY_IDS);
export const ActionIdSchema = z.enum(ACTION_IDS);
export const EventIdSchema = z.enum(EVENT_IDS);
export const ClientMessageTypeSchema = z.enum(CLIENT_MESSAGE_TYPE_IDS);

export const MatchIdSchema = createIdentifierSchema("Match ID");
export const ReplayIdSchema = createIdentifierSchema("Replay ID");
export const PlayerIdSchema = createIdentifierSchema("Player ID");
export const EventInstanceIdSchema = createIdentifierSchema("Event ID");
export const MemoryIdSchema = createIdentifierSchema("Memory ID");
export const ClueIdSchema = createIdentifierSchema("Clue ID");
export const SeedSchema = z.number().int().nonnegative();

export const PublicImageSchema = z
  .object({
    credibility: normalizedScoreSchema,
    suspiciousness: normalizedScoreSchema,
  })
  .strict();

export const EmotionStateSchema = z
  .object({
    pleasure: padAxisSchema,
    arousal: padAxisSchema,
    dominance: padAxisSchema,
    label: EmotionLabelIdSchema,
    intensity: normalizedScoreSchema,
    updatedAtTick: tickSchema,
  })
  .strict();

export const RelationshipStateSchema = z
  .object({
    trust: normalizedScoreSchema,
    warmth: normalizedScoreSchema,
    fear: normalizedScoreSchema,
    respect: normalizedScoreSchema,
    debt: normalizedScoreSchema,
    grievance: normalizedScoreSchema,
    suspectScore: normalizedScoreSchema,
    predictedSuspicionOfMe: normalizedScoreSchema,
  })
  .strict();

export const MemoryEventSchema = z
  .object({
    id: MemoryIdSchema,
    tick: tickSchema,
    category: MemoryCategoryIdSchema,
    summary: z.string().min(1).max(280),
    roomId: RoomIdSchema.optional(),
    playersInvolved: z.array(PlayerIdSchema).min(1).max(10),
    emotionTag: EmotionLabelIdSchema,
    salience: normalizedScoreSchema,
    evidenceStrength: normalizedScoreSchema,
  })
  .strict();

export const TaskDefinitionSchema = z
  .object({
    id: TaskIdSchema,
    label: z.string().min(1).max(120),
    roomId: RoomIdSchema,
    kind: TaskKindIdSchema,
    evidenceTags: z.array(z.string().min(1).max(48)).min(1).max(8),
  })
  .strict();

export const TaskStateSchema = z
  .object({
    taskId: TaskIdSchema,
    roomId: RoomIdSchema,
    kind: TaskKindIdSchema,
    status: TaskStatusIdSchema,
    assignedPlayerIds: z.array(PlayerIdSchema).max(2),
    progress: normalizedScoreSchema,
  })
  .strict();

export const RoomDefinitionSchema = z
  .object({
    id: RoomIdSchema,
    label: z.string().min(1).max(120),
    neighboringRoomIds: z.array(RoomIdSchema).min(1).max(6),
    taskIds: z.array(TaskIdSchema).max(6),
    hasCameras: z.boolean(),
    supportsSealing: z.boolean(),
  })
  .strict();

export const RoomStateSchema = z
  .object({
    roomId: RoomIdSchema,
    lightLevel: LightLevelIdSchema,
    doorState: DoorStateIdSchema,
    occupantIds: z.array(PlayerIdSchema).max(10),
    taskIds: z.array(TaskIdSchema).max(6),
  })
  .strict();

export const MatchTimingsSchema = z
  .object({
    castIntroSeconds: z.number().int().nonnegative(),
    roamRoundCount: z
      .object({
        min: z.number().int().positive(),
        max: z.number().int().positive(),
      })
      .strict(),
    roamRoundSeconds: z.number().int().positive(),
    discussionSeconds: z.number().int().nonnegative(),
    voteSeconds: z.number().int().nonnegative(),
    hardCapSeconds: z.number().int().positive(),
  })
  .strict()
  .refine((value) => value.roamRoundCount.min <= value.roamRoundCount.max, {
    message: "roamRoundCount.min must be less than or equal to max.",
    path: ["roamRoundCount"],
  });

export const RoleDistributionSchema = z
  .object({
    shadow: z.number().int().nonnegative(),
    investigator: z.number().int().nonnegative(),
    steward: z.number().int().nonnegative(),
    household: z.number().int().nonnegative(),
  })
  .strict();

export const MatchConfigSchema = z
  .object({
    matchId: MatchIdSchema,
    seed: SeedSchema,
    speedProfileId: SpeedProfileIdSchema,
    playerCount: z.number().int().positive().max(10),
    officialPublicMode: z.boolean(),
    modelPackId: z.string().min(1).max(120),
    allowPrivateWhispers: z.boolean(),
    roomIds: z.array(RoomIdSchema).min(1),
    taskIds: z.array(TaskIdSchema).min(1),
    roleDistribution: RoleDistributionSchema,
    timings: MatchTimingsSchema,
  })
  .strict();

export const PlayerStateSchema = z
  .object({
    id: PlayerIdSchema,
    displayName: z.string().min(1).max(60),
    role: RoleIdSchema,
    team: TeamIdSchema,
    roomId: RoomIdSchema.nullable(),
    status: PlayerStatusIdSchema,
    connected: z.boolean(),
    isBot: z.boolean(),
    completedTaskIds: z.array(TaskIdSchema),
    activeTaskId: TaskIdSchema.optional(),
    publicImage: PublicImageSchema,
    emotion: EmotionStateSchema,
    relationships: z.record(PlayerIdSchema, RelationshipStateSchema),
    memories: z.array(MemoryEventSchema),
    lastActionId: ActionIdSchema.optional(),
  })
  .strict();

export const PublicPlayerStateSchema = z
  .object({
    id: PlayerIdSchema,
    displayName: z.string().min(1).max(60),
    roomId: RoomIdSchema.nullable(),
    status: PlayerStatusIdSchema,
    connected: z.boolean(),
    publicImage: PublicImageSchema,
    emotion: EmotionStateSchema,
    bodyLanguage: BodyLanguageIdSchema,
    completedTaskCount: z.number().int().nonnegative(),
  })
  .strict();

export const MatchPrivateStateSchema = z
  .object({
    playerId: PlayerIdSchema,
    role: RoleIdSchema,
    team: TeamIdSchema,
    knownAllyPlayerIds: z.array(PlayerIdSchema).max(9),
    revealedAtTick: tickSchema,
  })
  .strict();

export const SpeechPayloadSchema = z
  .object({
    channel: SpeechChannelIdSchema,
    text: z.string().min(1).max(180),
    tone: EmotionalIntentIdSchema,
  })
  .strict();

const ActionProposalBaseSchema = z
  .object({
    actorId: PlayerIdSchema,
    phaseId: PhaseIdSchema,
    confidence: normalizedScoreSchema,
    emotionalIntent: EmotionalIntentIdSchema,
    speech: SpeechPayloadSchema.optional(),
    privateSummary: z.string().min(1).max(280).optional(),
  })
  .strict();

const createActionProposalSchema = <
  TActionId extends (typeof ACTION_IDS)[number],
  TShape extends z.ZodRawShape,
>(
  actionId: TActionId,
  shape: TShape,
) =>
  ActionProposalBaseSchema.extend({
    actionId: z.literal(actionId),
    ...shape,
  }).strict();

export const MoveActionProposalSchema = createActionProposalSchema("move", {
  targetRoomId: RoomIdSchema,
});

export const StartTaskActionProposalSchema = createActionProposalSchema(
  "start-task",
  {
    taskId: TaskIdSchema,
  },
);

export const ContinueTaskActionProposalSchema = createActionProposalSchema(
  "continue-task",
  {
    taskId: TaskIdSchema,
  },
);

export const ComfortActionProposalSchema = createActionProposalSchema(
  "comfort",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const ReassureActionProposalSchema = createActionProposalSchema(
  "reassure",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const PressActionProposalSchema = createActionProposalSchema("press", {
  targetPlayerId: PlayerIdSchema,
});

export const PromiseActionProposalSchema = createActionProposalSchema(
  "promise",
  {
    targetPlayerId: PlayerIdSchema,
    promiseText: z.string().min(1).max(140),
  },
);

export const ApologizeActionProposalSchema = createActionProposalSchema(
  "apologize",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const ConfideActionProposalSchema = createActionProposalSchema(
  "confide",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const ReportBodyActionProposalSchema = createActionProposalSchema(
  "report-body",
  {
    discoveredPlayerId: PlayerIdSchema,
  },
);

export const CallMeetingActionProposalSchema = createActionProposalSchema(
  "call-meeting",
  {
    reason: z.string().min(1).max(160),
  },
);

export const EliminateActionProposalSchema = createActionProposalSchema(
  "eliminate",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const TriggerBlackoutActionProposalSchema = createActionProposalSchema(
  "trigger-blackout",
  {},
);

export const JamDoorActionProposalSchema = createActionProposalSchema(
  "jam-door",
  {
    targetRoomId: RoomIdSchema,
  },
);

export const LoopCamerasActionProposalSchema = createActionProposalSchema(
  "loop-cameras",
  {
    targetRoomId: RoomIdSchema,
  },
);

export const ForgeLedgerEntryActionProposalSchema = createActionProposalSchema(
  "forge-ledger-entry",
  {
    taskId: TaskIdSchema,
  },
);

export const PlantFalseClueActionProposalSchema = createActionProposalSchema(
  "plant-false-clue",
  {
    targetRoomId: RoomIdSchema,
    clueId: ClueIdSchema,
  },
);

export const MimicTaskAudioActionProposalSchema = createActionProposalSchema(
  "mimic-task-audio",
  {
    taskId: TaskIdSchema,
  },
);

export const DelayTwoPersonTaskActionProposalSchema =
  createActionProposalSchema("delay-two-person-task", {
    taskId: TaskIdSchema,
  });

export const DustRoomActionProposalSchema = createActionProposalSchema(
  "dust-room",
  {
    targetRoomId: RoomIdSchema,
  },
);

export const RecoverClueActionProposalSchema = createActionProposalSchema(
  "recover-clue",
  {
    targetRoomId: RoomIdSchema,
  },
);

export const CompareClueFragmentsActionProposalSchema =
  createActionProposalSchema("compare-clue-fragments", {
    firstClueId: ClueIdSchema,
    secondClueId: ClueIdSchema,
  });

export const AskForensicQuestionActionProposalSchema =
  createActionProposalSchema("ask-forensic-question", {
    question: z.string().min(1).max(160),
  });

export const EscortPlayerActionProposalSchema = createActionProposalSchema(
  "escort-player",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const SealRoomActionProposalSchema = createActionProposalSchema(
  "seal-room",
  {
    targetRoomId: RoomIdSchema,
  },
);

export const UnlockServicePassageActionProposalSchema =
  createActionProposalSchema("unlock-service-passage", {});

export const VotePlayerActionProposalSchema = createActionProposalSchema(
  "vote-player",
  {
    targetPlayerId: PlayerIdSchema,
  },
);

export const SkipVoteActionProposalSchema = createActionProposalSchema(
  "skip-vote",
  {},
);

export const AgentActionProposalSchema = z.discriminatedUnion("actionId", [
  MoveActionProposalSchema,
  StartTaskActionProposalSchema,
  ContinueTaskActionProposalSchema,
  ComfortActionProposalSchema,
  ReassureActionProposalSchema,
  PressActionProposalSchema,
  PromiseActionProposalSchema,
  ApologizeActionProposalSchema,
  ConfideActionProposalSchema,
  ReportBodyActionProposalSchema,
  CallMeetingActionProposalSchema,
  EliminateActionProposalSchema,
  TriggerBlackoutActionProposalSchema,
  JamDoorActionProposalSchema,
  LoopCamerasActionProposalSchema,
  ForgeLedgerEntryActionProposalSchema,
  PlantFalseClueActionProposalSchema,
  MimicTaskAudioActionProposalSchema,
  DelayTwoPersonTaskActionProposalSchema,
  DustRoomActionProposalSchema,
  RecoverClueActionProposalSchema,
  CompareClueFragmentsActionProposalSchema,
  AskForensicQuestionActionProposalSchema,
  EscortPlayerActionProposalSchema,
  SealRoomActionProposalSchema,
  UnlockServicePassageActionProposalSchema,
  VotePlayerActionProposalSchema,
  SkipVoteActionProposalSchema,
]);

export const ModelDecisionOutputSchema = AgentActionProposalSchema;

export const VisiblePlayerSchema = z
  .object({
    id: PlayerIdSchema,
    roomId: RoomIdSchema,
    state: BodyLanguageIdSchema,
  })
  .strict();

export const PrivateObservationSchema = z
  .object({
    phaseId: PhaseIdSchema,
    self: z
      .object({
        id: PlayerIdSchema,
        role: RoleIdSchema,
        roomId: RoomIdSchema,
        emotion: EmotionStateSchema,
        publicImage: PublicImageSchema,
      })
      .strict(),
    visiblePlayers: z.array(VisiblePlayerSchema).max(9),
    visibleEvents: z.array(z.string().min(1).max(180)).max(12),
    recentClaims: z.array(z.string().min(1).max(180)).max(12),
    topMemories: z.array(MemoryEventSchema).max(12),
    relationships: z.record(PlayerIdSchema, RelationshipStateSchema),
    legalActions: z.array(ActionIdSchema).min(1),
  })
  .strict();

export const PhaseChangedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("phase-changed"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    fromPhaseId: PhaseIdSchema,
    toPhaseId: PhaseIdSchema,
  })
  .strict();

export const TaskProgressedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("task-progressed"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    taskId: TaskIdSchema,
    roomId: RoomIdSchema,
    progress: normalizedScoreSchema,
  })
  .strict();

export const TaskCompletedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("task-completed"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    taskId: TaskIdSchema,
    roomId: RoomIdSchema,
  })
  .strict();

export const SabotageTriggeredEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("sabotage-triggered"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    actionId: ActionIdSchema,
    roomId: RoomIdSchema.optional(),
    taskId: TaskIdSchema.optional(),
  })
  .strict();

export const PlayerEliminatedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("player-eliminated"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    targetPlayerId: PlayerIdSchema,
    roomId: RoomIdSchema,
  })
  .strict();

export const BodyReportedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("body-reported"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    targetPlayerId: PlayerIdSchema,
    roomId: RoomIdSchema,
  })
  .strict();

export const MeetingCalledEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("meeting-called"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    reason: z.string().min(1).max(160),
  })
  .strict();

export const DiscussionTurnEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("discussion-turn"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    text: z.string().min(1).max(180),
    targetPlayerId: PlayerIdSchema.optional(),
  })
  .strict();

export const VoteCastEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("vote-cast"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    targetPlayerId: PlayerIdSchema.nullable(),
  })
  .strict();

export const PlayerExiledEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("player-exiled"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
  })
  .strict();

export const ClueDiscoveredEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("clue-discovered"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    clueId: ClueIdSchema,
    roomId: RoomIdSchema,
  })
  .strict();

export const RelationshipUpdatedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("relationship-updated"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    sourcePlayerId: PlayerIdSchema,
    targetPlayerId: PlayerIdSchema,
    relationship: RelationshipStateSchema,
  })
  .strict();

export const EmotionShiftedEventSchema = z
  .object({
    id: EventInstanceIdSchema,
    eventId: z.literal("emotion-shifted"),
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    playerId: PlayerIdSchema,
    emotion: EmotionStateSchema,
  })
  .strict();

export const MatchEventSchema = z.discriminatedUnion("eventId", [
  PhaseChangedEventSchema,
  TaskProgressedEventSchema,
  TaskCompletedEventSchema,
  SabotageTriggeredEventSchema,
  PlayerEliminatedEventSchema,
  BodyReportedEventSchema,
  MeetingCalledEventSchema,
  DiscussionTurnEventSchema,
  VoteCastEventSchema,
  PlayerExiledEventSchema,
  ClueDiscoveredEventSchema,
  RelationshipUpdatedEventSchema,
  EmotionShiftedEventSchema,
]);

export const LobbySnapshotSchema = z
  .object({
    roomChannelId: z.literal("lobby"),
    playerCount: z.number().int().nonnegative().max(10),
    capacity: z.number().int().positive().max(10),
    readyPlayerIds: z.array(PlayerIdSchema).max(10),
  })
  .strict();

export const MatchSnapshotSchema = z
  .object({
    matchId: MatchIdSchema,
    phaseId: PhaseIdSchema,
    tick: tickSchema,
    config: MatchConfigSchema,
    players: z.array(PublicPlayerStateSchema).max(10),
    rooms: z.array(RoomStateSchema).max(ROOM_IDS.length),
    tasks: z.array(TaskStateSchema).max(TASK_IDS.length),
    recentEvents: z.array(MatchEventSchema).max(32),
  })
  .strict();

export const ReplayFrameSchema = z
  .object({
    tick: tickSchema,
    phaseId: PhaseIdSchema,
    events: z.array(MatchEventSchema),
    players: z.array(PublicPlayerStateSchema).max(10),
    rooms: z.array(RoomStateSchema).max(ROOM_IDS.length),
    tasks: z.array(TaskStateSchema).max(TASK_IDS.length),
  })
  .strict();

export const ReplayEnvelopeSchema = z
  .object({
    protocolVersion: z.string().min(1),
    replayId: ReplayIdSchema,
    matchId: MatchIdSchema,
    seed: SeedSchema,
    createdAt: z.string().datetime({ offset: true }),
    config: MatchConfigSchema,
    frames: z.array(ReplayFrameSchema),
  })
  .strict();

export type RoleId = z.infer<typeof RoleIdSchema>;
export type TeamId = z.infer<typeof TeamIdSchema>;
export type SpeedProfileId = z.infer<typeof SpeedProfileIdSchema>;
export type PhaseId = z.infer<typeof PhaseIdSchema>;
export type RoomId = z.infer<typeof RoomIdSchema>;
export type RoomChannelId = z.infer<typeof RoomChannelIdSchema>;
export type TaskId = z.infer<typeof TaskIdSchema>;
export type TaskKindId = z.infer<typeof TaskKindIdSchema>;
export type TaskStatusId = z.infer<typeof TaskStatusIdSchema>;
export type PlayerStatusId = z.infer<typeof PlayerStatusIdSchema>;
export type LightLevelId = z.infer<typeof LightLevelIdSchema>;
export type DoorStateId = z.infer<typeof DoorStateIdSchema>;
export type EmotionalIntentId = z.infer<typeof EmotionalIntentIdSchema>;
export type EmotionLabelId = z.infer<typeof EmotionLabelIdSchema>;
export type BodyLanguageId = z.infer<typeof BodyLanguageIdSchema>;
export type SpeechChannelId = z.infer<typeof SpeechChannelIdSchema>;
export type MemoryCategoryId = z.infer<typeof MemoryCategoryIdSchema>;
export type ActionId = z.infer<typeof ActionIdSchema>;
export type EventId = z.infer<typeof EventIdSchema>;
export type MatchId = z.infer<typeof MatchIdSchema>;
export type ReplayId = z.infer<typeof ReplayIdSchema>;
export type PlayerId = z.infer<typeof PlayerIdSchema>;
export type ClueId = z.infer<typeof ClueIdSchema>;
export type PublicImage = z.infer<typeof PublicImageSchema>;
export type EmotionState = z.infer<typeof EmotionStateSchema>;
export type RelationshipState = z.infer<typeof RelationshipStateSchema>;
export type MemoryEvent = z.infer<typeof MemoryEventSchema>;
export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;
export type TaskState = z.infer<typeof TaskStateSchema>;
export type RoomDefinition = z.infer<typeof RoomDefinitionSchema>;
export type RoomState = z.infer<typeof RoomStateSchema>;
export type MatchTimings = z.infer<typeof MatchTimingsSchema>;
export type RoleDistribution = z.infer<typeof RoleDistributionSchema>;
export type MatchConfig = z.infer<typeof MatchConfigSchema>;
export type PlayerState = z.infer<typeof PlayerStateSchema>;
export type PublicPlayerState = z.infer<typeof PublicPlayerStateSchema>;
export type MatchPrivateState = z.infer<typeof MatchPrivateStateSchema>;
export type SpeechPayload = z.infer<typeof SpeechPayloadSchema>;
export type AgentActionProposal = z.infer<typeof AgentActionProposalSchema>;
export type ModelDecisionOutput = z.infer<typeof ModelDecisionOutputSchema>;
export type VisiblePlayer = z.infer<typeof VisiblePlayerSchema>;
export type PrivateObservation = z.infer<typeof PrivateObservationSchema>;
export type MatchEvent = z.infer<typeof MatchEventSchema>;
export type LobbySnapshot = z.infer<typeof LobbySnapshotSchema>;
export type MatchSnapshot = z.infer<typeof MatchSnapshotSchema>;
export type ReplayFrame = z.infer<typeof ReplayFrameSchema>;
export type ReplayEnvelope = z.infer<typeof ReplayEnvelopeSchema>;
