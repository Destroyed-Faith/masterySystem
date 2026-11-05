# Forge Reality Audit — Unresolved Findings (Preserved)

Date: 2026-11-05  
Source: `docs/audits/FORGE_REALITY_AUDIT_PRE_K8.md`  
Status: **Documented only — not implemented**

These findings from Fable's Forge Reality Audit require rules-owner decisions or separate assessment. They must **not** be silently corrected in code, catalogs, or world data as part of the Pre-K8 diagnostic tooling batch.

---

## W1 — Lor-Keth Titan Scars affinity / progression (manual world decision)

| | |
|---|---|
| Severity | HIGH (world data) |
| Document | Actor `HscDyhZJsKyTJLMJ` (Lor-Keth), item `lVEhzTR1AvkERGQZ` |
| Observed | `echoArtifactKey: titanScarsIntellect`; L1 "Titan Growth I" → `powerTemplateId: ab-armor-temp-hp` |
| Catalog | Canonical key `titanScars`; L1 → `artifactFunctionId: titan-growth` (Transformation) |
| Rules | `Players_Handbook.md:2683` — retired combined Active Buff is no longer used |

**Pre-K8 tooling:** Preflight now reports `legacy-alias-key` + `catalog-divergence` with disposition `manual`.  
**Explicitly not done:** Do **not** automatically replace Lor-Keth's Intellect-based configuration with a Might-based configuration. GM decides whether to re-sync from the `titanScars` tree (and which affinity, if any) on an isolated world copy.

---

## W2 — Draconic Roar: retired vs approved Armor Aura exception

| | |
|---|---|
| Severity | MEDIUM (rules conflict) |
| Evidence | `Players_Handbook.md:2939/2942/2945` ("Retired – redesign pending", formerly +12/+28/+44 Armor) **vs** `:7008` ("approved artifact-only Armor Aura exception") |
| Catalog | `echo-artifacts.ts` — `ab-armor-aura` PL 4/10/16 (+4/+10/+16 Armor) |
| World | Scurry Dragon Head L2 grants `ab-armor-aura` rank 4 |

**Action:** Rules owner must reconcile the Dragon Head table with the playtest compatibility notice before Active Buff cluster cutover (C2.b). No code change in this batch.

---

## W3 — Dragon Breath geometry: cone vs radius

| | |
|---|---|
| Severity | LOW (text consistency) |
| Evidence | Catalog `echo-artifacts.ts` "Cone N m" vs rulebook table "radius N m" |
| Identity | Unaffected (`active-melee-weapon-aoe` + `dragon-breath` contract holds) |

**Action:** Rules / catalog text alignment only. No combat mechanic change in this batch.

---

## W5 — `echoBound` boolean vs string inconsistency

| | |
|---|---|
| Severity | LOW |
| Evidence | World / migrations write `echoBound: true` (boolean); builder writes `echoBound: def.echoKey` (string); some call sites test `=== true` |
| Identity | Outside power-identity scope |

**Action:** Separate typing / migration cleanup. Not part of Pre-K8 diagnostic tooling.

---

## Explicitly out of scope here

- K8 text-fallback cutover  
- K9 pack rebuild  
- World / actor / effect writes  
- Canonical rules edits  
- Combat mechanic changes  
