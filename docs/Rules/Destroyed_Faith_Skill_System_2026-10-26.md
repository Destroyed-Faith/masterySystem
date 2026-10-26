# Destroyed Faith — Skill System (2026-10-26)

Mechanical update only. Existing Specializations (ids, ranks) and XP balances are preserved.

## Core roll

- **Pool** = Attribute · **Keep** = Mastery Rank.
- Skill Rank never adds dice or Keep.
- **Skill Advantage** (auto): Rank 2+ rerolls initial faces ≤ N once; keep new face; then explode.
- **Skill Crit** (declare before roll): Rank 5 → 1/day, Rank 8 → 2/day; natural 7–8 explode. Tracked per Skill id in `flags.mastery-system.skillCritUses`. Refreshes on Safe Haven Rest / Day of Rest.

## Raises

- **Standard checks:** optional uncapped Paid Raises (+4 TN each). Free Raises from Skill Rank are retired.
- **Comparative checks:** no TN, no Raises; higher wins; ties favor defender/observer.

## Group Ambush

One Stealth specialist rolls for the group. Combined Physical Skill penalties of all participants reduce the pool. Compare vs observer Perception (comparative).

## Future Spec XP (ladder)

| Buying Rank | XP |
|---|---:|
| 1–2 | 4 |
| 3 | 6 |
| 4 | 8 |
| 5 | 10 |
| 6 | 12 |
| 7 | 14 |
| 8 | 16 |

Total 0→8 = 74 XP. Creation unchanged (five Rank-2 Specs + free Perception Rank 2).
