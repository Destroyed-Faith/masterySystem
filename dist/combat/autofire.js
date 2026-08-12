/**
 * Autofire attack mode — ordered chain of targets, one shared Attack Roll.
 *
 * Before rolling, declare up to `1 + extraTargets` creatures. Every target after
 * the first must be within 4 m of the previous target and within the Power's
 * Range. Compare the same final result against each target's Evade in order;
 * the first miss ends the chain. No Raises are required for target count.
 * Every hit receives the full printed payload. Dive for Cover cannot be used.
 */
import { resolvePowerMechanics } from '../utils/power-mechanics.js';
import { getTargetEvade } from './attack-executor.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
import { resolveBurstTarget } from './aoe-melee-resolution.js';
export const AUTOFIRE_CHAIN_LINK_M = 4;
/** Detect Autofire mode from a radial option / power item. */
export function detectAutofire(option) {
    try {
        if (option.source === 'npc-attack') {
            return !!option.npcAutofire;
        }
        if (option.source !== 'power' || !option.item)
            return false;
        const tid = String(option.item.system?.templateId || '');
        if (tid === 'active-ranged-weapon-autofire')
            return true;
        const mech = resolvePowerMechanics(option.item);
        return !!mech?.autofire && Math.floor(Number(mech.autofire.extraTargets) || 0) > 0;
    }
    catch {
        return false;
    }
}
/** Maximum additional targets after the first (Autofire(X) → X). */
export function getAutofireExtraTargets(option) {
    try {
        if (option.source === 'npc-attack') {
            return Math.max(0, Math.floor(Number(option.npcAutofireExtraTargets) || 0));
        }
        if (option.source !== 'power' || !option.item)
            return 0;
        const mech = resolvePowerMechanics(option.item);
        if (mech?.autofire) {
            return Math.max(0, Math.floor(Number(mech.autofire.extraTargets) || 0));
        }
        const tid = String(option.item.system?.templateId || '');
        if (tid === 'active-ranged-weapon-autofire') {
            const aoe = option.item.system?.aoe;
            const targets = Math.max(1, Math.floor(Number(aoe?.targets) || 1));
            return Math.max(0, targets - 1);
        }
    }
    catch {
        /* ignore */
    }
    return 0;
}
export function getAutofireMaxTargets(option) {
    return 1 + getAutofireExtraTargets(option);
}
/**
 * Resolve an ordered Autofire chain after the shared Attack Roll.
 * Stops at the first miss. Full payload per hit; no Dive for Cover.
 */
export async function resolveAutofireChain(params) {
    const { attacker, chainTokenIds, attackTotal } = params;
    const raiseSlots = Math.max(0, Math.floor(Number(params.declaredRaiseSlots) || 0));
    const flags = { ...params.flags };
    const weaponId = params.weaponId ?? flags.weaponId ?? null;
    if (!chainTokenIds.length)
        return;
    const { resolveAoeFullPayloadOnTarget } = await import('./aoe-melee-resolution.js');
    for (let i = 0; i < chainTokenIds.length; i++) {
        const tid = chainTokenIds[i];
        const resolved = resolveBurstTarget(tid);
        if (!resolved?.defender) {
            await ChatMessage.create({
                user: game.user?.id,
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                content: `<p><strong>Autofire</strong> — could not resolve target #${i + 1}; chain ends.</p>`,
            });
            break;
        }
        const { defender, tok } = resolved;
        if (typeof defender.prepareDerivedData === 'function') {
            try {
                defender.prepareDerivedData();
            }
            catch {
                /* ignore */
            }
        }
        const normalTn = getTargetEvade(defender);
        const raiseTn = raiseSlots > 0 ? normalTn + raiseSlots * RAISE_INCREMENT : normalTn;
        const hit = attackTotal >= normalTn;
        if (!hit) {
            await ChatMessage.create({
                user: game.user?.id,
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                content: `<p><strong>Autofire</strong> → <strong>${defender.name}</strong> (#${i + 1}): miss (roll ${attackTotal} vs Evade ${normalTn}${raiseSlots > 0 ? `, Raise TN ${raiseTn}` : ''}). <strong>Chain ends.</strong></p>`,
            });
            break;
        }
        await ChatMessage.create({
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor: attacker }),
            content: `<p><strong>Autofire</strong> → <strong>${defender.name}</strong> (#${i + 1}): hit (roll ${attackTotal} vs Evade ${normalTn}).</p>`,
        });
        const creatureFlags = {
            ...flags,
            raiseOutcome: raiseSlots > 0 && attackTotal < raiseTn
                ? 'partial'
                : flags.raiseOutcome === 'fail'
                    ? 'partial'
                    : flags.raiseOutcome || 'full',
            autofire: true,
        };
        const outcome = await resolveAoeFullPayloadOnTarget({
            attacker,
            defender,
            tok,
            weaponId,
            flags: creatureFlags,
            attackTotal,
            evadeTn: normalTn,
            allowDiveForCover: false,
        });
        // Reaction: Evade that turns a hit into a miss ends the Autofire chain.
        if (outcome === 'negated') {
            await ChatMessage.create({
                user: game.user?.id,
                speaker: ChatMessage.getSpeaker({ actor: attacker }),
                content: `<p><strong>Autofire</strong> — hit on <strong>${defender.name}</strong> negated by reaction. <strong>Chain ends.</strong></p>`,
            });
            break;
        }
    }
}
//# sourceMappingURL=autofire.js.map