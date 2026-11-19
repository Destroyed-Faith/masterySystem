/**
 * Legacy cleanup 2026 migration (GM review required).
 *
 * Only the dry run runs automatically: it reads every PC, NPC, unlinked token
 * actor and world item and builds a report. Nothing is written until the GM
 * confirms Apply in the review dialog, and Apply is only offered once the
 * Actives v0.9.9.6 migration is applied. Apply then:
 *   1. downloads a JSON backup of every affected document,
 *   2. stores a per-document backup in `flags.mastery-system.legacyCleanupBackup`,
 *   3. Skills (D6): XP-bought ranks return as Free XP (snapshot → history →
 *      Skill band table); creation ranks are only archived. Leftover unspent
 *      Skill Points become Free XP (the existing retirement rule). Everything
 *      lands in `flags.mastery-system.legacySkillsArchive`, then `system.skills`,
 *      `skillsSpent`, `skillPoints` and the redistribution fields are removed,
 *   4. NPC `system.skills` (D7) and retired Summon Skill fields are archived and removed,
 *   5. remaps / flags owned powers of removed templates and realigns Artifact
 *      picks to their definitions (`legacy-cleanup-2026-mapping.ts`); Artifacts
 *      without an `echoArtifactKey` get it once from an exact, unique name match,
 *   6. sets `legacyCleanup2026MigrationState = applied`, which lifts the resync hold.
 *
 * Ambiguous characters and removed Powers without a canonical counterpart are
 * flagged (`legacyCleanupConflict`) and stay unchanged for a GM decision; nothing
 * is deleted. Idempotent: migrated / flagged documents are skipped. Rollback is
 * per actor from the backups.
 */
import { findCatalogEntry } from '../utils/power-catalog.js';
import { buildPowerItemFromCatalogEntry } from '../utils/power-item-builder.js';
import { expandHistoryRows, historyChangeKey } from '../utils/xp-history.js';
import { skillBandCost } from '../utils/constants.js';
import { ECHO_ARTIFACTS, buildEchoProgressionPicks } from '../utils/echo-artifacts.js';
import { GENERAL_ARTIFACTS } from '../utils/general-artifacts.js';
import { lookupArtifactDefinition, resolveEchoArtifactKey } from '../utils/artifact-row-identity.js';
import { deriveLevelProgressionFromPicks } from '../artifacts/progression-compiler.js';
import { LEGACY_SKILL_MIGRATION_OPTION, LEGACY_SKILL_QUARANTINE_FLAG, LEGACY_SKILLS_ARCHIVE_FLAG, } from '../utils/legacy-skill-write-guard.js';
import { isLegacyFieldSpecialization } from '../rules/specializations.js';
import { K8_PROFESSIONS_REVIEWED_FLAG } from './profession-mapping-plan.js';
import { planSkillPointRetirement } from './legacy-skill-point-pool.js';
import { MARTIAL_SKILLS_REFUND_FLAG } from './martial-skills-refund-migration.js';
import { collectV0996Actors } from './actives-v0996-migration.js';
import { getActivesV0996MigrationState, getLegacyCleanupMigrationState, runPowerTemplateResyncMigration, } from './power-template-resync-migration.js';
import { ARTIFACT_SINGLE_HEAL_RE, LC_BACKUP_FLAG, LC_CONFLICT_FLAG, LC_MIGRATED_FLAG, LC_NOTE_FLAG, LC_RETIRED_FLAG, LEGACY_CLEANUP_CONFLICT_TEMPLATES, LEGACY_CLEANUP_STATE_KEY, LEGACY_CLEANUP_TEMPLATE_REMAP, V0996_OWNED_TEMPLATE_RE, classifyLegacyPower, isArtifactSourcedItem, isLegacyCleanupFlagged, } from './legacy-cleanup-2026-mapping.js';
const FLAG_SCOPE = 'mastery-system';
const FLAGS = `flags.${FLAG_SCOPE}`;
const ARCHIVE_SOURCE = 'legacy-cleanup-2026';
const SUMMON_SKILL_FIELDS = ['selectedSkills', 'skillDiceAlloc', 'taskSpecMap'];
const ECHO_CARD_FIELDS = ['selectedCardIds', 'cardUses'];
/* ------------------------------------------------------------------ */
/* Small helpers                                                       */
/* ------------------------------------------------------------------ */
function rating(value) {
    const n = Math.floor(Number(value) || 0);
    return n > 0 ? n : 0;
}
function clone(value) {
    return value === undefined ? value : JSON.parse(JSON.stringify(value));
}
function isRecord(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function srcSystem(doc) {
    return doc?._source?.system ?? doc?.system ?? {};
}
function srcFlags(doc) {
    return doc?._source?.flags?.[FLAG_SCOPE] ?? doc?.flags?.[FLAG_SCOPE] ?? {};
}
function docItems(doc) {
    const items = doc?.items;
    if (!items)
        return [];
    if (Array.isArray(items))
        return items;
    if (Array.isArray(items.contents))
        return items.contents;
    if (typeof items.values === 'function')
        return Array.from(items.values());
    return [];
}
function actorUuid(actor) {
    return String(actor?.uuid ?? actor?.id ?? '');
}
function itemRank(item) {
    const sys = item?.system ?? {};
    return Math.max(1, Math.min(16, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1)));
}
function itemSpecial(item) {
    const key = item?.system?.chosenSpecial?.key;
    return key ? String(key) : null;
}
function tierOf(templateId) {
    const t = Number(/-t([3-6])$/.exec(templateId)?.[1]);
    return (t >= 3 && t <= 6 ? t : 4);
}
/** Read `system.a.b` / `flags.mastery-system.x` from a document's source data. */
function readPath(doc, path) {
    const parts = path.split('.');
    let cur;
    if (parts[0] === 'system')
        cur = srcSystem(doc);
    else if (parts[0] === 'flags' && parts[1] === FLAG_SCOPE) {
        cur = srcFlags(doc);
        parts.shift();
    }
    else if (parts[0] === 'name')
        return { present: true, value: doc?.name };
    else
        return { present: false, value: undefined };
    for (const part of parts.slice(1)) {
        if (!isRecord(cur) || !(part in cur))
            return { present: false, value: undefined };
        cur = cur[part];
    }
    return { present: true, value: clone(cur) };
}
/** Snapshot every path an update batch touches (`-=` keys resolve to the deleted field). */
export function backupForUpdates(doc, updates, at) {
    const entries = [];
    const seen = new Set();
    for (const key of Object.keys(updates)) {
        const path = key.replace('.-=', '.');
        if (seen.has(path) || path === `${FLAGS}.${LC_BACKUP_FLAG}`)
            continue;
        seen.add(path);
        const { present, value } = readPath(doc, path);
        entries.push(present ? { path, present, value } : { path, present });
    }
    return { at, entries };
}
/** Update batch that restores a backup and clears the cleanup markers. */
export function restoreFromBackup(backup) {
    const patch = {};
    for (const entry of backup?.entries ?? []) {
        if (entry.present) {
            patch[entry.path] = clone(entry.value);
        }
        else {
            const i = entry.path.lastIndexOf('.');
            patch[`${entry.path.slice(0, i)}.-=${entry.path.slice(i + 1)}`] = null;
        }
    }
    patch[`${FLAGS}.-=${LC_BACKUP_FLAG}`] = null;
    patch[`${FLAGS}.-=${LC_MIGRATED_FLAG}`] = null;
    patch[`${FLAGS}.-=${LC_CONFLICT_FLAG}`] = null;
    patch[`${FLAGS}.-=${LC_RETIRED_FLAG}`] = null;
    patch[`${FLAGS}.-=${LC_NOTE_FLAG}`] = null;
    return patch;
}
function withBackup(doc, updates, at) {
    return { ...updates, [`${FLAGS}.${LC_BACKUP_FLAG}`]: backupForUpdates(doc, updates, at) };
}
/* ------------------------------------------------------------------ */
/* Legacy Skills (characters)                                          */
/* ------------------------------------------------------------------ */
function specializationIds(system) {
    const rows = Array.isArray(system?.specializations) ? system.specializations : [];
    return new Set(rows.map((s) => String(s?.id ?? '')).filter(Boolean));
}
/** Legacy Skill keys are plain keys; Profession ids always carry a `field:` / `profession:` prefix. */
function isLegacySkillKey(key, specIds) {
    const k = String(key || '').trim();
    return !!k && !k.includes(':') && !specIds.has(k);
}
function isLegacySkillHistoryEntry(entry, specIds) {
    if (!isRecord(entry) || entry.category !== 'skill' || entry.legacySkillRetired === true)
        return false;
    if (entry.details?.specialization === true)
        return false;
    const changes = entry.details?.changes;
    if (Array.isArray(changes) && changes.length > 0) {
        return changes.every((c) => isLegacySkillKey(historyChangeKey(c, entry.details), specIds));
    }
    return isLegacySkillKey(historyChangeKey(null, entry.details), specIds);
}
function legacyStepEntries(system, specIds) {
    const list = system?.xp?.currentStep?.skills;
    return Array.isArray(list) ? list.map(String).filter((k) => isLegacySkillKey(k, specIds)) : [];
}
function quarantineEntries(flags) {
    const q = flags?.[LEGACY_SKILL_QUARANTINE_FLAG];
    return Array.isArray(q?.entries) ? q.entries : [];
}
function hasOwn(obj, key) {
    return isRecord(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}
function hasLegacySkillData(system, flags) {
    const specIds = specializationIds(system);
    const snap = system?.xp?.postCreationProgress;
    return (hasOwn(system, 'skills') ||
        hasOwn(system, 'skillsSpent') ||
        hasOwn(system, 'skillPoints') ||
        hasOwn(system?.creation, 'skillsRedistributing') ||
        hasOwn(system?.creation, 'skillsRedistributeBackup') ||
        hasOwn(snap, 'skills') ||
        hasOwn(snap, 'skillsSpent') ||
        hasOwn(snap, 'skillPointsUnspent') ||
        hasOwn(flags, LEGACY_SKILL_QUARANTINE_FLAG) ||
        legacyStepEntries(system, specIds).length > 0 ||
        (Array.isArray(system?.xp?.history) && system.xp.history.some((e) => isLegacySkillHistoryEntry(e, specIds))));
}
function bandCostBetween(fromRank, toRank) {
    let sum = 0;
    for (let r = fromRank + 1; r <= toRank; r += 1)
        sum += skillBandCost(r);
    return sum;
}
/**
 * Plan the D6 Skill migration for one character. Pure. A plan with reasons is
 * a conflict: nothing about its Skills or XP is changed until the GM decides.
 */
export function planCharacterSkills(actor) {
    const system = srcSystem(actor);
    const flags = srcFlags(actor);
    if (!hasLegacySkillData(system, flags))
        return null;
    const specIds = specializationIds(system);
    const skills = isRecord(system.skills) ? system.skills : {};
    const creationOpen = system.creation?.complete === false;
    const reasons = [];
    const byKey = [];
    const retirement = planSkillPointRetirement(system);
    const plan = {
        status: 'apply',
        reasons,
        byKey,
        xpRefund: 0,
        xpSource: 'none',
        skillPointsToFreeXp: retirement.convertedXp,
        creationOpen,
        quarantineEntries: quarantineEntries(flags).length,
        historyRowsMarked: Array.isArray(system.xp?.history)
            ? system.xp.history.filter((e) => isLegacySkillHistoryEntry(e, specIds)).length
            : 0,
    };
    if (system.creation?.skillsRedistributing === true) {
        reasons.push('A Skill redistribution was still in progress; current Ratings and the backup cannot be told apart.');
    }
    if (flags[MARTIAL_SKILLS_REFUND_FLAG] === true && system.progression?.martialSkillsRefund?.xpSettled !== true) {
        reasons.push('An earlier Martial Skills refund never settled its XP part.');
    }
    const priorReview = system.progression?.martialSkillsRefundReview;
    if (Array.isArray(priorReview) && priorReview.length > 0) {
        reasons.push(`An earlier Martial Skills refund was waiting for review: ${priorReview.map((r) => r?.reason ?? '').join(' ')}`.trim());
    }
    const keys = Object.keys(skills).filter((k) => rating(skills[k]) > 0);
    const xpEarned = rating(system.xp?.totalEarned) + rating(system.xp?.freeEarned);
    const xpSpent = rating(system.xp?.totalSpent) + rating(system.xp?.freeSpent);
    const keySet = new Set(keys);
    const historyRows = expandHistoryRows(system.xp?.history).filter((row) => row.category === 'skill' && keySet.has(row.key) && isLegacySkillKey(row.key, specIds));
    const history = historyRows.reduce((acc, row) => {
        acc.netXp += -Number(row.signedAmount) || 0;
        if (Number.isFinite(row.from) && Number.isFinite(row.to))
            acc.netRanks += Number(row.to) - Number(row.from);
        return acc;
    }, { netXp: 0, netRanks: 0 });
    const snap = system.xp?.postCreationProgress;
    const hasSnapshot = isRecord(snap) && isRecord(snap.skills);
    const placed = isRecord(system.skillPoints?.placed) ? system.skillPoints.placed : {};
    let bandXp = 0;
    for (const key of keys) {
        const current = rating(skills[key]);
        if (creationOpen) {
            byKey.push({ key, rating: current, creationRanks: current, xpRanks: 0 });
            continue;
        }
        if (hasSnapshot) {
            const creation = rating(snap.skills[key]) + rating(placed[key]);
            const above = current - creation;
            if (above < 0) {
                reasons.push(`${key}: the creation snapshot and placed Skill Points exceed the current Rating ${current}.`);
                continue;
            }
            byKey.push({ key, rating: current, creationRanks: creation, xpRanks: above });
            bandXp += bandCostBetween(creation, current);
            continue;
        }
        if (historyRows.length === 0 && (xpEarned === 0 || xpSpent === 0)) {
            byKey.push({ key, rating: current, creationRanks: current, xpRanks: 0 });
            continue;
        }
        reasons.push(`${key}: no creation snapshot, so creation ranks and XP-bought ranks cannot be separated.`);
    }
    const xpRanks = byKey.reduce((sum, k) => sum + k.xpRanks, 0);
    if (!reasons.length && xpRanks > 0) {
        if (historyRows.length > 0) {
            if (history.netRanks !== xpRanks || history.netXp < 0) {
                reasons.push(`XP history covers ${history.netRanks} Skill ranks (${history.netXp} XP) but the build has ${xpRanks} XP-bought ranks.`);
            }
            else {
                plan.xpRefund = history.netXp;
                plan.xpSource = 'history';
            }
        }
        else if (xpEarned === 0) {
            for (const k of byKey) {
                k.creationRanks += k.xpRanks;
                k.xpRanks = 0;
            }
        }
        else {
            plan.xpRefund = bandXp;
            plan.xpSource = 'canonical-band';
        }
    }
    if (!reasons.length && plan.xpRefund > xpSpent) {
        reasons.push(`The Skill refund (${plan.xpRefund} XP) is larger than all XP ever spent (${xpSpent}).`);
    }
    if (reasons.length) {
        plan.status = 'conflict';
        plan.xpRefund = 0;
        plan.xpSource = 'none';
    }
    return plan;
}
function markLegacyHistory(history, specIds) {
    const list = Array.isArray(history) ? history.map((e) => clone(e)) : [];
    let changed = false;
    for (const entry of list) {
        if (isLegacySkillHistoryEntry(entry, specIds)) {
            entry.legacySkillRetired = true;
            changed = true;
        }
    }
    return { list, changed };
}
/**
 * Skill part of an actor update: archive, XP refund, removal. `xpRefund` and
 * `xpSource` come from the plan, or from a GM decision for a conflict.
 */
export function buildCharacterSkillUpdates(actor, plan, at, archiveExtra = {}) {
    const system = srcSystem(actor);
    const flags = srcFlags(actor);
    const specIds = specializationIds(system);
    const creation = system.creation ?? {};
    const snap = system.xp?.postCreationProgress;
    const stepLegacy = legacyStepEntries(system, specIds);
    const updates = {};
    updates[`${FLAGS}.${LEGACY_SKILLS_ARCHIVE_FLAG}`] = {
        source: ARCHIVE_SOURCE,
        archivedAt: at,
        skills: clone(system.skills) ?? null,
        skillsSpent: clone(system.skillsSpent) ?? null,
        skillPoints: clone(system.skillPoints) ?? null,
        creation: {
            skillsRedistributing: creation.skillsRedistributing ?? null,
            skillsRedistributeBackup: clone(creation.skillsRedistributeBackup) ?? null,
        },
        postCreationProgress: {
            skills: clone(snap?.skills) ?? null,
            skillsSpent: clone(snap?.skillsSpent) ?? null,
            skillPointsUnspent: snap?.skillPointsUnspent ?? null,
        },
        currentStepSkills: stepLegacy,
        quarantine: clone(quarantineEntries(flags)),
        refund: {
            xpRefund: plan.xpRefund,
            xpSource: plan.xpSource,
            skillPointsToFreeXp: plan.skillPointsToFreeXp,
            byKey: clone(plan.byKey),
        },
        previous: clone(flags[LEGACY_SKILLS_ARCHIVE_FLAG]) ?? null,
        ...archiveExtra,
    };
    for (const key of ['skills', 'skillsSpent', 'skillPoints']) {
        if (hasOwn(system, key))
            updates[`system.-=${key}`] = null;
    }
    for (const key of ['skillsRedistributing', 'skillsRedistributeBackup']) {
        if (hasOwn(creation, key))
            updates[`system.creation.-=${key}`] = null;
    }
    for (const key of ['skills', 'skillsSpent', 'skillPointsUnspent']) {
        if (hasOwn(snap, key))
            updates[`system.xp.postCreationProgress.-=${key}`] = null;
    }
    if (stepLegacy.length) {
        const legacy = new Set(stepLegacy);
        updates['system.xp.currentStep.skills'] = system.xp.currentStep.skills
            .map(String)
            .filter((k) => !legacy.has(k));
    }
    if (hasOwn(flags, LEGACY_SKILL_QUARANTINE_FLAG))
        updates[`${FLAGS}.-=${LEGACY_SKILL_QUARANTINE_FLAG}`] = null;
    if (Array.isArray(system.progression?.martialSkillsRefundReview)) {
        updates['system.progression.-=martialSkillsRefundReview'] = null;
    }
    const xpBefore = rating(system.points?.xpFree);
    const freeEarnedBefore = rating(system.xp?.freeEarned);
    const converted = plan.creationOpen ? 0 : plan.skillPointsToFreeXp;
    const refund = plan.creationOpen ? 0 : plan.xpRefund;
    const xpFree = xpBefore + converted + refund;
    const freeEarned = freeEarnedBefore + converted;
    const { list: history, changed: historyMarked } = markLegacyHistory(system.xp?.history, specIds);
    const totals = {
        totalEarned: rating(system.xp?.totalEarned),
        totalSpent: rating(system.xp?.totalSpent),
    };
    let running = xpBefore;
    if (converted > 0) {
        history.push({
            ts: Date.parse(at) || Date.now(),
            kind: 'grant',
            category: 'xp',
            amount: converted,
            note: 'Free XP — leftover Skill Points converted (Skills retired)',
            details: { legacySkillPointsConverted: converted, pool: 'xpFree' },
            before: { available: running, ...totals },
            after: { available: running + converted, ...totals },
        });
        running += converted;
    }
    if (refund > 0) {
        history.push({
            ts: Date.parse(at) || Date.now(),
            kind: 'adjust',
            category: 'xp',
            amount: refund,
            note: 'refund: free — retired Skill XP returned as Free XP',
            details: { legacySkillXpRefund: refund, source: plan.xpSource, pool: 'xpFree' },
            before: { available: running, ...totals },
            after: { available: running + refund, ...totals },
        });
    }
    if (historyMarked || converted > 0 || refund > 0) {
        updates['system.xp.history'] = history.length > 200 ? history.slice(-200) : history;
    }
    if (xpFree !== xpBefore)
        updates['system.points.xpFree'] = xpFree;
    if (freeEarned !== freeEarnedBefore)
        updates['system.xp.freeEarned'] = freeEarned;
    return updates;
}
/* ------------------------------------------------------------------ */
/* NPC Skills, Summon Skill fields                                     */
/* ------------------------------------------------------------------ */
function bondHasSkillFields(bond) {
    return isRecord(bond) && SUMMON_SKILL_FIELDS.some((f) => hasOwn(bond, f));
}
function planSummonBonds(system) {
    const bonds = Array.isArray(system?.summonBonds) ? system.summonBonds : [];
    if (!bonds.some(bondHasSkillFields))
        return null;
    const archive = [];
    const next = bonds.map((bond) => {
        if (!bondHasSkillFields(bond))
            return bond;
        const kept = clone(bond);
        const entry = { bondId: bond.id ?? null, name: bond.name ?? '' };
        for (const f of SUMMON_SKILL_FIELDS) {
            if (hasOwn(kept, f)) {
                entry[f] = clone(kept[f]);
                delete kept[f];
            }
        }
        archive.push(entry);
        return kept;
    });
    return { count: archive.length, bonds: next, archive };
}
/** Plan everything on the actor document itself (not its items). Pure. */
export function planActorLegacyCleanup(actor, at = new Date().toISOString()) {
    if (!actor)
        return null;
    const system = srcSystem(actor);
    const flags = srcFlags(actor);
    const type = String(actor.type ?? '');
    const plan = {
        actorUuid: actorUuid(actor),
        actorName: String(actor.name ?? 'Actor'),
        actorType: type,
        skills: null,
        npcSkillKeys: 0,
        summonBonds: 0,
        summonActorFields: 0,
        echoCardIds: 0,
        updates: null,
        conflictReasons: [],
    };
    const archiveExtra = {};
    let updates = {};
    const bonds = planSummonBonds(system);
    if (bonds) {
        plan.summonBonds = bonds.count;
        updates['system.summonBonds'] = bonds.bonds;
        archiveExtra.summonBonds = bonds.archive;
    }
    const summonBond = system.summonBond;
    if (bondHasSkillFields(summonBond)) {
        const entry = {};
        for (const f of SUMMON_SKILL_FIELDS) {
            if (hasOwn(summonBond, f)) {
                entry[f] = clone(summonBond[f]);
                updates[`system.summonBond.-=${f}`] = null;
                plan.summonActorFields += 1;
            }
        }
        archiveExtra.summonBond = entry;
    }
    const echo = system.echo;
    if (isRecord(echo) && ECHO_CARD_FIELDS.some((f) => hasOwn(echo, f))) {
        const entry = {};
        for (const f of ECHO_CARD_FIELDS) {
            if (!hasOwn(echo, f))
                continue;
            entry[f] = clone(echo[f]);
            updates[`system.echo.-=${f}`] = null;
        }
        plan.echoCardIds = Array.isArray(echo.selectedCardIds) ? echo.selectedCardIds.length : 0;
        archiveExtra.echoCards = entry;
    }
    if (type === 'character') {
        const skills = planCharacterSkills(actor);
        plan.skills = skills;
        if (skills?.status === 'conflict') {
            plan.conflictReasons.push(...skills.reasons);
        }
        else if (skills) {
            updates = { ...updates, ...buildCharacterSkillUpdates(actor, skills, at, archiveExtra) };
        }
    }
    else if (hasOwn(system, 'skills') || hasOwn(flags, LEGACY_SKILL_QUARANTINE_FLAG)) {
        plan.npcSkillKeys = isRecord(system.skills) ? Object.keys(system.skills).length : 0;
        if (hasOwn(system, 'skills'))
            updates['system.-=skills'] = null;
        if (hasOwn(flags, LEGACY_SKILL_QUARANTINE_FLAG))
            updates[`${FLAGS}.-=${LEGACY_SKILL_QUARANTINE_FLAG}`] = null;
    }
    const archiveKey = `${FLAGS}.${LEGACY_SKILLS_ARCHIVE_FLAG}`;
    const needsArchive = Object.keys(updates).length > 0 && !(archiveKey in updates);
    if (needsArchive) {
        updates[archiveKey] = {
            source: ARCHIVE_SOURCE,
            archivedAt: at,
            ...(type !== 'character' && hasOwn(system, 'skills') ? { skills: clone(system.skills) ?? null } : {}),
            ...(type !== 'character' ? { quarantine: clone(quarantineEntries(flags)) } : {}),
            previous: clone(flags[LEGACY_SKILLS_ARCHIVE_FLAG]) ?? null,
            ...archiveExtra,
        };
    }
    if (plan.conflictReasons.length) {
        updates[`${FLAGS}.${LC_CONFLICT_FLAG}`] = { reasons: [...plan.conflictReasons], at };
    }
    if (!Object.keys(updates).length)
        return null;
    if (!plan.conflictReasons.length)
        updates[`${FLAGS}.${LC_MIGRATED_FLAG}`] = true;
    plan.updates = updates;
    return plan;
}
/* ------------------------------------------------------------------ */
/* Owned / world powers                                                */
/* ------------------------------------------------------------------ */
function ownsTarget(items, self, to) {
    return items.some((o) => o !== self &&
        o?.type === 'power' &&
        String(o?.system?.templateId ?? '') === to.templateId &&
        (to.special == null || itemSpecial(o) === to.special));
}
/** Plan power-item changes for one owner (actor) or for world items (`owner = null`). */
export function planPowerItemsLegacyCleanup(items, owner) {
    const out = [];
    const powers = items.filter((i) => i?.type === 'power');
    for (const item of powers) {
        if (isLegacyCleanupFlagged(item))
            continue;
        const flags = item?.flags?.[FLAG_SCOPE] ?? {};
        if (flags.v0996Conflict || flags.v0996Retired === true)
            continue;
        const tid = String(item?.system?.templateId ?? '').trim();
        const special = itemSpecial(item);
        const cls = classifyLegacyPower(tid, special, isArtifactSourcedItem(item));
        if (!cls)
            continue;
        const base = {
            ownerName: String(owner?.name ?? 'World'),
            ownerUuid: owner ? actorUuid(owner) : null,
            itemId: String(item?.id ?? ''),
            itemName: String(item?.name ?? ''),
            rank: itemRank(item),
            special,
            fromTemplateId: tid,
            rename: null,
        };
        if (cls.kind === 'v0996') {
            out.push({ ...base, kind: 'conflict', to: null, note: `${cls.reason} It was left unchanged there (no canonical target), so it is listed for GM decision.` });
            continue;
        }
        if (cls.kind === 'remap') {
            const entry = findCatalogEntry(cls.to.templateId, cls.to.special ?? undefined);
            if (!entry || (cls.to.special && entry.chosenSpecial?.key !== cls.to.special)) {
                out.push({ ...base, kind: 'conflict', to: null, note: `No catalog entry ${cls.to.templateId}::${cls.to.special ?? ''}. Kept unchanged.` });
                continue;
            }
            if (ownsTarget(powers, item, cls.to)) {
                out.push({ ...base, kind: 'conflict', to: null, note: `Already owns ${cls.to.templateId}${cls.to.special ? `::${cls.to.special}` : ''}. Both kept unchanged for GM decision (no merge, no deletion).` });
                continue;
            }
            const name = base.itemName;
            const rename = /\(Mixed\)\s*$/.test(name) ? String(entry.name ?? '') || null : null;
            out.push({ ...base, kind: 'remap', to: cls.to, rename: rename && rename !== name ? rename : null, note: cls.reason });
            continue;
        }
        out.push({ ...base, kind: cls.kind, to: null, note: cls.reason });
    }
    return out;
}
/* ------------------------------------------------------------------ */
/* Artifacts                                                           */
/* ------------------------------------------------------------------ */
function pickSignature(pick) {
    if (!pick)
        return '';
    return JSON.stringify({
        kind: pick.kind,
        powerTemplateId: pick.powerTemplateId ?? null,
        special: pick.chosenSpecial?.key ?? null,
        stoneFunction: pick.stoneFunction ?? null,
    });
}
/**
 * Superseded picks from earlier definitions: Moonlight Mending as Healing support
 * (v0.9.869) and Lor-Keth's Staff L1 as Challenge (v0.9.869 / v0.9.870).
 */
function isSupersededDefinitionPick(artifactKey, pick) {
    if (artifactKey === 'moonlightGreatsword') {
        return pick?.kind === 'stoneFunction' && pick?.stoneFunction?.stonePowerId === 'resolve.healing';
    }
    if (artifactKey === 'lorKethsStaff') {
        return Number(pick?.level) === 1 && pick?.kind === 'power' && pick?.chosenSpecial?.key === 'challenge';
    }
    return false;
}
function isLegacyPick(pick) {
    if (pick?.kind !== 'power')
        return false;
    const tid = String(pick.powerTemplateId ?? '');
    const special = pick.chosenSpecial?.key ? String(pick.chosenSpecial.key) : null;
    return classifyLegacyPower(tid, special, true) !== null;
}
function legacyStageTemplates(pick) {
    const ids = Array.isArray(pick?.stageTemplateIds) ? pick.stageTemplateIds.map(String) : [];
    return ids.filter((id) => !!LEGACY_CLEANUP_TEMPLATE_REMAP[id] ||
        LEGACY_CLEANUP_CONFLICT_TEMPLATES.has(id) ||
        ARTIFACT_SINGLE_HEAL_RE.test(id) ||
        V0996_OWNED_TEMPLATE_RE.test(id));
}
function normalizeArtifactName(name) {
    return String(name ?? '').replace(/\s*\((?:L|Level\s*)\d+\)\s*$/i, '').trim().toLowerCase();
}
/** Definition keys whose display name equals the item name (ignoring a trailing "(L3)"). */
export function artifactKeysForName(name) {
    const n = normalizeArtifactName(name);
    if (!n)
        return [];
    const out = [];
    for (const [key, def] of [...Object.entries(ECHO_ARTIFACTS), ...Object.entries(GENERAL_ARTIFACTS)]) {
        if (normalizeArtifactName(def?.name) === n && !out.includes(key))
            out.push(key);
    }
    return out;
}
/** Plan pick changes for one Artifact item. Pure. */
export function planArtifactLegacyCleanup(item, owner) {
    if (item?.type !== 'artifact' || isLegacyCleanupFlagged(item))
        return null;
    const sys = srcSystem(item);
    const picks = Array.isArray(sys.progressionPicks) ? sys.progressionPicks : [];
    const changes = [];
    let artifactKey = resolveEchoArtifactKey(item);
    let keyBackfill = null;
    if (!artifactKey) {
        const candidates = artifactKeysForName(item?.name);
        if (candidates.length === 1) {
            artifactKey = candidates[0];
            keyBackfill = artifactKey;
        }
        else if (candidates.length > 1) {
            changes.push({ level: 0, kind: 'conflict', fromTemplateId: '', special: null, to: '', note: `No Artifact key; the name matches ${candidates.join(' / ')}. Set the key for GM decision.` });
        }
    }
    const def = lookupArtifactDefinition(artifactKey);
    const defPicks = def ? buildEchoProgressionPicks(def) : [];
    const authored = sys.useAuthoredLevelProgression === true;
    for (const pick of picks) {
        const level = Number(pick?.level) || 0;
        const tid = String(pick?.powerTemplateId ?? '');
        const special = pick?.chosenSpecial?.key ? String(pick.chosenSpecial.key) : null;
        const staged = legacyStageTemplates(pick);
        if (!isLegacyPick(pick) && !staged.length && !isSupersededDefinitionPick(artifactKey, pick))
            continue;
        const from = tid || staged.join(', ');
        const defPick = defPicks.find((p) => Number(p?.level) === level);
        if (authored) {
            changes.push({ level, kind: 'conflict', fromTemplateId: from, special, to: '', note: 'Authored Level Progression references a removed template. Kept unchanged for GM decision.' });
            continue;
        }
        if (defPick && !isLegacyPick(defPick) && !legacyStageTemplates(defPick).length && pickSignature(defPick) !== pickSignature(pick)) {
            const to = defPick.kind === 'stoneFunction'
                ? `Stone Function ${defPick.stoneFunction?.stonePowerId ?? defPick.stoneFunction?.kind ?? ''}`.trim()
                : `${defPick.powerTemplateId ?? ''}${defPick.chosenSpecial?.key ? `::${defPick.chosenSpecial.key}` : ''}`;
            changes.push({ level, kind: 'realign', fromTemplateId: from, special, to, note: `Pick realigned to the ${def?.name ?? artifactKey} definition.` });
            continue;
        }
        const cls = staged.length ? null : classifyLegacyPower(tid, special, true);
        if (cls?.kind === 'remap') {
            changes.push({ level, kind: 'remap', fromTemplateId: tid, special, to: `${cls.to.templateId}${cls.to.special ? `::${cls.to.special}` : ''}`, note: cls.reason });
            continue;
        }
        changes.push({
            level,
            kind: 'conflict',
            fromTemplateId: from,
            special,
            to: '',
            note: cls?.reason ?? 'Pick stages reference a removed template. Kept unchanged for GM decision.',
        });
    }
    if (!changes.length && !keyBackfill)
        return null;
    return {
        ownerName: String(owner?.name ?? 'World'),
        ownerUuid: owner ? actorUuid(owner) : null,
        itemId: String(item?.id ?? ''),
        itemName: String(item?.name ?? ''),
        artifactKey,
        keyBackfill,
        picks: changes,
    };
}
/** Update batch for an Artifact plan (realign / remap only; conflicts are flagged). */
export function buildArtifactUpdates(item, change, at) {
    const sys = srcSystem(item);
    const def = lookupArtifactDefinition(change.artifactKey);
    const defPicks = def ? buildEchoProgressionPicks(def) : [];
    const picks = Array.isArray(sys.progressionPicks) ? clone(sys.progressionPicks) : [];
    const changedLevels = [];
    for (const c of change.picks) {
        const idx = picks.findIndex((p) => Number(p?.level) === c.level);
        if (idx < 0)
            continue;
        if (c.kind === 'realign') {
            const defPick = defPicks.find((p) => Number(p?.level) === c.level);
            if (!defPick)
                continue;
            picks[idx] = clone(defPick);
            changedLevels.push(c.level);
        }
        else if (c.kind === 'remap') {
            const [templateId, special] = c.to.split('::');
            const next = { ...picks[idx], powerTemplateId: templateId };
            if (special)
                next.chosenSpecial = { key: special, tier: tierOf(templateId) };
            picks[idx] = next;
            changedLevels.push(c.level);
        }
    }
    const updates = {};
    if (change.keyBackfill)
        updates[`${FLAGS}.echoArtifactKey`] = change.keyBackfill;
    if (changedLevels.length) {
        updates['system.progressionPicks'] = picks;
        const rows = Array.isArray(sys.levelProgression) ? clone(sys.levelProgression) : [];
        const replaced = new Set();
        for (const lvl of changedLevels)
            for (const s of [0, 3, 6])
                replaced.add(lvl + s);
        const derived = deriveLevelProgressionFromPicks(picks.filter((p) => changedLevels.includes(Number(p?.level))));
        updates['system.levelProgression'] = [
            ...rows.filter((r) => !replaced.has(Number(r?.level))),
            ...derived.filter((r) => replaced.has(Number(r.level))),
        ].sort((a, b) => Number(a.level) - Number(b.level));
    }
    const conflicts = change.picks.filter((c) => c.kind === 'conflict');
    if (conflicts.length) {
        updates[`${FLAGS}.${LC_CONFLICT_FLAG}`] = { reasons: conflicts.map((c) => `L${c.level}: ${c.note}`), at };
    }
    else {
        updates[`${FLAGS}.${LC_MIGRATED_FLAG}`] = true;
    }
    return withBackup(item, updates, at);
}
/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */
const EXORCISM_RE = /exorcis|requiem/i;
function scanExorcismRequiem(actor) {
    const system = { ...srcSystem(actor) };
    delete system.xp;
    delete system.biography;
    delete system.notes;
    const effects = docItems({ items: actor?.effects }).map((e) => (typeof e?.toObject === 'function' ? e.toObject() : e));
    try {
        return EXORCISM_RE.test(JSON.stringify({ system, effects, statuses: Array.from(actor?.statuses ?? []) }));
    }
    catch {
        return false;
    }
}
const REMOVED_TEMPLATE_SCAN = new RegExp([
    ...Object.keys(LEGACY_CLEANUP_TEMPLATE_REMAP),
    ...LEGACY_CLEANUP_CONFLICT_TEMPLATES,
    'active-(?:melee|ranged)-single-heal',
    'active-(?:melee|ranged)-damage-t[3-6]',
    'active-mental-attack',
].join('|'));
function minorMagicUsesRemovedTemplate(item) {
    const mm = item?.flags?.[FLAG_SCOPE]?.minorMagic;
    if (!mm)
        return false;
    try {
        return REMOVED_TEMPLATE_SCAN.test(JSON.stringify(mm));
    }
    catch {
        return false;
    }
}
/** Build the full dry-run report. Reads only. */
export function buildLegacyCleanupReport(g = globalThis.game) {
    const at = new Date().toISOString();
    const report = {
        generatedAt: at,
        state: getLegacyCleanupMigrationState(),
        v0996State: getActivesV0996MigrationState(),
        actors: [],
        items: [],
        artifacts: [],
        exorcismRequiem: [],
        minorMagic: [],
        legacyProfessions: [],
    };
    for (const actor of collectV0996Actors(g)) {
        const ap = planActorLegacyCleanup(actor, at);
        if (ap)
            report.actors.push(ap);
        const items = docItems(actor);
        report.items.push(...planPowerItemsLegacyCleanup(items, actor));
        for (const item of items) {
            const art = planArtifactLegacyCleanup(item, actor);
            if (art)
                report.artifacts.push(art);
            if (minorMagicUsesRemovedTemplate(item)) {
                report.minorMagic.push({ ownerName: String(actor?.name ?? ''), ownerUuid: actorUuid(actor), itemName: String(item?.name ?? ''), note: 'Minor Magic Item stores a Power of a removed template. Listed only — unchanged.' });
            }
        }
        if (scanExorcismRequiem(actor)) {
            report.exorcismRequiem.push({ ownerName: String(actor?.name ?? ''), ownerUuid: actorUuid(actor), note: 'Actor data still mentions Exorcism / Requiem (removed, D4). Listed only — unchanged.' });
        }
        if (actor?.type === 'character') {
            const specs = Array.isArray(srcSystem(actor).specializations) ? srcSystem(actor).specializations : [];
            const legacy = specs.filter((s) => isLegacyFieldSpecialization(s ?? {}));
            if (legacy.length && !srcFlags(actor)[K8_PROFESSIONS_REVIEWED_FLAG]) {
                report.legacyProfessions.push({ ownerName: String(actor?.name ?? ''), ownerUuid: actorUuid(actor), note: `${legacy.length} Profession row(s) still use a Field identity. Use the Profession review; this migration does not rename them.` });
            }
        }
    }
    const worldItems = g?.items?.contents ?? [];
    report.items.push(...planPowerItemsLegacyCleanup(worldItems, null));
    for (const item of worldItems) {
        const art = planArtifactLegacyCleanup(item, null);
        if (art)
            report.artifacts.push(art);
        if (minorMagicUsesRemovedTemplate(item)) {
            report.minorMagic.push({ ownerName: 'World', ownerUuid: null, itemName: String(item?.name ?? ''), note: 'Minor Magic Item stores a Power of a removed template. Listed only — unchanged.' });
        }
    }
    return report;
}
export function legacyCleanupReportHasChanges(report) {
    return report.actors.length > 0 || report.items.length > 0 || report.artifacts.length > 0;
}
export function legacyCleanupConflictCount(report) {
    return (report.actors.filter((a) => a.conflictReasons.length > 0).length +
        report.items.filter((i) => i.kind === 'conflict').length +
        report.artifacts.reduce((n, a) => n + a.picks.filter((p) => p.kind === 'conflict').length, 0));
}
export function formatLegacyCleanupReportMarkdown(report) {
    const lines = [];
    lines.push('# Legacy cleanup 2026 migration report', '');
    lines.push(`Generated ${report.generatedAt} · state: ${report.state || 'pending'} · Actives v0.9.9.6: ${report.v0996State || 'pending'}`, '');
    const skillActors = report.actors.filter((a) => a.skills);
    lines.push(`## Character Skills (${skillActors.length})`);
    for (const a of skillActors) {
        const s = a.skills;
        if (s.status === 'conflict') {
            lines.push(`- **${a.actorName}** — CONFLICT (unchanged): ${s.reasons.join(' ')}`);
            continue;
        }
        const keys = s.byKey.map((k) => `${k.key} ${k.rating} (creation ${k.creationRanks}, XP ${k.xpRanks})`).join(', ') || 'no rated Skills';
        lines.push(`- **${a.actorName}** — archive ${keys}; Free XP +${s.xpRefund} (${s.xpSource}); leftover Skill Points → Free XP +${s.skillPointsToFreeXp}${s.creationOpen ? ' (creation open: archive only)' : ''}; history rows marked ${s.historyRowsMarked}; quarantined writes ${s.quarantineEntries}.`);
    }
    lines.push('');
    const npcs = report.actors.filter((a) => a.actorType !== 'character' && a.npcSkillKeys > 0);
    lines.push(`## NPC Skills archived (${npcs.length})`);
    for (const a of npcs)
        lines.push(`- **${a.actorName}** — ${a.npcSkillKeys} key(s) archived to the flag; no conversion (D7).`);
    lines.push('');
    const summons = report.actors.filter((a) => a.summonBonds > 0 || a.summonActorFields > 0);
    lines.push(`## Summon Skill fields archived (${summons.length})`);
    for (const a of summons)
        lines.push(`- **${a.actorName}** — ${a.summonBonds} Bond(s), ${a.summonActorFields} Summon field(s).`);
    lines.push('');
    const echoCards = report.actors.filter((a) => a.echoCardIds > 0);
    lines.push(`## Retired Echo Card picks archived (${echoCards.length})`);
    for (const a of echoCards)
        lines.push(`- **${a.actorName}** — ${a.echoCardIds} card id(s) moved to the archive flag.`);
    lines.push('');
    lines.push(`## Powers (${report.items.length})`);
    for (const c of report.items) {
        const to = c.to ? ` → ${c.to.templateId}${c.to.special ? `::${c.to.special}` : ''}` : '';
        lines.push(`- [${c.kind}] **${c.ownerName}** — ${c.itemName} (PL ${c.rank}${c.special ? `, ${c.special}` : ''}): ${c.fromTemplateId}${to}${c.rename ? ` · rename → "${c.rename}"` : ''}. ${c.note}`);
    }
    lines.push('');
    lines.push(`## Artifact picks (${report.artifacts.length})`);
    for (const a of report.artifacts) {
        if (a.keyBackfill)
            lines.push(`- [key] **${a.ownerName}** — ${a.itemName}: Artifact key set to ${a.keyBackfill} (exact name match).`);
        for (const p of a.picks) {
            lines.push(`- [${p.kind}] **${a.ownerName}** — ${a.itemName} L${p.level}: ${p.fromTemplateId}${p.special ? ` (${p.special})` : ''}${p.to ? ` → ${p.to}` : ''}. ${p.note}`);
        }
    }
    lines.push('');
    const info = (title, rows) => {
        lines.push(`## ${title} (${rows.length})`);
        for (const r of rows)
            lines.push(`- **${r.ownerName}**${r.itemName ? ` — ${r.itemName}` : ''}: ${r.note}`);
        lines.push('');
    };
    info('Exorcism / Requiem mentions (listed only)', report.exorcismRequiem);
    info('Minor Magic Items with removed templates (listed only)', report.minorMagic);
    info('Professions still on a Field identity (listed only)', report.legacyProfessions);
    return lines.join('\n');
}
/* ------------------------------------------------------------------ */
/* Backup download + Apply + Rollback                                  */
/* ------------------------------------------------------------------ */
function saveJson(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const fu = globalThis.foundry?.utils;
    const save = fu?.saveDataToFile ?? globalThis.saveDataToFile;
    if (typeof save === 'function')
        save(json, 'application/json', filename);
}
function toPlain(doc) {
    return typeof doc?.toObject === 'function' ? doc.toObject() : clone(doc);
}
/** Download a JSON backup of every affected actor / world item before Apply. */
export function downloadLegacyCleanupBackup(report, g = globalThis.game) {
    const uuids = new Set();
    for (const a of report.actors)
        uuids.add(a.actorUuid);
    for (const c of report.items)
        if (c.ownerUuid)
            uuids.add(c.ownerUuid);
    for (const a of report.artifacts)
        if (a.ownerUuid)
            uuids.add(a.ownerUuid);
    const actors = collectV0996Actors(g).filter((a) => uuids.has(actorUuid(a)));
    const worldIds = new Set([
        ...report.items.filter((c) => !c.ownerUuid).map((c) => c.itemId),
        ...report.artifacts.filter((a) => !a.ownerUuid).map((a) => a.itemId),
    ]);
    const worldItems = (g?.items?.contents ?? []).filter((i) => worldIds.has(String(i?.id)));
    saveJson({
        kind: 'mastery-system/legacy-cleanup-2026-backup',
        generatedAt: new Date().toISOString(),
        actors: actors.map(toPlain),
        items: worldItems.map(toPlain),
    }, `legacy-cleanup-2026-backup-${Date.now()}.json`);
    return actors.length + worldItems.length;
}
function findActorByUuid(uuid, g) {
    return collectV0996Actors(g).find((a) => actorUuid(a) === uuid) ?? null;
}
function findItem(owner, id, g) {
    const coll = owner ? owner.items : g?.items;
    if (typeof coll?.get === 'function')
        return coll.get(id) ?? null;
    return docItems(owner ?? { items: g?.items }).find((i) => String(i?.id) === id) ?? null;
}
/** Fresh object per write: Foundry stores `parent` / `updates` on the operation it receives. */
const migrationOptions = () => ({ [LEGACY_SKILL_MIGRATION_OPTION]: true });
function powerItemUpdates(item, change, at) {
    if (change.kind === 'conflict') {
        return withBackup(item, { [`${FLAGS}.${LC_CONFLICT_FLAG}`]: { reasons: [change.note], at }, [`${FLAGS}.${LC_NOTE_FLAG}`]: change.note }, at);
    }
    if (change.kind === 'retire') {
        return withBackup(item, { [`${FLAGS}.${LC_RETIRED_FLAG}`]: true, [`${FLAGS}.${LC_NOTE_FLAG}`]: change.note }, at);
    }
    if (!change.to)
        return null;
    const entry = findCatalogEntry(change.to.templateId, change.to.special ?? undefined);
    if (!entry)
        return null;
    const sys = item.system ?? {};
    const built = buildPowerItemFromCatalogEntry(entry, change.rank, {
        isSpell: sys.isSpell === true,
        castingAttribute: sys.castingAttribute,
        spellResolution: sys.spellResolution,
    });
    const nb = (built?.system ?? null);
    if (!nb)
        return null;
    const patch = {};
    for (const key of ['templateId', 'templateName', 'subfamily', 'chosenSpecial', 'tags', 'cost', 'roll', 'levels', 'range', 'aoe', 'duration', 'effect', 'specials', 'fluff', 'description']) {
        patch[`system.${key}`] = nb[key] ?? null;
    }
    if (change.rename)
        patch.name = change.rename;
    patch[`${FLAGS}.${LC_MIGRATED_FLAG}`] = true;
    patch[`${FLAGS}.${LC_NOTE_FLAG}`] = change.note;
    return withBackup(item, patch, at);
}
/**
 * Apply a reviewed report. GM only, and only after Actives v0.9.9.6. Actor
 * plans are rebuilt from the live documents and skipped when they changed
 * since the report was generated.
 */
export async function applyLegacyCleanupReport(report, g = globalThis.game) {
    const summary = { actors: 0, items: 0, artifacts: 0, conflicts: 0, skipped: 0, failed: 0 };
    if (!g?.user?.isGM)
        return summary;
    if (getActivesV0996MigrationState() !== 'applied') {
        summary.skipped = report.actors.length + report.items.length + report.artifacts.length;
        return summary;
    }
    const at = new Date().toISOString();
    for (const reported of report.actors) {
        const actor = findActorByUuid(reported.actorUuid, g);
        const live = actor ? planActorLegacyCleanup(actor, at) : null;
        if (!live?.updates) {
            summary.skipped += 1;
            continue;
        }
        const sig = (p) => JSON.stringify([p.skills?.status, p.skills?.xpRefund, p.skills?.skillPointsToFreeXp, p.conflictReasons]);
        if (sig(live) !== sig(reported)) {
            summary.skipped += 1;
            console.warn(`Mastery System | legacy cleanup: ${reported.actorName} changed since the report; skipped. Refresh the report.`);
            continue;
        }
        try {
            await actor.update(withBackup(actor, live.updates, at), migrationOptions());
            summary.actors += 1;
            if (live.conflictReasons.length)
                summary.conflicts += 1;
        }
        catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | legacy cleanup failed for ${reported.actorName}`, err);
        }
    }
    for (const change of report.items) {
        const owner = change.ownerUuid ? findActorByUuid(change.ownerUuid, g) : null;
        const item = change.ownerUuid && !owner ? null : findItem(owner, change.itemId, g);
        if (!item || isLegacyCleanupFlagged(item)) {
            summary.skipped += 1;
            continue;
        }
        try {
            const patch = powerItemUpdates(item, change, at);
            if (!patch) {
                summary.skipped += 1;
                continue;
            }
            await item.update(patch, migrationOptions());
            summary.items += 1;
            if (change.kind === 'conflict')
                summary.conflicts += 1;
        }
        catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | legacy cleanup failed for "${change.itemName}" (${change.ownerName})`, err);
        }
    }
    for (const change of report.artifacts) {
        const owner = change.ownerUuid ? findActorByUuid(change.ownerUuid, g) : null;
        const item = change.ownerUuid && !owner ? null : findItem(owner, change.itemId, g);
        if (!item || isLegacyCleanupFlagged(item)) {
            summary.skipped += 1;
            continue;
        }
        try {
            await item.update(buildArtifactUpdates(item, change, at), migrationOptions());
            summary.artifacts += 1;
            summary.conflicts += change.picks.filter((p) => p.kind === 'conflict').length;
        }
        catch (err) {
            summary.failed += 1;
            console.warn(`Mastery System | legacy cleanup failed for Artifact "${change.itemName}" (${change.ownerName})`, err);
        }
    }
    if (summary.failed === 0) {
        await g.settings.set(FLAG_SCOPE, LEGACY_CLEANUP_STATE_KEY, 'applied');
        try {
            await runPowerTemplateResyncMigration();
        }
        catch (err) {
            console.warn('Mastery System | post-legacy-cleanup resync failed', err);
        }
    }
    return summary;
}
/**
 * GM decision for a Skill conflict: archive and remove the legacy Skills with
 * the given Free XP refund (0 = archive only). Returns false when nothing was
 * in conflict.
 */
export async function resolveLegacySkillConflict(actor, decision) {
    const g = globalThis.game;
    if (g?.user && g.user.isGM === false)
        return false;
    const plan = planCharacterSkills(actor);
    if (!plan || plan.status !== 'conflict')
        return false;
    const at = new Date().toISOString();
    const decided = {
        ...plan,
        status: 'apply',
        xpRefund: Math.max(0, Math.floor(Number(decision.xpRefund) || 0)),
        xpSource: 'gm-decision',
    };
    const updates = buildCharacterSkillUpdates(actor, decided, at, {
        gmDecision: { at, xpRefund: decided.xpRefund, note: decision.note ?? '', reasons: plan.reasons },
    });
    updates[`${FLAGS}.-=${LC_CONFLICT_FLAG}`] = null;
    updates[`${FLAGS}.${LC_MIGRATED_FLAG}`] = true;
    await actor.update(withBackup(actor, updates, at), migrationOptions());
    return true;
}
/**
 * Restore one actor (and its items) from the legacy-cleanup backups and clear
 * the markers. Resets the world state to `pending` (unless disabled) so the
 * resync does not re-bake restored items before the GM reviews again.
 */
export async function rollbackActorLegacyCleanup(actor, options = {}) {
    let restored = 0;
    if (options.resetState !== false) {
        try {
            await globalThis.game?.settings?.set(FLAG_SCOPE, LEGACY_CLEANUP_STATE_KEY, 'pending');
        }
        catch (err) {
            console.warn('Mastery System | legacy cleanup rollback: state reset failed', err);
        }
    }
    const docs = [actor, ...docItems(actor)];
    for (const doc of docs) {
        const flags = srcFlags(doc);
        const marked = flags[LC_BACKUP_FLAG] || flags[LC_MIGRATED_FLAG] || flags[LC_CONFLICT_FLAG] || flags[LC_RETIRED_FLAG];
        if (!marked)
            continue;
        await doc.update(restoreFromBackup(flags[LC_BACKUP_FLAG]), migrationOptions());
        restored += 1;
    }
    return restored;
}
/* ------------------------------------------------------------------ */
/* World-load entry point                                              */
/* ------------------------------------------------------------------ */
/**
 * GM world load: build the dry-run report (reads only). A clean world is
 * marked `applied`; otherwise a persistent banner is shown and the review
 * dialog opens. Must run after the v0.9.9.6 dry run and before the resync.
 */
export async function runLegacyCleanupDryRunOnReady(g = globalThis.game) {
    if (!g?.user?.isGM)
        return null;
    if (getLegacyCleanupMigrationState() === 'applied')
        return null;
    const report = buildLegacyCleanupReport(g);
    if (!legacyCleanupReportHasChanges(report)) {
        await g.settings.set(FLAG_SCOPE, LEGACY_CLEANUP_STATE_KEY, 'applied');
        return report;
    }
    const v0996Ready = report.v0996State === 'applied';
    try {
        globalThis.ui?.notifications?.warn?.(`Legacy cleanup: ${report.actors.length} actor(s), ${report.items.length} power(s) and ${report.artifacts.length} Artifact(s) still carry retired Skill / Power data. ` +
            (v0996Ready
                ? 'Review and apply the migration (game.masterySystem.legacyCleanupReview()).'
                : 'Apply the Actives v0.9.9.6 migration first, then review this one (game.masterySystem.legacyCleanupReview()).') +
            ' Until then nothing is changed and the resync keeps the stored values.', { permanent: true });
    }
    catch {
        /* optional */
    }
    if (!v0996Ready)
        return report;
    try {
        const { openLegacyCleanupReview } = await import('./legacy-cleanup-2026-review-dialog.js');
        openLegacyCleanupReview(report);
    }
    catch (err) {
        console.warn('Mastery System | legacy cleanup review dialog failed to open', err);
    }
    return report;
}
//# sourceMappingURL=legacy-cleanup-2026-migration.js.map