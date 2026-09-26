/**
 * Persistent Spell zones (DF Core v0.9.9.1).
 * Each zone instance keeps its own Casting result. A later zone from the
 * same caster does not replace an earlier one. Applications compare that
 * zone's stored result to the creature's Final Spell TN at that moment.
 * A resist does not end the zone, roll again, or cause Stress.
 * A zone with no stored center is not a scene-wide scan.
 */
export function parseZoneDurationRounds(note, masteryRank) {
    const text = String(note ?? '').trim();
    if (!text || /instant/i.test(text))
        return null;
    if (/mastery\s*rank/i.test(text))
        return Math.max(1, Math.floor(Number(masteryRank) || 1));
    const match = /(\d+)\s*rounds?/i.exec(text);
    if (!match)
        return null;
    return Math.max(1, parseInt(match[1], 10));
}
export function createPersistentSpellZone(input) {
    const createdRound = Math.max(0, Math.floor(Number(input.createdRound) || 0));
    const sourceMasteryRank = Math.max(1, Math.floor(Number(input.sourceMasteryRank) || 0)) || undefined;
    const durationRounds = parseZoneDurationRounds(input.durationNote, sourceMasteryRank ?? 2);
    return {
        id: String(input.id),
        name: String(input.name || 'Spell Zone'),
        casterId: String(input.casterId || ''),
        spellBaseTn: Math.floor(Number(input.spellBaseTn) || 0),
        castingTotal: Math.floor(Number(input.castingTotal) || 0),
        sourceMasteryRank,
        powerId: input.powerId ?? null,
        templateId: input.templateId ?? null,
        durationNote: input.durationNote ?? null,
        createdRound,
        expiresAfterRound: durationRounds == null ? null : createdRound + durationRounds - 1,
        sceneId: input.sceneId ?? null,
        appliedByRound: input.appliedByRound ? { ...input.appliedByRound } : {},
        centerX: input.centerX ?? null,
        centerY: input.centerY ?? null,
        radiusMeters: Math.max(0, Number(input.radiusMeters) || 0),
    };
}
/** New array. Existing zones keep their own Casting results. */
export function appendSpellZone(zones, zone) {
    const copy = zones.map((entry) => ({ ...entry, appliedByRound: { ...entry.appliedByRound } }));
    if (copy.some((entry) => entry.id === zone.id))
        return copy;
    return [...copy, { ...zone, appliedByRound: { ...zone.appliedByRound } }];
}
export function removeSpellZone(zones, id) {
    return zones
        .filter((zone) => zone.id !== id)
        .map((zone) => ({ ...zone, appliedByRound: { ...zone.appliedByRound } }));
}
export function isPersistentSpellZoneExpired(zone, currentRound) {
    if (zone.expiresAfterRound == null || !Number.isFinite(Number(zone.expiresAfterRound)))
        return false;
    return Math.floor(Number(currentRound) || 0) > Number(zone.expiresAfterRound);
}
export function retainActiveSpellZones(zones, currentRound) {
    return zones
        .filter((zone) => !isPersistentSpellZoneExpired(zone, currentRound))
        .map((zone) => ({ ...zone, appliedByRound: { ...zone.appliedByRound } }));
}
/**
 * Zones this creature has entered. Zones without a stored center are skipped.
 * This does not search the scene for other tokens.
 */
export function spellZonesEntered(zones, args) {
    if (!Number.isFinite(args.x) || !Number.isFinite(args.y))
        return [];
    const hits = [];
    for (const zone of zones) {
        if (zone.centerX == null || zone.centerY == null || (zone.radiusMeters ?? 0) <= 0)
            continue;
        const dist = args.distanceMeters(Number(zone.centerX), Number(zone.centerY));
        if (dist > (zone.radiusMeters ?? 0))
            continue;
        if (zoneAlreadyApplied(zone, args.roundKey, args.creatureId))
            continue;
        const finalTn = Math.floor(zone.spellBaseTn) + Math.floor(Number(args.spellResistance) || 0);
        hits.push({
            zoneId: zone.id,
            castingTotal: zone.castingTotal,
            spellBaseTn: zone.spellBaseTn,
            finalTn,
            outcome: zoneApplicationOutcome(zone.castingTotal, finalTn),
        });
    }
    return hits;
}
export function zoneCreationOutcome(castingTotal, spellBaseTn) {
    const total = Math.floor(Number(castingTotal) || 0);
    const base = Math.floor(Number(spellBaseTn) || 0);
    return total < base ? 'fizzle' : 'create';
}
export function zoneApplicationOutcome(storedCastingTotal, finalSpellTn) {
    return Math.floor(Number(storedCastingTotal) || 0) >= Math.floor(Number(finalSpellTn) || 0)
        ? 'affect'
        : 'resist';
}
export function zoneAlreadyApplied(zone, roundKey, creatureId) {
    return (zone.appliedByRound[roundKey] ?? []).includes(creatureId);
}
export function markZoneApplied(zone, roundKey, creatureId) {
    if (zoneAlreadyApplied(zone, roundKey, creatureId))
        return zone;
    const prev = zone.appliedByRound[roundKey] ?? [];
    return {
        ...zone,
        appliedByRound: { ...zone.appliedByRound, [roundKey]: [...prev, creatureId] },
    };
}
export function readSpellZones(actor) {
    const raw = actor?.flags?.['mastery-system']?.spellZones
        ?? actor?.getFlag?.('mastery-system', 'spellZones');
    return Array.isArray(raw) ? raw.filter((zone) => zone && typeof zone === 'object') : [];
}
/**
 * Replace the caster's zone list. Foundry `setFlag` merges arrays by index
 * and can keep a deleted zone or overwrite an earlier Casting result.
 * Unset, then set the whole list.
 */
export async function writeSpellZones(actor, zones) {
    const copy = zones.map((zone) => ({ ...zone, appliedByRound: { ...(zone.appliedByRound ?? {}) } }));
    if (typeof actor?.unsetFlag === 'function') {
        try {
            await actor.unsetFlag('mastery-system', 'spellZones');
        }
        catch {
            /* The flag may not exist yet. */
        }
    }
    if (typeof actor?.setFlag === 'function') {
        await actor.setFlag('mastery-system', 'spellZones', copy);
        return;
    }
    const flags = (actor.flags = actor.flags || {});
    const ns = (flags['mastery-system'] = flags['mastery-system'] || {});
    ns.spellZones = copy;
}
//# sourceMappingURL=spell-zones.js.map