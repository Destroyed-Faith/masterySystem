/**
 * Minor Magic Items — store one use of a purchased Active Power in a
 * temporary object (potion, grenade, rune, prepared weapon, trap, charm).
 *
 * Create / replace / dismiss only during a Safe Haven Rest. No Stones.
 * Combat resolution of the stored Power comes in a later pass.
 */
import { collectInventoryBandRects, findFirstFit } from './inventory-grid.js';
import { ZONE_WIDTH_COLS } from './encumbrance.js';
import { findTemplateById, resolvePowerCategoryFromItem } from './power-catalog.js';
import { getPowerDefinitionRank } from './power-definition-rank.js';
import { artifactPowersUnlocked, isArtifactEquippedOnActor } from './artifact-actor-rules.js';
import { resolveFullLevelProgression, visibleAbilityRows } from './artifact-visible-abilities.js';
import { getAttackAttributeForPowerTreeOrSchool } from './power-roll-attribute.js';
import { renderAoe, renderDuration, renderRange, renderSpecials } from './power-rendering.js';
export const MINOR_MAGIC_FLAG = 'minorMagic';
export const MINOR_MAGIC_LEDGER_FLAG = 'minorMagicLedger';
export const MINOR_MAGIC_REST_FLAG = 'minorMagicRest';
export const MINOR_MAGIC_FORMS = [
    'potion',
    'grenade',
    'rune',
    'weapon',
    'trap',
    'charm',
];
/** True for a PC assigned to a player — not GM-only character sheets or NPCs. */
export function isPlayerCharacterActor(actor) {
    if (!actor || String(actor.type || '') !== 'character')
        return false;
    if (actor.hasPlayerOwner === true)
        return true;
    const actorId = String(actor.id || '').trim();
    if (!actorId)
        return false;
    const users = globalThis.game?.users;
    const list = users && typeof users[Symbol.iterator] === 'function' ? Array.from(users) : [];
    return list.some((u) => {
        if (u?.isGM)
            return false;
        const assigned = u?.character;
        const assignedId = String(assigned?.id || assigned || '').trim();
        return assignedId === actorId;
    });
}
export const MINOR_MAGIC_FORM_LABELS = {
    potion: 'Potion',
    grenade: 'Grenade',
    rune: 'Rune',
    weapon: 'Prepared Weapon',
    trap: 'Trap',
    charm: 'Charm',
};
const FORM_ICONS = {
    potion: 'systems/mastery-system/assets/icons/items/gear/Glass Bottle.png',
    grenade: 'systems/mastery-system/assets/icons/items/gear/Glass Bottle.png',
    rune: 'icons/svg/aura.svg',
    weapon: 'systems/mastery-system/assets/icons/items/weapons/shortsword.png',
    trap: 'icons/svg/item-bag.svg',
    charm: 'icons/svg/aura.svg',
};
/** Delete option: the item is moving to another actor, not being spent. */
export const MINOR_MAGIC_TRANSFER_DELETE = 'masterySystemMinorMagicTransfer';
export function emptyMinorMagicLedger() {
    return { itemIds: [], labels: {} };
}
export function normalizeMinorMagicLedger(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const itemIds = [];
    const seen = new Set();
    const fromList = Array.isArray(src.itemIds) ? src.itemIds : [];
    const fromLegacy = src && typeof src.items === 'object'
        ? Object.keys(src.items)
        : [];
    for (const id of [...fromList, ...fromLegacy]) {
        const key = String(id || '').trim();
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        itemIds.push(key);
    }
    const labels = {};
    if (src.labels && typeof src.labels === 'object') {
        for (const [key, value] of Object.entries(src.labels)) {
            const id = String(key || '').trim();
            const name = String(value || '').trim();
            if (id && name)
                labels[id] = name;
        }
    }
    return { itemIds, labels };
}
export function ledgerKeyForMinorMagic(flag, itemId) {
    return String(flag?.instanceId || itemId || '').trim();
}
export function newMinorMagicInstanceId(fallback) {
    const utils = globalThis.foundry?.utils;
    if (typeof utils?.randomID === 'function')
        return String(utils.randomID());
    return String(fallback || `mm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
}
export function prepareMinorMagicFlagForTransfer(flag, sourceItemId) {
    return {
        ...flag,
        instanceId: ledgerKeyForMinorMagic(flag, sourceItemId) || newMinorMagicInstanceId(sourceItemId),
        released: false,
    };
}
export function shouldReleaseMinorMagicOnDelete(flag, options) {
    if (!flag || flag.released)
        return false;
    if (options?.[MINOR_MAGIC_TRANSFER_DELETE] === true)
        return false;
    return true;
}
export function countHeldMinorMagicItems(ledger) {
    return ledger.itemIds.length;
}
export function applyCreateToLedger(ledger, itemId, label) {
    const id = String(itemId || '').trim();
    const labels = { ...(ledger.labels || {}) };
    if (label && id)
        labels[id] = label;
    if (!id || ledger.itemIds.includes(id))
        return { itemIds: [...ledger.itemIds], labels };
    return { itemIds: [...ledger.itemIds, id], labels };
}
export function applyReleaseToLedger(ledger, itemId) {
    const id = String(itemId || '').trim();
    if (!id || !ledger.itemIds.includes(id))
        return null;
    const labels = { ...(ledger.labels || {}) };
    delete labels[id];
    return { itemIds: ledger.itemIds.filter((existing) => existing !== id), labels };
}
export function canManageMinorMagic(actor) {
    return actor?.getFlag?.('mastery-system', MINOR_MAGIC_REST_FLAG) === true;
}
export async function beginMinorMagicRest(actor) {
    await actor.setFlag?.('mastery-system', MINOR_MAGIC_REST_FLAG, true);
}
export async function endMinorMagicRest(actor) {
    if (actor.getFlag?.('mastery-system', MINOR_MAGIC_REST_FLAG) !== true)
        return;
    await actor.unsetFlag?.('mastery-system', MINOR_MAGIC_REST_FLAG);
}
export async function endMinorMagicRestForCombat(combat) {
    const seen = new Set();
    for (const combatant of combat?.combatants ?? []) {
        const actor = combatant?.actor;
        const id = String(actor?.id || '');
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        await endMinorMagicRest(actor);
    }
}
export function isMinorMagicForm(value) {
    return MINOR_MAGIC_FORMS.includes(value);
}
export function defaultMinorMagicName(form, powerName) {
    const power = String(powerName || 'Power').trim() || 'Power';
    switch (form) {
        case 'potion':
            return `Potion of ${power}`;
        case 'grenade':
            return `Grenade of ${power}`;
        case 'rune':
            return `Rune of ${power}`;
        case 'weapon':
            return `Prepared ${power}`;
        case 'trap':
            return `Trap: ${power}`;
        case 'charm':
            return `Charm of ${power}`;
    }
}
export function iconForMinorMagicForm(form) {
    return FORM_ICONS[form];
}
export function actorMasteryRank(actor) {
    return Math.max(1, Math.floor(Number(actor?.system?.mastery?.rank) || 1));
}
export function minorMagicLimit(actor) {
    return actorMasteryRank(actor);
}
/** Item/Artifact-granted Actives stored in Minor Magic never exceed this Power Level. */
export const MINOR_MAGIC_MAX_POWER_LEVEL = 10;
/** Artifact Level 4–6 band — the PL10 profile. Higher artifact levels cap here. */
export const MINOR_MAGIC_MAX_ARTIFACT_LEVEL = 6;
export function artifactLevelForMinorMagicCap(currentLevel) {
    const l = Math.max(1, Math.min(10, Math.floor(Number(currentLevel) || 1)));
    return Math.min(l, MINOR_MAGIC_MAX_ARTIFACT_LEVEL);
}
/** Artifact L1–3 → PL 4, L4–6 → PL 10, L7+ → PL 16. */
export function powerLevelForArtifactLevel(level) {
    const l = Math.max(1, Math.min(10, Math.floor(Number(level) || 1)));
    if (l <= 3)
        return 4;
    if (l <= 6)
        return 10;
    return 16;
}
export function capPowerLevelForMinorMagic(level, opts) {
    if (opts?.fromArtifact) {
        const artLevel = artifactLevelForMinorMagicCap(opts.artifactLevel ?? level);
        return powerLevelForArtifactLevel(artLevel);
    }
    return Math.min(MINOR_MAGIC_MAX_POWER_LEVEL, Math.max(1, Math.floor(Number(level) || 1)));
}
function readSourceFlag(item) {
    const sys = item.system || {};
    const fromSys = String(sys.source || sys.grantedBy || '').toLowerCase();
    if (fromSys)
        return fromSys;
    try {
        return String(item.getFlag?.('mastery-system', 'source') || '').toLowerCase();
    }
    catch {
        return '';
    }
}
function isArtifactSourcedPower(item) {
    const sys = item.system || {};
    if (sys.fromArtifact === true)
        return true;
    return readSourceFlag(item) === 'artifact';
}
function isItemOrArtifactGrantedPower(item) {
    if (isArtifactSourcedPower(item))
        return true;
    const source = readSourceFlag(item);
    return source === 'item' || source === 'artifact';
}
function isBlockedSourcePower(item) {
    const sys = item.system || {};
    /* Character-owned Actives and equipped Item/Artifact Actives are eligible.
     * Powers belonging only to another creature are not. Artifact Functions are
     * never stored — they are not Active Powers. */
    if (isItemOrArtifactGrantedPower(item))
        return false;
    if (sys.granted === true || sys.temporary === true)
        return true;
    const source = readSourceFlag(item);
    if (['granted', 'buff', 'temporary', 'summon'].includes(source))
        return true;
    try {
        const flag = item.getFlag?.('mastery-system', 'granted') ?? item.getFlag?.('mastery-system', 'temporary');
        if (flag === true)
            return true;
    }
    catch {
        /* ignore */
    }
    return false;
}
/**
 * PG "Creating Minor Magic Items": the stored Active Power must have an
 * Instant duration — no persistent zones, barriers, constructs, images, or
 * other ongoing effects.
 */
export function isInstantDurationPower(item) {
    const row = readLevelRow(item);
    const kind = row?.duration?.kind;
    if (kind)
        return kind === 'instant';
    const raw = String(item.system?.duration || '').trim().toLowerCase();
    if (!raw || raw === '—' || raw === '-' || raw === 'instant')
        return true;
    return false;
}
export function isEligibleMinorMagicPower(item) {
    if (item?.type !== 'power')
        return false;
    if (resolvePowerCategoryFromItem(item) !== 'active') {
        return false;
    }
    if (isBlockedSourcePower(item))
        return false;
    if (!isInstantDurationPower(item))
        return false;
    return true;
}
function isActiveProgressionRowType(rowType) {
    const t = String(rowType || '').trim().toLowerCase();
    if (!t)
        return false;
    if (t.includes('reaction') || t.includes('movement'))
        return false;
    if (t.includes('active buff') || t.includes('active-buff') || (t.includes('buff') && !t.includes('debuff'))) {
        return false;
    }
    if (t.includes('stone') || t.includes('support') || t.includes('passive') || t.includes('ultimate')) {
        return false;
    }
    if (t.startsWith('active') ||
        t.includes('aoe') ||
        t.includes('attack') ||
        t.includes('zone') ||
        t.includes('barrier') ||
        t.includes('damage') ||
        t === 'melee' ||
        t === 'ranged' ||
        t.startsWith('melee ') ||
        t.startsWith('ranged ')) {
        return true;
    }
    return false;
}
function synthesizeMinorMagicPowerFromRow(artifact, row, cappedArtifactLevel) {
    const templateId = String(row.powerTemplateId || row.templateId || '');
    const template = templateId ? findTemplateById(templateId) : undefined;
    const pl = powerLevelForArtifactLevel(cappedArtifactLevel);
    const levels = template?.levels ?? {
        [String(pl)]: {
            duration: { kind: 'instant' },
            effect: { text: String(row.effect || '') },
        },
    };
    return {
        id: `artifact:${artifact.id || 'item'}:${row.level || cappedArtifactLevel}:${row.name || 'active'}`,
        type: 'power',
        name: String(row.name || artifact.name || 'Artifact Active'),
        system: {
            category: 'active',
            powerType: 'active',
            fromArtifact: true,
            artifactRowLevel: Number(row.level) || cappedArtifactLevel,
            artifactLevel: cappedArtifactLevel,
            rank: pl,
            level: pl,
            templateId,
            templateName: template?.templateName || row.name || '',
            chosenSpecial: row.chosenSpecialKey ? { key: row.chosenSpecialKey } : undefined,
            duration: String(row.duration || 'Instant'),
            levels,
        },
    };
}
function listArtifactGrantedMinorMagicActives(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    const out = [];
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactEquippedOnActor(item))
            continue;
        if (!artifactPowersUnlocked(actor, item))
            continue;
        const sys = item.system || {};
        const currentLevel = Math.max(1, Number(sys.currentLevel ?? sys.level ?? 1) || 1);
        const capLevel = artifactLevelForMinorMagicCap(currentLevel);
        const rows = visibleAbilityRows(resolveFullLevelProgression(sys.levelProgression, sys.progressionPicks), capLevel);
        for (const row of rows) {
            if (!isActiveProgressionRowType(String(row.type || '')))
                continue;
            const synth = synthesizeMinorMagicPowerFromRow(item, row, capLevel);
            if (isEligibleMinorMagicPower(synth))
                out.push(synth);
        }
    }
    return out;
}
export function listEligibleMinorMagicPowers(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    const owned = items.filter((it) => it?.type === 'power' && isEligibleMinorMagicPower(it));
    const seen = new Set(owned.map((p) => String(p.id)));
    const merged = [...owned];
    for (const granted of listArtifactGrantedMinorMagicActives(actor)) {
        const id = String(granted.id || '');
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        merged.push(granted);
    }
    return merged.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
}
export function resolveMinorMagicPower(actor, powerId) {
    const id = String(powerId || '').trim();
    if (!id)
        return null;
    return listEligibleMinorMagicPowers(actor).find((p) => String(p.id) === id) ?? null;
}
export function readMinorMagicFlag(item) {
    const raw = item.getFlag?.('mastery-system', MINOR_MAGIC_FLAG) ??
        item.flags?.['mastery-system']?.[MINOR_MAGIC_FLAG];
    if (!raw || typeof raw !== 'object')
        return null;
    const data = raw;
    if (!data.snapshot || !data.form || !data.creatorId)
        return null;
    return data;
}
export function listMinorMagicItemsOnActor(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    return items.filter((it) => !!readMinorMagicFlag(it));
}
function readLevelRowAt(power, rankInput) {
    const sys = power.system || {};
    const levels = sys.levels;
    if (!levels || typeof levels !== 'object')
        return null;
    const defRank = getPowerDefinitionRank(rankInput, levels);
    const row = Array.isArray(levels)
        ? levels.find((r) => Number(r?.level) === defRank)
        : levels[String(defRank)] ?? levels[String(rankInput)];
    return row && typeof row === 'object' ? row : null;
}
function readLevelRow(power) {
    const sys = power.system || {};
    return readLevelRowAt(power, Math.max(1, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1)));
}
function snapshotAttackPool(actor, power) {
    const sys = power.system || {};
    let attribute = 'might';
    if (sys.isSpell && sys.castingAttribute) {
        attribute = String(sys.castingAttribute).toLowerCase();
    }
    else {
        const fromTree = getAttackAttributeForPowerTreeOrSchool(sys.tree);
        if (fromTree)
            attribute = fromTree;
        else if (sys.roll?.attribute)
            attribute = String(sys.roll.attribute).toLowerCase();
        else if (sys.newRoll?.attribute)
            attribute = String(sys.newRoll.attribute).toLowerCase();
    }
    const numDice = Math.max(0, Math.floor(Number(actor.system?.attributes?.[attribute]?.value) || 0));
    const keepDice = actorMasteryRank(actor);
    return { attribute, numDice, keepDice };
}
function snapshotDamage(sys, row) {
    const dice = row?.effect?.dice;
    if (typeof dice === 'string' && dice.trim())
        return dice.trim();
    const rider = row?.mechanics?.damageRider?.flat;
    if (typeof rider === 'string' && rider.trim())
        return rider.replace(/^\+/, '').trim();
    const legacy = sys?.roll?.damage;
    if (typeof legacy === 'string' && legacy.trim())
        return legacy.trim();
    return '—';
}
function snapshotHealing(sys, row) {
    const heal = row?.mechanics?.healing?.flat;
    if (typeof heal === 'string' && heal.trim())
        return heal.trim();
    const legacy = sys?.roll?.healing;
    if (typeof legacy === 'string' && legacy.trim())
        return legacy.trim();
    return '—';
}
function snapshotAoeShape(row, sys) {
    const shape = row?.aoe?.shape;
    if (shape)
        return String(shape);
    const raw = String(sys?.aoe || '').toLowerCase();
    if (!raw || raw === '—' || raw === 'none' || raw === 'single')
        return 'single';
    return 'other';
}
export function snapshotPowerForMinorMagic(actor, power) {
    const sys = power.system || {};
    const fromArtifact = isItemOrArtifactGrantedPower(power);
    const rawRank = Math.max(1, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1));
    const artifactLevel = Number(sys.artifactLevel ?? sys.artifactRowLevel ?? 0) || rawRank;
    const powerLevel = capPowerLevelForMinorMagic(rawRank, { fromArtifact, artifactLevel });
    const row = readLevelRowAt(power, powerLevel);
    const definitionRank = getPowerDefinitionRank(powerLevel, sys.levels);
    const specials = (row?.specials || []);
    const actionCost = String(sys.newCost?.action ?? sys.cost?.action ?? 'attack');
    const aoe = row?.aoe ?? null;
    const targets = typeof aoe?.targets === 'number'
        ? aoe.targets
        : aoe?.shape === 'single' || !aoe || aoe.shape === 'none'
            ? 1
            : null;
    return {
        powerId: String(power.id || ''),
        powerName: String(power.name || 'Power'),
        templateId: String(sys.templateId || ''),
        templateName: String(sys.templateName || power.name || ''),
        powerLevel,
        definitionRank,
        category: 'active',
        actionCost,
        isSpell: sys.isSpell === true,
        castingAttribute: String(sys.castingAttribute || ''),
        attackPool: snapshotAttackPool(actor, power),
        damage: snapshotDamage(sys, row),
        healing: snapshotHealing(sys, row),
        range: row ? renderRange(row.range) : String(sys.range || '—'),
        aoe: row ? renderAoe(row.aoe) : String(sys.aoe || '—'),
        aoeShape: snapshotAoeShape(row, sys),
        targets,
        duration: row ? renderDuration(row.duration) : String(sys.duration || '—'),
        specials: specials.length
            ? renderSpecials(specials)
            : Array.isArray(sys.specials)
                ? sys.specials.join(', ')
                : '—',
        effect: String(row?.effect?.text || sys.effect || ''),
        chosenSpecialKey: String(sys.chosenSpecial?.key || ''),
    };
}
export function formatAttackPool(pool) {
    const attr = pool.attribute ? pool.attribute.charAt(0).toUpperCase() + pool.attribute.slice(1) : '—';
    return `${pool.numDice}k${pool.keepDice} (${attr})`;
}
export function snapshotSummaryLines(snapshot) {
    const lines = [
        `${snapshot.powerName} · Rank ${snapshot.powerLevel}`,
        `Action: ${snapshot.actionCost}`,
        `Attack Pool: ${formatAttackPool(snapshot.attackPool)}`,
        `Damage: ${snapshot.damage} (Power only — no weapon dice)`,
    ];
    if (snapshot.healing && snapshot.healing !== '—')
        lines.push(`Healing: ${snapshot.healing}`);
    lines.push(`Range: ${snapshot.range}`);
    lines.push(`Area: ${snapshot.aoe === '—' ? 'Single Target' : snapshot.aoe}`);
    if (snapshot.specials && snapshot.specials !== '—')
        lines.push(`Specials: ${snapshot.specials}`);
    return lines;
}
function inventoryRectsForBand(actor, band) {
    const items = actor?.items ? Array.from(actor.items) : [];
    return collectInventoryBandRects(items, band, { cols: ZONE_WIDTH_COLS, rows: 9 });
}
export function findInventorySlotForMinorMagic(actor) {
    for (const band of ['not', 'enc', 'heavy']) {
        const pos = findFirstFit(inventoryRectsForBand(actor, band), 1, 1, ZONE_WIDTH_COLS, 9);
        if (pos)
            return { band, x: pos.x, y: pos.y };
    }
    return null;
}
export function getActorMinorMagicLedger(actor) {
    return normalizeMinorMagicLedger(actor.getFlag?.('mastery-system', MINOR_MAGIC_LEDGER_FLAG));
}
export async function setActorMinorMagicLedger(actor, ledger) {
    await actor.setFlag?.('mastery-system', MINOR_MAGIC_LEDGER_FLAG, ledger);
}
export const MINOR_MAGIC_REST_REQUIRED = 'Create, replace, or dismiss Minor Magic Items only during a Safe Haven Rest.';
function canCreateMinorMagic(actor, power, form) {
    if (!canManageMinorMagic(actor))
        return MINOR_MAGIC_REST_REQUIRED;
    if (!isEligibleMinorMagicPower(power)) {
        return 'Only one of your own Active Powers (including equipped Item/Artifact Actives) with an Instant duration can be stored — no Artifact Functions, Buffs, Passives, Reactions, Movement Powers, or ongoing effects.';
    }
    if (!isMinorMagicForm(form))
        return 'Choose a form for the item.';
    const ledger = getActorMinorMagicLedger(actor);
    if (countHeldMinorMagicItems(ledger) >= minorMagicLimit(actor)) {
        return `You may maintain ${minorMagicLimit(actor)} Minor Magic Item(s) (Mastery Rank). Empty places fill only during a Safe Haven Rest.`;
    }
    if (!findInventorySlotForMinorMagic(actor)) {
        return 'No space in inventory for a 1×1 item.';
    }
    return null;
}
export function validateCreateMinorMagic(actor, power, form) {
    return canCreateMinorMagic(actor, power, form);
}
function itemDescription(form, snapshot) {
    const formLabel = MINOR_MAGIC_FORM_LABELS[form];
    return [
        `Minor Magic Item (${formLabel}). Stores one use of ${snapshot.powerName}.`,
        ...snapshotSummaryLines(snapshot),
        'The form is flavor only. A grenade does not become an Area Power. Weapon dice and Weapon Specials are never added.',
    ].join('\n');
}
export async function createMinorMagicItem(actor, opts) {
    const power = resolveMinorMagicPower(actor, opts.powerId);
    if (!power)
        return { ok: false, error: 'Choose an Active Power to store.' };
    const err = canCreateMinorMagic(actor, power, opts.form);
    if (err)
        return { ok: false, error: err };
    const slot = findInventorySlotForMinorMagic(actor);
    if (!slot)
        return { ok: false, error: 'No space in inventory for a 1×1 item.' };
    const snapshot = snapshotPowerForMinorMagic(actor, power);
    const name = String(opts.name || '').trim() || defaultMinorMagicName(opts.form, snapshot.powerName);
    const instanceId = newMinorMagicInstanceId();
    const flag = {
        creatorId: String(actor.id || ''),
        creatorName: String(actor.name || ''),
        instanceId,
        form: opts.form,
        snapshot,
    };
    const [created] = await actor.createEmbeddedDocuments('Item', [
        {
            name,
            type: 'gear',
            img: iconForMinorMagicForm(opts.form),
            system: {
                description: itemDescription(opts.form, snapshot),
                inventorySize: '1x1',
                quantity: 1,
                equipped: false,
                weight: 0,
                specials: [],
                baseDamage: '',
                consumable: true,
            },
            flags: {
                'mastery-system': {
                    [MINOR_MAGIC_FLAG]: flag,
                    equipment: {
                        container: 'inventory',
                        band: slot.band,
                        grid: { x: slot.x, y: slot.y },
                    },
                },
            },
        },
    ]);
    if (!created?.id)
        return { ok: false, error: 'Could not create the item.' };
    const ledger = applyCreateToLedger(getActorMinorMagicLedger(actor), instanceId, name);
    await setActorMinorMagicLedger(actor, ledger);
    return { ok: true, item: created };
}
async function releaseOnCreator(creator, ledgerKey) {
    const next = applyReleaseToLedger(getActorMinorMagicLedger(creator), ledgerKey);
    if (!next)
        return false;
    await setActorMinorMagicLedger(creator, next);
    return true;
}
export function isMinorMagicCreatedBy(flag, actorId) {
    const creator = String(flag?.creatorId || '').trim();
    const id = String(actorId || '').trim();
    return !!creator && !!id && creator === id;
}
export function canGiveBackMinorMagic(actor, item) {
    const flag = readMinorMagicFlag(item);
    if (!flag)
        return false;
    return !isMinorMagicCreatedBy(flag, actor?.id);
}
export function listMinorMagicGiveTargets(excludeActorId) {
    const skip = String(excludeActorId || '').trim();
    const actors = globalThis.game?.actors;
    const list = actors && typeof actors[Symbol.iterator] === 'function' ? Array.from(actors) : [];
    return list.filter((a) => {
        if (!a || String(a.id || '') === skip)
            return false;
        return isPlayerCharacterActor(a);
    });
}
export async function resolveMinorMagicCreator(flag, fallback) {
    if (fallback?.id && String(fallback.id) === flag.creatorId)
        return fallback;
    const fromWorld = globalThis.game?.actors?.get?.(flag.creatorId);
    return fromWorld || fallback || null;
}
export async function giveMinorMagicItemToActor(sourceActor, item, targetActor) {
    if (!item || !readMinorMagicFlag(item))
        return { ok: false, error: 'Not a Minor Magic Item.' };
    if (!targetActor)
        return { ok: false, error: 'Choose who receives the item.' };
    if (sourceActor?.id && String(sourceActor.id) === String(targetActor.id)) {
        return { ok: false, error: 'That character already has this item.' };
    }
    const slot = findInventorySlotForMinorMagic(targetActor);
    if (!slot) {
        return {
            ok: false,
            error: `${String(targetActor.name || 'That character')} has no inventory space for a 1×1 item.`,
        };
    }
    const { transferConsumableToActor } = await import('./consumable-slots.js');
    const moved = await transferConsumableToActor(targetActor, item);
    if (!moved)
        return { ok: false, error: `Could not give ${item.name} to ${targetActor.name}.` };
    try {
        await moved.update?.({
            'flags.mastery-system.equipment': {
                container: 'inventory',
                band: slot.band,
                grid: { x: slot.x, y: slot.y },
            },
        });
    }
    catch {
        /* item is on the other sheet even if the grid stamp fails */
    }
    return { ok: true, item: moved };
}
export async function returnMinorMagicItemToCreator(holder, item) {
    const flag = readMinorMagicFlag(item);
    if (!flag)
        return { ok: false, error: 'Not a Minor Magic Item.' };
    if (isMinorMagicCreatedBy(flag, holder?.id)) {
        return { ok: false, error: 'This item is already with its creator.' };
    }
    const creator = await resolveMinorMagicCreator(flag);
    if (!creator || String(creator.id || '') === String(holder?.id || '')) {
        return { ok: false, error: 'The creator is not available.' };
    }
    const given = await giveMinorMagicItemToActor(holder, item, creator);
    if (!given.ok)
        return given;
    return { ok: true, item: given.item, creator };
}
export async function releaseMinorMagicItem(actor, item) {
    const flag = readMinorMagicFlag(item);
    if (!flag)
        return { ok: false, error: 'Not a Minor Magic Item.' };
    if (flag.released)
        return { ok: true };
    const creator = await resolveMinorMagicCreator(flag, actor);
    await releaseOnCreator(creator, ledgerKeyForMinorMagic(flag, item.id));
    try {
        await item.update?.({ 'flags.mastery-system.minorMagic.released': true });
    }
    catch {
        /* item may already be deleting */
    }
    return { ok: true };
}
export async function consumeMinorMagicItem(actor, item, mode, trapTrigger) {
    const flag = readMinorMagicFlag(item);
    if (!flag)
        return { ok: false, error: 'Not a Minor Magic Item.' };
    if (mode === 'trap' && trapTrigger) {
        flag.armedAsTrap = true;
        flag.trapTrigger = trapTrigger;
    }
    const released = await releaseMinorMagicItem(actor, item);
    if (!released.ok)
        return released;
    if (item.id && actor.items?.get?.(item.id)) {
        await actor.deleteEmbeddedDocuments('Item', [item.id]);
    }
    return { ok: true, flag };
}
export function buildMinorMagicChatHtml(itemName, flag, mode) {
    const formLabel = MINOR_MAGIC_FORM_LABELS[flag.form];
    const lines = snapshotSummaryLines(flag.snapshot)
        .map((line) => `<li>${line}</li>`)
        .join('');
    if (mode === 'dismiss') {
        return `<div class="minor-magic-chat"><h4>Dismissed ${itemName}</h4><p>The ${formLabel} loses its magic and no longer counts against the creator’s limit. An empty place can only be filled during a Safe Haven Rest.</p></div>`;
    }
    const heading = mode === 'trap'
        ? `Trap: ${itemName}`
        : `Used ${itemName}`;
    const trapLine = mode === 'trap' && flag.trapTrigger
        ? `<p><em>Trigger:</em> ${flag.trapTrigger}</p>`
        : '';
    return `
    <div class="minor-magic-chat">
      <h4>${heading}</h4>
      <p>${formLabel} — stored ${flag.snapshot.powerName} (creator: ${flag.creatorName || 'unknown'}).</p>
      ${trapLine}
      <ul>${lines}</ul>
      <p><em>The item is spent and no longer counts against the creator’s limit. An empty place can only be filled during a Safe Haven Rest.</em></p>
    </div>
  `;
}
/** True when the stored Power resolves via an attack roll (has an attack pool). */
function snapshotRequiresAttack(snapshot) {
    return snapshot.attackPool.numDice > 0 && String(snapshot.actionCost) !== 'none';
}
/**
 * PG "Using Minor Magic Items": the stored Power resolves using its recorded
 * values. If it requires an attack, roll the recorded Attack Pool with the
 * recorded Keep value — a Minor Magic Item never hits automatically. Damage
 * is the stored Power's damage only (no weapon dice / weapon specials).
 */
export async function resolveMinorMagicSnapshot(actor, itemName, flag, mode) {
    const g = globalThis;
    const RollCls = g.Roll;
    const ChatMessage = g.ChatMessage;
    if (!RollCls || !ChatMessage?.create)
        return;
    const snapshot = flag.snapshot;
    const rolls = [];
    const parts = [];
    if (snapshotRequiresAttack(snapshot)) {
        const pool = snapshot.attackPool;
        const keep = Math.max(1, Math.min(pool.keepDice, pool.numDice));
        const attackRoll = new RollCls(`${pool.numDice}d8kh${keep}`);
        await attackRoll.evaluate();
        rolls.push(attackRoll);
        parts.push(`<p><strong>Attack:</strong> ${formatAttackPool(pool)} → <strong>${attackRoll.total}</strong> ` +
            `(recorded pool; compare vs the target's TN — no auto-hit).</p>`);
    }
    const dmg = String(snapshot.damage || '').trim();
    if (dmg && dmg !== '—' && /\dd8/i.test(dmg)) {
        const dmgRoll = new RollCls(dmg.replace(/^\+/, ''));
        await dmgRoll.evaluate();
        rolls.push(dmgRoll);
        parts.push(`<p><strong>Damage (on hit):</strong> ${dmg} → <strong>${dmgRoll.total}</strong> ` +
            `(stored Power only — no weapon dice or Weapon Specials).</p>`);
    }
    const heal = String(snapshot.healing || '').trim();
    if (heal && heal !== '—' && /\dd8/i.test(heal)) {
        const healRoll = new RollCls(heal.replace(/^\+/, ''));
        await healRoll.evaluate();
        rolls.push(healRoll);
        parts.push(`<p><strong>Healing:</strong> ${heal} → <strong>${healRoll.total}</strong></p>`);
    }
    if (snapshot.specials && snapshot.specials !== '—') {
        parts.push(`<p><strong>Specials (on hit):</strong> ${snapshot.specials}</p>`);
    }
    if (parts.length === 0) {
        parts.push(`<p>${snapshot.effect || 'The stored effect resolves as written.'}</p>`);
    }
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
        rolls,
        content: `
      <div class="minor-magic-chat">
        <h4>${mode === 'trap' ? 'Trap triggers' : 'Resolving'}: ${itemName}</h4>
        ${parts.join('')}
      </div>
    `,
    });
}
export async function useMinorMagicItem(actor, item, mode = 'use', trapTrigger) {
    const itemName = String(item.name || 'Minor Magic Item');
    const result = await consumeMinorMagicItem(actor, item, mode, trapTrigger);
    if (!result.ok)
        return result;
    const ChatMessage = globalThis.ChatMessage;
    if (ChatMessage?.create) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
            content: buildMinorMagicChatHtml(itemName, result.flag, mode),
        });
    }
    // Direct use resolves immediately; an armed Trap resolves when triggered,
    // so its rolls are made by the GM via the same resolver at trigger time.
    if (mode === 'use') {
        try {
            await resolveMinorMagicSnapshot(actor, itemName, result.flag, mode);
        }
        catch (err) {
            console.warn('Mastery System | Minor Magic resolution failed', err);
        }
    }
    return { ok: true };
}
export async function dismissMinorMagicItem(actor, item) {
    if (!canManageMinorMagic(actor))
        return { ok: false, error: MINOR_MAGIC_REST_REQUIRED };
    const result = await consumeMinorMagicItem(actor, item, 'dismiss');
    if (!result.ok)
        return result;
    const ChatMessage = globalThis.ChatMessage;
    if (ChatMessage?.create) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
            content: buildMinorMagicChatHtml(item.name, result.flag, 'dismiss'),
        });
    }
    return { ok: true };
}
export async function onMinorMagicItemDeleted(item, options) {
    const flag = readMinorMagicFlag(item);
    if (!flag || !shouldReleaseMinorMagicOnDelete(flag, options))
        return;
    const parent = item.parent;
    const creator = await resolveMinorMagicCreator(flag, parent);
    if (!creator)
        return;
    await releaseOnCreator(creator, ledgerKeyForMinorMagic(flag, item.id));
}
export function minorMagicSheetView(actor) {
    const ledger = getActorMinorMagicLedger(actor);
    const limit = minorMagicLimit(actor);
    const held = countHeldMinorMagicItems(ledger);
    const canManage = canManageMinorMagic(actor);
    const localKeys = new Set();
    const items = listMinorMagicItemsOnActor(actor).map((it) => {
        const flag = readMinorMagicFlag(it);
        localKeys.add(ledgerKeyForMinorMagic(flag, it.id));
        const mine = isMinorMagicCreatedBy(flag, actor?.id);
        return {
            id: it.id,
            name: it.name,
            formLabel: MINOR_MAGIC_FORM_LABELS[flag.form],
            powerName: flag.snapshot.powerName,
            summary: snapshotSummaryLines(flag.snapshot).slice(0, 3).join(' · '),
            actionCost: flag.snapshot.actionCost,
            givenAway: false,
            received: !mine,
            canGive: true,
            canGiveBack: !mine,
            canDismiss: canManage && mine,
            creatorName: flag.creatorName || '',
        };
    });
    for (const key of ledger.itemIds) {
        if (localKeys.has(key))
            continue;
        items.push({
            id: key,
            name: ledger.labels?.[key] || 'Minor Magic Item',
            formLabel: 'Given away',
            powerName: '',
            summary: 'Carried by another character — still counts against your limit until it is used or dismissed.',
            actionCost: '',
            givenAway: true,
            received: false,
            canGive: false,
            canGiveBack: false,
            canDismiss: false,
            creatorName: '',
        });
    }
    return {
        limit,
        held,
        remaining: Math.max(0, limit - held),
        givenAway: Math.max(0, held - localKeys.size),
        canManage,
        items,
    };
}
//# sourceMappingURL=minor-magic-items.js.map