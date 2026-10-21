/**
 * Autofire attack mode — Stepped Attack Chain, one shared Attack Roll.
 *
 * Before rolling, declare ordered attack slots up to Attack Capacity
 * (`1 + extraTargets`). The same creature MAY appear in several slots. Every slot
 * after the first must be within 4 m of the preceding slot's target and within the
 * Power's Range.
 *
 * ONE Attack/Casting Roll. Slot i (1-based) needs
 *   TN(i) = Target Defense(i) + 4×(i−1) + 4×DeclaredPaidRaises.
 * The +4 steps are NOT Paid Raises. The first miss/resistance ends the chain;
 * earlier hits remain valid. Dive for Cover cannot be used.
 *
 * ONE shared Damage Roll (Martial Weapon Damage or Spell Focus + Power dice) is
 * rolled once in full; each successful slot is a separate hit with separate
 * Damage Negation (declared BEFORE the roll, applied as an omitted prefix of the same
 * ordered dice) and separate mitigation. Slots are never deduped by token id.
 * See `autofire-shared-damage.ts` for the dice-omit convention.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getTargetEvade } from './attack-executor.js';
import { resolveBurstTarget } from './aoe-melee-resolution.js';
import { createAutofireDamageSession, endAutofireSession, newAutofirePowerUseId, readAutofirePowerUseId, registerAutofireSession, sharedDamageForHit, } from './autofire-shared-damage.js';
import { autofireDamageFlags, autofireRequiredTn, autofireSlotTnSurcharge, } from './autofire-stepped.js';
export { AUTOFIRE_CHAIN_LINK_M, autofireRequiredTn, autofireSlotTnSurcharge, isAutofireSlotLegal, evaluateAutofireChain, } from './autofire-stepped.js';
/** Detect Autofire mode from a radial option / power item. */
export function detectAutofire(option) {
    try {
        if (option.source === 'npc-attack') {
            return !!option.npcAutofire;
        }
        if (option.source !== 'power' || !option.item)
            return false;
        const tid = String(option.item.system?.templateId || '');
        if (tid === 'active-ranged-weapon-autofire')
            return true;
        const mech = resolvePowerMechanics(option.item);
        return !!mech?.autofire && Math.floor(Number(mech.autofire.extraTargets) || 0) > 0;
    }
    catch {
        return false;
    }
}
/** Attack slots after the first (Autofire(X) → X). */
export function getAutofireExtraTargets(option) {
    try {
        if (option.source === 'npc-attack') {
            return Math.max(0, Math.floor(Number(option.npcAutofireExtraTargets) || 0));
        }
        if (option.source !== 'power' || !option.item)
            return 0;
        const mech = resolvePowerMechanics(option.item);
        if (mech?.autofire) {
            return Math.max(0, Math.floor(Number(mech.autofire.extraTargets) || 0));
        }
        const tid = String(option.item.system?.templateId || '');
        if (tid === 'active-ranged-weapon-autofire') {
            const aoe = option.item.system?.aoe;
            const targets = Math.max(1, Math.floor(Number(aoe?.targets) || 1));
            return Math.max(0, targets - 1);
        }
    }
    catch {
        /* ignore */
    }
    return 0;
}
/** Attack Capacity: maximum number of declared attack slots. */
export function getAutofireMaxTargets(option) {
    return 1 + getAutofireExtraTargets(option);
}
function resultLabel(r) {
    switch (r) {
        case 'hit':
            return 'Hit';
        case 'miss':
            return 'Miss (chain ends)';
        case 'negated':
            return 'Negated by reaction (chain ends)';
        case 'cancelled':
            return 'Damage cancelled (chain ends)';
        default:
            return 'Could not resolve target (chain ends)';
    }
}
function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function buildChainSummaryHtml(rows, attackTotal, paidRaises, declared) {
    const body = rows
        .map((r) => `<tr><td>${r.slot}</td><td>${escapeHtml(r.name)}</td><td>${r.tn ?? '—'}</td><td>${resultLabel(r.result)}${r.result === 'hit' && r.omitted ? ` (−${r.omitted} shared dice by Negation)` : ''}</td></tr>`)
        .join('');
    const notChecked = declared - rows.length;
    const tail = notChecked > 0
        ? `<p class="notes">${notChecked} later slot${notChecked === 1 ? '' : 's'} not checked.</p>`
        : '';
    return (`<div class="mastery-autofire-summary"><h3><i class="fas fa-bullseye"></i> Autofire — Stepped Chain</h3>` +
        `<p>Shared roll <strong>${attackTotal}</strong>. TN = Defense + 4×(slot−1)` +
        (paidRaises > 0 ? ` + ${paidRaises}×4 (Paid Raises)` : '') +
        `. Autofire steps are not Paid Raises.</p>` +
        `<table><thead><tr><th>Slot</th><th>Target</th><th>TN</th><th>Result</th></tr></thead><tbody>${body}</tbody></table>` +
        tail +
        `</div>`);
}
/**
 * Resolve an ordered Autofire chain after the shared Attack Roll.
 * `chainTokenIds` may contain the same token id more than once (one entry per slot).
 * The chain stops at the first miss / negated hit; earlier hits are never undone.
 *
 * Shared Damage Roll (Players Guide §Apply Damage Negation):
 *  1. Walk the chain: attack check + pre-damage reactions per slot (no dice yet).
 *  2. ONE damage card rolls the FULL common pool once. Before any die is revealed,
 *     every pending hit (repeats included) declares Damage Negation in chain order;
 *     the omit count per hit is recorded and the resources are spent per hit.
 *  3. Each hit applies the SAME ordered faces with its own first-N dice omitted.
 *  Cancelling the damage card applies nothing and refunds the Negation spends.
 */
export async function resolveAutofireChain(params) {
    const { attacker, chainTokenIds, attackTotal } = params;
    const paidRaises = Math.max(0, Math.floor(Number(params.declaredRaiseSlots) || 0));
    // One unique id per Autofire Power use: keys the shared Raise allocation and the
    // shared-damage session. Generated here when the attack card did not stamp one.
    const powerUseId = readAutofirePowerUseId(params.flags) || newAutofirePowerUseId(attacker?.id);
    const flags = autofireDamageFlags({
        ...params.flags,
        powerUseId,
        autofireUseId: powerUseId,
    });
    const weaponId = params.weaponId ?? flags.weaponId ?? null;
    if (!chainTokenIds.length)
        return;
    const { aoeCreatureNormalTn, toSharedAoeDamagePayload, runAoePreDamageGate, applySharedAoePayloadToTarget, } = await import('./aoe-melee-resolution.js');
    const isSpell = flags.powerIsSpell === true ||
        flags.tnKind === 'casting' ||
        flags.npcIsSpell === true;
    const rows = [];
    const pending = [];
    try {
        // ---- Phase 1: attack checks + pre-damage reactions (no damage dice revealed) ----
        for (let i = 0; i < chainTokenIds.length; i++) {
            const tid = chainTokenIds[i];
            const slot = i + 1;
            const resolved = resolveBurstTarget(tid);
            if (!resolved?.defender) {
                rows.push({ slot, name: `(unresolved ${tid})`, tn: null, result: 'unresolved' });
                break;
            }
            const { defender, tok } = resolved;
            if (typeof defender.prepareDerivedData === 'function') {
                try {
                    defender.prepareDerivedData();
                }
                catch {
                    /* ignore */
                }
            }
            const normalTn = isSpell
                ? aoeCreatureNormalTn({
                    defender,
                    isSpell: true,
                    spellBaseTn: flags.spellBaseTn,
                    caster: attacker,
                    willing: flags.willingSpellTarget === true,
                })
                : getTargetEvade(defender);
            const requiredTn = autofireRequiredTn({
                defense: normalTn,
                slotIndex0Based: i,
                paidRaises,
            });
            const surcharge = autofireSlotTnSurcharge(i);
            const hit = attackTotal >= requiredTn;
            if (!hit) {
                rows.push({ slot, name: String(defender.name), tn: requiredTn, result: 'miss' });
                if (!isSpell) {
                    try {
                        const { maybeOfferSlip } = await import('../stones/agility-movement-ui.js');
                        await maybeOfferSlip({
                            defender,
                            attacker,
                            hit: false,
                            isAttack: true,
                        });
                    }
                    catch (slipErr) {
                        console.warn('Mastery System | Slip offer failed', slipErr);
                    }
                }
                break;
            }
            // Free Raises stay separate; Autofire steps are never counted as Raises.
            const freeSlots = Math.max(0, Math.floor(Number(flags.freeRaiseSlots) || 0));
            const slotFlags = {
                ...flags,
                raiseOutcome: 'full',
                normalTn,
                raiseTn: requiredTn,
                autofireSlot: slot,
                autofireStepSurcharge: surcharge,
                declaredRaiseSlots: paidRaises,
                freeRaiseSlots: freeSlots,
                successfulRaiseSlots: paidRaises + freeSlots,
                declaredRaises: Array.isArray(flags.declaredRaises) ? flags.declaredRaises : [],
                stoneBonusRaises: 0,
            };
            // Each successful slot is a separate hit with its own reaction window.
            const gate = await runAoePreDamageGate({
                attacker,
                defender,
                tok,
                attackTotal,
                evadeTn: requiredTn,
                allowDiveForCover: false,
            });
            if (gate.outcome !== 'ready') {
                rows.push({ slot, name: String(defender.name), tn: requiredTn, result: 'negated' });
                break;
            }
            rows.push({ slot, name: String(defender.name), tn: requiredTn, result: 'hit' });
            pending.push({
                slot,
                row: rows[rows.length - 1],
                defender,
                tok,
                requiredTn,
                slotFlags,
                preDamage: gate.preDamage,
            });
        }
        // ---- Phase 2: ONE shared damage roll; Negation committed per hit first ----
        if (pending.length) {
            const session = createAutofireDamageSession({
                useId: powerUseId,
                hitCount: pending.length,
                promptNegation: async (hitIndex, poolDice) => {
                    const hit = pending[hitIndex];
                    const { promptDamageNegationSpend, refundDamageNegationSpend } = await import('./damage-negation.js');
                    const spend = await promptDamageNegationSpend(hit.defender, {
                        attacker,
                        totalDice: poolDice,
                        hitLabel: `Autofire hit ${hitIndex + 1} of ${pending.length}`,
                    });
                    const spent = spend.spent;
                    const hasSpend = !!spent && spent.buff + spent.temp + spent.reserve > 0;
                    return {
                        diceRemoved: spend.diceRemoved,
                        note: spend.note,
                        refund: hasSpend ? () => refundDamageNegationSpend(hit.defender, spent) : undefined,
                    };
                },
            });
            registerAutofireSession(session);
            const roller = pending[0];
            const targetFlags = {
                ...roller.slotFlags,
                targetId: roller.defender.id,
                targetTokenId: roller.tok?.id ?? roller.slotFlags.targetTokenId,
                attackTotal,
                normalTn: roller.requiredTn,
                baseEvade: roller.requiredTn,
                targetEvade: roller.requiredTn,
            };
            let damageResult = null;
            let rollFailed = false;
            try {
                const { showDamageDialog } = await import('../dice/damage-dialog.js');
                damageResult = await showDamageDialog(attacker, roller.defender, weaponId, targetFlags.selectedPowerId || null, 0, targetFlags);
            }
            catch (err) {
                rollFailed = true;
                console.warn('Mastery System | Autofire shared damage roll failed', err);
            }
            if (!damageResult) {
                // Cancelled (or failed) before the roll: no HP, no Specials, no orphan
                // Negation spends, no stale Raise allocation / in-memory payload.
                const refunded = await endAutofireSession(powerUseId, { refund: true });
                if (refunded > 0) {
                    globalThis.ui?.notifications?.info?.(`Autofire damage ${rollFailed ? 'failed' : 'cancelled'} — ${refunded} Damage Negation spend${refunded === 1 ? '' : 's'} refunded.`);
                }
                for (const p of pending)
                    p.row.result = 'cancelled';
            }
            else {
                const sharedFull = toSharedAoeDamagePayload({ ...damageResult, mitigation: null });
                if (sharedFull) {
                    for (let i = 0; i < pending.length; i++) {
                        const p = pending[i];
                        const omit = session.omitCounts[i] ?? 0;
                        // The roller's dice were already shown on the damage card; later hits would
                        // otherwise re-post (and re-animate) the same Roll objects.
                        const perHit = sharedDamageForHit(sharedFull, omit, { keepRolls: i === 0 });
                        p.row.omitted = perHit.omitCount ?? 0;
                        // The roller already received the Specials inside the damage roll; every other
                        // slot (even a repeat on the same creature) is a separate hit.
                        await applySharedAoePayloadToTarget({
                            attacker,
                            defender: p.defender,
                            tok: p.tok,
                            attackTotal,
                            evadeTn: p.requiredTn,
                            shared: perHit,
                            preDamage: p.preDamage,
                            skipSpecials: i === 0,
                            damageLabel: 'Autofire',
                        });
                    }
                }
            }
        }
    }
    finally {
        // Chain complete (or cancelled): drop the shared payload/session and Raise allocation.
        await endAutofireSession(powerUseId);
    }
    try {
        await ChatMessage.create({
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            content: buildChainSummaryHtml(rows, attackTotal, paidRaises, chainTokenIds.length),
        });
    }
    catch (err) {
        console.warn('Mastery System | Autofire summary chat failed', err);
    }
}
//# sourceMappingURL=autofire.js.map