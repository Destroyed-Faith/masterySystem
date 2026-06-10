# Playwright E2E Tests (Foundry VTT)

Browser tests against a **live** Foundry world running the Mastery System. They complement `npm test` (Vitest unit tests) by exercising combat UI hooks on a real canvas.

## Security — credentials stay local

**Never commit `e2e/.env`.** It is listed in `.gitignore` (including `e2e/.env.*`); only `e2e/.env.example` is tracked.

Put Forge URL, game link, and passwords **only** in your local `e2e/.env`. Commits and pushes contain the Playwright harness and the example template — no secrets.

## Prerequisites

1. **Foundry V13** with Mastery System installed (local or Forge).
2. A dedicated **E2E test world** (do not use your live campaign).
3. On the **active scene**: at least **two tokens** with actors (e.g. one PC + one NPC).
4. Log in as **GM** (combat setup and actor updates require GM permissions).

## Setup

```bash
npm install
npx playwright install chromium
cp e2e/.env.example e2e/.env
```

Edit `e2e/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `FOUNDRY_URL` | yes | Server root, e.g. `http://localhost:30000` |
| `FOUNDRY_GAME_URL` | no | Direct `/game` URL — skips join flow |
| `FOUNDRY_WORLD` | no | World name on the join/setup screen |
| `FOUNDRY_USERNAME` | no | Default `Gamemaster` |
| `FOUNDRY_PASSWORD` | no | User password if configured |
| `FOUNDRY_ADMIN_PASSWORD` | no | Self-hosted admin key |

### Fastest workflow (Forge)

1. Open your E2E world in Chrome as GM on Forge.
2. Copy the full game URL from the address bar into `FOUNDRY_GAME_URL` in **local** `e2e/.env`.
3. Run `npm run test:e2e` (or `test:e2e:headed` to watch the browser).

The agent can run Playwright on your machine as long as `e2e/.env` exists locally — it will not be committed when you push.

## Run

```bash
npm run test:e2e          # headless
npm run test:e2e:headed # visible browser
npm run test:e2e:ui     # Playwright UI mode
```

HTML report: `npx playwright show-report`

## What is covered

| Spec | Checks |
|------|--------|
| `system-load.spec.ts` | System id, version, GM, scene, token count |
| `combat-smoke.spec.ts` | Combat start, end-turn button, HP damage, attack card, damage dialog |

Tests use the Foundry API inside `page.evaluate()` for reliable setup (no canvas clicking). The damage-dialog test mocks `Roll` to force a hit.

## Forge notes

- Use `FOUNDRY_GAME_URL` with your Forge game link.
- Keep the world open or accept that the join flow may need your Forge credentials.
- Prefer a small test world with only the two tokens required.

## CI

E2E is **opt-in**: without `e2e/.env`, Playwright tests are skipped. For CI you would need a headless Foundry instance (not included in this repo).
