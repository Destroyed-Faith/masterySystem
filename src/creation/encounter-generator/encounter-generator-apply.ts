/**
 * Encounter Generator — world write (folder + NPC actors).
 *
 * Creates a new Actor folder named after the encounter and populates it with
 * `npc` actors built from the (possibly edited) plan. No tokens are placed and
 * no Combat is created — the actors are ready to drag onto the canvas.
 */

import type {
  EnemyPhaseStat,
  EnemyStatBlock,
  EncounterPlan,
  EncounterSelection,
} from './encounter-generator-types.js';

declare const Folder: any;
declare const Actor: any;
declare const game: any;
declare const ui: any;

function attackRow(phase: EnemyPhaseStat) {
  return {
    name: 'Angriff',
    attackDiceCount: Math.max(2, Math.round(phase.attackDiceCount)),
    damageDiceCount: Math.max(1, Math.round(phase.damageDiceCount)),
    specials: [] as unknown[],
  };
}

function healthBlock(phase: EnemyPhaseStat) {
  const max = Math.max(1, Math.round(phase.hp));
  return {
    bars: [{ name: 'Healthy', max, current: max, penalty: 0 }],
    currentBar: 0,
    tempHP: 0,
  };
}

function combatBlock(phase: EnemyPhaseStat, block: EnemyStatBlock) {
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
function agilityForEvade(mr: number, evade: number): number {
  const extra = Math.max(0, Math.round(evade - mr * 4));
  return Math.max(2, Math.min(80, extra * 8));
}

/** Build the `system` payload for one enemy stat block. */
export function buildNpcSystem(block: EnemyStatBlock): Record<string, unknown> {
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

  const system: Record<string, unknown> = {
    attributes,
    mastery: { rank: block.mr, points: 0, experience: 0 },
    health: healthBlock(primaryPhase),
    combat: combatBlock(primaryPhase, block),
    savingThrows: { ...block.saves },
    npcBaseAttack: attackRow(primaryPhase),
    attackValues: [],
    attackSlots: Math.max(1, Math.round(block.attackSlots)),
    npcMovementSlots: Math.max(1, Math.round(block.movementSlots)),
    npcCombatSpecials: [],
    npcRaiseSpecials: [],
    npcActivePhaseIndex: 0,
  };

  if (isBoss) {
    system.phases = block.phases.map((phase) => ({
      name: phase.name,
      health: healthBlock(phase),
      combat: combatBlock(phase, block),
      savingThrows: { ...block.saves },
      npcBaseAttack: attackRow(phase),
      attackValues: [],
      statusEffects: [],
    }));
  }

  return system;
}

function bossActorName(folderName: string, block: EnemyStatBlock, count: number, index: number): string {
  if (count <= 1) return folderName;
  return `${folderName} - Boss ${index + 1}`;
}

function minionActorName(folderName: string, count: number, index: number): string {
  if (count <= 1) return `${folderName} - Minion`;
  return `${folderName} - Minion ${index + 1}`;
}

async function createEncounterFolder(name: string): Promise<any> {
  const trimmed = name.trim() || 'Encounter';
  return Folder.create({ name: trimmed, type: 'Actor', sorting: 'a' });
}

/**
 * Create the folder + NPC actors for the plan. Returns the number of actors
 * created, or null on failure.
 */
export async function applyEncounter(
  selection: EncounterSelection,
  plan: EncounterPlan,
): Promise<{ folderId: string; actorCount: number } | null> {
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

  const docs: Record<string, unknown>[] = [];

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
