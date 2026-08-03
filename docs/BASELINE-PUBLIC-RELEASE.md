# Baseline — public release cleanup

Recorded while preparing `chore/public-release-cleanup` (version **0.9.241**).

## Install / lockfile

| Scenario | Result |
|---|---|
| Prior `package-lock.json` with `git+ssh://git@github.com/foundry-vtt-types/…` | `npm ci` fails in clean clones / GitHub Actions without a private SSH key |
| Current lockfile with `git+https://github.com/foundry-vtt-types/…` (same commits) | `npm ci` succeeds without private credentials |

No `git+ssh://` URLs remain in `package-lock.json`.

## Manifest / docs (before cleanup)

- README claimed `0.0.68 (Alpha)` and Foundry v13 while `system.json` declares Foundry **14** and version **0.9.241**
- `download` pointed at `…/archive/refs/heads/main.zip` (source tree, not a release asset)
- Release workflow rsynced nearly the whole repo; no build/test gate

## Kept for install validity

Until the coordinated **0.99.0** release, `system.json` `download` remains the `main.zip` archive URL so Forge/manifest installs keep working. Packaging already produces `mastery-system-X.Y.Z.zip`; see `RELEASING.md`.
