export const SEASON_01_BALANCE_CONSTANTS = {
  targetWinRates: {
    household: { min: 0.47, max: 0.53 },
    shadow: { min: 0.47, max: 0.53 },
  },
  specialRoleSwingCaps: {
    investigator: 0.08,
    steward: 0.06,
  },
  taskTuning: {
    soloTaskCount: 9,
    cooperativeTaskCount: 4,
    standardTaskProgressPerCommit: 0.5,
    cooperativeTaskProgressPerCommit: 0.5,
  },
  sabotageTuning: {
    blackoutDurationSeconds: 18,
    jamDoorDurationSeconds: 20,
    cameraLoopDurationSeconds: 16,
    falseClueDurationSeconds: 30,
    taskDelayDurationSeconds: 22,
  },
  meetingTuning: {
    reportBufferSeconds: 5,
    revealWindowSeconds: 5,
    accusationPenaltyWeight: 0.22,
    apologyRecoveryWeight: 0.12,
    witnessClarityBonus: 0.18,
  },
  personaScheduler: {
    buckets: ["steady", "volatile", "social", "strategist"],
    targetPerBucket: 4,
    latinSquareRotationSize: 16,
  },
} as const;
