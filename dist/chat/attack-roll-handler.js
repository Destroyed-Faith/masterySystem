/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */
import { countRaiseSlots, parseDeclaredRaises, resolvePowerSnapshot, resolveRaiseOutcome, } from '../combat/raise-resolution.js';
import { RAISE_INCREMENT } from '../utils/constants.js';
/** jQuery `.data()` caches parsed `data-*` on first read; dynamic `.attr()` updates won't match. */
function readAttackButtonDataInt(button, kebab, fallback) {
    const raw = button.attr(`data-${kebab}`);
    if (raw === undefined || raw === '')
        return fallback;
    const n = parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
}
/** Threatened Ranged OA token ids from attack-card flags. */
function readOpportunityEnemyTokenIds(flags) {
    const raw = flags?.opportunityEnemyTokenIds;
    if (Array.isArray(raw))
        return raw.map((id) => String(id || '').trim()).filter(Boolean);
    if (typeof raw === 'string' && raw.trim()) {
        return raw.split(/[,|]/).map((s) => s.trim()).filter(Boolean);
    }
    return [];
}
/**
 * Flags ∪ live re-scan around the shooter. Catches cases where card creation
 * missed melee enemies (distance/disposition) but they are engaged at resolve time.
 */
async function resolveOpportunityEnemyTokenIds(flags, attackerActor) {
    const fromFlags = readOpportunityEnemyTokenIds(flags);
    const attackType = String(flags?.attackType || '');
    const applies = flags?.threatenedRangedAppliesRule === true ||
        flags?.threatenedRanged === true ||
        flags?.rollDisadvantage === true ||
        fromFlags.length > 0 ||
        (attackType === 'ranged' &&
            flags?.npcAttackSource === true &&
            flags?.npcIsSpell !== true);
    if (!applies || attackType === 'melee') {
        console.log(`[MS Threatened Ranged] resolveOpportunity — skip live rescan attackType=${attackType} ` +
            `applies=${applies} fromFlags=[${fromFlags.join(', ') || 'none'}] ` +
            `cardReason=${flags?.threatenedRangedDebugReason ?? '∅'}`);
        return fromFlags;
    }
    try {
        const { findOpportunityEnemyTokenIds } = await import('../combat/threatened-ranged.js');
        const { getPrimaryTokenForActor } = await import('../utils/mechanics-adjacency.js');
        let shooterTok = (typeof canvas !== 'undefined'
            ? canvas.tokens?.placeables?.find((t) => t?.actor?.id === attackerActor?.id || t?.document?.actorId === attackerActor?.id)
            : null) ?? null;
        if (!shooterTok && attackerActor) {
            shooterTok = getPrimaryTokenForActor(attackerActor);
        }
        const live = shooterTok ? findOpportunityEnemyTokenIds(shooterTok) : [];
        const merged = [...new Set([...fromFlags, ...live.map(String)])];
        console.log(`[MS Threatened Ranged] resolveOpportunity — shooter="${shooterTok?.name || '?'}" ` +
            `fromFlags=[${fromFlags.join(', ') || 'none'}] live=[${live.join(', ') || 'none'}] ` +
            `merged=[${merged.join(', ') || 'none'}] cardReason=${flags?.threatenedRangedDebugReason ?? '∅'}`);
        return merged;
    }
    catch (err) {
        console.warn('[MS Threatened Ranged] resolveOpportunity rescan failed', err);
        return fromFlags;
    }
}
const rollAttackMessageLocks = new Set();
export function registerAttackRollClickHandler() {
    // Register handler on the chat log container using event delegation
    // This ensures it works for all messages, including dynamically added ones
    $(document).off('click', '.roll-attack-btn').on('click', '.roll-attack-btn', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const button = $(ev.currentTarget);
        const messageElement = button.closest('.message');
        // Try multiple methods to get message ID (Foundry VTT uses data-message-id attribute)
        const messageId = messageElement.attr('data-message-id') ||
            messageElement.data('message-id') ||
            messageElement.data('messageId');
        if (!messageId) {
            console.warn('Mastery System | Could not find message ID for attack roll', {
                messageElementHtml: messageElement[0]?.outerHTML?.substring(0, 200),
                allDataAttrs: Array.from(messageElement[0]?.attributes || []).map((attr) => `${attr.name}="${attr.value}"`)
            });
            return;
        }
        await executeAttackRollFromCard(button, String(messageId));
    });
}
/**
 * Run the attack roll pipeline for an attack card (fresh roll → on success the
 * damage dialog and follow-ups). Invoked by the Roll button click, and by the
 * Faith Fracture reroll flow (`faithReroll` set): the reroll re-runs the whole
 * pipeline so a rerolled hit can proceed to damage — but must NOT re-spend the
 * attack action or re-trigger one-time side effects (Dread gate, Disrupt
 * consumption, Blood Raise HP loss) that the original roll already paid.
 */
export async function executeAttackRollFromCard(button, messageId, opts = {}) {
    {
        const isFaithReroll = !!opts.faithReroll;
        const message = game.messages?.get(messageId);
        if (!message) {
            const allMessageIds = game.messages ? Array.from(game.messages.keys()) : [];
            console.warn('Mastery System | Could not find message for attack roll', {
                messageId,
                allMessageIds: allMessageIds.slice(0, 10) // Only show first 10 for debugging
            });
            return;
        }
        // Debug: Check all flags on the message
        const allFlags = message.flags;
        // Try both methods to get flags (getFlag might not work in some Foundry versions)
        const flags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'];
        // Debug log after flags read
        if (!flags || (flags.attackType !== 'melee' && flags.attackType !== 'ranged')) {
            console.warn('Mastery System | DEBUG: Invalid flags or unknown attack type', {
                flags,
                attackType: flags?.attackType,
                allFlagsKeys: Object.keys(allFlags || {}),
                masterySystemFlags: allFlags?.['mastery-system']
            });
            return;
        }
        const lockId = String(messageId);
        // The lock stays set after a successful roll (re-click guard). A faith
        // reroll legitimately re-runs the card, so it may pass; concurrent reroll
        // requests are already serialized per roll message in faith-fracture-reroll.
        if (rollAttackMessageLocks.has(lockId) && !isFaithReroll) {
            return;
        }
        rollAttackMessageLocks.add(lockId);
        const awaitsResolution = !!flags.awaitAttackResolution;
        const suppressNestedCounterattack = !!flags.fromReactionCounterattack;
        // Entitlement: pressing Roll opens a reaction opportunity for this attack
        // even if the attack later misses (window posts after the roll / damage).
        try {
            await message.setFlag?.('mastery-system', 'reactionEntitled', {
                attackerId: flags.attackerId || button.attr('data-attacker-id') || null,
                targetId: flags.targetId || button.attr('data-target-id') || null,
                targetTokenId: flags.targetTokenId || button.attr('data-target-token-id') || null,
                at: Date.now(),
            });
        }
        catch (entitleErr) {
            console.warn('Mastery System | reaction entitlement flag failed', entitleErr);
        }
        const resetRollButton = () => {
            button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll');
            rollAttackMessageLocks.delete(lockId);
        };
        // Disable button during roll
        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
        let spentActionOnRoll = false;
        let spentAmmoOnRoll = false;
        let actorToRefund = null;
        let actorForAmmo = null;
        let markedPowerIdForRoll = null;
        let markedNpcAttackIdForRoll = null;
        try {
            // Import the roll handler (must use .js extension for ES modules in Foundry VTT)
            const { masteryRoll } = await import('../dice/roll-handler.js');
            // Get actor data - always get fresh from game.actors
            const attacker = game.actors?.get(flags.attackerId);
            if (!attacker) {
                throw new Error('Attacker not found');
            }
            // Ensure we have fresh actor reference (not stale).
            // Prefer the SPEAKER's actor so UNLINKED tokens resolve to their own
            // (synthetic) actor — its delta carries the real attribute build and the
            // equipped items. `game.actors.get(id)` would return the world/prototype
            // actor (default attributes, possibly missing the equipped weapon).
            const freshAttacker = ChatMessage.getSpeakerActor?.(message.speaker) ??
                game.actors?.get(attacker.id) ??
                attacker;
            // Faith reroll: the original roll already spent the action.
            const costsAction = !isFaithReroll && flags.costsAction !== false;
            if (costsAction) {
                const combat = game.combat;
                if (!combat) {
                    ui.notifications?.warn('Not in combat.');
                    resetRollButton();
                    return;
                }
                const { getAvailableAttackActions, consumeAttackAction, getActionEconomyActor } = await import('../combat/action-economy.js');
                const economyAttacker = getActionEconomyActor(freshAttacker) ?? freshAttacker;
                if (getAvailableAttackActions(economyAttacker, combat) <= 0) {
                    ui.notifications?.warn('No Actions left this round.');
                    resetRollButton();
                    return;
                }
                const consumed = await consumeAttackAction(economyAttacker, combat);
                if (!consumed) {
                    ui.notifications?.warn('Failed to consume attack action.');
                    resetRollButton();
                    return;
                }
                spentActionOnRoll = true;
                actorToRefund = economyAttacker;
                if (flags.selectedPowerId) {
                    const { markPowerUsedThisRound } = await import('../combat/action-economy.js');
                    await markPowerUsedThisRound(economyAttacker, combat, flags.selectedPowerId);
                    markedPowerIdForRoll = flags.selectedPowerId;
                }
                if (flags.npcAttackSource && flags.npcAttackOptionId) {
                    const { markNpcAttackUsedThisRound } = await import('../combat/action-economy.js');
                    await markNpcAttackUsedThisRound(economyAttacker, combat, String(flags.npcAttackOptionId));
                    markedNpcAttackIdForRoll = String(flags.npcAttackOptionId);
                }
            }
            if (!isFaithReroll && flags.attackType === 'ranged' && flags.isSpell !== true) {
                const ammo = await import('../utils/ammunition.js');
                if (ammo.findEquippedAmmunitionWeapon(freshAttacker)) {
                    const check = ammo.evaluateAmmunitionAttack(freshAttacker, 1);
                    if (!check.ok) {
                        ammo.warnAmmunitionAttack(check.reason);
                        resetRollButton();
                        if (spentActionOnRoll && actorToRefund) {
                            const { refundAttackAction } = await import('../combat/action-economy.js');
                            await refundAttackAction(actorToRefund, game.combat);
                        }
                        return;
                    }
                    const consumedAmmo = await ammo.consumeAmmunitionForAttack(freshAttacker, 1);
                    if (!consumedAmmo.ok) {
                        resetRollButton();
                        if (spentActionOnRoll && actorToRefund) {
                            const { refundAttackAction } = await import('../combat/action-economy.js');
                            await refundAttackAction(actorToRefund, game.combat);
                        }
                        return;
                    }
                    spentAmmoOnRoll = true;
                    actorForAmmo = freshAttacker;
                }
            }
            // Debug: Log actor items to verify we have latest data
            let attackerItems = [];
            if (freshAttacker.items) {
                if (Array.isArray(freshAttacker.items)) {
                    attackerItems = freshAttacker.items;
                }
                else if (freshAttacker.items instanceof Map) {
                    attackerItems = Array.from(freshAttacker.items.values());
                }
                else if (freshAttacker.items.size !== undefined && freshAttacker.items.values) {
                    attackerItems = Array.from(freshAttacker.items.values());
                }
            }
            // Normal TN vs Raise TN (new Raise rules)
            const normalTn = readAttackButtonDataInt(button, 'normal-tn', readAttackButtonDataInt(button, 'target-evade', flags.normalTn ?? flags.baseEvade ?? 0));
            const raiseTn = readAttackButtonDataInt(button, 'raise-tn', normalTn);
            const raisePlanRaw = button.attr('data-raise-plan') || '[]';
            const declaredRaises = parseDeclaredRaises(raisePlanRaw);
            let declaredRaiseSlots = countRaiseSlots(declaredRaises);
            // The Raise TN we actually roll against is the ground truth for how many
            // Raise slots were declared (Normal TN + 4 per slot). The JSON plan attr
            // is more fragile — a chat re-render resets the button to its static
            // `data-raise-plan="[]"`. If the plan carries fewer slots than the TN
            // implies, rebuild the missing ones as default damage Raises so the
            // Raise Cost is still paid on a partial and the effects land on a full.
            const tnImpliedSlots = Math.max(0, Math.round((raiseTn - normalTn) / RAISE_INCREMENT));
            if (tnImpliedSlots > declaredRaiseSlots) {
                console.warn('Mastery System | [ROLL ATTACK] Raise plan lost — rebuilding from Raise TN', {
                    messageId,
                    raiseTn,
                    normalTn,
                    tnImpliedSlots,
                    parsedPlanSlots: declaredRaiseSlots,
                });
                for (let i = declaredRaiseSlots; i < tnImpliedSlots; i++) {
                    declaredRaises.push({ effect: 'damage', slots: 1 });
                }
                declaredRaiseSlots = tnImpliedSlots;
            }
            // Compute numDice from ACTOR at click time (not from stale flags)
            // This ensures we always use the current attribute value.
            //
            // Resolve via ChatMessage.getSpeakerActor so UNLINKED tokens use their
            // own (synthetic) actor — its delta carries the real attribute build.
            // `game.actors.get(speaker.actor)` would return the world/prototype actor
            // (often default attributes), making e.g. Might 8 roll as the 2d8 default.
            const attackerForRoll = ChatMessage.getSpeakerActor?.(message.speaker) ??
                (message.speaker?.actor
                    ? game.actors.get(message.speaker.actor)
                    : game.actors?.get(flags.attackerId));
            const attributeKey = flags.attribute?.toLowerCase();
            const liveAttr = attackerForRoll?.system?.attributes?.[attributeKey]?.value;
            const npcPool = flags.useNpcAttackDicePool &&
                Number.isFinite(Number(flags.npcAttackDicePool)) &&
                Number(flags.npcAttackDicePool) > 0
                ? Math.floor(Number(flags.npcAttackDicePool))
                : 0;
            // Split-Attack: the executor pre-halved the pool and stored it in
            // flags.attributeValue. Do NOT fall back to the live attribute value for
            // split-attack strikes, because that would bypass the pool halving.
            let numDice;
            if (npcPool > 0) {
                numDice = npcPool;
            }
            else if (flags.splitAttack === true && Number.isFinite(Number(flags.attributeValue)) && Number(flags.attributeValue) > 0) {
                numDice = Number(flags.attributeValue);
            }
            else if (Number.isFinite(liveAttr) && liveAttr > 0) {
                numDice = liveAttr;
            }
            else {
                numDice = flags.attributeValue ?? 2;
            }
            // Note: Minimum Pool (= Mastery Rank), Specials (Weaken / Soulburn /
            // Challenge / Disoriented) and the Health / Encumbrance percentage
            // penalty are applied centrally inside `masteryRoll` in canonical
            // order (`applyPoolPenalties: true`).
            // Players Guide 7497–7521: Range Bands.
            // For ranged attacks the dice pool is multiplied by the band:
            //   Short = 100% / Medium = 75% / Long = 50%, min 1 die.
            // Agility scales the bands by +1 / +2 / +4 m per full 8 Agility.
            // The pre-band pool is used as the basis; the health penalty applies
            // after, so the two reductions stay independent (just like in the
            // Players Guide examples).
            let rangeBandNote = '';
            if (flags.attackType === 'ranged' && flags.targetTokenId) {
                try {
                    const { dicePoolAtDistance } = await import('../utils/range-bands.js');
                    const { measureSceneDistanceBetweenPoints } = await import('../utils/grid-range.js');
                    const attackerToken = attackerForRoll?.getActiveTokens?.()?.[0];
                    const targetTokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
                    const targetToken = targetTokenDoc?.object;
                    const attackerCenter = attackerToken?.center;
                    const targetCenter = targetToken?.center;
                    if (attackerCenter && targetCenter) {
                        const distanceM = measureSceneDistanceBetweenPoints(attackerCenter, targetCenter);
                        // Resolve the weapon's printed range string. Falls back to the
                        // canonical 8/16/32m bands when nothing is on the weapon.
                        const weaponRange = flags.weaponRange ||
                            (() => {
                                const w = (attackerForRoll?.items?.get?.(flags.weaponId)) || null;
                                return w?.system?.range || '8/16/32m';
                            })();
                        const agility = Number(attackerForRoll?.system?.attributes?.agility?.value ?? 0) || 0;
                        const result = dicePoolAtDistance({
                            rangeText: weaponRange,
                            agility,
                            distanceM,
                            pool: numDice,
                        });
                        if (result.band === 'out-of-range') {
                            ui.notifications?.warn(`Target is out of range (${distanceM.toFixed(1)} m vs Long ${result.bands.long} m).`);
                            resetRollButton();
                            if (spentActionOnRoll && actorToRefund) {
                                const { refundAttackAction } = await import('../combat/action-economy.js');
                                await refundAttackAction(actorToRefund, game.combat);
                            }
                            if (spentAmmoOnRoll && actorForAmmo) {
                                const { refundAmmunitionForAttack } = await import('../utils/ammunition.js');
                                await refundAmmunitionForAttack(actorForAmmo, 1);
                            }
                            return;
                        }
                        const adjusted = result.pool;
                        if (adjusted !== numDice) {
                            const bandLabel = result.band === 'short' ? 'Short' : result.band === 'medium' ? 'Medium' : 'Long';
                            const bandPctLabel = result.band === 'short' ? '100%' : result.band === 'medium' ? '75%' : '50%';
                            rangeBandNote = ` (Range Band: ${bandLabel} ${bandPctLabel} → ${numDice} → ${adjusted})`;
                            numDice = adjusted;
                        }
                        else {
                            rangeBandNote = ' (Range Band: Short)';
                        }
                    }
                }
                catch (err) {
                    console.warn('Mastery System | Range Band evaluation failed:', err);
                }
            }
            // Passive Parry: strip Attack Dice 1:1 before the roll. 0 dice = Fully Parried.
            let hasParryThisHit = false;
            let defenderForParry = null;
            let parryFlavorNote = '';
            try {
                const combatForParry = game.combat ?? null;
                if (flags.targetTokenId) {
                    const tokDoc = canvas?.scene?.tokens?.get?.(flags.targetTokenId) ??
                        canvas?.tokens?.placeables?.find?.((t) => t?.id === flags.targetTokenId);
                    defenderForParry =
                        tokDoc?.actor ?? tokDoc?.document?.actor ?? tokDoc?.object?.actor ?? null;
                }
                if (!defenderForParry && flags.targetId) {
                    defenderForParry = game.actors?.get(flags.targetId) ?? null;
                }
                if (defenderForParry && combatForParry && numDice > 0) {
                    const { applyParryDiceStrip } = await import('../combat/parry.js');
                    const strip = await applyParryDiceStrip(defenderForParry, combatForParry, numDice);
                    if (strip.spent > 0) {
                        numDice = strip.remainingDice;
                        hasParryThisHit = strip.fullyParried;
                        if (strip.note)
                            parryFlavorNote = ` (${strip.note})`;
                    }
                }
            }
            catch (parryErr) {
                console.warn('Mastery System | Parry strip failed', parryErr);
            }
            // Fully Parried: no attack roll, no hit effects, no damage — open Riposte/Reflection window.
            if (hasParryThisHit) {
                button.html('<i class="fas fa-check"></i> Fully Parried').addClass('rolled');
                const atkName = String(freshAttacker?.name ?? 'Attacker');
                const defName = String(defenderForParry?.name ?? 'Defender');
                try {
                    await globalThis.ChatMessage?.create?.({
                        user: game.user?.id,
                        speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: defenderForParry }),
                        content: `<p class="mastery-reaction-msg"><strong>${defName}</strong> Fully Parried <strong>${atkName}</strong>'s attack (0 Attack Dice). No damage.</p>`,
                    });
                }
                catch {
                    /* ignore */
                }
                try {
                    const combatForReactions = game.combat ?? null;
                    const { runInteractiveReactionWindow } = await import('../combat/reaction-window-chat.js');
                    const aoeFromBtn = !!button.attr('data-aoe-melee-weapon');
                    const isAoE = aoeFromBtn ||
                        flags.aoeMeleeWeapon === true ||
                        String(flags.aoeMeleeWeapon) === 'true';
                    await runInteractiveReactionWindow({
                        defender: defenderForParry,
                        attacker: freshAttacker,
                        combat: combatForReactions,
                        rawDamage: 0,
                        attackTotal: null,
                        evadeTn: normalTn,
                        hit: false,
                        phase: 'defender',
                        hasParryThisHit: true,
                        attackType: flags.attackType === 'ranged' ? 'ranged' : 'melee',
                        isAoE,
                        suppressCounterattack: suppressNestedCounterattack,
                    });
                }
                catch (fpErr) {
                    console.warn('Mastery System | Fully Parried reaction window failed', fpErr);
                }
                return;
            }
            // Split-Attack: hard-cap the final pool inside `masteryRoll` so attack-rider
            // / manual bonus dice cannot inflate the strike back to the full attribute pool.
            const splitAttackDiceCap = flags.splitAttack === true ? numDice : undefined;
            let keepDice = flags.masteryRank ?? (attackerForRoll?.system?.mastery?.rank ?? 2);
            const baseKeepDice = keepDice;
            // Disadvantage is no longer modeled as a Keep reduction (Players Guide
            // ~6471–6477 says only one chosen 8 may explode; pool & keep are
            // unchanged). The flag is forwarded to `masteryRoll` below so the
            // dice engine can apply the correct rule.
            const tnKind = flags.tnKind === 'casting' ? 'casting' : 'evade';
            // Spell attacks (including Spell AoEs) keep Blood Raises / spell raise bonuses.
            const isSpellcasting = tnKind === 'casting';
            // Warn if values don't match (for debugging) — but split-attack is
            // expected to differ (flags holds half of live attribute), so skip then.
            if (flags.attributeValue !== numDice && flags.attributeValue > 0 && flags.splitAttack !== true) {
                console.warn('Mastery System | [ATTACK ROLL] Using live attribute value instead of flags', {
                    flagsValue: flags.attributeValue,
                    liveValue: numDice,
                    attribute: flags.attribute,
                    attackerId: flags.attackerId
                });
            }
            // Perform the attack roll with d8 dice (exploding 8s handled in roll-handler)
            // Label should reflect "Roll N d8 keep K"
            const advantageNote = flags.rollAdvantage
                ? ' (Advantage: reroll any 1 once)'
                : '';
            const disadvantageNote = flags.rollDisadvantage
                ? ' (Disadvantage: only one 8 explodes)'
                : '';
            void baseKeepDice;
            const attackKind = flags.attackType === 'ranged' ? 'Ranged' : 'Melee';
            const targetActorForFlavor = game.actors?.get(flags.targetId);
            const aoeFlavorHint = flags.aoeMeleeWeapon === true || String(flags.aoeMeleeWeapon) === 'true'
                ? ' — AoE: same roll compared separately against each creature'
                : '';
            const rollFlavorBase = tnKind === 'casting'
                ? `Roll ${numDice}d8 keep ${keepDice} vs Casting TN ${normalTn}${declaredRaiseSlots > 0 ? ` (Raise TN ${raiseTn})` : ''}${aoeFlavorHint}${advantageNote}${disadvantageNote}${rangeBandNote}${parryFlavorNote}`
                : `Roll ${numDice}d8 keep ${keepDice} vs ${targetActorForFlavor?.name || 'Target'}'s Evade (${normalTn}${declaredRaiseSlots > 0 ? `, Raise TN ${raiseTn}` : ''})${aoeFlavorHint}${advantageNote}${disadvantageNote}${rangeBandNote}${parryFlavorNote}`;
            const rollFlavor = opts.faithReroll
                ? `${rollFlavorBase}\n\n<i class="fas fa-sync-alt"></i> Reroll — ${opts.faithReroll.spenderName} spent 1 Faith Fracture.`
                : rollFlavorBase;
            const rollLabel = tnKind === 'casting'
                ? `Spell Attack (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`
                : `${attackKind} Attack (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`;
            const actionEco = await import('../combat/action-economy.js');
            const economyForStones = actionEco.getActionEconomyActor(freshAttacker) ?? freshAttacker;
            const combatRef = game.combat;
            const rsCrit = actionEco.getRoundState(economyForStones, combatRef);
            const critBank = Math.max(0, Math.floor(Number(rsCrit?.stoneBonuses?.critRaises ?? 0) || 0));
            let buffCriticalX = 0;
            try {
                const { getActiveBuffCriticalTier } = await import('../utils/active-buffs.js');
                buffCriticalX = getActiveBuffCriticalTier(freshAttacker);
            }
            catch {
                buffCriticalX = 0;
            }
            // Critical(X) = X Critical attacks per Round; explode threshold always 7–8 on Attack Dice.
            const { resolveCriticalAttackModifier, syncCriticalRoundQuota, consumeCriticalQuota, combatRoundKey, } = await import('../combat/critical-resolution.js');
            const roundKey = combatRoundKey(combatRef);
            const syncedQuota = syncCriticalRoundQuota(rsCrit.criticalQuota, roundKey, buffCriticalX);
            if (!rsCrit.criticalQuota ||
                rsCrit.criticalQuota.roundKey !== syncedQuota.roundKey ||
                rsCrit.criticalQuota.granted !== syncedQuota.granted ||
                rsCrit.criticalQuota.remaining !== syncedQuota.remaining) {
                rsCrit.criticalQuota = syncedQuota;
                await actionEco.setRoundState(economyForStones, rsCrit);
            }
            const critMod = resolveCriticalAttackModifier({
                activeBuffCriticalX: buffCriticalX,
                buffQuotaRemaining: syncedQuota.remaining,
                stoneCritCharges: critBank,
            });
            const attackExplodeDiceOn78 = critMod.explodeOn78;
            const bloodRaises = Math.max(0, parseInt(button.attr('data-blood-raises') || '0', 10) || 0);
            let raiseTnRollBonus = 0;
            if (isSpellcasting && freshAttacker && combatRef) {
                raiseTnRollBonus = Math.max(0, Number(rsCrit?.stoneBonuses?.spellRaiseTnBonus ?? 0) || 0);
            }
            // Faith reroll: Blood Raise HP was already paid on the original roll.
            if (bloodRaises > 0 && isSpellcasting && freshAttacker && !isFaithReroll) {
                const { applyBloodRaiseHpLoss } = await import('../combat/spell-roll-handler.js');
                await applyBloodRaiseHpLoss(freshAttacker, bloodRaises * 4);
            }
            // All targets of this attack (primary + AoE secondaries) — used by the
            // Challenge(X) pool reduction (no reduction when the challenger is hit).
            const challengeTargetRefs = [
                ...(flags.targetId ? [String(flags.targetId)] : []),
                ...(flags.targetTokenId ? [String(flags.targetTokenId)] : []),
                ...String(button.attr('data-aoe-secondary-ids') || '')
                    .split('|')
                    .map((s) => s.trim())
                    .filter(Boolean),
            ];
            const result = await masteryRoll({
                numDice: numDice,
                keepDice: keepDice,
                skill: 0,
                tn: normalTn,
                label: rollLabel,
                flavor: rollFlavor,
                actorId: flags.attackerId,
                rollKind: 'attack',
                targetActorId: flags.targetId,
                autoFailIntent: 'attack',
                checkContext: { tags: ['sight'] },
                poolAttribute: attributeKey,
                targetRefs: challengeTargetRefs,
                applyPoolPenalties: true,
                actorRef: attackerForRoll,
                normalTn,
                raiseTn,
                declaredRaiseSlots,
                raiseModel: 'power',
                ...(bloodRaises > 0 && isSpellcasting ? { bloodRaises } : {}),
                ...(raiseTnRollBonus > 0 && isSpellcasting ? { raiseTnRollBonus } : {}),
                ...(typeof splitAttackDiceCap === 'number' && splitAttackDiceCap > 0
                    ? { attackDiceCap: splitAttackDiceCap }
                    : {}),
                ...(attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
                ...(flags.rollAdvantage ? { rollAdvantage: true } : {}),
                ...(flags.rollDisadvantage ? { rollDisadvantage: true } : {}),
                attackCardMessageId: messageId,
                // Max one reroll per roll: a faith-reroll result must not offer
                // another reroll button.
                ...(isFaithReroll ? { isRerollResult: true } : {}),
            });
            // Consume one Critical application (buff quota preferred, else stone Crit charge).
            if (critMod.applyCritical && critMod.consumeFrom && !isFaithReroll) {
                const rs2 = actionEco.getRoundState(economyForStones, combatRef);
                if (critMod.consumeFrom === 'active-buff') {
                    rs2.criticalQuota = consumeCriticalQuota(syncCriticalRoundQuota(rs2.criticalQuota, combatRoundKey(combatRef), buffCriticalX));
                }
                else if (critMod.consumeFrom === 'stone-crit') {
                    if (!rs2.stoneBonuses) {
                        rs2.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
                    }
                    const curCrit = Math.max(0, Math.floor(Number(rs2.stoneBonuses.critRaises ?? 0) || 0));
                    rs2.stoneBonuses.critRaises = Math.max(0, curCrit - 1);
                }
                await actionEco.setRoundState(economyForStones, rs2);
            }
            const raiseOutcome = result.raiseOutcome ??
                resolveRaiseOutcome(result.total, normalTn, declaredRaiseSlots);
            // Update button to show it was rolled
            button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');
            // Autofire: one shared roll walks an ordered chain; first miss ends it.
            // Full payload per hit; Dive for Cover is not offered.
            const autofireChain = String(flags.autofireChainTokenIds || '')
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (flags.autofire === true && autofireChain.length > 0) {
                const { resolveAutofireChain } = await import('../combat/autofire.js');
                const afAttacker = freshAttacker || game.actors?.get(flags.attackerId);
                if (afAttacker) {
                    await resolveAutofireChain({
                        attacker: afAttacker,
                        chainTokenIds: autofireChain,
                        attackTotal: Math.floor(Number(result?.total) || 0),
                        declaredRaiseSlots,
                        flags: {
                            ...flags,
                            raiseOutcome,
                            attackTotal: Math.floor(Number(result?.total) || 0),
                            declaredRaises,
                            declaredRaiseSlots,
                        },
                        weaponId: flags.weaponId || null,
                    });
                }
                return;
            }
            // Partial or full success → damage dialog; fail → stop.
            if (raiseOutcome !== 'fail') {
                // Always get fresh actors to ensure latest items. Reuse the
                // speaker-resolved `freshAttacker` (token actor for unlinked tokens) so
                // the damage dialog sees the right attributes AND equipped items; do
                // NOT re-fetch via game.actors.get() — that loses the token actor.
                const freshAttackerForDialog = freshAttacker;
                // Resolve target: prefer token actor if targetTokenId exists (for unlinked tokens)
                let target = null;
                if (flags.targetTokenId) {
                    // Try to get token document from current scene
                    const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
                    if (tokenDoc?.actor) {
                        target = tokenDoc.actor;
                    }
                }
                // Fallback to base actor if token not found
                if (!target) {
                    target = game.actors?.get(flags.targetId) || null;
                }
                if (target) {
                    // Re-read flags from message to get updated power selection
                    const currentMessage = game.messages?.get(messageId);
                    let updatedFlags = flags;
                    if (currentMessage) {
                        const messageFlags = currentMessage.getFlag('mastery-system') || currentMessage.flags?.['mastery-system'];
                        if (messageFlags) {
                            updatedFlags = { ...flags, ...messageFlags };
                        }
                        else {
                            console.warn('Mastery System | [BEFORE DAMAGE DIALOG] WARNING: No message flags found', {
                                messageId,
                                hasMessage: !!currentMessage,
                                messageFlags: currentMessage?.flags,
                                messageFlagsKeys: Object.keys(currentMessage?.flags || {}),
                                masterySystemFlags: currentMessage?.flags?.['mastery-system']
                            });
                        }
                    }
                    else {
                        console.error('Mastery System | [BEFORE DAMAGE DIALOG] ERROR: Could not find message to re-read flags', {
                            messageId,
                            allMessageIds: Array.from(game.messages?.keys() || []).slice(0, 10),
                            totalMessages: game.messages?.size || 0
                        });
                    }
                    // Get equipped weapon ID (just the ID, not the full object)
                    // IMPORTANT: Use freshAttackerForDialog that was already loaded above
                    let items = [];
                    if (freshAttackerForDialog.items) {
                        if (Array.isArray(freshAttackerForDialog.items)) {
                            items = freshAttackerForDialog.items;
                        }
                        else if (freshAttackerForDialog.items instanceof Map) {
                            items = Array.from(freshAttackerForDialog.items.values());
                        }
                        else if (freshAttackerForDialog.items.size !== undefined && freshAttackerForDialog.items.values) {
                            items = Array.from(freshAttackerForDialog.items.values());
                        }
                    }
                    // Debug: Log all items to see what we have
                    // PRIORITY: Use weaponId from flags if set (this is the weapon used when creating the attack card)
                    let weaponId = updatedFlags.weaponId || null;
                    if (updatedFlags.npcAttackSource) {
                        weaponId = null;
                    }
                    // Verify the weapon from flags exists and is valid
                    if (weaponId) {
                        let weaponFromFlags = items.find((item) => item.id === weaponId);
                        // If not found in items array, try direct lookup from actor
                        if (!weaponFromFlags && freshAttackerForDialog.items) {
                            if (freshAttackerForDialog.items.get) {
                                weaponFromFlags = freshAttackerForDialog.items.get(weaponId);
                            }
                            else if (Array.isArray(freshAttackerForDialog.items)) {
                                weaponFromFlags = freshAttackerForDialog.items.find((item) => item.id === weaponId);
                            }
                        }
                        // If still not found, try game.items
                        if (!weaponFromFlags) {
                            try {
                                const gameItem = game.items?.get(weaponId);
                                if (gameItem && gameItem.actor?.id === freshAttackerForDialog.id) {
                                    weaponFromFlags = gameItem;
                                }
                            }
                            catch (e) {
                                console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Error looking up weapon from game.items', e);
                            }
                        }
                        if (!weaponFromFlags) {
                            console.warn('Mastery System | [BEFORE DAMAGE DIALOG] weaponId from flags not found anywhere, falling back to equipped weapon', {
                                weaponIdFromFlags: weaponId,
                                allItemIds: items.map((i) => i.id),
                                itemsCount: items.length,
                                actorItemsType: typeof freshAttackerForDialog.items,
                                actorItemsSize: freshAttackerForDialog.items?.size,
                                actorItemsIsMap: freshAttackerForDialog.items instanceof Map
                            });
                            weaponId = null; // Will fall back to equipped weapon below
                        }
                        else {
                        }
                    }
                    // Fallback: If no weaponId in flags or weapon not found, use equipped weapon
                    if (!weaponId && !updatedFlags.npcAttackSource) {
                        const equippedWeapon = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
                        weaponId = equippedWeapon ? equippedWeapon.id : null;
                    }
                    // Verify weapon exists via direct lookup (if not already verified above)
                    if (weaponId) {
                        let weaponItem = null;
                        if (freshAttackerForDialog.items?.get) {
                            weaponItem = freshAttackerForDialog.items.get(weaponId);
                        }
                        else if (Array.isArray(freshAttackerForDialog.items)) {
                            weaponItem = freshAttackerForDialog.items.find((item) => item.id === weaponId);
                        }
                        // If not found in actor items, try game.items
                        if (!weaponItem && weaponId) {
                            try {
                                const gameItem = game.items?.get(weaponId);
                                if (gameItem && gameItem.actor?.id === freshAttackerForDialog.id) {
                                    weaponItem = gameItem;
                                }
                            }
                            catch (e) {
                                console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Error looking up weapon from game.items', e);
                            }
                        }
                        if (weaponItem) {
                        }
                        else {
                            console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Weapon ID in flags but not found in actor items', {
                                weaponId: weaponId,
                                itemsCount: items.length,
                                allItemIds: items.map((i) => i.id),
                                actorItemsType: typeof freshAttackerForDialog.items,
                                actorItemsIsMap: freshAttackerForDialog.items instanceof Map,
                                actorItemsSize: freshAttackerForDialog.items?.size
                            });
                        }
                    }
                    // Find equipped weapon for logging purposes
                    const equippedWeaponForLog = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
                    let stoneBonusRaises = 0;
                    const isSpellPower = !!updatedFlags.powerIsSpell;
                    if (raiseOutcome === 'full' && !isSpellPower) {
                        try {
                            const { getRoundState } = await import('../combat/action-economy.js');
                            const combatNow = game.combat;
                            if (freshAttackerForDialog && combatNow) {
                                const rs = getRoundState(freshAttackerForDialog, combatNow);
                                stoneBonusRaises = Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
                            }
                        }
                        catch (e) {
                            console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Could not read stone raise bonus', e);
                        }
                    }
                    let resolvedPowerSnapshot = null;
                    if (updatedFlags.basePowerSnapshot) {
                        const mr = Math.max(1, Math.floor(Number(freshAttackerForDialog?.system?.mastery?.rank) ||
                            updatedFlags.masteryRank ||
                            2));
                        let spellCostOverride;
                        const spellCostRaw = button.attr('data-spell-cost');
                        if (spellCostRaw) {
                            try {
                                spellCostOverride = JSON.parse(spellCostRaw);
                            }
                            catch {
                                /* ignore */
                            }
                        }
                        resolvedPowerSnapshot = resolvePowerSnapshot({
                            base: updatedFlags.basePowerSnapshot,
                            declaredRaises,
                            outcome: raiseOutcome,
                            masteryRank: mr,
                            isSpell: isSpellPower,
                            stoneBonusRaises,
                            spellCostOverride,
                        });
                    }
                    if (resolvedPowerSnapshot) {
                        updatedFlags.resolvedPowerSnapshot = resolvedPowerSnapshot;
                        if (resolvedPowerSnapshot.rangeM != null) {
                            updatedFlags.resolvedRangeM = resolvedPowerSnapshot.rangeM;
                        }
                        if (resolvedPowerSnapshot.aoeRadiusM != null) {
                            updatedFlags.resolvedAoeRadiusM = resolvedPowerSnapshot.aoeRadiusM;
                        }
                        if (resolvedPowerSnapshot.durationSteps > 0) {
                            updatedFlags.resolvedDurationSteps = resolvedPowerSnapshot.durationSteps;
                        }
                    }
                    const spellCostRaw2 = button.attr('data-spell-cost');
                    let spellCostOverride;
                    if (spellCostRaw2) {
                        try {
                            spellCostOverride = JSON.parse(spellCostRaw2);
                        }
                        catch {
                            /* ignore */
                        }
                    }
                    updatedFlags = {
                        ...updatedFlags,
                        raiseOutcome,
                        declaredRaises,
                        declaredRaiseSlots,
                        stoneBonusRaises,
                        normalTn,
                        raiseTn,
                        // Needed so Reaction: Evade can compare Evade+bonus vs this total.
                        attackTotal: Math.floor(Number(result?.total) || 0),
                        ...(spellCostOverride ? { spellCostOverride } : {}),
                    };
                    // Import and show damage dialog - pass only IDs, not full objects
                    // Debug log before calling showDamageDialog
                    // Prefer AoE metadata from the roll button — chat-message flags can be
                    // pruned or merged inconsistently across Foundry versions.
                    const aoeIdsFromBtn = String(button.attr('data-aoe-secondary-ids') || '')
                        .split('|')
                        .map((s) => s.trim())
                        .filter(Boolean);
                    const aoeDiceFromBtn = Math.max(0, Math.floor(Number(button.attr('data-aoe-power-dice')) || 0));
                    const aoeFromBtn = button.attr('data-aoe-melee') === '1';
                    const aoeSecondaries = aoeIdsFromBtn.length > 0
                        ? aoeIdsFromBtn
                        : String(updatedFlags.aoeMeleeSecondaryTokenIds || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                    const aoeDice = aoeDiceFromBtn > 0
                        ? aoeDiceFromBtn
                        : Math.max(0, Math.floor(Number(updatedFlags.aoeMeleePowerBonusDice) || 0));
                    const aoeWeapon = aoeFromBtn ||
                        updatedFlags.aoeMeleeWeapon === true ||
                        String(updatedFlags.aoeMeleeWeapon) === 'true';
                    const isAreaAttack = aoeWeapon;
                    // Phase 1 — direct target reacts immediately after the attack Roll,
                    // before the damage dialog / damage roll.
                    const combatForReactions = game.combat ?? null;
                    const opportunityEnemyTokenIds = await resolveOpportunityEnemyTokenIds(updatedFlags, freshAttackerForDialog);
                    const { runInteractiveReactionWindow } = await import('../combat/reaction-window-chat.js');
                    // Target reactions first (before damage). Threatened Ranged OA waits
                    // until this attack fully resolves — see Phase 2 below.
                    const phase1 = await runInteractiveReactionWindow({
                        defender: target,
                        attacker: freshAttackerForDialog,
                        combat: combatForReactions,
                        rawDamage: 0,
                        attackTotal: updatedFlags.attackTotal ?? null,
                        evadeTn: normalTn,
                        hit: true,
                        phase: 'defender',
                        suppressCounterattack: suppressNestedCounterattack,
                        attackType: updatedFlags.attackType === 'ranged' ? 'ranged' : 'melee',
                        isAoE: isAreaAttack,
                    });
                    // Allies protect before damage (Armor / Evade / Temp HP / Interpose).
                    let preDamage = phase1;
                    if (!phase1.mitigation?.negatedByEvade && !phase1.mitigation?.phasedByReaction) {
                        try {
                            preDamage = await runInteractiveReactionWindow({
                                defender: target,
                                attacker: freshAttackerForDialog,
                                combat: combatForReactions,
                                rawDamage: 0,
                                attackTotal: updatedFlags.attackTotal ?? null,
                                evadeTn: normalTn,
                                hit: true,
                                phase: 'allies',
                                eventId: phase1.eventId,
                                spentActorIds: phase1.spentActorIds,
                                used: phase1.used,
                                priorMitigation: phase1.mitigation,
                                silentIfEmpty: true,
                                suppressCounterattack: suppressNestedCounterattack,
                                attackType: updatedFlags.attackType === 'ranged' ? 'ranged' : 'melee',
                                isAoE: isAreaAttack,
                            });
                        }
                        catch (allyPreErr) {
                            console.warn('Mastery System | pre-damage ally reaction window failed', allyPreErr);
                        }
                    }
                    const primaryNegated = !!preDamage.mitigation?.negatedByEvade || !!preDamage.mitigation?.phasedByReaction;
                    let primaryEscaped = false;
                    let damageResult = null;
                    if (primaryNegated) {
                        try {
                            const defName = String(target.name ?? 'Defender');
                            const atkName = String(freshAttackerForDialog.name ?? 'Attacker');
                            const mit = preDamage.mitigation;
                            const ev = mit.reactionEvadeBonus ?? 0;
                            const eff = mit.effectiveEvade;
                            const how = mit.phasedByReaction ? 'Ghost Slip / Phasing' : 'Evade';
                            await globalThis.ChatMessage?.create?.({
                                user: game.user?.id,
                                speaker: globalThis.ChatMessage?.getSpeaker?.({ actor: target }),
                                content: `<p class="mastery-reaction-msg"><strong>${atkName}</strong> → <strong>${defName}</strong>: hit <strong>negated</strong> by ${how}${!mit.phasedByReaction && ev > 0 && eff != null ? ` (+${ev} → Evade ${eff})` : ''}. No damage.</p>`,
                            });
                            const iniGain = Math.max(0, Math.floor(Number(mit.initiativeGain) || 0));
                            if (iniGain > 0 && combatForReactions) {
                                const { applyMidCombatInitiativeGain } = await import('../combat/initiative-gain.js');
                                await applyMidCombatInitiativeGain(combatForReactions, target, iniGain);
                            }
                        }
                        catch (negErr) {
                            console.warn('Mastery System | evade-negated follow-up failed', negErr);
                        }
                    }
                    else {
                        // Dive for Cover applies to EVERY creature in the area — the primary
                        // target may spend its Reaction to escape before damage is rolled.
                        if (isAreaAttack) {
                            const { promptDiveForCoverEscape } = await import('../combat/aoe-melee-resolution.js');
                            const primaryTok = canvas?.tokens?.placeables?.find((t) => t?.id === updatedFlags.targetTokenId) ?? null;
                            primaryEscaped = await promptDiveForCoverEscape(target, primaryTok);
                        }
                        if (!primaryEscaped) {
                            const { showDamageDialog } = await import('../dice/damage-dialog.js');
                            damageResult = await showDamageDialog(freshAttackerForDialog, target, weaponId, updatedFlags.selectedPowerId || null, 0, updatedFlags);
                        }
                        if (damageResult) {
                            // Post damage rolls first (HP not applied yet when pendingApply).
                            const dmgMsg = await rollAndDisplayDamage(damageResult, attacker, target, updatedFlags);
                            if (damageResult.pendingApply) {
                                const combat = combatForReactions;
                                const attackCtx = damageResult.attackContext ?? {
                                    attackTotal: updatedFlags.attackTotal ?? null,
                                    evadeTn: updatedFlags.normalTn ??
                                        updatedFlags.baseEvade ??
                                        updatedFlags.targetEvade ??
                                        null,
                                };
                                // Phasing after damage roll, before HP apply / ally reactions.
                                let phasedOut = false;
                                try {
                                    const { promptPhasingConsume, consumePhasingCharge } = await import('../combat/phasing.js');
                                    phasedOut = await promptPhasingConsume(target, {
                                        attacker: freshAttackerForDialog,
                                        rawDamage: damageResult.totalDamage,
                                    });
                                    if (phasedOut) {
                                        await consumePhasingCharge(target);
                                        const sheet = target.sheet;
                                        if (sheet?.rendered)
                                            sheet.render(false);
                                        damageResult.mitigation = {
                                            rawDamage: damageResult.totalDamage,
                                            armorApplied: 0,
                                            drPercent: 0,
                                            mitigatedDamage: 0,
                                            tempHPAbsorbed: 0,
                                            barDamage: 0,
                                            min8sUsed: false,
                                            breakdownLine: `Raw ${damageResult.totalDamage} → Phased (ignored)`,
                                            phased: true,
                                        };
                                    }
                                }
                                catch (phaseErr) {
                                    console.debug?.('Mastery System | deferred phasing skipped', phaseErr);
                                }
                                if (!phasedOut) {
                                    const { applyDamageToTarget } = await import('../dice/damage-dialog.js');
                                    damageResult.mitigation = await applyDamageToTarget(target, damageResult.totalDamage, freshAttackerForDialog, damageResult.count8s ?? 0, {
                                        attackTotal: attackCtx.attackTotal ?? null,
                                        evadeTn: attackCtx.evadeTn ?? null,
                                        reactionMitigation: preDamage.mitigation,
                                        skipPhasing: true,
                                        skipReactionPrompt: true,
                                    });
                                }
                                damageResult.pendingApply = false;
                                if (dmgMsg?.id) {
                                    await updateDamageChatWithMitigation(String(dmgMsg.id), damageResult, target);
                                }
                            }
                        }
                        else if (!primaryEscaped) {
                            console.warn('Mastery System | [AFTER DAMAGE DIALOG] No damage result returned from showDamageDialog');
                        }
                    }
                    // Phase 2 — after the original attack fully resolved: Threatened Ranged OAs.
                    try {
                        await runInteractiveReactionWindow({
                            defender: target,
                            attacker: freshAttackerForDialog,
                            combat: combatForReactions,
                            rawDamage: Math.max(0, Math.floor(Number(damageResult?.totalDamage) || 0)),
                            attackTotal: updatedFlags.attackTotal ?? null,
                            evadeTn: normalTn,
                            hit: !primaryNegated,
                            damageMessageId: null,
                            phase: 'others',
                            eventId: preDamage.eventId,
                            spentActorIds: preDamage.spentActorIds,
                            used: preDamage.used,
                            priorMitigation: preDamage.mitigation,
                            opportunityEnemyTokenIds: suppressNestedCounterattack
                                ? []
                                : opportunityEnemyTokenIds,
                            suppressCounterattack: suppressNestedCounterattack,
                            silentIfEmpty: true,
                        });
                    }
                    catch (allyErr) {
                        console.warn('Mastery System | opportunity reaction window failed', allyErr);
                    }
                    // Secondaries: each compared separately against its own Evade / Final
                    // Spell TN. Resolve even if the primary Evaded, dove out, or was missed
                    // for raise purposes — a miss against one creature does not protect others.
                    if (aoeWeapon && aoeSecondaries.length > 0) {
                        const { resolveAoeMeleeSecondaries } = await import('../combat/aoe-melee-resolution.js');
                        const atkMr = Math.max(1, Math.min(8, Math.floor(Number(updatedFlags.masteryRank) || 2)));
                        await resolveAoeMeleeSecondaries({
                            attacker: freshAttackerForDialog,
                            attackerMasteryRank: atkMr,
                            secondaryTokenIds: aoeSecondaries,
                            powerBonusDice: aoeDice,
                            isSpell: updatedFlags.powerIsSpell === true,
                            attackTotal: updatedFlags.attackTotal ?? null,
                            evadeTn: updatedFlags.normalTn ?? updatedFlags.baseEvade ?? null,
                            flags: updatedFlags,
                            weaponId,
                            declaredRaiseSlots,
                            spellBaseTn: updatedFlags.spellBaseTn ?? null,
                        });
                    }
                }
            }
            else {
                // Miss vs the anchor TN — for AoE, still check every other creature
                // independently (a miss against one does not end the AoE).
                if ((flags.aoeMeleeWeapon === true || String(flags.aoeMeleeWeapon) === 'true') ||
                    !!button.attr('data-aoe-melee')) {
                    const aoeIdsMiss = String(button.attr('data-aoe-secondary-ids') || '')
                        .split('|')
                        .map((s) => s.trim())
                        .filter(Boolean);
                    const aoeSecondariesMiss = aoeIdsMiss.length > 0
                        ? aoeIdsMiss
                        : String(flags.aoeMeleeSecondaryTokenIds || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean);
                    if (aoeSecondariesMiss.length > 0) {
                        try {
                            const { resolveAoeMeleeSecondaries } = await import('../combat/aoe-melee-resolution.js');
                            const missAttacker = freshAttacker || game.actors?.get(flags.attackerId);
                            if (missAttacker) {
                                await resolveAoeMeleeSecondaries({
                                    attacker: missAttacker,
                                    attackerMasteryRank: Math.max(1, Math.min(8, Math.floor(Number(flags.masteryRank) || 2))),
                                    secondaryTokenIds: aoeSecondariesMiss,
                                    powerBonusDice: 0,
                                    isSpell: flags.powerIsSpell === true,
                                    attackTotal: Math.floor(Number(result?.total) || 0),
                                    flags: {
                                        ...flags,
                                        attackTotal: Math.floor(Number(result?.total) || 0),
                                        raiseOutcome: 'fail',
                                    },
                                    weaponId: flags.weaponId || null,
                                    declaredRaiseSlots,
                                    spellBaseTn: flags.spellBaseTn ?? null,
                                });
                            }
                        }
                        catch (aoeMissErr) {
                            console.warn('Mastery System | AoE secondary resolve on anchor miss failed', aoeMissErr);
                        }
                    }
                }
                // Miss — target reacts first; Threatened Ranged OA + allies after.
                try {
                    let missTarget = null;
                    if (flags.targetTokenId) {
                        const tokenDoc = canvas?.scene?.tokens?.get(flags.targetTokenId);
                        if (tokenDoc?.actor)
                            missTarget = tokenDoc.actor;
                    }
                    if (!missTarget && flags.targetId) {
                        missTarget = game.actors?.get(flags.targetId) || null;
                    }
                    const missAttacker = freshAttacker || game.actors?.get(flags.attackerId);
                    if (missTarget && missAttacker) {
                        const { runInteractiveReactionWindow } = await import('../combat/reaction-window-chat.js');
                        const missFlags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'] || flags;
                        const opportunityEnemyTokenIds = await resolveOpportunityEnemyTokenIds(missFlags, missAttacker);
                        const phase1 = await runInteractiveReactionWindow({
                            defender: missTarget,
                            attacker: missAttacker,
                            combat: game.combat ?? null,
                            rawDamage: 0,
                            attackTotal: Math.floor(Number(result?.total) || 0),
                            evadeTn: normalTn,
                            hit: false,
                            phase: 'defender',
                            suppressCounterattack: suppressNestedCounterattack,
                        });
                        await runInteractiveReactionWindow({
                            defender: missTarget,
                            attacker: missAttacker,
                            combat: game.combat ?? null,
                            rawDamage: 0,
                            attackTotal: Math.floor(Number(result?.total) || 0),
                            evadeTn: normalTn,
                            hit: false,
                            phase: 'others',
                            eventId: phase1.eventId,
                            spentActorIds: phase1.spentActorIds,
                            used: phase1.used,
                            priorMitigation: phase1.mitigation,
                            opportunityEnemyTokenIds: suppressNestedCounterattack
                                ? []
                                : opportunityEnemyTokenIds,
                            suppressCounterattack: suppressNestedCounterattack,
                            silentIfEmpty: true,
                        });
                    }
                }
                catch (missReactErr) {
                    console.warn('Mastery System | miss reaction window failed', missReactErr);
                }
            }
            if (flags.consumableItemId && spentActionOnRoll) {
                try {
                    const { consumeEquippedConsumableAfterSuccess } = await import('../utils/consumable-slots.js');
                    const owner = actorToRefund ?? freshAttacker;
                    const item = owner?.items?.get?.(flags.consumableItemId);
                    if (item)
                        await consumeEquippedConsumableAfterSuccess(owner, item);
                }
                catch (consumeErr) {
                    console.warn('Mastery System | consumable consume after attack roll failed', consumeErr);
                }
            }
        }
        catch (error) {
            if (spentAmmoOnRoll && actorForAmmo) {
                try {
                    const { refundAmmunitionForAttack } = await import('../utils/ammunition.js');
                    await refundAmmunitionForAttack(actorForAmmo, 1);
                }
                catch {
                    /* ignore */
                }
            }
            if (spentActionOnRoll && actorToRefund) {
                try {
                    const { refundAttackAction, unmarkPowerUsedThisRound, unmarkNpcAttackUsedThisRound, } = await import('../combat/action-economy.js');
                    await refundAttackAction(actorToRefund, game.combat);
                    if (markedPowerIdForRoll) {
                        await unmarkPowerUsedThisRound(actorToRefund, game.combat, markedPowerIdForRoll);
                    }
                    if (markedNpcAttackIdForRoll) {
                        await unmarkNpcAttackUsedThisRound(actorToRefund, game.combat, markedNpcAttackIdForRoll);
                    }
                }
                catch (refundErr) {
                    console.warn('Mastery System | Could not refund attack action after failed roll', refundErr);
                }
            }
            console.error('Mastery System | DEBUG: Error during roll', error);
            console.error('Mastery System | Error rolling attack:', error);
            ui.notifications?.error('Failed to roll attack');
            resetRollButton();
        }
        finally {
            // Unblock a Reaction Counterattack / OA that paused another attack.
            if (awaitsResolution) {
                try {
                    const { completeAttackResolution } = await import('../combat/attack-resolution-wait.js');
                    completeAttackResolution(String(messageId), { status: 'resolved' });
                }
                catch (completeErr) {
                    console.warn('Mastery System | completeAttackResolution failed', completeErr);
                }
            }
        }
    }
}
function buildMitigationHtml(damageResult) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const mit = damageResult.mitigation;
    if (damageResult.pendingApply && !mit) {
        return `
        <div class="mastery-damage-mitigation mastery-damage-pending">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-hourglass-half"></i> Awaiting Reactions…</div>
          <div class="mastery-damage-mitigation-breakdown">Roh ${Math.max(0, Math.floor(Number(damageResult.totalDamage) || 0))} — HP not applied yet</div>
        </div>`;
    }
    if (!mit)
        return '';
    if (mit.phased) {
        return `
        <div class="mastery-damage-mitigation mastery-damage-phased">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-ghost"></i> Phased — Angriff ignoriert</div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
    }
    if (mit.negatedByEvade) {
        return `
        <div class="mastery-damage-mitigation mastery-damage-phased">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-person-running"></i> Reaction Evade — Treffer negiert</div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
    }
    const armorLine = mit.armorApplied > 0
        ? `<span class="mitigation-chip mitigation-chip-armor"><i class="fas fa-shield-alt"></i> Rüstung: ${mit.armorApplied} aufgefangen</span>`
        : '';
    const drLine = mit.drPercent > 0
        ? `<span class="mitigation-chip mitigation-chip-dr"><i class="fas fa-user-shield"></i> DR: ${mit.drPercent}% reduziert</span>`
        : '';
    const tempLine = mit.tempHPAbsorbed > 0
        ? `<span class="mitigation-chip mitigation-chip-temp"><i class="fas fa-heart"></i> Temp-HP: ${mit.tempHPAbsorbed} absorbiert</span>`
        : '';
    const min8sLine = mit.min8sUsed
        ? `<span class="mitigation-chip mitigation-chip-8s"><i class="fas fa-dice"></i> 8er-Minimum</span>`
        : '';
    return `
        <div class="mastery-damage-mitigation">
          <div class="mastery-damage-mitigation-title">
            <i class="fas fa-shield-halved"></i> Schadensreduktion
          </div>
          <div class="mastery-damage-mitigation-chips">
            <span class="mitigation-chip mitigation-chip-raw"><i class="fas fa-burst"></i> Roh: ${mit.rawDamage}</span>
            ${armorLine}
            ${drLine}
            ${tempLine}
            ${min8sLine}
            <span class="mitigation-chip mitigation-chip-final"><i class="fas fa-heart-crack"></i> HP verloren: <strong>${mit.barDamage}</strong></span>
          </div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
}
function buildDamageChatContent(damageResult, target) {
    const damageBreakdown = [];
    if (damageResult.baseDamage > 0)
        damageBreakdown.push(`Base: ${damageResult.baseDamage}`);
    if (damageResult.powerDamage > 0)
        damageBreakdown.push(`Power: ${damageResult.powerDamage}`);
    if (damageResult.passiveDamage > 0)
        damageBreakdown.push(`Passive: ${damageResult.passiveDamage}`);
    if (damageResult.raiseDamage > 0)
        damageBreakdown.push(`Raises: ${damageResult.raiseDamage}`);
    const damageText = damageBreakdown.length > 0 ? damageBreakdown.join(', ') : `${damageResult.totalDamage} damage`;
    const details = Array.isArray(damageResult.rollDetails)
        ? damageResult.rollDetails
        : [];
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const rollsHtml = details.length > 0
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${esc(line)}</li>`)
            .join('')}</ul></div>`
        : '';
    const limitNotes = Array.isArray(damageResult.applicationLimitNotes)
        ? damageResult.applicationLimitNotes
        : [];
    const limitHtml = limitNotes.length
        ? `<p class="mastery-damage-special-limit">${limitNotes.map((n) => esc(n)).join('<br>')}</p>`
        : '';
    return `<div class="mastery-system-damage">
      <h3><i class="fas fa-sword"></i> Damage: ${damageResult.totalDamage}</h3>
      ${rollsHtml}
      <p class="mastery-damage-summary">${damageText}</p>
      <p><strong>Target:</strong> ${target.name}</p>
      ${limitHtml}
      ${buildMitigationHtml(damageResult)}
    </div>`;
}
/**
 * Roll and display damage in chat. Returns the created message (for later mitigation updates).
 */
async function rollAndDisplayDamage(damageResult, attacker, target, _flags) {
    const attackerToken = attacker.getActiveTokens?.()?.[0]?.document || null;
    const chatRolls = Array.isArray(damageResult.damageChatRolls) ? damageResult.damageChatRolls : [];
    const serializedRolls = chatRolls.length > 0
        ? chatRolls
            .map((r) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
            .filter(Boolean)
        : [];
    const content = buildDamageChatContent(damageResult, target);
    // Faith Keep already posted this card — refresh rolls/details, do not duplicate.
    const prePostedId = String(damageResult?.prePostedChatMessageId || '');
    if (prePostedId) {
        try {
            const existing = game.messages?.get?.(prePostedId);
            if (existing) {
                const patch = { content };
                if (serializedRolls.length > 0) {
                    patch.rolls = serializedRolls;
                    patch.sound = CONFIG.sounds.dice;
                }
                await existing.update(patch);
                return existing;
            }
        }
        catch (err) {
            console.warn('Mastery System | Could not update pre-posted damage chat — creating new', err);
        }
    }
    const chatData = {
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker, token: attackerToken }),
        content,
    };
    if (serializedRolls.length > 0) {
        chatData.rolls = serializedRolls;
        chatData.sound = CONFIG.sounds.dice;
    }
    else {
        chatData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }
    try {
        return (await ChatMessage.create(chatData));
    }
    catch (error) {
        console.warn('Mastery System | Could not create damage chat message:', error);
        return null;
    }
}
/** Patch an existing damage chat message after reactions + HP apply. */
async function updateDamageChatWithMitigation(messageId, damageResult, target) {
    try {
        const message = game.messages?.get?.(messageId);
        if (!message)
            return;
        await message.update({ content: buildDamageChatContent(damageResult, target) });
    }
    catch (err) {
        console.warn('Mastery System | Could not update damage chat with mitigation', err);
    }
}
//# sourceMappingURL=attack-roll-handler.js.map