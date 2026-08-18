/**
 * Passive Parry — enter a pool stance, strip Attack Dice 1:1 before the roll.
 * 0 remaining dice = Fully Parried → Riposte / Reflection may fire.
 */
import { getActionEconomyActor, getRoundState, setRoundState, } from './action-economy.js';
function actorItems(actor) {
    const items = actor?.items;
    if (!items)
        return [];
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
/** Find the Passive Parry power item on an actor (templateId preferred). */
export function findPassiveParryItem(actor) {
    if (!actor)
        return null;
    for (const item of actorItems(actor)) {
        if (item?.type !== 'power')
            continue;
        const sys = item.system;
        const tid = String(sys?.templateId ?? '').toLowerCase();
        if (tid === 'passive-parry')
            return item;
    }
    for (const item of actorItems(actor)) {
        if (item?.type !== 'power')
            continue;
        const sys = item.system;
        if (String(sys?.powerType ?? '').toLowerCase() !== 'passive')
            continue;
        const name = String(item.name ?? '').toLowerCase();
        if (name.includes('reinforced'))
            continue;
        if (name === 'parry' || name.endsWith(': parry') || name.includes('passive: parry')) {
            return item;
        }
    }
    return null;
}
export function actorHasPassiveParry(actor) {
    return !!findPassiveParryItem(actor);
}
/** Max pool from Passive Parry level (= 5 × Level). */
export function parryPoolCapForLevel(level) {
    const lvl = Math.max(1, Math.min(16, Math.floor(Number(level) || 1)));
    return 5 * lvl;
}
export function resolveParryAttribute(actor) {
    const attrs = actor?.system?.attributes ?? {};
    const might = Math.max(0, Math.floor(Number(attrs?.might?.value) || 0));
    const agility = Math.max(0, Math.floor(Number(attrs?.agility?.value) || 0));
    if (agility > might)
        return { attribute: 'agility', value: agility };
    return { attribute: 'might', value: might };
}
export function computeParryPoolMax(actor) {
    const item = findPassiveParryItem(actor);
    if (!item)
        return null;
    const level = Math.max(1, Math.min(16, Math.floor(Number(item.system?.level) || 1)));
    const { attribute, value } = resolveParryAttribute(actor);
    const cap = parryPoolCapForLevel(level);
    return { max: Math.min(value, cap), attribute, level, attrValue: value };
}
export function getParryState(actor, combat) {
    const rs = getRoundState(actor, combat);
    const p = rs.parry;
    const stone = Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempParryPool ?? 0) || 0));
    if (!p?.entered && stone <= 0)
        return null;
    return {
        entered: true,
        pool: Math.max(0, Math.floor(Number(p?.pool) || 0)) + stone,
        max: Math.max(0, Math.floor(Number(p?.max) || 0)) + stone,
        attribute: p?.attribute === 'agility' ? 'agility' : 'might',
    };
}
export function isInParry(actor, combat) {
    return !!getParryState(actor, combat)?.entered;
}
/** Pure: spend min(pool, attackDice) → remaining dice / Fully Parried. */
export function computeParryStrip(attackDice, pool) {
    const dice = Math.max(0, Math.floor(Number(attackDice) || 0));
    const p = Math.max(0, Math.floor(Number(pool) || 0));
    const spent = Math.min(p, dice);
    const remainingDice = dice - spent;
    return {
        spent,
        remainingDice,
        remainingPool: p - spent,
        fullyParried: remainingDice <= 0 && dice > 0,
    };
}
/**
 * Enter Passive Parry for the round: set pool, give up remaining Attack Actions.
 * Requires Passive Parry. Used by Parry Stance radial.
 */
export async function enterParry(actor, combat) {
    if (!actor || !combat) {
        return { ok: false, reason: 'Not in combat.' };
    }
    const computed = computeParryPoolMax(actor);
    if (!computed) {
        return { ok: false, reason: 'Requires Passive Parry.' };
    }
    if (computed.max <= 0) {
        return { ok: false, reason: 'Parry Pool is 0 (check Might/Agility).' };
    }
    const economy = (getActionEconomyActor(actor) ?? actor);
    const rs = getRoundState(economy, combat);
    if (rs.parry?.entered) {
        return {
            ok: false,
            reason: `Already in Parry (pool ${rs.parry.pool}/${rs.parry.max}).`,
            pool: rs.parry.pool,
            max: rs.parry.max,
            attribute: rs.parry.attribute,
        };
    }
    rs.parry = {
        entered: true,
        pool: computed.max,
        max: computed.max,
        attribute: computed.attribute,
    };
    // Give up all remaining Attack Actions this round (including extras).
    rs.attackActions.used = Math.max(rs.attackActions.used, rs.attackActions.total);
    rs.baseAttackLocked = true;
    await setRoundState(economy, rs);
    return {
        ok: true,
        pool: computed.max,
        max: computed.max,
        attribute: computed.attribute,
    };
}
/**
 * Apply Parry strip against an incoming attack dice pool. Persists remaining pool.
 */
export async function applyParryDiceStrip(defender, combat, attackDice) {
    const empty = {
        spent: 0,
        remainingDice: Math.max(0, Math.floor(Number(attackDice) || 0)),
        remainingPool: 0,
        fullyParried: false,
        note: '',
    };
    if (!defender || !combat)
        return empty;
    const economy = (getActionEconomyActor(defender) ?? defender);
    const parry = getParryState(economy, combat);
    if (!parry || parry.pool <= 0)
        return empty;
    const strip = computeParryStrip(attackDice, parry.pool);
    if (strip.spent <= 0)
        return { ...empty, remainingDice: strip.remainingDice };
    const rs = getRoundState(economy, combat);
    const stone = Math.max(0, Math.floor(Number(rs.stoneBonuses?.tempParryPool ?? 0) || 0));
    const stance = Math.max(0, Math.floor(Number(rs.parry?.pool) || 0));
    const fromStone = Math.min(stone, strip.spent);
    const fromStance = Math.max(0, strip.spent - fromStone);
    if (rs.stoneBonuses)
        rs.stoneBonuses.tempParryPool = stone - fromStone;
    if (rs.parry)
        rs.parry = { ...rs.parry, pool: Math.max(0, stance - fromStance) };
    await setRoundState(economy, rs);
    const defName = String(defender.name ?? 'Defender');
    const note = strip.fullyParried
        ? `Parry: ${defName} spent ${strip.spent} → Fully Parried (0 Attack Dice).`
        : `Parry: ${defName} spent ${strip.spent} → Attack Dice ${attackDice}→${strip.remainingDice} (pool ${strip.remainingPool}/${parry.max}).`;
    return {
        spent: strip.spent,
        remainingDice: strip.remainingDice,
        remainingPool: strip.remainingPool,
        fullyParried: strip.fullyParried,
        note,
    };
}
/** Equipped weapon / artifact weapon damage dice string (fallback 1d8). */
export function resolveEquippedWeaponDamageFormula(actor) {
    const items = actorItems(actor);
    const weapon = items.find((it) => it?.type === 'weapon' && it?.system?.equipped === true) ||
        items.find((it) => it?.type === 'artifact' &&
            it?.system?.equipped === true &&
            (it?.system?.artifactWeapon?.damage || it?.system?.baseProfile)) ||
        null;
    if (!weapon?.system)
        return '1d8';
    const sys = weapon.system;
    const artifactDmg = typeof sys.artifactWeapon?.damage === 'string' ? sys.artifactWeapon.damage.trim() : '';
    const raw = artifactDmg || sys.damage || sys.weaponDamage || sys.roll?.damage || null;
    if (typeof raw === 'string' && raw.trim())
        return raw.trim();
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0)
        return `${Math.floor(raw)}d8`;
    return '1d8';
}
/** Combine weapon base + rider flat (e.g. "2d8" + "+3d8" → "2d8+3d8"). */
export function buildDamageFormula(base, riderFlat) {
    const b = String(base || '').trim().replace(/^\+/, '');
    const r = String(riderFlat || '').trim().replace(/^\+/, '');
    if (!b && !r)
        return '0';
    if (!b)
        return r;
    if (!r)
        return b;
    return `${b}+${r}`;
}
export function buildRiposteFormula(actor, riderFlat) {
    return buildDamageFormula(resolveEquippedWeaponDamageFormula(actor), riderFlat);
}
/**
 * Reflection: triggering damage (or attacker weapon proxy when Fully Parried / raw 0)
 * plus the reaction rider.
 */
export function buildReflectionFormula(triggerDamage, attacker, riderFlat) {
    const raw = Math.max(0, Math.floor(Number(triggerDamage) || 0));
    if (raw > 0) {
        const r = String(riderFlat || '').trim().replace(/^\+/, '');
        return r ? `${raw}+${r}` : String(raw);
    }
    return buildDamageFormula(resolveEquippedWeaponDamageFormula(attacker), riderFlat);
}
export function isRiposteReaction(item) {
    const tid = String(item?.system?.templateId ?? '').toLowerCase();
    return tid === 'reaction-riposte' || String(item?.name ?? '').toLowerCase().includes('riposte');
}
export function isReflectionReaction(item) {
    const tid = String(item?.system?.templateId ?? '').toLowerCase();
    return (tid === 'reaction-parry-reflection' ||
        String(item?.name ?? '').toLowerCase().includes('reflection'));
}
//# sourceMappingURL=parry.js.map