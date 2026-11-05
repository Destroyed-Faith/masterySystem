# Shadow Report — Active Buff / Segment Routing

Source: **unit-test fixtures** (catalog template ids + neutral ZZZ_* names). Not a Foundry reference world. Legacy path decides.

Generated: 2026-11-05T10:22:04.212Z

## Summary

| Metric | Value |
|---|---|
| Fixture cases driven | 2 |
| Cases equal (legacy === identity) | 1 |
| Cases diverging | 1 |
| Approved exceptions (documented) | 2 |
| Unexplained divergences | 0 |

## Shadow log clusters

- `radial`: total=2, mismatches=1, sites=radial.getSegmentIdForOption

## Cases

- **damage-transfer-stance-text**: legacy=`"attack"` identity=`"attack"` equal=true — C2.a — templateId present ⇒ stance text ignored; both attack
- **support-heal-segment**: legacy=`"utility"` identity=`"utility"` equal=false — approved C1 — legacy attack vs identity utility (matrix exception / C2.a work list)

## Approved exceptions

- support-heal-segment
- approved C1

## Unexplained

- none
