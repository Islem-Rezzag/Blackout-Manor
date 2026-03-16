import type { PlayerId, SpeechPayload } from "@blackout-manor/shared";

import type {
  PersonaPolicyProfile,
  PolicyCandidatePlan,
  PolicyEvidence,
} from "./types";

const MAX_SENTENCES = 2;
const MAX_SPEECH_LENGTH = 180;

const trimSentence = (value: string) =>
  value
    .replace(/\s+/g, " ")
    .replace(/\s([,.;!?])/g, "$1")
    .trim();

const sentenceCount = (value: string) =>
  value
    .split(/[.!?]+/)
    .map((entry) => entry.trim())
    .filter(Boolean).length;

const compactSpeech = (parts: string[]) => {
  const compact = parts
    .map(trimSentence)
    .filter(Boolean)
    .slice(0, MAX_SENTENCES)
    .join(" ");

  return compact.slice(0, MAX_SPEECH_LENGTH).trim();
};

const firstRelevantEvidence = (
  evidence: readonly PolicyEvidence[],
  targetPlayerId?: PlayerId,
) =>
  evidence.find((entry) =>
    targetPlayerId ? entry.playerIds.includes(targetPlayerId) : true,
  );

const toneLeadById: Record<string, string[]> = {
  measured: ["One clean point", "Here is the gap", "The timeline matters"],
  urgent: [
    "We are running short on time",
    "This cannot wait",
    "We need to act",
  ],
  comforting: [
    "Take a breath",
    "We can slow this down",
    "You are safe with me",
  ],
  probing: ["Explain this for me", "Answer one thing", "Clear up this gap"],
  deflecting: [
    "I hear the pressure",
    "That story is too convenient",
    "Look at the thinner timeline",
  ],
  commanding: ["Hold the room", "Stay focused", "Do not rush past this"],
  wry: [
    "Cute line",
    "That is a neat performance",
    "I am not buying the flourish",
  ],
  earnest: [
    "I am saying this plainly",
    "Listen to me",
    "I want the room to hear this",
  ],
};

const describeTarget = (playerId: PlayerId) => playerId.replace(/-/g, " ");

const evidenceSentence = (
  evidence: PolicyEvidence | undefined,
  fallback: string,
) => {
  if (!evidence) {
    return fallback;
  }

  return evidence.summary.replace(/\.$/, "");
};

const actionSentence = (
  actionId: PolicyCandidatePlan["tags"][number] | string,
  targetPlayerId: PlayerId | undefined,
  evidence: PolicyEvidence | undefined,
  persona: PersonaPolicyProfile,
) => {
  const targetLabel = targetPlayerId
    ? describeTarget(targetPlayerId)
    : "the room";

  switch (actionId) {
    case "press":
      return `${targetLabel}, ${evidenceSentence(
        evidence,
        "your timeline still does not hold",
      )}.`;
    case "comfort":
      return `${targetLabel}, steady now. Give me the cleanest room and timing you remember.`;
    case "reassure":
      return `We can slow this down. ${evidenceSentence(
        evidence,
        "I want one solid timeline before we vote",
      )}.`;
    case "apologize":
      return `I pushed that too hard. ${evidenceSentence(
        evidence,
        "I want to reset to what we can actually verify",
      )}.`;
    case "promise":
      return `I will not push your name without cleaner proof. ${evidenceSentence(
        evidence,
        "Stay consistent and I will keep this precise",
      )}.`;
    case "confide":
      return `${evidenceSentence(
        evidence,
        `${targetLabel} is the hinge in this room`,
      )}. Stay aligned with me and we can move the vote cleanly.`;
    case "vote-player":
      return `${targetLabel} is still my vote. ${evidenceSentence(
        evidence,
        "the timeline around them remains the weakest",
      )}.`;
    case "skip-vote":
      return `I am not locking a bad exile. ${evidenceSentence(
        evidence,
        "We need one cleaner contradiction first",
      )}.`;
    case "ask-forensic-question":
      return `I want the tightest forensic gap. ${evidenceSentence(
        evidence,
        "Which claim changed the room most",
      )}?`;
    default:
      return `${persona.label} keeps the point narrow. ${evidenceSentence(
        evidence,
        "The evidence still needs a cleaner read",
      )}.`;
  }
};

export const createSuggestedSpeech = (input: {
  actionId: string;
  targetPlayerId?: PlayerId | undefined;
  tone: SpeechPayload["tone"];
  persona: PersonaPolicyProfile;
  evidence: readonly PolicyEvidence[];
}) => {
  const toneId = input.persona.preferredTones[0] ?? "measured";
  const leadOptions = toneLeadById[toneId] ??
    toneLeadById.measured ?? ["One clean point"];
  const lead = leadOptions[0] ?? "One clean point";
  const evidence = firstRelevantEvidence(input.evidence, input.targetPlayerId);
  const core = actionSentence(
    input.actionId,
    input.targetPlayerId,
    evidence,
    input.persona,
  );
  const coreSentenceCount = sentenceCount(core);
  const usesTwoSentences =
    coreSentenceCount < MAX_SENTENCES &&
    (input.persona.socialStyle.talkativeness >= 0.5 ||
      input.persona.socialStyle.empathy >= 0.8);
  const text = compactSpeech(usesTwoSentences ? [`${lead}.`, core] : [core]);

  if (!text || sentenceCount(text) > MAX_SENTENCES) {
    return undefined;
  }

  return text;
};
