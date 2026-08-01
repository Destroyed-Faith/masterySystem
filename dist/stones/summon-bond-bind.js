/**
 * Summon Bond create / release / stone accounting (V2).
 */
import { BASE_SUMMON, computeSummonBond, emptyBondSpend, legacyMovementTypeToMode, summonSkillSlots, summonTokensFromStones, } from './summon-bond-rules.js';
export const STONE_POOL_ATTRS = [
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
];
export function getSummonBondsFromActor(actor) {
    const raw = actor?.system?.summonBonds;
    return Array.isArray(raw) ? raw : [];
}
export function getFamiliarsFromActor(actor) {
    const raw = actor?.system?.familiars;
    return Array.isArray(raw) ? raw : [];
}
function newId(prefix) {
    try {
        return `${prefix}-${globalThis.foundry?.utils?.randomID?.() ?? Math.random().toString(36).slice(2, 10)}`;
    }
    catch {
        return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
    }
}
export function createBaseBody(partial) {
    return {
        id: partial?.id || newId('body'),
        hp: BASE_SUMMON.hp,
        armor: BASE_SUMMON.armor,
        evade: BASE_SUMMON.evade,
        sharedSenses: [],
        powers: [],
        dormant: false,
        summonActorId: partial?.summonActorId,
        hpPurchases: 0,
        armorPurchases: 0,
        evadePurchases: 0,
        ...partial,
    };
}
export function createEmptyBond(opts) {
    const stones = Math.max(1, opts.stoneAttributes.length);
    const spend = emptyBondSpend(1);
    const computed = computeSummonBond({
        boundStoneCount: stones,
        bonusTokens: 0,
        movementMode: opts.movementMode,
        spend,
    });
    const body = createBaseBody();
    return {
        id: newId('bond'),
        name: opts.name.trim() || 'Summon',
        img: opts.img || '',
        expression: opts.expression || '',
        ownerActorId: opts.ownerActorId,
        boundStoneCount: stones,
        stoneAttributes: opts.stoneAttributes.slice(0, stones),
        bonusTokens: 0,
        movementMode: opts.movementMode,
        movementM: computed.movementM,
        attackDice: computed.attackDice,
        damageDice: computed.damageDice,
        summonAttacks: computed.summonAttacks,
        specialKey: null,
        specialValue: 0,
        selectedSkills: [],
        skillDiceAlloc: {},
        spend,
        bodies: [body],
        activationTiming: 'after',
        needsRedistribution: true,
        locked: false,
    };
}
/** Migrate a V1 familiar record into a V2 bond stub (tokens unspent for redistribution). */
export function migrateFamiliarToBond(familiar, ownerActorId) {
    const stones = Math.max(1, Math.floor(Number(familiar.boundStoneCount) || 1));
    const attrs = [];
    const baseAttr = (familiar.baseStone?.attribute || 'vitality');
    attrs.push(STONE_POOL_ATTRS.includes(baseAttr) ? baseAttr : 'vitality');
    for (const u of familiar.upgradeStones || []) {
        const a = (u.attribute || 'vitality');
        attrs.push(STONE_POOL_ATTRS.includes(a) ? a : 'vitality');
    }
    // Pad / trim to stones count
    while (attrs.length < stones)
        attrs.push('vitality');
    const stoneAttributes = attrs.slice(0, stones);
    const mode = legacyMovementTypeToMode(familiar.movementType);
    const bond = createEmptyBond({
        name: familiar.name || 'Summon',
        img: familiar.img || '',
        ownerActorId: ownerActorId || familiar.ownerActorId || '',
        movementMode: mode,
        stoneAttributes,
    });
    bond.id = familiar.id || bond.id;
    if (familiar.summonActorId) {
        bond.bodies[0].summonActorId = familiar.summonActorId;
    }
    bond.needsRedistribution = true;
    bond.locked = !!familiar.locked;
    return bond;
}
export function recomputeBondDerived(bond) {
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    const bodies = bond.bodies.map((b, i) => {
        const cb = computed.bodies[i];
        if (!cb)
            return b;
        return {
            ...b,
            hp: b.dormant ? b.hp : cb.hp,
            armor: cb.armor,
            evade: cb.evade,
            sharedSenses: cb.sharedSenses,
        };
    });
    // Ensure body count matches spend
    while (bodies.length < computed.bodyCount) {
        bodies.push(createBaseBody());
    }
    return {
        ...bond,
        movementM: computed.movementM,
        attackDice: computed.attackDice,
        damageDice: computed.damageDice,
        summonAttacks: computed.summonAttacks,
        specialValue: computed.specialValue,
        bodies: bodies.slice(0, Math.max(computed.bodyCount, bodies.length)),
    };
}
export function validateBondSkillAlloc(bond, ownerSkillRatings) {
    const errors = [];
    const slots = summonSkillSlots(bond.boundStoneCount);
    if (bond.selectedSkills.length > slots) {
        errors.push(`Selected ${bond.selectedSkills.length} skills but only ${slots} slots (from Bound Stones).`);
    }
    let diceSum = 0;
    for (const [skill, dice] of Object.entries(bond.skillDiceAlloc || {})) {
        const d = Math.max(0, Math.floor(Number(dice) || 0));
        diceSum += d;
        const rating = Math.max(0, Math.floor(Number(ownerSkillRatings[skill]) || 0));
        if (d > 0 && rating <= 0) {
            errors.push(`Cannot assign dice to ${skill}: owner Rating is 0.`);
        }
        else if (d > rating) {
            errors.push(`${skill}: ${d} dice exceed owner Rating ${rating}.`);
        }
    }
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    if (diceSum > computed.skillDiceTotal) {
        errors.push(`Allocated ${diceSum} skill dice but only ${computed.skillDiceTotal} purchased.`);
    }
    return errors;
}
export async function persistSummonBonds(actor, bonds) {
    await actor.update({ 'system.summonBonds': bonds });
}
export async function bindSummonBond(actor, bond) {
    const bonds = [...getSummonBondsFromActor(actor), recomputeBondDerived(bond)];
    // Stone pool debit is handled by caller (stone-powers-dialog) via attribute stones.
    await persistSummonBonds(actor, bonds);
    return bonds[bonds.length - 1] || null;
}
export async function releaseSummonBond(actor, bondId) {
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bondId);
    if (idx < 0)
        return null;
    const [removed] = bonds.splice(idx, 1);
    await persistSummonBonds(actor, bonds);
    return removed;
}
export function tokensSummary(bond) {
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    return {
        available: summonTokensFromStones(bond.boundStoneCount, bond.bonusTokens),
        spent: computed.tokensSpent,
        remaining: computed.tokensRemaining,
        skillSlots: summonSkillSlots(bond.boundStoneCount),
    };
}
//# sourceMappingURL=summon-bond-bind.js.map