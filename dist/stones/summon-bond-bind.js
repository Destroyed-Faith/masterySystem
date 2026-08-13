/**
 * Summon Bond create / release / stone accounting (V2).
 * Canonical workflow — do not use the legacy Familiar editor for creation.
 */
import { applySustainedDelta, getActorPoolSpendable, } from './familiar-bind.js';
import { BASE_SUMMON, BOND_STATUS_LABEL, classifyBondStatus, computeSummonBond, emptyBondSpend, legacyMovementTypeToMode, normalizeMovementMode, summonSkillSlots, summonTokensFromStones, } from './summon-bond-rules.js';
import { evaluateSummonPower } from './summon-power-allowlist.js';
export const DISSOLVE_BOND_CONFIRM = 'Dissolve this Summon Bond? Bound Stones return to the owner. Existing summon tokens will be removed. Body actors may be archived or deleted according to system settings.';
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
        bondSpent: computed.bondUpgradeTokens + computed.specialTokens,
        skillsSpent: computed.skillTokens,
        specialSpent: computed.specialTokens,
        bodySpent: computed.bodyTokens,
    };
}
export function bondStoneAssignments(bond) {
    const out = {};
    for (const attr of bond.stoneAttributes || []) {
        if (!attr)
            continue;
        out[attr] = (out[attr] ?? 0) + 1;
    }
    return out;
}
export function syncBodiesFromSpend(bond) {
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    const existing = [...bond.bodies];
    const bodies = [];
    for (let i = 0; i < computed.bodyCount; i++) {
        const prev = existing[i];
        const cb = computed.bodies[i];
        const bodySpend = bond.spend.bodies[i];
        const powers = prev?.powers ?? [];
        bodies.push(createBaseBody({
            id: prev?.id,
            summonActorId: prev?.summonActorId,
            dormant: !!prev?.dormant,
            hp: prev?.dormant ? prev.hp : cb.hp,
            armor: cb.armor,
            evade: cb.evade,
            sharedSenses: cb.sharedSenses,
            powers,
            hpPurchases: bodySpend?.hpPurchases ?? 0,
            armorPurchases: bodySpend?.armorPurchases ?? 0,
            evadePurchases: bodySpend?.evadePurchases ?? 0,
        }));
    }
    // Drop surplus body actors when body count shrinks (caller deletes actors).
    return {
        ...bond,
        movementM: computed.movementM,
        attackDice: computed.attackDice,
        damageDice: computed.damageDice,
        summonAttacks: computed.summonAttacks,
        specialValue: computed.specialValue,
        bodies,
    };
}
export function validateBondPowers(bond, ownerMasteryRank = 1) {
    const errors = [];
    for (const body of bond.bodies || []) {
        for (const p of body.powers || []) {
            const ev = evaluateSummonPower(p.templateId, p.level, ownerMasteryRank);
            if (!ev.legal) {
                errors.push(`${body.id}: ${ev.name} L${p.level} — ${ev.reason}`);
            }
        }
    }
    return errors;
}
export function validateBondRitual(bond, ownerSkillRatings = {}, ownerMasteryRank = 1) {
    const errors = [];
    const warnings = [];
    if (!bond.name?.trim())
        errors.push('Name is required.');
    if (bond.boundStoneCount < 1 || bond.stoneAttributes.length < 1) {
        errors.push('A Summon Bond requires at least 1 Bound Stone. Artifact bonus Tokens cannot create a Bond.');
    }
    if (bond.stoneAttributes.length !== bond.boundStoneCount) {
        errors.push('stoneAttributes length must equal boundStoneCount.');
    }
    const rawMode = String(bond.movementMode || '');
    if (/climb/i.test(rawMode)) {
        warnings.push('Legacy Climbing mode was collapsed to Walking.');
    }
    bond.movementMode = normalizeMovementMode(bond.movementMode);
    // Sync power token costs from allowlist evaluation (source of truth).
    for (let i = 0; i < bond.spend.bodies.length; i++) {
        const body = bond.bodies[i];
        if (!body)
            continue;
        const costs = (body.powers || []).map((p) => {
            const ev = evaluateSummonPower(p.templateId, p.level, ownerMasteryRank);
            p.tokenCost = ev.tokenCost;
            p.category = ev.category;
            return ev.tokenCost;
        });
        bond.spend.bodies[i] = { ...bond.spend.bodies[i], powerTokenCosts: costs };
    }
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    errors.push(...computed.errors);
    warnings.push(...computed.warnings);
    errors.push(...validateBondSkillAlloc(bond, ownerSkillRatings));
    errors.push(...validateBondPowers(bond, ownerMasteryRank));
    if (bond.spend.specialAccess && !bond.specialKey) {
        errors.push('Special Access requires selecting an eligible Special.');
    }
    if (bond.spend.specialAccess && computed.summonAttacks < 1) {
        errors.push('Special Access requires at least 1 Bond Attack Action.');
    }
    if (!bond.spend.specialAccess && bond.specialKey) {
        warnings.push('Special key set without Special Access — will be cleared on apply.');
    }
    const budgetErrors = errors.filter((e) => /Spent \d+ Tokens/.test(e));
    const hardErrors = errors.filter((e) => !budgetErrors.includes(e));
    const overBudget = computed.tokensRemaining < 0 || budgetErrors.length > 0;
    const status = classifyBondStatus({
        hardErrors,
        overBudget,
        needsRedistribution: !!bond.needsRedistribution,
    });
    return {
        ok: hardErrors.length === 0 && !overBudget,
        errors,
        warnings,
        hardErrors,
        overBudget,
        status,
        statusLabel: BOND_STATUS_LABEL[status],
        computed,
    };
}
/** Create a new Summon Bond, debit Bound Stones from the owner's pool, clear legacy familiars. */
export async function createSummonBondWithStones(actor, opts) {
    const attrs = (opts.stoneAttributes || []).filter((a) => STONE_POOL_ATTRS.includes(a));
    if (attrs.length < 1)
        return { bond: null, errors: ['Assign at least 1 Bound Stone.'] };
    if (!opts.name?.trim())
        return { bond: null, errors: ['Name is required.'] };
    const need = {};
    for (const a of attrs)
        need[a] = (need[a] ?? 0) + 1;
    const spendable = getActorPoolSpendable(actor);
    for (const [attr, n] of Object.entries(need)) {
        if ((spendable[attr] ?? 0) < n) {
            return { bond: null, errors: [`Not enough ${attr} stones (need ${n}, have ${spendable[attr] ?? 0}).`] };
        }
    }
    let bond = createEmptyBond({
        name: opts.name,
        img: opts.img,
        ownerActorId: actor.id,
        movementMode: opts.movementMode,
        stoneAttributes: attrs,
        expression: opts.expression,
    });
    // Artifact bonus Tokens cannot create a Bond and are ignored at create.
    bond.bonusTokens = 0;
    bond.activationTiming = opts.activationTiming ?? 'after';
    bond.needsRedistribution = true;
    bond = recomputeBondDerived(bond);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, need, 1);
    const bonds = [...getSummonBondsFromActor(actor), bond];
    await actor.update({
        'system.summonBonds': bonds,
        'system.stonePools': stonePools,
        'system.familiars': [],
    });
    return { bond, errors: [] };
}
/** Persist an edited bond list entry (no stone debit). */
export async function upsertSummonBond(actor, bond) {
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bond.id);
    const next = recomputeBondDerived(bond);
    if (idx >= 0)
        bonds[idx] = next;
    else
        bonds.push(next);
    await persistSummonBonds(actor, bonds);
}
/**
 * Apply Bond Ritual: validate spend, sync bodies, clear needsRedistribution,
 * restore dormant bodies to full HP.
 */
export async function applyBondRitual(actor, bondDraft, ownerSkillRatings = {}) {
    const mr = Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
    // Sync power token costs into spend before validate
    const draft = foundryDuplicate(bondDraft);
    for (let i = 0; i < draft.spend.bodies.length; i++) {
        const body = draft.bodies[i];
        if (!body)
            continue;
        draft.spend.bodies[i] = {
            ...draft.spend.bodies[i],
            powerTokenCosts: (body.powers || []).map((p) => Math.max(0, Math.floor(p.tokenCost || 0))),
            sharedSenses: (body.sharedSenses || []),
            hpPurchases: body.hpPurchases ?? draft.spend.bodies[i].hpPurchases,
            armorPurchases: body.armorPurchases ?? draft.spend.bodies[i].armorPurchases,
            evadePurchases: body.evadePurchases ?? draft.spend.bodies[i].evadePurchases,
        };
    }
    if (!draft.spend.specialAccess) {
        draft.specialKey = null;
        draft.spend.specialValuePurchases = 0;
    }
    const validation = validateBondRitual(draft, ownerSkillRatings, mr);
    if (!validation.ok) {
        return { bond: null, errors: validation.errors, warnings: validation.warnings };
    }
    let bond = syncBodiesFromSpend(draft);
    const computed = computeSummonBond({
        boundStoneCount: bond.boundStoneCount,
        bonusTokens: bond.bonusTokens,
        movementMode: bond.movementMode,
        spend: bond.spend,
    });
    // Bond Ritual / Safe Haven Rest restores dormant bodies at full HP.
    bond.bodies = bond.bodies.map((b, i) => ({
        ...b,
        dormant: false,
        hp: computed.bodies[i]?.hp ?? b.hp,
        armor: computed.bodies[i]?.armor ?? b.armor,
        evade: computed.bodies[i]?.evade ?? b.evade,
        sharedSenses: computed.bodies[i]?.sharedSenses ?? b.sharedSenses,
    }));
    bond.needsRedistribution = false;
    bond.locked = true;
    bond = recomputeBondDerived(bond);
    await upsertSummonBond(actor, bond);
    try {
        const { syncSummonBodyActorsFromBond } = await import('./familiar-actor-factory.js');
        await syncSummonBodyActorsFromBond(bond, actor);
    }
    catch (err) {
        console.warn('Mastery System | Bond Ritual actor sync failed', err);
    }
    return { bond, errors: [], warnings: validation.warnings };
}
function foundryDuplicate(obj) {
    try {
        return globalThis.foundry?.utils?.duplicate?.(obj) ?? structuredClone(obj);
    }
    catch {
        return JSON.parse(JSON.stringify(obj));
    }
}
/** Add Bound Stones during a Bond Ritual (debits pool; marks needsRedistribution). */
export async function addBoundStonesToBond(actor, bondId, attributes) {
    const attrs = attributes.filter((a) => STONE_POOL_ATTRS.includes(a));
    if (!attrs.length)
        return { bond: null, errors: ['No stones selected.'] };
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bondId);
    if (idx < 0)
        return { bond: null, errors: ['Bond not found.'] };
    const need = {};
    for (const a of attrs)
        need[a] = (need[a] ?? 0) + 1;
    const spendable = getActorPoolSpendable(actor);
    for (const [attr, n] of Object.entries(need)) {
        if ((spendable[attr] ?? 0) < n) {
            return { bond: null, errors: [`Not enough ${attr} stones.`] };
        }
    }
    const bond = { ...bonds[idx] };
    bond.stoneAttributes = [...bond.stoneAttributes, ...attrs];
    bond.boundStoneCount = bond.stoneAttributes.length;
    bond.needsRedistribution = true;
    bonds[idx] = recomputeBondDerived(bond);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, need, 1);
    await actor.update({
        'system.summonBonds': bonds,
        'system.stonePools': stonePools,
    });
    return { bond: bonds[idx], errors: [] };
}
/** Remove Bound Stones during a Bond Ritual (credits pool; may force redistrib). */
export async function removeBoundStonesFromBond(actor, bondId, indices) {
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bondId);
    if (idx < 0)
        return { bond: null, errors: ['Bond not found.'] };
    const bond = { ...bonds[idx], stoneAttributes: [...bonds[idx].stoneAttributes] };
    const sorted = [...new Set(indices)].sort((a, b) => b - a);
    const returned = {};
    for (const i of sorted) {
        if (i < 0 || i >= bond.stoneAttributes.length)
            continue;
        const [attr] = bond.stoneAttributes.splice(i, 1);
        if (attr)
            returned[attr] = (returned[attr] ?? 0) + 1;
    }
    if (bond.stoneAttributes.length < 1) {
        return { bond: null, errors: ['A Bond must keep at least 1 Bound Stone (or dissolve it).'] };
    }
    bond.boundStoneCount = bond.stoneAttributes.length;
    bond.needsRedistribution = true;
    bonds[idx] = recomputeBondDerived(bond);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, returned, -1);
    await actor.update({
        'system.summonBonds': bonds,
        'system.stonePools': stonePools,
    });
    return { bond: bonds[idx], errors: [] };
}
/** Set Artifact-generated bonus Tokens on a Bond (not Bound Stones). */
export async function setBondBonusTokens(actor, bondId, bonusTokens) {
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bondId);
    if (idx < 0)
        return null;
    bonds[idx] = recomputeBondDerived({
        ...bonds[idx],
        bonusTokens: Math.max(0, Math.floor(Number(bonusTokens) || 0)),
        needsRedistribution: true,
    });
    await persistSummonBonds(actor, bonds);
    return bonds[idx];
}
/**
 * Dissolve / release a Summon Bond via Bond Ritual: return Bound Stones, delete body actors.
 */
export async function dissolveSummonBond(actor, bondId, deleteActors = async () => { }) {
    const bonds = getSummonBondsFromActor(actor);
    const idx = bonds.findIndex((b) => b.id === bondId);
    if (idx < 0)
        return { removed: null, errors: ['Bond not found.'] };
    const [removed] = bonds.splice(idx, 1);
    for (const body of removed.bodies || []) {
        await deleteActors(body.summonActorId);
    }
    const assignments = bondStoneAssignments(removed);
    const stonePools = applySustainedDelta(actor.system?.stonePools ?? {}, assignments, -1);
    await actor.update({
        'system.summonBonds': bonds,
        'system.stonePools': stonePools,
    });
    return { removed, errors: [] };
}
/** Owner skill ratings helper for ritual validation. */
export function ownerSkillRatingsFromActor(actor) {
    const skills = actor?.system?.skills ?? {};
    const out = {};
    for (const [key, val] of Object.entries(skills)) {
        const rating = typeof val === 'number'
            ? val
            : Math.max(0, Math.floor(Number(val?.rating ?? val?.value ?? 0) || 0));
        out[key] = rating;
    }
    return out;
}
//# sourceMappingURL=summon-bond-bind.js.map