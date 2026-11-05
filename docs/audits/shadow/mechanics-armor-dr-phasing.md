# Shadow Report — Mechanics / Armor / DR / Phasing

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T11:06:02.197Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 3 |
| Cases equal (legacy === identity) | 3 |
| Cases diverging | 0 |
| Approved exceptions (documented) | 0 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `mechanics`: total=4, mismatches=1, sites=mechanics.resolveFromCatalog, mechanics.isSanctionedPhasing, mechanics.isSanctionedDR

## Cases

- **armor-name-vs-id**: legacy=`2` identity=`2` equal=true — legacy name fallback agrees with id for unique Active Buff: Armor
- **phasing-ghostform**: legacy=`true` identity=`true` equal=true
- **dr-passive-sanctioned**: legacy=`true` identity=`true` equal=true — fixture mirrors sanctioned DR; production site also shadowed in aggregateMechanics

## Approved exceptions

- (none)

## Unexplained

- none
