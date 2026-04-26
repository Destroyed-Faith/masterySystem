/**
 * Passive Slot View — Character Sheet data provider
 *
 * Produces the view-model that the Powers tab uses to render the
 * player-facing Passive Slot Manager (slot dropdowns; slotted = active).
 *
 * Kept separate from `src/powers/passives.ts` so the sheet can stay
 * declarative and the core passives module remains free of UI concerns.
 */
import { getPassiveSlots, getAvailablePassives } from '../powers/passives.js';
import { resolvePowerMechanics } from './power-mechanics.js';
import { summarizePowerMechanics } from './power-mechanics-summary.js';
export function buildPassiveSlotView(actor) {
    const slotsRaw = getPassiveSlots(actor);
    const available = getAvailablePassives(actor);
    const items = actor.items ?? [];
    const slotIdToIndex = new Map();
    for (const s of slotsRaw) {
        const pid = s.passive?.id;
        if (pid)
            slotIdToIndex.set(String(pid), s.slotIndex);
    }
    const slotRows = slotsRaw.map((s) => {
        const pid = s.passive?.id ? String(s.passive.id) : null;
        let summary = null;
        if (pid) {
            const item = items.find?.((it) => String(it.id ?? it._id) === pid || it.name === pid);
            if (item) {
                const mech = resolvePowerMechanics(item);
                const sum = summarizePowerMechanics(mech);
                summary = sum || null;
            }
        }
        return {
            index: s.slotIndex,
            slotKey: `slot${s.slotIndex}`,
            hasPassive: !!s.passive,
            isActive: !!s.passive,
            passiveId: pid,
            passiveName: s.passive?.name ?? null,
            summary,
        };
    });
    const availableRows = available.map((p) => {
        const item = items.find?.((it) => String(it.id ?? it._id) === String(p.id));
        const mech = item ? resolvePowerMechanics(item) : null;
        const sum = summarizePowerMechanics(mech);
        return {
            id: String(p.id),
            name: p.name,
            category: p.category,
            summary: sum,
            slottedInSlot: slotIdToIndex.has(String(p.id)) ? slotIdToIndex.get(String(p.id)) ?? null : null,
        };
    });
    const activeCount = slotRows.filter((r) => r.hasPassive).length;
    const maxSlots = slotRows.length;
    return {
        slots: slotRows,
        availablePassives: availableRows,
        activeCount,
        maxSlots,
        canActivateMore: activeCount < maxSlots,
    };
}
//# sourceMappingURL=passive-slot-view.js.map