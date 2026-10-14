/**
 * Combat Heal Actives — ally targeting, no attack roll, no Reactions.
 *
 * Always interactive in chat (never silent auto-roll):
 *   1) If the Power has an HLR pool and the target is Scarred: buttons 0…N
 *      (N > remaining are shown but disabled/gray until Safe Haven Rest)
 *   2) On click: recover Scarred (if chosen), then roll heal dice visibly,
 *      then apply HP into open (non-Scarred) Health Levels
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
import { escapeStoneChat } from '../stones/stone-resolution.js';
import { countScarredHealthBars, recoverScarredBars, } from '../stones/remove-scar.js';
import { isHealthBarScarred } from '../utils/calculations.js';
import { getActionEconomyActor } from './action-economy.js';
import { artifactLevelToTemplateRank } from '../utils/artifact-spell-pick.js';
import { getTemplate } from '../utils/powers/templates/index.js';
export const HEAL_CHAT_FLAG = 'healResolution';
/** Caster flag: `{ [powerKey]: spentLevels }` since last Safe Haven Rest. */
export const HLR_SPENT_FLAG = 'healthLevelRecoverySpent';
/** Catalog Health Level Recovery band (heal Actives; 0 below L4, max 4 at L15–16). */
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
/** Stable key for this Power's HLR pool on the caster. */
export function healPowerHlrKey(powerItem) {
    const id = String(powerItem?.id || '').trim();
    if (id)
        return id;
    const tid = String(powerItem?.system?.templateId || 'heal').trim() || 'heal';
    return `tpl:${tid}:r${powerItemRank(powerItem)}`;
}
export function getHlrSpentOnCaster(caster, powerKey) {
    const owner = getActionEconomyActor(caster) ?? caster;
    try {
        const map = owner?.getFlag?.('mastery-system', HLR_SPENT_FLAG);
        if (map && typeof map === 'object') {
            return Math.max(0, Math.floor(Number(map[powerKey]) || 0));
        }
    }
    catch {
        /* ignore */
    }
    return 0;
}
export function getHlrRemainingOnCaster(caster, powerItem) {
    const poolMax = healHealthLevelRecoveryForRank(powerItemRank(powerItem));
    if (poolMax <= 0)
        return 0;
    const spent = getHlrSpentOnCaster(caster, healPowerHlrKey(powerItem));
    return Math.max(0, poolMax - spent);
}
export async function spendHlrOnCaster(caster, powerKey, amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    const owner = getActionEconomyActor(caster) ?? caster;
    if (n <= 0 || !owner?.setFlag)
        return 0;
    const cur = getHlrSpentOnCaster(owner, powerKey);
    let map = {};
    try {
        const raw = owner.getFlag?.('mastery-system', HLR_SPENT_FLAG);
        if (raw && typeof raw === 'object') {
            for (const [k, v] of Object.entries(raw)) {
                map[k] = Math.max(0, Math.floor(Number(v) || 0));
            }
        }
    }
    catch {
        map = {};
    }
    map[powerKey] = cur + n;
    await owner.setFlag('mastery-system', HLR_SPENT_FLAG, map);
    return n;
}
export async function clearHlrSpentOnCaster(caster) {
    const owner = getActionEconomyActor(caster) ?? caster;
    if (!owner)
        return;
    try {
        if (owner.getFlag?.('mastery-system', HLR_SPENT_FLAG) == null)
            return;
        await owner.unsetFlag?.('mastery-system', HLR_SPENT_FLAG);
    }
    catch {
        /* ignore */
    }
}
/** Catalog / artifact template ids that deliver heal (incl. heal+cleanse mixed). */
export function isHealTemplateId(templateId) {
    const tid = String(templateId || '');
    if (!tid)
        return false;
    if (/health-level-heal/i.test(tid))
        return true;
    if (/heal-cleanse/i.test(tid))
        return true;
    if (/\bheal\b/i.test(tid) && !/cleanse|dispel/i.test(tid))
        return true;
    return false;
}
function artifactRowLooksLikeHeal(option) {
    const blob = `${option.name || ''} ${option.description || ''} ${option.artifactRowSpecial || ''}`;
    if (!/\bheal\b/i.test(blob))
        return false;
    // Offensive artifact actives that mention heal incidentally stay out.
    if (/\b(requiem|exorcism|damage|sundered|lacerate)\b/i.test(blob) && !/\bheal\b.*\bd\d+/i.test(blob)) {
        return false;
    }
    return true;
}
/** True for catalog heal Actives / Health Level Heal (not Cleanse/Dispel-only). */
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
    if (/heal-cleanse/i.test(tid))
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
/**
 * True for radial options that should use green ally heal targeting.
 * Covers real power items and artifact rows (Moonlight Mending, …) where
 * `option.item` is the artifact document, not a power.
 */
export function isHealRadialOption(option) {
    if (!option || option.source !== 'power')
        return false;
    if (option.aoePlacementProfile === 'heal')
        return true;
    if (isHealTemplateId(option.artifactPowerTemplateId))
        return true;
    if (option.item?.type === 'artifact' && artifactRowLooksLikeHeal(option))
        return true;
    if (option.item && isHealPowerItem(option.item))
        return true;
    return false;
}
/**
 * Resolve a power-shaped item for heal dice / HLR — real power, or a synthetic
 * catalog snapshot from an artifact progression row (templateId + stage rank).
 */
export function healPowerItemFromRadialOption(option) {
    if (!option)
        return null;
    if (option.item?.type === 'power' && isHealPowerItem(option.item))
        return option.item;
    const tid = String(option.artifactPowerTemplateId || '');
    if (tid && isHealTemplateId(tid)) {
        const tpl = getTemplate(tid);
        const rankKey = artifactLevelToTemplateRank(option.artifactRowLevel || 1);
        const rank = Math.max(1, Math.floor(Number(rankKey) || 1));
        return {
            type: 'power',
            id: option.id,
            name: option.name,
            system: {
                templateId: tid,
                category: 'active',
                subfamily: 'support-heal',
                rank,
                level: rank,
                levels: tpl?.levels ?? {},
            },
        };
    }
    // Legacy / test rows: "Heal 10d8" in the effect column, no templateId.
    if (option.item?.type === 'artifact' && artifactRowLooksLikeHeal(option)) {
        const blob = `${option.description || ''} ${option.artifactRowSpecial || ''}`;
        const m = /(\d+)\s*d\s*8/i.exec(blob);
        if (m) {
            const dice = `${m[1]}d8`;
            return {
                type: 'power',
                id: option.id,
                name: option.name,
                system: {
                    templateId: 'active-ranged-single-heal',
                    category: 'active',
                    subfamily: 'support-heal',
                    rank: 4,
                    level: 4,
                    levels: {
                        '4': { mechanics: { healing: { flat: dice, target: 'target' } } },
                    },
                },
            };
        }
    }
    return option.item?.type === 'power' ? option.item : null;
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
/** Roll heal dice; posts a Foundry roll message so the dice are visible. */
async function rollHealDiceVisible(formula, opts) {
    const g = globalThis;
    const RollCls = g.Roll;
    if (typeof RollCls === 'function') {
        const roll = await new RollCls(formula).evaluate({ async: true });
        try {
            await roll.toMessage?.({
                speaker: opts?.speaker ?? {},
                flavor: opts?.flavor || 'Heal',
            });
        }
        catch {
            /* chat optional */
        }
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
/**
 * Apply rolled HP across open Health Levels (current > 0), most severe first.
 * Scarred bars (0 HP) are never filled by heal dice — only by Health Level Recovery.
 */
export function applyHealHpAcrossOpenBars(health, rolled) {
    const bars = (Array.isArray(health?.bars) ? health.bars : []).map((b) => ({ ...b }));
    let remaining = Math.max(0, Math.floor(Number(rolled) || 0));
    let restored = 0;
    // Most severe open bar → healthier (matches damage overflow direction reversed).
    for (let i = bars.length - 1; i >= 0 && remaining > 0; i -= 1) {
        const cur = Math.max(0, Math.floor(Number(bars[i]?.current) || 0));
        const max = Math.max(0, Math.floor(Number(bars[i]?.max) || 0));
        if (max <= 0 || cur <= 0)
            continue; // skip empty/scarred & broken max
        const headroom = Math.max(0, max - cur);
        if (headroom <= 0)
            continue;
        const add = Math.min(headroom, remaining);
        bars[i] = { ...bars[i], current: cur + add };
        remaining -= add;
        restored += add;
    }
    let currentBar = Math.max(0, Math.min(bars.length - 1, Math.floor(Number(health?.currentBar) || 0)));
    for (let i = 0; i < bars.length; i += 1) {
        const cur = Math.max(0, Math.floor(Number(bars[i]?.current) || 0));
        const max = Math.max(0, Math.floor(Number(bars[i]?.max) || 0));
        if (max > 0 && cur < max) {
            currentBar = i;
            break;
        }
    }
    return { bars, currentBar, restored };
}
export function formatHealResultChat(args) {
    const source = escapeStoneChat(args.sourceName);
    const power = escapeStoneChat(args.powerName);
    const totalRestored = args.results.reduce((s, r) => s + r.restored, 0);
    const totalRolled = args.results.reduce((s, r) => s + r.rolled, 0);
    const headline = args.formula && totalRolled > 0
        ? `<p class="ms-heal-headline">Healed <strong class="ms-heal-amount">${totalRestored}</strong> HP <span class="ms-heal-roll">(rolled ${totalRolled} on ${escapeStoneChat(args.formula)})</span></p>`
        : args.formula
            ? `<p class="ms-heal-headline">Heal roll on <strong>${escapeStoneChat(args.formula)}</strong> — no HP restored (bar full or no valid bar).</p>`
            : `<p class="ms-heal-headline">No HP heal from this Power (Health Level Recovery only).</p>`;
    const scarredLine = (args.scarredRecovered ?? 0) > 0
        ? `<p class="ms-heal-scarred-line">Scarred Health Bars restored: <strong>${args.scarredRecovered}</strong></p>`
        : '';
    const rows = args.results
        .map((r) => {
        const name = escapeStoneChat(r.name);
        if (!args.formula) {
            return `<li><strong>${name}</strong> — no HP heal. Scarred bars left: ${r.scarredBefore}.</li>`;
        }
        const blight = r.blight > 0
            ? ` (Blight −${r.blight}: ${r.rolled} → ${r.afterBlight})`
            : '';
        const cap = r.restored <= 0
            ? ` Rolled <strong>${r.rolled}</strong>${blight} — <strong>0 HP</strong> applied (no open Health Level with room; recover Scarred first if needed).`
            : r.restored < r.afterBlight
                ? ` Restored <strong>${r.restored}</strong> / ${r.afterBlight} HP${blight} (open Health Level headroom).`
                : ` Restored <strong>${r.restored}</strong> HP${blight}.`;
        return `<li><strong>${name}</strong> —${cap}</li>`;
    })
        .join('');
    return `<div class="mastery-heal-resolution"><p><strong>${source}</strong> — ${power}</p>${scarredLine}${headline}<ul>${rows}</ul></div>`;
}
export function formatScarredPromptChat(args) {
    const healer = escapeStoneChat(args.healerName);
    const target = escapeStoneChat(args.targetName);
    const power = escapeStoneChat(args.powerName || 'Heal');
    const formula = args.formula ? escapeStoneChat(args.formula) : '';
    // Show full band 0…min(scarred, poolMax); gray out spends above remaining.
    const maxShown = Math.max(0, Math.min(args.maxBars, args.scarred, args.poolMax));
    const remaining = Math.max(0, Math.floor(Number(args.poolRemaining) || 0));
    const healHint = formula ? ` → then roll ${formula}` : '';
    const buttons = [];
    for (let n = 0; n <= maxShown; n += 1) {
        const disabled = n > remaining;
        const label = n === 0
            ? formula
                ? `0 Scarred — roll ${formula}`
                : '0 — skip Scarred'
            : `${n} Scarred${healHint}${disabled ? ' (used up)' : ''}`;
        buttons.push(`<button type="button" class="mastery-heal-scarred-pick${disabled ? ' ms-heal-btn-disabled' : ''}" data-bars="${n}"${disabled ? ' disabled title="Health Level Recovery already spent this Safe Haven Rest"' : ''}>${label}</button>`);
    }
    if (formula && maxShown <= 0) {
        buttons.push(`<button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only" data-bars="0">Roll heal ${formula}</button>`);
    }
    const healPreview = formula
        ? `<p class="ms-heal-preview"><strong>Click a button</strong> to recover Scarred (optional), then <strong>roll ${formula}</strong> in chat and apply the HP.</p>`
        : `<p class="ms-heal-preview"><strong>Click a button</strong> to apply Scarred recovery (this Power has no HP dice).</p>`;
    return `<div class="mastery-heal-scarred-prompt" data-target-actor-id="${escapeStoneChat(args.targetActorId)}" data-max-bars="${maxShown}">
  <p><strong>${healer}</strong> — <em>${power}</em>: Scarred zuerst, dann Heal würfeln</p>
  <p><strong>${target}</strong> has <strong>${args.scarred}</strong> Scarred Health Bar(s).</p>
  <p>This Power's pool: <strong>${remaining}</strong> / ${args.poolMax} Health Level(s) left this Safe Haven Rest.</p>
  ${healPreview}
  <div class="mastery-heal-scarred-actions">${buttons.join('')}</div>
</div>`;
}
/** No Scarred / no HLR — still require a click so dice are visible. */
export function formatHealRollPromptChat(args) {
    const healer = escapeStoneChat(args.healerName);
    const target = escapeStoneChat(args.targetName);
    const power = escapeStoneChat(args.powerName || 'Heal');
    const formula = escapeStoneChat(args.formula);
    return `<div class="mastery-heal-scarred-prompt mastery-heal-roll-prompt">
  <p><strong>${healer}</strong> — <em>${power}</em> on <strong>${target}</strong></p>
  <p class="ms-heal-preview">Click to roll <strong>${formula}</strong> in chat and apply the healed HP.</p>
  <div class="mastery-heal-scarred-actions">
    <button type="button" class="mastery-heal-scarred-pick mastery-heal-roll-only" data-bars="0">Roll heal ${formula}</button>
  </div>
</div>`;
}
/**
 * Health / Scarred live on the token's battle actor. Do NOT redirect through
 * getActionEconomyActor here — that often returns the world prototype, which
 * can have full bars while the placed (unlinked) token still shows Scarred.
 */
function healTargetActor(actor) {
    return actor ?? null;
}
async function applyHpHealToActor(actor, rolled) {
    const owner = healTargetActor(actor);
    const blight = blightHealReduction(owner);
    const afterBlight = Math.max(0, rolled - blight);
    const health = owner?.system?.health;
    if (!health || !Array.isArray(health.bars)) {
        return { restored: 0, afterBlight, blight };
    }
    const applied = applyHealHpAcrossOpenBars({ bars: health.bars, currentBar: health.currentBar }, afterBlight);
    const scarredCount = applied.bars.filter((b) => isHealthBarScarred(b)).length;
    const patch = {
        'system.health.bars': applied.bars,
        'system.health.currentBar': applied.currentBar,
    };
    if (Object.prototype.hasOwnProperty.call(health, 'scarred')) {
        patch['system.health.scarred'] = scarredCount;
    }
    await owner.update?.(patch);
    return { restored: applied.restored, afterBlight, blight };
}
function snapshotHealPowerItem(powerItem) {
    return {
        id: powerItem?.id,
        type: powerItem?.type || 'power',
        name: powerItem?.name,
        system: {
            templateId: powerItem?.system?.templateId,
            category: powerItem?.system?.category,
            subfamily: powerItem?.system?.subfamily,
            rank: powerItemRank(powerItem),
            level: powerItemRank(powerItem),
            levels: powerItem?.system?.levels ?? {},
            mechanics: powerItem?.system?.mechanics,
        },
    };
}
function resolveTokenById(tokenId) {
    const g = globalThis;
    try {
        const direct = g.canvas?.tokens?.get?.(tokenId);
        if (direct)
            return direct;
        const placeables = g.canvas?.tokens?.placeables ?? [];
        return (placeables.find((t) => String(t.id) === tokenId || String(t.document?.id) === tokenId) ?? null);
    }
    catch {
        return null;
    }
}
async function applyHpHealPass(args) {
    const g = globalThis;
    const caster = args.casterToken?.actor;
    const speaker = g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document });
    const results = [];
    for (const tok of args.targetTokens) {
        const actor = tok?.actor;
        if (!actor)
            continue;
        let rolled = 0;
        let afterBlight = 0;
        let restored = 0;
        let blight = 0;
        if (args.formula) {
            const roll = await rollHealDiceVisible(args.formula, {
                flavor: `${args.powerName} — Heal (${actor.name || tok.name || 'Target'})`,
                speaker,
            });
            rolled = roll.total;
            const applied = await applyHpHealToActor(actor, rolled);
            afterBlight = applied.afterBlight;
            restored = applied.restored;
            blight = applied.blight;
        }
        const scarredBefore = countScarredHealthBars(healTargetActor(actor));
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
    const content = formatHealResultChat({
        sourceName: String(caster?.name || args.casterToken?.name || 'Healer'),
        powerName: args.powerName,
        results,
        formula: args.formula,
        scarredRecovered: args.scarredRecovered ?? 0,
    });
    const totalRestored = results.reduce((s, r) => s + r.restored, 0);
    const totalRolled = results.reduce((s, r) => s + r.rolled, 0);
    if (args.formula && totalRolled > 0) {
        g.ui?.notifications?.info?.(`${args.powerName}: rolled ${totalRolled} → restored ${totalRestored} HP` +
            ((args.scarredRecovered ?? 0) > 0 ? ` (+${args.scarredRecovered} Scarred)` : ''));
    }
    else if ((args.scarredRecovered ?? 0) > 0) {
        g.ui?.notifications?.info?.(`${args.powerName}: restored ${args.scarredRecovered} Scarred Health Bar(s).`);
    }
    try {
        if (args.appendToMessage?.update) {
            const prev = String(args.appendToMessage.content || '');
            await args.appendToMessage.update({
                content: `${prev}<div class="mastery-heal-scarred-resolved">${content}</div>`,
            });
        }
        else {
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
    }
    catch (err) {
        console.warn('Mastery System | heal chat failed', err);
    }
    // Heal + Cleanse mixed: interactive Cleanse distribution after HP heal.
    try {
        const { getCleanseRankFromPower, postCleansePromptForTarget } = await import('./cleanse-resolution.js');
        if (getCleanseRankFromPower(args.powerItem) > 0) {
            for (const tok of args.targetTokens) {
                await postCleansePromptForTarget({
                    casterToken: args.casterToken,
                    powerItem: args.powerItem,
                    powerName: args.powerName,
                    targetToken: tok,
                });
            }
        }
    }
    catch (err) {
        console.warn('Mastery System | mixed heal+cleanse prompt failed', err);
    }
    return results;
}
/**
 * Resolve heal on one or more token targets (already chosen). No attack roll.
 * Always posts a chat card — Scarred picks and/or a Roll button; never auto-rolls.
 */
export async function resolveHealOnTokens(args) {
    const caster = args.casterToken?.actor;
    const formula = getHealDiceFormula(args.powerItem);
    const poolMax = healHealthLevelRecoveryForRank(powerItemRank(args.powerItem));
    const poolRemaining = getHlrRemainingOnCaster(caster, args.powerItem);
    const powerKey = healPowerHlrKey(args.powerItem);
    const g = globalThis;
    // One Scarred recipient per use (AoE rule).
    // Read Scarred from the targeted token actor (same source as carousel/sheet),
    // not getActionEconomyActor — world prototype can disagree on unlinked tokens.
    let scarredTok = null;
    let scarredCount = 0;
    for (const tok of args.targetTokens) {
        const actor = healTargetActor(tok?.actor);
        if (!actor)
            continue;
        const n = countScarredHealthBars(actor);
        if (n > 0) {
            scarredTok = tok;
            scarredCount = n;
            break;
        }
    }
    const primaryTok = scarredTok || args.targetTokens[0];
    const pending = {
        casterTokenId: String(args.casterToken?.id || args.casterToken?.document?.id || ''),
        powerName: args.powerName,
        powerKey,
        formula,
        cleanseRank: 0,
        powerItemSnapshot: snapshotHealPowerItem(args.powerItem),
        targetTokenIds: args.targetTokens.map((t) => String(t.id || '')).filter(Boolean),
        scarredTargetActorId: String(primaryTok?.actor?.id || ''),
        scarredTargetTokenId: String(primaryTok?.id || ''),
    };
    try {
        const { getCleanseRankFromPower } = await import('./cleanse-resolution.js');
        pending.cleanseRank = getCleanseRankFromPower(args.powerItem);
    }
    catch {
        pending.cleanseRank = 0;
    }
    // Show Scarred UI whenever the Power has an HLR band and the target is Scarred
    // (even if remaining is 0 — buttons above remaining stay visible but grayed).
    const offerScarredUi = poolMax > 0 && scarredTok && scarredCount > 0;
    const content = offerScarredUi
        ? formatScarredPromptChat({
            healerName: String(caster?.name || 'Healer'),
            targetName: String(scarredTok.actor?.name || scarredTok.name || 'Target'),
            targetActorId: pending.scarredTargetActorId,
            maxBars: Math.min(scarredCount, poolMax),
            scarred: scarredCount,
            poolRemaining,
            poolMax,
            powerName: args.powerName,
            formula,
        })
        : formula
            ? formatHealRollPromptChat({
                healerName: String(caster?.name || 'Healer'),
                targetName: String(primaryTok?.actor?.name || primaryTok?.name || 'Target'),
                powerName: args.powerName,
                formula,
            })
            : null;
    if (!content) {
        // Health-Level-only with no Scarred target: nothing to do.
        g.ui?.notifications?.info?.(`${args.powerName}: kein Scarred-Ziel und keine Heal-Würfel.`);
        return [];
    }
    try {
        await g.ChatMessage?.create?.({
            speaker: g.ChatMessage?.getSpeaker?.({ actor: caster, token: args.casterToken?.document }),
            content,
            flags: {
                'mastery-system': {
                    [HEAL_CHAT_FLAG]: {
                        kind: 'scarred-prompt',
                        targetActorId: pending.scarredTargetActorId,
                        casterActorId: String(caster?.id || ''),
                        maxBars: offerScarredUi ? Math.min(scarredCount, poolMax) : 0,
                        poolRemaining,
                        poolMax,
                        powerKey,
                        pendingHeal: pending,
                        resolved: false,
                    },
                },
            },
        });
        g.ui?.notifications?.info?.(offerScarredUi
            ? formula
                ? `Scarred wählen oder überspringen — Klick würfelt ${formula} sichtbar.`
                : 'Scarred wählen — Klick wendet die Recovery an.'
            : `Klick: ${formula} würfeln und Heal anwenden.`);
    }
    catch (err) {
        console.warn('Mastery System | heal prompt failed', err);
        return applyHpHealPass({ ...args, formula });
    }
    return [];
}
async function resolveScarredChoice(message, bars) {
    const flags = message?.getFlag?.('mastery-system', HEAL_CHAT_FLAG) ??
        message?.flags?.['mastery-system']?.[HEAL_CHAT_FLAG];
    if (!flags || flags.kind !== 'scarred-prompt')
        return;
    if (flags.resolved)
        return;
    const pending = flags.pendingHeal;
    const actorId = String(flags.targetActorId || pending?.scarredTargetActorId || '');
    const maxBars = Math.max(0, Math.floor(Number(flags.maxBars) || 0));
    const want = Math.max(0, Math.min(maxBars, Math.floor(Number(bars) || 0)));
    const g = globalThis;
    let target = (pending?.scarredTargetTokenId && resolveTokenById(pending.scarredTargetTokenId)?.actor) ||
        g.game?.actors?.get?.(actorId) ||
        null;
    if (!target) {
        try {
            const tokens = g.canvas?.tokens?.placeables ?? [];
            const tok = tokens.find((t) => String(t.actor?.id) === actorId || String(t.document?.actorId) === actorId);
            if (tok?.actor)
                target = tok.actor;
        }
        catch {
            /* ignore */
        }
    }
    if (!target) {
        g.ui?.notifications?.warn?.('Heal target not found.');
        return;
    }
    // Recover on the same actor the player sees (token battle actor), not world prototype.
    const owner = healTargetActor(target);
    const poolRem = Math.max(0, Math.floor(Number(flags.poolRemaining) || 0));
    // Never spend more than the remaining Safe Haven pool (disabled buttons are a UI guard).
    const spend = Math.max(0, Math.min(want, poolRem));
    let restored = 0;
    if (spend > 0) {
        restored = await recoverScarredBars(owner, spend);
        const casterTok = pending?.casterTokenId ? resolveTokenById(pending.casterTokenId) : null;
        const caster = casterTok?.actor ?? g.game?.actors?.get?.(String(flags.casterActorId || '')) ?? null;
        const powerKey = String(flags.powerKey || pending?.powerKey || '');
        if (caster && powerKey && restored > 0) {
            await spendHlrOnCaster(caster, powerKey, restored);
        }
    }
    try {
        await message.setFlag?.('mastery-system', HEAL_CHAT_FLAG, {
            ...flags,
            resolved: true,
            restored,
        });
    }
    catch {
        /* ignore */
    }
    const poolLeft = Math.max(0, poolRem - restored);
    const note = spend <= 0
        ? `<p><em>No Scarred Health Bar recovered — rolling HP heal now…</em></p>`
        : `<p><strong>${escapeStoneChat(owner.name)}</strong> — recovered <strong>${restored}</strong> Scarred Health Bar(s). Pool left: <strong>${poolLeft}</strong>. Rolling HP heal…</p>`;
    try {
        await message.update?.({
            content: `${message.content}<div class="mastery-heal-scarred-resolved">${note}</div>`,
        });
    }
    catch {
        /* ignore */
    }
    // Continue with the deferred HP heal on the same card (and optional Cleanse).
    if (pending) {
        const casterToken = resolveTokenById(pending.casterTokenId) ||
            g.canvas?.tokens?.controlled?.[0] ||
            null;
        const targetTokens = (pending.targetTokenIds || [])
            .map((id) => resolveTokenById(id))
            .filter(Boolean);
        if (!targetTokens.length && pending.scarredTargetTokenId) {
            const t = resolveTokenById(pending.scarredTargetTokenId);
            if (t)
                targetTokens.push(t);
        }
        // Prefer actor lookup if tokens vanished from canvas.
        if (!targetTokens.length) {
            const fallbackActor = g.game?.actors?.get?.(pending.scarredTargetActorId) || owner;
            if (fallbackActor) {
                targetTokens.push({
                    id: pending.scarredTargetTokenId,
                    actor: fallbackActor,
                    name: fallbackActor.name,
                });
            }
        }
        await applyHpHealPass({
            casterToken,
            powerItem: pending.powerItemSnapshot,
            powerName: pending.powerName,
            targetTokens,
            formula: pending.formula,
            scarredRecovered: restored,
            appendToMessage: message,
        });
    }
}
function bindScarredPromptHtml(message, root) {
    const wrap = root.querySelector?.('.mastery-heal-scarred-prompt');
    if (!wrap || wrap.dataset.msBound === '1')
        return;
    wrap.dataset.msBound = '1';
    const picks = Array.from(wrap.querySelectorAll('.mastery-heal-scarred-pick'));
    // Legacy yes/no cards from older messages
    const yes = wrap.querySelector('.mastery-heal-scarred-yes');
    const no = wrap.querySelector('.mastery-heal-scarred-no');
    const disable = () => {
        picks.forEach((b) => {
            b.disabled = true;
        });
        if (yes)
            yes.disabled = true;
        if (no)
            no.disabled = true;
    };
    picks.forEach((btn) => {
        btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            disable();
            await resolveScarredChoice(message, Number(btn.dataset.bars || '0'));
        });
    });
    yes?.addEventListener('click', async (ev) => {
        ev.preventDefault();
        disable();
        await resolveScarredChoice(message, Number(yes.dataset.bars || '1'));
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