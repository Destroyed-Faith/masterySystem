# Baseline — public release cleanup

Historical note recorded while preparing the public-repo cleanup (around Foundry system **0.9.241** / **0.9.242**).

## Install / lockfile

| Scenario | Result |
|---|---|
| Prior `package-lock.json` with `git+ssh://git@github.com/foundry-vtt-types/…` | `npm ci` fails in clean clones / GitHub Actions without a private SSH key |
| Current lockfile with `git+https://github.com/foundry-vtt-types/…` (same commits) | `npm ci` succeeds without private credentials |

No `git+ssh://` URLs remain in `package-lock.json`.

## Manifest / docs (before cleanup)

- README claimed `0.0.68 (Alpha)` and Foundry v13 while `system.json` declared Foundry **14**
- `download` pointed at `…/archive/refs/heads/main.zip` (source tree, not a release asset)
- Release workflow rsynced nearly the whole repo; no build/test gate

## Install path (current policy)

`system.json` `download` intentionally remains the `main.zip` archive URL so Forge/manifest installs keep working. Packaging can still produce `mastery-system-X.Y.Z.zip` for a future tagged release; see `RELEASING.md`.
