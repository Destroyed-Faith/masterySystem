/**
 * NPC / Summon situational noncombat skill pools (DF Players Guide).
 * Not full PC Specializations — only a few scene pools: Nd8 keep MR.
 */
export const NPC_SITUATIONAL_SKILL_MAX_RANK = 8;
/** Guide starting ranges for competent opposition (MR 1–3). */
const PRESETS = {
    1: { capable: 3, specialist: 4 },
    2: { capable: 6, specialist: 8 },
    3: { capable: 10, specialist: 12 },
};
export function suggestNpcPool(masteryRank, preset) {
    const mr = Math.max(1, Math.floor(Number(masteryRank) || 1));
    if (mr <= 3)
        return PRESETS[mr][preset];
    // MR 4+: do not auto-extend +4; use Capable MR3 as a conservative baseline.
    return preset === 'specialist' ? 12 : 10;
}
export function newSituationalSkillId() {
    try {
        return globalThis.foundry?.utils?.randomID?.() ?? `nss-${Date.now()}`;
    }
    catch {
        return `nss-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }
}
function normalizeName(name) {
    return String(name || '')
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}
export function readSituationalSkills(system) {
    const raw = system?.situationalSkills;
    const list = Array.isArray(raw)
        ? raw
        : raw && typeof raw === 'object'
            ? Object.values(raw)
            : [];
    const out = [];
    for (const s of list) {
        if (!s || !String(s.name ?? '').trim())
            continue;
        const name = String(s.name).trim();
        out.push({
            id: String(s.id || newSituationalSkillId()),
            name,
            poolDice: Math.max(0, Math.floor(Number(s.poolDice) || 0)),
            skillRank: Math.max(0, Math.min(NPC_SITUATIONAL_SKILL_MAX_RANK, Math.floor(Number(s.skillRank) || 0))),
            ...(s.notes != null && String(s.notes).trim()
                ? { notes: String(s.notes).trim() }
                : {}),
        });
    }
    return out;
}
export function findSituationalSkillById(skills, id) {
    if (!id)
        return null;
    return skills.find((s) => s.id === id) ?? null;
}
export function findSituationalSkillByName(skills, name) {
    const norm = normalizeName(name);
    if (!norm)
        return null;
    return skills.find((s) => normalizeName(s.name) === norm) ?? null;
}
export function upsertSituationalSkill(skills, record, replaceId) {
    const next = [...skills];
    const id = replaceId || record.id;
    const idx = next.findIndex((s) => s.id === id);
    const cleaned = {
        id: record.id || id || newSituationalSkillId(),
        name: String(record.name || '').trim(),
        poolDice: Math.max(0, Math.floor(Number(record.poolDice) || 0)),
        skillRank: Math.max(0, Math.min(NPC_SITUATIONAL_SKILL_MAX_RANK, Math.floor(Number(record.skillRank) || 0))),
        ...(record.notes ? { notes: String(record.notes).trim() } : {}),
    };
    if (idx >= 0)
        next[idx] = cleaned;
    else
        next.push(cleaned);
    return next;
}
export function removeSituationalSkill(skills, id) {
    return skills.filter((s) => s.id !== id);
}
export function poolPreviewLabel(poolDice, masteryRank) {
    const n = Math.max(0, Math.floor(Number(poolDice) || 0));
    const k = Math.max(1, Math.floor(Number(masteryRank) || 1));
    const keep = Math.min(n, k);
    return `${n}k${keep}`;
}
/** Stable id for the required NPC Perception situational entry. */
export const NPC_PERCEPTION_SKILL_ID = 'nss-perception';
export function isNpcPerceptionSkill(skill) {
    return (String(skill.id || '') === NPC_PERCEPTION_SKILL_ID ||
        normalizeName(skill.name) === 'perception');
}
/**
 * Every NPC/Summon must have Perception. If missing, append Capable-pool Perception.
 * Does not overwrite an existing Perception entry (name match or stable id).
 */
export function ensureNpcHasPerception(system, masteryRank) {
    const skills = readSituationalSkills(system);
    if (findSituationalSkillByName(skills, 'Perception')) {
        return { skills, added: false };
    }
    const mr = Math.max(1, Math.floor(Number(masteryRank ?? system?.mastery?.rank) || 2));
    const next = upsertSituationalSkill(skills, {
        id: NPC_PERCEPTION_SKILL_ID,
        name: 'Perception',
        poolDice: suggestNpcPool(mr, 'capable'),
        skillRank: 0,
    });
    return { skills: next, added: true };
}
/**
 * Resolve an NPC Perception pool for combat gates.
 * 1) Situational skill named Perception
 * 2) null → caller may use legacy system.skills
 * Returns pool dice + skill rank when found.
 */
export function resolveNpcPerceptionSituational(system) {
    const { skills } = ensureNpcHasPerception(system);
    const found = findSituationalSkillByName(skills, 'Perception');
    if (!found)
        return null;
    return { poolDice: found.poolDice, skillRank: found.skillRank, name: found.name };
}
//# sourceMappingURL=npc-situational-skills.js.map