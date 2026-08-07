/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */
import { ALL_SPECIAL_EFFECTS, getEffectBaseName } from './special-effects.js';
/** Legacy sheet values (capitalized) → display label */
const LEGACY_NPC_SPECIAL_LABEL = {
    Bleed: 'Lacerate',
    Ignite: 'Ruin',
    Freeze: 'Slow',
    Poison: 'Blight',
    Stun: 'Stun',
    Knockdown: 'Knockdown'
};
/** Human-readable name for chat / attack card (catalog id or legacy key). */
export function displayNpcSpecialName(raw) {
    const k = String(raw || '').trim();
    if (!k)
        return '';
    if (LEGACY_NPC_SPECIAL_LABEL[k])
        return LEGACY_NPC_SPECIAL_LABEL[k];
    const low = k.toLowerCase();
    const hit = ALL_SPECIAL_EFFECTS.find((e) => e.id === low);
    if (hit) {
        return getEffectBaseName(hit.name).replace(/\(X\)/gi, '').trim() || hit.id;
    }
    return k;
}
const MAX_D = 99;
function mergeSpecialsFromLegacy(attack) {
    if (Array.isArray(attack.specials) && attack.specials.length > 0) {
        return attack.specials
            .filter((s) => s && (s.special || s.specialValue != null))
            .map((s) => ({ ...s }));
    }
    if (attack.special && String(attack.special).trim()) {
        return [{ special: attack.special, specialValue: attack.specialValue }];
    }
    return [];
}
/** Effective attack row for display / damage (includes merged specials). */
export function normalizeNpcAttackRow(attack) {
    const merged = mergeSpecialsFromLegacy(attack);
    return { ...attack, specials: merged.length ? merged : undefined };
}
export function resolveNpcAttackTargeting(atk) {
    const rangeKind = String(atk?.npcRangeKind || '').toLowerCase();
    const isRanged = rangeKind === 'ranged';
    const metersRaw = Math.floor(Number(atk?.npcRangeMeters));
    const reachM = Number.isFinite(metersRaw) && metersRaw > 0 ? Math.min(8, Math.max(1, metersRaw)) : 2;
    // Long = absolute max selectable range. Short = gifted full-pool band (not a floor).
    const rangedMaxM = Number.isFinite(metersRaw) && metersRaw > 0 ? Math.min(48, Math.max(8, metersRaw)) : 24;
    const minRaw = Math.floor(Number(atk?.npcRangeMinMeters));
    // 0 = derive Short from Long at roll time; default when unset remains 12 m.
    let rangedMinM = 12;
    if (Number.isFinite(minRaw)) {
        if (minRaw <= 0)
            rangedMinM = 0;
        else
            rangedMinM = Math.min(48, Math.max(2, minRaw));
    }
    if (rangedMinM > rangedMaxM)
        rangedMinM = rangedMaxM;
    const aoeRad = Math.max(0, Math.floor(Number(atk?.npcAoeRadiusM) || 0));
    const hasAoe = aoeRad >= 2;
    const burstMeleeAoE = !isRanged && hasAoe;
    const rangedZone = isRanged && hasAoe;
    return {
        isRanged,
        reachM,
        rangedMinM,
        rangedMaxM,
        rangeM: isRanged ? rangedMaxM : reachM,
        hasAoe,
        aoeRad: hasAoe ? aoeRad : 0,
        aoeShape: hasAoe ? 'radius' : 'none',
        burstMeleeAoE,
        rangedZone,
        tags: isRanged ? ['attack', 'npc-attack', 'ranged'] : ['attack', 'npc-attack', 'melee'],
    };
}
/** Apply live sheet targeting onto a radial option (call at click time). */
export function applyNpcAttackTargetingToOption(option, atk) {
    const t = resolveNpcAttackTargeting(atk);
    return {
        ...option,
        range: t.rangeM,
        meleeReachMeters: t.isRanged ? undefined : t.reachM,
        rangeMinMeters: t.isRanged ? t.rangedMinM : undefined,
        rangeMeters: t.rangeM,
        aoeShape: t.aoeShape,
        aoeRadiusMeters: t.hasAoe ? t.aoeRad : undefined,
        burstMeleeAoE: t.burstMeleeAoE,
        burstMeleeRadiusMeters: t.burstMeleeAoE ? t.aoeRad : undefined,
        aoePlacementProfile: t.rangedZone ? 'hostile-zone' : undefined,
        defaultTargetGroup: t.hasAoe ? 'enemy' : undefined,
        allowManualTargetSelection: t.rangedZone ? true : undefined,
        tags: t.tags,
    };
}
/**
 * Normalize one attack row's targeting fields for persistence.
 * Radius &lt; 2 ⇒ no AoE (`npcAoeShape: 'none'`). Shape is always derived.
 */
export function sanitizeNpcAttackTargetingFields(row) {
    if (!row || typeof row !== 'object')
        return row;
    const out = { ...row };
    const isRanged = String(out.npcRangeKind || '').toLowerCase() === 'ranged';
    out.npcRangeKind = isRanged ? 'ranged' : 'melee';
    const metersRaw = Math.floor(Number(out.npcRangeMeters));
    if (isRanged) {
        const maxM = Number.isFinite(metersRaw) && metersRaw >= 8 ? Math.min(48, metersRaw) : 24;
        let minM = Math.floor(Number(out.npcRangeMinMeters));
        // 0 = derive Short from Long; otherwise Short band 2–48, never above Long.
        if (!Number.isFinite(minM) || minM < 0)
            minM = 12;
        if (minM > 0)
            minM = Math.min(48, Math.max(2, minM));
        if (minM > maxM)
            minM = maxM;
        out.npcRangeMeters = maxM;
        out.npcRangeMinMeters = minM;
    }
    else {
        out.npcRangeMeters =
            Number.isFinite(metersRaw) && metersRaw >= 1 && metersRaw <= 8 ? metersRaw : 2;
        out.npcRangeMinMeters = 0;
    }
    const rad = Math.floor(Number(out.npcAoeRadiusM));
    if (Number.isFinite(rad) && rad >= 2) {
        out.npcAoeRadiusM = rad;
        out.npcAoeShape = 'radius';
    }
    else {
        out.npcAoeRadiusM = 0;
        out.npcAoeShape = 'none';
    }
    return out;
}
function sanitizeAttackValuesList(raw) {
    if (raw == null)
        return raw;
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object'
            ? coerceNpcPhasesArray(raw)
            : null;
    if (!list)
        return raw;
    return list.map((row) => row && typeof row === 'object' ? sanitizeNpcAttackTargetingFields(row) : row);
}
/**
 * Sanitize all NPC attack targeting on a `system` blob (sheet submit / updates).
 * Coerces object-shaped `phases` to a real array so combat and sheet share one shape.
 */
export function sanitizeNpcSystemAttackTargeting(system) {
    if (!system || typeof system !== 'object')
        return system;
    const out = { ...system };
    if (out.npcBaseAttack && typeof out.npcBaseAttack === 'object') {
        out.npcBaseAttack = sanitizeNpcAttackTargetingFields(out.npcBaseAttack);
    }
    if (out.attackValues != null) {
        out.attackValues = sanitizeAttackValuesList(out.attackValues);
    }
    const phases = coerceNpcPhasesArray(out.phases);
    if (phases.length > 0 || (out.phases && typeof out.phases === 'object')) {
        out.phases = phases.map((phase) => {
            if (!phase || typeof phase !== 'object')
                return phase;
            const p = { ...phase };
            if (p.npcBaseAttack && typeof p.npcBaseAttack === 'object') {
                p.npcBaseAttack = sanitizeNpcAttackTargetingFields(p.npcBaseAttack);
            }
            if (p.attackValues != null) {
                p.attackValues = sanitizeAttackValuesList(p.attackValues);
            }
            return p;
        });
    }
    return out;
}
/**
 * How many radial copies this power has (sheet dropdown 1–5; default 1).
 * Each copy is one Attack action in the radial menu.
 */
export function npcAttacksPerRoundCap(attack) {
    const n = Math.floor(Number(attack?.npcAttacksPerRound));
    if (!Number.isFinite(n) || n < 1)
        return 1;
    return Math.min(5, n);
}
/** Stable usage key for an NPC attack row (shared by all radial copies). */
export function npcAttackUsageKey(phaseIndex, attackIndex) {
    const phaseKey = phaseIndex == null ? 'root' : String(phaseIndex);
    return `npc-attack-${phaseKey}-${Math.max(0, Math.floor(Number(attackIndex) || 0))}`;
}
/**
 * Sum of Angriffe/Runde across the active attack list (= ATK / attackSlots).
 */
export function sumNpcAttackSlotsFromPowers(system) {
    const { attacks } = resolveNpcAttackList(system);
    if (!attacks.length)
        return Math.max(1, Math.floor(Number(system?.attackSlots) || 1));
    const sum = attacks.reduce((acc, atk) => acc + npcAttacksPerRoundCap(atk), 0);
    return Math.max(1, Math.min(20, sum));
}
function npcBaseAttackRow(raw) {
    if (!raw || typeof raw !== 'object')
        return null;
    const a = raw;
    const ac = Math.floor(Number(a.attackDiceCount) || 0);
    const dc = Math.floor(Number(a.damageDiceCount) || 0);
    const legA = String(a.attackDice || '').trim();
    const legD = String(a.damage || '').trim();
    const has = ac > 0 ||
        dc > 0 ||
        (legA && parseInt(legA, 10) > 0) ||
        (legD && legD.length > 0) ||
        (Array.isArray(a.specials) && a.specials.length > 0) ||
        (a.special && String(a.special).trim());
    if (!has)
        return null;
    return normalizeNpcAttackRow(a);
}
function mergeAttackLists(baseRaw, extras) {
    const out = [];
    const b = npcBaseAttackRow(baseRaw);
    if (b)
        out.push(b);
    const ex = Array.isArray(extras) ? extras.map((x) => normalizeNpcAttackRow(x)) : [];
    out.push(...ex);
    return out;
}
/**
 * Foundry often stores `system.phases` as a plain object `{ "0": {...} }` after
 * dotted-path updates. Combat must treat that the same as an array, otherwise
 * it falls back to root `npcBaseAttack` (stale Melee AoE) while the sheet edits
 * phase rows.
 */
export function coerceNpcPhasesArray(raw) {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === 'object') {
        return Object.keys(raw)
            .filter((k) => /^\d+$/.test(k))
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => raw[k]);
    }
    return [];
}
function attackValuesArray(raw) {
    if (Array.isArray(raw))
        return raw;
    if (raw && typeof raw === 'object') {
        return Object.keys(raw)
            .filter((k) => /^\d+$/.test(k))
            .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
            .map((k) => raw[k]);
    }
    return [];
}
export function resolveNpcAttackList(system) {
    if (!system)
        return { attacks: [], phaseIndex: null };
    const phases = coerceNpcPhasesArray(system.phases);
    if (phases.length > 0) {
        const pi = Math.max(0, Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)));
        const phase = phases[pi];
        const attacks = mergeAttackLists(phase?.npcBaseAttack, attackValuesArray(phase?.attackValues));
        return { attacks, phaseIndex: pi };
    }
    const attacks = mergeAttackLists(system.npcBaseAttack, attackValuesArray(system.attackValues));
    return { attacks, phaseIndex: null };
}
export function getNpcAttackByIndex(system, attackIndex, phaseIndex) {
    if (!system)
        return null;
    const idx = Math.max(0, Math.floor(Number(attackIndex) || 0));
    const phases = coerceNpcPhasesArray(system.phases);
    if (phases.length > 0) {
        const pi = phaseIndex == null || phaseIndex === undefined
            ? Math.max(0, Math.min(phases.length - 1, Math.floor(Number(system.npcActivePhaseIndex) || 0)))
            : Math.max(0, Math.min(phases.length - 1, Math.floor(Number(phaseIndex))));
        const phase = phases[pi];
        const attacks = mergeAttackLists(phase?.npcBaseAttack, attackValuesArray(phase?.attackValues));
        if (idx >= attacks.length)
            return null;
        return attacks[idx] ?? null;
    }
    const attacks = mergeAttackLists(system.npcBaseAttack, attackValuesArray(system.attackValues));
    if (idx >= attacks.length)
        return null;
    return attacks[idx] ?? null;
}
/** Overlay authoritative targeting flags (if present) onto an attack row. */
export function mergeNpcAttackTargetingFlag(atk, actor, usageKey) {
    if (!atk)
        return null;
    const bag = actor?.getFlag?.('mastery-system', 'npcTargeting');
    const flagged = bag && usageKey ? bag[usageKey] : undefined;
    if (!flagged || typeof flagged !== 'object')
        return atk;
    return { ...atk, ...flagged };
}
/** Attack roll pool: explicit count (2–16 typical), else parse legacy attackDice */
export function npcAttackDiceCount(attack) {
    if (!attack)
        return 0;
    const n = Math.floor(Number(attack.attackDiceCount) || 0);
    if (n > 0)
        return Math.min(MAX_D, n);
    const s = String(attack.attackDice || '').trim();
    const p = parseInt(s, 10);
    if (Number.isFinite(p) && p > 0)
        return Math.min(MAX_D, p);
    return 0;
}
/** Damage formula: Nd8 from count (4–16 typical), else legacy damage string */
export function npcDamageDiceFormula(attack) {
    if (!attack)
        return '0';
    const n = Math.floor(Number(attack.damageDiceCount) || 0);
    if (n > 0)
        return `${Math.min(MAX_D, n)}d8`;
    const legacy = String(attack.damage || '').trim();
    return legacy || '0';
}
export function formatNpcSpecialLabel(name, value) {
    const v = value === undefined || value === null || String(value).trim() === '' ? '' : String(value).trim();
    if (!v)
        return name.trim();
    return `${name.trim()} (${v})`;
}
/** All specials on one attack (array or legacy single). */
export function formatNpcAttackSpecialsLine(attack) {
    if (!attack)
        return '';
    return mergeSpecialsFromLegacy(attack)
        .filter((s) => s.special && String(s.special).trim())
        .map((s) => formatNpcSpecialLabel(displayNpcSpecialName(String(s.special)), s.specialValue))
        .join(', ');
}
/** Compact "Name(12)" for status / effect application (no spaces). */
export function npcSpecialEffectString(name, value) {
    const n = String(name || '').trim();
    if (!n)
        return '';
    if (value === undefined || value === null || String(value).trim() === '')
        return n;
    return `${n}(${String(value).trim()})`;
}
//# sourceMappingURL=npc-attack-model.js.map