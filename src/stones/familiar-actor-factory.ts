/**
 * Create summon actors and place tokens from Summon Bonds (V2) or legacy familiars.
 */

import type { BoundFamiliarRecord } from './familiar-bind.js';
import { parseD8Count } from './familiar-bind.js';
import { getSharedSenseLabel } from './familiar-bind.js';
import type { SummonBondRecord, SummonBodyRecord } from './summon-bond-bind.js';

const DEFAULT_SUMMON_IMG = 'icons/creatures/mammals/wolf-shadow-black.webp';
const SUMMON_BLOOD_COLOR = '#4a148c';

function tokenFriendly(): number {
  return (globalThis as any).CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
}

function ownershipLevel(kind: 'OWNER' | 'OBSERVER'): number {
  const levels = (globalThis as any).CONST?.DOCUMENT_OWNERSHIP_LEVELS;
  if (kind === 'OWNER') return levels?.OWNER ?? 3;
  return levels?.OBSERVER ?? 2;
}

/** OWNER for every GM and the player assigned to the owner character (e.g. Fin). */
export function buildSummonActorOwnership(
  ownerActor: any,
  users?: Iterable<any> | null,
  currentUserId?: string | null,
): Record<string, number> {
  const OWNER = ownershipLevel('OWNER');
  const ownership: Record<string, number> = {
    default: ownershipLevel('OBSERVER'),
  };
  const ownerId = String(ownerActor?.id ?? '');
  for (const user of users ?? []) {
    if (!user?.id) continue;
    if (user.isGM) ownership[user.id] = OWNER;
    if (ownerId && user.character?.id === ownerId) ownership[user.id] = OWNER;
  }
  for (const [uid, level] of Object.entries(ownerActor?.ownership ?? {})) {
    if (uid === 'default') continue;
    if (Number(level) >= OWNER) ownership[uid] = OWNER;
  }
  if (currentUserId) ownership[currentUserId] = OWNER;
  return ownership;
}

async function ensureFamiliarsFolder(ownerName: string): Promise<Folder | null> {
  const parentName = 'Summons';
  let parent = (game as any).folders?.find(
    (f: Folder) => f.type === 'Actor' && f.name === parentName && !f.folder,
  );
  if (!parent) {
    parent = await Folder.create({ name: parentName, type: 'Actor', sorting: 'a' });
  }
  const childName = ownerName.trim() || 'Unnamed';
  let child = (game as any).folders?.find(
    (f: Folder) => f.type === 'Actor' && f.name === childName && f.folder === parent?.id,
  );
  if (!child) {
    child = await Folder.create({
      name: childName,
      type: 'Actor',
      folder: parent?.id,
      sorting: 'a',
    });
  }
  return child ?? null;
}

export function buildSummonActorData(
  familiar: BoundFamiliarRecord,
  ownerActor: any,
): Record<string, unknown> {
  const stats = familiar.stats;
  const hp = stats.hp;
  const attackDice = parseD8Count(stats.attack);
  const damageDice = parseD8Count(stats.damage);
  const senseLines = familiar.sharedSenses.map(
    (s) => getSharedSenseLabel(s.group),
  );

  return {
    name: familiar.name,
    type: 'summon',
    img: familiar.img || DEFAULT_SUMMON_IMG,
    prototypeToken: {
      texture: { src: familiar.img || DEFAULT_SUMMON_IMG },
      actorLink: false,
      disposition: tokenFriendly(),
    },
    system: {
      bio: {
        name: familiar.name,
        summonType: 'Familiar',
        duration: 'Permanent (bound)',
        description: `Bound familiar of ${ownerActor.name}. Size: ${familiar.size}. Movement: ${stats.movementM} m (${familiar.movementType}).`,
      },
      familiar: {
        familiarId: familiar.id,
        ownerActorId: familiar.ownerActorId,
        movementType: familiar.movementType,
        size: familiar.size,
        sharedSenses: familiar.sharedSenses.map((s) => s.group),
        boundStoneCount: familiar.boundStoneCount,
      },
      health: {
        bars: [{ name: 'Healthy', max: hp, current: hp, penalty: 0 }],
        currentBar: 0,
        tempHP: 0,
      },
      combat: {
        evade: stats.evade,
        armor: stats.armor,
        speed: stats.movementM,
      },
      npcBaseAttack: {
        name: 'Familiar Attack',
        attackDiceCount: attackDice,
        damageDiceCount: damageDice,
        specials: [],
      },
      attackValues: [],
      attackSlots: 1,
      npcMovementSlots: 1,
      notes: senseLines.length
        ? `Shared senses: ${senseLines.join(', ')}`
        : '',
    },
    flags: {
      'mastery-system': {
        familiarId: familiar.id,
        ownerActorId: familiar.ownerActorId,
      },
    },
  };
}

export async function createSummonActorForFamiliar(
  familiar: BoundFamiliarRecord,
  ownerActor: any,
): Promise<any | null> {
  if (familiar.summonActorId) {
    const existing = (game as any).actors?.get(familiar.summonActorId);
    if (existing) return existing;
  }

  const folder = await ensureFamiliarsFolder(ownerActor.name ?? 'Owner');
  const data = buildSummonActorData(familiar, ownerActor);
  if (folder) (data as any).folder = folder.id;

  (data as any).ownership = buildSummonActorOwnership(
    ownerActor,
    (game as any).users,
    game.user?.id,
  );

  try {
    const actor = await Actor.create(data);
    return actor ?? null;
  } catch (err) {
    console.error('Mastery System | Failed to create summon actor', err);
    ui.notifications?.error('Failed to create summon actor.');
    return null;
  }
}

export async function placeFamiliarToken(
  summonActor: any,
  ownerActor?: any | null,
): Promise<TokenDocument | null> {
  const scene = canvas.scene;
  if (!scene) {
    ui.notifications?.warn('No active scene to place token.');
    return null;
  }

  let x = scene.dimensions.width / 2;
  let y = scene.dimensions.height / 2;

  if (ownerActor) {
    const ownerToken = canvas.tokens?.placeables?.find(
      (t: any) => t.actor?.id === ownerActor.id,
    );
    if (ownerToken) {
      x = ownerToken.x + (ownerToken.w || 100);
      y = ownerToken.y;
    }
  }

  try {
    const created = await (scene as any).createEmbeddedDocuments('Token', [
      {
        actorId: summonActor.id,
        x,
        y,
        hidden: false,
        disposition: tokenFriendly(),
      },
    ]);
    const token = created?.[0] as TokenDocument | undefined;
    if (token) ui.notifications?.info(`Placed token for ${summonActor.name}.`);
    return token ?? null;
  } catch (err) {
    console.error('Mastery System | Failed to place familiar token', err);
    ui.notifications?.error('Failed to place token on scene.');
    return null;
  }
}

export async function deleteSummonSceneTokens(summonActorId: string | undefined): Promise<void> {
  if (!summonActorId) return;
  const scenes = (game as any).scenes;
  if (!scenes) return;
  for (const scene of scenes) {
    const tokens = (scene.tokens?.contents ?? scene.tokens ?? []) as any[];
    const ids = tokens
      .filter((t: any) => (t.actorId ?? t.actor?.id) === summonActorId)
      .map((t: any) => t.id)
      .filter(Boolean);
    if (!ids.length) continue;
    try {
      await scene.deleteEmbeddedDocuments('Token', ids);
    } catch (err) {
      console.warn('Mastery System | Could not remove summon tokens', err);
    }
  }
}

export async function deleteSummonActor(summonActorId: string | undefined): Promise<void> {
  if (!summonActorId) return;
  await deleteSummonSceneTokens(summonActorId);
  const actor = (game as any).actors?.get(summonActorId);
  if (!actor) return;
  try {
    await actor.delete();
  } catch (err) {
    console.warn('Mastery System | Could not delete summon actor', err);
  }
}

/** Bond is source of truth — overwrite body actors on Ritual Apply. */
export async function syncSummonBodyActorsFromBond(bond: SummonBondRecord, ownerActor: any): Promise<void> {
  for (const body of bond.bodies || []) {
    if (!body.summonActorId) continue;
    const a = (game as any).actors?.get(body.summonActorId);
    if (!a) continue;
    const data = buildSummonActorDataFromBond(bond, body, ownerActor);
    try {
      await a.update({
        name: (data as any).name,
        img: (data as any).img,
        prototypeToken: (data as any).prototypeToken,
        system: (data as any).system,
        flags: (data as any).flags,
      });
    } catch (err) {
      console.warn('Mastery System | Failed to sync summon actor from Bond', err);
    }
  }
}

/** Build a world summon actor from a V2 Summon Bond body. */
export function buildSummonActorDataFromBond(
  bond: SummonBondRecord,
  body: SummonBodyRecord,
  ownerActor: any,
): Record<string, unknown> {
  const senseLines = (body.sharedSenses || []).map(String);
  const ownerRank = Math.max(1, Math.floor(Number(ownerActor?.system?.mastery?.rank) || 1));
  const attacks = Math.max(1, Math.floor(Number(bond.summonAttacks) || 1));
  return {
    name: bond.name,
    type: 'summon',
    img: bond.img || DEFAULT_SUMMON_IMG,
    prototypeToken: {
      texture: { src: bond.img || DEFAULT_SUMMON_IMG },
      actorLink: false,
      disposition: tokenFriendly(),
    },
    system: {
      bloodColor: SUMMON_BLOOD_COLOR,
      mastery: { rank: ownerRank },
      bio: {
        name: bond.name,
        summonType: 'Summon',
        duration: 'Permanent (bound)',
        description: '',
      },
      familiar: {
        familiarId: bond.id,
        ownerActorId: bond.ownerActorId,
        movementType: bond.movementMode === 'flying' ? 'flying' : 'ground',
        size: 'Medium',
        sharedSenses: senseLines,
        boundStoneCount: bond.boundStoneCount,
      },
      summonBond: {
        bondId: bond.id,
        bodyId: body.id,
        ownerActorId: bond.ownerActorId,
        movementMode: bond.movementMode,
        movementM: bond.movementM,
        expression: bond.expression || '',
        activationTiming: bond.activationTiming,
        sharedSenses: senseLines,
        boundStoneCount: bond.boundStoneCount,
        dormant: !!body.dormant,
        attackDice: bond.attackDice,
        damageDice: bond.damageDice,
        specialKey: bond.specialKey ?? null,
        specialValue: bond.specialValue,
        selectedSkills: bond.selectedSkills ?? [],
        skillDiceAlloc: bond.skillDiceAlloc ?? {},
        powers: body.powers ?? [],
      },
      health: {
        bars: [{ name: 'Healthy', max: body.hp, current: body.hp, penalty: 0 }],
        currentBar: 0,
        tempHP: 0,
      },
      combat: {
        evade: body.evade,
        armor: body.armor,
        speed: bond.movementM,
        initiative: 0,
      },
      npcBaseAttack: {
        name: 'Summon Attack',
        attackDiceCount: bond.attackDice,
        damageDiceCount: bond.damageDice,
        npcRangeKind: 'melee',
        npcRangeMeters: 2,
        npcRangeMinMeters: 0,
        npcAoeShape: 'none',
        npcAoeRadiusM: 0,
        npcIsSpell: false,
        npcAttacksPerRound: attacks,
        npcSplitAttack: false,
        npcStressD8: 0,
        specials: bond.specialValue > 0 && bond.specialKey
          ? [{ special: bond.specialKey, specialValue: bond.specialValue }]
          : [],
      },
      attackValues: [],
      attackSlots: attacks,
      npcMovementSlots: 1,
      notes: '',
    },
    flags: {
      'mastery-system': {
        bondId: bond.id,
        bodyId: body.id,
        ownerActorId: bond.ownerActorId,
      },
    },
  };
}

export async function createSummonActorForBondBody(
  bond: SummonBondRecord,
  body: SummonBodyRecord,
  ownerActor: any,
): Promise<any | null> {
  if (body.summonActorId) {
    const existing = (game as any).actors?.get(body.summonActorId);
    if (existing) return existing;
  }
  const folder = await ensureFamiliarsFolder(ownerActor.name ?? 'Owner');
  const data = buildSummonActorDataFromBond(bond, body, ownerActor);
  if (folder) (data as any).folder = folder.id;
  (data as any).ownership = buildSummonActorOwnership(
    ownerActor,
    (game as any).users,
    game.user?.id,
  );
  try {
    return (await Actor.create(data)) ?? null;
  } catch (err) {
    console.error('Mastery System | Failed to create summon body actor', err);
    ui.notifications?.error('Failed to create summon actor.');
    return null;
  }
}
