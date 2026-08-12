/**
 * Encounter Generator — world write (folder + NPC actors).
 *
 * Creates a new Actor folder named after the encounter and populates it with
 * `npc` actors built from the (possibly edited) plan. No tokens are placed and
 * no Combat is created — the actors are ready to drag onto the canvas.
 */
import { specialLabel } from './encounter-generator-concept.js';
function attackRow(phase) {
    return {
        name: 'Angriff',
        attackDiceCount: Math.max(2, Math.round(phase.attackDiceCount)),
        damageDiceCount: Math.max(1, Math.round(phase.damageDiceCount)),
        specials: [],
    };
}
function healthBlock(phase) {
    const max = Math.max(1, Math.round(phase.hp));
    return {
        bars: [{ name: 'Healthy', max, current: max, penalty: 0 }],
        currentBar: 0,
        tempHP: 0,
    };
}
function combatBlock(phase, block) {
    return {
        initiative: 0,
        // Display/fallback values. The to-hit pipeline uses MR + agility (evadeTotal)
        // and MR (armorTotal); evade/armor here keep the sheet readable.
        evade: Math.round(phase.evade),
        armor: Math.round(phase.armor),
        speed: block.speed,
    };
}
/**
 * Agility that realizes the intended evade in-engine: evade = MR*4 +
 * floor(agility/8). Derived from the (possibly edited) primary-phase evade so
 * review edits are honored. Capped at 80 (+10 evade); below MR*4 the engine
 * floors evade at MR*4.
 */
function agilityForEvade(mr, evade) {
    const extra = Math.max(0, Math.round(evade - mr * 4));
    return Math.max(2, Math.min(80, extra * 8));
}
/** Build the `system` payload for one enemy stat block. */
export function buildNpcSystem(block) {
    const primaryPhase = block.phases[0];
    const isBoss = block.kind === 'boss' && block.phases.length > 1;
    const attributes = {
        might: { value: 2, stones: 0 },
        agility: { value: agilityForEvade(block.mr, primaryPhase.evade), stones: 0 },
        vitality: { value: 2, stones: 0 },
        intellect: { value: 2, stones: 0 },
        resolve: { value: 2, stones: 0 },
        influence: { value: 2, stones: 0 },
        wits: { value: 2, stones: 0 },
    };
    const system = {
        attributes,
        mastery: { rank: block.mr, points: 0, experience: 0 },
        health: healthBlock(primaryPhase),
        combat: combatBlock(primaryPhase, block),
        npcBaseAttack: attackRow(primaryPhase),
        attackValues: [],
        attackSlots: Math.max(1, Math.round(block.attackSlots)),
        npcMovementSlots: Math.max(1, Math.round(block.movementSlots)),
        npcActivePhaseIndex: 0,
    };
    if (isBoss) {
        system.phases = block.phases.map((phase) => ({
            name: phase.name,
            health: healthBlock(phase),
            combat: combatBlock(phase, block),
            npcBaseAttack: attackRow(phase),
            attackValues: [],
            statusEffects: [],
        }));
    }
    return system;
}
function bossActorName(folderName, block, count, index) {
    if (count <= 1)
        return folderName;
    return `${folderName} - Boss ${index + 1}`;
}
function minionActorName(folderName, count, index) {
    if (count <= 1)
        return `${folderName} - Minion`;
    return `${folderName} - Minion ${index + 1}`;
}
async function createEncounterFolder(name) {
    const trimmed = name.trim() || 'Encounter';
    return Folder.create({ name: trimmed, type: 'Actor', sorting: 'a' });
}
/**
 * Create the folder + NPC actors for the plan. Returns the number of actors
 * created, or null on failure.
 */
export async function applyEncounter(selection, plan) {
    if (!game.user?.isGM) {
        ui?.notifications?.warn('Nur der Spielleiter kann Encounter erzeugen.');
        return null;
    }
    const folder = await createEncounterFolder(selection.folderName);
    if (!folder) {
        ui?.notifications?.error('Ordner konnte nicht erstellt werden.');
        return null;
    }
    const folderName = selection.folderName.trim() || 'Encounter';
    const encounterFlag = {
        difficulty: plan.difficulty,
        respawn: plan.respawn,
        generatedAt: Date.now(),
    };
    const docs = [];
    plan.bosses.forEach((boss, index) => {
        docs.push({
            name: bossActorName(folderName, boss, plan.bosses.length, index),
            type: 'npc',
            folder: folder.id,
            system: buildNpcSystem(boss),
            flags: {
                'mastery-system': {
                    encounter: { ...encounterFlag, role: 'boss', phases: boss.phases.length },
                },
            },
        });
    });
    plan.minions.forEach((minion, index) => {
        docs.push({
            name: minionActorName(folderName, plan.minions.length, index),
            type: 'npc',
            folder: folder.id,
            system: buildNpcSystem(minion),
            flags: {
                'mastery-system': {
                    encounter: { ...encounterFlag, role: 'minion' },
                },
            },
        });
    });
    if (docs.length === 0) {
        return { folderId: folder.id, actorCount: 0 };
    }
    await Actor.createDocuments(docs);
    return { folderId: folder.id, actorCount: docs.length };
}
// ─── Concept-driven Encounter-Projekt (v2 flow) ──────────────────────────
/** Map one power-cycle entry onto an NPC attack row. */
function cycleEntryToAttackRow(entry) {
    const specials = entry.special
        ? [{ special: entry.special, specialValue: entry.specialValue }]
        : [];
    const row = {
        name: entry.isSummon ? `${entry.name} (Aktion, kein Angriff)` : entry.name,
        attackDiceCount: Math.max(entry.isSummon ? 0 : 2, Math.round(entry.attackDiceCount)),
        damageDiceCount: Math.max(0, Math.round(entry.damageDiceCount)),
        specials,
    };
    if (entry.rangeKind === 'ranged') {
        row.npcRangeKind = 'ranged';
        const maxM = Math.min(24, Math.max(12, Math.round(entry.rangeMeters || 24)));
        row.npcRangeMeters = maxM;
        row.npcRangeMinMeters = 12;
    }
    else if (entry.rangeMeters != null) {
        row.npcRangeMeters = Math.min(8, Math.max(1, Math.round(entry.rangeMeters || 2)));
    }
    if (entry.aoe) {
        row.npcAoeShape = entry.aoe.shape;
        row.npcAoeRadiusM = Math.max(2, Math.round(entry.aoe.radiusM));
    }
    if (entry.stressD8 && entry.stressD8 > 0) {
        row.npcStressD8 = Math.max(1, Math.round(entry.stressD8));
    }
    if (!entry.isSummon && entry.isSpell) {
        row.npcIsSpell = true;
    }
    if (!entry.isSummon) {
        const apr = Math.floor(Number(entry.attacksPerRound));
        row.npcAttacksPerRound =
            Number.isFinite(apr) && apr >= 1 ? Math.min(5, apr) : 1;
    }
    return row;
}
function projectHealthBlock(hp) {
    const max = Math.max(1, Math.round(hp));
    return { bars: [{ name: 'Healthy', max, current: max, penalty: 0 }], currentBar: 0, tempHP: 0 };
}
function projectCombatBlock(stat, speed) {
    return {
        initiative: 0,
        evade: Math.round(stat.evade),
        armor: Math.round(stat.armor),
        speed,
    };
}
function tacticsHtml(plan) {
    const lines = [];
    lines.push('<h3>Taktik</h3><ul>');
    for (const t of plan.tactics)
        lines.push(`<li>${t}</li>`);
    lines.push('</ul>');
    if (plan.phasePlans.length > 1) {
        lines.push('<h3>Phasen</h3><ul>');
        for (const p of plan.phasePlans) {
            lines.push(`<li><strong>${p.name}</strong>: ${p.changes.join(' · ')}</li>`);
        }
        lines.push('</ul>');
    }
    return lines.join('');
}
/** Build the boss actor `system` payload from a concept plan. */
export function buildProjectBossSystem(plan) {
    const boss = plan.boss;
    const primary = plan.phasePlans[0];
    const primaryRows = primary.cycle.map(cycleEntryToAttackRow);
    const attributes = {
        might: { value: 2, stones: 0 },
        agility: { value: boss.agility, stones: 0 },
        vitality: { value: 2, stones: 0 },
        intellect: { value: 2, stones: 0 },
        resolve: { value: 2, stones: 0 },
        influence: { value: 2, stones: 0 },
        wits: { value: 2, stones: 0 },
    };
    const primaryAprSum = Math.max(1, primary.cycle
        .filter((c) => !c.isSummon)
        .reduce((s, c) => s + Math.min(5, Math.max(1, Math.floor(Number(c.attacksPerRound) || 1))), 0));
    const system = {
        attributes,
        mastery: { rank: boss.mr, points: 0, experience: 0 },
        health: projectHealthBlock(primary.stat.hp),
        combat: projectCombatBlock(primary.stat, boss.speed),
        npcBaseAttack: primaryRows[0] ?? { name: 'Angriff', attackDiceCount: 4, damageDiceCount: 3, specials: [] },
        attackValues: primaryRows.slice(1),
        // ATK = Summe der Angriffe/Runde-Kopien.
        attackSlots: primaryAprSum,
        npcMovementSlots: Math.max(0, Math.round(boss.movementSlots)),
        npcActivePhaseIndex: 0,
        bio: { description: tacticsHtml(plan) },
    };
    if (plan.phasePlans.length > 1) {
        system.phases = plan.phasePlans.map((phase) => {
            const rows = phase.cycle.map(cycleEntryToAttackRow);
            return {
                name: phase.name,
                health: projectHealthBlock(phase.stat.hp),
                combat: projectCombatBlock(phase.stat, boss.speed),
                npcBaseAttack: rows[0] ?? { name: 'Angriff', attackDiceCount: 4, damageDiceCount: 3, specials: [] },
                attackValues: rows.slice(1),
                statusEffects: [],
            };
        });
    }
    return system;
}
/** Build the add prototype actor `system` payload. */
export function buildProjectAddSystem(plan) {
    const adds = plan.adds;
    if (!adds)
        return null;
    const d = adds.design;
    const stat = {
        name: 'Add',
        hp: d.hp,
        evade: d.evade,
        armor: d.armor,
        attackDiceCount: d.attackDiceCount,
        damageDiceCount: d.damageDiceCount,
    };
    return {
        attributes: {
            might: { value: 2, stones: 0 },
            agility: { value: 2, stones: 0 },
            vitality: { value: 2, stones: 0 },
            intellect: { value: 2, stones: 0 },
            resolve: { value: 2, stones: 0 },
            influence: { value: 2, stones: 0 },
            wits: { value: 2, stones: 0 },
        },
        mastery: { rank: d.mr, points: 0, experience: 0 },
        health: projectHealthBlock(d.hp),
        combat: projectCombatBlock(stat, 8),
        npcBaseAttack: {
            name: 'Biss/Hieb',
            attackDiceCount: d.attackDiceCount,
            damageDiceCount: d.damageDiceCount,
            npcAttacksPerRound: 1,
            specials: d.special ? [{ special: d.special, specialValue: d.specialValue }] : [],
        },
        attackValues: [],
        attackSlots: 1,
        npcMovementSlots: 1,
        npcActivePhaseIndex: 0,
        bio: {
            description: `<p>Add-Prototyp — bei Bedarf duplizieren. Spawn: ${adds.spawnPerRound}/Runde, max. ${adds.maxActive} aktiv.` +
                ` Erwartete Lebensdauer ~${d.expectedLifetimeRounds} Runden, Add Threat ≈ ${d.addThreat} Schaden.</p>`,
        },
    };
}
/** Environment mechanic actor (zones roll their own damage). */
export function buildProjectEnvironmentSystem(plan) {
    const env = plan.environment;
    if (!env)
        return null;
    return {
        attributes: {
            might: { value: 2, stones: 0 },
            agility: { value: 2, stones: 0 },
            vitality: { value: 2, stones: 0 },
            intellect: { value: 2, stones: 0 },
            resolve: { value: 2, stones: 0 },
            influence: { value: 2, stones: 0 },
            wits: { value: 2, stones: 0 },
        },
        mastery: { rank: 1, points: 0, experience: 0 },
        health: projectHealthBlock(1),
        combat: { initiative: 0, evade: 0, armor: 0, speed: 0 },
        npcBaseAttack: {
            name: env.zoneName,
            attackDiceCount: 2,
            damageDiceCount: env.damageDiceCount,
            npcAoeShape: 'radius',
            npcAoeRadiusM: env.radiusM,
            npcIsSpell: true,
            npcAttacksPerRound: Math.min(5, Math.max(1, Math.round(env.actionsPerRound) || 1)),
            specials: env.special ? [{ special: env.special, specialValue: env.specialValue }] : [],
        },
        attackValues: [],
        attackSlots: Math.max(1, env.actionsPerRound),
        npcMovementSlots: 0,
        npcActivePhaseIndex: 0,
        bio: { description: `<p>${env.description}</p>` },
    };
}
function fmtSpecial(special, value) {
    if (!special)
        return '—';
    return `${specialLabel(special)}(${value})`;
}
function cycleTableHtml(cycle, cycleStyle) {
    const rows = cycle.map((c) => {
        const range = c.aoe
            ? `${c.rangeKind === 'melee' ? 'Nah' : `${c.rangeMeters} m`} · AoE ${c.aoe.radiusM} m`
            : c.rangeKind === 'melee'
                ? 'Nahkampf'
                : `${c.rangeMeters} m`;
        const extra = cycleStyle === 'weighted' && c.weight != null
            ? `${c.weight}%`
            : cycleStyle === 'conditional' && c.condition
                ? c.condition
                : '';
        const pool = c.isSummon ? '—' : `${c.attackDiceCount}k?`;
        const dmg = c.isSummon
            ? '—'
            : `${c.damageDiceCount}d8${c.stressD8 ? ` + ${c.stressD8}d8 Stress` : ''}`;
        const flags = c.isSummon
            ? ''
            : [
                c.isSpell ? 'Spell' : null,
                c.attacksPerRound && c.attacksPerRound > 0 ? `${c.attacksPerRound}×/Runde` : null,
            ]
                .filter(Boolean)
                .join(' · ');
        return `<tr><td>${c.slot}</td><td><strong>${c.name}</strong></td><td>${pool}</td><td>${dmg}</td><td>${fmtSpecial(c.special, c.specialValue)}</td><td>${range}</td><td>${[flags, extra || c.note || ''].filter(Boolean).join(' — ')}</td></tr>`;
    });
    return ('<table><thead><tr><th>#</th><th>Power</th><th>Pool</th><th>Schaden</th><th>Special</th><th>Reichweite</th><th>Hinweis</th></tr></thead><tbody>' +
        rows.join('') +
        '</tbody></table>');
}
/** Compact "2-page" NPC sheet as journal HTML (printable via browser). */
export function buildNpcSheetHtml(name, plan) {
    const boss = plan.boss;
    const parts = [];
    parts.push(`<h2>${name}</h2>`);
    parts.push('<h3>Seite 1 — Werte &amp; Defensive</h3>');
    parts.push('<table><tbody>');
    parts.push(`<tr><td>Mastery Rank</td><td>${boss.mr}</td></tr>`);
    parts.push(`<tr><td>Aktionen/Runde</td><td>${plan.phasePlans[0].actionsPerRound}</td></tr>`);
    parts.push(`<tr><td>Bewegung</td><td>${boss.speed} m</td></tr>`);
    for (const p of plan.phasePlans) {
        parts.push(`<tr><td>${p.name}</td><td>HP ${p.stat.hp} · Ausweichen ${p.stat.evade} · Rüstung ${p.stat.armor}</td></tr>`);
    }
    parts.push('</tbody></table>');
    parts.push('<h3>Seite 2 — Power Cycle</h3>');
    plan.phasePlans.forEach((p) => {
        if (plan.phasePlans.length > 1)
            parts.push(`<h4>${p.name}</h4>`);
        if (p.changes.length)
            parts.push(`<p><em>${p.changes.join(' · ')}</em></p>`);
        parts.push(cycleTableHtml(p.cycle, plan.concept.cycleStyle));
    });
    if (plan.tactics.length) {
        parts.push('<h3>Tactics</h3><ul>');
        for (const t of plan.tactics)
            parts.push(`<li>${t}</li>`);
        parts.push('</ul>');
    }
    return parts.join('');
}
/** Encounter summary page (threat report, spawn rules, warnings). */
export function buildSummaryHtml(name, plan, report, party) {
    const parts = [];
    parts.push(`<h2>${name} — Encounter Summary</h2>`);
    parts.push(`<p>Rank: <strong>${plan.concept.rank}</strong> · Style: <strong>${plan.concept.style}</strong>` +
        ` · Primary Special: <strong>${plan.concept.primarySpecial === 'none' ? '—' : specialLabel(plan.concept.primarySpecial)}</strong>` +
        ` · Phasen: <strong>${plan.phasePlans.length}</strong> · Gruppe: ${party.size} Charaktere (Median MR ${party.medianMR})</p>`);
    parts.push('<h3>Threat Report</h3><table><tbody>');
    parts.push(`<tr><td>Trefferchance (niedrig/Ø/hoch Ausweichen)</td><td>${report.hitChanceLowEvade}% / ${report.hitChanceAvgEvade}% / ${report.hitChanceHighEvade}%</td></tr>`);
    if (report.hitChanceAreaTn != null) {
        parts.push(`<tr><td>AoE-Trefferchance (pro Kreatur vs Ø Ausweichen)</td><td>${report.hitChanceAreaTn}%</td></tr>`);
    }
    parts.push(`<tr><td>Erwarteter Schaden pro Treffer (vor Rüstung)</td><td>${report.expectedHitDamageRaw}</td></tr>`);
    parts.push(`<tr><td>… nach Ø Rüstung/DR</td><td>${report.expectedHitDamageAfterArmor}</td></tr>`);
    parts.push(`<tr><td>Persistenter / rüstungsignorierender Schaden pro Runde</td><td>${report.persistentDamagePerRound}</td></tr>`);
    parts.push(`<tr><td>Max. Runde-1-Burst auf ein Ziel</td><td>${report.firstRoundBurstOneTarget} (≈ ${report.firstRoundBurstHealthLevels} Health Levels)</td></tr>`);
    parts.push(`<tr><td>Erwarteter Gruppenschaden pro Runde</td><td>${report.expectedGroupDamagePerRound} (≈ ${report.expectedGroupDamageHealthLevels} Health Levels)</td></tr>`);
    if (plan.environment) {
        parts.push(`<tr><td>Umgebungs-/Zonenschaden pro Runde</td><td>${report.environmentDamagePerRound}</td></tr>`);
    }
    parts.push(`<tr><td>Gegnerische Aktionen (R1→R5, inkl. Adds)</td><td>${report.enemyActionsByRound.join(' → ')}</td></tr>`);
    parts.push(`<tr><td>Erwartete Kampfdauer</td><td>~${report.expectedDurationRounds} Runden</td></tr>`);
    parts.push(`<tr><td>Runde-1-Verlust des zerbrechlichsten Charakters</td><td>≈ ${report.round1HealthLevelsLowestPc} Health Levels</td></tr>`);
    parts.push('</tbody></table>');
    if (plan.adds) {
        const a = plan.adds;
        parts.push('<h3>Adds &amp; Spawn-Regeln</h3><table><tbody>');
        parts.push(`<tr><td>Spawn</td><td>${a.spawnPerRound} pro Runde (${a.spawnPattern})${a.summonCostsBossAction ? ' — kostet je 1 Boss-Aktion' : ''}</td></tr>`);
        parts.push(`<tr><td>Ziel-Population / Maximum</td><td>${a.targetActive} / ${a.maxActive}</td></tr>`);
        parts.push(`<tr><td>Aktive Adds (R1→R5)</td><td>${a.projectedActive.join(' → ')}</td></tr>`);
        parts.push(`<tr><td>Add-Angriffe pro Runde (R1→R5)</td><td>${a.projectedAttacks.join(' → ')}</td></tr>`);
        parts.push(`<tr><td>Add-Werte</td><td>HP ${a.design.hp} · Rüstung ${a.design.armor} · Ausweichen ${a.design.evade} · ${a.design.attackDiceCount}k? / ${a.design.damageDiceCount}d8</td></tr>`);
        parts.push(`<tr><td>Add Threat (Actions bis Tod × Bedrohung/Action)</td><td>${a.design.expectedLifetimeRounds} × ${a.design.threatPerAction} ≈ <strong>${a.design.addThreat}</strong></td></tr>`);
        parts.push(`<tr><td>Gruppenschaden bei voller Population</td><td>${a.groupDamageAtFullPop} pro Runde</td></tr>`);
        parts.push(`<tr><td>Spieler-Aktionen zum Räumen</td><td>${a.playerActionsToClear.min}–${a.playerActionsToClear.max}</td></tr>`);
        parts.push('</tbody></table>');
    }
    if (plan.environment) {
        parts.push('<h3>Arena / Umgebungsmechanik</h3>');
        parts.push(`<p>${plan.environment.description}</p>`);
    }
    if (plan.phasePlans.length > 1) {
        parts.push('<h3>Phasen</h3><ul>');
        for (const p of plan.phasePlans) {
            parts.push(`<li><strong>${p.name}</strong> — ${p.changes.join(' · ')}${p.addsActive ? '' : ' · (keine neuen Adds)'}</li>`);
        }
        parts.push('</ul>');
    }
    if (plan.notes.length) {
        parts.push('<h3>Hinweise</h3><ul>');
        for (const n of plan.notes)
            parts.push(`<li>${n}</li>`);
        parts.push('</ul>');
    }
    if (report.warnings.length) {
        parts.push('<h3>Balancing-Warnungen</h3><ul>');
        for (const w of report.warnings)
            parts.push(`<li>⚠ ${w}</li>`);
        parts.push('</ul>');
    }
    return parts.join('');
}
/**
 * Create the full Encounter-Projekt: folder tree (Boss / Adds / Encounter
 * Mechanics), the actors, and the summary journal with print sheets.
 */
export async function applyEncounterProject(name, party, plan, report) {
    if (!game.user?.isGM) {
        ui?.notifications?.warn('Nur der Spielleiter kann Encounter erzeugen.');
        return null;
    }
    const trimmed = name.trim() || 'Encounter';
    const root = await Folder.create({ name: trimmed, type: 'Actor', sorting: 'a' });
    if (!root) {
        ui?.notifications?.error('Ordner konnte nicht erstellt werden.');
        return null;
    }
    const bossFolder = await Folder.create({ name: 'Boss', type: 'Actor', sorting: 'a', folder: root.id });
    const addsFolder = plan.adds
        ? await Folder.create({ name: 'Adds', type: 'Actor', sorting: 'a', folder: root.id })
        : null;
    const mechFolder = plan.environment
        ? await Folder.create({ name: 'Encounter Mechanics', type: 'Actor', sorting: 'a', folder: root.id })
        : null;
    const flag = {
        concept: plan.concept,
        difficulty: plan.difficulty,
        generatedAt: Date.now(),
    };
    const docs = [];
    docs.push({
        name: trimmed,
        type: 'npc',
        folder: bossFolder?.id ?? root.id,
        system: buildProjectBossSystem(plan),
        flags: { 'mastery-system': { encounter: { ...flag, role: 'boss', phases: plan.phasePlans.length } } },
    });
    const addSystem = buildProjectAddSystem(plan);
    if (addSystem && addsFolder) {
        docs.push({
            name: `${trimmed} — Add`,
            type: 'npc',
            folder: addsFolder.id,
            system: addSystem,
            flags: { 'mastery-system': { encounter: { ...flag, role: 'add' } } },
        });
    }
    const envSystem = buildProjectEnvironmentSystem(plan);
    if (envSystem && mechFolder) {
        docs.push({
            name: `${trimmed} — ${plan.environment?.zoneName ?? 'Arena'}`,
            type: 'npc',
            folder: mechFolder.id,
            system: envSystem,
            flags: { 'mastery-system': { encounter: { ...flag, role: 'mechanic' } } },
        });
    }
    await Actor.createDocuments(docs);
    // Summary journal with printable sheets.
    try {
        const pages = [
            {
                name: 'Encounter Summary',
                type: 'text',
                text: { content: buildSummaryHtml(trimmed, plan, report, party), format: 1 },
            },
            {
                name: `${trimmed} — NPC Sheet`,
                type: 'text',
                text: { content: buildNpcSheetHtml(trimmed, plan), format: 1 },
            },
        ];
        await JournalEntry.create({ name: `${trimmed} — Encounter`, pages });
    }
    catch (error) {
        console.warn('Mastery System | Encounter journal creation failed', error);
    }
    return { folderId: root.id, actorCount: docs.length };
}
//# sourceMappingURL=encounter-generator-apply.js.map