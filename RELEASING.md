# Releasing Mastery System / Destroyed Faith

This document describes how to publish an immutable Foundry system ZIP from GitHub. Do **not** force-push or rewrite history.

## Version sequences (independent)

| Product | Where version lives | Sequence |
|---|---|---|
| **Foundry VTT system** (`mastery-system`) | `package.json` + `system.json` | Continues as `0.9.246`, `0.9.247`, … |
| **Destroyed Faith rulebook** (tabletop) | Outside this repo / print pipeline | Independent public sequence (e.g. rulebook `0.9.9`) |

Do **not** put the rulebook version in `package.json` or `system.json`.

## Foundry version policy

- Current Foundry system version: whatever is in `package.json` / `system.json` (today **0.9.246**).
- Tags must be `vX.Y.Z` matching `package.json` / `system.json`.
- Pre-1.0 GitHub Releases are marked **prerelease**.

## What the release workflow does

On push of tag `vX.Y.Z`, [`.github/workflows/release.yml`](.github/workflows/release.yml):

1. Checks out the tagged commit
2. Runs `npm ci` (HTTPS lockfile — no private SSH)
3. Runs `npm run build`
4. Runs `npm test` and `npm run audit:catalog`
5. Validates version consistency (`--tag` + `--require-release-download`)
6. Builds an allowlist ZIP via `npm run release:package`
7. Creates a GitHub Release and uploads `mastery-system-X.Y.Z.zip`

The ZIP contains only runtime files (`system.json`, `template.json`, `dist/**/*.js`, `templates/`, `styles/`, `assets/`, `lang/`, `packs/`, `LICENSE.md`, community/asset license notices, `README.md`, `CHANGELOG.md`). No `src/`, tests, scripts, docs internals, or source maps.

## Switching `download` from branch archive to a release asset

Project policy currently keeps `system.json` `download` on the `main` branch archive (`main.zip`) so installs keep working. When you intentionally publish a tagged release asset instead:

1. On `main`, bump **both** `package.json` and `system.json` to `X.Y.Z`
2. Add `## [X.Y.Z] - YYYY-MM-DD` to `CHANGELOG.md`
3. Set `system.json` `download` to:
   ```
   https://github.com/Destroyed-Faith/masterySystem/releases/download/vX.Y.Z/mastery-system-X.Y.Z.zip
   ```
   Keep `manifest` as:
   ```
   https://raw.githubusercontent.com/Destroyed-Faith/masterySystem/main/system.json
   ```
4. Commit and push to `main`
5. Create and push tag `vX.Y.Z` on that commit (no force)
6. Wait for the Actions workflow to finish — the release asset must exist before clients download it
7. Verify: install via manifest URL in a clean Foundry/Forge setup

There is a short window between pushing `main` and the release job finishing where the download URL may 404; that is expected. Do not point `download` at a version that has no release asset.

## Local checks (no publish)

```bash
npm ci
npm run release:validate          # soft: allows temporary main.zip download by project policy
npm run build
npm test
npm run audit:catalog
npm run release:package           # writes dist-release/mastery-system-X.Y.Z.zip
```

Strict download URL check (release commits / CI on tags):

```bash
node scripts/validate-release-version.mjs --tag vX.Y.Z --require-release-download --zip dist-release/mastery-system-X.Y.Z.zip
```

## Do not

- Publish from an unclean tree
- Ship `src/`, `tests/`, `e2e/`, `scripts/`, generated `reports/`, or `Rules/` in the player ZIP
- Rely on a previously committed `dist/` without rebuilding
- Force-push tags or rewrite release history
