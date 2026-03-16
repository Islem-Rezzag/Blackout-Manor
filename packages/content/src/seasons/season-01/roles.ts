import type { RoleContentDefinition } from "../../types";

export const SEASON_01_ROLES = [
  {
    id: "shadow",
    team: "shadow",
    label: "Shadow",
    summary:
      "A hidden killer who survives by blending in, isolating targets, and controlling suspicion.",
    publicBrief: "A masked guest trying to survive the storm.",
    secretBrief:
      "You know the other Shadow. Hide in plain sight, fracture alibis, and reach parity or the hard cap.",
    activeActionIds: [
      "eliminate",
      "trigger-blackout",
      "jam-door",
      "loop-cameras",
      "forge-ledger-entry",
      "plant-false-clue",
      "mimic-task-audio",
      "delay-two-person-task",
    ],
    passiveTraits: [
      "Knows the identity of the other Shadow.",
      "Wins by parity, hard cap, or surviving task pressure.",
    ],
    winConditionText:
      "Reduce the household to parity or survive until the manor fails to stabilize.",
  },
  {
    id: "investigator",
    team: "household",
    label: "Investigator",
    summary:
      "A clue specialist who turns scattered evidence into stronger accusations.",
    publicBrief: "A sharp-eyed guest with a talent for details.",
    secretBrief:
      "You are better at recovering and comparing clues, but your answers remain partial rather than absolute.",
    activeActionIds: [
      "dust-room",
      "recover-clue",
      "compare-clue-fragments",
      "ask-forensic-question",
    ],
    passiveTraits: [
      "Can act during the report window before discussion starts.",
      "Can improve evidence quality without solving the match alone.",
    ],
    winConditionText:
      "Help the household expose Shadows without overpowering social deduction.",
  },
  {
    id: "steward",
    team: "household",
    label: "Steward",
    summary:
      "A coordination role that creates public alibis and controls movement.",
    publicBrief: "A composed estate steward keeping the house together.",
    secretBrief:
      "You can escort allies, briefly seal rooms, and unlock a service passage once per match.",
    activeActionIds: ["escort-player", "seal-room", "unlock-service-passage"],
    passiveTraits: [
      "Creates strong public timeline anchors.",
      "Best used to prevent panic and keep witnesses connected.",
    ],
    winConditionText:
      "Protect the household's information flow and help maintain credible alibis.",
  },
  {
    id: "household",
    team: "household",
    label: "Household",
    summary:
      "A standard survivor role focused on tasks, testimony, and voting discipline.",
    publicBrief: "A member of the household trying to survive the storm.",
    secretBrief:
      "Complete tasks, form clean alibis, and pressure contradictions without overcommitting too early.",
    activeActionIds: [
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
      "vote-player",
      "skip-vote",
    ],
    passiveTraits: [
      "Forms the majority and wins through accurate voting or task completion.",
      "Relies on social reasoning more than special abilities.",
    ],
    winConditionText: "Remove both Shadows before they control the house.",
  },
] as const satisfies readonly RoleContentDefinition[];
