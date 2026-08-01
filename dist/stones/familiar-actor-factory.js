/**
 * Create summon actors and place tokens from Summon Bonds (V2) or legacy familiars.
 */
import { parseD8Count } from './familiar-bind.js';
import { getSharedSenseLabel } from './familiar-bind.js';
const DEFAULT_SUMMON_IMG = 'icons/creatures/mammals/wolf-shadow-black.webp';
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
    const ownership = {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    };
    if (game.user?.id) {
        ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    }
    for (const [uid, level] of Object.entries(ownerActor.ownership ?? {})) {
        if (Number(level) >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
            ownership[uid] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        }
    }
    data.ownership = ownership;
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
export async function deleteSummonActor(summonActorId) {
    if (!summonActorId)
        return;
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
/** Build a world summon actor from a V2 Summon Bond body. */
export function buildSummonActorDataFromBond(bond, body, ownerActor) {
    const senseLines = (body.sharedSenses || []).map(String);
    return {
        name: bond.name,
        type: 'summon',
        img: bond.img || DEFAULT_SUMMON_IMG,
        prototypeToken: {
            texture: { src: bond.img || DEFAULT_SUMMON_IMG },
            actorLink: false,
        },
        system: {
            bio: {
                name: bond.name,
                summonType: 'Summon',
                duration: 'Permanent (bound)',
                description: `Summon Bond of ${ownerActor.name}. Mode: ${bond.movementMode} ${bond.movementM} m. Expression: ${bond.expression || '—'}.${body.dormant ? ' (Dormant)' : ''}`,
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
                sharedSenses: senseLines,
                boundStoneCount: bond.boundStoneCount,
                dormant: !!body.dormant,
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
            },
            npcBaseAttack: {
                name: 'Summon Attack',
                attackDiceCount: bond.attackDice,
                damageDiceCount: bond.damageDice,
                specials: bond.specialValue > 0 && bond.specialKey
                    ? [{ special: bond.specialKey, specialValue: bond.specialValue }]
                    : [],
            },
            attackValues: [],
            attackSlots: bond.summonAttacks,
            npcMovementSlots: 1,
            notes: senseLines.length ? `Shared senses: ${senseLines.join(', ')}` : '',
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
    if (body.summonActorId) {
        const existing = game.actors?.get(body.summonActorId);
        if (existing)
            return existing;
    }
    const folder = await ensureFamiliarsFolder(ownerActor.name ?? 'Owner');
    const data = buildSummonActorDataFromBond(bond, body, ownerActor);
    if (folder)
        data.folder = folder.id;
    const ownership = {
        default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
    };
    if (game.user?.id) {
        ownership[game.user.id] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    }
    for (const [uid, level] of Object.entries(ownerActor.ownership ?? {})) {
        if (Number(level) >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
            ownership[uid] = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        }
    }
    data.ownership = ownership;
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