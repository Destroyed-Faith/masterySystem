/**
 * Summon Bond combat enforcement (Players Guide Summons V2).
 *
 * - Multiple Bodies share one Summon Attack budget per Bond per Round.
 * - Bond Special applies at most once per Round.
 * - Summons cannot use Stones / Artifacts / unbought Powers.
 */
import { getRoundState, setRoundState } from '../combat/action-economy.js';
import { getSummonBondsFromActor } from './summon-bond-bind.js';
function usageMap(rs) {
    const raw = rs.summonBondUsage;
    return raw && typeof raw === 'object' ? { ...raw } : {};
}
export function getSummonBondUsage(ownerActor, combat, bondId) {
    const rs = getRoundState(ownerActor, combat);
    const map = usageMap(rs);
    return map[bondId] ?? { bondId, attacksUsed: 0, specialApplied: false, reactionsUsed: 0 };
}
export function remainingSummonAttacks(ownerActor, combat, bond) {
    const used = getSummonBondUsage(ownerActor, combat, bond.id).attacksUsed;
    return Math.max(0, Math.floor(Number(bond.summonAttacks) || 1) - used);
}
export async function spendSummonAttack(ownerActor, combat, bond) {
    const remaining = remainingSummonAttacks(ownerActor, combat, bond);
    if (remaining <= 0) {
        return { ok: false, reason: 'No Summon Attacks remaining for this Bond this Round.' };
    }
    const rs = getRoundState(ownerActor, combat);
    const map = usageMap(rs);
    const cur = map[bond.id] ?? { bondId: bond.id, attacksUsed: 0, specialApplied: false, reactionsUsed: 0 };
    map[bond.id] = { ...cur, attacksUsed: cur.attacksUsed + 1 };
    rs.summonBondUsage = map;
    await setRoundState(ownerActor, rs);
    return { ok: true };
}
export async function tryApplySummonBondSpecial(ownerActor, combat, bond) {
    if (!bond.specialKey || bond.specialValue <= 0) {
        return { ok: false, reason: 'Bond has no Special Access.' };
    }
    const cur = getSummonBondUsage(ownerActor, combat, bond.id);
    if (cur.specialApplied) {
        return { ok: false, reason: 'Summon Bond Special already applied this Round.' };
    }
    const rs = getRoundState(ownerActor, combat);
    const map = usageMap(rs);
    map[bond.id] = { ...cur, specialApplied: true };
    rs.summonBondUsage = map;
    await setRoundState(ownerActor, rs);
    return { ok: true, specialKey: bond.specialKey, specialValue: bond.specialValue };
}
export async function spendSummonBondReaction(ownerActor, combat, bond) {
    const cur = getSummonBondUsage(ownerActor, combat, bond.id);
    if (cur.reactionsUsed >= 1) {
        return { ok: false, reason: 'Summon Bond may use only one Reaction per Round.' };
    }
    const rs = getRoundState(ownerActor, combat);
    const map = usageMap(rs);
    map[bond.id] = { ...cur, reactionsUsed: cur.reactionsUsed + 1 };
    rs.summonBondUsage = map;
    await setRoundState(ownerActor, rs);
    return { ok: true };
}
/** Summon actors have no stone pools, artifacts, or power shopping outside Bond purchases. */
export function summonActorMayUseStonesOrArtifacts(actor) {
    if (!actor || actor.type !== 'summon')
        return true;
    return false;
}
export function bodyHasPurchasedPower(bond, bodyId, templateId) {
    const body = bond.bodies.find((b) => b.id === bodyId);
    if (!body)
        return false;
    return (body.powers || []).some((p) => p.templateId === templateId);
}
/** Extra bodies never increase the Bond attack budget by themselves. */
export function bondAttackBudgetFromBodies(bond) {
    return Math.max(1, Math.floor(Number(bond.summonAttacks) || 1));
}
/** Resolve Bond + owner from a summon body actor. */
export function resolveSummonBondContext(summonActor) {
    if (!summonActor || summonActor.type !== 'summon')
        return null;
    const link = summonActor.system?.summonBond ?? {};
    const ownerId = link.ownerActorId || summonActor.system?.familiar?.ownerActorId;
    const bondId = link.bondId || summonActor.system?.familiar?.familiarId;
    if (!ownerId || !bondId)
        return null;
    const owner = game.actors?.get(ownerId);
    if (!owner)
        return null;
    const bond = getSummonBondsFromActor(owner).find((b) => b.id === bondId);
    if (!bond)
        return null;
    const body = bond.bodies.find((b) => b.id === link.bodyId || b.summonActorId === summonActor.id) ?? bond.bodies[0];
    if (!body)
        return null;
    return { owner, bond, body };
}
//# sourceMappingURL=summon-combat.js.map