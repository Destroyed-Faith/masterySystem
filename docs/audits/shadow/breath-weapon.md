# Shadow Report — Breath Weapon

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T11:06:02.203Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 3 |
| Cases equal (legacy === identity) | 1 |
| Cases diverging | 2 |
| Approved exceptions (documented) | 3 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `executor`: total=3, mismatches=2, sites=executor.isBreathWeapon, executor.breathMode

## Cases

- **breath-name-without-function-id**: legacy=`true` identity=`false` equal=false — approved C1 divergence — legacy name path true, identity requires artifactFunctionId dragon-breath
- **breath-with-function-id**: legacy=`true` identity=`true` equal=true
- **breath-mode-default-damage**: legacy=`"damage"` identity=`{"kind":"unresolved","reason":"breath-mode-missing"}` equal=false — approved C1 — legacy defaults to damage; identity refuses silent default (C2.d)

## Approved exceptions

- breath-name-without-function-id
- breath-mode-default-damage
- approved C1

## Unexplained

- none
