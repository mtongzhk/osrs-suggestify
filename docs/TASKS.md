# OSRS Suggestify — Development Tasks

Tasks are mapped to the nine accepted user stories from the Level 1 Specification. Each task
lists acceptance criteria (AC). Work is ordered roughly by dependency: foundations first, then
account/detection, then timers/alerts, then suggestions. Tasks are scaffolded for the Electron
architecture described in `docs/PRD.md`.

**Legend:** `[P]` = can proceed in parallel with adjacent tasks once foundations land.

---

## Phase 0 — Foundations

### T0.1 Project scaffold and dev workflow
- Create Electron project structure (`src/main`, `src/preload`, `src/renderer`, `src/shared`,
  `src/services`, `src/data`) per `docs/PRD.md`.
- `package.json` with `npm start` / `npm run dev` scripts; `.gitignore`; README.
- **AC:** `npm install && npm start` launches a window on Windows, macOS, and Linux; repo
  contains no secrets or build artifacts; `docs/` PDFs remain unmodified.

### T0.2 IPC bridge and app state store
- Define a typed IPC contract: preload exposes a narrow `suggestify` API via `contextBridge`;
  main process owns all privileged operations.
- Minimal reactive state store so renderer can subscribe to timer/alert state.
- **AC:** renderer can call a main-process function and receive a response; renderer cannot
  access Node APIs (`nodeIntegration: false`, `contextIsolation: true` verified); state updates
  propagate to the renderer.

### T0.3 Local persistence layer
- Settings and history storage under Electron `userData` (format TBD — see PRD unresolved Q8).
- **AC:** app writes and reads settings/history across restarts on all three OSes; corrupt/missing
  file is handled gracefully without data loss of defaults.

---

## Phase 1 — Account connection and activity detection

### T1.1 US-1 — Connect OSRS account by username
- UI field to enter OSRS username; validate and store it; fetch publicly available account
  progress from a chosen data source.
- **AC:** entering a valid RSN persists it across restarts; app displays fetched account progress
  (or a clear error for invalid username / network failure); no credentials or passwords are
  requested or stored.

### T1.2 US-2 — Automatic activity detection *(blocked: unresolved — see PRD §8)*
- **Prerequisite investigation task:** evaluate detection approaches (screen capture/OCR,
  window monitoring, companion client plugin) against OSRS rules and feasibility; document
  decision in PRD.
- Implement chosen detector emitting `{ activityId, startedAt }` events to the main process.
- **AC:** with the game running, the app reports the player's current activity without manual
  logging; activity transitions are detected within an agreed tolerance; detector failure
  degrades gracefully (app keeps last known state and shows a warning, never crashes).

### T1.3 Activity model and normalization
- Define the activity taxonomy (what counts as "an activity" — PRD unresolved Q3) and map raw
  detector output to it.
- **AC:** every detected activity maps to a stable ID usable by timers, alerts, and suggestions;
  unknown/unmapped activities are handled explicitly (not silently dropped).

---

## Phase 2 — Timers and glanceable display

### T2.1 US-3 — Glanceable elapsed-time display `[P]`
- Always-visible (or easily summoned) display of time spent on the current activity; session
  elapsed time may share the view.
- **AC:** current activity name and elapsed time are readable at a glance while the player is
  in-game; timer survives app restart mid-session (per persistence rules); updates at least
  once per second without UI jank.

### T2.2 US-5 — Set session time limit `[P]`
- UI to set a session length limit (options/values TBD — PRD unresolved Q4); persisted.
- **AC:** user can set, change, and clear a session limit; limit survives restarts; reaching the
  limit is measured from session start, not app launch.

### T2.3 Per-activity time limit configuration `[P]`
- UI to configure the "too long on one activity" threshold used by US-4 (default TBD).
- **AC:** threshold is configurable per user (global or per-activity — decide and document);
  persisted across restarts.

---

## Phase 3 — Alerts

### T3.1 US-4 — Alert when on one activity too long
- Trigger alert when current-activity elapsed time exceeds the configured threshold.
- **AC:** alert fires once per over-limit episode (does not spam every tick); re-arms correctly
  after the player switches activity and returns; alert content names the activity and elapsed
  time.

### T3.2 US-6 — Alert when session limit is reached
- Trigger alert when session elapsed time reaches the US-5 limit.
- **AC:** alert fires at the limit; session timer continues or pauses per documented decision;
  behavior after dismissal is defined (e.g. reminder cadence) and does not nag uncontrollably.

### T3.3 US-9 — Snooze an alert
- Snooze action on alerts for "a few minutes" (exact durations TBD — PRD unresolved Q7).
- **AC:** user can snooze any alert; while snoozed the alert does not re-fire; after snooze
  expiry the alert re-evaluates current state (e.g. still over limit → alert again); snooze
  duration is visible/chosen by the user.

### T3.4 Alert delivery mechanism
- Implement chosen delivery channel (in-app toast / OS notification / sound — PRD unresolved Q5,
  pending client confirmation) shared by US-4/US-6.
- **AC:** alerts are noticeable but non-disruptive during gameplay; work when the window is
  unfocused/minimized; respect OS notification permissions on all three platforms.

---

## Phase 4 — Suggestions

### T4.1 US-7 — Suggest next activities
- Generate suggestions from (a) recent activity history and (b) account content not yet
  completed; show a list of suggested activities.
- **AC:** suggestions appear when the app advises a switch (and/or on demand — decide UX);
  they are drawn only from content relevant to the player's account; at least one suggestion is
  produced whenever the player has incomplete content; completed-only accounts handled gracefully.
- **Depends on:** T1.1 (account progress), T1.3 (activity model), persistence (T0.3).

### T4.2 US-8 — Explain each suggestion
- Each suggestion displays a short reason (e.g. "you haven't done this boss", "you played this
  last week").
- **AC:** every suggestion shown has a non-empty, human-readable reason tied to real account or
  history data; reasons update if underlying data changes.

### T4.3 Suggestion ranking/dedup rules
- Define and implement weighting between recency history and incomplete content; cap suggestion
  count; avoid repeating dismissed-equivalent suggestions within a session.
- **AC:** ranking rules are documented; same inputs produce stable ordering; no duplicate
  suggestions in one list.

---

## Phase 5 — Hardening

### T5.1 Cross-platform verification
- **AC:** all nine stories verified working on Windows, macOS, and Linux (or documented
  platform-specific limitations agreed with the client).

### T5.2 Packaging
- Add electron-builder (or chosen tool) config; produce installers per OS.
- **AC:** a user can install and run the app without a dev environment; auto-update decision
  documented.

### T5.3 OSRS rules compliance review
- Audit all account-data access and detection mechanisms against OSRS/Jagex rules.
- **AC:** written confirmation that no rule violations exist; any gray-area feature is flagged
  to the client before release.
