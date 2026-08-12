/**
 * Extended Actor document for Mastery System
 */
import { calculateStones, calculateTotalStones, updateAttributeStones, initializeHealthBars, initializeStressBars, calculateHealthBarMax, calculateStressBarMax, calculateMightDamageBonus, calculateAgilityEvadeBonus, calculateAgilityRangeBonus, calculateIntellectSaveTNBonus, calculateResolveStressArmor, calculateInfluenceSkillBonus, calculateWitsInitiativeBonus, calculateArmorBreaker, calculateBaseEvade } from '../utils/calculations.js';
import { getInitiativeEquipmentRows, getEquippedEquipmentInitiativeModifier, getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
import { buildActorMechanicsBreakdown, buildBuffMechanicsBreakdown } from '../utils/power-mechanics.js';
import { buildArtifactBaseValueBreakdown } from '../utils/artifact-base-values.js';
import { getArtifactStoneFunctionStatus } from '../utils/artifact-stone-functions.js';
import { normalizeManualAdjustments } from '../utils/manual-adjustments.js';
import { getActiveSpecialValue } from '../system/active-specials.js';
import { getRoundState } from '../combat/action-economy.js';
import { deriveMasteryRankFromStones, getWorldDefaultMasteryRank, } from '../utils/mastery-rank-sync.js';
import { getDivineScale } from '../utils/constants.js';
import { coerceNpcPhasesArray, ensureNpcHealthState, sumNpcAttackSlotsFromPowers, } from '../utils/npc-attack-model.js';
export class MasteryActor extends Actor {
    // NOTE: Do NOT override prepareData() here. Core v13 already runs
    // prepareBaseData → prepareEmbeddedDocuments (ActiveEffects phase "initial")
    // → prepareDerivedData → ActiveEffects phase "final". The old override
    // re-ran prepareBaseData/prepareDerivedData after super.prepareData(),
    // which corrupted the v13 effect-phase tracking on synthetic (unlinked
    // token) actors — "ActiveEffect application phase … has already completed"
    // — and silently overwrote any ActiveEffect changes to derived values.
    /**
     * Prepare base data for the actor (attributes, stones, etc.)
     */
    prepareBaseData() {
        super.prepareBaseData();
        const system = this.system;
        // Calculate derived values if needed
        if (system.attributes) {
            // Calculate attribute stones using /8 rule (Single Source of Truth)
            for (const attr of Object.values(system.attributes)) {
                if (attr && typeof attr.value === 'number') {
                    updateAttributeStones(attr);
                }
            }
            // NEW: Calculate per-attribute stone pools (floor(attribute / 8))
            // For characters only (NPCs may have stones but don't use action bonuses)
            if (this.type === 'character') {
                // Initialize stonePools if it doesn't exist (for new characters)
                if (!system.stonePools) {
                    system.stonePools = {};
                }
                const attributeKeys = ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits'];
                for (const attrKey of attributeKeys) {
                    const attrValue = system.attributes[attrKey]?.value || 0;
                    const maxStones = Math.floor(attrValue / 8);
                    // Initialize pool if missing
                    if (!system.stonePools[attrKey]) {
                        system.stonePools[attrKey] = {
                            current: maxStones,
                            max: maxStones,
                            sustained: 0
                        };
                    }
                    else {
                        // Update max based on attribute
                        system.stonePools[attrKey].max = maxStones;
                        // Calculate effective max (max - sustained)
                        const sustained = system.stonePools[attrKey].sustained ?? 0;
                        const effectiveMax = Math.max(0, maxStones - sustained);
                        // Initialize/refill current if:
                        // - missing/undefined/null -> set to effectiveMax
                        // - is 0 and maxStones > 0 and sustained === 0 -> refill to effectiveMax (character creation or reset case)
                        // - otherwise clamp to valid range
                        const current = system.stonePools[attrKey].current;
                        // Compare against the STORED combatant actorId — touching
                        // `c.actor` here would lazily build synthetic token actors while
                        // THIS actor is itself mid-construction (ActorDelta), recursing
                        // into prepareData until the call stack overflows on scene load.
                        const inActiveCombat = !!game.combat?.active &&
                            game.combat.combatants?.some((c) => c.actorId === this.id);
                        if (current === undefined || current === null) {
                            system.stonePools[attrKey].current = effectiveMax;
                        }
                        else if (current === 0 && maxStones > 0 && sustained === 0 && !inActiveCombat) {
                            // Refill empty pools only out of combat (in combat, 0 means spent — regen is end-of-round)
                            system.stonePools[attrKey].current = effectiveMax;
                        }
                        else {
                            system.stonePools[attrKey].current = Math.max(0, Math.min(current, effectiveMax));
                        }
                    }
                }
            }
            // OLD STONE SYSTEM: Keep for backwards compatibility / migration
            // Calculate total stones
            if (!system.stones) {
                system.stones = {};
            }
            system.stones.total = calculateTotalStones(system.attributes);
            // Calculate vitality stones
            if (system.attributes.vitality) {
                system.stones.vitality = calculateStones(system.attributes.vitality.value);
            }
            // Set maximum stones (total for now, can be extended with bonuses later)
            system.stones.maximum = system.stones.total;
            // Clamp current stones: 0..maximum
            if (system.stones.current === undefined || system.stones.current === null) {
                system.stones.current = system.stones.maximum;
            }
            else {
                system.stones.current = Math.max(0, Math.min(system.stones.current, system.stones.maximum));
            }
            /**
             * Players Guide 7232–7239: Stones → **suggested** MR for GM reference only.
             * Live `system.mastery.rank` is set by the GM on the character sheet
             * (or world default for new actors) — never auto-promoted from Stones.
             */
            if (!system.mastery) {
                system.mastery = { rank: getWorldDefaultMasteryRank(), points: 0, experience: 0 };
            }
            system.mastery.suggestedRank = deriveMasteryRankFromStones(system.stones.total);
            const storedRank = Math.floor(Number(system.mastery.rank) || 0);
            if (!Number.isFinite(storedRank) || storedRank < 1) {
                system.mastery.rank = getWorldDefaultMasteryRank();
            }
            else {
                system.mastery.rank = Math.max(1, Math.min(8, storedRank));
            }
            // New spec — MR 8 Divine Scale (Lesser/True/High/Apex God) for display.
            // `null` when total Stones < 50 (i.e. the actor is below Godlevel).
            system.mastery.divineScale = getDivineScale(system.stones.total);
            // Initialize health bars — 6 levels:
            // Healthy → Bruised → Injured → Wounded → Broken → Incapacitated.
            // Bars 0–4 each hold `Vitality × 2` boxes; the final bar (Incapacitated)
            // is a fixed single box ("you go down at 0").
            if (this.type === 'character') {
                // Normalize player/GM-authored manual adjustments so the rest of
                // prepareBaseData + prepareDerivedData can read `system.manual.*`
                // without null-guarding every field.
                system.manual = normalizeManualAdjustments(system.manual);
                const healthBarBonus = Math.max(-9999, system.manual.health.barMaxBonus || 0);
                const stressBarBonus = Math.max(-9999, system.manual.stress.barMaxBonus || 0);
                const vitality = system.attributes.vitality?.value || 2;
                // Health bar max = Vitality × 2 + manual Health Bonus per bar.
                // A negative bonus is clamped at 1 so HP never collapses to 0.
                const maxHP = Math.max(1, calculateHealthBarMax(vitality) + healthBarBonus);
                if (!system.health) {
                    system.health = {
                        bars: initializeHealthBars(vitality),
                        currentBar: 0,
                        tempHP: 0
                    };
                }
                else {
                    // Ensure bars is an array (migrate from object if needed)
                    if (!Array.isArray(system.health.bars)) {
                        if (system.health.bars && typeof system.health.bars === 'object' && system.health.bars !== null) {
                            const barsObj = system.health.bars;
                            const keys = Object.keys(barsObj);
                            if (keys.length > 0 && keys.some((k) => !isNaN(parseInt(k)))) {
                                system.health.bars = Object.keys(barsObj)
                                    .sort((a, b) => parseInt(a) - parseInt(b))
                                    .map(key => barsObj[key]);
                            }
                            else {
                                system.health.bars = initializeHealthBars(vitality);
                            }
                        }
                        else {
                            system.health.bars = initializeHealthBars(vitality);
                        }
                    }
                    if (!system.health.bars || system.health.bars.length === 0) {
                        system.health.bars = initializeHealthBars(vitality);
                    }
                    else {
                        // Canonical six-level track:
                        //   Healthy → Bruised → Injured → Wounded → Broken → Incapacitated.
                        const allBarNames = ['Healthy', 'Bruised', 'Injured', 'Wounded', 'Broken', 'Incapacitated'];
                        const penalties = [0, -1, -2, -4, -5, -6];
                        // Migrate legacy 4-bar actors (Healthy…Wounded): append Broken +
                        // Incapacitated.
                        if (system.health.bars.length === 4) {
                            system.health.bars.push({ name: 'Broken', max: maxHP, current: maxHP, penalty: -5 });
                            system.health.bars.push({ name: 'Incapacitated', max: 1, current: 1, penalty: -6 });
                        }
                        else if (system.health.bars.length === 5 &&
                            system.health.bars[4]?.name === 'Incapacitated') {
                            // Legacy 5-bar actors (…Wounded → Incapacitated): splice the new
                            // Broken level in before Incapacitated.
                            system.health.bars.splice(4, 0, { name: 'Broken', max: maxHP, current: maxHP, penalty: -5 });
                        }
                        // Trim accidental >6-bar histories.
                        if (system.health.bars.length > 6) {
                            system.health.bars = system.health.bars.slice(0, 6);
                        }
                        // Add missing bars if less than 6.
                        for (let i = system.health.bars.length; i < 6; i++) {
                            const isIncap = i === 5;
                            system.health.bars.push({
                                name: allBarNames[i],
                                max: isIncap ? 1 : maxHP,
                                current: isIncap ? 1 : maxHP,
                                penalty: penalties[i]
                            });
                        }
                        // Refresh names / max HP / penalties. Bars 0–4 scale with Vitality;
                        // bar 5 (Incapacitated) is a fixed single box.
                        for (let i = 0; i < system.health.bars.length && i < 6; i++) {
                            const bar = system.health.bars[i];
                            const isIncap = i === 5 || bar.name === 'Incapacitated';
                            const targetMax = isIncap ? 1 : maxHP;
                            const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                            bar.name = allBarNames[i];
                            bar.max = targetMax;
                            bar.current = Math.min(Math.floor(targetMax * ratio), targetMax);
                            bar.penalty = penalties[i];
                        }
                    }
                    // Update max HP for non-Incapacitated bars based on current Vitality.
                    if (Array.isArray(system.health.bars)) {
                        for (let i = 0; i < system.health.bars.length; i++) {
                            const bar = system.health.bars[i];
                            const isIncap = i === 5 || bar.name === 'Incapacitated';
                            if (isIncap) {
                                bar.max = 1;
                                bar.current = Math.min(bar.current ?? 1, 1);
                                continue;
                            }
                            const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                            bar.max = maxHP;
                            bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
                        }
                    }
                }
                // Enforce the bonus-adjusted max HP on every bar regardless of
                // which init/migration branch ran above. This makes the manual
                // Health bar bonus apply even to freshly-initialized actors. The
                // Incapacitated bar is exempt — it is always a single box.
                if (Array.isArray(system.health?.bars)) {
                    const lastIdx = system.health.bars.length - 1;
                    system.health.bars.forEach((bar, i) => {
                        const isIncap = bar.name === 'Incapacitated' || i === lastIdx;
                        if (isIncap) {
                            bar.max = 1;
                            bar.current = Math.min(bar.current ?? 1, 1);
                            return;
                        }
                        if (bar.max !== maxHP) {
                            const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                            bar.max = maxHP;
                            bar.current = Math.min(Math.floor(maxHP * ratio), maxHP);
                        }
                    });
                }
                // Initialize stress bars (4 bars: Healthy, Stressed, Not Well, Breaking)
                const resolve = system.attributes.resolve?.value || 2;
                const intellect = system.attributes.intellect?.value || 2;
                // Stress bar max = Resolve + Intellect + manual Stress Bonus per bar.
                const maxStress = Math.max(1, calculateStressBarMax(resolve, intellect) + stressBarBonus);
                if (!system.stress) {
                    system.stress = {
                        bars: initializeStressBars(resolve, intellect),
                        currentBar: 0
                    };
                }
                else {
                    // Ensure bars is an array (migrate from object if needed)
                    if (!Array.isArray(system.stress.bars)) {
                        // Convert object to array if needed
                        if (system.stress.bars && typeof system.stress.bars === 'object' && system.stress.bars !== null) {
                            const barsObj = system.stress.bars;
                            // Check if it's an object with numeric keys (old format)
                            const keys = Object.keys(barsObj);
                            if (keys.length > 0 && keys.some((k) => !isNaN(parseInt(k)))) {
                                system.stress.bars = Object.keys(barsObj)
                                    .sort((a, b) => parseInt(a) - parseInt(b))
                                    .map(key => barsObj[key]);
                            }
                            else {
                                // Not a valid object format, initialize fresh
                                system.stress.bars = initializeStressBars(resolve, intellect);
                            }
                        }
                        else {
                            system.stress.bars = initializeStressBars(resolve, intellect);
                        }
                    }
                    // Migrate old stress format to bars if needed
                    if (!system.stress.bars || system.stress.bars.length === 0) {
                        const oldCurrent = system.stress.current || 0;
                        system.stress.bars = initializeStressBars(resolve, intellect);
                        system.stress.currentBar = 0;
                        // Distribute old stress value across bars
                        if (oldCurrent > 0) {
                            let remaining = oldCurrent;
                            for (let i = 0; i < system.stress.bars.length && remaining > 0; i++) {
                                if (remaining >= system.stress.bars[i].max) {
                                    system.stress.bars[i].current = 0;
                                    remaining -= system.stress.bars[i].max;
                                    system.stress.currentBar = i + 1;
                                }
                                else {
                                    system.stress.bars[i].current = system.stress.bars[i].max - remaining;
                                    remaining = 0;
                                }
                            }
                        }
                    }
                    else if (system.stress.bars.length < 4) {
                        // Add missing bars (4 bars total)
                        const allBarNames = ['Healthy', 'Stressed', 'Not Well', 'Breaking'];
                        for (let i = system.stress.bars.length; i < 4; i++) {
                            system.stress.bars.push({
                                name: allBarNames[i],
                                max: maxStress,
                                current: maxStress,
                                penalty: 0
                            });
                        }
                    }
                    else if (system.stress.bars.length > 4) {
                        // Remove extra bars (keep only first 4)
                        system.stress.bars = system.stress.bars.slice(0, 4);
                        if (system.stress.currentBar >= 4) {
                            system.stress.currentBar = 3;
                        }
                    }
                    // Update max stress for all bars
                    for (const bar of system.stress.bars) {
                        const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                        bar.max = maxStress;
                        bar.current = Math.min(Math.floor(maxStress * ratio), maxStress);
                    }
                    // Ensure currentBar exists
                    if (system.stress.currentBar === undefined || system.stress.currentBar === null) {
                        system.stress.currentBar = 0;
                    }
                }
                // Enforce the bonus-adjusted max Stress on every bar regardless of
                // which init/migration branch ran above.
                if (Array.isArray(system.stress?.bars)) {
                    for (const bar of system.stress.bars) {
                        if (bar.max !== maxStress) {
                            const ratio = bar.max > 0 ? bar.current / bar.max : 1;
                            bar.max = maxStress;
                            bar.current = Math.min(Math.floor(maxStress * ratio), maxStress);
                        }
                    }
                }
            }
        }
        // NPCs: keep a single editable HP bar (root + each boss phase). Sheet
        // submits that omit bars used to wipe phase.health — repair here so the
        // sheet and damage pipeline always see current/max fields.
        if (this.type === 'npc') {
            system.health = ensureNpcHealthState(system.health);
            const phases = coerceNpcPhasesArray(system.phases);
            if (phases.length > 0) {
                const repaired = phases.map((phase) => {
                    if (!phase || typeof phase !== 'object')
                        return phase;
                    return {
                        ...phase,
                        health: ensureNpcHealthState(phase.health ?? system.health),
                    };
                });
                if (Array.isArray(system.phases)) {
                    system.phases = repaired;
                }
                else if (system.phases && typeof system.phases === 'object') {
                    for (let i = 0; i < repaired.length; i++) {
                        system.phases[String(i)] = repaired[i];
                    }
                }
            }
        }
    }
    /**
     * Prepare derived equipment data (armorTotal, evadeTotal, etc.)
     */
    prepareDerivedData() {
        super.prepareDerivedData();
        const system = this.system;
        const items = this.items || [];
        // Ensure combat object exists
        if (!system.combat) {
            system.combat = {};
        }
        // Find equipped items
        let equippedWeapon = null;
        let equippedArmor = null;
        let equippedShield = null;
        for (const item of items) {
            const itemSystem = item.system || {};
            if (itemSystem.equipped === true) {
                if (item.type === 'weapon' && !equippedWeapon) {
                    equippedWeapon = item;
                }
                else if (item.type === 'armor' && !equippedArmor) {
                    equippedArmor = item;
                }
                else if (item.type === 'shield' && !equippedShield) {
                    equippedShield = item;
                }
            }
        }
        // Set derived equipment names and IDs
        system.combat.activeWeaponName = equippedWeapon?.name || 'Unarmed';
        system.combat.activeWeaponId = equippedWeapon?.id || null;
        system.combat.armorName = equippedArmor?.name || null;
        system.combat.armorId = equippedArmor?.id || null;
        system.combat.shieldName = equippedShield?.name || null;
        system.combat.shieldId = equippedShield?.id || null;
        const masteryRank = system.mastery?.rank || 2;
        const actorType = this.type;
        if (actorType === 'npc' || actorType === 'summon') {
            // NPC / Summon defenses come from the editable stat block (Armor / Evade
            // fields on the sheet — per-phase for phased bosses), NOT from
            // MR + equipment items. Derived here on every data-prep so mid-combat
            // edits and phase switches reach the hit/damage pipeline immediately.
            const phases = Array.isArray(system.phases) ? system.phases : [];
            const phaseIndex = phases.length > 0
                ? Math.max(0, Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)))
                : null;
            const block = (phaseIndex != null ? phases[phaseIndex]?.combat : system.combat) ?? {};
            const blockArmor = Math.max(0, Number(block.armor) || 0);
            const blockEvade = Math.max(0, Number(block.evade) || 0);
            system.combat.armorTotal = blockArmor;
            system.combat.evadeTotal = blockEvade;
            if (phaseIndex != null) {
                if (block.speed != null) {
                    system.combat.speed = Number(block.speed) || system.combat.speed;
                }
                if (block.initiative != null && block.initiative !== '') {
                    const ini = Math.floor(Number(block.initiative));
                    if (Number.isFinite(ini)) {
                        system.combat.initiative = Math.max(-10, Math.min(10, ini));
                    }
                }
            }
            const detail = phaseIndex != null ? `Stat block · Phase ${phaseIndex + 1}` : 'Stat block';
            system.combat.armorBreakdownRows = [
                { label: 'Armor', detail, value: blockArmor, display: String(blockArmor) },
            ];
            system.combat.evadeBreakdownRows = [
                { label: 'Evade', detail, value: blockEvade, display: String(blockEvade) },
            ];
            system.combat.evadeBreakdownHint = `${detail}: ${blockEvade}`;
            // NPC ATK slots = sum of Angriffe/Runde copies on the active attack list.
            if (actorType === 'npc') {
                system.attackSlots = sumNpcAttackSlotsFromPowers(system);
            }
        }
        else {
            // Character: armorTotal = Mastery Rank + Armor Value + Shield Value
            const armorValue = equippedArmor?.system?.armorValue || 0;
            const shieldValue = equippedShield?.system?.shieldValue || 0;
            system.combat.armorTotal = masteryRank + armorValue + shieldValue;
            // evadeTotal = MR×4 + shield evadeBonus + armor evadeModifier
            const baseEvade = calculateBaseEvade(masteryRank);
            const shieldEvadeBonus = equippedShield?.system?.evadeBonus || 0;
            const armorEvadeModifier = equippedArmor?.system?.evadeModifier || 0;
            system.combat.evadeTotal = baseEvade + shieldEvadeBonus + armorEvadeModifier;
            const fmtEvadeContrib = (n) => {
                if (n === 0)
                    return '0';
                return n > 0 ? `+${n}` : `${n}`;
            };
            system.combat.evadeBreakdownRows = [
                {
                    label: 'MR×4 base',
                    detail: `Mastery Rank ${masteryRank}`,
                    value: baseEvade,
                    display: String(baseEvade)
                },
                {
                    label: 'Shield',
                    detail: equippedShield?.name ?? 'Not equipped',
                    value: shieldEvadeBonus,
                    display: equippedShield ? fmtEvadeContrib(shieldEvadeBonus) : '—'
                },
                {
                    label: 'Armor',
                    detail: equippedArmor?.name ?? 'Not equipped',
                    value: armorEvadeModifier,
                    display: equippedArmor ? fmtEvadeContrib(armorEvadeModifier) : '—'
                }
            ];
            system.combat.evadeBreakdownHint = system.combat.evadeBreakdownRows
                .map((r) => `${r.label} ${r.display}`)
                .join(' · ');
            system.combat.armorBreakdownRows = [
                {
                    label: 'Mastery Rank',
                    detail: 'Always in soak total',
                    value: masteryRank,
                    display: String(masteryRank)
                },
                {
                    label: 'Armor',
                    detail: equippedArmor?.name ?? 'Not equipped',
                    value: equippedArmor != null ? armorValue : null,
                    display: equippedArmor != null ? String(armorValue) : '—'
                },
                {
                    label: 'Shield',
                    detail: equippedShield?.name ?? 'Not equipped',
                    value: equippedShield != null ? shieldValue : null,
                    display: equippedShield != null ? String(shieldValue) : '—'
                }
            ];
        }
        const iniEq = getEquippedEquipmentInitiativeModifier(this);
        system.combat.initiativeEquipmentRows = getInitiativeEquipmentRows(this);
        system.combat.initiativeEquipmentTotal = iniEq;
        system.combat.initiativeEquipmentTotalDisplay =
            iniEq === 0 ? '0' : iniEq > 0 ? `+${iniEq}` : String(iniEq);
        system.combat.initiativeMasteryRank = masteryRank;
        // Power Mechanics Engine — Aggregator
        // Armor/evade base totals are equipment-only; active buff bonuses apply at
        // hit resolution. Other mechanics (DR %, initiative d8, roll dice) unchanged.
        const mechBreakdown = buildActorMechanicsBreakdown(this);
        const buffMechBreakdown = buildBuffMechanicsBreakdown(this);
        if (!system.derived)
            system.derived = {};
        system.derived.mechanicsBreakdown = mechBreakdown;
        system.derived.buffMechanicsBreakdown = buffMechBreakdown;
        const iniD8MechBonus = mechBreakdown.totals.initiativeD8;
        const iniFlatMechBonus = mechBreakdown.totals.initiative;
        system.combat.armorFromMechanics = 0;
        system.combat.evadeFromMechanics = 0;
        system.combat.armorFromActiveBuffs = buffMechBreakdown.totals.armor;
        system.combat.evadeFromActiveBuffs = buffMechBreakdown.totals.evade;
        system.combat.spellResistanceTotal = mechBreakdown.totals.spellResistance;
        system.combat.spellResistanceFromActiveBuffs = buffMechBreakdown.totals.spellResistance;
        system.combat.initiativeD8FromMechanics = iniD8MechBonus;
        system.combat.initiativeFromMechanics = iniFlatMechBonus;
        // Damage Reduction % (passive + buff in aggregateMechanics; reaction rows
        // are per-hit only). Sheet rows mirror aggregated contributions.
        system.combat.damageReductionPct = mechBreakdown.totals.damageReductionPct;
        const drRows = [];
        const fmtPct = (n) => (n > 0 ? `+${n}%` : `${n}%`);
        for (const r of mechBreakdown.damageReductionPct.passive) {
            drRows.push({ label: r.source, detail: 'Passive DR', value: r.value, display: fmtPct(r.value) });
        }
        for (const r of mechBreakdown.damageReductionPct.buff) {
            drRows.push({ label: r.source, detail: 'Active buff DR', value: r.value, display: fmtPct(r.value) });
        }
        for (const r of mechBreakdown.damageReductionPct.reaction) {
            drRows.push({ label: r.source, detail: 'DR Reaction (per-hit)', value: r.value, display: fmtPct(r.value) });
        }
        system.combat.damageReductionRows = drRows;
        if (iniD8MechBonus !== 0) {
            const fmt = (n) => (n > 0 ? `+${n}` : String(n));
            for (const entry of mechBreakdown.initiativeD8) {
                system.combat.initiativeEquipmentRows.push({
                    label: entry.source,
                    detail: 'Power Mechanics (d8)',
                    value: entry.value,
                    display: fmt(entry.value),
                });
            }
            system.combat.initiativeEquipmentTotal =
                (system.combat.initiativeEquipmentTotal || 0) + iniD8MechBonus;
            system.combat.initiativeEquipmentTotalDisplay =
                system.combat.initiativeEquipmentTotal === 0
                    ? '0'
                    : system.combat.initiativeEquipmentTotal > 0
                        ? `+${system.combat.initiativeEquipmentTotal}`
                        : String(system.combat.initiativeEquipmentTotal);
        }
        if (iniFlatMechBonus !== 0) {
            const fmt = (n) => (n > 0 ? `+${n}` : String(n));
            for (const entry of mechBreakdown.initiative) {
                system.combat.initiativeEquipmentRows.push({
                    label: entry.source,
                    detail: 'Power Mechanics (Initiative)',
                    value: entry.value,
                    display: fmt(entry.value),
                });
            }
            system.combat.initiativeEquipmentTotal =
                (system.combat.initiativeEquipmentTotal || 0) + iniFlatMechBonus;
            system.combat.initiativeEquipmentTotalDisplay =
                system.combat.initiativeEquipmentTotal === 0
                    ? '0'
                    : system.combat.initiativeEquipmentTotal > 0
                        ? `+${system.combat.initiativeEquipmentTotal}`
                        : String(system.combat.initiativeEquipmentTotal);
        }
        // Manual Adjustments — player/GM-authored flat bonuses applied on top of
        // attribute + equipment + power-mechanics totals. Surfaces as explicit
        // "Manual Bonus" rows so the source of the change stays visible.
        if (this.type === 'character') {
            const manual = normalizeManualAdjustments(system.manual);
            system.manual = manual;
            const fmtSigned = (n) => (n > 0 ? `+${n}` : String(n));
            if (manual.combat.armor !== 0) {
                system.combat.armorTotal = (system.combat.armorTotal || 0) + manual.combat.armor;
                system.combat.armorBreakdownRows.push({
                    label: 'Manual Bonus',
                    detail: 'Character-sheet adjustment',
                    value: manual.combat.armor,
                    display: fmtSigned(manual.combat.armor),
                });
            }
            if (manual.combat.evade !== 0) {
                system.combat.evadeTotal = (system.combat.evadeTotal || 0) + manual.combat.evade;
                system.combat.evadeBreakdownRows.push({
                    label: 'Manual Bonus',
                    detail: 'Character-sheet adjustment',
                    value: manual.combat.evade,
                    display: fmtSigned(manual.combat.evade),
                });
            }
            if (manual.combat.damageReductionPct !== 0) {
                const current = Number(system.combat.damageReductionPct) || 0;
                system.combat.damageReductionPct = Math.max(0, Math.min(100, current + manual.combat.damageReductionPct));
                system.combat.damageReductionRows.push({
                    label: 'Manual Bonus',
                    detail: 'Character-sheet adjustment',
                    value: manual.combat.damageReductionPct,
                    display: manual.combat.damageReductionPct > 0
                        ? `+${manual.combat.damageReductionPct}%`
                        : `${manual.combat.damageReductionPct}%`,
                });
            }
            if (manual.combat.initiative !== 0) {
                system.combat.initiativeEquipmentRows.push({
                    label: 'Manual Bonus',
                    detail: 'Character-sheet adjustment',
                    value: manual.combat.initiative,
                    display: fmtSigned(manual.combat.initiative),
                });
                system.combat.initiativeEquipmentTotal =
                    (system.combat.initiativeEquipmentTotal || 0) + manual.combat.initiative;
                system.combat.initiativeEquipmentTotalDisplay =
                    system.combat.initiativeEquipmentTotal === 0
                        ? '0'
                        : system.combat.initiativeEquipmentTotal > 0
                            ? `+${system.combat.initiativeEquipmentTotal}`
                            : String(system.combat.initiativeEquipmentTotal);
            }
        }
        // Artifact Base Values (Artefacts.md spec) — equipped artifacts
        // contribute armor / evade / minor armor / head armor / movement
        // numbers from their `system.baseValues` rows. Echo-bound artifacts
        // always contribute; other artifacts only contribute when equipped.
        const artifactBv = buildArtifactBaseValueBreakdown(this);
        if (!system.derived)
            system.derived = {};
        system.derived.artifactBaseValues = artifactBv;
        const fmtArtifact = (n) => (n > 0 ? `+${n}` : String(n));
        system.combat.artifactMovementBonus = artifactBv.movementBonus;
        system.combat.headArmor = artifactBv.headArmor;
        system.combat.minorArmor = artifactBv.minorArmor;
        system.combat.spellFocusBonusDice = artifactBv.spellFocusBonusDice;
        if (artifactBv.armorBonus !== 0 || artifactBv.minorArmor !== 0 || artifactBv.headArmor !== 0) {
            const totalArtifactArmor = artifactBv.armorBonus + artifactBv.minorArmor + artifactBv.headArmor;
            system.combat.armorTotal = (system.combat.armorTotal || 0) + totalArtifactArmor;
            for (const row of artifactBv.rows.armor) {
                const detail = row.typeLabel
                    ? `${row.typeLabel} · base ${row.baseArmor} + bonus ${row.bonusArmor}`
                    : `Artifact · ${row.label ?? row.type}`;
                system.combat.armorBreakdownRows.push({
                    label: row.source,
                    detail,
                    value: row.value,
                    display: fmtArtifact(row.value),
                });
            }
            for (const row of artifactBv.rows.headArmor) {
                system.combat.armorBreakdownRows.push({
                    label: row.source,
                    detail: `Head Armor · ${row.label ?? row.type}`,
                    value: row.value,
                    display: fmtArtifact(row.value),
                });
            }
            for (const row of artifactBv.rows.minorArmor) {
                system.combat.armorBreakdownRows.push({
                    label: row.source,
                    detail: `Minor Armor · ${row.label ?? row.type}`,
                    value: row.value,
                    display: fmtArtifact(row.value),
                });
            }
        }
        if (artifactBv.evadeBonus !== 0) {
            system.combat.evadeTotal = (system.combat.evadeTotal || 0) + artifactBv.evadeBonus;
            for (const row of artifactBv.rows.evade) {
                system.combat.evadeBreakdownRows.push({
                    label: row.source,
                    detail: `Artifact · ${row.label ?? row.type}`,
                    value: row.value,
                    display: fmtArtifact(row.value),
                });
            }
        }
        const armorClassPenalty = artifactBv.bodyArmorClassPenalty;
        const armorClassInfo = artifactBv.bodyArmorClassInfo;
        if (armorClassInfo) {
            system.combat.artifactBodyArmorClass = armorClassInfo.weightClass;
            system.combat.artifactBodyArmorTypeLabel = armorClassInfo.typeLabel;
        }
        if (armorClassPenalty) {
            if (armorClassPenalty.evade !== 0) {
                system.combat.evadeTotal = (system.combat.evadeTotal || 0) + armorClassPenalty.evade;
                system.combat.evadeBreakdownRows.push({
                    label: armorClassPenalty.typeLabel,
                    detail: `${armorClassPenalty.source} · armor class drawback`,
                    value: armorClassPenalty.evade,
                    display: armorClassPenalty.evade > 0 ? `+${armorClassPenalty.evade}` : String(armorClassPenalty.evade),
                });
            }
            if (armorClassPenalty.initiative !== 0) {
                system.combat.initiativeEquipmentRows.push({
                    label: armorClassPenalty.typeLabel,
                    detail: `${armorClassPenalty.source} · armor class drawback`,
                    value: armorClassPenalty.initiative,
                    display: armorClassPenalty.initiative > 0
                        ? `+${armorClassPenalty.initiative}`
                        : String(armorClassPenalty.initiative),
                });
            }
        }
        const physPenDice = getEquippedPhysicalSkillPenaltyDice(this);
        system.combat.physicalSkillPenaltyDice = physPenDice;
        system.combat.physicalSkillPenaltyDisplay =
            physPenDice > 0 ? `−${physPenDice}d8 Physical Skill checks` : '';
        // Artifact Stone Functions — derive per-attribute bonuses to the
        // actor's stone pool (Stone Pool), per-round refresh (Stone Refresh)
        // and battery capacity (Stone Battery). Surface them under
        // `system.stones.fromArtifacts` so the sheet / radial menu can show
        // them without re-walking artifact items.
        try {
            const stoneFnStatus = getArtifactStoneFunctionStatus(this);
            if (!system.stones)
                system.stones = {};
            system.stones.fromArtifacts = {
                pool: stoneFnStatus.pool,
                refresh: stoneFnStatus.refresh,
                battery: stoneFnStatus.battery,
                supports: stoneFnStatus.supports.map((s) => ({
                    source: s.source,
                    attribute: s.attribute,
                    tier: s.value,
                    powerId: s.stonePowerId,
                })),
            };
            // Add Stone Pool extras to the actor's stones.maximum so the player
            // can spend them (currently treated as bonus capacity, no separate
            // tracking — Pool slots are stored on the artifact in the spec but
            // are surfaced here as additional usable pool to keep the existing
            // single-pool UI workable).
            const totalPoolExtra = Object.values(stoneFnStatus.pool).reduce((a, b) => a + (Number(b) || 0), 0);
            if (totalPoolExtra > 0) {
                const baseMax = Number(system.stones.maximum) || 0;
                system.stones.maximum = baseMax + totalPoolExtra;
                const cur = Number(system.stones.current) || 0;
            }
        }
        catch (err) {
            console.warn('Mastery System | could not aggregate artifact stone functions', err);
        }
        // Stone Powers — agility (+8 Evade per activation) and similar effects
        // store a round-scoped `stoneBonuses.evadeBonus` on the action-economy
        // round state. Surface it on Evade Total + breakdown so the sheet /
        // carousel match what applies during combat.
        let stoneEvadeBonus = 0;
        try {
            const g = globalThis;
            const combat = g.game?.combat ?? null;
            stoneEvadeBonus = Math.max(0, Math.floor(Number(getRoundState(this, combat)?.stoneBonuses?.evadeBonus ?? 0) || 0));
        }
        catch {
            stoneEvadeBonus = 0;
        }
        system.combat.stoneEvadeBonus = stoneEvadeBonus;
        if (stoneEvadeBonus > 0) {
            system.combat.evadeTotal = (system.combat.evadeTotal || 0) + stoneEvadeBonus;
            system.combat.evadeBreakdownRows.push({
                label: 'Stone Powers',
                detail: '+8 Evade per paid wave — clears when your turn ends in the tracker',
                value: stoneEvadeBonus,
                display: `+${stoneEvadeBonus}`,
            });
        }
        // Stone Powers — Might "Armor" (+4/8/16/32 flat Armor) and Resolve
        // "Damage Reduction Boost" (+% DR) store round-scoped bonuses on the
        // action-economy round state. Surface them on Armor Total / DR % (and the
        // breakdowns) so the sheet, carousel AND the damage pipeline agree with
        // what actually applies during the round.
        let stoneArmorBonus = 0;
        let stoneDrBonusPct = 0;
        try {
            const g = globalThis;
            const combat = g.game?.combat ?? null;
            const sb = getRoundState(this, combat)?.stoneBonuses;
            stoneArmorBonus = Math.max(0, Math.floor(Number(sb?.tempArmor ?? 0) || 0));
            stoneDrBonusPct = Math.max(0, Math.floor(Number(sb?.damageReductionBoostPct ?? 0) || 0));
        }
        catch {
            stoneArmorBonus = 0;
            stoneDrBonusPct = 0;
        }
        system.combat.stoneArmorBonus = stoneArmorBonus;
        system.combat.stoneDrBonusPct = stoneDrBonusPct;
        if (stoneArmorBonus > 0) {
            system.combat.armorTotal = (system.combat.armorTotal || 0) + stoneArmorBonus;
            system.combat.armorBreakdownRows.push({
                label: 'Stone Powers',
                detail: 'Temp Armor — clears when your turn ends in the tracker',
                value: stoneArmorBonus,
                display: `+${stoneArmorBonus}`,
            });
        }
        if (stoneDrBonusPct > 0) {
            const curDr = Number(system.combat.damageReductionPct) || 0;
            system.combat.damageReductionPct = Math.max(0, Math.min(100, curDr + stoneDrBonusPct));
            system.combat.damageReductionRows.push({
                label: 'Stone Powers',
                detail: 'DR Boost — clears when your turn ends in the tracker',
                value: stoneDrBonusPct,
                display: `+${stoneDrBonusPct}%`,
            });
        }
        // Attribute Scaling Passives
        if (system.attributes) {
            const might = system.attributes.might?.value || 0;
            const agility = system.attributes.agility?.value || 0;
            const intellect = system.attributes.intellect?.value || 0;
            const resolve = system.attributes.resolve?.value || 0;
            const influence = system.attributes.influence?.value || 0;
            const wits = system.attributes.wits?.value || 0;
            if (!system.scaling)
                system.scaling = {};
            system.scaling.mightDamageBonus = calculateMightDamageBonus(might);
            system.scaling.agilityEvadeBonus = calculateAgilityEvadeBonus(agility);
            system.scaling.agilityRangeBonus = calculateAgilityRangeBonus(agility);
            system.scaling.intellectSaveTNBonus = calculateIntellectSaveTNBonus(intellect);
            system.scaling.resolveStressArmor = calculateResolveStressArmor(resolve);
            system.scaling.influenceSkillBonus = calculateInfluenceSkillBonus(influence);
            system.scaling.witsInitiativeBonus = calculateWitsInitiativeBonus(wits);
            system.scaling.armorBreaker = calculateArmorBreaker(might);
            system.scaling.baseEvade = calculateBaseEvade(masteryRank);
        }
        // Diminishing Special-Effect maluses: Corrode −Armor, Expose −Evade,
        // Slow −Speed. Applied last so they subtract from the fully-computed totals.
        try {
            const corrode = getActiveSpecialValue(this, 'corrode');
            const expose = getActiveSpecialValue(this, 'expose');
            const slow = getActiveSpecialValue(this, 'slow');
            if (corrode > 0) {
                system.combat.armorTotal = Math.max(0, (system.combat.armorTotal || 0) - corrode);
                system.combat.armorBreakdownRows?.push({
                    label: 'Corrode', detail: 'Special Effect', value: -corrode, display: `-${corrode}`,
                });
            }
            if (expose > 0) {
                system.combat.evadeTotal = Math.max(0, (system.combat.evadeTotal || 0) - expose);
                system.combat.evadeBreakdownRows?.push({
                    label: 'Expose', detail: 'Special Effect', value: -expose, display: `-${expose}`,
                });
            }
            if (slow > 0) {
                system.combat.speed = Math.max(0, Number(system.combat.speed ?? 8) - slow);
            }
        }
        catch (err) {
            console.debug?.('Mastery System | special-effect malus skipped', err);
        }
        // Prepare tracked resources for Combat Carousel module
        // These are derived fields that update automatically when actor data changes
        system.tracked = system.tracked ?? {};
        // HP: current health bar (for Carousel)
        const bars = system.health?.bars ?? [];
        const idx = Math.max(0, Math.min(Number(system.health?.currentBar ?? 0), bars.length - 1));
        const bar = bars[idx] ?? { current: 0, max: 0 };
        // Include tempHP in value ONLY (not in max)
        const tempHP = Number(system.health?.tempHP ?? 0);
        system.tracked.hp = {
            value: Math.max(0, Number(bar.current ?? 0) + tempHP),
            max: Math.max(0, Number(bar.max ?? 0))
        };
        // Stress: current stress bar (for Carousel)
        const stressBars = system.stress?.bars ?? [];
        const stressIdx = Math.max(0, Math.min(Number(system.stress?.currentBar ?? 0), stressBars.length - 1));
        const stressBar = stressBars[stressIdx] ?? { current: 0, max: 0 };
        system.tracked.stress = {
            value: Math.max(0, Number(stressBar.current ?? 0)),
            max: Math.max(0, Number(stressBar.max ?? 0))
        };
        // Stones: current/maximum stones
        system.tracked.stones = {
            value: Math.max(0, Number(system.stones?.current ?? 0)),
            max: Math.max(0, Number(system.stones?.maximum ?? 0))
        };
    }
    /**
     * Heal the actor
     */
    async heal(amount) {
        const system = this.system;
        if (system.health && system.health.bars && Array.isArray(system.health.bars)) {
            const currentBar = system.health.bars[system.health.currentBar || 0];
            if (currentBar) {
                currentBar.current = Math.min(currentBar.current + amount, currentBar.max);
                await this.update({ 'system.health': system.health });
            }
        }
    }
    /**
     * Apply damage to the actor
     */
    async applyDamage(amount) {
        const system = this.system;
        if (system.health && system.health.bars && Array.isArray(system.health.bars)) {
            const currentBar = system.health.bars[system.health.currentBar || 0];
            if (currentBar) {
                currentBar.current = Math.max(currentBar.current - amount, 0);
                await this.update({ 'system.health': system.health });
            }
        }
    }
}
//# sourceMappingURL=actor.js.map