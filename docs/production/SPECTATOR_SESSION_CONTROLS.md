# Spectator Session Controls

## Viewer Experience

The runtime opens the connected manor at tick zero in local demo mode. The viewer
selects **Start night** before anything advances. The default half-speed playback
gives the cast more screen time without changing the mock's tick-by-tick events.
Pause, resume, single-tick advance, and 0.25x / 0.5x / 1x / 2x playback are available
for the local rehearsal. The demo is explicitly labeled: it is the existing seeded
mock, not a claim that a model-backed match is running.

The header shows demo time and the next phase countdown. The phase track highlights
the current public phase. The cast strip shows full names on two lines, public room
locations and speaking / eliminated states. Selecting a guest follows their public
location across rooms; selecting a room or returning to Estate releases the follow.
Reports, sabotage and meetings retain their directed presentation priority.

Meeting subtitles reuse the existing public subtitle formatter, so an actual
discussion turn stays readable even though surveillance feeds are unavailable in
the meeting scene. The active speaker is identified in the same cast strip.

Public activity is an optional five-event log, not a live analytics panel. Room
inspection, surveillance, sound and fullscreen remain runtime controls.

## Ownership

- `session/DemoPlaybackClock.ts` schedules the local mock only. Partial ticks survive
  pause, resume and speed changes. Disconnect clears the timer.
- `session/demoTimeline.ts` describes the pre-existing 28-tick mock phase cycle.
  The demo transition sequence, RNG, events and replay frames are unchanged.
- `session/sessionPresentation.ts` produces clock and phase labels without reading
  private state or assuming a live server's phase deadline.
- `ui/SpectatorSessionHud.ts` owns one persistent HUD for every content scene. It
  also advances the archive cursor during playback; it never edits replay frames.
- `ui/ObservationHud.ts` owns the DOM controls over the Phaser canvas. The web app
  remains a thin mount and connection-status shell.
- `directors/followPresentation.ts` derives room focus exclusively from public
  player locations and yields to directed events.
- `ui/publicActivity.ts` uses an explicit event allowlist. Unknown events, role
  assignments, raw proposals and private reasoning are not rendered.

The world camera uses a reserved viewport below the controls and above the cast,
including on mobile. Meeting arrival is anchored to one conversation instead of
restarting on every speaker change. Public cast positions are distributed across
two rows around the existing procedural grand-hall prop key, which now paints a
table. Phase-specific reveal staging still updates without restarting the entrance.
These are client presentation changes, not engine movement or voting changes.
The redundant full-room seal banner is hidden during ordinary lit meetings; the
room-status label still shows the seal, and blackout / sabotage alerts remain.

## Live And Replay Boundaries

An authoritative live match has a server-tick display and **Live match** status.
It does not get local start, pause, speed or seek controls. The current spectator
protocol does not supply an authoritative wall-clock phase deadline or operator
authorization, so the HUD does not invent either. Authorized server administration
remains separate; this work does not add an unauthenticated match-control endpoint.

Replay has play / pause, previous / next frame and a frame scrubber. Stepping no
longer snaps back on unrelated FPS updates, while a newly received seek snapshot
still resynchronizes the cursor. Rewinding restarts presentation blocking. Replay
data, engine events, outcomes and fairness metrics are never rewritten by viewing.

## Validation

Client tests cover start gating, partial-tick pause / resume, speed changes, cleanup,
56 identical automatic-versus-manual mock snapshots, camera following, meeting
priority, stable meeting entrances, visible-floor and non-overlapping cast positions, replay cursor
and same-tick seek compatibility, honest live permissions, and public-log privacy.

Browser tests exercise session controls at 1280x820, 1920x1080 and 390x844. They
also cover meeting control persistence and visible replay playback / scrubbing.
Use Playwright's clock fast-forward for transport tests: replaying every animation
frame during an artificial hour-long clock jump adds unnecessary GPU work.

Visual QA captures cover ready, estate, guest-follow, surveillance and meeting views
at 1280x820, 1920x1080 and 390x844, plus `/dev/play?view=replay` at 1280x820.
The captures are ignored local QA artifacts, not runtime assets. The in-app browser
also smoke-checks Start, Pause, the ticking clock and public guest following.
Full names, clock, controls and the manor are checked for overlap; ordinary meeting
seals no longer cover faces, and the back row clears the hall's upper wall.

## Do Not Change

- Do not route local playback controls to an authoritative connection.
- Do not infer live countdowns from demo timing or model latency.
- Do not expose private roles, chain-of-thought, prompts or hidden agent status.
- Do not change agent budgets, engine phases, win conditions or fairness thresholds
  to accommodate presentation.
- Do not duplicate session chrome in each scene or move it into a React dashboard.
- Do not treat these approved procedural placeholders as final production art.
