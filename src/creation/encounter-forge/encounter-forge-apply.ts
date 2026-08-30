/**
 * Encounter Forge — world write (folder + NPC actors + journal).
 *
 * The generated Actor is the SOURCE OF TRUTH: every solved value lands in
 * real, sheet-editable NPC fields (evade/armor/SR/DR% on the stat block,
 * attack rows, phases with own health pools, reactions, phasing charge
 * flags). The journal summarizes the same solution — it never contains
 * numbers the actor doesn't carry.
 *
 * No fake attributes: NPC combat math never reads attributes, so they stay
 * at schema defaults. The old Evade -> Agility back-calculation is gone.
 */

import type { EncounterDesign, MainEnemyConcept } from './encounter-model.js';
import type {
  EncounterSolution,
  SolvedAddGroup,
  SolvedEnemyPhase,
  SolvedPhase,
} from './solve-encounter.js';
import type { EncounterWarning } from './encounter-validator.js';
import type { SolvedAttack } from './offense-solver.js';
import { NPC_STANDARD_REACTIONS, newNpcReactionId } from '../../utils/npc-reactions.js';
import { getEffectBaseName, getEffectById } from '../../utils/special-effects.js';

declare const Folder: any;
declare const Actor: any;
declare const JournalEntry: any;
declare const game: any;
declare const ui: any;

/* ------------------------------------------------------------------ */
/* Attack rows                                                         */
/* ------------------------------------------------------------------ */

function specialDisplayName(id: string): string {
  const name = getEffectById(id)?.name;
  // Catalog names look like "Ruin(X)" — the row stores the bare name.
  return name ? getEffectBaseName(name) : id.charAt(0).toUpperCase() + id.slice(1);
}

export function solvedAttackToNpcRow(attack: SolvedAttack): Record<string, unknown> {
  const row: Record<string, unknown> = {
    name: attack.name,
    attackDiceCount: Math.max(1, attack.attackPool),
    damageDiceCount: Math.max(0, attack.damageDice),
    specials:
      attack.specialId && attack.specialValue > 0
        ? [{ special: specialDisplayName(attack.specialId), specialValue: attack.specialValue }]
        : [],
    npcAttacksPerRound: Math.min(5, Math.max(1, attack.usesPerRound)),
  };
  if (attack.resolution === 'spell') row.npcIsSpell = true;
  if (attack.stress) row.npcStressD8 = 1;
  if (attack.delivery === 'ranged') {
    row.npcRangeKind = 'ranged';
    row.npcRangeMeters = Math.min(48, Math.max(8, attack.range || 24));
    row.npcRangeMinMeters = 12;
  } else {
    row.npcRangeKind = 'melee';
    row.npcRangeMeters = Math.min(8, Math.max(1, attack.range || 2));
    row.npcRangeMinMeters = 0;
  }
  if (attack.area !== 'single') {
    row.npcAoeShape = attack.area === 'line' ? 'line' : attack.area === 'cone' ? 'cone' : 'radius';
    row.npcAoeRadiusM = Math.max(2, attack.areaSize);
  }
  return row;
}

/* ------------------------------------------------------------------ */
/* Blocks                                                              */
/* ------------------------------------------------------------------ */

function healthBlock(hp: number) {
  const max = Math.max(1, Math.round(hp));
  return { bars: [{ name: 'Healthy', max, current: max, penalty: 0 }], currentBar: 0, tempHP: 0 };
}

function combatBlock(solved: SolvedEnemyPhase, speed: number) {
  const d = solved.defensePackage.defenses;
  return {
    initiative: 0,
    evade: Math.round(d.evade),
    armor: Math.round(d.armor),
    speed,
    spellResistance: Math.round(d.spellResistance),
    damageReduction: Math.round(d.drPct),
  };
}

function reactionRows(enemy: MainEnemyConcept, solved: SolvedEnemyPhase): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const phase = enemy.phases[Math.min(solved.phaseIndex, enemy.phases.length - 1)];
  for (const r of phase.reactions) {
    const std = NPC_STANDARD_REACTIONS.find((s) => s.id === r.id);
    rows.push({
      id: newNpcReactionId(),
      name: r.customName?.trim() || std?.name || r.id,
      source: std ? 'basic' : 'custom',
      ...(std ? { basicId: r.id } : {}),
      specials: [],
    });
  }
  const parry = solved.defensePackage.defenses.parryStrip;
  if (parry > 0) {
    rows.push({
      id: newNpcReactionId(),
      name: `Parade — entzieht ${parry} Angriffswürfel (1×/Runde, stärkster Angriff)`,
      source: 'custom',
      specials: [],
    });
  }
  return rows;
}

function movementNote(enemy: MainEnemyConcept, phaseIndex: number): string {
  const phase = enemy.phases[Math.min(phaseIndex, enemy.phases.length - 1)];
  const m = phase.movement;
  const labels: Record<string, string> = {
    normal: 'Normale Bewegung',
    leap: 'Sprünge',
    flight: 'Flug',
    wallWalk: 'Wandlauf',
    teleport: 'Teleport',
    burrow: 'Graben',
    phaseShift: 'Phasenschritt',
  };
  const kind = (m.name && m.name.trim()) || labels[m.kind] || 'Normale Bewegung';
  return `${kind}${m.escapesMelee ? ' — entzieht sich zuverlässig dem Nahkampf' : ''}`;
}

/** Build the full NPC `system` payload for one solved enemy across phases. */
export function buildForgeNpcSystem(
  design: EncounterDesign,
  enemy: MainEnemyConcept,
  phases: SolvedPhase[],
): Record<string, unknown> {
  const solvedPerPhase = phases.map(
    (p) => p.enemies.find((e) => e.enemyId === enemy.id) as SolvedEnemyPhase,
  );
  const first = solvedPerPhase[0];
  const speed = 8;
  const firstRows = first.attacks.map(solvedAttackToNpcRow);
  const firstReactions = reactionRows(enemy, first);

  const bioParts: string[] = [];
  if (enemy.concept.trim()) bioParts.push(`<p>${enemy.concept.trim()}</p>`);
  bioParts.push(`<p><strong>Bewegung:</strong> ${movementNote(enemy, 0)}</p>`);
  if (first.defensePackage.defenses.ward > 0) {
    bioParts.push(
      `<p><strong>Ward ${first.defensePackage.defenses.ward}:</strong> Eingehende Special-Werte werden um ${first.defensePackage.defenses.ward} reduziert (im Balancing eingerechnet; am Tisch beim Anwenden von Specials abziehen).</p>`,
    );
  }
  if (enemy.copies.enabled && enemy.copies.count > 0) {
    bioParts.push(
      `<p><strong>Kopien:</strong> ${enemy.copies.count}× (${enemy.copies.health === 'shared' ? 'geteilte Health' : enemy.copies.fragile ? 'unabhängig, zerbrechlich (1 Treffer)' : 'unabhängig'})${enemy.copies.attack ? ', greifen mit an' : ''}.</p>`,
    );
  }

  const system: Record<string, unknown> = {
    mastery: { rank: first.mr, points: 0, experience: 0 },
    health: healthBlock(first.health),
    combat: combatBlock(first, speed),
    npcBaseAttack: firstRows[0] ?? {
      name: 'Angriff',
      attackDiceCount: 6,
      damageDiceCount: 3,
      specials: [],
    },
    attackValues: firstRows.slice(1),
    attackSlots: Math.max(1, first.offensiveActions),
    npcMovementSlots: 1,
    npcReactionSlots: firstReactions.length,
    npcReactions: firstReactions,
    npcActivePhaseIndex: 0,
    bio: { description: bioParts.join('') },
    creation: { complete: true },
  };

  if (phases.length > 1) {
    system.phases = solvedPerPhase.map((solved, i) => {
      const rows = solved.attacks.map(solvedAttackToNpcRow);
      const reactions = reactionRows(enemy, solved);
      const phaseConcept = enemy.phases[Math.min(i, enemy.phases.length - 1)];
      const note = phaseConcept.mechanicsNote.trim();
      return {
        name: note ? `Phase ${i + 1} — ${note.slice(0, 40)}` : `Phase ${i + 1}`,
        health: healthBlock(solved.health),
        combat: combatBlock(solved, speed),
        npcBaseAttack: rows[0] ?? system.npcBaseAttack,
        attackValues: rows.slice(1),
        npcReactionSlots: reactions.length,
        npcReactions: reactions,
        statusEffects: [],
      };
    });
  }

  return system;
}

/** Build the NPC `system` payload for one add group prototype. */
export function buildForgeAddSystem(add: SolvedAddGroup, npcMr: number): Record<string, unknown> {
  const row = add.attacks
    ? { ...solvedAttackToNpcRow(add.attacks), npcAttacksPerRound: 1 }
    : { name: 'Bedrängen (kein Angriff)', attackDiceCount: 0, damageDiceCount: 0, specials: [] };
  return {
    mastery: { rank: Math.max(1, npcMr - 1), points: 0, experience: 0 },
    health: healthBlock(add.healthPerAdd),
    combat: { initiative: 0, evade: 8, armor: 2, speed: 8, spellResistance: 0, damageReduction: 0 },
    npcBaseAttack: row,
    attackValues: [],
    attackSlots: 1,
    npcMovementSlots: 1,
    npcActivePhaseIndex: 0,
    bio: {
      description: `<p>Add-Prototyp — ${add.count}× aufstellen. Auftritt: Runde ${add.arrivalRound}.</p>`,
    },
    creation: { complete: true },
  };
}

/* ------------------------------------------------------------------ */
/* Journal                                                             */
/* ------------------------------------------------------------------ */

function fmt(n: number, digits = 1): string {
  return n.toFixed(digits).replace('.', ',');
}

export function buildForgeSummaryHtml(
  design: EncounterDesign,
  solution: EncounterSolution,
  warnings: EncounterWarning[],
): string {
  const parts: string[] = [];
  parts.push(`<h2>${design.name || 'Encounter'}</h2>`);
  parts.push(
    `<p>Gruppe: ${solution.party.size} Charaktere · Phasen: ${design.phaseCount} · Hauptgegner: ${design.enemies.length} · Erwartete Gesamtdauer: <strong>~${fmt(solution.totalExpectedRounds)} Runden</strong></p>`,
  );

  solution.phases.forEach((phase) => {
    parts.push(`<h3>Phase ${phase.phaseIndex + 1}</h3>`);
    const d = phase.durability;
    parts.push(
      `<p>Dauer erwartet <strong>${fmt(d.expectedPhaseRounds)}</strong> Runden (günstig ${fmt(d.favorableRounds)}, ungünstig ${fmt(d.unfavorableRounds)}, mit Opening-Burst ${fmt(d.burstRounds)}).` +
        (phase.enemies.length > 1
          ? ` Erster Gegner fällt ~Runde ${fmt(d.timeToFirstDrop)}; danach bleiben ${phase.hostileActionsAfterFirstDrop} feindliche Aktionen/Runde.`
          : '') +
        '</p>',
    );

    parts.push('<table><thead><tr><th>Gegner</th><th>Health</th><th>Verteidigungen (gemessener Anteil)</th><th>Aktionen</th><th>Angriffe</th></tr></thead><tbody>');
    for (const e of phase.enemies) {
      const defs = e.defensePackage.contributions
        .map((c) => `${c.kind} ${c.value} (${fmt(c.share * 100, 0)}%)`)
        .join(', ');
      const atks = e.attacks
        .map(
          (a) =>
            `${a.name}: ${a.attackPool}k${a.keep}, ${a.damageDice}d8${a.specialId ? `, ${specialDisplayName(a.specialId)}(${a.specialValue})` : ''}${a.usesPerRound > 1 ? ` ×${a.usesPerRound}` : ''}${a.occupancy ? ` — AoE (typisch ${a.occupancy.typical} Ziele)` : ''}`,
        )
        .join('<br>');
      parts.push(
        `<tr><td><strong>${e.enemyName}</strong></td><td>${e.health}</td><td>${defs}</td><td>${e.offensiveActions}</td><td>${atks}</td></tr>`,
      );
    }
    parts.push('</tbody></table>');

    if (phase.adds.length) {
      parts.push('<ul>');
      for (const a of phase.adds) {
        parts.push(
          `<li><strong>${a.name}</strong> ×${a.count} — Auftritt Runde ${a.arrivalRound}, ${a.healthPerAdd} HP${a.attacks ? `, Angriff ${a.attacks.attackPool}k, ${a.attacks.damageDice}d8` : ', greift nicht an'}</li>`,
        );
      }
      parts.push('</ul>');
    }

    const o = phase.offense;
    parts.push('<h4>Bedrohung pro Charakter</h4>');
    parts.push('<table><thead><tr><th>Charakter</th><th>HL-Verlust/Runde</th><th>HL-Verlust/Phase</th><th>Special-Spitze</th></tr></thead><tbody>');
    for (const pc of o.perPc) {
      parts.push(
        `<tr><td>${pc.name}</td><td>${fmt(pc.expectedHlLostPerRound, 2)}</td><td>${fmt(pc.expectedHlLostPerPhase, 2)}</td><td>${fmt(pc.peakSpecialStacks, 1)}</td></tr>`,
      );
    }
    parts.push('</tbody></table>');
    parts.push(
      `<p>Höchstes Risiko: <strong>${o.highestRiskPcName}</strong>. Härtester Einzeltreffer (90. Perzentil): „${o.worstSingleHitAttackName}" vs ${o.worstSingleHitTargetName} ≈ ${fmt(o.worstSingleHitQ90 * 100, 0)}% der Gesamt-HP.</p>`,
    );
  });

  if (warnings.length) {
    parts.push('<h3>Warnungen</h3><ul>');
    for (const w of warnings) {
      const icon = w.severity === 'strong' ? '⛔' : w.severity === 'warn' ? '⚠' : 'ℹ';
      parts.push(`<li>${icon} ${w.message}</li>`);
    }
    parts.push('</ul>');
  }

  parts.push('<h3>Diagnostik</h3><ul>');
  for (const d of solution.diagnostics) parts.push(`<li><code>${d}</code></li>`);
  parts.push('</ul>');
  return parts.join('');
}

/* ------------------------------------------------------------------ */
/* World write                                                         */
/* ------------------------------------------------------------------ */

export async function applyEncounterForge(
  design: EncounterDesign,
  solution: EncounterSolution,
  warnings: EncounterWarning[],
): Promise<{ folderId: string; actorCount: number } | null> {
  if (!game.user?.isGM) {
    ui?.notifications?.warn('Nur der Spielleiter kann Encounter erzeugen.');
    return null;
  }
  const name = design.name.trim() || 'Encounter';
  const root = await Folder.create({ name, type: 'Actor', sorting: 'a' });
  if (!root) {
    ui?.notifications?.error('Ordner konnte nicht erstellt werden.');
    return null;
  }
  const addsFolder =
    solution.phases.some((p) => p.adds.length > 0)
      ? await Folder.create({ name: 'Adds', type: 'Actor', sorting: 'a', folder: root.id })
      : null;

  const flag = { forge: true, schema: design.schema, generatedAt: Date.now() };
  const docs: Record<string, unknown>[] = [];

  for (const enemy of design.enemies) {
    const solvedFirst = solution.phases[0].enemies.find((e) => e.enemyId === enemy.id);
    const phasing = solvedFirst?.defensePackage.defenses.phasingCharges ?? 0;
    docs.push({
      name: enemy.name || name,
      type: 'npc',
      folder: root.id,
      system: buildForgeNpcSystem(design, enemy, solution.phases),
      flags: {
        'mastery-system': {
          encounter: { ...flag, role: 'main', phases: design.phaseCount },
          ...(phasing > 0
            ? {
                phasingCharges: {
                  max: phasing,
                  current: phasing,
                  combatId: null,
                  sources: {
                    forge: {
                      ownerKind: 'generated',
                      ownerId: 'encounter-forge',
                      name: 'Phasing (generiert)',
                      charges: phasing,
                    },
                  },
                },
              }
            : {}),
        },
      },
    });
  }

  const npcMr = solution.phases[0]?.enemies[0]?.mr ?? 2;
  const seenAddGroups = new Set<string>();
  for (const phase of solution.phases) {
    for (const add of phase.adds) {
      if (seenAddGroups.has(add.groupId)) continue;
      seenAddGroups.add(add.groupId);
      docs.push({
        name: `${name} — ${add.name}`,
        type: 'npc',
        folder: addsFolder?.id ?? root.id,
        system: buildForgeAddSystem(add, npcMr),
        flags: { 'mastery-system': { encounter: { ...flag, role: 'add' } } },
      });
    }
  }

  await Actor.createDocuments(docs);

  try {
    await JournalEntry.create({
      name: `${name} — Encounter`,
      pages: [
        {
          name: 'Encounter Summary',
          type: 'text',
          text: { content: buildForgeSummaryHtml(design, solution, warnings), format: 1 },
        },
      ],
    });
  } catch (error) {
    console.warn('Mastery System | Encounter journal creation failed', error);
  }

  return { folderId: root.id, actorCount: docs.length };
}
