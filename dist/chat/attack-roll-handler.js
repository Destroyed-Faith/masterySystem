/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */
import { countRaiseSlots, parseDeclaredRaises, resolvePowerSnapshot, resolveRaiseOutcome, } from '../combat/raise-resolution.js';
/** jQuery `.data()` caches parsed `data-*` on first read; dynamic `.attr()` updates won't match. */
function readAttackButtonDataInt(button, kebab, fallback) {
    const raw = button.attr(`data-${kebab}`);
    if (raw === undefined || raw === '')
        return fallback;
    const n = parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
}
const rollAttackMessageLocks = new Set();
export function registerAttackRollClickHandler() {
    console.log('Mastery System | DEBUG: Setting up global roll-attack-btn handler on chat log');
    // Register handler on the chat log container using event delegation
    // This ensures it works for all messages, including dynamically added ones
    $(document).off('click', '.roll-attack-btn').on('click', '.roll-attack-btn', async (ev) => {
        console.log('Mastery System | DEBUG: Roll Attack button clicked!', {
            eventType: ev.type,
            target: ev.target,
            currentTarget: ev.currentTarget,
            buttonClass: $(ev.currentTarget).attr('class')
        });
        ev.preventDefault();
        ev.stopPropagation();
        const button = $(ev.currentTarget);
        const messageElement = button.closest('.message');
        // Try multiple methods to get message ID (Foundry VTT uses data-message-id attribute)
        const messageId = messageElement.attr('data-message-id') ||
            messageElement.data('message-id') ||
            messageElement.data('messageId');
        console.log('Mastery System | DEBUG: Button click details', {
            messageId,
            messageElementAttrs: {
                'data-message-id': messageElement.attr('data-message-id'),
                'data-messageId': messageElement.attr('data-messageId'),
                'id': messageElement.attr('id'),
                'class': messageElement.attr('class')
            },
            buttonData: {
                attackerId: button.data('attacker-id'),
                targetId: button.data('target-id'),
                attribute: button.data('attribute'),
                attributeValue: button.data('attribute-value'),
                masteryRank: button.data('mastery-rank'),
                targetEvade: button.data('target-evade'),
                raises: readAttackButtonDataInt(button, 'raises', 0),
                baseEvade: readAttackButtonDataInt(button, 'base-evade', 0)
            },
            buttonHtml: button.html()
        });
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
        console.log('Mastery System | [ROLL BUTTON CLICK] All message flags', {
            messageId: messageId,
            allFlags: allFlags,
            allFlagKeys: Object.keys(allFlags || {}),
            masterySystemFlags: allFlags?.['mastery-system']
        });
        // Try both methods to get flags (getFlag might not work in some Foundry versions)
        const flags = message.getFlag?.('mastery-system') || message.flags?.['mastery-system'];
        // Debug log after flags read
        console.log('Mastery System | [WEAPON-ID DEBUG]', {
            messageType: 'roll-attack:flags-read',
            messageId: messageId,
            flagsWeaponId: flags?.weaponId,
            flagsSelectedPowerId: flags?.selectedPowerId,
            flagsRaises: flags?.raises,
            flagsTargetId: flags?.targetId,
            flagsAttackerId: flags?.attackerId,
            allKeys: Object.keys(flags || {})
        });
        console.log('Mastery System | [ROLL BUTTON CLICK] Message flags (mastery-system)', {
            messageId: messageId,
            flags: flags,
            weaponId: flags?.weaponId,
            selectedPowerId: flags?.selectedPowerId,
            targetEvade: flags?.targetEvade,
            baseEvade: flags?.baseEvade,
            allFlagKeys: Object.keys(flags || {})
        });
        console.log('Mastery System | [ROLL BUTTON CLICK] Flags structure', {
            messageId: messageId,
            hasGetFlag: typeof message.getFlag === 'function',
            flagsDirect: message.flags?.['mastery-system'],
            flagsViaGetFlag: message.getFlag?.('mastery-system'),
            flagsMatch: message.flags?.['mastery-system'] === message.getFlag?.('mastery-system')
        });
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
        const resetRollButton = () => {
            button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll');
            rollAttackMessageLocks.delete(lockId);
        };
        // Disable button during roll
        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
        console.log('Mastery System | DEBUG: Starting attack roll...');
        let spentActionOnRoll = false;
        let actorToRefund = null;
        let markedPowerIdForRoll = null;
        try {
            // Import the roll handler (must use .js extension for ES modules in Foundry VTT)
            const { masteryRoll } = await import('../dice/roll-handler.js');
            console.log('Mastery System | DEBUG: Roll handler imported');
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
            console.log('Mastery System | [ROLL ATTACK] Fresh attacker items', {
                attackerId: freshAttacker.id,
                itemsCount: attackerItems.length,
                itemsTypes: attackerItems.map((i) => ({ id: i.id, name: i.name, type: i.type })),
                weaponItemsCount: attackerItems.filter((i) => i.type === 'weapon').length
            });
            // Normal TN vs Raise TN (new Raise rules)
            const normalTn = readAttackButtonDataInt(button, 'normal-tn', readAttackButtonDataInt(button, 'target-evade', flags.normalTn ?? flags.baseEvade ?? 0));
            const raiseTn = readAttackButtonDataInt(button, 'raise-tn', normalTn);
            const raisePlanRaw = button.attr('data-raise-plan') || '[]';
            const declaredRaises = parseDeclaredRaises(raisePlanRaw);
            const declaredRaiseSlots = countRaiseSlots(declaredRaises);
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
            // Players Guide minimum-pool rule (~5888–5899): an attacker with an
            // attribute below their Mastery Rank still rolls dice equal to MR
            // (Keep stays MR). Apply *before* the health penalty so the floor
            // and the health hit interact correctly.
            const masteryRankForFloor = flags.masteryRank ?? (attackerForRoll?.system?.mastery?.rank ?? 2);
            numDice = Math.max(numDice, masteryRankForFloor);
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
            // Players Guide ~6518–6544: health penalty is a *percentage of the
            // rolled pool* (10/20/30/40 % per broken bar, floored).
            const { applyHealthAndEncumbrancePenalties } = await import('../utils/encumbrance.js');
            const poolPenalties = applyHealthAndEncumbrancePenalties(numDice, attackerForRoll);
            numDice = poolPenalties.numDice;
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
            console.log('Mastery System | DEBUG: Roll parameters', {
                numDice: numDice,
                keepDice: keepDice,
                baseKeepDice,
                rollDisadvantage: !!flags.rollDisadvantage,
                skill: 0,
                tn: normalTn,
                normalTn,
                raiseTn,
                declaredRaiseSlots,
                baseEvade: flags.baseEvade,
                attributeFromFlags: flags.attribute,
                attributeValueFromFlags: flags.attributeValue,
                liveAttributeValue: liveAttr,
                usingLiveValue: Number.isFinite(liveAttr) && liveAttr > 0,
                masteryRankFromFlags: flags.masteryRank
            });
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
            console.log('Mastery System | DEBUG: Calling masteryRoll...');
            const advantageNote = flags.rollAdvantage
                ? ' (Advantage: reroll any 1 once)'
                : '';
            const disadvantageNote = flags.rollDisadvantage
                ? ' (Disadvantage: only one 8 explodes)'
                : '';
            void baseKeepDice;
            const attackKind = flags.attackType === 'ranged' ? 'Ranged' : 'Melee';
            const targetActorForFlavor = game.actors?.get(flags.targetId);
            const rollFlavorBase = tnKind === 'casting'
                ? `Roll ${numDice}d8 keep ${keepDice} vs Casting TN ${normalTn}${declaredRaiseSlots > 0 ? ` (Raise TN ${raiseTn})` : ''}${advantageNote}${disadvantageNote}${rangeBandNote}`
                : `Roll ${numDice}d8 keep ${keepDice} vs ${targetActorForFlavor?.name || 'Target'}'s Evade (${normalTn}${declaredRaiseSlots > 0 ? `, Raise TN ${raiseTn}` : ''})${advantageNote}${disadvantageNote}${rangeBandNote}`;
            const rollFlavor = opts.faithReroll
                ? `${rollFlavorBase}\n\n<i class="fas fa-sync-alt"></i> Reroll — ${opts.faithReroll.spenderName} spent 1 Faith Fracture.`
                : rollFlavorBase;
            const rollLabel = tnKind === 'casting'
                ? `Spell Attack (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`
                : `${attackKind} Attack (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`;
            // Dread: pre-attack Save gate. On failure the attack is lost (action
            // stays spent). Disrupt: using a Power reduces/clears Disrupt.
            // Faith reroll: both already resolved on the original roll — skip.
            if (!isFaithReroll) {
                try {
                    const { resolveDreadPreAttack, consumePowerDisrupt } = await import('../combat/dread-gate.js');
                    const dread = await resolveDreadPreAttack(freshAttacker);
                    if (dread.blocked) {
                        ui.notifications?.warn(dread.note || 'Dread — attack lost.');
                        button.html('<i class="fas fa-ban"></i> Dread').addClass('rolled');
                        rollAttackMessageLocks.delete(lockId);
                        return;
                    }
                    if (flags.selectedPowerId) {
                        await consumePowerDisrupt(freshAttacker);
                    }
                }
                catch (err) {
                    console.warn('Mastery System | Dread/Disrupt gate failed', err);
                }
            }
            const actionEco = await import('../combat/action-economy.js');
            const economyForStones = actionEco.getActionEconomyActor(freshAttacker) ?? freshAttacker;
            const combatRef = game.combat;
            const rsCrit = actionEco.getRoundState(economyForStones, combatRef);
            const critBank = Math.max(0, Math.floor(Number(rsCrit?.stoneBonuses?.critRaises ?? 0) || 0));
            const attackExplodeDiceOn78 = critBank > 0;
            const bloodRaises = Math.max(0, parseInt(button.attr('data-blood-raises') || '0', 10) || 0);
            let raiseTnRollBonus = 0;
            if (tnKind === 'casting' && freshAttacker && combatRef) {
                raiseTnRollBonus = Math.max(0, Number(rsCrit?.stoneBonuses?.spellRaiseTnBonus ?? 0) || 0);
            }
            // Faith reroll: Blood Raise HP was already paid on the original roll.
            if (bloodRaises > 0 && tnKind === 'casting' && freshAttacker && !isFaithReroll) {
                const { applyBloodRaiseHpLoss } = await import('../combat/spell-roll-handler.js');
                await applyBloodRaiseHpLoss(freshAttacker, bloodRaises * 4);
            }
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
                normalTn,
                raiseTn,
                declaredRaiseSlots,
                raiseModel: 'power',
                ...(bloodRaises > 0 && tnKind === 'casting' ? { bloodRaises } : {}),
                ...(raiseTnRollBonus > 0 && tnKind === 'casting' ? { raiseTnRollBonus } : {}),
                ...(typeof splitAttackDiceCap === 'number' && splitAttackDiceCap > 0
                    ? { attackDiceCap: splitAttackDiceCap }
                    : {}),
                ...(attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
                ...(flags.rollAdvantage ? { rollAdvantage: true } : {}),
                ...(flags.rollDisadvantage ? { rollDisadvantage: true } : {}),
                attackCardMessageId: messageId,
            });
            if (attackExplodeDiceOn78 && !isFaithReroll) {
                const rs2 = actionEco.getRoundState(economyForStones, combatRef);
                if (!rs2.stoneBonuses) {
                    rs2.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
                }
                const curCrit = Math.max(0, Math.floor(Number(rs2.stoneBonuses.critRaises ?? 0) || 0));
                rs2.stoneBonuses.critRaises = Math.max(0, curCrit - 1);
                await actionEco.setRoundState(economyForStones, rs2);
            }
            const raiseOutcome = result.raiseOutcome ??
                resolveRaiseOutcome(result.total, normalTn, declaredRaiseSlots);
            console.log('Mastery System | DEBUG: Roll completed!', {
                total: result.total,
                normalTn,
                raiseTn,
                raiseOutcome,
                success: result.success,
            });
            // Update button to show it was rolled
            button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');
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
                        console.log('Mastery System | [ATTACK ROLL] Resolved target from token', {
                            targetTokenId: flags.targetTokenId,
                            targetId: target.id,
                            targetName: target.name,
                            isTokenActor: true
                        });
                    }
                }
                // Fallback to base actor if token not found
                if (!target) {
                    target = game.actors?.get(flags.targetId) || null;
                    console.log('Mastery System | [ATTACK ROLL] Resolved target from base actor', {
                        targetId: flags.targetId,
                        targetName: target ? target.name : null,
                        isTokenActor: false
                    });
                }
                if (target) {
                    // Re-read flags from message to get updated power selection
                    const currentMessage = game.messages?.get(messageId);
                    let updatedFlags = flags;
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Re-reading flags from message', {
                        messageId: messageId,
                        hasMessage: !!currentMessage,
                        originalFlags: {
                            weaponId: flags.weaponId,
                            selectedPowerId: flags.selectedPowerId,
                            targetEvade: flags.targetEvade,
                            baseEvade: flags.baseEvade
                        }
                    });
                    if (currentMessage) {
                        const messageFlags = currentMessage.getFlag('mastery-system') || currentMessage.flags?.['mastery-system'];
                        if (messageFlags) {
                            updatedFlags = { ...flags, ...messageFlags };
                            console.log('Mastery System | [BEFORE DAMAGE DIALOG] Updated flags from message', {
                                messageId: messageId,
                                originalFlags: {
                                    weaponId: flags.weaponId,
                                    selectedPowerId: flags.selectedPowerId,
                                    targetEvade: flags.targetEvade,
                                    baseEvade: flags.baseEvade
                                },
                                messageFlags: {
                                    weaponId: messageFlags.weaponId,
                                    selectedPowerId: messageFlags.selectedPowerId,
                                    targetEvade: messageFlags.targetEvade,
                                    baseEvade: messageFlags.baseEvade,
                                    allKeys: Object.keys(messageFlags)
                                },
                                updatedFlags: {
                                    weaponId: updatedFlags.weaponId,
                                    selectedPowerId: updatedFlags.selectedPowerId,
                                    targetEvade: updatedFlags.targetEvade,
                                    baseEvade: updatedFlags.baseEvade,
                                    allKeys: Object.keys(updatedFlags)
                                },
                                flagsChanged: {
                                    weaponId: flags.weaponId !== updatedFlags.weaponId,
                                    selectedPowerId: flags.selectedPowerId !== updatedFlags.selectedPowerId
                                }
                            });
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
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Items from fresh attacker', {
                        attackerId: freshAttackerForDialog.id,
                        itemsCount: items.length,
                        itemsTypes: items.map((i) => ({ id: i.id, name: i.name, type: i.type, equipped: i.system?.equipped })),
                        weaponItemsCount: items.filter((i) => i.type === 'weapon').length,
                        allItemIds: items.map((i) => i.id),
                        weaponIdFromFlags: updatedFlags.weaponId,
                        weaponIdInItems: items.some((i) => i.id === updatedFlags.weaponId)
                    });
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
                                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Found weapon from flags via game.items', {
                                        weaponId: weaponId,
                                        weaponName: weaponFromFlags.name,
                                        weaponType: weaponFromFlags.type
                                    });
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
                            console.log('Mastery System | [BEFORE DAMAGE DIALOG] Using weaponId from flags', {
                                weaponId: weaponId,
                                weaponName: weaponFromFlags.name,
                                weaponType: weaponFromFlags.type,
                                equipped: weaponFromFlags.system?.equipped,
                                foundVia: weaponFromFlags === items.find((i) => i.id === weaponId) ? 'items-array' :
                                    (freshAttackerForDialog.items?.get?.(weaponId) === weaponFromFlags ? 'actor-items-get' : 'game-items')
                            });
                        }
                    }
                    // Fallback: If no weaponId in flags or weapon not found, use equipped weapon
                    if (!weaponId && !updatedFlags.npcAttackSource) {
                        const equippedWeapon = items.find((item) => item.type === 'weapon' && item.system?.equipped === true);
                        weaponId = equippedWeapon ? equippedWeapon.id : null;
                        if (weaponId) {
                            console.log('Mastery System | [BEFORE DAMAGE DIALOG] Using equipped weapon as fallback', {
                                weaponId: weaponId,
                                weaponName: equippedWeapon.name,
                                weaponType: equippedWeapon.type
                            });
                        }
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
                                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Found weapon via game.items lookup', {
                                        weaponId: weaponId,
                                        weaponName: weaponItem.name,
                                        weaponType: weaponItem.type,
                                        actorId: gameItem.actor?.id
                                    });
                                }
                            }
                            catch (e) {
                                console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Error looking up weapon from game.items', e);
                            }
                        }
                        if (weaponItem) {
                            console.log('Mastery System | [BEFORE DAMAGE DIALOG] Found weapon via direct lookup', {
                                weaponId: weaponId,
                                weaponName: weaponItem.name,
                                weaponType: weaponItem.type
                            });
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
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Weapon and power IDs', {
                        messageId: messageId,
                        weaponId: weaponId,
                        weaponIdFromFlags: updatedFlags.weaponId,
                        weaponIdMatch: weaponId === updatedFlags.weaponId,
                        selectedPowerId: updatedFlags.selectedPowerId,
                        selectedPowerIdType: typeof updatedFlags.selectedPowerId,
                        selectedPowerIdLength: updatedFlags.selectedPowerId ? updatedFlags.selectedPowerId.length : 0,
                        hasEquippedWeapon: !!equippedWeaponForLog,
                        equippedWeaponName: equippedWeaponForLog ? equippedWeaponForLog.name : null
                    });
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
                        ...(spellCostOverride ? { spellCostOverride } : {}),
                    };
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Raise resolution', {
                        messageId,
                        raiseOutcome,
                        declaredRaiseSlots,
                        stoneBonusRaises,
                    });
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Calling showDamageDialog with', {
                        messageId: messageId,
                        attackerId: attacker.id,
                        attackerName: attacker.name,
                        targetId: target.id,
                        targetName: target.name,
                        weaponId: weaponId,
                        selectedPowerId: updatedFlags.selectedPowerId || null,
                        totalRaises: 0,
                        flagsKeys: Object.keys(updatedFlags || {})
                    });
                    // Import and show damage dialog - pass only IDs, not full objects
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Final check before calling showDamageDialog', {
                        messageId: messageId,
                        weaponId: weaponId,
                        weaponIdType: typeof weaponId,
                        selectedPowerId: updatedFlags.selectedPowerId,
                        selectedPowerIdType: typeof updatedFlags.selectedPowerId,
                        selectedPowerIdValue: updatedFlags.selectedPowerId,
                        totalRaises: 0,
                        totalRaisesType: 'number',
                        hasFlags: !!updatedFlags,
                        allFlagKeys: Object.keys(updatedFlags || {}),
                        flagsSelectedPowerId: updatedFlags?.selectedPowerId,
                        flagsWeaponId: updatedFlags?.weaponId,
                        attackerItems: attacker.items?.length || 0,
                        attackerPowers: attacker.items?.filter((i) => i.type === 'power').map((i) => ({ id: i.id, name: i.name })) || []
                    });
                    // Debug log before calling showDamageDialog
                    console.log('Mastery System | [WEAPON-ID DEBUG]', {
                        messageType: 'roll-attack:before-damage-dialog',
                        weaponIdArg: weaponId,
                        weaponIdFromFlags: updatedFlags.weaponId,
                        weaponIdMatch: weaponId === updatedFlags.weaponId,
                        selectedPowerIdArg: updatedFlags.selectedPowerId || null,
                        raisesArg: 0
                    });
                    const { showDamageDialog } = await import('../dice/damage-dialog.js');
                    const damageResult = await showDamageDialog(freshAttackerForDialog, target, weaponId, updatedFlags.selectedPowerId || null, 0, updatedFlags);
                    console.log('Mastery System | [AFTER DAMAGE DIALOG] showDamageDialog returned', {
                        hasResult: !!damageResult,
                        resultType: damageResult ? typeof damageResult : 'null',
                        resultKeys: damageResult ? Object.keys(damageResult) : [],
                        resultTotalDamage: damageResult?.totalDamage,
                        resultBaseDamage: damageResult?.baseDamage,
                        resultPowerDamage: damageResult?.powerDamage
                    });
                    if (damageResult) {
                        // Roll and display damage
                        await rollAndDisplayDamage(damageResult, attacker, target, flags);
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
                        if (aoeWeapon && aoeSecondaries.length > 0 && aoeDice > 0) {
                            const { resolveAoeMeleeSecondaries } = await import('../combat/aoe-melee-resolution.js');
                            const atkMr = Math.max(1, Math.min(6, Math.floor(Number(updatedFlags.masteryRank) || 2)));
                            await resolveAoeMeleeSecondaries({
                                attacker: freshAttackerForDialog,
                                attackerMasteryRank: atkMr,
                                secondaryTokenIds: aoeSecondaries,
                                powerBonusDice: aoeDice,
                            });
                        }
                    }
                    else {
                        console.warn('Mastery System | [AFTER DAMAGE DIALOG] No damage result returned from showDamageDialog');
                    }
                }
            }
        }
        catch (error) {
            if (spentActionOnRoll && actorToRefund) {
                try {
                    const { refundAttackAction, unmarkPowerUsedThisRound } = await import('../combat/action-economy.js');
                    await refundAttackAction(actorToRefund, game.combat);
                    if (markedPowerIdForRoll) {
                        await unmarkPowerUsedThisRound(actorToRefund, game.combat, markedPowerIdForRoll);
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
    }
}
/**
 * Roll and display damage in chat
 */
async function rollAndDisplayDamage(damageResult, attacker, target, _flags) {
    const damageBreakdown = [];
    if (damageResult.baseDamage > 0) {
        damageBreakdown.push(`Base: ${damageResult.baseDamage}`);
    }
    if (damageResult.powerDamage > 0) {
        damageBreakdown.push(`Power: ${damageResult.powerDamage}`);
    }
    if (damageResult.passiveDamage > 0) {
        damageBreakdown.push(`Passive: ${damageResult.passiveDamage}`);
    }
    if (damageResult.raiseDamage > 0) {
        damageBreakdown.push(`Raises: ${damageResult.raiseDamage}`);
    }
    const damageText = damageBreakdown.length > 0
        ? damageBreakdown.join(', ')
        : `${damageResult.totalDamage} damage`;
    const details = Array.isArray(damageResult.rollDetails) ? damageResult.rollDetails : [];
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const rollsHtml = details.length > 0
        ? `<div class="mastery-damage-rolls"><strong>Rolled</strong><ul class="mastery-damage-roll-list">${details
            .map((line) => `<li>${esc(line)}</li>`)
            .join("")}</ul></div>`
        : "";
    const attackerToken = attacker.getActiveTokens?.()?.[0]?.document || null;
    const chatRolls = Array.isArray(damageResult.damageChatRolls) ? damageResult.damageChatRolls : [];
    const serializedRolls = chatRolls.length > 0
        ? chatRolls
            .map((r) => (typeof r?.toJSON === 'function' ? r.toJSON() : r))
            .filter(Boolean)
        : [];
    // Mitigation summary block — make it easy to see how much damage was
    // soaked by Armor / DR% and what actually went through. The mitigation
    // object is produced by `applyDefensiveMitigation`; it is absent if the
    // attack bypassed the defensive pipeline (e.g. no target).
    let mitigationHtml = '';
    const mit = damageResult.mitigation;
    if (mit) {
        if (mit.phased) {
            mitigationHtml = `
        <div class="mastery-damage-mitigation mastery-damage-phased">
          <div class="mastery-damage-mitigation-title"><i class="fas fa-ghost"></i> Phased — Angriff ignoriert</div>
          <div class="mastery-damage-mitigation-breakdown">${esc(mit.breakdownLine)}</div>
        </div>`;
        }
        else {
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
            mitigationHtml = `
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
    }
    const chatData = {
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker, token: attackerToken }),
        content: `<div class="mastery-system-damage">
      <h3><i class="fas fa-sword"></i> Damage: ${damageResult.totalDamage}</h3>
      ${rollsHtml}
      <p class="mastery-damage-summary">${damageText}</p>
      <p><strong>Target:</strong> ${target.name}</p>
      ${mitigationHtml}
    </div>`
    };
    if (serializedRolls.length > 0) {
        chatData.rolls = serializedRolls;
        chatData.sound = CONFIG.sounds.dice;
    }
    else {
        chatData.style = CONST.CHAT_MESSAGE_STYLES.OTHER;
    }
    try {
        await ChatMessage.create(chatData);
    }
    catch (error) {
        console.warn('Mastery System | Could not create damage chat message:', error);
    }
}
//# sourceMappingURL=attack-roll-handler.js.map