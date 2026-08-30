/**
 * Artifact body armor weight classes (Light / Medium / Heavy).
 *
 * Artifact `bodyArmor` base values store the **Artifact Armor Bonus** only;
 * the mundane base (4 / 8 / 12) and class drawbacks come from the selected
 * weight class. Legacy items without `armorWeightClass` infer the class from
 * their label and treat `value` as the full echo total.
 */
import { getArmorDefinitionForType } from './equipment.js';
import { getArtifactBindingKind } from './artifact-actor-rules.js';
const WEIGHT_RANK = {
    light: 0,
    medium: 1,
    heavy: 2,
};
function parseSkillPenaltyDice(text) {
    if (!text || text === '—')
        return 0;
    let sum = 0;
    const re = /[−\-]\s*(\d+)\s*d8/gi;
    let m;
    while ((m = re.exec(String(text))) !== null) {
        sum += parseInt(m[1], 10) || 0;
    }
    return sum;
}
function numericValueOf(bv) {
    if (typeof bv.value === 'number' && Number.isFinite(bv.value))
        return bv.value;
    if (typeof bv.value === 'string') {
        const match = bv.value.trim().match(/-?\d+(\.\d+)?/);
        if (match) {
            const n = Number(match[0]);
            if (Number.isFinite(n))
                return n;
        }
    }
    return 0;
}
function inferWeightClassFromLabel(label) {
    const l = String(label || '').toLowerCase();
    if (l.includes('heavy'))
        return 'heavy';
    if (l.includes('medium'))
        return 'medium';
    if (l.includes('light') || l.includes('hybrid'))
        return 'light';
    return null;
}
function readWeightClass(bv, itemSystem) {
    const raw = bv.armorWeightClass || itemSystem?.artifactArmor?.type;
    const t = String(raw || '').toLowerCase().trim();
    if (t === 'light' || t === 'medium' || t === 'heavy')
        return t;
    return inferWeightClassFromLabel(bv.label || '');
}
/**
 * Resolve one artifact `bodyArmor` base value into total armor + class drawbacks.
 * Returns null when no weight class can be determined (flat legacy bonus).
 */
export function resolveArtifactBodyArmor(bv, itemSystem) {
    if (bv.type !== 'bodyArmor')
        return null;
    const weightClass = readWeightClass(bv, itemSystem);
    if (!weightClass)
        return null;
    const def = getArmorDefinitionForType(weightClass);
    if (!def)
        return null;
    const rawValue = numericValueOf(bv);
    const bonusArmor = bv.armorWeightClass ? rawValue : Math.max(0, rawValue - def.armorValue);
    const skillPenalty = def.skillPenalty === '—' ? '' : def.skillPenalty;
    // Printed per-level drawback overrides (e.g. Wyrm Scales' escalating
    // −2/−4/−6 Evade & Initiative) take precedence over the class defaults.
    const evadeOverride = Number.isFinite(Number(bv.evadeModifier))
        ? Number(bv.evadeModifier)
        : null;
    const initiativeOverride = Number.isFinite(Number(bv.initiativeModifier))
        ? Number(bv.initiativeModifier)
        : null;
    return {
        weightClass,
        typeLabel: def.name,
        baseArmor: def.armorValue,
        bonusArmor,
        totalArmor: def.armorValue + bonusArmor,
        evadeModifier: evadeOverride ?? def.evadeModifier,
        initiativeModifier: initiativeOverride ?? def.initiativeModifier ?? 0,
        skillPenalty,
        skillPenaltyDice: parseSkillPenaltyDice(skillPenalty),
    };
}
function isArtifactEquipped(item) {
    if (!item)
        return false;
    try {
        if (getArtifactBindingKind(item) === 'echo')
            return true;
    }
    catch {
        // ignore
    }
    const sysEq = item.system?.equipped;
    if (sysEq === true)
        return true;
    try {
        const flagSlot = item.getFlag?.('mastery-system', 'equipment')?.slot;
        if (typeof flagSlot === 'string' && flagSlot.length > 0)
            return true;
    }
    catch {
        // ignore
    }
    return false;
}
function collectItems(actor) {
    if (!actor?.items)
        return [];
    const items = actor.items;
    if (Array.isArray(items))
        return items;
    if (items instanceof Map)
        return Array.from(items.values());
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
/**
 * Active body-slot artifact weight-class penalties (equipped / echo-bound).
 * When multiple apply, the heaviest class wins.
 */
export function getEquippedArtifactBodyArmorClassPenalty(actor) {
    let best = null;
    for (const item of collectItems(actor)) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquipped(item))
            continue;
        const sys = item.system || {};
        if (String(sys.slot || '') !== 'body')
            continue;
        const baseValues = Array.isArray(sys.baseValues) ? sys.baseValues : [];
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        for (const bv of baseValues) {
            if (bv.type !== 'bodyArmor')
                continue;
            const unlockLevel = bv.slot === 'b' ? 4 : bv.slot === 'c' ? 7 : 1;
            if (currentLevel < unlockLevel)
                continue;
            const resolved = resolveArtifactBodyArmor(bv, sys);
            if (!resolved)
                continue;
            if (resolved.weightClass === 'light' &&
                resolved.evadeModifier === 0 &&
                resolved.initiativeModifier === 0 &&
                resolved.skillPenaltyDice === 0) {
                continue;
            }
            const rank = WEIGHT_RANK[resolved.weightClass];
            if (best && rank <= best.rank)
                continue;
            best = {
                rank,
                weightClass: resolved.weightClass,
                typeLabel: resolved.typeLabel,
                source: item.name || 'Artifact',
                evade: resolved.evadeModifier,
                initiative: resolved.initiativeModifier,
                skillPenalty: resolved.skillPenalty,
                skillPenaltyDice: resolved.skillPenaltyDice,
            };
        }
    }
    if (!best)
        return null;
    const { rank: _rank, ...penalty } = best;
    return penalty;
}
/** Display label for a resolved body-armor row (sheet / print). */
export function formatArtifactBodyArmorDetail(resolved) {
    return `${resolved.typeLabel} · base ${resolved.baseArmor} + bonus ${resolved.bonusArmor}`;
}
//# sourceMappingURL=artifact-armor-weight.js.map