/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */
/** jQuery `.data()` caches parsed `data-*` on first read; dynamic `.attr()` updates won't match. */
function readAttackButtonDataInt(button, kebab, fallback) {
    const raw = button.attr(`data-${kebab}`);
    if (raw === undefined || raw === '')
        return fallback;
    const n = parseInt(String(raw), 10);
    return Number.isFinite(n) ? n : fallback;
}
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
        const resetRollButton = () => {
            button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll');
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
            // Ensure we have fresh actor reference (not stale) - reload from game.actors
            const freshAttacker = game.actors?.get(attacker.id) || attacker;
            const costsAction = flags.costsAction !== false;
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
            // TN / declared raises: read from DOM attrs (dropdown updates .attr, not jQuery .data cache)
            const currentTargetEvade = readAttackButtonDataInt(button, 'target-evade', flags.targetEvade ?? 0);
            const declaredRaisesForTn = readAttackButtonDataInt(button, 'raises', 0);
            // Voluntary Auto-Raises: each one removes 4 dice from the pool and grants
            // +1 guaranteed raise on a successful attack.
            const autoRaises = Math.max(0, readAttackButtonDataInt(button, 'auto-raises', 0));
            // Compute numDice from ACTOR at click time (not from stale flags)
            // This ensures we always use the current attribute value
            const attackerForRoll = message.speaker?.actor ?
                game.actors.get(message.speaker.actor) :
                (game.actors?.get(flags.attackerId));
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
            // Apply health penalty (reduces dice pool)
            const { getCurrentPenalty } = await import('../utils/calculations.js');
            const healthBars = attackerForRoll?.system?.health?.bars || [];
            const currentBar = attackerForRoll?.system?.health?.currentBar ?? 0;
            const healthPenalty = getCurrentPenalty(healthBars, currentBar);
            // Health penalty reduces the dice pool (numDice)
            // Penalty is negative (e.g., -1, -2, -4), so we add it to reduce numDice
            numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
            // Split-Attack: hard-cap the final pool inside `masteryRoll` so attack-rider
            // / manual bonus dice cannot inflate the strike back to the full attribute pool.
            const splitAttackDiceCap = flags.splitAttack === true ? numDice : undefined;
            let keepDice = flags.masteryRank ?? (attackerForRoll?.system?.mastery?.rank ?? 2);
            const baseKeepDice = keepDice;
            if (flags.rollDisadvantage) {
                keepDice = Math.max(1, keepDice - 1);
            }
            console.log('Mastery System | DEBUG: Roll parameters', {
                numDice: numDice,
                keepDice: keepDice,
                baseKeepDice,
                rollDisadvantage: !!flags.rollDisadvantage,
                skill: 0,
                tn: currentTargetEvade,
                raises: declaredRaisesForTn,
                baseEvade: flags.targetEvade,
                adjustedEvade: currentTargetEvade,
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
            const disadvantageNote = flags.rollDisadvantage
                ? ` (Disadvantage: keep ${baseKeepDice} → ${keepDice})`
                : '';
            const attackKind = flags.attackType === 'ranged' ? 'Ranged' : 'Melee';
            const actionEco = await import('../combat/action-economy.js');
            const economyForStones = actionEco.getActionEconomyActor(freshAttacker) ?? freshAttacker;
            const combatRef = game.combat;
            const rsCrit = actionEco.getRoundState(economyForStones, combatRef);
            const critBank = Math.max(0, Math.floor(Number(rsCrit?.stoneBonuses?.critRaises ?? 0) || 0));
            const attackExplodeDiceOn78 = critBank > 0;
            const result = await masteryRoll({
                numDice: numDice,
                keepDice: keepDice,
                skill: 0,
                tn: currentTargetEvade,
                label: `${attackKind} Attack (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`,
                flavor: `Roll ${numDice}d8 keep ${keepDice} vs ${game.actors?.get(flags.targetId)?.name || 'Target'}'s Evade (${currentTargetEvade}${declaredRaisesForTn > 0 ? `, ${declaredRaisesForTn} raise${declaredRaisesForTn > 1 ? 's' : ''}` : ''})${disadvantageNote}`,
                actorId: flags.attackerId,
                rollKind: 'attack',
                targetActorId: flags.targetId,
                autoFailIntent: 'attack',
                checkContext: { tags: ['sight'] },
                autoRaises,
                ...(typeof splitAttackDiceCap === 'number' && splitAttackDiceCap > 0
                    ? { attackDiceCap: splitAttackDiceCap }
                    : {}),
                ...(attackExplodeDiceOn78 ? { attackExplodeDiceOn78: true } : {}),
            });
            if (attackExplodeDiceOn78) {
                const rs2 = actionEco.getRoundState(economyForStones, combatRef);
                if (!rs2.stoneBonuses) {
                    rs2.stoneBonuses = { extraAttacks: 0, extraReactions: 0, extraMoveMeters: 0 };
                }
                const curCrit = Math.max(0, Math.floor(Number(rs2.stoneBonuses.critRaises ?? 0) || 0));
                rs2.stoneBonuses.critRaises = Math.max(0, curCrit - 1);
                await actionEco.setRoundState(economyForStones, rs2);
            }
            console.log('Mastery System | DEBUG: Roll completed!', {
                total: result.total,
                dice: result.dice,
                kept: result.kept,
                targetEvade: currentTargetEvade,
                baseEvade: flags.targetEvade,
                raises: result.raises,
                success: result.success
            });
            // Update button to show it was rolled
            button.html('<i class="fas fa-check"></i> Rolled').addClass('rolled');
            // If attack was successful, show damage dialog
            if (result.success && result.raises >= 0) {
                // Always get fresh actors to ensure latest items
                const freshAttackerForDialog = game.actors?.get(flags.attackerId) || freshAttacker;
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
                    // Damage raises = margin over final Evade TN from the roll, plus stone-granted free raises.
                    // The attack-card "Raises" dropdown bumps TN by +4 per step *and* caps how many Raises
                    // may be spent on damage when N > 0 (0 = no cap — TN unchanged, full margin applies).
                    let damageRaises = Math.max(0, result.raises);
                    let freeRaisesFromStones = 0;
                    try {
                        const { getRoundState } = await import('../combat/action-economy.js');
                        const combatNow = game.combat;
                        if (freshAttackerForDialog && combatNow) {
                            const rs = getRoundState(freshAttackerForDialog, combatNow);
                            freeRaisesFromStones = Math.max(0, Number(rs?.stoneBonuses?.freeRaises) || 0);
                            damageRaises += freeRaisesFromStones;
                        }
                    }
                    catch (e) {
                        console.warn('Mastery System | [BEFORE DAMAGE DIALOG] Could not read roundState for free raises', e);
                    }
                    const combinedRaises = damageRaises;
                    const totalRaises = declaredRaisesForTn > 0 ? Math.min(combinedRaises, declaredRaisesForTn) : combinedRaises;
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Raises calculation', {
                        messageId: messageId,
                        resultRaises: result.raises,
                        freeRaisesFromStones,
                        totalRaisesForDamage: totalRaises,
                        declaredRaisesForTn: readAttackButtonDataInt(button, 'raises', 0)
                    });
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Calling showDamageDialog with', {
                        messageId: messageId,
                        attackerId: attacker.id,
                        attackerName: attacker.name,
                        targetId: target.id,
                        targetName: target.name,
                        weaponId: weaponId,
                        selectedPowerId: updatedFlags.selectedPowerId || null,
                        totalRaises: totalRaises,
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
                        totalRaises: totalRaises,
                        totalRaisesType: typeof totalRaises,
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
                        raisesArg: totalRaises
                    });
                    const { showDamageDialog } = await import('../dice/damage-dialog.js');
                    // Use the resolved target (token actor if available, otherwise base actor)
                    // Do NOT replace with game.actors.get() as that would lose the token actor reference
                    const damageResult = await showDamageDialog(freshAttackerForDialog, target, weaponId, updatedFlags.selectedPowerId || null, totalRaises, updatedFlags);
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
    });
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