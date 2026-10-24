# CURSOR IMPLEMENTATION ORDER — DF 2026 Skill Rolls: Two Entry Points, One Dialog, Post-Success Raise Allocation

**Date:** 2026-10-24  
**Target:** Destroyed Faith / Mastery System, Foundry VTT 14  
**Status:** Approved UX/rules change, implementation required  
**Primary rule source:** `Destroyed_Faith_Players_Guide_Post_Roll_Skill_Raises_2026-10-24.md` in this package. It supersedes the 2026-10-23 Player's Guide **only for the timing of ordinary Skill Raise effects and matching Social Challenges**. All other currently approved rules remain unchanged.

## 0. YOUR ACTUAL TASK

**IMPLEMENT, not merely document.** Build **two entry points into ONE reusable ordinary-Skill-roll UI and ONE authoritative roll-resolution path**:

1. **Player starts from their Character Sheet.** The player selects their Skill/Specialization or universal Perception, an appropriate Attribute, the **Base TN** (provided verbally by the GM or chosen for the self-initiated check), and the number of **Paid Raises**. They can roll from this interface.
2. **GM starts a Roll Request from the existing GM/chat-roll workflow.** The GM defines the task and **Base TN** (e.g. 12), optionally fixes Perception or specifies a Specialization type, and targets one or several PCs. An actionable **chat request** appears and the targeted players get their existing-style **roll overlay**. Every targeted player can select **their own number of Paid Raises**, see **their own Final TN**, and roll using **their own Skill Rank, Attribute and MR**. The GM's Base TN is fixed/locked in these player overlays. Closing the overlay must NOT destroy the request; players can reopen it from the chat card.

**After a successful ordinary Skill Check**, show a compact **“Use Raises” panel within the result Chat Card**, not another mandatory large modal. It allows the player to assign their chosen Paid Raises **plus automatically available Free Raises** to Scope, Speed, Quality, Efficiency, Insight and Safety. The GM retains final say on whether an effect fits the declared task. **The effect assignment happens AFTER success; only the NUMBER OF PAID Raises is declared before rolling.** A failed roll gives no Raise effects.

The UI/UX and lifecycle should match the enclosed standalone layout demo: `DF_DUAL_SKILL_ROLL_LAYOUT_PREVIEW_2026-10-24.html`. The demo is an interaction sketch, not game code; implement it in the repo's actual Foundry V14 framework/components, styling and socket/message architecture.

**Critical:** Read the actual repo first. Find the TWO existing entry points (Character Sheet Skill Check and GM's chat roll-request/dialog), their roll dialogs, chat templates, socket/request handling, existing chat button handlers and canonical `src/rules/` helpers. Reuse/refactor rather than add a third competing roll subsystem. Do not revert any completed DF-2026 work, including the Aid Retirement and free Perception Rank 2.

## 1. CANONICAL RULES — DO NOT REINTERPRET

The following applies to **ordinary Skill Checks**, including learned Specializations, the universal free starting Perception Skill and Social Challenges. **Combat, Spell/Attack Raises and Ritual effect tiers remain predeclared and continue using their existing UIs/logic.**

- GM/task defines **Base TN**, typically `Task Level × 4` (e.g., Moderate task = 12). It does **not** scale with the character's MR. If the GM request uses an actual opposed/setup TN, use that explicitly provided grounded TN instead of calculating it from the responder's MR.
- Roll normal **relevant Attribute k Mastery Rank** with exploding d8 and all the existing Advantage/Disadvantage, Health, Fear and pool rules. Specialization Rank adds **no dice** and **no automatic result bonus**. Approach determines the relevant Attribute; the GM decides whether it makes sense. 
- For Rank `r` from 0 through 8: `freeAllowance(r) = (r>=8?3 : r>=6?2 : r>=4?1 : 0)`; `paidCap(r) = max(0, r - freeAllowance(r))`. **Paid Raises** can be selected only before the roll as an integer `0..paidCap(r)`. **Do not ask for Free Raise counts before rolling.**
- **`Final TN = Base TN + 4 × declaredPaidRaises`**. A transparent pre-roll preview must always show the new TN as Paid Raises change. The GM-request source Base TN never changes through a player's Paid Raise selection.
- Rank table:

  | Rank | Paid maximum chosen BEFORE roll | Free automatically available ON SUCCESS | Maximum total on success |
  |---:|---:|---:|---:|
  | 0 | 0 | 0 | 0 |
  | 1 | 1 | 0 | 1 |
  | 2 | 2 | 0 | 2 |
  | 3 | 3 | 0 | 3 |
  | 4 | 3 | 1 | 4 |
  | 5 | 4 | 1 | 5 |
  | 6 | 4 | 2 | 6 |
  | 7 | 5 | 2 | 7 |
  | 8 | 5 | 3 | 8 |

- **Before roll:** state task and intended base outcome; choose applicable Skill/Perception, approach/Attribute, Base TN, and **the number of Paid Raises only**. The Free allowance is displayed as a **read-only informational perk** (hide the banner completely when allowance is zero). No Raise effects are chosen here. The player can expand **“What do Raises do?”** for a small read-only catalogue; it is explanatory and optional.
- **Single resolution:** once the exact Final TN is set, perform exactly one canonical roll or a genuinely legal Passive Skill Success. A result `>= Final TN` succeeds. Reaching only Base TN while missing Final TN is a failure of the enhanced attempt; no base-stage fallback or recovered/free partial Raises. High rolls do not mint additional Raises.
- **After success:** the available Raise budget is **`declaredPaidRaises + freeAllowance(rankSnapshot)`**. The player assigns zero or more of these to eligible effects from the catalogue: Scope, Speed, Quality, Efficiency, Insight, Safety; multiple of the same effect are allowed as per the Guide. Unspent Raises expire when the result is finalized. Free/Paid are **identical in effect**; display their sources for clarity but don't require assigning “this is the Free one.” The player proposes a specific relevant outcome in concise text; the GM may accept/adjust as fiction permits. Do not add an automatic +4, dice, combat or arbitrary item bonus from these effects.
- **Failed roll:** no effect-allocation panel and no Free Raises awarded. The immutable roll result may still appear in Chat as usual.
- **Untrained:** Rank 0 = no Paid or Free Raises and existing Disadvantage. The GM decides if attempting the professionally specialized result is possible. **Perception starts at Rank 2 automatically** and acts like any normal ranked Skill.
- **Routine work and Passive Skill Value:** retain the Guide's existing automatic routine success/basic outcome and `2 × Attribute` Passive Skill Value for eligible calm checks. If the explicit Paid-raised Final TN is met through a permitted Passive Skill Value, it is a successful check and the same post-success effect allocation is available; routine automatic completion of ordinary work grants only the basic result. Do not accidentally permit passive success in opposition/active danger.
- **Skill Opposition:** a setup actor declares Paid Raises and rolls; on success they resolve post-success Raise allocation **BEFORE any defender rolls**; the successful setup **roll total** sets the opposition TN. An attacker cannot wait to see the defender's roll and then choose an enhancement changing the contest. The defender follows the ordinary procedure for its own Skill Check.
- The changes to Raise EFFECT TIMING apply only here. Rituals must still declare named tiers and generic effects **before** rolling because their Sealed Stone costs and tier outcome are bound to those declarations. Combat Raises still require pre-roll allocation to Damage/Specials. No Aid, Skill Points, Skill Spend, Social Combat meters, or retired Pursuit progress meters.

### Numeric example that must appear in UI and tests

`Tracking Rank 4`, `Wits 6`, `MR 3`, `Base TN 12`:

- Banner: **“1 Free Raise on success”**.
- Paid selector options: `0 Paid → TN 12`, `1 Paid → TN 16`, `2 Paid → TN 20`, `3 Paid → TN 24`.
- If the player chooses `2`, show **“Final TN 20”**, **“6k3”**, **“up to 3 Raises on success: 2 Paid + 1 Free”**.
- If result is `25`, inline Chat Card lets them allocate 3 Raise effects (e.g. `Insight 1 + Scope 2`, subject to GM). If result is `18`, no effects even though the unraised TN 12 was reached.
- For a second targeted PC with `Perception Rank 2`, the **same GM Base TN 12** allows Paid `0..2`, **no Free banner**; choosing 2 produces Final TN 20. These choices are independent and must not change the GM-requested Base TN or another player's choices.

## 2. UX: EXACTLY TWO ENTRY POINTS, SHARED PLAYER ROLL UI

### A. GM launches a Skill Roll Request through the existing chat/GM workflow

This is a **REQUEST dialog**, NOT an interface for GM to buy Paid Raises for other actors.

```text
╭──────────────────────────────────────────╮
│  SL · SKILLPROBE ANFORDERN           [×] │
│                                          │
│  Aufgabe                                │
│  [ Spuren am Nordtor untersuchen      ] │
│                                          │
│  Basis-Zielzahl (TN)                     │
│  [ 12  ▼ ]   Moderate · Task Level 3     │
│                                          │
│  Geforderter Check                       │
│  [ Passende Spezialisierung       ▼ ]   │
│      oder  [Perception (fest)]           │
│                                          │
│  Spieler / Charaktere                    │
│  [● Mira] [● Evarr]  [+ hinzufügen]      │
│                                          │
│  Kurzbeschreibung (optional)             │
│  [ Worauf achtet ihr?                 ]  │
│                                          │
│  [ Abbrechen ]    [ Anfrage senden ]     │
╰──────────────────────────────────────────╯
```

**GM requirements:**

1. GM chooses one grounded Base TN and target actor(s)/player owner(s). Default numeric task preset `4,8,12,16,20,24,28,32+` and/or custom Base TN as supported by the existing system. Do not force a fixed Attribute if the task permits different approaches; provide an optional suggested method only. GM can request a fixed universal Perception check, or leave specialization selection to each player when customized Skills are appropriate.
2. “Send request” creates or extends the **existing actionable Chat request** with task, **Base TN**, initiator, targeted actor UUIDs, specialization constraint or allowance, and an immutable request ID. Do not resolve any roll at send time.
3. Players targeted by the request receive the existing Foundry-style roll **overlay** (or in-app prompt) with the Base TN prefilled and **LOCKED**. Players can choose their own applicable Specialization/Perception, Attribute and Paid Raises. Each person's Final TN updates independently. Other players cannot mutate a different player's declaration.
4. The request must also be actionable from the GM's chat card after a player closes the overlay or reconnects. Reopening restores pre-roll state without implicitly rolling.
5. **One request may target multiple PCs**. It remains one GM Base TN, but produces **individual rolled TNs and results** per actor. Chat can render one request card with participant statuses, individual result cards/replies, or integrate with the repo's established result UI; avoid chat spam and duplicate automated posts.
6. The GM sees the requested **Base TN** and each returned actor's **chosen Paid Raises, Free allowance, Final TN and final result**. No rule silently resets the chosen Paid Raises to zero because the request originated with the GM.

### B. Player launches the Skill Check from their Character Sheet

The Character Sheet's roll control opens **the exact same player component** with source `sheet`. Unlike a GM request, it starts without a server-assigned Base TN; allow the player to select/type the GM-advised TN or choose a task preset, consistent with existing GM-authority conventions.

```text
╭──────────────────────────────────────────╮
│  SKILL CHECK · TRACKING              [×] │
│  Tracking · Rank 4     Wits 6 · MR 3      │
│  Pool: 6k3 (exploding d8)                │
│                                          │
│  Basis-Zielzahl                           │
│  [ 12  ▼ ]  Moderate · Task Level 3      │
│                                          │
│  ✦ Bei Erfolg: 1 Free Raise verfügbar    │
│                                          │
│  Wie viele Paid Raises?                  │
│  [ 2 Paid → Final TN 20           ▼ ]     │
│                                          │
│  ⓘ Was können Raises bewirken? [zeigen]  │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │  BASE TN 12    +8     FINAL TN 20  │  │
│  │  RESULT ON SUCCESS: 2 Paid +1 Free│  │
│  └────────────────────────────────────┘  │
│                                          │
│  [ Abbrechen ]     [ Würfeln · 6k3 ]     │
╰──────────────────────────────────────────╯
```

**Player source distinction:** GM-request overlay has exactly this interior layout, but “Base TN 12 — vom SL vorgegeben” is **read-only**; the sheet source has an editable/preset Base TN. Both use the same source-of-truth canonical calculation and same result UI. If a request is explicitly fixed to Perception, do not allow bypassing it by switching to another Skill. If unspecified, show a compact Specialization picker. If player switches Specialization, update Rank/free/paidMax and clamp invalid old Paid Raise selection safely with an explanation.

### C. Shared pre-roll dialog requirements

- Compact window ~430–500 logical px on desktop, responsive on small windows. Label–input pairs, clear hierarchy, large Final TN and Roll button. Keep the Free banner **only when `freeAllowance > 0`**. No giant mandatory effect-selection list before rolling.
- Paid selector should be a **single dropdown** generated from allowed Paid counts. Each label includes the **corresponding Final TN**: `0 Paid – TN 12`, `1 Paid – TN 16`, etc. No independent Free dropdown. The displayed Final TN, chat preview and final roll must all use the **same** computed value.
- Optional collapsible help *“What can Raises do?”*: six short definitions without interactive effect selection. This gives players the information they need when deciding how high to raise the TN.
- Clearly distinguish **“Base TN (GM-set)”** vs **“Base TN (entered locally)”**. Never let player HTML/DTO overwrite GM-set request TN. Use authoritative request data; validate at roll execution, not only the UI.
- No Aid button or bonus. Never show or spend Skill Points. Accessibility: keyboard navigation, focus, sensible labels, close/reopen without losing a request, usable with DE/EN locale and low viewport heights.

## 3. CHAT RESULT: INLINE EFFECT ALLOCATION (AFTER SUCCESS)

```text
╭────────────────────────────────────────────╮
│  ✓ TRACKING SUCCEEDED                      │
│  25 rolled  ≥  Final TN 20                 │
│  Base 12  ·  2 Paid (+8 TN)  ·  1 Free     │
│                                            │
│  RAISES TO ALLOCATE                   3/3  │
│  Scope        [ − ]  0  [ + ]              │
│  Speed        [ − ]  0  [ + ]              │
│  Quality      [ − ]  0  [ + ]              │
│  Efficiency   [ − ]  0  [ + ]              │
│  Insight      [ − ]  0  [ + ]              │
│  Safety       [ − ]  0  [ + ]              │
│                                            │
│  Specific benefit                          │
│  [ Two more sets of tracks; one clue ... ]│
│                                            │
│  [ Finish without effects ] [Apply Raises]│
╰────────────────────────────────────────────╯
```

**Actual effect values** (summary only; use printed detailed limitations): Scope = double eligible quantity each Raise; Speed = halve feasible time per Raise; Quality = improve agreed quality/clarity one step; Efficiency = reduce avoidable waste/effort; Insight = one relevant supportable clue; Safety = mitigate one foreseeable secondary complication. Show short hover descriptions and accessible help. Players may allocate `0..available` total. After submission, store a **textual outcome proposal plus effect counts** on the relevant Chat result and mark the allocation finalized; the GM can adjudicate/adjust in normal play. **Do not automatically generate money, equipment, extra actions, lore facts, healing, combat damage or mechanical bonuses that aren't in the printed rules.**

- On success, reveal and persist an interactive allocation area under the existing roll card, or an “Assign Raises” expansion button on that card. Avoid opening a second blocking popup for the default flow. Support reopening after chat re-render/reload until finalized.
- Save **`paidRaisesDeclared`**, **`skillRankAtRoll`**, **`freeRaisesAvailableAtSuccess`**, **`finalTn`**, **`rollTotal`**, **`effectAllocation`**, and `allocationStatus` to an appropriate existing chat flag/data object. Do not recalculate available Raises from a Skill that has since leveled up; use the **at-roll snapshot**.
- If the check fails, show **“Failed — Final TN X”** and no available Raise effects, even if Base TN is met. The GM may narrate partial progress without retroactively granting Raise perks.
- Effect selection is performed **after success but before finalizing the fictional outcome**. For Skill Opposition, complete setup actor allocation **before** the first defender check. Allow pending allocation to be resolved before progressing the prompted contest.
- Do not treat Paid Raises as a resource consumed from the actor. They only increase the declared target difficulty for **this one check**.
- Combat/Spell/Ritual chat cards must retain their existing pre-allocated effects and MUST NOT acquire this Skill post-success panel.

## 4. ONE SHARED DATA CONTRACT / RULE HELPER

Discover the project's conventions, then implement/extend a type-safe pure helper in `src/rules/` for ordinary Skill Raise declaration and success calculation, with a reusable UI component invoked from both entry points. Illustrative DTO — adapt actual names and types to repo:

```ts
type SkillRollSource =
  | { kind: 'sheet' }
  | { kind: 'gm-request'; requestId: string; requestMessageUuid: string; gmBaseTn: number };

type SkillRollDraft = {
  actorUuid: string;
  specializationId: string | 'perception' | 'untrained';
  attributeKey: string;
  baseTn: number;      // locked when source.kind === 'gm-request'
  paidRaises: number;  // chosen pre-roll
  source: SkillRollSource;
};

type SkillRollResolved = {
  actorUuid: string;
  requestId?: string;
  skillRankAtRoll: number;
  baseTn: number;
  paidRaisesDeclared: number;
  freeRaisesAvailableAtSuccess: number;
  finalTn: number;
  rollTotal: number;
  success: boolean;
  allocationStatus: 'pending' | 'finalized' | 'not-applicable';
  effectAllocation?: Record<'scope'|'speed'|'quality'|'efficiency'|'insight'|'safety', number>;
  proposedBenefit?: string;
};
```

Prefer the **existing shared rule engine** and original roll-result event/Chat Card architecture. Never duplicate the exploding-d8 roll algorithm in a dialog. Use `finalTn = baseTn + 4*paidRaises` in one canonical place with validation. Enforce actor permissions, authorized GM requests and paid-cap constraints server-side/at the trusted chat action boundary. Do not trust mutable form fields for a GM-request Base TN.

At roll time, snapshot the Skill Rank / Attribute / MR and other relevant state. A request created for two PCs stores one fixed Base TN, but each response is resolved with its own actor snapshot and its own Paid count. Use a stable `(requestId, actorUuid)` identity (with the repo's actual Actor ownership model) to prevent duplicate involuntary roll submissions. Follow existing GM reroll and multi-owner rules rather than inventing parallel socket patterns. Archived/historical Chat Messages remain readable and are not backfilled with interactable Raised-effect buttons.

## 5. REQUIRED FULL END-TO-END BEHAVIOR

### Path 1 — Character Sheet

1. Player clicks a trained Specialization or universal Perception in their sheet.
2. Shared skill-roll dialog opens with that exact Skill/Rank; player chooses the applicable Attribute and Base TN (according to existing permission policies).
3. Show free allowance banner only for Ranks >=4. Player selects **Paid Raises** from TN-labeled dropdown, preview updates in place.
4. Player clicks Roll. One canonical Attribute k MR roll is recorded with Base TN, Paid count, Final TN and immutable actor/source snapshots.
5. On success, existing result card offers inline Raise allocation with `Paid + Free` available. Player assigns allowable effects and finishes. On failure, card shows failure and no perks.

### Path 2 — GM request in Chat

1. GM activates the **existing GM Roll Request/dialog**, sets a task and Base TN (example 12) and addresses one or more PCs.
2. Chat displays one actionable GM request. Targeted player sees an overlay with **GM Base TN locked** and can reopen via Chat if dismissed.
3. Each player chooses applicable Skill/Attribute (if request allows choice) and his/her **own Paid Raises**. The dropdown shows Final TN for that player. Free allowance appears as information only.
4. Each player's single roll uses the same calculator as the sheet. GM sees `Base 12 -> +4*Paid -> Final` alongside the result per participant.
5. Each successful player can assign their effects inline on their result. The GM request remains valid for other participants; one player's Raise selection never overwrites another's.
6. Completed requests can be reviewed after world reload, with no duplicated rolls or vanished allocations.

## 6. EXPLICIT OUT-OF-SCOPE / DO NOT REGRESS

- **Combat Raises** (including Intellect Free Raises) still have NUMBER AND EFFECTS declared before the Attack or Spell roll; combat reaction and Special rules unchanged.
- **Ritual Raises** (named effect tier / Stone cost) still have NUMBER AND EFFECTS fixed before the Ritual roll. No “Use Raises” panel for Rituals.
- No Aid buttons, +4 Aid, Aid Reaction, Skill Points, Skill Spend, Epic Roll, Social Combat phases, Pursuit meter or Death Checks.
- Do not remove/rewrite active Character Builder, the five selected starting Specializations on Rank 2, automatic Perception Rank 2, Echo Imprints, Stones, Artifact-granted PL exception, XP ledger, spells or established migration backups.
- Do not reset PCs/actors or touch a campaign World. No commit/tag/release without user authorization.
- Existing terminal QA state (`297` test files, `3186` tests passing at last report) is a **baseline** to revalidate; do not claim results without running tests.

## 7. REQUIRED AUTOMATED TESTS / ACCEPTANCE

Extend tests to cover **both entry points, shared calculation, reactive TN, success card, persistence and permissions**. At minimum:

1. Rank table all Ranks 0–8: Paid cap and Free allowance exactly as printed. Rank 4 offers Paid `[0,1,2,3]` and one Free; Rank 8 offers Paid `[0..5]` and three Free.
2. Base TN 12, Rank4 Paid 0→Final12, Paid1→16, Paid2→20, Paid3→24. Ranks 0–3 correctly hide Free banner.
3. Rank4, paid2, Wits6 MR3, rolled25→success and exactly three available Raise effects. Rolled18→failure and zero effects despite 18>=Base12. Roll pool remains 6k3, not Rank+Attr or half pool.
4. Rank4, paid0, base12, successful roll→one Free Raise available without preselecting it. Rank2 Perception paid2→Final20 and no Free banner.
5. Untrained ordinary attempt→Disadvantage, Paid cap0, no post-roll Raises.
6. Paid selection validates at underlying handler/API, including forged `paidRaises=8` for Rank2; rejects invalid or stale actor/rank/source combinations.
7. **Sheet source:** editable Base TN and normal selector; success card persists allocations.
8. **GM request source:** GM sets TN12; player cannot modify that source TN via DOM/form/socket; two invited PCs can independently select different paid amounts and get different Final TNs; request chat remains TN12.
9. GM sends a request; target player's overlay appears, can dismiss/reopen from chat; targeted roll resolves once, does not block others. Unowned actors/non-addressed users cannot submit as targets.
10. Changing selected Skill or Rank within a draft updates maxPaid/Free and safely clamps previously selected Paid Raises; no negative/overflow state.
11. Result card's six effect categories enforce total allocation <= available, can save/finalize/reopen; finalized state remains after rerender and reload, with at-roll Rank snapshot.
12. On fail, no Raise allocation panel even when result >= Base but < Final TN; high roll never grants more than Paid + Free.
13. For Skill Opposition, allocation is resolved after successful setup and before defender's check; defender cannot be retroactively affected by allocating after their check.
14. Existing Combat and Ritual Raises are still predeclared; those Chat Cards must NOT open the new post-roll effects UI.
15. Existing Aid is still absent; all existing migration, Perception, Imprints, Rituals, Social Challenge, Spell TN and Death/Fear tests remain green.
16. DE/EN localization parity; dialog keyboard operation; no chat buttons pointing to removed handlers; events cleanup on re-render.
17. Any previously persisted roll result/historic chat can render safely; don't interpret old Chat Cards as new raised checks.
18. Passive Skill Success vs routine automatic completion: Passive may use selected Paid + free on eligible success, routine basic automatic outcome gets no extra Raise effects.

Run:

```bash
npx tsc --noEmit
npm test
npm run build
```

Foundry-14 live smoke only in a **dedicated empty test world**, never the existing Forge campaign. If isolated World or e2e credentials are not available, report manual UI steps explicitly as **NOT RUN**, not PASS. Include a compact 2-player GM request test, the Character Sheet self-roll and one success/failure result card.

## 8. DELIVERABLES FROM CURSOR

1. Complete production code: shared calculation/helper, shared player roll dialog, GM request integration, Character Sheet integration, Chat Raise-allocation UI, permissions, localization, migration-safe chat persistence and tests.
2. Update existing docs at `docs/migrations/DF_2026_RULES_MIGRATION_PLAN.md` and `docs/migrations/DF_2026_RULES_QA_REPORT.md`; add a brief rule change note that **ordinary Skill effects are allocated on success**, distinguishing Combat/Rituals.
3. Ensure the revised Markdown Player's Guide (included with this package) is available in the repo's canonical rule reference location; do not overwrite user edits blindly. The new Guide is the source of truth for this UX/Skill timing change.
4. Return a German implementation report: actual changed paths, new interface entry points, test counts/commands, manual Foundry steps remaining and precise unresolved blockers. **Do not stop at a plan**. No commit/tag/release without approval.

### Definition of Done

**Both places the user actually clicks lead into the same correct skill check:** the Character Sheet skill roll and the GM chat-request overlay. The GM sets the Base TN; the player adds Paid Raises; Final TN updates instantly; a success unlocks Paid + Free Raise effects on the result card; a failed raised check unlocks nothing. Two players can each choose different Paid Raises against the same GM request without corrupting any other's state. No existing DF-2026 or Combat/Ritual mechanics regress.
