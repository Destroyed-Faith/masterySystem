/**
 * What a character's current sheet is worth under today's XP tables.
 *
 * This ignores granted XP, history, and migrations. The free start is not
 * XP: the Attribute package, up to 40 Character Creation Skill Points (max 4
 * per Skill), creation Power ranks, and Artifact level 1. Ranks paid with
 * unspent Skill Points are Skill Points, not XP. Artifact activation costs
 * nothing beyond the level table, and level 1 is free. Echo Artifacts use that
 * same level table: the granted level 1 costs nothing, later levels cost XP.
 */
import { ATTRIBUTE_KEYS, NEW_STARTING_PACKAGE, earnedAttributeXpInvestment, usesV099Stones, } from './v099-rules.js';
import { actorHasPostCreationSnapshot } from '../utils/xp-post-creation.js';
import { attributeBandCost, powerLevelCost, skillBandCost, totalArtifactXpToLevel } from '../utils/constants.js';
import { CREATION_DEFENSIVE_RANK, CREATION_OFFENSIVE_RANK, CREATION_POWER_REQUIREMENTS, resolvePowerCategoryFromItem, } from '../utils/power-catalog.js';
import { readSkillPointPool } from './skill-point-pool.js';
function n(value) {
    const v = Math.floor(Number(value) || 0);
    return v > 0 ? v : 0;
}
function bandSum(from, to, cost) {
    let sum = 0;
    for (let rank = from + 1; rank <= to; rank += 1)
        sum += cost(rank);
    return sum;
}
function listItems(actor, type) {
    const items = actor?.items;
    if (!items)
        return [];
    if (typeof items.filter === 'function')
        return Array.from(items.filter((i) => i.type === type));
    if (Array.isArray(items))
        return items.filter((i) => i.type === type);
    if (Array.isArray(items.contents))
        return items.contents.filter((i) => i.type === type);
    return [];
}
/** Compressed XP above the free 4/4/3/3/2/2/2 package. The highest values keep the highest free ranks. */
export function attributeXpAboveFreePackage(values) {
    const current = ATTRIBUTE_KEYS.map((key) => n(values[key])).sort((a, b) => b - a);
    const free = [...NEW_STARTING_PACKAGE].sort((a, b) => b - a);
    let xp = 0;
    let belowPackage = false;
    for (let i = 0; i < current.length; i += 1) {
        const base = free[i] ?? 2;
        const cur = current[i] ?? 0;
        if (cur < base)
            belowPackage = true;
        else
            xp += bandSum(base, cur, attributeBandCost);
    }
    return { xp, belowPackage };
}
function skillXp(system) {
    const skills = system?.skills && typeof system.skills === 'object' ? system.skills : {};
    const placed = readSkillPointPool(system).placed;
    const cfg = globalThis.CONFIG?.MASTERY?.creation;
    const budget = {
        total: Math.max(1, Math.floor(Number(cfg?.skillPoints) || 40)),
        maxPerSkill: Math.max(1, Math.floor(Number(cfg?.maxSkillAtCreation) || 4)),
    };
    // Always the current ratings. A creation snapshot is not the price:
    // migrated characters still have the same 40 free starting points.
    let remaining = budget.total;
    let xp = 0;
    for (const key of Object.keys(skills).sort()) {
        const current = n(skills[key]);
        const creation = Math.min(budget.maxPerSkill, current, remaining);
        remaining -= creation;
        const from = creation + Math.min(n(placed[key]), Math.max(0, current - creation));
        if (current > from)
            xp += bandSum(from, current, skillBandCost);
    }
    return {
        xp,
        basis: 'creation-cap',
        note: `Skill-Start: ${budget.total} Punkte, höchstens ${budget.maxPerSkill} pro Skill, vom aktuellen Bogen abgezogen.`,
    };
}
function grantedForFree(item) {
    const flags = item?.flags?.['mastery-system'] ?? {};
    if (flags.echoBound || flags.fromArtifact || flags.artifactGranted)
        return true;
    const system = item?.system ?? {};
    return system.echoBound === true || system.fromArtifact === true || system.artifactGranted === true;
}
function powerCostFromOne(level) {
    let sum = 0;
    for (let rank = 1; rank <= level; rank += 1)
        sum += powerLevelCost(rank);
    return sum;
}
function powerXp(actor) {
    const groups = new Map();
    for (const item of listItems(actor, 'power')) {
        if (grantedForFree(item))
            continue;
        const level = Math.max(1, n(item?.system?.level) || 1);
        const category = resolvePowerCategoryFromItem(item) || 'active';
        const list = groups.get(category) ?? [];
        list.push(level);
        groups.set(category, list);
    }
    let xp = 0;
    for (const [category, levels] of groups) {
        const freeCount = CREATION_POWER_REQUIREMENTS[category] ?? 0;
        const freeRank = category === 'active' ? CREATION_OFFENSIVE_RANK : CREATION_DEFENSIVE_RANK;
        const sorted = [...levels].sort((a, b) => b - a);
        sorted.forEach((level, index) => {
            const full = powerCostFromOne(level);
            const free = index < freeCount ? powerCostFromOne(Math.min(level, freeRank)) : 0;
            xp += Math.max(0, full - free);
        });
    }
    return xp;
}
function artifactXp(actor) {
    const lines = [];
    let xp = 0;
    for (const item of listItems(actor, 'artifact')) {
        const level = Math.max(1, n(item?.system?.level) || 1);
        const cost = totalArtifactXpToLevel(level);
        xp += cost;
        if (cost > 0)
            lines.push(`${item?.name || 'Artifact'} L${level}: ${cost}`);
    }
    return { xp, lines };
}
export function appraiseBuild(actor) {
    const system = actor?.system ?? {};
    const attributes = {};
    for (const key of ATTRIBUTE_KEYS)
        attributes[key] = n(system.attributes?.[key]?.value ?? system.attributes?.[key]);
    const migrated = usesV099Stones(system);
    const attr = migrated
        ? attributeXpAboveFreePackage(attributes)
        : { xp: earnedAttributeXpInvestment(attributes, null).xp, belowPackage: false };
    const listed = ATTRIBUTE_KEYS.map((key) => `${key} ${attributes[key] ?? 0}`).join(', ');
    const skills = skillXp(system);
    const powers = powerXp(actor);
    const artifacts = artifactXp(actor);
    const notes = [];
    notes.push(migrated
        ? `Neue Attributtabelle über dem Paket 4/4/3/3/2/2/2. ${listed}.`
        : `Alte Attributtabelle (Bänder à 8), abzüglich des kostenlosen Startpakets. Noch kein v0.9.9-Respec. ${listed}.`);
    if (attr.belowPackage)
        notes.push('Mindestens ein Attribut liegt unter dem kostenlosen Startpaket.');
    if (skills.note)
        notes.push(skills.note);
    if (artifacts.lines.length)
        notes.push(artifacts.lines.join('; '));
    notes.push('Artefakt aktivieren und Stufe 1 kosten 0.');
    const unspentSkillPoints = readSkillPointPool(system).unspent;
    const unspentXp = n(system.points?.xp);
    const unspentFreeXp = n(system.points?.xpFree);
    return {
        attributes: attr.xp,
        skills: skills.xp,
        powers,
        artifacts: artifacts.xp,
        net: attr.xp + skills.xp + powers + artifacts.xp,
        unspentSkillPoints,
        unspentXp,
        unspentFreeXp,
        skillBasis: skills.basis,
        artifactActivation: 0,
        notes,
    };
}
function esc(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
/** XP still to grant so Nach Ausgabe reaches `target`. Already at or above the target needs nothing. */
export function xpGrantToTarget(afterSpend, target) {
    const goal = Math.floor(Number(target) || 0);
    const standing = Math.floor(Number(afterSpend) || 0);
    if (goal <= 0)
        return 0;
    return Math.max(0, goal - standing);
}
function bonusXpControls(actor) {
    const id = esc(actor?.id);
    const hasSnap = actorHasPostCreationSnapshot(actor);
    const reset = globalThis.game?.user?.isGM === false
        ? ''
        : `<button type="button" class="reset-progress-xp-btn" data-character-id="${id}" title="Fortschritt auf den Stand nach der Erschaffung zurücksetzen."${hasSnap ? '' : ' disabled'}><i class="fas fa-undo"></i></button>`;
    return `<td class="grant-cell"><div class="grant-controls">`
        + `<div class="grant-group grant-group-free">`
        + `<input type="number" class="free-xp-amount-input" data-character-id="${id}" min="0" value="0" placeholder="+" title="Bonus-XP ohne Sitzungslimit." />`
        + `<button type="button" class="grant-free-xp-btn" data-character-id="${id}" title="Bonus-XP geben"><i class="fas fa-star"></i></button>`
        + `<button type="button" class="deduct-free-xp-btn" data-character-id="${id}" title="Bonus-XP zurücknehmen (nur noch nicht ausgegebene)"><i class="fas fa-minus"></i></button>`
        + `</div><div class="xp-row-actions">`
        + `<button type="button" class="history-xp-btn" data-character-id="${id}" title="XP History"><i class="fas fa-history"></i></button>`
        + reset
        + `</div></div></td>`;
}
/** GM settings table, with Bonus XP, history, and progression reset. */
export function buildValueTableHtml(actors) {
    const rows = (actors || []).filter((actor) => actor && actor.type === 'character');
    const body = rows.length
        ? rows.map((actor) => {
            const value = appraiseBuild(actor);
            const title = esc(value.notes.join(' '));
            const free = Math.max(0, Math.floor(Number(actor?.system?.points?.xpFree) || 0));
            const afterSpend = value.net + free;
            return `<tr data-character-id="${esc(actor.id)}" data-after-spend="${afterSpend}"><td>${esc(actor.name)}</td><td>${value.attributes}</td><td>${value.skills}</td><td>${value.powers}</td><td>${value.artifacts}</td><td><strong>${value.net}</strong></td><td>${value.unspentSkillPoints}</td><td title="${title}">Startregel</td><td class="xp-cell xp-cell-free" title="Noch nicht ausgegebene XP."><strong>${free}</strong></td><td class="xp-after-spend" title="Netto plus übrige XP. So steht der Bogen, wenn diese XP ausgegeben sind."><strong>${afterSpend}</strong></td><td class="xp-to-target" data-after-spend="${afterSpend}" title="XP, die noch fehlen, damit Nach Ausgabe das Ziel erreicht.">—</td>${bonusXpControls(actor)}</tr>`;
        }).join('')
        : '<tr><td colspan="12">Keine Charaktere.</td></tr>';
    return `<div class="bulk-grant-section build-value-section"><h4>Build-Wert nach aktuellen Regeln</h4><p class="hint">Nicht die vergebenen EP. Gerechnet wird der aktuelle Bogen: das Attribut-Startpaket, 40 Skill Points (höchstens 4 pro Skill), Power-Erschaffungsränge und Artefaktstufe 1 sind kostenlos. Skill Points, die später gesetzt wurden, sind keine EP. Artefakte aktivieren kostet nichts. Übrige XP auf dem Bogen zählen nicht zum Netto. Nach Ausgabe ist Netto plus diese XP. Ein Ziel füllt pro Charakter die fehlenden XP ins Vergabefeld.</p><table class="xp-table xp-table-compact"><thead><tr><th>Charakter</th><th>Attribute</th><th>Skills</th><th>Powers</th><th>Artefakte</th><th>Netto</th><th>Skill Points übrig</th><th>Skill-Basis</th><th title="Noch nicht ausgegebene XP.">XP</th><th title="Netto plus übrige XP.">Nach Ausgabe</th><th class="xp-target-head" title="Ziel für Nach Ausgabe. Die Spalte zeigt, wie viele XP noch fehlen.">Bis Ziel <input type="number" class="xp-target-input" min="0" placeholder="150" title="Alle auf diese Nach-Ausgabe bringen." /></th><th></th></tr></thead><tbody>${body}</tbody></table></div>`;
}
//# sourceMappingURL=build-value.js.map