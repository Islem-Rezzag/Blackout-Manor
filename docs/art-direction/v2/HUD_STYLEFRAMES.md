# HUD Styleframes V2

## Shared HUD Direction

The HUD should feel like a premium storm-night broadcast package embedded in the manor fiction. It supports the Phaser runtime; it must not turn live mode into a React dashboard.

Shared visual language:

- dark lacquered metal or smoked glass base
- brass hairline borders
- parchment evidence inserts
- restrained claret alerts
- cold surveillance blue only for camera/technical states
- serif headings for manor/broadcast identity
- sans-serif utility text for timers, metadata, and labels
- no private chain-of-thought, model reasoning, hidden-role analytics, fairness charts, or benchmark UI in live mode

Implementation assumption: future runtime work should keep these surfaces Phaser-owned or Phaser-mounted unless a spec explicitly changes the live route architecture.

## Main Live HUD

### Purpose

Orient the viewer during live play without competing with the manor.

### Data Displayed

Phase, timer, room focus, compact public event count, surveillance state, connection/broadcast status, current public objective if any.

### Must Never Display

Private chain-of-thought, hidden roles before reveal, agent prompts, model budgets, fairness analytics, benchmark panels, debug payloads, raw replay internals.

### Layout Guidance

Use a thin top broadcast rail and a restrained lower cast/status strip. Keep the center of the screen clear for the manor. Room/status chips should hug edges and never cover body zones or task hotspots.

### Typography Guidance

Serif small caps for phase and manor labels. Sans-serif tabular numerals for timer. Use high contrast and avoid tiny condensed text.

### Animation Guidance

Soft entrance on match load, brief pulse on phase change, subtle timer emphasis under 10 seconds. No constant shimmer or busy ticker.

### Phaser Implementation Notes

Prefer camera-fixed containers with stable depths above world focus but below modal meeting surfaces. Scale from viewport dimensions, not world zoom. Use public snapshot data only.

### Figma Component Notes

Create components for `LiveHudRail`, `TimerPill`, `RoomStatusChip`, `BroadcastState`, and `SurfaceSafeArea`. Define desktop and 16:9 capture variants first, then mobile/tablet.

### Accessibility/Readability Constraints

Minimum body text 14 px equivalent at 1080p. Timer and phase must pass contrast over both bright and dark room backgrounds. Avoid color-only status encoding.

## Cinematic Subtitle Strip

### Purpose

Show public speech, reports, short event narration, and meeting lines with cinematic weight.

### Data Displayed

Speaker name, portrait/accent, public utterance or concise public summary, room/phase context when needed.

### Must Never Display

Private reasoning, inferred hidden intent, prompt summaries, unspoken model thoughts, raw HEART internals.

### Layout Guidance

Bottom-center strip with transparent smoked base, brass top hairline, speaker marker on left, text line in the middle, optional source/evidence chip on right. Keep above the cast strip if both are visible.

### Typography Guidance

Readable sans-serif for speech text, serif or small caps for speaker name. Use sentence case. Avoid all-caps dialogue.

### Animation Guidance

Slide/fade in, hold long enough for reading, fade out. New lines should replace with a small vertical settle, not a rapid chat feed.

### Phaser Implementation Notes

Queue subtitles from public events. Clamp line length, wrap to two lines, and reserve a stable panel height to prevent layout jumps.

### Figma Component Notes

Build variants for speech, report, whisper-public-summary, evidence citation, and vote statement. Include overflow examples.

### Accessibility/Readability Constraints

Two-line max in live mode. 4.5:1 contrast minimum. Do not overlap low-screen meeting portraits.

## Event Board

### Purpose

Maintain a compact public memory of important live events.

### Data Displayed

Meeting called, body reported, sabotage, clue found, public claim filed, contradiction surfaced, vote phase started, vote resolved.

### Must Never Display

Fairness scores, hidden roles, private knowledge, model-generated confidence not backed by public evidence, debug event IDs.

### Layout Guidance

Upper-left or upper-right broadcast board. Three to five newest events. Use icon/label/time, not paragraphs. Board should be narrower than current room labels and never cover room thresholds.

### Typography Guidance

Serif board title, sans-serif event lines. Use red/claret only for urgent events. Evidence uses gold/parchment.

### Animation Guidance

New event receives a brief brass sweep and settles. Older events dim rather than scrolling constantly.

### Phaser Implementation Notes

Implement as a fixed-depth overlay consuming public recent events. Use keyed event types so icons and colors are deterministic and replay-safe.

### Figma Component Notes

Build `EventBoard`, `EventBoardRow`, and severity variants: neutral, clue, sabotage, report, meeting, contradiction, vote.

### Accessibility/Readability Constraints

Rows must remain legible over storm and warm room backgrounds. Do not rely only on icon shape or color; include text labels.

## Claim/Evidence Panel

### Purpose

Show Prompt 3 public claims and evidence refs as social artifacts, not truth oracle panels.

### Data Displayed

PublicClaim summary, claimant, cited EvidenceRef chips, supportLevel, contradicted ClaimRef links, room/time/source metadata when public.

### Must Never Display

Hidden ground truth, private observations not projected to the agent, chain-of-thought, raw verifier internals, private confidence math.

### Layout Guidance

Use a parchment docket over smoked glass. Claims appear as speaker-bound cards with evidence chips pinned below. Keep it side-panel or meeting-adjacent, not a full-screen table.

### Typography Guidance

Claim text in readable sans-serif. Section headings in small serif caps. Evidence chips use compact monospace-like metadata only for public IDs if needed; otherwise human labels.

### Animation Guidance

Evidence chips pin in with a soft stamp. Support-level changes crossfade with a short seal change. Contradictions draw a brief line between affected claims.

### Phaser Implementation Notes

Consume normalized public claim/evidence contracts. Cache text layout for performance. Use deterministic ordering by phase/tick/source, not random visual placement.

### Figma Component Notes

Components: `ClaimDocket`, `ClaimRow`, `EvidenceChip`, `SupportSeal`, `ContradictionLink`, `SourceTag`. Include supported, contested, contradicted, and unverified variants.

### Accessibility/Readability Constraints

Evidence/source tags need text labels. Contradiction links must be readable without color through icon shape, line style, and label.

## Alibi Timeline

### Purpose

Help spectators compare public room claims, witnessed positions, and unknown intervals during meetings or replay.

### Data Displayed

Phase/tick markers, suspect row, room segments, witnessed/publicly claimed status, contested intervals, evidence links.

### Must Never Display

Private path plans, hidden-role truth, unrevealed murderer identity, model speculation, private chain-of-thought.

### Layout Guidance

Horizontal timeline panel with room silhouettes or short labels. Use one row per selected suspect in live mode; replay can expand to multiple rows.

### Typography Guidance

Sans-serif utility labels. Room labels should abbreviate only when paired with icons/silhouettes. Use tabular numerals for time.

### Animation Guidance

Meeting mode: timeline reveals selected suspect row first, then cited evidence segments. Replay mode: scrubber can animate the playhead.

### Phaser Implementation Notes

Render from public event/replay frame data. Do not infer beyond available public facts. Keep row count limited in live mode to preserve game feel.

### Figma Component Notes

Components: `AlibiTimeline`, `TimelineRow`, `RoomSegment`, `WitnessPip`, `ContestedMarker`, `Playhead`.

### Accessibility/Readability Constraints

Use pattern plus color: solid for witnessed, dashed for claimed, hatched for contested, empty for unknown.

## Contradiction Alert

### Purpose

Signal that public claims or evidence are in conflict and point viewers to the conflict.

### Data Displayed

Short contradiction title, involved suspects/claims, cited evidence refs, support level shift, room/time anchor if public.

### Must Never Display

Who is lying as hidden truth, private verifier reasoning, model chain-of-thought, secret role data.

### Layout Guidance

Brief centered or upper-third alert with claret seal, two claim chips, and a visible connector. It should hand off to the claim/evidence panel quickly.

### Typography Guidance

Serif small caps for "Contradiction." Sans-serif concise explanation. Avoid paragraphs.

### Animation Guidance

One sharp but restrained strike: claret seal lands, connector draws, then alert collapses to event board/claim panel. No repeated flashing.

### Phaser Implementation Notes

Trigger only from public contradiction state. Keep duration deterministic. Ensure alert depth does not cover meeting vote confirmation.

### Figma Component Notes

Build variants for claim-vs-claim, claim-vs-evidence, alibi conflict, and retracted claim.

### Accessibility/Readability Constraints

Provide text summary and icon shape. Motion should be safe: no strobing, no rapid red flashes.

## Meeting Vote Panel

### Purpose

Support physical dining-room voting while keeping the table and seated suspects as the primary drama.

### Data Displayed

Vote countdown, eligible voters, public vote lock state if rules allow, selected suspect, abstain/skip state, final public tally/outcome when revealed.

### Must Never Display

Hidden roles before reveal, private vote reasoning, model deliberation, hidden persuasion scores.

### Layout Guidance

Frame the dining table, not replace it. Use seat-aligned ballot tokens and a compact side tally. Portrait strip can support identity; table blocking should remain visible.

### Typography Guidance

Serif title, tabular timer, clear suspect names. Keep tally labels plain and readable.

### Animation Guidance

Ballot tokens slide from seats to center tray or stamp onto seat plates. Final outcome gets one dramatic reveal, then resolves to summary.

### Phaser Implementation Notes

Tie visual state to meeting phase and public vote events. Keep seat anchors deterministic. Do not animate votes before the public state exposes them.

### Figma Component Notes

Components: `MeetingVotePanel`, `SeatBallot`, `VoteCountdown`, `VoteTally`, `ExileOutcome`, `AbstainToken`.

### Accessibility/Readability Constraints

Each vote state needs text or symbol plus color. Avoid tiny seat labels. Ensure all ten suspects remain identifiable.

## Surveillance Console

### Purpose

Provide in-world multi-feed observation without leaving the game runtime.

### Data Displayed

Four room feeds, room name, public occupant pips, feed status, body/sabotage/clue markers, selected feed, camera lock hints.

### Must Never Display

Private role information, hidden agent knowledge, dev diagnostics, benchmark metrics, private reasoning.

### Layout Guidance

In-world console cluster with 2x2 feed grid, analog frame, cold CRT palette, and small hardware controls. It can be screen-fixed but should feel like a manor object.

### Typography Guidance

Serif or engraved title for console. Small sans-serif for feed labels and status. Avoid web-dashboard tables.

### Animation Guidance

Subtle scanline drift, feed switch flicker, selected-feed glow. No heavy glitch that hides body/clue markers.

### Phaser Implementation Notes

The existing `SurveillanceConsole` card geometry is a good structural base. Future art should replace plate/frame textures and feed mini-room art through manifest keys.

### Figma Component Notes

Components: `SurveillanceConsole`, `FeedCard`, `FeedMarker`, `OccupantPips`, `HardwareToggle`, `SelectedFeedFrame`.

### Accessibility/Readability Constraints

Feed text must remain legible at 1080p and capture scale. Body/sabotage/clue markers need distinct labels and shapes.

## Replay Analytics Overlay

### Purpose

Support archive review and dev/replay inspection while preserving separation from live mode.

### Data Displayed

Replay scrubber, event index, public claim/evidence history, selected frame metadata, public vote outcomes, room occupancy over time, optional EQ/fairness links only on dev surfaces.

### Must Never Display

Private chain-of-thought, private prompts, hidden reasoning traces, live-route benchmark panels.

### Layout Guidance

Archive desk or broadcast control overlay, not generic BI dashboard. Use collapsible side rail and bottom scrubber. Keep the game frame visible.

### Typography Guidance

More utility-forward than live mode, but still themed. Use tabular numerals and clear timestamps.

### Animation Guidance

Scrubber movement, event row focus, selected-room highlight. Minimal flourish.

### Phaser Implementation Notes

Only on replay/dev routes. Keep separation from `/game/[roomId]`. Pull from replay envelope/public frames, not private agent internals.

### Figma Component Notes

Components: `ReplayScrubber`, `EventIndex`, `ReplayInspectorRail`, `FrameMetadata`, `ArchiveClaimStack`.

### Accessibility/Readability Constraints

Keyboard/scrubber targets must be large. Event rows should remain readable when paused in dense moments.

## Room Inspection Panel

### Purpose

Give focused public context for a selected room without converting live mode into analytics.

### Data Displayed

Room name, occupants, public tasks/hotspots, clue/body/sabotage state, visible evidence refs, relevant recent public events.

### Must Never Display

Hidden roles, private observations, unseen evidence, raw model state, chain-of-thought.

### Layout Guidance

Small side or corner plate connected to the inspected room with a subtle leader line. It should support zoomed room focus, not cover the room floor.

### Typography Guidance

Room name in serif, occupants/tasks in sans-serif. Evidence chips use the same language as the claim/evidence panel.

### Animation Guidance

Panel slides from the inspected side and settles. Task/evidence chips fade in after the room focus lands.

### Phaser Implementation Notes

Driven by inspection mode and public snapshot state. Keep layout deterministic so replay capture is stable.

### Figma Component Notes

Components: `RoomInspectionPanel`, `OccupantList`, `TaskChip`, `RoomEvidenceChip`, `RoomStateBadge`.

### Accessibility/Readability Constraints

Do not stack too many chips. Occupants must be identifiable by name and accent, not color alone.

## Cast Strip

### Purpose

Keep suspect identity, status, and meeting presence readable across live and meeting phases.

### Data Displayed

Portrait, name, status, selected/focused state, speaking indicator, public vote/seat status when phase allows.

### Must Never Display

Hidden roles before reveal, private suspicion scores, private reasoning, model internals.

### Layout Guidance

Bottom strip or meeting side rail. Portraits should look like formal masquerade broadcast headshots, not user avatars or dashboard cards.

### Typography Guidance

Name labels in small sans-serif, optional role/outcome only after public reveal. Use consistent truncation and tooltips only if runtime supports them accessibly.

### Animation Guidance

Speaking portrait gets a restrained glow. Dead/eliminated status desaturates and receives a clear symbol. Meeting seat transition can slide portraits into table order.

### Phaser Implementation Notes

Reuse public player state. Preserve portrait/world identity mapping. Avoid creating per-agent secret visual states.

### Figma Component Notes

Components: `CastStrip`, `PortraitTile`, `SpeakingState`, `EliminatedState`, `FocusedSuspect`, `MeetingSeatOrder`.

### Accessibility/Readability Constraints

Names must fit. Status cannot rely only on opacity or color. Portrait contrast must hold over dark and warm backgrounds.

## Phase Transition Banners

### Purpose

Give cinematic structure to intro, roam, report, meeting, vote, reveal, and resolution transitions.

### Data Displayed

Phase title, concise public instruction/state, timer reset if relevant, location anchor for report/meeting.

### Must Never Display

Private reasoning, hidden roles before reveal, dev analytics, benchmark state.

### Layout Guidance

Full-width but shallow banner or center title that briefly overlays the manor. It should clear quickly so play remains visible.

### Typography Guidance

Serif phase title, sans-serif support line. Use distinct but restrained styles for report, meeting, vote, reveal, and resolution.

### Animation Guidance

Storm-light sweep or candle-dip entrance, short hold, fade/slide out. Report and reveal can use stronger claret/gold treatment.

### Phaser Implementation Notes

Use deterministic phase events and avoid route-level React banners in live mode. Banner depths must not interfere with critical vote/report controls.

### Figma Component Notes

Components: `PhaseBanner`, `ReportBanner`, `MeetingCalledBanner`, `VoteBanner`, `RevealBanner`, `ResolutionBanner`.

### Accessibility/Readability Constraints

No rapid flashing. Keep title readable over all rooms. Support line should be optional on smaller viewports rather than shrinking below readable size.
