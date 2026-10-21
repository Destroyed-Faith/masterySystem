/**
 * Stepped Autofire — pure rules helpers (no Foundry globals).
 *
 * Players Guide "Autofire — Stepped Attack Chain":
 * - Ordered attack slots up to Attack Capacity. The same creature MAY repeat.
 * - Every slot after the first is within 4 m of the preceding slot's target.
 * - ONE Attack/Casting Roll. TN(i) = Defense(i) + 4×(i−1) + 4×DeclaredPaidRaises.
 *   The +4 steps are NOT Paid Raises (no Raise effects; Free Raises cannot cancel them).
 * - First miss ends the chain; earlier hits remain valid.
 */

export const AUTOFIRE_CHAIN_LINK_M = 4;
/** Surcharge added to the TN for each step along the chain. */
export const AUTOFIRE_STEP_TN = 4;
/** Paid Raise increment (kept local so this module stays dependency-free). */
export const AUTOFIRE_PAID_RAISE_TN = 4;

/** Surcharge for a 0-based slot: slot 0 → +0, slot 1 → +4, slot 2 → +8 … */
export function autofireSlotTnSurcharge(slotIndex0Based: number): number {
  return AUTOFIRE_STEP_TN * Math.max(0, Math.floor(Number(slotIndex0Based) || 0));
}

/** Required TN for one slot: Defense + 4×slotIndex + 4×PaidRaises. */
export function autofireRequiredTn(params: {
  defense: number;
  slotIndex0Based: number;
  paidRaises?: number;
}): number {
  const defense = Math.floor(Number(params.defense) || 0);
  const paid = Math.max(0, Math.floor(Number(params.paidRaises) || 0));
  return (
    defense + autofireSlotTnSurcharge(params.slotIndex0Based) + AUTOFIRE_PAID_RAISE_TN * paid
  );
}

/**
 * Can `candidateId` be appended as the next slot?
 * Repeats are allowed (same token = 0 m). Other tokens must be within 4 m of the
 * previous slot's target. The first slot has no link requirement.
 */
export function isAutofireSlotLegal(opts: {
  slotCount: number;
  capacity: number;
  previousTargetId: string | null;
  candidateId: string;
  /** Distance from the previous slot's target (m). Ignored for repeats / first slot. */
  distanceFromPreviousM?: number;
}): boolean {
  if (opts.slotCount >= Math.max(0, Math.floor(Number(opts.capacity) || 0))) return false;
  if (!opts.candidateId) return false;
  if (opts.slotCount === 0 || opts.previousTargetId == null) return true;
  if (String(opts.previousTargetId) === String(opts.candidateId)) return true;
  const d = Number(opts.distanceFromPreviousM);
  return Number.isFinite(d) && d <= AUTOFIRE_CHAIN_LINK_M + 0.05;
}

export type AutofireSlotInput = { defense: number };

export type AutofireSlotEvaluation = {
  slotIndex: number;
  defense: number;
  requiredTn: number;
  surcharge: number;
  hit: boolean;
};

/**
 * Evaluate the chain against one shared attack total. Stops at the first miss;
 * slots after it are not evaluated. Pure — no reactions (those can end the chain
 * later without undoing earlier hits).
 */
export function evaluateAutofireChain(params: {
  attackTotal: number;
  slots: readonly AutofireSlotInput[];
  paidRaises?: number;
}): { slots: AutofireSlotEvaluation[]; hits: number; endedAtSlot: number | null } {
  const total = Math.floor(Number(params.attackTotal) || 0);
  const out: AutofireSlotEvaluation[] = [];
  let hits = 0;
  let endedAtSlot: number | null = null;
  for (let i = 0; i < params.slots.length; i++) {
    const defense = Math.floor(Number(params.slots[i]!.defense) || 0);
    const requiredTn = autofireRequiredTn({
      defense,
      slotIndex0Based: i,
      paidRaises: params.paidRaises,
    });
    const hit = total >= requiredTn;
    out.push({
      slotIndex: i,
      defense,
      requiredTn,
      surcharge: autofireSlotTnSurcharge(i),
      hit,
    });
    if (!hit) {
      endedAtSlot = i;
      break;
    }
    hits++;
  }
  return { slots: out, hits, endedAtSlot };
}

/**
 * Flags for the single shared Damage Roll. Autofire is NOT Instant AoE: weapon /
 * Spell Focus damage stays on, and no AoE flags are set.
 */
export function autofireDamageFlags(flags: Record<string, any>): Record<string, any> {
  const next: Record<string, any> = { ...flags, autofire: true };
  delete next.aoeMeleeWeapon;
  delete next.instantAoe;
  return next;
}
