/**
 * Core Ritual skill-check flow (DF 2026): Base TN = 4 × max(3, Task Level),
 * Final TN = Base + 4 × Paid Raises, Stones Sealed by total Raises (Paid + Free)
 * on the attempt (success or failure).
 */
import { masteryRoll } from '../dice/roll-handler.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';
import { coreRitualTierText, isSealPassage, } from '../rules/core-rituals.js';
import { planRitualRaises } from '../rules/ritual-tn.js';
import { getEquippedPhysicalSkillPenaltyDice } from '../utils/equipment-modifiers.js';
const ATTRIBUTE_KEYS = new Set([
    'might',
    'agility',
    'vitality',
    'intellect',
    'resolve',
    'influence',
    'wits',
]);
function escapeHtml(text) {
    return String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function availableStones(system) {
    const ready = Math.max(0, Number(system.stones?.ready) || 0);
    const exhausted = Math.max(0, Number(system.stones?.exhausted) || 0);
    return { ready, exhausted, available: ready + exhausted };
}
async function sealRitualStones(actor, cost, placed) {
    const system = actor.system;
    const updates = {};
    if (placed && placed.length === cost) {
        const counts = {};
        for (const attr of placed)
            counts[attr] = (counts[attr] || 0) + 1;
        for (const [attr, n] of Object.entries(counts)) {
            const current = Math.max(0, Number(system.stonePools?.[attr]?.current) || 0);
            if (current < n)
                return false;
            updates[`system.stonePools.${attr}.current`] = current - n;
            // Track the seal on the pool so regen / refills cannot resurrect these
            // stones before a Safe Haven Rest.
            const sealedNow = Math.max(0, Number(system.stonePools?.[attr]?.sealed) || 0);
            updates[`system.stonePools.${attr}.sealed`] = sealedNow + n;
        }
    }
    else {
        const { ready, exhausted, available } = availableStones(system);
        if (available < cost)
            return false;
        const fromReady = Math.min(ready, cost);
        const fromExhausted = cost - fromReady;
        updates['system.stones.ready'] = ready - fromReady;
        updates['system.stones.exhausted'] = exhausted - fromExhausted;
    }
    updates['system.stones.sealed'] = Math.max(0, Number(system.stones?.sealed) || 0) + cost;
    await actor.update(updates);
    return true;
}
export async function showRitualRollDialog(actor, ritualId) {
    const { RitualWorkshopDialog } = await import('../stones/ritual-workshop-dialog.js');
    await RitualWorkshopDialog.show(actor, ritualId);
}
export async function performRitualRoll(actor, ritual, opts) {
    const system = actor.system;
    const masteryRank = getRulesMasteryRank(actor);
    if (!ATTRIBUTE_KEYS.has(opts.attributeKey)) {
        ui.notifications?.error('Choose an Attribute for the Ritual.');
        return;
    }
    const specRank = Math.max(0, Math.floor(Number(opts.specialization?.rank) || 0));
    const plan = planRitualRaises({
        taskLevel: opts.taskLevel,
        namedTier: opts.namedTier,
        genericRaises: opts.genericRaises,
        specializationRank: specRank,
    });
    if (!plan.ok) {
        ui.notifications?.warn(plan.error ?? 'Invalid Ritual Raises.');
        return;
    }
    const gmMod = Math.floor(Number(opts.gmMod) || 0);
    const baseTn = plan.baseTn + gmMod;
    const finalTn = plan.finalTn + gmMod;
    const cost = plan.sealedStones;
    const placed = Array.isArray(opts.placedAttrs) ? opts.placedAttrs.filter(Boolean) : [];
    if (placed.length && placed.length !== cost) {
        ui.notifications?.warn(`Place exactly ${cost} stone(s) for ${ritual.name} before rolling.`);
        return;
    }
    if (!placed.length) {
        const { available } = availableStones(system);
        if (available < cost) {
            ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name} (have ${available}).`);
            return;
        }
    }
    const sealed = await sealRitualStones(actor, cost, placed.length ? placed : undefined);
    if (!sealed) {
        ui.notifications?.warn(`Need ${cost} available stone(s) for ${ritual.name}.`);
        return;
    }
    let numDice = Number(system.attributes?.[opts.attributeKey]?.value) || 0;
    const specField = String(opts.specialization?.field ?? '');
    if (specField === 'physical' || specField === 'finesse') {
        const pen = getEquippedPhysicalSkillPenaltyDice(actor);
        if (pen > 0)
            numDice = Math.max(1, numDice - pen);
    }
    const approach = String(opts.approach ?? '').trim();
    const specLabel = opts.specialization?.name
        ? ` Specialization: ${opts.specialization.name} (Rank ${specRank}, ${plan.freeRaises} Free).`
        : '';
    const result = await masteryRoll({
        numDice,
        keepDice: masteryRank,
        skill: 0,
        tn: finalTn,
        normalTn: baseTn,
        declaredRaiseSlots: plan.paidRaises,
        label: `Ritual: ${ritual.name}`,
        flavor: `Base TN ${baseTn}, ${plan.totalRaises} Raise(s) (${plan.paidRaises} Paid, ${plan.freeRaises} Free) → Final TN ${finalTn}` +
            `${gmMod ? ` · situational ${gmMod >= 0 ? '+' : ''}${gmMod}` : ''}.${specLabel}` +
            `${approach ? ` Approach: ${approach}.` : ''}`,
        actorId: actor.id,
        isSkillRoll: true,
        rollKind: 'skill',
        raiseModel: 'power',
        autoFailIntent: 'skill',
        poolAttribute: opts.attributeKey,
    });
    const success = Math.floor(Number(result.total) || 0) >= finalTn;
    const sealOpenMode = isSealPassage(ritual) && plan.namedTier >= 4;
    const effects = success
        ? sealOpenMode
            ? [coreRitualTierText(ritual, 4)]
            : Array.from({ length: plan.namedTier + 1 }, (_, i) => coreRitualTierText(ritual, i))
        : [];
    const heading = success
        ? `${ritual.name} — Success (Tier ${plan.namedTier}${sealOpenMode ? ', opening mode' : ''})`
        : `${ritual.name} — Failure`;
    const effectHtml = effects.length
        ? `<ol class="ritual-raise-effects" start="${sealOpenMode ? 4 : 0}">${effects
            .map((t, i) => `<li><strong>Tier ${sealOpenMode ? 4 : i}:</strong> ${escapeHtml(t)}</li>`)
            .join('')}</ol>`
        : '';
    // PG "Word of Recall" Special Cost Rule: while the mark exists the Stones
    // stay Sealed even across Safe Haven Rests. Track the mark on the actor.
    let wordOfRecallHtml = '';
    if (ritual.id === 'word-of-recall' && success) {
        try {
            const { setWordOfRecallMark } = await import('../stones/word-of-recall-mark.js');
            const attrCounts = {};
            for (const attr of placed)
                attrCounts[attr] = (attrCounts[attr] || 0) + 1;
            await setWordOfRecallMark(actor, {
                attrCounts,
                generic: placed.length ? 0 : cost,
                raise: plan.namedTier,
            });
            wordOfRecallHtml =
                `<p><em>The mark is bound — these Stones stay Sealed while it exists.</em></p>` +
                    `<button type="button" data-action="word-of-recall-release" data-actor-id="${actor.id}">` +
                    `Use / Dismiss Mark</button>`;
        }
        catch (err) {
            console.warn('Mastery System | Word of Recall mark tracking failed', err);
        }
    }
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="ritual-roll-outcome">
        <h4>${escapeHtml(heading)}</h4>
        ${approach ? `<p><em>Approach: ${escapeHtml(approach)}</em></p>` : ''}
        <p>Base TN ${baseTn} · Named Tier ${plan.namedTier} + ${plan.genericRaises} generic = ${plan.totalRaises} Raise(s) (${plan.paidRaises} Paid, ${plan.freeRaises} Free) · Final TN ${finalTn} · roll ${result.total}</p>
        ${effectHtml}
        <p><em>${cost} stone(s) Sealed until Safe Haven Rest${ritual.id === 'word-of-recall' ? ' (or until the mark is used or dismissed, then a Safe Haven Rest)' : ''}.</em></p>
        ${wordOfRecallHtml}
        ${!success ? '<p><em>The Ritual does not produce its intended effect. The GM may apply a fitting consequence.</em></p>' : ''}
      </div>
    `,
    });
}
//# sourceMappingURL=ritual-roll-handler.js.map