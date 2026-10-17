/**
 * Passive Slot View — Character Sheet data provider
 *
 * Produces the view-model that the Powers tab uses to render the
 * player-facing Passive Slot Manager (slot dropdowns; slotted = active).
 *
 * Kept separate from `src/powers/passives.ts` so the sheet can stay
 * declarative and the core passives module remains free of UI concerns.
 */

import {
  getPassiveSlots,
  getAvailablePassives,
  getPassiveSlotCountForMasteryRank,
  MAX_PASSIVE_SLOTS,
  getPassiveSlotUnlockRank,
  formatPassiveDescription,
  findPassivePowerItem,
} from '../powers/passives.js';
import { getRulesMasteryRank } from './mastery-rank-sync.js';

export interface PassiveSlotRow {
  index: number;
  slotKey: string;
  hasPassive: boolean;
  isActive: boolean;
  locked: boolean;
  passiveId: string | null;
  passiveName: string | null;
  summary: string | null;
  unlockMasteryRank: number;
}

export interface PassiveSlotViewAvailable {
  id: string;
  name: string;
  category: string;
  summary: string;
  slottedInSlot: number | null;
}

export interface PassiveSlotView {
  slots: PassiveSlotRow[];
  availablePassives: PassiveSlotViewAvailable[];
  activeCount: number;
  maxSlots: number;
  maxSlotsTotal: number;
  masteryRank: number;
  canActivateMore: boolean;
}

export function buildPassiveSlotView(actor: any): PassiveSlotView {
  const slotsRaw = getPassiveSlots(actor);
  const available = getAvailablePassives(actor);
  const items = (actor as any).items ?? [];
  const masteryRank = getRulesMasteryRank(actor);
  const maxSlots = getPassiveSlotCountForMasteryRank(masteryRank);

  const slotIdToIndex = new Map<string, number>();
  for (const s of slotsRaw) {
    const pid = s.passive?.id;
    if (pid) slotIdToIndex.set(String(pid), s.slotIndex);
  }

  const slotRows: PassiveSlotRow[] = slotsRaw.map((s) => {
    const pid = s.passive?.id ? String(s.passive.id) : null;
    let summary: string | null = null;
    if (pid) {
      const item =
        findPassivePowerItem(actor, pid) ||
        items.find?.((it: any) => String(it.id ?? it._id) === pid || it.name === pid);
      if (item) summary = formatPassiveDescription(item) || null;
      else if (s.passive?.description) summary = String(s.passive.description);
    }
    return {
      index: s.slotIndex,
      slotKey: `slot${s.slotIndex}`,
      hasPassive: !!s.passive,
      isActive: !!s.passive,
      locked: !!s.locked,
      passiveId: pid,
      passiveName: s.passive?.name ?? null,
      summary,
      unlockMasteryRank: s.unlockMasteryRank ?? getPassiveSlotUnlockRank(s.slotIndex) ?? 1,
    };
  });

  const availableRows: PassiveSlotViewAvailable[] = available.map((p) => {
    const item =
      findPassivePowerItem(actor, String(p.id)) ||
      items.find?.((it: any) => String(it.id ?? it._id) === String(p.id));
    return {
      id: String(p.id),
      name: p.name,
      category: p.category,
      summary: p.description || (item ? formatPassiveDescription(item) : ''),
      slottedInSlot: slotIdToIndex.has(String(p.id)) ? slotIdToIndex.get(String(p.id)) ?? null : null,
    };
  });

  const activeCount = slotRows.filter((r) => r.hasPassive && !r.locked).length;

  return {
    slots: slotRows,
    availablePassives: availableRows,
    activeCount,
    maxSlots,
    maxSlotsTotal: MAX_PASSIVE_SLOTS,
    masteryRank,
    canActivateMore: activeCount < maxSlots,
  };
}
