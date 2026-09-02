/**
 * Party Combat Analyzer — per-PC profiles from selected World Actors.
 *
 * Values come from the same aggregation live Foundry combat uses
 * (`getTargetEvade`, `getTargetArmor`, `getTargetSpellResistance`,
 * mechanics breakdown, Basic Attack = weapon + MR×2d8).
 *
 * Three bands:
 *   Baseline  — always-on equipment/passives-in-totals, Basic Attack, 1 action
 *   Sustained — Baseline + currently active buffs; legal repeatable attacks
 *   Burst     — Sustained + stone extras / limited powers
 *
 * Inactive known buffs are listed separately and are NOT applied to solver
 * numbers. Passive mechanics.evade/armor stay unused (live combat zeroes
 * them) and are flagged for rules review.
 */
import { isArtifactEquippedOnActor } from '../../utils/artifact-actor-rules.js';
import { artifactToVirtualWeapon } from '../../utils/unarmed-fallback.js';
import { canonicalSpecialId } from '../../utils/special-effects.js';
import { getPowerDefinitionRank } from '../../utils/power-definition-rank.js';
import { buildActorMechanicsBreakdown, buildBuffMechanicsBreakdown, collectMechanicsContributions, } from '../../utils/power-mechanics.js';
import { getTargetArmor, getTargetEvade, getTargetSpellResistance, } from '../../combat/target-defenses.js';
import { baseEvadeForMr, mightMeleeBonus, stonesForAttribute } from './combat-math.js';
/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
function num(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}
/** Parse "3d8+2" / "12" / "2d8" into { dice, flat }. */
export function parseDamageString(raw) {
    const t = String(raw ?? '').trim();
    if (!t)
        return { dice: 0, flat: 0 };
    const cleaned = t.replace(/^Weapon\s+(DMG|Damage)\s*\+\s*/i, '').trim();
    const dice = cleaned.match(/(\d+)\s*d\s*8/i);
    const flat = cleaned.match(/([+-]\s*\d+)(?!\s*d)/);
    const out = {
        dice: dice ? parseInt(dice[1], 10) : 0,
        flat: flat ? parseInt(flat[1].replace(/\s+/g, ''), 10) : 0,
    };
    if (out.dice === 0 && out.flat === 0) {
        const bare = parseInt(cleaned, 10);
        if (Number.isFinite(bare) && bare > 0)
            out.dice = bare;
    }
    return out;
}
export function parseSpecialStrings(list) {
    if (!Array.isArray(list))
        return [];
    const out = [];
    for (const entry of list) {
        if (entry && typeof entry === 'object') {
            const key = String(entry.key ?? entry.id ?? '').trim();
            const value = num(entry.rank ?? entry.value ?? entry.tier, 0);
            const id = canonicalSpecialId(key.toLowerCase());
            if (id && value > 0)
                out.push({ id, value });
            continue;
        }
        const m = String(entry ?? '').match(/^\s*([A-Za-zÄÖÜäöüß' -]+?)\s*\(\s*(\d+)\s*\)\s*$/);
        if (!m)
            continue;
        const id = canonicalSpecialId(m[1].trim().toLowerCase());
        if (!id)
            continue;
        out.push({ id, value: parseInt(m[2], 10) });
    }
    return out;
}
function itemsOf(actor) {
    if (Array.isArray(actor?.items?.contents))
        return actor.items.contents;
    if (Array.isArray(actor?.items))
        return actor.items;
    return [];
}
function statusEffectValue(system, specialId) {
    const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
    let total = 0;
    for (const e of list) {
        const id = canonicalSpecialId(String(e?.id ?? e?.special ?? '').toLowerCase());
        if (id === specialId)
            total += Math.max(0, num(e?.value, 0));
    }
    return total;
}
function isMentalPower(sys) {
    const tags = Array.isArray(sys?.tags) ? sys.tags.map((t) => String(t).toLowerCase()) : [];
    const tid = String(sys?.templateId ?? '').toLowerCase();
    return (tags.includes('mental') ||
        /mental/i.test(tid) ||
        /mind-illusion|mind-probe|mental-control/i.test(tid));
}
function isSpellPower(sys) {
    if (sys?.isSpell === true)
        return true;
    const tags = Array.isArray(sys?.tags) ? sys.tags.map((t) => String(t).toLowerCase()) : [];
    return tags.includes('spell');
}
function isLimitedPower(sys) {
    if (sys?.oncePerCombat === true || sys?.oncePerEncounter === true)
        return true;
    const freq = String(sys?.frequency ?? sys?.useLimit ?? '').toLowerCase();
    if (freq.includes('encounter') || freq.includes('combat') || freq.includes('once'))
        return true;
    const uses = num(sys?.usesPerCombat ?? sys?.uses?.max, 0);
    return uses > 0 && uses <= 2;
}
function isActiveBuffItem(it) {
    const sys = it?.system ?? {};
    const cat = String(sys.category ?? sys.powerType ?? sys.subfamily ?? '').toLowerCase();
    return cat.includes('buff') || sys.isActiveBuff === true;
}
function powerLevelRow(sys) {
    const level = Math.max(1, num(sys?.level ?? sys?.rank, 1));
    const levels = sys?.levels;
    if (!levels)
        return null;
    const rank = getPowerDefinitionRank(level, levels);
    if (Array.isArray(levels)) {
        return levels.find((row) => Number(row?.level) === rank) ?? levels[rank - 1] ?? null;
    }
    return levels[String(rank)] ?? levels[String(level)] ?? null;
}
function rawAttackScore(a) {
    return a.damageDice + a.flatDamage / 4.5;
}
/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */
export function analyzePc(actor) {
    const system = actor?.system ?? {};
    const combat = system.combat ?? {};
    const attributes = system.attributes ?? {};
    const warnings = [];
    const mr = Math.max(1, Math.min(8, Math.floor(num(system.mastery?.rank, 2))));
    const might = num(attributes.might?.value, 2);
    const agility = num(attributes.agility?.value, 2);
    if (!system.mastery?.rank && !combat.evadeTotal && !system.health?.bars) {
        warnings.push(`${actor?.name ?? '?'}: sieht nicht nach einem Mastery-Charakter aus — Fallbacks (MR ${mr}, Evade ${baseEvadeForMr(mr)}) werden verwendet.`);
    }
    const exposeValue = statusEffectValue(system, 'expose');
    const corrodeValue = statusEffectValue(system, 'corrode');
    const stoneEvade = Math.max(0, num(combat.stoneEvadeBonus, 0));
    const stoneArmor = Math.max(0, num(combat.stoneArmorBonus, 0));
    const stoneDr = Math.max(0, num(combat.stoneDrBonusPct, 0));
    const buffEvade = Math.max(0, num(combat.evadeFromActiveBuffs, 0));
    const buffArmor = Math.max(0, num(combat.armorFromActiveBuffs, 0));
    const buffSr = Math.max(0, num(combat.spellResistanceFromActiveBuffs, 0));
    let mechWard = 0;
    let mechAttackDice = 0;
    let mechDamageDice = 0;
    let mechDamageNegation = 0;
    let passiveEvadeUnused = 0;
    let passiveArmorUnused = 0;
    let buffDr = 0;
    try {
        const all = buildActorMechanicsBreakdown(actor);
        const buffs = buildBuffMechanicsBreakdown(actor);
        mechWard = Math.max(0, num(all.totals.wardIncoming, 0));
        mechAttackDice = Math.max(0, num(all.totals.rollDice?.attack, 0));
        mechDamageDice = Math.max(0, num(all.totals.rollDice?.damage, 0));
        passiveEvadeUnused = Math.max(0, num(all.totals.evade, 0) - num(buffs.totals.evade, 0));
        passiveArmorUnused = Math.max(0, num(all.totals.armor, 0) - num(buffs.totals.armor, 0));
        buffDr = Math.max(0, num(buffs.totals.damageReductionPct, 0));
        for (const c of collectMechanicsContributions(actor)) {
            const dn = num(c.mechanics?.damageNegationDice ?? c.mechanics?.damageNegation, 0);
            if (dn > 0)
                mechDamageNegation = Math.max(mechDamageNegation, dn);
        }
    }
    catch {
        /* tests / partial actors */
    }
    // Owned Passives now fold into evadeTotal/armorTotal — no longer warn as unused.
    void passiveEvadeUnused;
    void passiveArmorUnused;
    const liveEvade = getTargetEvade(actor);
    const liveArmor = getTargetArmor(actor);
    const liveSr = getTargetSpellResistance(actor);
    const evadeEquip = Math.round(liveEvade - buffEvade - stoneEvade + exposeValue);
    const armorEquip = Math.round(liveArmor - buffArmor - stoneArmor + corrodeValue);
    const evadeSustained = Math.round(liveEvade - stoneEvade + exposeValue);
    const armorSustained = Math.round(liveArmor - stoneArmor + corrodeValue);
    if (exposeValue > 0 || corrodeValue > 0) {
        warnings.push(`${actor?.name ?? '?'}: aktive Status-Effekte (Expose/Corrode) wurden für die Baseline herausgerechnet.`);
    }
    const statusCount = Array.isArray(system.statusEffects) ? system.statusEffects.length : 0;
    if (statusCount > 0 && exposeValue === 0 && corrodeValue === 0) {
        warnings.push(`${actor?.name ?? '?'}: hat aktive Status-Effekte — Baseline ignoriert sie.`);
    }
    const tempHP = num(system.health?.tempHP, 0);
    if (tempHP > 0) {
        warnings.push(`${actor?.name ?? '?'}: ${tempHP} Temp-HP im Datensatz — Baseline rechnet ohne Temp-HP.`);
    }
    if (system.creation?.skillsRedistributing === true) {
        warnings.push(`${actor?.name ?? '?'}: ist im Skill-Bearbeitungsmodus — Werte können transient sein.`);
    }
    const bars = Array.isArray(system.health?.bars) ? system.health.bars : [];
    const healthBars = bars.map((b) => Math.max(0, num(b?.max, 0)));
    if (healthBars.length === 0)
        healthBars.push(Math.max(1, num(attributes.vitality?.value, 2) * 2));
    const totalHealth = healthBars.reduce((a, b) => a + b, 0);
    const healthLevelSize = Math.max(1, healthBars[0]);
    const currentDamage = bars.reduce((acc, b) => acc + Math.max(0, num(b?.max, 0) - num(b?.current, num(b?.max, 0))), 0);
    if (currentDamage > 0) {
        warnings.push(`${actor?.name ?? '?'}: aktuell verletzt — Baseline nutzt volle Gesundheit.`);
    }
    let parryPoolMax = 0;
    let canCleanse = false;
    let damageNegationDice = 0;
    const items = itemsOf(actor);
    for (const it of items) {
        if (it?.type !== 'power')
            continue;
        const sys = it?.system ?? {};
        const tid = String(sys.templateId ?? '').toLowerCase();
        const name = String(it?.name ?? '').toLowerCase();
        const chosenKey = String(sys.chosenSpecial?.key ?? '').toLowerCase();
        if (tid.includes('parry')) {
            const level = Math.max(1, num(sys.level ?? sys.rank, 1));
            parryPoolMax = Math.max(parryPoolMax, Math.min(Math.max(might, agility), 5 * level));
        }
        if (chosenKey === 'cleanse' || String(sys.subfamily ?? '').toLowerCase() === 'support-cleanse' || name.includes('cleanse')) {
            canCleanse = true;
        }
        const dn = num(sys.mechanics?.damageNegationDice ?? sys.damageNegationDice, 0);
        if (dn > 0)
            damageNegationDice = Math.max(damageNegationDice, dn);
    }
    damageNegationDice = Math.max(damageNegationDice, mechDamageNegation);
    const phasingCharges = Math.max(0, num(actor?.flags?.['mastery-system']?.phasingCharges?.max, 0));
    const sheetDr = Math.max(0, Math.min(100, Math.round(num(combat.damageReductionPct, 0))));
    const drBaseline = Math.max(0, sheetDr - stoneDr - buffDr);
    const drSustained = Math.max(0, sheetDr - stoneDr);
    const srBaseline = Math.max(0, Math.round(num(combat.spellResistanceTotal, 0)));
    const srSustained = Math.max(0, srBaseline + buffSr);
    const srBurst = Math.max(0, Math.round(liveSr));
    const fallbackEvade = baseEvadeForMr(mr);
    const defenseBaseline = {
        evade: Number.isFinite(evadeEquip) ? evadeEquip : fallbackEvade,
        armor: Number.isFinite(armorEquip) ? armorEquip : mr,
        drPct: drBaseline,
        spellResistance: srBaseline,
        phasingCharges,
        ward: mechWard,
        damageNegationDice,
        notes: [
            `Evade ${Number.isFinite(evadeEquip) ? evadeEquip : fallbackEvade} = evadeTotal − Buffs − Stones (Expose herausgerechnet)`,
            `Armor ${Number.isFinite(armorEquip) ? armorEquip : mr} = armorTotal − Buffs − Stones (Corrode herausgerechnet)`,
        ],
    };
    const defenseSustained = {
        evade: Number.isFinite(evadeSustained) ? evadeSustained : defenseBaseline.evade,
        armor: Number.isFinite(armorSustained) ? armorSustained : defenseBaseline.armor,
        drPct: drSustained,
        spellResistance: srSustained,
        phasingCharges,
        ward: mechWard,
        damageNegationDice,
        notes: [
            `Evade ${Number.isFinite(evadeSustained) ? evadeSustained : defenseBaseline.evade} = getTargetEvade − Stones (aktive Buffs ${buffEvade >= 0 ? '+' : ''}${buffEvade})`,
            `Armor ${Number.isFinite(armorSustained) ? armorSustained : defenseBaseline.armor} = getTargetArmor − Stones (aktive Buffs +${buffArmor})`,
        ],
    };
    const defenseBurst = {
        ...defenseSustained,
        evade: defenseSustained.evade + stoneEvade,
        armor: defenseSustained.armor + stoneArmor,
        drPct: Math.min(100, defenseSustained.drPct + stoneDr),
        spellResistance: srBurst,
        notes: [
            ...defenseSustained.notes,
            stoneEvade || stoneArmor || stoneDr
                ? `Burst addiert aktuelle Stone-Boni (Evade +${stoneEvade}, Armor +${stoneArmor}, DR +${stoneDr}%)`
                : 'Keine Stone-Boni im Datensatz — Burst-Defense = Sustained',
        ],
    };
    /* ---------------- Weapon ---------------- */
    let weapon = items.find((i) => i?.type === 'weapon' && i?.system?.equipped === true) ?? null;
    let weaponFromArtifact = false;
    for (const it of items) {
        if (it?.type !== 'artifact')
            continue;
        try {
            if (!isArtifactEquippedOnActor(it))
                continue;
            const vw = artifactToVirtualWeapon(it);
            if (!vw?.system)
                continue;
            const candidate = parseDamageString(vw.system.damage ?? vw.system.baseDamage).dice;
            const current = weapon ? parseDamageString(weapon.system?.damage ?? weapon.system?.baseDamage).dice : 0;
            if (candidate > current) {
                weapon = vw;
                weaponFromArtifact = true;
            }
        }
        catch {
            /* malformed artifact */
        }
    }
    if (!weapon) {
        const anyWeapon = items.find((i) => i?.type === 'weapon');
        if (anyWeapon) {
            weapon = anyWeapon;
            warnings.push(`${actor?.name ?? '?'}: keine Waffe als ausgerüstet markiert — beste vorhandene Waffe angenommen.`);
        }
    }
    const weaponSys = weapon?.system ?? {};
    const weaponDamage = parseDamageString(weaponSys.damage ?? weaponSys.baseDamage);
    if (weaponDamage.dice === 0 && weaponDamage.flat === 0)
        weaponDamage.dice = 1;
    const weaponSpecials = parseSpecialStrings(weaponSys.specials);
    const isRangedWeapon = String(weaponSys.weaponType ?? '').toLowerCase().includes('ranged');
    const finesse = String(weaponSys.freeTrait ?? '').toLowerCase().includes('finesse') ||
        weaponSpecials.some((s) => s.id === 'finesse') ||
        String(weaponSys.innateAbilities ?? '').toLowerCase().includes('finesse');
    const attackAttrOverride = String(weaponSys.attackAttribute ?? '').toLowerCase();
    let attackAttrValue;
    if (attackAttrOverride && num(attributes[attackAttrOverride]?.value, 0) > 0) {
        attackAttrValue = num(attributes[attackAttrOverride].value, 2);
    }
    else if (finesse || isRangedWeapon) {
        attackAttrValue = agility;
    }
    else {
        attackAttrValue = might;
    }
    const meleeFlat = isRangedWeapon ? 0 : mightMeleeBonus(might);
    const penetration = weaponSpecials
        .filter((s) => s.id === 'penetration')
        .reduce((a, s) => a + s.value, 0);
    const basicMrDice = mr * 2;
    const pool = Math.max(mr, Math.floor(attackAttrValue)) + mechAttackDice;
    const weaponName = weapon?.name ? String(weapon.name) : 'Unbewaffnet';
    const basicAttack = {
        label: weaponFromArtifact ? `${weaponName} (Artefakt)` : weaponName,
        role: 'basic',
        kind: 'martial',
        delivery: isRangedWeapon ? 'ranged' : 'melee',
        pool,
        keep: mr,
        damageDice: weaponDamage.dice + basicMrDice + mechDamageDice,
        flatDamage: Math.max(0, weaponDamage.flat) + meleeFlat,
        penetration,
        specials: weaponSpecials.filter((s) => s.id !== 'penetration' && s.id !== 'finesse'),
        spellPowerLevel: null,
        casterMr: mr,
        isMental: false,
        notes: [
            `Basic Attack: ${weaponDamage.dice}d8 Waffe + ${basicMrDice}d8 (MR×2)`,
            mechAttackDice ? `Passive/Buff Attack-Dice +${mechAttackDice}` : '',
            mechDamageDice ? `Passive/Buff Damage-Dice +${mechDamageDice}` : '',
        ].filter(Boolean),
    };
    const sustainedAttacks = [basicAttack];
    const burstOnlyAttacks = [];
    for (const it of items) {
        if (it?.type !== 'power')
            continue;
        const sys = it?.system ?? {};
        const row = powerLevelRow(sys);
        const dmgRaw = row?.effect?.dice ?? row?.roll?.damage ?? sys.roll?.damage;
        const { dice } = parseDamageString(dmgRaw);
        if (dice <= 0)
            continue;
        const level = Math.max(1, Math.min(16, num(sys.level ?? sys.rank, 1)));
        const specials = parseSpecialStrings(row?.specials ?? sys.specials);
        if (sys.chosenSpecial?.key) {
            const id = canonicalSpecialId(String(sys.chosenSpecial.key).toLowerCase());
            const value = num(sys.chosenSpecial.rank ?? sys.chosenSpecial.value ?? sys.chosenSpecial.tier, 0);
            if (id && value > 0 && !specials.some((s) => s.id === id))
                specials.push({ id, value });
        }
        const limited = isLimitedPower(sys);
        const spell = isSpellPower(sys);
        const ignoreWeapon = sys.ignoreWeaponDamage === true || spell;
        const mental = isMentalPower(sys);
        let castAttr = Math.max(num(attributes.intellect?.value, 2), num(attributes.resolve?.value, 2), num(attributes.wits?.value, 2));
        const castKey = String(sys.castingAttribute ?? '').toLowerCase();
        if (castKey && num(attributes[castKey]?.value, 0) > 0) {
            castAttr = num(attributes[castKey].value, 2);
        }
        let profile;
        if (spell) {
            profile = {
                label: String(it.name ?? 'Zauber'),
                role: 'spell',
                kind: 'spell',
                delivery: 'ranged',
                pool: Math.max(mr, Math.floor(castAttr)) + mechAttackDice,
                keep: mr,
                damageDice: dice + mechDamageDice,
                flatDamage: 0,
                penetration: 0,
                specials,
                spellPowerLevel: level,
                casterMr: mr,
                isMental: mental,
                notes: [
                    `Spell ${dice}d8 · TN = 8×MR${mental ? '+4 Mental' : ''} (nicht Power Level)`,
                    ignoreWeapon ? 'Ohne Waffe' : '',
                ].filter(Boolean),
            };
        }
        else if (ignoreWeapon) {
            profile = {
                label: String(it.name ?? 'Power'),
                role: 'power-only',
                kind: 'martial',
                delivery: isRangedWeapon ? 'ranged' : 'melee',
                pool,
                keep: mr,
                damageDice: dice + mechDamageDice,
                flatDamage: meleeFlat,
                penetration: 0,
                specials,
                spellPowerLevel: null,
                casterMr: mr,
                isMental: false,
                notes: [`Unabhängige Power ${dice}d8 (ignoreWeaponDamage)`],
            };
        }
        else {
            profile = {
                label: `${String(it.name ?? 'Power')} + ${weaponName}`,
                role: 'power-rider',
                kind: 'martial',
                delivery: isRangedWeapon ? 'ranged' : 'melee',
                pool,
                keep: mr,
                damageDice: weaponDamage.dice + dice + mechDamageDice,
                flatDamage: Math.max(0, weaponDamage.flat) + meleeFlat,
                penetration,
                specials: [
                    ...weaponSpecials.filter((s) => s.id !== 'penetration' && s.id !== 'finesse'),
                    ...specials,
                ],
                spellPowerLevel: null,
                casterMr: mr,
                isMental: false,
                notes: [`Power-Rider: Waffe ${weaponDamage.dice}d8 + Power ${dice}d8 (kein MR×2)`],
            };
        }
        if (limited)
            burstOnlyAttacks.push(profile);
        else
            sustainedAttacks.push(profile);
    }
    const pickBest = (list) => list.reduce((best, a) => (rawAttackScore(a) > rawAttackScore(best) ? a : best));
    let stonesTotal = 0;
    for (const key of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits']) {
        stonesTotal += stonesForAttribute(num(attributes[key]?.value, 0));
    }
    const extraAttackStoneCost = 2;
    let burstBonusDamageDice = 0;
    if (!isRangedWeapon) {
        if (stonesTotal >= 15)
            burstBonusDamageDice = 2 + 4 + 8 + 16;
        else if (stonesTotal >= 7)
            burstBonusDamageDice = 2 + 4 + 8;
        else if (stonesTotal >= 3)
            burstBonusDamageDice = 2 + 4;
        else if (stonesTotal >= 1)
            burstBonusDamageDice = 2;
    }
    let burstExtraActions = 0;
    if (stonesTotal >= 14)
        burstExtraActions = 3;
    else if (stonesTotal >= 6)
        burstExtraActions = 2;
    else if (stonesTotal >= extraAttackStoneCost)
        burstExtraActions = 1;
    const burstAttacks = [...sustainedAttacks, ...burstOnlyAttacks].map((a) => ({
        ...a,
        damageDice: a.damageDice + burstBonusDamageDice,
        notes: [...a.notes, burstBonusDamageDice ? `Burst +${burstBonusDamageDice}d8 Stones` : ''].filter(Boolean),
    }));
    const baselineBand = {
        attack: basicAttack,
        attacks: [basicAttack],
        attackActions: 1,
        notes: basicAttack.notes,
    };
    const sustainedBest = pickBest(sustainedAttacks);
    const sustainedBand = {
        attack: sustainedBest,
        attacks: sustainedAttacks,
        attackActions: 1,
        notes: [
            `Sustained-Pick: ${sustainedBest.label} (${sustainedBest.role})`,
            'Extra-Attack aus Stones zählt nicht als Sustained',
            ...sustainedBest.notes,
        ],
    };
    const burstBest = pickBest(burstAttacks);
    const burstBand = {
        attack: burstBest,
        attacks: burstAttacks,
        attackActions: 1 + burstExtraActions,
        notes: [
            `Burst-Pick: ${burstBest.label}`,
            burstExtraActions ? `+${burstExtraActions} Extra-Attack (Stones ≥ ${extraAttackStoneCost})` : 'Kein Extra-Attack',
            ...burstBest.notes,
        ],
    };
    const knownBuffs = [];
    for (const it of items) {
        if (it?.type !== 'power' || !isActiveBuffItem(it))
            continue;
        const row = powerLevelRow(it.system);
        const mech = row?.mechanics ?? it.system?.mechanics ?? {};
        const potential = { name: String(it.name ?? 'Buff') };
        if (num(mech.evade, 0) > 0)
            potential.evade = num(mech.evade, 0);
        if (num(mech.armor, 0) > 0)
            potential.armor = num(mech.armor, 0);
        if (num(mech.damageReductionPct, 0) > 0)
            potential.drPct = num(mech.damageReductionPct, 0);
        if (num(mech.spellResistance, 0) > 0)
            potential.spellResistance = num(mech.spellResistance, 0);
        if (num(mech.wardIncoming, 0) > 0)
            potential.ward = num(mech.wardIncoming, 0);
        if (potential.evade ||
            potential.armor ||
            potential.drPct ||
            potential.spellResistance ||
            potential.ward) {
            knownBuffs.push(potential);
        }
    }
    return {
        actorId: String(actor?.id ?? ''),
        name: String(actor?.name ?? 'Unbenannt'),
        mr,
        evade: defenseSustained.evade,
        armor: defenseSustained.armor,
        drPct: defenseSustained.drPct,
        spellResistance: defenseSustained.spellResistance,
        parryPoolMax,
        phasingCharges: defenseSustained.phasingCharges,
        ward: defenseSustained.ward,
        damageNegationDice: defenseSustained.damageNegationDice,
        reactionsPerRound: 1,
        healthBars,
        totalHealth,
        healthLevelSize,
        attacks: sustainedAttacks,
        bestAttack: sustainedBest,
        attackActionsPerRound: 1,
        stonesTotal,
        extraAttackStoneCost,
        burstBonusDamageDice,
        burstExtraActions,
        canCleanse,
        defense: { baseline: defenseBaseline, sustained: defenseSustained, burst: defenseBurst },
        offense: { baseline: baselineBand, sustained: sustainedBand, burst: burstBand },
        knownBuffs,
        warnings,
    };
}
function median(values) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
export function analyzePartyActors(actors) {
    const members = actors.map((a) => analyzePc(a));
    return {
        members,
        size: members.length,
        medianMr: Math.round(median(members.map((m) => m.mr))) || 2,
        warnings: members.flatMap((m) => m.warnings),
    };
}
//# sourceMappingURL=party-analyzer.js.map