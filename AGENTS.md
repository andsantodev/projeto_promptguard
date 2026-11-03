# AGENTS.md

## About this project

PromptGuard audits a LLM system prompt against a curated library of prompt-injection and jailbreak attacks, returning a 0-100 risk score, per-attack verdicts and mitigation hints. Portfolio project: React + Vite front, FastAPI BFF, OpenRouter for models, Supabase for quota counters only.
Full product context: `docs/PRD.md`.
Design reference: `docs/DESIGN.md`, applied through the `design-taste-frontend` skill.

## Before starting (every session)

1. Read `docs/progress.md` — what happened in the last session
2. Read `docs/feature_list.json` — what is done, what is left
3. Run the verification commands below to confirm the project is healthy

## How to work here

- Pick exactly ONE unfinished feature from `docs/feature_list.json` at a time (WIP=1)
- F001 is the walking skeleton (app shell, screen state toggle, folder structure, test runner) — do not skip ahead to product features before it is done
- F002 extracts the design tokens right after F001, before any screen is built
- Every schema change goes through the Supabase MCP — avoid loose migration SQL outside it
- Never mark a feature done without running its verification command and recording the evidence
- Before marking `done`, run `git diff --stat`, compare the touched files with the feature's `acceptance_criteria`, and justify in `docs/progress.md` any file outside that scope
- Before touching auth, secrets, database or the LLM calls, read `docs/engineering-rules.md`
- The backend is the only place that may hold secrets; the browser never talks to OpenRouter or Supabase
- Document project-specific decisions and facts in `docs/`, not here

## Folder structure

Organized by responsibility (single-page app, no router):

- `src/` — `components/` (screens and UI), `hooks/` (audit execution), `lib/` (API client, types, scoring), `styles/` (design tokens), `test/` (setup)
- `backend/` — `main.py` (FastAPI entrypoint), `routers/`, `services/` (LLM and quota), `data/` (attack library YAML), `tests/`
- `docs/` — product, state and rules
- `sql/` — schema applied through the Supabase MCP

## Definition of Done

**Automatic** (what `verification_command` runs — must finish on its own and fail when something breaks): lint, typecheck, unit tests, API tests. Build runs at the end of the project, not on every feature.

**Judgment** (check before marking done):
- No new dependency without user approval
- No dead, commented or unused code
- Simplest solution that meets the criterion, no premature abstraction
- Every acceptance criterion verified, not just "tests passed"

## Verification commands

```bash
npm run lint        # oxlint --deny-warnings
npm run typecheck   # tsc -b
npm run test:unit   # vitest run
npm run test:api    # pytest in backend/
npm run verify      # all of the above
npm run build       # production build (end of project / release feature)
```

Local dev requires two processes: `npm run dev` (Vite, proxies `/api` to port 8000) and `.venv/bin/uvicorn backend.main:app --reload`.

## Limits (do not do without explicit approval)

- Never commit `.env`, API keys, tokens or any credential
- Never add a new dependency without explicit approval
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `OPENROUTER_API_KEY` to the client, not even behind a `VITE_` prefix
- Never persist user-submitted prompt text, model responses or verdicts — the app is intentionally stateless
- Keep RLS enabled on every new table, with explicit policies; never "allow all" as a shortcut
- Never disable a lint rule or loosen a test to make verification pass

## At the end of every session

1. Update `docs/progress.md` with what was done and verified
   - Keep docs/progress.md entries short (~10 lines: summary, verification, pending,
     next). No code, tables or full logs; detail belongs in verification_evidence and
     commit messages. If the file passes ~300 lines, move older sessions to
     docs/progress-archive.md.
2. Update `docs/feature_list.json`
3. Update `docs/session-handoff.md` with current state and next suggested feature
4. Commit only if the project is in a safe state to resume
