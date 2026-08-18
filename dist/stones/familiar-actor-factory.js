/**
 * Create summon actors and place tokens from Summon Bonds (V2) or legacy familiars.
 */
import { parseD8Count } from './familiar-bind.js';
import { getSharedSenseLabel } from './familiar-bind.js';
const DEFAULT_SUMMON_IMG = 'icons/creatures/mammals/wolf-shadow-black.webp';
const SUMMON_BLOOD_COLOR = '#4a148c';
function tokenFriendly() {
    return globalThis.CONST?.TOKEN_DISPOSITIONS?.FRIENDLY ?? 1;
}
function ownershipLevel(kind) {
    const levels = globalThis.CONST?.DOCUMENT_OWNERSHIP_LEVELS;
    if (kind === 'OWNER')
        return levels?.OWNER ?? 3;
    return levels?.OBSERVER ?? 2;
}
/** OWNER for every GM and the player assigned to the owner character (e.g. Fin). */
export function buildSummonActorOwnership(ownerActor, users, currentUserId) {
    const OWNER = ownershipLevel('OWNER');
    const ownership = {
        default: ownershipLevel('OBSERVER'),
    };
    const ownerId = String(ownerActor?.id ?? '');
    for (const user of users ?? []) {
        if (!user?.id)
            continue;
        if (user.isGM)
            ownership[user.id] = OWNER;
        if (ownerId && user.character?.id === ownerId)
            ownership[user.id] = OWNER;
    }
    for (const [uid, level] of Object.entries(ownerActor?.ownership ?? {})) {
        if (uid === 'default')
            continue;
        if (Number(level) >= OWNER)
            ownership[uid] = OWNER;
    }
    if (currentUserId)
        ownership[currentUserId] = OWNER;
    return ownership;
}
async function ensureFamiliarsFolder(ownerName) {
    const parentName = 'Summons';
    let parent = game.folders?.find((f) => f.type === 'Actor' && f.name === parentName && !f.folder);
    if (!parent) {
        parent = await Folder.create({ name: parentName, type: 'Actor', sorting: 'a' });
    }
    const childName = ownerName.trim() || 'Unnamed';
    let child = game.folders?.find((f) => f.type === 'Actor' && f.name === childName && f.folder === parent?.id);
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
export function buildSummonActorData(familiar, ownerActor) {
    const stats = familiar.stats;
    const hp = stats.hp;
    const attackDice = parseD8Count(stats.attack);
    const damageDice = parseD8Count(stats.damage);
    const senseLines = familiar.sharedSenses.map((s) => getSharedSenseLabel(s.group));
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
export async function createSummonActorForFamiliar(familiar, ownerActor) {
    if (familiar.summonActorId) {
        const existing = game.actors?.get(familiar.summonActorId);
        if (existing)
            return existing;
    }
    const folder = await ensureFamiliarsFolder(ownerActor.name ?? 'Owner');
    const data = buildSummonActorData(familiar, ownerActor);
    if (folder)
        data.folder = folder.id;
    data.ownership = buildSummonActorOwnership(ownerActor, game.users, game.user?.id);
    try {
        const actor = await Actor.create(data);
        return actor ?? null;
    }
    catch (err) {
        console.error('Mastery System | Failed to create summon actor', err);
        ui.notifications?.error('Failed to create summon actor.');
        return null;
    }
}
export async function placeFamiliarToken(summonActor, ownerActor) {
    const scene = canvas.scene;
    if (!scene) {
        ui.notifications?.warn('No active scene to place token.');
        return null;
    }
    let x = scene.dimensions.width / 2;
    let y = scene.dimensions.height / 2;
    if (ownerActor) {
        const ownerToken = canvas.tokens?.placeables?.find((t) => t.actor?.id === ownerActor.id);
        if (ownerToken) {
            x = ownerToken.x + (ownerToken.w || 100);
            y = ownerToken.y;
        }
    }
    try {
        const created = await scene.createEmbeddedDocuments('Token', [
            {
                actorId: summonActor.id,
                x,
                y,
                hidden: false,
                disposition: tokenFriendly(),
            },
        ]);
        const token = created?.[0];
        if (token)
            ui.notifications?.info(`Placed token for ${summonActor.name}.`);
        return token ?? null;
    }
    catch (err) {
        console.error('Mastery System | Failed to place familiar token', err);
        ui.notifications?.error('Failed to place token on scene.');
        return null;
    }
}
export async function deleteSummonSceneTokens(summonActorId) {
    if (!summonActorId)
        return;
    const scenes = game.scenes;
    if (!scenes)
        return;
    for (const scene of scenes) {
        const tokens = (scene.tokens?.contents ?? scene.tokens ?? []);
        const ids = tokens
            .filter((t) => (t.actorId ?? t.actor?.id) === summonActorId)
            .map((t) => t.id)
            .filter(Boolean);
        if (!ids.length)
            continue;
        try {
            await scene.deleteEmbeddedDocuments('Token', ids);
        }
        catch (err) {
            console.warn('Mastery System | Could not remove summon tokens', err);
        }
    }
}
export async function deleteSummonActor(summonActorId) {
    if (!summonActorId)
        return;
    await deleteSummonSceneTokens(summonActorId);
    const actor = game.actors?.get(summonActorId);
    if (!actor)
        return;
    try {
        await actor.delete();
    }
    catch (err) {
        console.warn('Mastery System | Could not delete summon actor', err);
    }
}
/** Resolve a summon actor only by stored Foundry document id — never by name. */
export function getLiveSummonActor(summonActorId) {
    const id = String(summonActorId ?? '').trim();
    if (!id)
        return null;
    return game.actors?.get(id) ?? null;
}
/** Overwrite one existing body actor. Refuses to create if the id is missing. */
export async function updateSummonActorForBondBody(bond, body, ownerActor) {
    const existing = getLiveSummonActor(body.summonActorId);
    if (!existing) {
        ui.notifications?.warn('No summon actor for this body. Create Actor first.');
        return null;
    }
    const data = buildSummonActorDataFromBond(bond, body, ownerActor);
    try {
        await existing.update({
            name: data.name,
            img: data.img,
            prototypeToken: data.prototypeToken,
            system: data.system,
            flags: data.flags,
        });
        return existing;
    }
    catch (err) {
        console.warn('Mastery System | Failed to update summon actor', err);
        ui.notifications?.error('Failed to update summon actor.');
        return null;
    }
}
/** Bond is source of truth — overwrite body actors on Ritual Apply. */
export async function syncSummonBodyActorsFromBond(bond, ownerActor) {
    for (const body of bond.bodies || []) {
        const a = getLiveSummonActor(body.summonActorId);
        if (!a)
            continue;
        const data = buildSummonActorDataFromBond(bond, body, ownerActor);
        try {
            await a.update({
                name: data.name,
                img: data.img,
                prototypeToken: data.prototypeToken,
                system: data.system,
                flags: data.flags,
            });
        }
        catch (err) {
            console.warn('Mastery System | Failed to sync summon actor from Bond', err);
        }
    }
}
/** Build a world summon actor from a V2 Summon Bond body. */
export function buildSummonActorDataFromBond(bond, body, ownerActor) {
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
            creatureType: bond.creatureType || bond.expression || '',
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
                expression: bond.creatureType || bond.expression || '',
                creatureType: bond.creatureType || bond.expression || '',
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
export async function createSummonActorForBondBody(bond, body, ownerActor) {
    const existing = getLiveSummonActor(body.summonActorId);
    if (existing)
        return existing;
    const folder = await ensureFamiliarsFolder(ownerActor.name ?? 'Owner');
    const data = buildSummonActorDataFromBond(bond, body, ownerActor);
    if (folder)
        data.folder = folder.id;
    data.ownership = buildSummonActorOwnership(ownerActor, game.users, game.user?.id);
    try {
        return (await Actor.create(data)) ?? null;
    }
    catch (err) {
        console.error('Mastery System | Failed to create summon body actor', err);
        ui.notifications?.error('Failed to create summon actor.');
        return null;
    }
}
//# sourceMappingURL=familiar-actor-factory.js.map