import type { DialogueToneTag, EmotionalStanceTag } from "../../types";

export const SEASON_01_DIALOGUE_TONE_TAGS = [
  {
    id: "measured",
    label: "Measured",
    summary: "Deliberate and calm, focused on timelines and evidence.",
    sentenceGuidance: [
      "Keep claims narrow and factual.",
      "Prefer timing, room, and witness references over emotion.",
    ],
  },
  {
    id: "urgent",
    label: "Urgent",
    summary: "Fast and high-pressure, useful when time or danger is rising.",
    sentenceGuidance: [
      "Speak quickly and name the immediate risk.",
      "Push the group toward a concrete next step.",
    ],
  },
  {
    id: "comforting",
    label: "Comforting",
    summary: "Supportive and steady, aimed at calming a witness or ally.",
    sentenceGuidance: [
      "Lead with reassurance before asking for detail.",
      "Use soft phrasing and avoid escalating blame.",
    ],
  },
  {
    id: "probing",
    label: "Probing",
    summary: "Targeted cross-examination designed to surface contradictions.",
    sentenceGuidance: [
      "Ask one narrow question at a time.",
      "Highlight gaps without turning fully hostile.",
    ],
  },
  {
    id: "deflecting",
    label: "Deflecting",
    summary: "Redirect attention while sounding plausible.",
    sentenceGuidance: [
      "Acknowledge pressure, then reframe toward someone else.",
      "Avoid direct denial without an alternative explanation.",
    ],
  },
  {
    id: "commanding",
    label: "Commanding",
    summary: "Confident and controlling, suited to crisis leadership.",
    sentenceGuidance: [
      "Give concise instructions and a reason.",
      "Sound certain without revealing hidden thinking.",
    ],
  },
  {
    id: "wry",
    label: "Wry",
    summary: "Dry humor used to reduce tension or conceal nerves.",
    sentenceGuidance: [
      "Keep humor short and situational.",
      "Return to the core claim immediately after the aside.",
    ],
  },
  {
    id: "earnest",
    label: "Earnest",
    summary: "Open and sincere, often used to rebuild trust after conflict.",
    sentenceGuidance: [
      "State intent plainly.",
      "Connect the claim to protecting the group rather than ego.",
    ],
  },
] as const satisfies readonly DialogueToneTag[];

export const SEASON_01_EMOTIONAL_STANCE_TAGS = [
  {
    id: "steady",
    label: "Steady",
    summary: "Calm under scrutiny and resistant to panic spirals.",
    defaultEmotionLabel: "calm",
    witnessEffect: "Improves clarity when leading a discussion.",
  },
  {
    id: "guarded",
    label: "Guarded",
    summary:
      "Tense and careful, reluctant to over-share until trust is earned.",
    defaultEmotionLabel: "suspicious",
    witnessEffect: "Reduces oversharing but can look evasive.",
  },
  {
    id: "shaken",
    label: "Shaken",
    summary: "Visibly rattled after stress, fear, or proximity to a body.",
    defaultEmotionLabel: "shaken",
    witnessEffect: "Testimony starts noisy and benefits from comfort.",
  },
  {
    id: "defiant",
    label: "Defiant",
    summary: "Pushes back hard when accused or cornered.",
    defaultEmotionLabel: "angry",
    witnessEffect: "Increases pressure but also public tension.",
  },
  {
    id: "hopeful",
    label: "Hopeful",
    summary: "Looks for repair, consensus, and second chances.",
    defaultEmotionLabel: "hopeful",
    witnessEffect: "Improves alliance repair after false accusations.",
  },
  {
    id: "resentful",
    label: "Resentful",
    summary: "Carries a grievance after betrayal or repeated suspicion.",
    defaultEmotionLabel: "resentful",
    witnessEffect: "Makes later accusations feel personal.",
  },
  {
    id: "determined",
    label: "Determined",
    summary: "Focused and relentless once a theory locks in.",
    defaultEmotionLabel: "determined",
    witnessEffect: "Sharpens follow-up questions and vote discipline.",
  },
  {
    id: "relieved",
    label: "Relieved",
    summary: "Settles after tension breaks, often after validation or rescue.",
    defaultEmotionLabel: "relieved",
    witnessEffect: "Restores speech clarity and lowers public heat.",
  },
] as const satisfies readonly EmotionalStanceTag[];
