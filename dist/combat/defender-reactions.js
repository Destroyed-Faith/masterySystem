/**
 * Defender reactions — prompted when incoming damage is applied (after Phasing).
 * Spends `RoundState.reactionActions`, marks `usedPowerIdsThisRound`, and applies
 * one-hit armor / reaction DR from power `mechanics` where present.
 *
 * Reaction: Evade adds its bonus to the Evade TN of the triggering attack.
 * If (Evade + bonus) > attack total, the hit is negated — no damage. No roll.
 *
 * Ghost Slip–style powers (`phasing.reactionSingleHit`) are omitted here: they
 * interact with the phasing step, not post-phasing mitigation.
 */
import { getActionEconomyActor, getReactionActionsSummary, hasPowerBeenUsedThisRound, markPowerUsedThisRound, spendReactionAction, } from './action-economy.js';
import { buildActorMechanicsBreakdown, resolvePowerMechanics } from '../utils/power-mechanics.js';
import { buildArtifactReactionOptions } from '../radial-menu/artifact-options.js';
import { getPrimaryTokenForActor } from '../utils/mechanics-adjacency.js';
import { distanceBetweenTokensMeters } from './threatened-ranged.js';
import { buildBasicReactionItems, isBasicReactionItem, } from './basic-combat.js';
function mechanicsOf(item) {
    if (item?.mechanics && typeof item.mechanics === 'object') {
        return item.mechanics;
    }
    return resolvePowerMechanics(item);
}
/**
 * Reaction Evade vs a known attack total.
 * Hit rule is attack ≥ Evade, so the reaction negates only when
 * (baseEvade + bonus) > attackTotal.
 */
export function evaluateReactionEvadeNegation(baseEvade, bonus, attackTotal) {
    const base = Math.max(0, Math.floor(Number(baseEvade) || 0));
    const b = Math.max(0, Math.floor(Number(bonus) || 0));
    const effectiveEvade = base + b;
    const atk = attackTotal == null || !Number.isFinite(Number(attackTotal))
        ? null
        : Math.floor(Number(attackTotal));
    if (atk == null) {
        return { baseEvade: base, bonus: b, effectiveEvade, attackTotal: null, negates: false, unknown: true };
    }
    return {
        baseEvade: base,
        bonus: b,
        effectiveEvade,
        attackTotal: atk,
        negates: b > 0 && effectiveEvade > atk,
        unknown: false,
    };
}
function defenderEvadeFromActor(defender) {
    const sys = defender?.system;
    const total = Number(sys?.combat?.evadeTotal);
    if (Number.isFinite(total) && total > 0)
        return Math.floor(total);
    const evade = Number(sys?.combat?.evade);
    return Number.isFinite(evade) ? Math.max(0, Math.floor(evade)) : 0;
}
function defenderActorForEconomy(defender) {
    return (getActionEconomyActor(defender) ?? defender);
}
function userMayPromptForActor(actor) {
    const u = globalThis.game?.user;
    if (!u)
        return false;
    if (u.isGM)
        return true;
    return !!actor?.isOwner;
}
async function postReactionChat(content, defender) {
    try {
        await globalThis.ChatMessage?.create?.({
            user: globalThis.game?.user?.id,
            speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: defender }),
            content: `<p class="mastery-reaction-msg">${content}</p>`,
        });
    }
    catch (e) {
        console.warn('Mastery System | defender-reactions chat failed', e);
    }
}
/**
 * Reaction-type power items the defender can still use this round (equipped, not used).
 *
 * Includes:
 *   - regular `power` items with `system.powerType === 'reaction'`, and
 *   - synthetic items materialized from each equipped artifact's
 *     `system.levelProgression` rows of type `'Reaction'` (up to
 *     `system.currentLevel`). Synthetic items carry an `id` like
 *     `artifact-reaction:<artifactItemId>:<level>` so they participate
 *     in the same once-per-round bookkeeping.
 */
export function getEligibleReactionPowers(defender, combat) {
    if (!defender || !combat)
        return [];
    const owner = defenderActorForEconomy(defender);
    const items = owner.items;
    if (!items)
        return [];
    const out = [];
    for (const item of items) {
        if (item.type !== 'power')
            continue;
        const sys = item.system;
        if (sys?.powerType !== 'reaction')
            continue;
        if (sys?.equipped === false)
            continue;
        if (sys?.showInRadialMenu === false)
            continue;
        if (hasPowerBeenUsedThisRound(owner, combat, item.id))
            continue;
        const mech = resolvePowerMechanics(item);
        if (mech?.phasing?.reactionSingleHit)
            continue;
        out.push(item);
    }
    // Artifact reactions — surfaced as synthetic items that look enough
    // like a regular power-item for the dialog. They never carry
    // structured mitigation in `mechanics`, so the chat message will
    // surface the rules text instead of a numeric DR/Armor patch.
    try {
        const artifactReactions = buildArtifactReactionOptions(owner);
        for (const opt of artifactReactions) {
            if (hasPowerBeenUsedThisRound(owner, combat, opt.id))
                continue;
            out.push({
                id: opt.id,
                name: opt.name,
                type: 'artifact',
                system: { powerType: 'reaction', description: opt.description },
                artifactReactionMeta: {
                    artifactItemId: opt.item?.id,
                    artifactName: opt.item?.name,
                    description: opt.description,
                },
            });
        }
    }
    catch (err) {
        console.warn('Mastery System | defender-reactions: artifact reaction collection failed', err);
    }
    // Universal Basic Reactions — always available (not Powers; never become spent).
    try {
        for (const basic of buildBasicReactionItems(owner)) {
            out.push(basic);
        }
    }
    catch (err) {
        console.warn('Mastery System | defender-reactions: basic reaction injection failed', err);
    }
    return out;
}
function extractMitigationFromMechanics(mech) {
    if (!mech)
        return { reactionArmorFlat: 0, reactionDrPct: 0 };
    const reactionArmorFlat = Math.max(0, Math.floor(Number(mech.armor) || 0));
    const reactionDrPct = Math.max(0, Math.min(100, Math.floor(Number(mech.damageReductionPct) || 0)));
    const initiativeGain = Math.max(0, Math.floor(Number(mech.initiativeGain) || 0));
    return { reactionArmorFlat, reactionDrPct, initiativeGain: initiativeGain || undefined };
}
function formatPowerPreviewLine(item, baseEvade, attackTotal) {
    const mech = mechanicsOf(item);
    const name = String(item?.name ?? 'Reaction').trim();
    const bits = [];
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    const armor = Math.max(0, Math.floor(Number(mech?.armor) || 0));
    const dr = Math.max(0, Math.floor(Number(mech?.damageReductionPct) || 0));
    const ini = Math.max(0, Math.floor(Number(mech?.initiativeGain) || 0));
    if (item?.basicReaction === 'counterattack') {
        bits.push('Basic Attack vs triggering creature (Weapon + MR × 2d8)');
    }
    if (ev > 0) {
        const evEval = evaluateReactionEvadeNegation(baseEvade, ev, attackTotal);
        if (evEval.unknown) {
            bits.push(`+${ev} Evade (attack total unknown — cannot preview)`);
        }
        else if (evEval.negates) {
            bits.push(`+${ev} Evade: ${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal} → <strong style="color:#2ecc71">NEGATES hit</strong>`);
        }
        else {
            bits.push(`+${ev} Evade: ${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal} → <strong style="color:#e74c3c">still hits</strong>`);
        }
    }
    if (armor > 0)
        bits.push(`+${armor} Armor (this hit)`);
    if (dr > 0)
        bits.push(`+${dr}% DR (this hit)`);
    if (ini > 0)
        bits.push(`+${ini} Initiative after resolve`);
    if (mech?.tempHP)
        bits.push(`Temp HP ${mech.tempHP} if damage remains`);
    if (!bits.length) {
        const desc = String(item?.artifactReactionMeta?.description || item?.system?.description || '').trim();
        bits.push(desc ? desc.slice(0, 120) : 'no numeric mitigation');
    }
    return `<li><strong>${name}</strong> — ${bits.join('; ')}</li>`;
}
const INITIATIVE_GAIN_TEMPLATE = 'reaction-initiative-gain';
const ALLY_REACTION_RANGE_M = 4;
/** Ally-protection reactions (help another creature in range). */
export function isAllyReactionPower(item) {
    const tid = String(item?.system?.templateId ?? '').toLowerCase();
    if (tid.startsWith('reaction-ally-'))
        return true;
    const sub = String(item?.system?.subfamily ?? '').toLowerCase();
    if (sub === 'ally')
        return true;
    const name = String(item?.name ?? '').toLowerCase();
    return /\bally\b/.test(name);
}
function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function listReactionPowerNames(powers) {
    if (!powers.length)
        return '<em>none eligible</em>';
    return powers
        .map((p, i) => `<li>${i + 1}. <strong>${escHtml(String(p?.name ?? 'Reaction'))}</strong></li>`)
        .join('');
}
/**
 * Defender + nearby allies who still have a Reaction and at least one eligible power
 * for this damage window (defender: own reactions; allies: Ally-* reactions only).
 */
export function collectReactionWindowEntries(params) {
    const { defender, attacker, combat } = params;
    const out = [];
    const economyDef = defenderActorForEconomy(defender);
    const defSummary = getReactionActionsSummary(economyDef, combat);
    const defPowers = dedupeInitiativeGainReactions(getEligibleReactionPowers(economyDef, combat));
    out.push({
        actor: economyDef,
        name: String(defender.name ?? 'Defender'),
        remaining: defSummary.remaining,
        total: defSummary.total,
        powers: defPowers,
        role: 'defender',
        distanceM: 0,
    });
    try {
        const defToken = getPrimaryTokenForActor(defender);
        if (!defToken || typeof canvas === 'undefined')
            return out;
        const attackerId = attacker?.id ?? null;
        const seenActorIds = new Set([
            String(economyDef.id ?? ''),
            String(defender.id ?? ''),
        ]);
        for (const token of canvas.tokens?.placeables ?? []) {
            if (!token?.actor || token.id === defToken.id)
                continue;
            const other = token.actor;
            const otherId = String(other.id ?? '');
            if (!otherId || seenActorIds.has(otherId))
                continue;
            if (attackerId && otherId === String(attackerId))
                continue;
            const dd = defToken.document?.disposition ?? defToken.disposition;
            const od = token.document?.disposition ?? token.disposition;
            const HOSTILE = globalThis.CONST?.TOKEN_DISPOSITIONS?.HOSTILE ?? -1;
            if (od === HOSTILE)
                continue;
            if (dd !== od)
                continue;
            const dist = distanceBetweenTokensMeters(defToken, token);
            if (!Number.isFinite(dist) || dist > ALLY_REACTION_RANGE_M)
                continue;
            const economyAlly = defenderActorForEconomy(other);
            const allyId = String(economyAlly.id ?? otherId);
            if (seenActorIds.has(allyId))
                continue;
            seenActorIds.add(allyId);
            seenActorIds.add(otherId);
            const summary = getReactionActionsSummary(economyAlly, combat);
            if (summary.remaining <= 0)
                continue;
            const allyPowers = getEligibleReactionPowers(economyAlly, combat).filter(isAllyReactionPower);
            if (!allyPowers.length)
                continue;
            out.push({
                actor: economyAlly,
                name: String(other.name ?? 'Ally'),
                remaining: summary.remaining,
                total: summary.total,
                powers: allyPowers,
                role: 'ally',
                distanceM: Math.round(dist * 10) / 10,
            });
        }
    }
    catch (err) {
        console.warn('Mastery System | reaction window ally scan failed', err);
    }
    return out;
}
async function announceReactionWindow(params) {
    const { defender, attacker, rawDamage, entries } = params;
    const defName = escHtml(String(defender.name ?? 'Defender'));
    const atkName = escHtml(String(attacker?.name ?? 'Attacker'));
    const actionable = entries.filter((e) => e.remaining > 0 && e.powers.length > 0);
    let body;
    if (!actionable.length) {
        const def = entries.find((e) => e.role === 'defender');
        body = `<p>${def
            ? def.remaining <= 0
                ? `<strong>${defName}</strong> has <strong>no Reactions left</strong> this round (${def.total - def.remaining}/${def.total} used).`
                : `<strong>${defName}</strong> has Reaction(s) left but <strong>no eligible reaction powers</strong>.`
            : 'No one can react.'}</p>
      <p>Nearby allies within ${ALLY_REACTION_RANGE_M} m: none with an Ally Reaction ready.</p>`;
    }
    else {
        const blocks = actionable
            .map((e) => {
            const role = e.role === 'defender' ? 'target' : 'ally';
            const dist = e.role === 'ally' && e.distanceM != null ? ` · ${e.distanceM} m` : '';
            return `<div class="ms-reaction-window-actor" style="margin:0.45em 0;">
          <div><strong>${escHtml(e.name)}</strong> <span style="opacity:0.85">(${role}${dist}) — Reactions ${e.remaining}/${e.total}</span></div>
          <ol style="margin:0.2em 0 0 1.2em; padding:0;">${listReactionPowerNames(e.powers)}</ol>
        </div>`;
        })
            .join('');
        body = `<p>These characters can spend a <strong>Reaction</strong> now:</p>${blocks}
      <p style="opacity:0.9; font-size:0.92em;"><em>Target: pick in the Reaction dialog. Allies with Ally Reactions: call it now before damage finishes.</em></p>`;
    }
    await postReactionChat(`<div class="mastery-reaction-window">
      <strong>⚡ Reaction Window</strong>
      <p><strong>${atkName}</strong> → <strong>${defName}</strong> (raw ${Math.max(0, Math.floor(rawDamage))} after phasing).</p>
      ${body}
    </div>`, defender);
}
/** Duplicate Initiative Gain sources do not stack — keep only the highest version. */
function dedupeInitiativeGainReactions(powers) {
    const gainers = powers.filter((item) => {
        const mech = resolvePowerMechanics(item);
        const tid = String(item?.system?.templateId ?? '');
        return (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
    });
    if (gainers.length <= 1)
        return powers;
    let best = gainers[0];
    let bestVal = Math.max(0, Math.floor(Number(resolvePowerMechanics(best)?.initiativeGain) || 0));
    for (let i = 1; i < gainers.length; i++) {
        const val = Math.max(0, Math.floor(Number(resolvePowerMechanics(gainers[i])?.initiativeGain) || 0));
        if (val > bestVal) {
            best = gainers[i];
            bestVal = val;
        }
    }
    const bestId = best.id;
    return powers.filter((item) => {
        const mech = resolvePowerMechanics(item);
        const tid = String(item?.system?.templateId ?? '');
        const isGain = (mech?.initiativeGain ?? 0) > 0 || tid === INITIATIVE_GAIN_TEMPLATE;
        if (!isGain)
            return true;
        return item.id === bestId;
    });
}
/**
 * After phasing: announce the public Reaction Window in chat, then offer the
 * defender's spend dialog (owner/GM only).
 */
export async function promptDefenderReactionsBeforeMitigation(params) {
    const empty = { reactionArmorFlat: 0, reactionDrPct: 0 };
    const { defender, attacker, combat, rawDamage } = params;
    if (!defender || !combat)
        return empty;
    const economyDef = defenderActorForEconomy(defender);
    const defName = String(defender.name ?? 'Defender');
    const entries = collectReactionWindowEntries({ defender, attacker, combat });
    // Always post a table-visible list so every player sees who can react.
    try {
        await announceReactionWindow({ defender, attacker, rawDamage, entries });
    }
    catch (err) {
        console.warn('Mastery System | reaction window announce failed', err);
    }
    // Interactive spend dialog only for owner / GM on this client.
    if (!userMayPromptForActor(economyDef))
        return empty;
    const summary = getReactionActionsSummary(economyDef, combat);
    if (summary.remaining <= 0)
        return empty;
    const powers = dedupeInitiativeGainReactions(entries.find((e) => e.role === 'defender')?.powers ??
        getEligibleReactionPowers(economyDef, combat));
    if (!powers.length)
        return empty;
    const Dialog = globalThis.Dialog;
    if (!Dialog)
        return empty;
    const i18n = globalThis.game?.i18n;
    const loc = (k, fb) => {
        const s = i18n?.localize?.(k);
        return s && !String(s).startsWith('MASTERY.') ? String(s) : fb;
    };
    const evadeTnRaw = Math.floor(Number(params.evadeTn));
    const baseEvade = Number.isFinite(evadeTnRaw) && evadeTnRaw > 0 ? evadeTnRaw : defenderEvadeFromActor(defender);
    const attackTotalRaw = Math.floor(Number(params.attackTotal));
    const attackTotal = Number.isFinite(attackTotalRaw) && params.attackTotal != null ? attackTotalRaw : null;
    const previewList = `<ul style="margin:0.5em 0 0.25em; padding-left:1.2em; font-size:0.92em;">${powers
        .map((p) => formatPowerPreviewLine(p, baseEvade, attackTotal))
        .join('')}</ul>`;
    const attackLine = attackTotal != null
        ? `<p>Attack total: <strong>${attackTotal}</strong> · Evade TN: <strong>${baseEvade}</strong></p>`
        : `<p><em>Attack total unavailable — Evade reactions cannot auto-negate this hit.</em></p>`;
    const chosen = await new Promise((resolve) => {
        const attackerName = attacker?.name ?? 'Attacker';
        const titleRaw = loc('MASTERY.reactionDialogTitle', 'Reaction — {defender}');
        const dialogTitle = titleRaw.replace(/\{defender\}/g, defName);
        const bodyIntro = `<p><strong>${attackerName}</strong> deals <strong>${rawDamage}</strong> raw damage (after phasing checks).</p>
            ${attackLine}
            <p>Spend <strong>1 Reaction</strong> (${summary.remaining}/${summary.total} left) and pick a power, or decline.</p>
            <p style="margin-bottom:0"><strong>Preview</strong> (before you spend):</p>
            ${previewList}`;
        if (powers.length >= 2) {
            const optionsHtml = powers
                .map((item) => {
                const pnm = String(item.name ?? 'Reaction').trim();
                const label = pnm.length > 80 ? `${pnm.slice(0, 77)}…` : pnm;
                return `<option value="${item.id}">${label}</option>`;
            })
                .join('');
            try {
                new Dialog({
                    title: dialogTitle,
                    content: `${bodyIntro}
            <label for="ms-reaction-pick" style="display:block; margin-top:0.5em; font-size:0.9em; opacity:0.9">Reaction power</label>
            <select id="ms-reaction-pick" class="ms-reaction-pick" style="width:100%; margin-top:0.25em; margin-bottom:0.5em;">${optionsHtml}</select>`,
                    buttons: {
                        apply: {
                            label: loc('MASTERY.reactionUse', 'Use reaction'),
                            callback: (html) => {
                                const id = String(html.find('#ms-reaction-pick').val() || '');
                                const item = powers.find((p) => p.id === id) ?? null;
                                resolve({ item });
                            },
                        },
                        decline: {
                            label: loc('MASTERY.reactionDecline', 'Decline (no reaction)'),
                            callback: () => resolve({ item: null }),
                        },
                    },
                    default: 'apply',
                    close: () => resolve({ item: null }),
                }).render(true);
            }
            catch {
                resolve({ item: null });
            }
            return;
        }
        // 1 power: one named button + Decline
        const buttons = {};
        for (const item of powers) {
            const id = `react_${item.id}`;
            const pnm = String(item.name ?? 'Reaction').trim();
            const mech = mechanicsOf(item);
            const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
            let label = pnm.length > 40 ? `${pnm.slice(0, 37)}…` : pnm;
            if (ev > 0) {
                const evEval = evaluateReactionEvadeNegation(baseEvade, ev, attackTotal);
                if (!evEval.unknown) {
                    label = evEval.negates ? `${label} — NEGATES` : `${label} — still hits`;
                }
            }
            buttons[id] = {
                label: label.length > 56 ? `${label.slice(0, 53)}…` : label,
                callback: () => resolve({ item }),
            };
        }
        buttons.decline = {
            label: loc('MASTERY.reactionDecline', 'Decline (no reaction)'),
            callback: () => resolve({ item: null }),
        };
        try {
            new Dialog({
                title: dialogTitle,
                content: bodyIntro,
                buttons,
                default: powers.length ? `react_${powers[0].id}` : 'decline',
                close: () => resolve({ item: null }),
            }).render(true);
        }
        catch {
            resolve({ item: null });
        }
    });
    if (!chosen.item)
        return empty;
    const spent = await spendReactionAction(economyDef, combat);
    if (!spent)
        return empty;
    // Basic Reactions are not Powers — they are not marked spent (may reuse with more Reactions).
    if (!isBasicReactionItem(chosen.item)) {
        await markPowerUsedThisRound(economyDef, combat, chosen.item.id);
    }
    const mech = mechanicsOf(chosen.item);
    let mit = extractMitigationFromMechanics(mech);
    const ev = Math.max(0, Math.floor(Number(mech?.evade) || 0));
    const iniGain = mit.initiativeGain ?? 0;
    const evEval = evaluateReactionEvadeNegation(baseEvade, ev, attackTotal);
    const isCounterattack = chosen.item?.basicReaction === 'counterattack';
    // Reaction DR% only applies when this defender already has continuous DR% on
    // the sheet. Use the same actor document that receives damage (token / linked
    // actor), not only `economyDef`: for unlinked PCs `getActionEconomyActor`
    // points at the world actor while passives and `prepareDerivedData` live on
    // the token actor — gating on the prototype wrongly saw 0% and stripped reaction DR.
    let reactionDrBlocked = false;
    if (mit.reactionDrPct > 0 && !evEval.negates) {
        const drSubject = defender;
        if (typeof drSubject.prepareDerivedData === 'function') {
            try {
                drSubject.prepareDerivedData();
            }
            catch {
                /* ignore */
            }
        }
        const bd = buildActorMechanicsBreakdown(drSubject);
        const passiveBase = bd.damageReductionPct.passive.reduce((s, r) => s + (r.value || 0), 0);
        const sheetDr = Math.max(0, Math.floor(Number(drSubject.system?.combat?.damageReductionPct) || 0));
        const totalFromBreakdown = Math.max(0, Math.floor(Number(bd.totals?.damageReductionPct) || 0));
        if (passiveBase <= 0 && sheetDr <= 0 && totalFromBreakdown <= 0) {
            mit = { ...mit, reactionDrPct: 0 };
            reactionDrBlocked = true;
        }
    }
    let note = '';
    if (ev > 0) {
        if (evEval.unknown) {
            note += ` <em>(+${ev} Evade — attack total missing, could not auto-negate.)</em>`;
        }
        else if (evEval.negates) {
            note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — <strong>hit negated, no damage</strong>.`;
        }
        else {
            note += ` +${ev} Evade (${evEval.baseEvade}→${evEval.effectiveEvade} vs Attack ${evEval.attackTotal}) — still a hit.`;
        }
    }
    if (!evEval.negates) {
        if (mit.reactionArmorFlat > 0)
            note += ` +${mit.reactionArmorFlat} Armor (this hit)`;
        if (mit.reactionDrPct > 0)
            note += ` +${mit.reactionDrPct}% DR (this hit)`;
        if (reactionDrBlocked) {
            note +=
                ' <em>(Reaction DR% needs slotted <strong>Damage Reduction</strong> DR% and/or a sustained DR% on the character sheet.)</em>';
        }
        if (mech?.tempHP) {
            note += ` <em>(Temp HP from this reaction: apply manually or extend pipeline — declared: ${mech.tempHP})</em>`;
        }
    }
    if (iniGain > 0) {
        note += ` <em>(+${iniGain} Initiative applies after this attack fully resolves.)</em>`;
    }
    if (isCounterattack) {
        note += ` <em>(Basic Counterattack queued against ${String(attacker?.name ?? 'attacker')}.)</em>`;
    }
    await postReactionChat(`<strong>${defName}</strong> uses <strong>${chosen.item.name}</strong> (1 Reaction spent).${note || ' (No numeric mitigation on this power.)'}`, defender);
    if (isCounterattack) {
        try {
            await launchBasicCounterattack(defender, attacker);
        }
        catch (err) {
            console.warn('Mastery System | Counterattack launch failed', err);
            ui.notifications?.warn?.('Counterattack: could not open attack card — resolve manually.');
        }
    }
    if (evEval.negates) {
        return {
            reactionArmorFlat: 0,
            reactionDrPct: 0,
            initiativeGain: iniGain > 0 ? iniGain : undefined,
            powerName: chosen.item.name,
            negatedByEvade: true,
            reactionEvadeBonus: ev,
            effectiveEvade: evEval.effectiveEvade,
            counterattack: isCounterattack || undefined,
        };
    }
    return {
        reactionArmorFlat: mit.reactionArmorFlat,
        reactionDrPct: mit.reactionDrPct,
        initiativeGain: iniGain > 0 ? iniGain : undefined,
        powerName: chosen.item.name,
        reactionEvadeBonus: ev > 0 ? ev : undefined,
        effectiveEvade: ev > 0 ? evEval.effectiveEvade : undefined,
        counterattack: isCounterattack || undefined,
    };
}
async function launchBasicCounterattack(defender, attacker) {
    const defTok = getPrimaryTokenForActor(defender);
    const atkTok = getPrimaryTokenForActor(attacker);
    if (!defTok || !atkTok) {
        throw new Error('Missing tokens for Counterattack');
    }
    const { createMeleeAttackCard } = await import('./attack-executor.js');
    const option = {
        id: 'weapon-attack',
        name: 'Counterattack (Basic Attack)',
        description: 'Basic Attack — Weapon Damage + MR × 2d8. No Active Power effects.',
        slot: 'attack',
        source: 'maneuver',
        tags: ['attack', 'basic', 'counterattack'],
        selectedPowerId: null,
        // Reaction already spent the Reaction; Counterattack does not spend an Attack Action.
        costsAction: false,
    };
    await createMeleeAttackCard(defTok, atkTok, option);
}
//# sourceMappingURL=defender-reactions.js.map