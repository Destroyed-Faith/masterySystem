/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 * Rolls `mechanics.healing.flat`, applies to the current Health Bar, then
 * optionally offers Scarred / Health Level Recovery in chat.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
import { applyHealingToCurrentBar, escapeStoneChat, } from '../stones/stone-resolution.js';
import { countScarredHealthBars, recoverScarredBars, } from '../stones/remove-scar.js';
import { getActionEconomyActor } from './action-economy.js';
export const HEAL_CHAT_FLAG = 'healResolution';
/** Catalog Health Level Recovery band (heal Actives; 0 below L4). */
export function healHealthLevelRecoveryForRank(rank) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(rank) || 1)));
    if (lvl >= 15)
        return 4;
    if (lvl >= 12)
        return 3;
    if (lvl >= 8)
        return 2;
    if (lvl >= 4)
        return 1;
    return 0;
}
export function powerItemRank(item) {
    const sys = item?.system ?? {};
    const raw = Number(sys.rank ?? sys.level ?? 1);
    return Math.max(1, Math.min(16, Number.isFinite(raw) ? Math.floor(raw) : 1));
}
/** True for catalog heal Actives / Health Level Heal (not Cleanse/Dispel). */
export function isHealPowerItem(item) {
    if (!item || item.type !== 'power')
        return false;
    const sys = item.system ?? {};
    const tid = String(sys.templateId || '');
    const sub = String(sys.subfamily || '');
    if (/health-level-heal/i.test(tid))
        return true;
    if (/support-heal/i.test(sub))
        return true;
    if (/\bheal\b/i.test(tid) && !/cleanse|dispel/i.test(tid))
        return true;
    try {
        const mech = resolvePowerMechanics(item);
        if (mech?.healing?.flat)
            return true;
    }
    catch {
        /* ignore */
    }
    return false;
}
export function isHealRadialOption(option) {
    if (!option || option.source !== 'power' || !option.item)
        return false;
    return isHealPowerItem(option.item);
}
/** Dice formula from mechanics, e.g. "4d8", or null for Health-Level-only heals. */
export function getHealDiceFormula(item) {
    try {
        const flat = resolvePowerMechanics(item)?.healing?.flat;
        if (!flat)
            return null;
        const dice = String(flat).trim().replace(/^\+\s*/, '');
        if (!/^\d*d\d+/i.test(dice))
            return null;
        return dice.replace(/^d/i, '1d');
    }
    catch {
        return null;
    }
}
export function getHealAoETargetMode(item) {
    try {
        const t = String(resolvePowerMechanics(item)?.healing?.target || 'target').toLowerCase();
        if (t === 'aoe' || t === 'alliesinarearea' || t === 'allies')
            return 'aoe';
        if (t === 'self')
            return 'self';
    }
    catch {
        /* ignore */
    }
    return 'target';
}
function blightHealReduction(actor) {
    try {
        return Math.max(0, Math.floor(Number(getActiveSpecialValue(actor, 'blight')) || 0));
    }
    catch {
        return 0;
    }
}
async function rollFormula(formula) {
    const g = globalThis;
    const RollCls = g.Roll;
    if (typeof RollCls === 'function') {
        const roll = await new RollCls(formula).evaluate({ async: true });
        return { total: Math.max(0, Math.floor(Number(roll.total) || 0)), formula };
    }
    // Test / offline fallback: average-ish
    const m = /^(\d+)d(\d+)/i.exec(formula);
    if (m) {
        const n = parseInt(m[1], 10);
        const sides = parseInt(m[2], 10);
        return { total: Math.max(0, n * Math.ceil(sides / 2)), formula };
    }
    return { total: 0, formula };
}
export function formatHealResultChat(args) {
    const source = escapeStoneChat(args.sourceName);
    const power = escapeStoneChat(args.powerName);
    const rows = args.results
        .map((r) => {
        const name = escapeStoneChat(r.name);
        if (!args.formula) {
            return `<li><strong>${name}</strong> — no HP heal (Health Level Recovery only). Scarred bars: ${r.scarredBefore}.</li>`;
        }
        const blight = r.blight > 0
            ? ` (Blight −${r.blight}: ${r.rolled} → ${r.afterBlight})`
            : '';
        const cap = r.restored < r.afterBlight
            ? ` Restored <strong>${r.restored}</strong> HP${blight} — current bar was only ${r.restored} short of max.`
            : ` Restored <strong>${r.restored}</strong> HP${blight}.`;
        return `<li><strong>${name}</strong> — rolled ${r.rolled}.${cap}</li>`;
    })
        .join('');
    const formulaLine = args.formula
        ? `<p>Heal pool: <strong>${escapeStoneChat(args.formula)}</strong></p>`
        : `<p>This power restores no HP by itself.</p>`;
    return `<div class="mastery-heal-resolution"><p><strong>${source}</strong> — ${power}</p>${formulaLine}<ul>${rows}</ul></div>`;
}
export function formatScarredPromptChat(args) {
    const healer = escapeStoneChat(args.healerName);
    const target = escapeStoneChat(args.targetName);
    const max = Math.max(1, Math.min(args.maxBars, args.scarred));
    return `<div class="mastery-heal-scarred-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-max-bars="${max}">
  <p><strong>${healer}</strong> — Health Level / Scarred Recovery for <strong>${target}</strong></p>
  <p>${target} has <strong>${args.scarred}</strong> Scarred Health Bar(s). Recover up to <strong>${max}</strong>?</p>
  <div class="mastery-heal-scarred-actions">
    <button type="button" class="mastery-heal-scarred-yes" data-bars="${max}">Yes — recover ${max}</button>
    <button type="button" class="mastery-heal-scarred-no">No</button>
  </div>
</div>`;
}
async function applyHpHealToActor(actor, rolled) {
    const owner = getActionEconomyActor(actor) ?? actor;
    const blight = blightHealReduction(owner);
    const afterBlight = Math.max(0, rolled - blight);
    const health = owner?.system?.health;
    if (!health || !Array.isArray(health.bars)) {
        return { restored: 0, afterBlight, blight };
    }
    const applied = applyHealingToCurrentBar({ bars: health.bars, currentBar: health.currentBar }, afterBlight);
    await owner.update?.({
        'system.health.bars': applied.bars,
        'system.health.currentBar': applied.currentBar,
    });
    return { restored: applied.restored, afterBlight, blight };
}
/**
 * Resolve heal on one or more token targets (already chosen). No attack roll.
 */
export async function resolveHealOnTokens(args) {
    const caster = args.casterToken?.actor;
    const formula = getHealDiceFormula(args.powerItem);
    const results = [];
    const hlr = healHealthLevelRecoveryForRank(powerItemRank(args.powerItem));
    let scarredPromptPosted = false;
    for (const tok of args.targetTokens) {
        const actor = tok?.actor;
        if (!actor)
            continue;
        let rolled = 0;
        let afterBlight = 0;
        let restored = 0;
        let blight = 0;
        if (formula) {
            const roll = await rollFormula(formula);
            rolled = roll.total;
            const applied = await applyHpHealToActor(actor, rolled);
            afterBlight = applied.afterBlight;
            restored = applied.restored;
            blight = applied.blight;
        }
        const scarredBefore = countScarredHealthBars(getActionEconomyActor(actor) ?? actor);
        results.push({
            tokenId: String(tok.id || ''),
            actorId: String(actor.id || ''),
            name: String(actor.name || tok.name || 'Target'),
            rolled,
            afterBlight,
            restored,
            blight,
            scarredBefore,
        });
    }
    const g = globalThis;
    const content = formatHealResultChat({
        sourceName: String(caster?.name || args.casterToken?.name || 'Healer'),
        powerName: args.powerName,
        results,
        formula,
    });
    try {
        await g.ChatMessage?.create?.({
            speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
            content,
            flags: {
                'mastery-system': {
                    [HEAL_CHAT_FLAG]: {
                        kind: 'heal-result',
                        powerId: String(args.powerItem?.id || ''),
                    },
                },
            },
        });
    }
    catch (err) {
        console.warn('Mastery System | heal chat failed', err);
    }
    // Scarred / Health Level Recovery — one creature per use (AoE rule).
    if (hlr > 0) {
        const candidate = results.find((r) => r.scarredBefore > 0);
        if (candidate && !scarredPromptPosted) {
            scarredPromptPosted = true;
            const maxBars = Math.min(hlr, candidate.scarredBefore);
            try {
                await g.ChatMessage?.create?.({
                    speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
                    content: formatScarredPromptChat({
                        healerName: String(caster?.name || 'Healer'),
                        targetName: candidate.name,
                        targetActorId: candidate.actorId,
                        maxBars,
                        scarred: candidate.scarredBefore,
                    }),
                    flags: {
                        'mastery-system': {
                            [HEAL_CHAT_FLAG]: {
                                kind: 'scarred-prompt',
                                targetActorId: candidate.actorId,
                                maxBars,
                            },
                        },
                    },
                });
            }
            catch (err) {
                console.warn('Mastery System | scarred heal prompt failed', err);
            }
        }
    }
    return results;
}
async function resolveScarredChoice(message, bars) {
    const flags = message?.getFlag?.('mastery-system', HEAL_CHAT_FLAG) ?? message?.flags?.['mastery-system']?.[HEAL_CHAT_FLAG];
    if (!flags || flags.kind !== 'scarred-prompt')
        return;
    if (flags.resolved)
        return;
    const actorId = String(flags.targetActorId || '');
    const maxBars = Math.max(0, Math.floor(Number(flags.maxBars) || 0));
    const want = Math.max(0, Math.min(maxBars, Math.floor(Number(bars) || 0)));
    const g = globalThis;
    const actor = g.game?.actors?.get?.(actorId);
    // Prefer canvas token actor for unlinked
    let target = actor;
    try {
        const tokens = canvas?.tokens?.placeables ?? [];
        const tok = tokens.find((t) => String(t.actor?.id) === actorId || String(t.document?.actorId) === actorId);
        if (tok?.actor)
            target = tok.actor;
    }
    catch {
        /* ignore */
    }
    if (!target) {
        g.ui?.notifications?.warn?.('Heal target not found.');
        return;
    }
    const owner = getActionEconomyActor(target) ?? target;
    let restored = 0;
    if (want > 0) {
        restored = await recoverScarredBars(owner, want);
    }
    try {
        await message.setFlag?.('mastery-system', HEAL_CHAT_FLAG, { ...flags, resolved: true, restored });
    }
    catch {
        /* ignore */
    }
    const note = want <= 0
        ? `<p><em>No Scarred Health Bar recovered.</em></p>`
        : `<p><strong>${escapeStoneChat(owner.name)}</strong> — recovered <strong>${restored}</strong> Scarred Health Bar(s).</p>`;
    try {
        await message.update?.({
            content: `${message.content}<div class="mastery-heal-scarred-resolved">${note}</div>`,
        });
    }
    catch {
        /* ignore */
    }
}
function bindScarredPromptHtml(message, root) {
    const wrap = root.querySelector?.('.mastery-heal-scarred-prompt');
    if (!wrap || wrap.dataset.msBound === '1')
        return;
    wrap.dataset.msBound = '1';
    const yes = wrap.querySelector('.mastery-heal-scarred-yes');
    const no = wrap.querySelector('.mastery-heal-scarred-no');
    const disable = () => {
        if (yes)
            yes.disabled = true;
        if (no)
            no.disabled = true;
    };
    yes?.addEventListener('click', async (ev) => {
        ev.preventDefault();
        disable();
        const bars = Number(yes.dataset.bars || '1');
        await resolveScarredChoice(message, bars);
    });
    no?.addEventListener('click', async (ev) => {
        ev.preventDefault();
        disable();
        await resolveScarredChoice(message, 0);
    });
}
/** Register chat button handlers for Scarred recovery prompts. */
export function registerHealChatHandlers() {
    const g = globalThis;
    const Hooks = g.Hooks;
    if (!Hooks?.on)
        return;
    Hooks.on('renderChatMessageHTML', (message, htmlRaw) => {
        try {
            const root = htmlRaw?.jquery || htmlRaw?.[0]
                ? htmlRaw[0]
                : htmlRaw;
            if (!root?.querySelector)
                return;
            bindScarredPromptHtml(message, root);
        }
        catch (err) {
            console.warn('Mastery System | heal scarred chat bind failed', err);
        }
    });
}
//# sourceMappingURL=heal-resolution.js.map