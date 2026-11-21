# OSRS Suggestify — Workspace Rules

Conventions for everyone working in this repository. These apply to all branches and PRs.

## 1. Branching

- `main` is the protected integration branch. It always builds and reflects reviewed work.
- Never commit directly to `main`. All changes go through a branch + pull request.
- Branch naming: `<type>/<short-description>` where `<type>` is one of:
  - `feature/` — new functionality (e.g. `feature/us-3-activity-timer`)
  - `fix/` — bug fixes
  - `docs/` — documentation-only changes
  - `chore/` — tooling, dependencies, config (e.g. `chore/add-eslint`)
  - `refactor/` — restructuring without behavior change
- Keep branches short-lived; rebase or merge `main` regularly.
- One user story (or one task from `docs/TASKS.md`) per branch where practical.

## 2. Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short imperative summary>

<optional body explaining why, wrapped at ~72 chars>
```

- **Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`.
- **Scope** (optional): the area touched, e.g. `main`, `renderer`, `services`, `data`, `docs`.
- Summary: imperative mood, lowercase after the colon, no trailing period, ≤72 chars.
- Reference the user story where relevant: `feat(services): add session timer (US-5)`.
- One logical change per commit; don't mix feature code with unrelated formatting.

Examples:

```
feat(main): scaffold electron app with secure preload bridge
docs: add PRD, task list, and workspace rules
fix(renderer): correct elapsed-time display rollover at 60 minutes
```

## 3. Pull requests

- Open a PR for every branch before merging to `main`.
- PR title follows the same convention as commit messages.
- Every PR description must include:
  - **What** changed and **why** (link the user story / task ID from `docs/TASKS.md`).
  - How it was tested (commands run, platforms checked).
  - Screenshots for any UI change.
  - Notes on OSRS-rule implications if the change touches account data or game detection.
- Keep PRs small and reviewable; split large changes.
- At least one approval required before merge. The PR author cannot approve their own PR.
- CI (once added) must pass: lint, tests, and build.

## 4. Code conventions

- **Language:** JavaScript (ES modules) for now; TypeScript may be adopted by team decision —
  if so, update this file and `docs/PRD.md` together.
- **Electron security (non-negotiable):**
  - `nodeIntegration` stays `false`; `contextIsolation` stays `true`.
  - All Node/Electron APIs live in the main process; the renderer reaches them only through the
    narrow `contextBridge` API in `src/preload/`.
  - Never expose raw `ipcRenderer`, filesystem, or network access to the renderer.
- **File naming:**
  - JS modules/services: `camelCase.js` or `kebab-case.js` — pick one per directory and be
    consistent (current scaffold uses `camelCase` for files).
  - Directories: lowercase, kebab-case if multi-word (`activity-detector/`).
  - React/Vue components (if a UI framework is added): `PascalCase.js`.
- **Shared code:** anything used by both main and renderer goes in `src/shared/` and must be
  free of Node- or DOM-only APIs.
- **Secrets:** never commit `.env` files, tokens, or credentials. Use `.env.example` for
  templates. The app must never store OSRS passwords.
- **Comments:** explain *why*, not *what*; don't add comments unless needed.

## 5. Review procedures

- Reviews check, at minimum:
  1. Correctness against the user story's acceptance criteria in `docs/TASKS.md`.
  2. Electron security rules above.
  3. OSRS-rule compliance for anything touching account data or detection.
  4. Cross-platform safety (no macOS/Windows-only assumptions without guards).
- Requested changes must be addressed or explicitly discussed before re-review.
- Docs (`docs/*.md`) changes get a lighter review but still require a PR.
- The two source PDFs in `docs/` are **immutable** — never edit, rename, or delete them.

## 6. Definition of done

A task is done when:

- Its acceptance criteria in `docs/TASKS.md` are met.
- `npm start` runs cleanly with no console errors.
- Relevant verification (lint/tests — once tooling exists) passes.
- The PR is reviewed and approved, and `docs/TASKS.md` / `docs/PRD.md` are updated if scope or
  decisions changed.
