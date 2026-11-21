# OSRS Suggestify

A desktop companion app for Old School RuneScape (OSRS) players. It connects to a player's OSRS
account, detects what activity the player is currently doing, keeps a running timer for that
activity and the whole play session, alerts the player when they have been on one activity too
long or when their self-set session limit is reached, and suggests what to do next — chosen from
the player's recent history and the content their account has not yet completed.

The app only **notifies and advises**. It never controls the game or forces the player to stop,
and it only reads account information that is publicly or officially available, per OSRS rules.

This repository is currently in the **scaffolding phase** — the project structure and
documentation exist, but no features are implemented yet. See `docs/` for details.

## Documentation

| File | Contents |
| --- | --- |
| `docs/OSRS_Level1_Specification.pdf` | Analyst's Level 1 specification (primary requirements source) |
| `docs/OSRS_Suggestify_User_Story_List.pdf` | Complete list of 29 user stories with accept/reject decisions |
| `docs/PRD.md` | Product requirements document: description, architecture, requirements, open questions |
| `docs/TASKS.md` | Development tasks mapped to the nine accepted user stories |
| `docs/WORKSPACE_RULES.md` | Naming, branching, commit, PR, and review conventions |

## Accepted scope

Nine user stories were accepted for the first version (full text in `docs/PRD.md`):

- **US-1** Connect OSRS account by username
- **US-2** Automatic in-game activity detection
- **US-3** Glanceable elapsed-time display for the current activity
- **US-4** Alert when one activity exceeds the player's limit
- **US-5** Set a session play-time limit
- **US-6** Alert when the session limit is reached
- **US-7** Suggest next activities from recent history + incomplete account content
- **US-8** Show a short reason for each suggestion
- **US-9** Snooze an alert for a few minutes

All other stories in the user story list were rejected or deferred. See `docs/PRD.md` for the
rationale and `docs/TASKS.md` for the task breakdown.

## Tech stack

- **Framework:** [Electron](https://www.electronjs.org/) (v45) — chosen over Tauri; see
  `docs/PRD.md` § Technical architecture for the comparison and rationale.
- **Language:** JavaScript (ES modules), no build step for the scaffold.
- **Target platforms:** Windows, macOS, Linux.

## Folder structure

```
osrs-suggestify/
├── docs/                  # Specifications, PRD, tasks, workspace rules
│   ├── OSRS_Level1_Specification.pdf
│   ├── OSRS_Suggestify_User_Story_List.pdf
│   ├── PRD.md
│   ├── TASKS.md
│   └── WORKSPACE_RULES.md
├── src/
│   ├── main/              # Electron main process (app lifecycle, services)
│   ├── preload/           # contextBridge preload script (secure renderer IPC)
│   ├── renderer/          # Web UI loaded in the BrowserWindow
│   ├── shared/            # Constants/types shared by main and renderer
│   ├── services/          # Feature services: activity detection, timers, suggestions
│   └── data/              # Local persistence (settings, history)
├── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- **Node.js 20 LTS or later** (includes npm). Electron 45 bundles its own Node for the app
  itself; Node is only needed for development.
  - Not currently installed on this machine — install via your preferred method
    (e.g. `brew install node`, nvm, or the official installer) before running the app.
- An OSRS account for real-data testing (not required to run the scaffold).

## Local setup

```bash
# 1. Install dependencies (downloads the Electron binary)
npm install

# 2. Launch the app
npm start
```

`npm run dev` is an alias for `npm start` during the scaffold phase; it will be split into a
watch-mode workflow once a bundler is introduced.

## Known technical dependency (unresolved)

**Automatic OSRS activity detection (US-2) has no confirmed integration.** OSRS does not
provide an official API that reports the player's current in-game activity. Candidate approaches
(e.g. screen capture / OCR, OS window monitoring, a companion client plugin, or community data
APIs) all require investigation and must be validated against OSRS's rules before use. Do not
assume any integration exists — see `docs/PRD.md` § Unresolved questions.
