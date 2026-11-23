/**
 * Active Buff activation limit (Core v0.9.9.6): each named Active Buff may be
 * activated once per Combat. Switching during Preparation is only allowed to a
 * Buff whose activation is still unused. Ending a Buff never refunds its use.
 *
 * Ledger: actor flag `activeBuffCombatUses = { combatId, keys }`. A ledger from
 * another Combat counts as empty, so no cleanup is needed for correctness.
 */

export const ACTIVE_BUFF_COMBAT_USES_FLAG = 'activeBuffCombatUses';

type Ledger = { combatId: string; keys: string[] };

/** Identity of a named Active Buff granted by a Power item. */
export function activeBuffUseKey(power: any): string {
  const tpl = String(power?.system?.templateId ?? '').trim().toLowerCase();
  if (tpl) return `tpl:${tpl}`;
  return `item:${String(power?.id ?? power?._id ?? power?.name ?? '').trim()}`;
}

/** Identity of a named Active Buff granted by an Artifact function. */
export function artifactActiveBuffUseKey(artifactItem: any, option: any): string {
  const itemId = String(artifactItem?.id ?? artifactItem?._id ?? '').trim();
  const fn = String(option?.artifactFunctionId ?? '').trim();
  const name = String(option?.name ?? '')
    .replace(/\s+[IVX]+$/i, '')
    .trim()
    .toLowerCase();
  return `artifact:${itemId}:${fn || name || String(option?.id ?? '')}`;
}

/** Use key for a Preparation-list entry (Power item or synthetic Artifact row). */
export function preparationEntryUseKey(entry: any): string {
  if (entry?.__artifactOption && entry?.__artifactItem) {
    return artifactActiveBuffUseKey(entry.__artifactItem, entry.__artifactOption);
  }
  return activeBuffUseKey(entry);
}

function readLedger(actor: any): Ledger | null {
  const raw = actor?.getFlag?.('mastery-system', ACTIVE_BUFF_COMBAT_USES_FLAG);
  if (!raw || typeof raw !== 'object') return null;
  const combatId = String((raw as any).combatId ?? '');
  const keys = Array.isArray((raw as any).keys) ? (raw as any).keys.map(String) : [];
  return combatId ? { combatId, keys } : null;
}

/** Keys already activated in `combat` (empty for another or no Combat). */
export function activeBuffKeysUsedThisCombat(actor: any, combat: any): string[] {
  const combatId = String(combat?.id ?? '');
  if (!combatId) return [];
  const ledger = readLedger(actor);
  return ledger && ledger.combatId === combatId ? ledger.keys : [];
}

export function isActiveBuffUsedThisCombat(actor: any, combat: any, key: string): boolean {
  return activeBuffKeysUsedThisCombat(actor, combat).includes(key);
}

export async function markActiveBuffUsedThisCombat(actor: any, combat: any, key: string): Promise<void> {
  const combatId = String(combat?.id ?? '');
  if (!combatId || !key) return;
  const keys = activeBuffKeysUsedThisCombat(actor, combat);
  if (keys.includes(key)) return;
  await actor?.setFlag?.('mastery-system', ACTIVE_BUFF_COMBAT_USES_FLAG, {
    combatId,
    keys: [...keys, key],
  });
}

export async function clearActiveBuffCombatUses(actor: any): Promise<void> {
  if (actor?.getFlag?.('mastery-system', ACTIVE_BUFF_COMBAT_USES_FLAG) == null) return;
  await actor?.unsetFlag?.('mastery-system', ACTIVE_BUFF_COMBAT_USES_FLAG);
}
