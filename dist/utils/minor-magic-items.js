/**
 * Minor Magic Items — store one use of a purchased Active Power in a
 * temporary object (potion, grenade, rune, prepared weapon, trap, charm).
 *
 * Create / replace / dismiss only during a Safe Haven Rest. No Stones.
 * Combat resolution of the stored Power comes in a later pass.
 */
import { collectInventoryBandRects, findFirstFit } from './inventory-grid.js';
import { ZONE_WIDTH_COLS } from './encumbrance.js';
import { artifactPowersUnlocked, isArtifactEquippedOnActor } from './artifact-actor-rules.js';
import { isItemAssignedToWeaponSet, isWeaponSetPreparedItem } from './weapon-sets.js';
import { artifactLevelToTemplateRank } from './artifact-spell-pick.js';
import { resolveFullLevelProgression, visibleAbilityRows } from './artifact-visible-abilities.js';
import { resolvePowerCategoryFromItem } from './power-catalog.js';
import { getPowerDefinitionRank } from './power-definition-rank.js';
import { getAttackAttributeForPowerTreeOrSchool } from './power-roll-attribute.js';
import { renderAoe, renderDuration, renderRange, renderSpecials } from './power-rendering.js';
import { getTemplate } from './powers/index.js';
export const MINOR_MAGIC_FLAG = 'minorMagic';
export const MINOR_MAGIC_LEDGER_FLAG = 'minorMagicLedger';
export const MINOR_MAGIC_REST_FLAG = 'minorMagicRest';
/** Artifact Actives may be stored only at Basic / Improved (row level ≤ 6). */
export const MINOR_MAGIC_ARTIFACT_LEVEL_CAP = 6;
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
function artifactRowLevelOf(item) {
    const raw = Number(item.system?.artifactRowLevel);
    if (!Number.isFinite(raw) || raw <= 0)
        return null;
    return Math.floor(raw);
}
function isBlockedSourcePower(item) {
    const sys = item.system || {};
    if (isArtifactSourcedPower(item)) {
        const rowLevel = artifactRowLevelOf(item);
        return rowLevel != null && rowLevel > MINOR_MAGIC_ARTIFACT_LEVEL_CAP;
    }
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
export function isEligibleMinorMagicPower(item) {
    if (item?.type !== 'power')
        return false;
    if (resolvePowerCategoryFromItem(item) !== 'active') {
        return false;
    }
    if (isBlockedSourcePower(item))
        return false;
    return true;
}
/**
 * Minor Magic may store a power from an artifact that is worn now or prepared
 * on either Weaponslot. Inventory-only artifacts stay excluded.
 */
export function isArtifactAvailableForMinorMagic(actor, item) {
    if (!item || item.type !== 'artifact')
        return false;
    if (isArtifactEquippedOnActor(item))
        return true;
    if (isWeaponSetPreparedItem(item))
        return true;
    return isItemAssignedToWeaponSet(actor, item.id);
}
/** Offensive / Active artifact rows only — not buffs, movement, reactions, or functions. */
function isArtifactActiveForMinorMagic(rowType) {
    const t = String(rowType || '').trim().toLowerCase();
    if (!t)
        return false;
    if (t.includes('reaction') || t.includes('movement'))
        return false;
    if (t.includes('active buff') || t.includes('active-buff') || (t.includes('buff') && !t.includes('debuff'))) {
        return false;
    }
    if (t.includes('stone') || t.includes('support') || t.includes('passive'))
        return false;
    if (t.includes('aoe') ||
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
    return t.startsWith('active') || t === 'ultimate';
}
function buildSyntheticPowerFromArtifactRow(artifact, row, slotIndex) {
    const templateId = String(row.powerTemplateId || '').trim();
    const tpl = templateId ? getTemplate(templateId) : undefined;
    const plKey = artifactLevelToTemplateRank(Number(row.level) || 1);
    const pl = Number(plKey);
    let levels;
    if (tpl?.levels) {
        let levelRow = tpl.levels[plKey];
        if (levelRow && row.chosenSpecialKey) {
            const specials = (levelRow.specials || []).map((s) => s.key === 'SPECIAL' ? { ...s, key: row.chosenSpecialKey } : s);
            levelRow = { ...levelRow, specials };
        }
        if (levelRow)
            levels = { [plKey]: levelRow };
    }
    return {
        id: `artifact:${artifact.id}:${slotIndex}`,
        type: 'power',
        name: row.name || `${artifact.name} L${row.level}`,
        system: {
            category: 'active',
            powerType: 'active',
            fromArtifact: true,
            source: 'artifact',
            artifactRowLevel: Number(row.level) || 1,
            artifactItemId: artifact.id,
            rank: pl,
            level: pl,
            templateId,
            templateName: tpl?.templateName || row.name || artifact.name,
            isSpell: row.isSpell === true,
            castingAttribute: row.castingAttribute || '',
            chosenSpecial: row.chosenSpecialKey ? { key: row.chosenSpecialKey } : undefined,
            cost: tpl?.cost ?? { action: 'attack' },
            newCost: tpl?.cost,
            levels,
            range: row.range,
            aoe: row.aoe,
            duration: row.duration,
            effect: row.effect,
            specials: row.special ? [row.special] : [],
        },
    };
}
export function listEligibleArtifactMinorMagicPowers(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    const out = [];
    for (const item of items) {
        if (item?.type !== 'artifact')
            continue;
        if (!isArtifactAvailableForMinorMagic(actor, item))
            continue;
        if (!artifactPowersUnlocked(actor, item))
            continue;
        const sys = item.system || {};
        const currentLevel = Number(sys.currentLevel) || Number(sys.level) || 1;
        const cappedLevel = Math.min(currentLevel, MINOR_MAGIC_ARTIFACT_LEVEL_CAP);
        const progression = resolveFullLevelProgression(sys.levelProgression, sys.progressionPicks);
        const rows = visibleAbilityRows(progression, cappedLevel);
        rows.forEach((row, slotIndex) => {
            const lvl = Number(row.level) || 1;
            if (lvl > MINOR_MAGIC_ARTIFACT_LEVEL_CAP)
                return;
            if (!isArtifactActiveForMinorMagic(row.type))
                return;
            out.push(buildSyntheticPowerFromArtifactRow(item, row, slotIndex));
        });
    }
    return out;
}
export function listEligibleMinorMagicPowers(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    const purchased = items.filter((it) => isEligibleMinorMagicPower(it) && !isArtifactSourcedPower(it));
    const artifact = listEligibleArtifactMinorMagicPowers(actor);
    return [...purchased, ...artifact].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
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
function readLevelRow(power) {
    const sys = power.system || {};
    const levels = sys.levels;
    if (!levels || typeof levels !== 'object')
        return null;
    const rankInput = sys.rank ?? sys.level ?? 1;
    const defRank = getPowerDefinitionRank(rankInput, levels);
    const row = Array.isArray(levels)
        ? levels.find((r) => Number(r?.level) === defRank)
        : levels[String(defRank)] ?? levels[String(rankInput)];
    return row && typeof row === 'object' ? row : null;
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
    const row = readLevelRow(power);
    const rankInput = Math.max(1, Math.floor(Number(sys.rank ?? sys.level ?? 1) || 1));
    const definitionRank = getPowerDefinitionRank(rankInput, sys.levels);
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
        powerLevel: rankInput,
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
        return 'Only a purchased Active Power or an Artifact Active (up to Artifact Level 6) can be stored.';
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
async function resolveCreator(flag, fallback) {
    if (fallback?.id && String(fallback.id) === flag.creatorId)
        return fallback;
    const fromWorld = globalThis.game?.actors?.get?.(flag.creatorId);
    return fromWorld || fallback;
}
export async function releaseMinorMagicItem(actor, item) {
    const flag = readMinorMagicFlag(item);
    if (!flag)
        return { ok: false, error: 'Not a Minor Magic Item.' };
    if (flag.released)
        return { ok: true };
    const creator = await resolveCreator(flag, actor);
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
      <p><em>Prototype:</em> the stored Power is recorded. Full attack / trap resolution comes next. The item is spent and no longer counts against the creator’s limit. An empty place can only be filled during a Safe Haven Rest.</p>
    </div>
  `;
}
export async function useMinorMagicItem(actor, item, mode = 'use', trapTrigger) {
    const result = await consumeMinorMagicItem(actor, item, mode, trapTrigger);
    if (!result.ok)
        return result;
    const ChatMessage = globalThis.ChatMessage;
    if (ChatMessage?.create) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker?.({ actor }) ?? {},
            content: buildMinorMagicChatHtml(item.name, result.flag, mode),
        });
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
    const creator = await resolveCreator(flag, parent);
    if (!creator)
        return;
    await releaseOnCreator(creator, ledgerKeyForMinorMagic(flag, item.id));
}
export function minorMagicSheetView(actor) {
    const ledger = getActorMinorMagicLedger(actor);
    const limit = minorMagicLimit(actor);
    const held = countHeldMinorMagicItems(ledger);
    const localKeys = new Set();
    const items = listMinorMagicItemsOnActor(actor).map((it) => {
        const flag = readMinorMagicFlag(it);
        localKeys.add(ledgerKeyForMinorMagic(flag, it.id));
        return {
            id: it.id,
            name: it.name,
            formLabel: MINOR_MAGIC_FORM_LABELS[flag.form],
            powerName: flag.snapshot.powerName,
            summary: snapshotSummaryLines(flag.snapshot).slice(0, 3).join(' · '),
            actionCost: flag.snapshot.actionCost,
            givenAway: false,
            canGive: true,
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
            canGive: false,
        });
    }
    return {
        limit,
        held,
        remaining: Math.max(0, limit - held),
        givenAway: Math.max(0, held - localKeys.size),
        canManage: canManageMinorMagic(actor),
        items,
    };
}
//# sourceMappingURL=minor-magic-items.js.map