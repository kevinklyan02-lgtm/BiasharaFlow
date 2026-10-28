# Contributing and Working Rules

## Non-negotiable rules
1. **The SRS is the contract.** No invented endpoints, fields or behaviour. Anything unclear goes in `docs/OPEN_QUESTIONS.md`, not into guesses hidden in code.
2. **Nothing is committed unverified.** Before every commit: `npm run check` (lint, typecheck, test, build) passes **and** the changed feature has been exercised in the browser. If it fails, fix it; never commit broken work or skip hooks.
3. **One commit/push per phase gate at minimum**, from a green state, following [docs/ROADMAP.md](docs/ROADMAP.md). Report honestly what was and wasn't verified.
4. **No secrets or real data.** `.env` is ignored; only `.env.example` is committed. All figures are simulated and labelled so.
5. **No `fetch` in components.** All server access goes through `src/api` and feature hooks.
6. **No `any`.** TypeScript is strict; response shapes come from `src/api/types.ts`.
7. **Money is an integer in KES**, formatted only via `lib/format.ts`.
8. **Every error path has UI.** Loading, empty, error and success states for each screen.
9. **Accessible and mobile-first.** Works at 360px, keyboard operable, labelled inputs.
10. **Docs ship with code.** If behaviour, config or endpoints change, update the relevant doc in the same commit.

## Git workflow
- Branches: `phase/<n>-<slug>` for phases, `fix/<slug>`, `docs/<slug>`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`). Small and focused.
- Merge into `main` only when the phase gate is green. Tag `phase-<n>` and push.
- Never force-push `main`.

## Code style
- Prettier and ESLint are authoritative; run `npm run format`.
- Components: function components, one per file, PascalCase. Hooks `useX`. Feature code stays inside its `features/<name>` folder.
- Prefer composition and small components; extract shared UI to `src/components` only on the second use.
- Comments explain why, not what.

## Tests
- Business rules: unit tests next to the code (`*.test.ts`).
- Screens: React Testing Library with the mock adapter.
- A bug fix includes a test that failed first.

## Changing the API contract
1. Open a PR that edits `docs/API_CONTRACT.md` first (tagged both pairs).
2. After agreement, update `types.ts`, `schemas.ts`, `live.ts`, the mock and tests in one PR.
3. Never change a path, field name or format unilaterally (SRS section 10).

## Definition of done (per phase)
- [ ] Acceptance checks in the roadmap pass
- [ ] `npm run check` green
- [ ] Manually verified in the browser (desktop and 360px)
- [ ] Docs updated
- [ ] Committed, pushed and tagged
