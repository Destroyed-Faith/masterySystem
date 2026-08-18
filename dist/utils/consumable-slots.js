/**
 * Consumable Slots — Mastery Rank equipment slots for consumable gear
 * (including Minor Magic Items). Slot occupancy lives on the item's
 * existing `flags.mastery-system.equipment` object. Slot count is derived
 * from the actor's current Mastery Rank (no parallel inventory).
 */
import { readMinorMagicFlag, snapshotSummaryLines } from './minor-magic-items.js';
export const CONSUMABLE_SLOT_FLAG = 'consumableSlot';
export const CONSUMABLE_I18N_KEYS = [
    'MASTERY.consumable.title',
    'MASTERY.consumable.slotLabel',
    'MASTERY.consumable.empty',
    'MASTERY.consumable.lockedInCombat',
    'MASTERY.consumable.notConsumable',
    'MASTERY.consumable.slotUnavailable',
    'MASTERY.consumable.slotOccupied',
    'MASTERY.consumable.missingItem',
    'MASTERY.consumable.notEquipped',
    'MASTERY.consumable.noAttackAction',
    'MASTERY.consumable.useFailed',
    'MASTERY.consumable.rankUnequipped',
    'MASTERY.consumable.attackActions',
    'MASTERY.consumable.use',
    'MASTERY.consumable.badge',
    'MASTERY.consumable.printFootnote',
    'MASTERY.consumable.powerLabel',
];
export function localizeConsumable(key, fallback) {
    const loc = globalThis.game?.i18n?.localize?.(key);
    if (typeof loc === 'string' && loc && loc !== key)
        return loc;
    return fallback;
}
export function consumableSlotCount(masteryRank) {
    return Math.max(0, Math.floor(Number(masteryRank) || 0));
}
export function actorConsumableSlotCount(actor) {
    return consumableSlotCount(Number(actor?.system?.mastery?.rank) || 1);
}
export function isConsumableItem(item) {
    if (!item)
        return false;
    if (item.system?.consumable === true)
        return true;
    return !!readMinorMagicFlag(item);
}
export function readConsumableSlotIndex(item) {
    const flags = item.getFlag?.('mastery-system', 'equipment') ??
        item.flags?.['mastery-system']?.equipment;
    const n = Math.floor(Number(flags?.consumableSlot));
    return Number.isFinite(n) && n >= 0 ? n : null;
}
export function equipmentFlagsWithConsumableSlot(current, index) {
    const next = { ...(current || {}) };
    if (index == null) {
        delete next.consumableSlot;
    }
    else {
        next.consumableSlot = index;
        if (!next.container)
            next.container = 'inventory';
    }
    return next;
}
export function itemDataForConsumableTransfer(source) {
    const data = typeof source?.toObject === 'function'
        ? source.toObject()
        : JSON.parse(JSON.stringify(source || {}));
    delete data._id;
    delete data.folder;
    delete data.ownership;
    delete data.sort;
    const flags = (data.flags ||= {});
    const ms = (flags['mastery-system'] ||= {});
    const equipment = { ...(ms.equipment || {}) };
    delete equipment.consumableSlot;
    delete equipment.slot;
    ms.equipment = equipment;
    return data;
}
export function listEquippedConsumableItems(actor) {
    const items = actor?.items ? Array.from(actor.items) : [];
    const rows = [];
    const seen = new Set();
    for (const item of items) {
        if (!isConsumableItem(item))
            continue;
        const index = readConsumableSlotIndex(item);
        if (index == null)
            continue;
        const id = String(item.id || '');
        if (!id || seen.has(id))
            continue;
        seen.add(id);
        rows.push({ index, item });
    }
    return rows.sort((a, b) => a.index - b.index);
}
export function itemOccupyingConsumableSlot(actor, index) {
    return listEquippedConsumableItems(actor).find((row) => row.index === index)?.item ?? null;
}
export function isItemInAnyConsumableSlot(actor, itemId) {
    return listEquippedConsumableItems(actor).some((row) => String(row.item?.id) === itemId);
}
export function actorParticipatesInActiveCombat(actor) {
    const combat = globalThis.game?.combat;
    if (!combat?.active)
        return false;
    const id = String(actor?.id || '');
    if (!id)
        return false;
    return !!combat.combatants?.some((c) => String(c.actorId || c.actor?.id || '') === id);
}
export function validateEquipConsumable(opts) {
    if (!opts.item)
        return 'missing-item';
    if (!isConsumableItem(opts.item))
        return 'not-consumable';
    const count = actorConsumableSlotCount(opts.actor);
    if (opts.index < 0 || opts.index >= count)
        return 'slot-oob';
    const inCombat = opts.inCombat ?? actorParticipatesInActiveCombat(opts.actor);
    if (inCombat)
        return 'in-combat';
    const occupant = itemOccupyingConsumableSlot(opts.actor, opts.index);
    if (occupant && occupant.id !== opts.item.id)
        return 'occupied';
    return null;
}
export function validateUnequipConsumable(opts) {
    if (!opts.item)
        return 'missing-item';
    if (readConsumableSlotIndex(opts.item) == null)
        return null;
    const inCombat = opts.inCombat ?? actorParticipatesInActiveCombat(opts.actor);
    if (inCombat)
        return 'in-combat';
    return null;
}
export function equipErrorMessage(error) {
    switch (error) {
        case 'not-consumable':
            return localizeConsumable('MASTERY.consumable.notConsumable', 'Only consumable items can occupy a Consumable Slot.');
        case 'in-combat':
            return localizeConsumable('MASTERY.consumable.lockedInCombat', 'Consumable Slots cannot be changed during combat.');
        case 'slot-oob':
            return localizeConsumable('MASTERY.consumable.slotUnavailable', 'That Consumable Slot is not available at this Mastery Rank.');
        case 'occupied':
            return localizeConsumable('MASTERY.consumable.slotOccupied', 'That Consumable Slot is already occupied.');
        case 'missing-item':
            return localizeConsumable('MASTERY.consumable.missingItem', 'Item not found.');
    }
}
export function slotsToUnequipAfterRankChange(equippedIndexes, newRank) {
    const count = consumableSlotCount(newRank);
    return equippedIndexes.filter((index) => index >= count).sort((a, b) => a - b);
}
export function buildConsumableSlotView(actor) {
    const count = actorConsumableSlotCount(actor);
    const locked = actorParticipatesInActiveCombat(actor);
    const equipped = listEquippedConsumableItems(actor);
    const byIndex = new Map(equipped.map((row) => [row.index, row.item]));
    const slots = Array.from({ length: count }, (_, index) => {
        const item = byIndex.get(index) ?? null;
        const flag = item ? readMinorMagicFlag(item) : null;
        return {
            index,
            label: localizeConsumable('MASTERY.consumable.slotLabel', 'Consumable {n}').replace('{n}', String(index + 1)),
            empty: !item,
            item,
            itemId: item ? String(item.id || '') : '',
            name: item ? String(item.name || '') : '',
            img: item ? String(item.img || 'icons/svg/item-bag.svg') : '',
            powerName: flag?.snapshot?.powerName || '',
            summary: flag?.snapshot ? snapshotSummaryLines(flag.snapshot).slice(0, 2).join(' · ') : '',
        };
    });
    return {
        count,
        locked,
        slots,
        inlineSlots: slots.slice(0, 2),
        extraSlots: slots.slice(2),
    };
}
export function equippedConsumableActionRows(actor) {
    return listEquippedConsumableItems(actor).map(({ index, item }) => {
        const flag = readMinorMagicFlag(item);
        return {
            index,
            itemId: String(item.id || ''),
            name: String(item.name || ''),
            img: String(item.img || 'icons/svg/item-bag.svg'),
            powerName: flag?.snapshot?.powerName || '',
            summary: flag?.snapshot ? snapshotSummaryLines(flag.snapshot).slice(0, 3).join(' · ') : '',
            creatorId: flag?.creatorId || '',
            snapshot: flag?.snapshot ?? null,
        };
    });
}
export function attackActionConsumableIds(actor) {
    return equippedConsumableActionRows(actor).map((row) => row.itemId);
}
export function parseStoredRangeMeters(range) {
    if (!range)
        return 2;
    const lower = range.toLowerCase();
    if (lower.includes('self'))
        return 0;
    if (lower.includes('touch') || lower.includes('melee'))
        return 2;
    const match = range.match(/(\d+(?:\.\d+)?)\s*m/i);
    if (match)
        return Math.max(1, Number(match[1]));
    return 8;
}
export function storedPowerIgnoresWeapon(_snapshot) {
    return true;
}
export function storedPowerKeepsSpecials(snapshot) {
    return snapshot?.specials && snapshot.specials !== '—' ? snapshot.specials : '';
}
export function consumableGrantsExtraAttack() {
    return false;
}
export function consumableUseSpendsAttackAction() {
    return true;
}
export function consumableUseActionPlan(inCombat, availableActions) {
    if (!inCombat)
        return 'no-spend';
    if (availableActions <= 0)
        return 'blocked';
    return 'spend-on-success';
}
export function shouldConsumeConsumableOnUse(result) {
    return result === 'success';
}
export function isConsumableCombatOption(option) {
    if (!option)
        return false;
    if (option.consumableItemId)
        return true;
    return Array.isArray(option.tags) && option.tags.includes('consumable');
}
function snapshotSpecialsList(snapshot) {
    const raw = storedPowerKeepsSpecials(snapshot);
    return raw ? [raw] : [];
}
export function buildConsumableAttackOption(actor, item) {
    const flag = readMinorMagicFlag(item);
    const snapshot = flag?.snapshot ?? null;
    const rangeM = parseStoredRangeMeters(snapshot?.range);
    const badge = localizeConsumable('MASTERY.consumable.badge', 'Consumable');
    const powerName = snapshot?.powerName || '';
    const displayName = powerName ? `${item.name} (${powerName})` : String(item.name || badge);
    return {
        id: `consumable-${item.id}`,
        name: `${badge}: ${displayName}`,
        description: snapshot ? snapshotSummaryLines(snapshot).join(' · ') : String(item.system?.description || ''),
        slot: 'attack',
        source: 'power',
        powerType: 'active',
        range: rangeM,
        item: {
            id: item.id,
            name: item.name,
            img: item.img,
            type: 'power',
            system: {
                powerType: 'active',
                category: 'active',
                isSpell: snapshot?.isSpell ?? false,
                castingAttribute: snapshot?.castingAttribute,
                level: snapshot?.powerLevel,
                specials: snapshotSpecialsList(snapshot),
                roll: {
                    damage: snapshot?.damage && snapshot.damage !== '—' ? snapshot.damage : '',
                    attribute: snapshot?.attackPool?.attribute,
                },
                range: snapshot?.range,
                aoe: snapshot?.aoe,
                effect: snapshot?.effect,
                cost: { action: 'attack' },
                consumable: true,
            },
        },
        tags: ['consumable', 'minor-magic'],
        costsAction: true,
        consumableItemId: String(item.id || ''),
        storedAttackPool: snapshot?.attackPool ?? null,
        ignoreWeaponDamage: true,
        powerData: {
            specials: snapshotSpecialsList(snapshot),
            damage: snapshot?.damage && snapshot.damage !== '—' ? snapshot.damage : '',
        },
    };
}
export function buildConsumableRadialOptions(actor, opts) {
    const available = opts?.attackActionsAvailable ?? 1;
    return listEquippedConsumableItems(actor).map(({ item }) => {
        const option = buildConsumableAttackOption(actor, item);
        option.disabled = available <= 0;
        return option;
    });
}
export function buildConsumablePrintEntries(actor) {
    return equippedConsumableActionRows(actor).map((row) => {
        const snap = row.snapshot;
        const pool = snap?.attackPool;
        return {
            name: row.powerName ? `${row.name} (${row.powerName})` : row.name,
            powerName: row.powerName,
            effect: row.summary,
            phase: 'Active',
            attackRoll: pool ? `${pool.numDice}k${pool.keepDice} (${pool.attribute})` : '',
            damageRoll: snap?.damage && snap.damage !== '—' ? snap.damage : '',
            battleFootnote: localizeConsumable('MASTERY.consumable.printFootnote', 'Consumable — stored Power only. No weapon dice or weapon Specials.'),
            hideRank: true,
            fromConsumable: true,
            battleCompact: true,
            img: row.img,
        };
    });
}
export function buildConsumablePrintSlots(actor) {
    return buildConsumableSlotView(actor).slots.map((slot) => ({
        index: slot.index,
        label: slot.label,
        empty: slot.empty,
        name: slot.name,
        img: slot.img,
        powerName: slot.powerName,
        summary: slot.summary,
    }));
}
export async function equipConsumableToSlot(actor, item, index) {
    const err = validateEquipConsumable({ actor, item, index });
    if (err)
        return { ok: false, error: equipErrorMessage(err) };
    const current = item.getFlag?.('mastery-system', 'equipment') || {};
    await item.update({
        'flags.mastery-system.equipment': equipmentFlagsWithConsumableSlot(current, index),
        'system.equipped': false,
    });
    return { ok: true };
}
export async function unequipConsumable(actor, item) {
    const err = validateUnequipConsumable({ actor, item });
    if (err)
        return { ok: false, error: equipErrorMessage(err) };
    if (readConsumableSlotIndex(item) == null)
        return { ok: true };
    const current = item.getFlag?.('mastery-system', 'equipment') || {};
    await item.update({
        'flags.mastery-system.equipment': equipmentFlagsWithConsumableSlot(current, null),
    });
    return { ok: true };
}
export async function syncConsumableSlotsToMasteryRank(actor) {
    const count = actorConsumableSlotCount(actor);
    const overflow = listEquippedConsumableItems(actor).filter((row) => row.index >= count);
    const names = [];
    for (const row of overflow) {
        const current = row.item.getFlag?.('mastery-system', 'equipment') || {};
        await row.item.update({
            'flags.mastery-system.equipment': equipmentFlagsWithConsumableSlot(current, null),
        });
        names.push(String(row.item.name || row.item.id));
    }
    return names;
}
export function rankChangeNotification(names) {
    const list = names.join(', ');
    return localizeConsumable('MASTERY.consumable.rankUnequipped', 'Mastery Rank decreased. Unequipped from Consumable Slots (items remain in inventory): {names}').replace('{names}', list);
}
export async function transferConsumableToActor(targetActor, sourceItem) {
    if (!sourceItem || !targetActor)
        return null;
    if (sourceItem.parent?.id === targetActor.id)
        return sourceItem;
    const data = itemDataForConsumableTransfer(sourceItem);
    const [created] = await targetActor.createEmbeddedDocuments('Item', [data]);
    const sourceActor = sourceItem.parent;
    if (sourceActor?.deleteEmbeddedDocuments && sourceItem.id) {
        await sourceActor.deleteEmbeddedDocuments('Item', [sourceItem.id]);
    }
    return created ?? null;
}
export async function consumeEquippedConsumableAfterSuccess(actor, item) {
    const { useMinorMagicItem, readMinorMagicFlag: readFlag } = await import('./minor-magic-items.js');
    if (readFlag(item)) {
        const used = await useMinorMagicItem(actor, item, 'use');
        if (!used.ok)
            return used;
        return { ok: true };
    }
    if (item?.id && actor?.deleteEmbeddedDocuments) {
        await actor.deleteEmbeddedDocuments('Item', [item.id]);
    }
    return { ok: true };
}
function findActorToken(actor) {
    const tokens = globalThis.canvas?.tokens;
    const id = String(actor?.id || '');
    if (!id)
        return null;
    const fromControlled = tokens?.controlled?.find((t) => String(t.actor?.id || '') === id);
    if (fromControlled)
        return fromControlled;
    return tokens?.placeables?.find((t) => String(t.actor?.id || '') === id) ?? null;
}
export async function useEquippedConsumable(actor, item) {
    if (!item || readConsumableSlotIndex(item) == null) {
        return {
            ok: false,
            error: localizeConsumable('MASTERY.consumable.notEquipped', 'Only equipped consumables can be used as an Attack Action.'),
        };
    }
    const combat = globalThis.game?.combat ?? null;
    const inCombat = !!combat?.active && actorParticipatesInActiveCombat(actor);
    if (inCombat) {
        const { getAvailableAttackActions } = await import('../combat/action-economy.js');
        const available = getAvailableAttackActions(actor, combat);
        if (consumableUseActionPlan(true, available) === 'blocked') {
            return {
                ok: false,
                error: localizeConsumable('MASTERY.consumable.noAttackAction', 'No Attack Actions remaining.'),
            };
        }
        const token = findActorToken(actor);
        if (!token) {
            return {
                ok: false,
                error: localizeConsumable('MASTERY.consumable.useFailed', 'The consumable was not used.'),
                failed: true,
            };
        }
        const { handleChosenCombatOption } = await import('../token-action-selector.js');
        await handleChosenCombatOption(token, buildConsumableAttackOption(actor, item));
        return { ok: true, deferred: true };
    }
    try {
        const result = await consumeEquippedConsumableAfterSuccess(actor, item);
        if (!result.ok)
            return { ok: false, error: result.error, failed: true };
        return { ok: true };
    }
    catch {
        return {
            ok: false,
            error: localizeConsumable('MASTERY.consumable.useFailed', 'The consumable was not used.'),
            failed: true,
        };
    }
}
//# sourceMappingURL=consumable-slots.js.map