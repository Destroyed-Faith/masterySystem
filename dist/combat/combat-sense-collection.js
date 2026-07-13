/**
 * Collect Combat Senses granted to an actor and resolve the active Sense Slot.
 */
import { COMBAT_SENSES, parseCombatSenseLabel, SENSE_SLOT_SPECIAL_IDS, } from './combat-senses.js';
import { getArtifactBindingKind } from '../utils/artifact-actor-rules.js';
export const DEFAULT_COMBAT_SENSES = {
    activeSenseId: 'normalCombatAwareness',
    grantedSenseIds: [],
    passiveSenseIds: [],
    hasDarkvision: false,
};
function normalizeSenseId(raw) {
    if (typeof raw !== 'string')
        return null;
    const id = raw.trim();
    return COMBAT_SENSES[id] ? id : parseCombatSenseLabel(raw);
}
function uniqueSenseIds(ids) {
    const out = [];
    for (const id of ids) {
        if (!out.includes(id))
            out.push(id);
    }
    return out;
}
export function normalizeCombatSensesData(raw) {
    const src = (raw && typeof raw === 'object' ? raw : {});
    const active = normalizeSenseId(src.activeSenseId) ??
        (SENSE_SLOT_SPECIAL_IDS.includes(src.activeSenseId)
            ? src.activeSenseId
            : 'normalCombatAwareness');
    const slotId = SENSE_SLOT_SPECIAL_IDS.includes(active) ? active : 'normalCombatAwareness';
    const granted = uniqueSenseIds((Array.isArray(src.grantedSenseIds) ? src.grantedSenseIds : [])
        .map((x) => normalizeSenseId(x))
        .filter((x) => !!x && SENSE_SLOT_SPECIAL_IDS.includes(x)));
    const passive = uniqueSenseIds((Array.isArray(src.passiveSenseIds) ? src.passiveSenseIds : [])
        .map((x) => normalizeSenseId(x))
        .filter((x) => !!x && SENSE_SLOT_SPECIAL_IDS.includes(x)));
    return {
        activeSenseId: slotId,
        grantedSenseIds: granted,
        passiveSenseIds: passive,
        hasDarkvision: !!src.hasDarkvision,
    };
}
function artifactIsEquipped(item) {
    const sys = item?.system ?? {};
    if (sys.equipped === true)
        return true;
    const binding = getArtifactBindingKind(item);
    if (binding === 'echo')
        return true;
    const eq = item?.flags?.['mastery-system']?.equipment;
    return !!(eq && typeof eq === 'object' && eq.slot);
}
function sensesFromArtifactBaseValues(item) {
    const out = [];
    const bvs = Array.isArray(item?.system?.baseValues) ? item.system.baseValues : [];
    for (const bv of bvs) {
        if (bv.type !== 'sense')
            continue;
        const val = String(bv.value ?? bv.label ?? '').trim();
        const id = parseCombatSenseLabel(val) ?? parseCombatSenseLabel(bv.label);
        if (id && SENSE_SLOT_SPECIAL_IDS.includes(id))
            out.push(id);
    }
    return out;
}
/** Scan equipped artifacts / flags for granted special senses. */
export function collectGrantedCombatSenses(actor) {
    const data = normalizeCombatSensesData(actor?.system?.combatSenses);
    const out = [...data.grantedSenseIds];
    try {
        for (const item of actor?.items ?? []) {
            if (item?.type !== 'artifact')
                continue;
            if (!artifactIsEquipped(item))
                continue;
            out.push(...sensesFromArtifactBaseValues(item));
        }
    }
    catch {
        /* ignore */
    }
    const flagRaw = actor?.getFlag?.('mastery-system', 'grantedCombatSenses');
    if (Array.isArray(flagRaw)) {
        for (const entry of flagRaw) {
            const id = normalizeSenseId(entry);
            if (id && SENSE_SLOT_SPECIAL_IDS.includes(id))
                out.push(id);
        }
    }
    return uniqueSenseIds(out);
}
function senseIsAvailableToActor(senseId, granted, data) {
    return (granted.includes(senseId) ||
        data.grantedSenseIds.includes(senseId) ||
        data.passiveSenseIds.includes(senseId));
}
/** All senses the actor may use (for targeting / perception). */
export function listActorCombatSenses(actor) {
    const data = normalizeCombatSensesData(actor?.system?.combatSenses);
    const granted = collectGrantedCombatSenses(actor);
    const out = ['normalCombatAwareness'];
    if (data.hasDarkvision)
        out.push('darkvision');
    if (SENSE_SLOT_SPECIAL_IDS.includes(data.activeSenseId) &&
        senseIsAvailableToActor(data.activeSenseId, granted, data)) {
        out.push(data.activeSenseId);
    }
    for (const id of data.passiveSenseIds) {
        if (SENSE_SLOT_SPECIAL_IDS.includes(id) && senseIsAvailableToActor(id, granted, data)) {
            out.push(id);
        }
    }
    return uniqueSenseIds(out);
}
function formatSenseChannels(id) {
    return COMBAT_SENSES[id].primaryChannels.join(', ');
}
/** Battle sheet + character sheet: full sense list with slot choice emphasis. */
export function buildCombatSensesBattleAreaContext(actor) {
    const panel = buildCombatSensesPanelContext(actor);
    const data = normalizeCombatSensesData(actor?.system?.combatSenses);
    const artifactGranted = collectGrantedCombatSenses(actor);
    const slotIds = new Set(panel.slotOptions.map((o) => o.id));
    const senseRows = [];
    const pushRow = (id, isGranted, fromArtifact) => {
        const def = COMBAT_SENSES[id];
        senseRows.push({
            id,
            label: def.label,
            rangeM: def.rangeM,
            summary: def.summary,
            channels: formatSenseChannels(id),
            isActive: panel.activeSenseId === id,
            isSlotChoice: slotIds.has(id),
            isGranted,
            fromArtifact,
        });
    };
    pushRow('normalCombatAwareness', true, false);
    for (const id of SENSE_SLOT_SPECIAL_IDS) {
        const sheetGranted = data.grantedSenseIds.includes(id);
        const fromArtifact = artifactGranted.includes(id) && !data.grantedSenseIds.includes(id);
        const isGranted = sheetGranted || fromArtifact
            || panel.grantedRows.find((r) => r.id === id)?.selected === true;
        pushRow(id, isGranted, fromArtifact);
    }
    const slotRows = senseRows.filter((r) => r.isSlotChoice);
    return {
        instruction: 'Sense Slot — choose exactly one active Combat Sense for battle.',
        pickOneHint: slotRows.length > 1
            ? 'Mark one sense below as your active Sense Slot choice.'
            : 'Normal Combat Awareness is your default Sense Slot until you grant a special sense.',
        activeSenseId: panel.activeSenseId,
        activeSenseLabel: panel.activeSenseLabel,
        hasDarkvision: panel.hasDarkvision,
        senseRows,
        slotRows,
        grantedRows: panel.grantedRows,
        darkvisionSummary: COMBAT_SENSES.darkvision.summary,
    };
}
/** Character sheet context for Sense Slot + granted sense picks. */
export function buildCombatSensesPanelContext(actor) {
    const data = normalizeCombatSensesData(actor?.system?.combatSenses);
    const artifactGranted = collectGrantedCombatSenses(actor);
    const allGranted = uniqueSenseIds([...data.grantedSenseIds, ...artifactGranted]);
    const slotOptions = [
        { id: 'normalCombatAwareness', label: COMBAT_SENSES.normalCombatAwareness.label },
    ];
    for (const id of SENSE_SLOT_SPECIAL_IDS) {
        if (senseIsAvailableToActor(id, artifactGranted, data)) {
            slotOptions.push({ id, label: COMBAT_SENSES[id].label });
        }
    }
    const grantedRows = SENSE_SLOT_SPECIAL_IDS.map((id) => ({
        id,
        label: COMBAT_SENSES[id].label,
        rangeM: COMBAT_SENSES[id].rangeM,
        selected: allGranted.includes(id),
    }));
    const passiveRows = grantedRows.filter((r) => data.passiveSenseIds.includes(r.id));
    return {
        activeSenseId: getActiveCombatSense(actor),
        hasDarkvision: !!data.hasDarkvision,
        slotOptions,
        grantedRows,
        passiveRows,
        activeSenseLabel: COMBAT_SENSES[getActiveCombatSense(actor)].label,
    };
}
/** Primary active sense for sense-based rules (Sense Slot contents). */
export function getActiveCombatSense(actor) {
    const data = normalizeCombatSensesData(actor?.system?.combatSenses);
    const granted = collectGrantedCombatSenses(actor);
    if (SENSE_SLOT_SPECIAL_IDS.includes(data.activeSenseId) &&
        senseIsAvailableToActor(data.activeSenseId, granted, data)) {
        return data.activeSenseId;
    }
    return 'normalCombatAwareness';
}
export function isNonSightCombatSense(senseId) {
    return senseId !== 'normalCombatAwareness' && senseId !== 'darkvision';
}
//# sourceMappingURL=combat-sense-collection.js.map