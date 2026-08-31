# AGENTS.md

## About this project
PromptGuard is a portfolio project — a security/red-teaming auditor for LLMs. It runs a curated library of prompt injection and jailbreak attacks against a user-submitted System Prompt, producing a risk score and per-attack verdicts with mitigation suggestions.
Full product context: see `docs/PRD.md`.
Design reference: `docs/design-brief.md` (pending). All layout and visual decisions are made with the `design-taste-frontend` skill applied to that brief; screens are not agent-generated. See PRD §8.

## Before starting (every session)
1. Read progress.md — what happened in the last session
2. Read feature_list.json — what's done, what's left
3. Run the verification commands below to confirm the project is in a healthy state

## How to work here
- Pick exactly ONE unfinished feature from feature_list.json at a time (WIP=1)
- The first feature (F001) is the app's walking skeleton (page shell, modal mechanics, state toggle between input and results views) — do not skip ahead to product features before it's done
- F002 (design system extraction) comes right after F001, before any page/product feature that consumes it — do not build screens with generic/default styling and retrofit the design system later
- All schema creation/changes go through the Supabase MCP — avoid loose migration SQL outside of it
- Never mark a feature done without running its verification command and recording the evidence
- Document project-specific decisions and facts in /docs, not here

## Verification commands
- Install: `npm install`
- Test (unit): `npm run test:unit`
- Build: `npm run build`
- Lint: `npm run lint`
- Typecheck: `npx tsc --noEmit`

## Limits (never do without explicit approval)
- Never commit `.env`, API keys, tokens, or other credentials
- Enable RLS on every new Supabase table; never expose the `service_role` key on the frontend/client-side; every access policy must be explicit — never "allow all" as a shortcut
- Never collect or store third-party credentials or API keys, and never add a webhook/external-endpoint attack mode — this was deliberately removed from scope for security/abuse reasons (see PRD §4, Non-goals)
- Don't change production dependencies or push directly without confirming first

## End of every session
1. Update progress.md with what was done and verified
2. Update feature_list.json
3. Update session-handoff.md with the current state and next suggested feature
4. Only commit if the project is left in a safe, resumable state
