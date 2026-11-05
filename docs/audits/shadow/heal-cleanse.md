# Shadow Report — Heal / Cleanse

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T07:24:14.496Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 4 |
| Cases equal (legacy === identity) | 4 |
| Cases diverging | 0 |
| Approved exceptions (documented) | 0 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `heal`: total=2, mismatches=0, sites=heal.isHealRadialOption
- `cleanse`: total=2, mismatches=0, sites=cleanse.isCleanseRadialOption

## Cases

- **heal-template**: legacy=`true` identity=`true` equal=true
- **cleanse-on-heal-template**: legacy=`false` identity=`false` equal=true
- **cleanse-template**: legacy=`true` identity=`true` equal=true
- **heal-on-cleanse-template**: legacy=`false` identity=`false` equal=true

## Approved exceptions

- (none)

## Unexplained

- none
