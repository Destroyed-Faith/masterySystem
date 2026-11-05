# Fable — Forge Reality Audit V2 / Pre-K8 Revalidation

Date: 2026-11-05 · Reviewer: Fable (independent, read-only) · Revision 2 (after the genuine `formatVersion: 2` export)
Inputs: three Forge exports — v1 `GM Dump Forge.txt` (08:03Z, 0.9.826), v1-format `GM DUMP 2.txt` (08:47Z, 0.9.827, old macro document), and the **genuine v2 export** (`exportedAt 2026-11-05T08:55:09.448Z`, 0.9.827, delivered by the GM in chat and persisted outside the repo as `%TEMP%\forge-snapshot-v2-real.json`); repo HEAD `effcd1c0` (`v0.9.827`); prior audit `FORGE_REALITY_AUDIT_PRE_K8.md` + `.evidence.json`; `COMBAT_RESOLVER_ID_REFACTOR_IMPLEMENTATION.md` §11; `FORGE_REALITY_AUDIT_UNRESOLVED.md`.
Method: independent re-run of gates, offline dry-run of every export with the 0.9.827 `dist/` (`scripts/run-identity-snapshot-audit.mjs`, output `%TEMP%\forge-dryrun-v2-real\`), field-level v1↔v2 comparison, a sandboxed execution of the v2 macro source (revision 1), and a code trace of the runtime path for the one flagged row. No source, world, pack or git changes were made.

**Final status: PARTIAL** — ready for **development on an isolated world copy**; **not authorized for production cutover** (§10). Revision 2 closes X1/X3/X4/R-18 as live-verified and **upgrades W1** from "detected, benign under ID routing" to "detected, **behavior-changing** under ID routing" (§3).

---

## 1. Independent verification of Auto's corrections

| Claim | Verdict | Evidence |
|---|---|---|
| TypeScript PASS | **PASS** | `npx tsc --noEmit` exit 0 (re-run 09:48) |
| 363 files / 3839 tests PASS | **PASS** | `npx vitest run` → 363 passed / 3839 passed |
| Build PASS | **PASS** | tracked `dist/` at HEAD is byte-identical to a fresh `tsc` output (`git status dist` clean after the release build); `dist/utils/power-identity.d.ts` contains `legacy-alias-key` / `catalog-divergence` / `IdentityFieldSnapshot` |
| Alias-aware preflight | **PASS** | `src/utils/artifact-row-identity.ts` `resolveCanonicalArtifactKey` / `lookupArtifactDefinition` → `getEchoArtifact` (uses `ECHO_ARTIFACT_KEY_ALIASES`); offline run resolves `titanScarsIntellect` → `titanScars` |
| `legacy-alias-key` diagnostic | **PASS** | offline entries: 2× (world + token), `severity: informational`, `disposition: manual`, `canonicalArtifactKey: titanScars` |
| `catalog-divergence` diagnostic | **PASS** | 2× (world + token) L1: observed `{tid: ab-armor-temp-hp}` vs expected `{afid: titan-growth}`; compared against **builder** row for (`titanScars`, currentLevel 2, L1) |
| No automatic correction | **PASS** | entries carry **no** `suggestedIdentity`; `planActorIdentityMigration` → **0 proposals** on the whole world; `identityDiff` still returns `null` for rows with structured identity (`src/migrations/power-identity-migration.ts:180`) |
| No false positives | **PASS** | 10 other artifact items (+ token copies: Moonlight, Soul Sigil, Elorian Stride, Lor-Keth's Staff, Staff of the Dark, Shadowgrave, Lantern, Dragon Claws, Dragon Head, Serpent Scales) → 0 divergence/alias entries; 137/137 other sources resolved |
| Regression tests exist | **PASS** | `tests/identity-preflight.test.ts:210` (W1), `:278` (matching identities not flagged), `:358` (no suggestion when identity present); `tests/identity-snapshot-offline.test.ts:28` (v2 shape) |
| Fixed MR extraction | **PASS (Forge, live export)** | genuine v2 export: `system.masteryRank` = `system.mastery.rank` for **15/15** actors and **13/13** complete token copies (characters Alaris/Lor-Keth/Oda/Scurry = 3; all 11 NPCs = 2); v1 export had `null` ×15 |
| Picks `level`/`kind` | **PASS (Forge, live export)** | 11/11 world artifacts export `progressionPicks[] = {pickIndex, level, kind, authoredStages}`; kinds observed `power` / `stoneFunction`; `authoredStages: []` everywhere (`useAuthoredLevelProgression: false` on all 11) |
| Provenance flags | **PASS (Forge, live export)** | 11/11 world artifacts carry `nodeId`, `parentIds`, `childIds`, `isRoot`, `seedVersion`, `evolutionNodeId`, `artifactActivated`; 5 additionally `echoBound` / `echoLocked`. Content of these flags raises **new findings N1–N2** (§3) |
| Incomplete-token reporting | **PASS (Forge, live export)** | 3 orphan tokens → `incomplete: true`, `incompleteDetail {items:true, effects:true, syntheticActor:true}`, `error: "synthetic-actor-missing"`, `items: []`, `effects: []`, warning "Unlinked token "…" has no synthetic actor (deleted base actor, no…)" |
| v1 backward compatibility | **PASS** | `scripts/run-identity-snapshot-audit.mjs` accepts `formatVersion` 1–2; v1, v1-format and v2 exports all processed; identical preflight totals |
| Redaction preserved | **PASS** | sandbox actor with `biography`/`password` fields → neither value present in output; v2 export power items contain only `templateId, templateName, rank, level, category, powerType, limited, chosenSpecialKey, cost, levelKeys, description` |
| Live GM visibility of W1 | **PASS (by code)** · NOT VERIFIED live | `runIdentityPreflightOnReady` whispers whenever `unresolved > 0` → informational entries are included in the ready whisper; combat-start whisper filters to blocking/omitting only (W1 **not** shown at combat start — acceptable, by design) |

Implementation report §11 claims are **accurate**. Revision 1 of this report found that the Forge macro *document* still held the v1 script (the 08:47Z export was `formatVersion: 1`); the GM has since re-pasted it and the 08:55Z export is `formatVersion: 2`. Offline dry-run of the genuine v2 export: **141 sources / 137 resolved / 4 informational / 0 blocking / 0 omitting / 0 migration proposals** — identical to v1.

---

## 2. Snapshot v1 vs v2 comparison

| Aspect | v1 (`GM Dump Forge.txt`) | v1-format (`GM DUMP 2.txt`) | **v2 (genuine, 08:55Z)** | Verdict |
|---|---|---|---|---|
| `formatVersion` | 1 | 1 (old macro document) | **2** | **PASS** — macro document updated between 08:47Z and 08:55Z |
| `exportedAt` | 08:03:43Z | 08:47:23Z | 08:55:09Z | — |
| `system.version` (deployed) | 0.9.826 | 0.9.827 | **0.9.827** | **PASS** — Forge runs HEAD `effcd1c0` |
| `core.version` / host | 14.369 / Forge | same | 14.369 / `hostIsForge: true` | — |
| Actor `system.masteryRank` | `null` ×15 | `null` ×15 | **3** ×4 characters, **2** ×11 NPCs; `mastery.rank` identical; 13/13 complete tokens populated | **PASS** — X1 closed |
| `progressionPicks` keys | `pickIndex,id,name(null),authoredStages` | identical | `pickIndex,level,kind,authoredStages` | **PASS** — X3 closed |
| Artifact flags exported | `echoArtifactKey, artifactActivated` | identical | `nodeId, parentIds, childIds, isRoot, seedVersion, evolutionNodeId, artifactActivated, echoArtifactKey` (+ `echoBound`, `echoLocked` on 5) | **PASS** — X4 closed; content → N1/N2 (§3) |
| Orphan tokens | 3, warning "not loaded?" | identical | 3, `incomplete: true`, `incompleteDetail`, `error: synthetic-actor-missing` | **PASS** — X2 closed |
| Actor / item / token / pack **ID sets** | — | identical to v1 | **identical** (15 actors, 39 world items, 16 tokens, 220 pack docs) | PASS — no document drift across the three exports |
| World artifact identity tuples (27 rows × `powerTemplateId|artifactFunctionId|rank|limited`) | — | identical | **27/27 identical** | PASS — no identity drift; W1 row unchanged (`ab-armor-temp-hp`) |
| Active Effects | 3 | 3 | 3 (Alaris `ab-evade` MR3 · Oda `ab-special-overdrive` MR3 · Scurry artifact buff "Serpent Evasion I" `ab-evade`) | PASS |
| Compendium docs | 220 (`seedVersion` not exported) | 220 | 220, **all `seedVersion: 60`**, `echoBound` **string** (e.g. `"sentinels"`, `"dwarfs"`, `"unbound"`) | PASS structurally — still pre-identity (§4 P1) |
| Preflight totals (offline, 0.9.827 `dist/`) | 141/137/4 informational | identical | **141 / 137 / 4 informational / 0 blocking / 0 proposals** | PASS — stable across exports |

**Conclusion:** deployed system **and** export tooling are now both at 0.9.827 / v2. The three exports describe the same documents; no world write happened between them. X1–X4 are **closed on live data**. The newly visible provenance flags expose two findings that were invisible in v1 (N1 seed-version skew, N2 legacy node ids) — see §3.

### 2.1 The three incomplete synthetic tokens (re-evaluated)

| Scene / token | Token name | `actorId` | Base actor exists in world? | Assessment |
|---|---|---|---|---|
| `xW8wvYRpnmKAMEGB` "01 - First Room" / `XumJmU3SvEEx4iXy` | Alaris | `VCfDdcNoX8hdh6hB` | **No** (current Alaris is `s36N3Q5lXFFr8e9Z`) | Orphan token of a **deleted** earlier Alaris actor |
| `xW8wvYRpnmKAMEGB` / `ra5OUBJuwTZp9tIN` | Red Priest Acolyte | `x57epffUIwPZTTlb` | **No** | Orphan token (deleted NPC) |
| `GbqpEJ08LXtTMrea` "Kloster" / `g6LAAbvPDwYnkIX0` | Test5 | `eaEhItdyRTX9KoxD` | **No** | Orphan test token |

Previously NOT VERIFIED → now **RESOLVED as non-identity-bearing**: Foundry cannot build a synthetic actor without a base actor, so these tokens carry no items/effects and cannot participate in combat identity. The genuine v2 export confirms this directly (`incompleteDetail.syntheticActor: true`, `error: "synthetic-actor-missing"`, empty `items`/`effects`, no `system` block). Risk to K8: none. Optional GM housekeeping: delete the three tokens (not required for K8; not done here).

### 2.2 Previously unverified findings — status now

| Finding | v1 status | v2 status (genuine export) |
|---|---|---|
| X1 MR / rank propagation | NOT VERIFIED | **VERIFIED** — MR 3 on all four characters and their token copies; effect flags `masteryRank: 3` agree |
| X2 orphan tokens | NOT VERIFIED | **RESOLVED** (deleted base actors, §2.1) |
| X3 picks shape | gap | **VERIFIED** — `level`/`kind` present; no authored stages in the live world |
| X4 seed provenance | NOT VERIFIED | **VERIFIED → new finding N1**: world artifacts `seedVersion: 57`, pack and builder `60` |
| X6 stale `combatId` flags | NOT VERIFIED | NOT VERIFIED (combats not exported); additional detail under W4 |

---

## 3. Remaining real-world data defects

| ID | Severity | Location | Status | Note |
|---|---|---|---|---|
| **W1** Lor-Keth Titan Scars legacy identity | **HIGH → behavior-changing** | actor `HscDyhZJsKyTJLMJ`, item `lVEhzTR1AvkERGQZ`; token `NwpxJf6a5palklSk/uWNkQ0l833x2HR87` | **OPEN — manual review, must be resolved before any cluster cut that removes name heuristics** | Detected (4 informational entries = 2 diagnostics × 2 documents). Detection ≠ resolution. **Correction to revision 1:** the legacy runtime does **not** execute this row as `ab-armor-temp-hp`. Row L1 is named "Titan Growth I", type "Active Buff"; `artifact-options.ts:344` classifies it `activeBuff` → slot `utility`; `token-action-selector.ts:1697-1699` then matches `/titan\s*growth/i` on the **name** and `artifact-active-buffs.ts:207-210` repeats the name match → `activateTitanGrowth` (Transformation Growth, rest-use key `titanGrowth`). The live token carries `flags.mastery-system.artifactRestUses.titanGrowth: 3` — consistent with Growth having been activated three times on that token. Under identity routing the same row resolves to `ab-armor-temp-hp` (+5 Armor / 20 Temp HP) → **different mechanic**. The export proves the stored identity and the spent rest uses, not the past activations themselves (see R-19). Intellect affinity is preserved; GM must re-sync on an isolated copy. |
| **N1** world `seedVersion` 57 vs pack/builder 60 (new) | MEDIUM | all 11 world artifacts (`flags.mastery-system.seedVersion: 57`); 220/220 pack docs and `buildEchoArtifactTree` emit `60` | **OPEN — provenance only** | World items were last written by seed 57 and never re-synced. First audit §5 showed row-for-row agreement with the builder at HEAD for 10/11 artifacts (W1 the exception), so content drift is limited to W1; but "world == builder" is **coincidental agreement**, not provenance. Any seed-60 content change that is not row-identical would be silently absent from the world. Not a K8 blocker by itself; it is the reason the offline preflight — not the seed label — must remain the gate. |
| **N2** Elorian Stride legacy node ids (new) | LOW | Alaris item `4UfdSf0d4CpJOtQ6`: `nodeId: "elvenStrideAir-l1"`, `childIds: ["elvenStrideAir-l2"]`, but `echoArtifactKey: "elorianStride"`, `evolutionNodeId: "elorianStride-l2"`, `echoKey: "elorians"` | OPEN — cosmetic, no identity impact | Partial rewrite by `src/migrations/elorian-stride-migration.ts` (rewrites `echoArtifactKey`, `evolutionNodeId`, `echoBound: true`, but not `nodeId`/`childIds`). `elvenStrideAir` is a registered alias (`echo-artifacts.ts:599`). L1/L2 identities (`reaction-evade` r2, `movement-wall-walk` r4) match the pack. Preflight correctly silent. Serpent Scales (`wyrmScalesLight-*`) and Titan Scars (`titanScarsIntellect-*`, W1) are internally consistent. |
| W4 stale combat-scoped flags | LOW | base Alaris/Oda/Scurry `phasingCharges.combatId` (`YWZQ8LsnXVkQUGaH`, `suSPl2t4ouQbSh9w`); **token copies** of Alaris (both scenes) and Oda: `phasingCharges {max: 0, current: 0, combatId: ""}` with an extra source `passive:ZlZ7TChfRP9MMkdv` (Passive: Phasing / ghostform) while the base actor has `{max: 1, current: 1}` with the reaction source only; `statusJson` / `specialRoundApps` / `naturalSpecialRecovery` from past combats on scene `NwpxJf6a5palklSk` tokens; `artifactRestUses` `{moonlightJudgment: 1}` Alaris, `{titanGrowth: 3}` Lor-Keth, `{dragonBreath: 1}` Scurry | OPEN (not identity) | token ≠ base on runtime flags is expected for unlinked copies, but the **max 0 / combatId ""** pattern on the token copies means the token's Phasing pool was never (re)initialised for a combat → runtime check at combat start (§7 R-8). `artifactRestUses` keys are **names** (`titanGrowth`, `dragonBreath`), not ids — any K8 cluster touching rest-use accounting must preserve these keys or migrate them. |
| Token-only item delta | — | Kloster token `GbqpEJ08LXtTMrea/AsAPwwnYUqqucIdd` (Alaris): 12 items vs base 11, extra `0YtY7XW6YlETpypi` "Passive: Restoration" (`passive-regeneration` r4) | informational (unchanged from audit v1 §4) | unlinked copy; identity valid; no action |
| 3 orphan tokens | — | §2.1 | RESOLVED (no identity) | optional cleanup |

No document changed between the three exports; N1/N2 and the W1 upgrade are **newly visible** (provenance flags + code trace), not newly introduced.

---

## 4. Remaining catalog inconsistencies

| ID | Severity | Status | Evidence |
|---|---|---|---|
| **P1** `mastery-system.echo-artifacts` pre-identity | **HIGH for K8** | **OPEN** | 220/220 docs identical to v1: 606 rows `rank: null`; 51 rows without `artifactFunctionId` (awakening 22, dragon-breath 10, titan-growth 10, life-absorption 9); 19 Ringchain heal/cleanse rows without `powerTemplateId`; 70 `authoredStages` without identity |
| Drag-from-compendium regression risk | HIGH | OPEN | Any artifact dragged from the pack today has **no** identity on rows; K2 enrichment fills blank rows at read time (Radial/Preflight only — F5), so Reactions/Aggregator paths read raw rows. After K8 hard cut, pack-sourced items would fail closed. Mitigation = K9 rebuild **before** K8 cluster cuts that remove enrichment fallbacks |
| Seed / version (**N1**) | MEDIUM | **VERIFIED skew** | world artifacts `seedVersion: 57` (11/11) vs pack `60` (220/220) and builder `60`. World L1 Dragon Head row carries `artifactFunctionId: "dragon-breath"`, `rank: 4` while the corresponding pack row has `artifactFunctionId: null`, `rank: null` — i.e. the world items are **ahead** of the pack on identity and **behind** on seed label. P1 and N1 together mean neither pack nor world can serve as the reference copy for the other without K9. |
| W2 Draconic Roar | MEDIUM | OPEN — rules owner | `Players_Handbook.md:2939` "Retired" vs `:7008` "approved exception"; catalog `ab-armor-aura` PL4; live world row Scurry Dragon Head L2 `ab-armor-aura` r4 |
| W3 Breath cone vs radius | LOW | OPEN — text | identity unaffected |
| W5 `echoBound` boolean vs string | LOW | OPEN — **confirmed live** | world: `echoBound: true` (boolean) on Elorian Stride, Titan Scars, Dragon Claws, Dragon Head, Serpent Scales (all written by migrations such as `elorian-stride-migration.ts` `'flags.mastery-system.echoBound': true`); pack: string echo keys (`"sentinels"`, `"dwarfs"`, `"unbound"`, …). `src/progression/build-value.ts:129`, `src/utils/xp-recalc.ts:26`, `src/utils/power-replace.ts:81` test `=== true` → pack-sourced (string) items are treated as **not** echo-bound by those three paths. Separate cleanup; not identity. |

---

## 5. Rules-owner decisions required

1. **W2** Draconic Roar: retired (table) or approved Armor Aura exception (notice)? If approved, confirm value (+4 PL-scaled vs "formerly +12"). Blocks the **Active Buff cluster (b)** cut, not cluster d/e/c.
2. **W1 rules side**: Titan Growth is Transformation `titan-growth`; `ab-armor-temp-hp` remains a live template in `src/utils/powers/templates/activeBuffs.ts:292` although the handbook calls it retired. Decide whether to mark it retired in catalog metadata (so future divergences can be classified "obsolete" vs "intentional"). **Also confirm the intended mechanic for Lor-Keth's L1 row**: the table currently plays it as Transformation Growth (name routing, 3 rest uses already spent on the token); the stored identity says Armor + Temp HP. The GM decision on the isolated copy (R-15) must state which of the two the character actually has.
3. **W3** Breath geometry wording (cone vs radius) — text only.
4. Open rule topics from K8 readiness §7.7 (14.1b / 14.7 / 14.8 / AoE Restoration) remain as before.

---

## 6. Migration and Compendium readiness

| Item | Status | Evidence |
|---|---|---|
| Preflight (read-only) on Forge data | **PASS** | 141 sources / 137 resolved / 4 informational / 0 blocking |
| Migration dry-run proposals | 0 | nothing unresolved to migrate; W1 correctly **not** proposed |
| Migration apply / rollback (unit, `-=` semantics) | PASS (fixtures) | M1–M7b in `power-identity-migration.test.ts` |
| Migration apply inside Foundry | **NOT VERIFIED** | never run; needs isolated copy |
| Backup flags in world | none (expected) | no `identityMigrationBackup` present |
| Pack rebuild (K9) | **NOT RUN** | §4 P1 |
| Shadow fixture reports | PASS | `docs/audits/shadow/*` regenerate green in suite |
| Shadow on Forge runtime | **NOT VERIFIED** | no runtime log |
| Golden baselines | PASS | `identity-golden-baseline.test.ts` green |
| Text-matching guard | PASS | `no-text-mechanic-matching.test.ts` green (82-entry allowlist) |

Classification of Forge documents (genuine v2 export): Already correct 10 artifacts / 65 powers / 3 effects (MR 3 confirmed on effects and actors); **Requires manual review 1** (W1, +1 token copy — behavior-changing); Provenance-only findings 11 artifacts (N1 seed 57) + 1 artifact (N2 node ids); Safely auto-migratable 0 world docs / 220 pack docs via K9; Blocked/NOT VERIFIED: runtime behaviour (no shadow log yet).

---

## 7. Runtime test matrix (minimum, using real Forge configurations)

Legend — Mode **RO** = read-only on production (no dice resolution, no document writes; observe Radial/Preflight/console only). Mode **ISO** = isolated world copy required (rolls, effects, charges, flags are written). Evidence = chat card(s) + `console` shadow log (`compareIdentityDecision` cluster output) + screenshot/JSON export of the affected document after the action. Shadow cluster names per `identity-shadow.ts`.

| # | Mode | Actor · source | Action | Expected mechanical result (legacy decides in C1) | Evidence | Shadow cluster | Pass / Fail |
|---|---|---|---|---|---|---|---|
| R-1 | RO | GM, world ready (0.9.827) | Reload world as GM | Ready whisper lists **4 informational**: 2× `legacy-alias-key`, 2× `catalog-divergence` for Lor-Keth; no blocking | whisper screenshot | — | PASS if W1 shown and nothing else; FAIL if clean or extra entries |
| R-2 | RO | Scurry · Dragon Head L1 Breath Weapon I | Open token Radial, hover/select Breath Weapon | Option shows Damage **or** Ruin mode choice, PL 4, Bite weapon damage attached; no console `unresolved` | screenshot + console | `artifact`, `radial` | PASS if both modes offered and identity `OK(active-melee-weapon-aoe|dragon-breath|r4)` in shadow log |
| R-3 | ISO | Scurry → AttackDummy tokens (scene `abDdxyILDPDKcJNE`) | Breath Weapon **Damage**, cone 3 m, Might | Attack roll; on hit `4d8` + Bite weapon damage; Breath counter −1; shared rest counter | chat card, `artifact-rest-uses` flag diff | `artifact`, `executor`, `mechanics` | PASS if damage dice = 4d8 + Bite, counter decremented once |
| R-4 | ISO | Scurry → AttackDummy | Breath Weapon **Ruin** | Special-only: Ruin(5) applied, **no** damage; same shared counter | chat card, target status | `artifact`, `specials` | PASS if Ruin(5) and 0 damage; FAIL if damage dice appear |
| R-5 | RO→ISO | Alaris · Moonlight Greatsword L2 Moonlight Judgment I | RO: Radial shows "Limited" badge and uses remaining; ISO: declare attack and **miss** | Limited charge spent on declaration; miss also costs a use; Spell AoE PL 4; no Weapon Damage/Focus | Radial screenshot; `limitedChargeSpent` flag before/after | `limited`, `radial`, `executor` | PASS if uses −1 on miss and Radial = Executor decision (parity line in shadow log) |
| R-6 | ISO | Alaris · Moonlight Judgment I | Attempt second use beyond remaining | Activation refused (fail-closed), no roll | chat/notification | `limited` | PASS if blocked |
| R-7 | ISO | Lor-Keth · power `ab-armor` (rank 5) | Preparation phase: activate Active Buff: Armor; then activate a second Active Buff (e.g. none available → use Oda `ab-special-overdrive` on Oda) | Single Active-Buff slot: new buff **replaces** old; effect persisted with `powerTemplateId` flag; duration MR rounds | Active Effects tab before/after; effect flags JSON | `mechanics`, `activeBuff` routing | PASS if exactly one active buff effect, flags contain `powerTemplateId`, duration = MR |
| R-8 | ISO | Alaris, Oda, Scurry (stale `phasingCharges.combatId`) | Start a **new** combat with all three | `phasingCharges` reset to new `combatId`, `current = max`; `msActiveBuffEmpowermentUsed` cleared/reset; stale `phasingChargesPending` resolved | actor flags JSON before/after | `mechanics` (DR/Phasing) | PASS if combatId updated and charges at max |
| R-9 | ISO | Alaris (`passive-ghostform`, Phasing) ← AttackDummy attack | Take one hit with Phasing charge available | Phasing applies once per combat per rules; charge consumed; DR/armor order per handbook | chat card, flag diff | `mechanics` | PASS if charge −1 and damage reduced per Phasing rule |
| R-10 | ISO | Lor-Keth · `reaction-armor` (Ancestral Guard I, artifact) and `reaction-special-increase` | Trigger reaction on incoming attack | Reaction prompt lists artifact reaction with rank 4; Special Increase applies to a Special on Lor-Keth's next hit | reaction dialog screenshot; chat | `reaction`, `specials` | PASS if artifact reaction resolves with rank 4 (not row-level fallback) and Special Increase substring heuristic agrees with identity (shadow line) |
| R-11 | ISO | Scurry · Dragon Claws L2 Rending Spiral I (`lacerate`) | Melee AoE Special vs 2 dummies | Lacerate(5) applied to each hit; **no damage** | chat, target statuses | `specials`, `executor` | PASS if 0 damage, Lacerate(5) each |
| R-12 | ISO | Scurry · Dragon Claws L3 Tail Sweep I (`push`) | Melee control attack vs dummy | Push 8 m + Claw weapon damage; no AoE/Power damage | chat, token displacement | `specials`, `executor` | PASS if displacement 8 m |
| R-13 | ISO | Alaris · Moonlight Mending I (`active-ranged-single-heal` r4) on damaged ally | Heal | Heal amount per PL 4 table (rank 4). Record value derived by `artifactLevelToTemplateRank(level 1)` vs `option.rank 4` — **expected identical at L1**; this is the F12 baseline | chat card + shadow `heal` line | `heal` | PASS if heal value = PL 4 and shadow reports no divergence |
| R-14 | ISO (+fixture) | Any actor + **added** Ringchain of Kept Names L2 (Burden Lifted I, `active-ranged-single-cleanse`) | Cleanse one condition | PL 4 cleanse controls per `Actives.md` 1223–1238 (Decision 14.1) | chat card + shadow `cleanse` line | `cleanse` | PASS if controls = PL 4 table. *No cleanse power exists in the live world → requires a fixture item on the copy* |
| R-15 | RO→ISO | Lor-Keth · Titan Scars L1 "Titan Growth I" (stored `ab-armor-temp-hp`) | RO: open Radial, observe which slot/label the row gets (expected: utility slot, labelled Active Buff — identity classification — but routed as Transformation on click, R-19). ISO: GM re-syncs item from `titanScars` tree L2 on the copy, re-run preflight | After re-sync: L1 = Transformation `titan-growth`; preflight clean; Growth 1 available as Transformation; `artifactRestUses.titanGrowth` still honoured | preflight whisper before/after; item JSON | `artifact` (functions) | PASS if divergence disappears **without** touching other actors; GM records affinity decision |
| R-16 | ISO | Oda · Staff of the Dark L2 Life Taken I (`active-ranged-single-target-damage-transfer`) | Spell attack on dummy | Damage-transfer mechanics; Spell casting attribute; shadow `executor` agrees | chat | `executor`, `mechanics` | PASS if identity = legacy decision |
| R-17 | RO | All four characters | Open Radial per actor, iterate every option once (no activation); export `exportIdentityShadowReport()` JSON | First live dump (pre-fix): 81 entries / 76 matches / **5 mismatches**, all `radial.getSegmentIdForOption` (§7.1). After code fix (0.9.828 pending deploy): those 5 are expected to **match**. W1 deferred (segment already matched `active-buff==active-buff`; mechanic class is R-19, not R-17). | structured shadow JSON download | `radial` (+ other clusters if logged) | PASS if re-export after deploy shows **0** unresolved among the five fixed options; FAIL if any of Potion / Dragon Wings / Elorian Cling / Ruin Breath still unresolved |
| R-18 | — | — | Re-run **v2 macro**, export | `formatVersion: 2`, MR populated, picks `level/kind`, `seedVersion` present | genuine export 08:55:09Z (§2) | — | **PASS (done 2026-11-05)** |
| R-19 | ISO | Lor-Keth · Titan Scars L1 "Titan Growth I" **before** any re-sync | Activate the row from the Radial on the copy | **Legacy expectation:** Transformation Growth activates (token grows to 2×2, `artifactRestUses.titanGrowth` +1, Growth bars) and **no** Armor/Temp-HP effect is created. Confirms that W1 is behavior-changing under ID routing | token size + flags before/after; Active Effects tab | `artifact`, `activeBuff` | PASS if Growth activates and no `ab-armor-temp-hp` effect appears; FAIL (and W1 re-classified benign) if an Armor+TempHP effect is created instead |

Destructive tests (apply migration, rollback, pack rebuild) are **ISO-only** and are not part of this minimum matrix; they belong to K7-in-Foundry and K9.

### 7.1 R-17 live shadow audit + code fixes (2026-11-05)

**Evidence:** `C:\Users\navar\Downloads\identity-shadow-1793871199030.json` (Forge console download; read-only). Console paste `konsoleDF` alone was insufficient (collapsed objects; only mismatches print).

| Metric | Value |
|---|---|
| total / matches / mismatches | 81 / 76 / 5 |
| `skippedNpcOrManeuver` | 72 |
| Sites with mismatches | only `radial.getSegmentIdForOption` |
| Other sites in dump | `mechanics.resolveFromCatalog` 35, `limited.isLimitedAttackDeclaration` 6, `artifact.rowLimited` 9 — all `equal: true` |

**Five mismatches (pre-fix) and fixes (no Forge document writes; W1 deferred):**

| # | Option | Pre-fix reason | Cause | Fix |
|---|---|---|---|---|
| 1–2 | Potion of Moonlight Mending I (`consumable-vDZ9…`, `consumable-9DqY…`) | `missing-identity` | `buildConsumableAttackOption` omitted `snapshot.templateId` | Propagate `templateId` / rank from Minor Magic snapshot; consumable attack-slot policy in `getSegmentIdForOption` identity path (`isConsumableCombatOption` → `'attack'`) so heal potions stay attack-slotted without name heuristics |
| 3 | Dragon Wings I | `missing-identity` | Movement radial options omitted `artifactPowerTemplateId` despite row `movement-flight` | Preserve `artifactPowerTemplateId` / `rank` / `artifactRowLevel` on movement options |
| 4 | Elorian Cling I | `missing-identity` | same for `movement-wall-walk` | same |
| 5 | Ruin Breath I | `artifact-function-contract-violation` | Ruin branch cleared `artifactPowerTemplateId` while keeping K3 `dragon-breath` | Stop clearing templateId; ruin-only / no-damage stays on `dragonHeadBreathMode: 'ruin'`, `ignoreWeaponDamage`, cleared `forcedWeaponItemId` |

**Regression:** `tests/r17-radial-identity-mismatches.test.ts` (+ assertions in `consumable-slots.test.ts`, `artifact-radial-options.test.ts`). Suite after fix: **364 files / 3845 tests**, `tsc --noEmit` PASS, `npm run build` PASS.

**Expected after deploy:** all five previously failing options **match** (`equal: true`). Titan Growth I already matched on segment in the live dump (`active-buff == active-buff`); mechanic-class W1 remains deferred (R-19).

**Still required on Forge (after system deploy containing these fixes):**
1. Reload world / refresh clients so new `dist/` is live.
2. Clear shadow log, re-open Radial on all four characters (no activations).
3. Re-download `exportIdentityShadowReport()` JSON; confirm 0 mismatches for the five options above.
4. Spot-check Ruin Breath still offers Ruin-only (no Bite / no damage dice) — runtime unchanged by design.
5. R-1 whisper, R-2/R-5(RO), and full ISO matrix remain open; no K8 cutover.

---

## 8. Exact pre-K8 gate status

| Gate | Status | Evidence |
|---|---|---|
| tsc | PASS | exit 0 |
| Unit suite | PASS | 364 / 3845 (incl. R-17 regression) |
| Build / dist sync | PASS | tracked dist includes consumable/movement/ruin fixes |
| Identity matrix 1–16 | PASS | in suite |
| Text guard (fail-closed) | PASS | allowlist line numbers refreshed for radial edits |
| Golden baselines | PASS | in suite |
| Shadow fixtures | PASS | in suite |
| Shadow on Forge | **PARTIAL** | first JSON dump analyzed (§7.1); **re-verify after deploy** |
| Preflight on Forge data (offline, genuine v2) | PASS, **4 informational (W1) open** | 141 / 137 / 4 / 0 / 0 proposals |
| Preflight live whisper | NOT VERIFIED | R-1 pending |
| Deployed version == HEAD | PASS | 0.9.827 == `effcd1c0` |
| Export tooling v2 on Forge | **PASS** | `formatVersion: 2`, 08:55:09Z |
| MR / rank propagation (export) | **PASS** | MR 3 ×4 characters + token copies, MR 2 ×11 NPCs |
| Seed provenance | **FAIL (skew)** — not blocking by itself | N1: world 57 vs pack/builder 60 |
| W1 behavioural impact | **FAIL until resolved on copy** | legacy name routing ≠ stored identity (§3, R-19) |
| Migration apply/rollback in Foundry | NOT VERIFIED | isolated copy missing |
| Pack identity persistence (K9) | **FAIL / NOT RUN** | P1 (world rows ahead of pack rows) |
| Isolated world copy | **MISSING** | — |
| Rules decisions W2 (cluster b) | OPEN | §5 |

---

## 9. Minimal next actions

**GM (Forge, read-only unless stated)**
1. ~~Re-paste macro and re-export~~ — **done** (08:55:09Z, `formatVersion: 2`).
2. Confirm the ready whisper shows the 4 W1 entries (R-1).
3. Create an **isolated copy** of the world (Forge duplicate) for all ISO tests; never run ISO tests on production.
4. On the copy, **first** run R-19 (activate Lor-Keth's "Titan Growth I" as-is and record what happens), **then** decide W1 (re-sync Titan Scars from `titanScars` L2; record affinity decision; state whether the character has Growth or Armor+TempHP) and re-run preflight (R-15). Optionally delete the 3 orphan tokens.

**Cursor Auto (code, after GM steps 2–3)**
1. ~~Offline adapter on the real v2 export~~ — **done** (this revision; results in §1/§2, evidence file next to this report).
2. ~~R-17 code fixes for the 5 radial mismatches~~ — **done** (§7.1); await Forge deploy + re-export of shadow JSON.
3. Execute R-2, R-5(RO), R-17 re-verify read-only on production after deploy; R-3…R-16, R-19 on the copy; attach evidence per row.
4. Prepare K9 pack rebuild as a **separate gated change** (not before GM approval); it is a prerequisite for any cluster cut that removes K2 enrichment fallbacks. K9 must also reconcile N1 (world seed 57) — decide whether re-syncing world items to seed 60 is part of K9 or a separate GM action on the copy.
5. Optional hardening (small): mark `ab-armor-temp-hp` as retired in catalog metadata once the rules owner confirms, so `catalog-divergence` can label "obsolete template" vs "intentional reassignment".
6. Before any cluster cut that removes the `/titan\s*growth/i` name routing (`token-action-selector.ts:1697`, `artifact-active-buffs.ts:207`), add a preflight severity rule: `catalog-divergence` where legacy name routing and stored identity disagree on the **mechanic class** (Transformation vs Active Buff) should be **blocking**, not informational. Proposal only — not implemented here.

**Rules owner**
1. W2 decision before cluster **b**; W3 text alignment; acknowledge W5 as separate cleanup.

---

## 10. Final readiness verdict

**PARTIAL.**

- **Development on an isolated copy — READY.** Code gates are green, the deployed system and export tooling both equal HEAD (genuine v2 export), MR propagation is confirmed live, the preflight surfaces the one real-world wrong identity without proposing a rewrite, and no false positives appear on the remaining 10 artifacts / 65 powers / 3 effects. Cluster **d** (Breath/Limited) work can start on a copy once R-1/R-2/R-5(RO)/R-17 are logged.
- **Production cutover — NOT AUTHORIZED.** Open: **W1 is behavior-changing** (legacy plays Transformation Growth by name; stored identity is Armor+TempHP) and unresolved; N1 seed skew (world 57 vs pack 60) means the world is not provably seed-60 content; no isolated copy; R-17 code fixed but **not yet re-verified on Forge after deploy** (§7.1); K9 pack rebuild not run (pack-sourced artifacts would fail closed after a hard cut); W2 rules decision pending for cluster b.

Zero blocking preflight entries is **not** a readiness criterion here. The four informational entries represent one unresolved manual finding on a live character, and this revision shows that finding would change table behaviour under ID routing — the informational severity understates it. Treat W1 as blocking for any cluster that retires name-based Transformation routing.

### Evidence

`docs/audits/FORGE_REALITY_AUDIT_PRE_K8_V2.evidence.json` — machine-readable extract of the genuine v2 export (counts, per-actor MR, per-artifact provenance flags, preflight entries, v1↔v2 comparison, N1/N2/W1 evidence). Raw export and dry-run output remain outside the repository (`%TEMP%\forge-snapshot-v2-real.json`, `%TEMP%\forge-dryrun-v2-real\`).
