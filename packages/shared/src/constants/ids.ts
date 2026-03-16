export const ROLE_IDS = [
  "shadow",
  "investigator",
  "steward",
  "household",
] as const;

export const TEAM_IDS = ["shadow", "household"] as const;

export const SPEED_PROFILE_IDS = [
  "showcase",
  "fast-sim",
  "headless-regression",
] as const;

export const PHASE_IDS = [
  "intro",
  "roam",
  "report",
  "meeting",
  "vote",
  "reveal",
  "resolution",
  "reflection",
] as const;

export const ROOM_IDS = [
  "grand-hall",
  "library",
  "study",
  "kitchen",
  "ballroom",
  "greenhouse",
  "generator-room",
  "surveillance-hall",
  "cellar",
  "servants-corridor",
] as const;

export const ROOM_CHANNEL_IDS = ["lobby", "match", "replay"] as const;

export const TASK_KIND_IDS = ["solo", "two-person"] as const;

export const TASK_IDS = [
  "reset-breaker-lattice",
  "file-guest-ledger",
  "rewind-corridor-film",
  "rebalance-greenhouse-valves",
  "sort-masque-inventory",
  "prepare-silver-tea-service",
  "tune-police-band-radio",
  "wind-grandfather-clock",
  "restore-boiler-pressure",
  "carry-coal-to-the-boiler",
  "move-portrait-crate-into-storage",
  "synchronize-organ-pipes",
  "balance-hot-water-pressure",
] as const;

export const PLAYER_STATUS_IDS = ["alive", "eliminated", "exiled"] as const;

export const LIGHT_LEVEL_IDS = ["lit", "dim", "blackout"] as const;

export const DOOR_STATE_IDS = ["open", "jammed", "sealed"] as const;

export const TASK_STATUS_IDS = [
  "available",
  "in-progress",
  "blocked",
  "completed",
] as const;

export const EMOTIONAL_INTENT_IDS = [
  "calm",
  "defensive",
  "warm",
  "aggressive",
  "evasive",
  "confident",
] as const;

export const EMOTION_LABEL_IDS = [
  "calm",
  "suspicious",
  "afraid",
  "angry",
  "hopeful",
  "guilty",
  "confident",
  "shaken",
  "relieved",
  "resentful",
  "determined",
] as const;

export const BODY_LANGUAGE_IDS = [
  "calm",
  "agitated",
  "shaken",
  "defiant",
  "confident",
] as const;

export const SPEECH_CHANNEL_IDS = ["proximity", "private", "meeting"] as const;

export const MEMORY_CATEGORY_IDS = [
  "witness",
  "promise",
  "betrayal",
  "task",
  "report",
  "meeting",
  "clue",
  "sabotage",
  "vote",
  "social",
] as const;

export const ACTION_IDS = [
  "move",
  "start-task",
  "continue-task",
  "comfort",
  "reassure",
  "press",
  "promise",
  "apologize",
  "confide",
  "report-body",
  "call-meeting",
  "eliminate",
  "trigger-blackout",
  "jam-door",
  "loop-cameras",
  "forge-ledger-entry",
  "plant-false-clue",
  "mimic-task-audio",
  "delay-two-person-task",
  "dust-room",
  "recover-clue",
  "compare-clue-fragments",
  "ask-forensic-question",
  "escort-player",
  "seal-room",
  "unlock-service-passage",
  "vote-player",
  "skip-vote",
] as const;

export const EVENT_IDS = [
  "phase-changed",
  "task-progressed",
  "task-completed",
  "sabotage-triggered",
  "player-eliminated",
  "body-reported",
  "meeting-called",
  "discussion-turn",
  "vote-cast",
  "player-exiled",
  "clue-discovered",
  "relationship-updated",
  "emotion-shifted",
] as const;

export const CLIENT_MESSAGE_TYPE_IDS = [
  "client.ping",
  "client.lobby.set-ready",
  "client.match.propose-action",
  "client.replay.request",
  "client.replay.seek",
] as const;

export const SERVER_MESSAGE_TYPE_IDS = [
  "server.hello",
  "server.pong",
  "server.lobby.snapshot",
  "server.match.snapshot",
  "server.match.private-state",
  "server.match.event",
  "server.replay.chunk",
  "server.validation-error",
  "server.healthcheck",
] as const;
