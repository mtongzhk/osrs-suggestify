# OSRS Suggestify — Product Requirements Document

> Status: Scaffolding phase. Sources: `OSRS_Level1_Specification.pdf` (primary) and
> `OSRS_Suggestify_User_Story_List.pdf` (story decisions). Both are preserved unmodified in
> `docs/`.

## 1. Project description

OSRS Suggestify is a desktop companion app for Old School RuneScape (OSRS) players who either
hyperfocus on one activity for weeks and burn out, or lose hours of real-life time because they
don't watch the clock.

The app connects to a player's OSRS account, detects what the player is currently doing in the
game, and keeps a running timer for that activity and for the whole play session. When the
player has been on one activity for too long, or reaches a play-time limit they set themselves,
the app alerts them. When it advises a switch, it suggests other activities drawn from the
player's recent history and the content their account has not yet completed, so the player
doesn't have to research what to do next.

The three goals, in priority order: (1) tell players to stop or switch, (2) say what to do next,
(3) help players limit how much they play.

**The app only notifies and advises — it never controls the game or forces the player to stop.**
It must follow OSRS rules and only read account information that is publicly or officially
available.

## 2. User constituencies

One user type — an OSRS player — with two roles drawn from the client's personas:

- **Balance Seeker** (Rick Smith, 35, software engineer): wants alerts when repeating the same
  task too long, suggestions needing no research, and a quick glanceable timer.
- **Time Limiter** (Brendan Liviery, 30, auto-shop owner): wants a self-set session limit, a
  clear alert at the limit, and a way to get off the game without losing track of time.

Both roles share the same app and features. Players are assumed to be adults with a regular
OSRS account, comfortable installing a desktop program, on a personal single-user device with
one OSRS account per user.

## 3. Usage context

- **Platform:** desktop (Windows, macOS, Linux) running next to the OSRS game client. Mobile
  companion may be considered later — not in scope now.
- **Environment:** home, mostly evenings/weekends. The app runs in the background or a small
  window and must be readable in a quick glance; players are often busy in-game, so alerts
  should be noticeable but not disruptive, and snoozable.
- **Connectivity:** internet required (game and account data are online). No offline mode.
- **Session pattern:** sessions range from under an hour to many hours; the same activity may
  span days/weeks across sessions, so history must persist between sessions.

## 4. Confirmed requirements — accepted user stories

Nine stories were accepted from the complete list of 29. The Level 1 Specification is the
primary source; stories below are the spec's edited versions.

| ID | Story | Linked feature |
| --- | --- | --- |
| US-1 | As a Balance Seeker, I want to connect my OSRS account to the app by entering my username so that the app can read my account progress and tell what I've completed. | 1.1 Connect to OSRS account |
| US-2 | As a Balance Seeker, I want to have the app detect which activity I am doing in the game automatically so that I don't have to log my activity by hand while I'm playing. | 1.2 Detect current activity |
| US-3 | As a Balance Seeker, I want to glance at the app and see how long I have been doing my current activity so that I can tell quickly whether I've been on one task too long. | 2.2 Show elapsed time at a glance |
| US-4 | As a Balance Seeker, I want to be alerted when I have been doing the same activity for longer than my limit so that I can switch to something different before I burn out. | 5.1 Alert when on one activity too long |
| US-5 | As a Time Limiter, I want to set a limit on how long I play in one session so that I decide in advance how much of my day goes to the game. | 6.2 Set session time limit |
| US-6 | As a Time Limiter, I want to receive an alert when my session limit is reached so that I remember to stop and spend time on my family and other things. | 5.2 Alert when session limit is reached |
| US-7 | As a Balance Seeker, I want to get suggestions for new activities based on what I've been doing and what my account hasn't completed so that I know what to do next without researching it myself. | 4.1 Suggest next activities |
| US-8 | As a Balance Seeker, I want to see a short reason for each suggested activity so that I understand and trust why the app suggests it. | 4.2 Explain why an activity is suggested |
| US-9 | As a Time Limiter, I want to snooze an alert for a few minutes so that I can finish a task that I'm in the middle of before I stop. | 5.3 Snooze an alert |

### Rejected / deferred stories (not in scope)

Stories 10–29 from `OSRS_Suggestify_User_Story_List.pdf` were rejected or deferred. Notable
exclusions: a general session timer display (redundant), social/leaderboard features, closing
the game at the limit, step-by-step guides, history review screens, charts, dark mode
(Surface-layer concern), mobile app, premium purchases, gold/hour tracking, money-making
recommendations, partner alerts, data export, and account sign-in/sync (settings persist locally
on the user's device).

## 5. Technical architecture

### Options considered

| | Electron | Tauri |
| --- | --- | --- |
| Core | Node.js + Chromium | Rust core + OS-native webview |
| Bundle size / memory | Large (~150 MB+, hundreds of MB RAM) | Small (~10 MB, low RAM) |
| Language | JavaScript/TypeScript end-to-end | Frontend JS/TS + Rust backend |
| OS-level access | Full Node.js APIs; easy to spawn helper processes, read windows, screen capture | Rust APIs; powerful but steeper learning curve |
| Ecosystem / hiring pool | Very large, well-documented | Growing, smaller |
| Fit for this project | Strong — detection work likely needs Node-side OS APIs and quick iteration | Viable, but Rust adds friction for a small team |

### Decision: **Electron** (pinned at v45.3.2)

**Rationale:**

1. **Single language.** The whole app — main process, services, and renderer — can be
   JavaScript/TypeScript. No Rust toolchain required, which matters for a small student team.
2. **Node.js in the main process** gives direct access to OS APIs (process inspection, screen
   capture libraries, spawning helper scripts) that the unresolved activity-detection work will
   likely need, with fast iteration and a large ecosystem of npm packages.
3. **Security model fits the spec.** `contextIsolation` + `nodeIntegration: false` + a narrow
   `contextBridge` preload API keeps the renderer sandboxed while the main process owns all
   privileged operations (account fetching, timers, detection).
4. **Cross-platform packaging** for Windows/macOS/Linux is mature via electron-builder
   (to be added when the first feature lands).

**Trade-off accepted:** larger binary and higher memory use than Tauri. For a single-user
companion app this is an acceptable cost for development speed and ecosystem access. Tauri
remains the fallback if binary size or memory becomes a problem.

### Process layout

```
┌─────────────────────────────────────────────┐
│ Renderer (src/renderer) — web UI, glanceable │
│   ↕ contextBridge IPC (src/preload)          │
├─────────────────────────────────────────────┤
│ Main process (src/main)                      │
│   ├── services/  activity detection, timers, │
│   │             suggestions, alerts          │
│   ├── data/      local persistence (settings,│
│   │             history)                     │
│   └── shared/    constants shared both ways  │
└─────────────────────────────────────────────┘
```

- All privileged work (network calls to OSRS data sources, detection, persistence) lives in the
  main process; the renderer only displays state and sends intents (set limit, snooze, etc.).
- History and settings persist locally (JSON or SQLite under the app's userData directory);
  no accounts or sync for v1.

## 6. Constraints

- Must comply with OSRS rules: only read publicly/officially available account information;
  never interact with or alter the game client.
- Desktop only for v1 (Windows, macOS, Linux); no mobile.
- Internet connection required; no offline mode.
- Single user, one OSRS account per install; personal device.
- Alerts must be noticeable but non-disruptive and snoozable (players are often mid-combat).
- History must persist across sessions (activities can span days/weeks).
- Glanceable UI: readable at a glance while the player is in-game.
- Notifications/alerts only — the app must never force the player to stop or control the game.

## 7. Data sources (to be validated)

- **Account progress / completed content** (needed by US-1, US-7): OSRS has no single official
  "full account progress" API. Candidate sources include community APIs and the official
  Hiscores endpoints; coverage of quests/bosses/minigames varies. Must be investigated.
  - **Decision (T1.1):** skill levels/XP and activity scores (boss KC, clues, minigames)
    are fetched from the official Jagex Hiscores endpoint
    (`secure.runescape.com/m=hiscore_oldschool/index_lite.json`) — public, read-only, no
    credentials. Quest/diary/collection-log completion is NOT covered by Hiscores; a
    supplementary source (e.g. OSRS Wiki WikiSync or a community API) is still required
    before US-7 can reason about "content not yet completed" (see §8 Q2).
- **Current activity detection** (US-2): **no confirmed integration exists.** See below.

## 8. Unresolved questions

1. **How to detect the player's current in-game activity (US-2)?** OSRS exposes no official API
   for live activity. Candidate approaches, none validated:
   - Screen capture + OCR of the game window (fragile, OS-specific, may raise ToS questions).
   - Monitoring OS window/process state (e.g. detecting which client is focused) — likely too
     coarse to distinguish activities.
   - A companion client plugin (e.g. RuneLite ecosystem) reporting activity over local
     IPC/HTTP — most promising but depends on third-party client adoption and its rules.
   - Any approach must be checked against OSRS/Jagex rules before implementation.
2. **What data source provides "content the account hasn't completed"?** Need a reliable,
   rule-compliant source covering activities the suggestion engine can reason about
   (quests, bosses, skills, minigames, etc.).
3. **What counts as "an activity"?** Granularity is undefined — e.g. is "combat" one activity
   or is each boss/bloodveld separate? Affects detection, timers, and suggestions.
4. **Where do the per-activity time limit and session limit get configured, and what are the
   defaults?** (US-4, US-5)
5. **How should alerts be delivered?** In-app toast, OS notification, sound — the spec defers
   this to design after the client confirms the alert method (rejected story 24).
6. **Suggestion algorithm:** how to weight recent history vs. incomplete content; how many
   suggestions to show; whether suggestions repeat.
7. **Alert snooze duration:** "a few minutes" — exact options (e.g. 5/15/30 min) TBD.
8. **Persistence format and location** for settings/history — **decided (T0.3):** plain JSON
   files (`settings.json`, `history.json`) under Electron's `userData` directory, written
   atomically; corrupt files are quarantined and defaults restored. Revisit SQLite if history
   volume demands it.
9. **Packaging/distribution:** how will players install the app (unsigned binaries, code
   signing, app stores)?
