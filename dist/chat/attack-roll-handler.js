/**
 * Attack Roll Click Handler
 * Handles clicks on .roll-attack-btn buttons in chat messages
 * Moved from module.ts to avoid circular dependencies
 */
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
                raises: button.data('raises'),
                baseEvade: button.data('base-evade')
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
        if (!flags || flags.attackType !== 'melee') {
            console.warn('Mastery System | DEBUG: Invalid flags or not melee attack', {
                flags,
                attackType: flags?.attackType,
                allFlagsKeys: Object.keys(allFlags || {}),
                masterySystemFlags: allFlags?.['mastery-system']
            });
            return;
        }
        // Disable button during roll
        button.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Rolling...');
        console.log('Mastery System | DEBUG: Starting attack roll...');
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
            // Get current values from button (including raises-adjusted TN)
            const currentTargetEvade = parseInt(button.data('target-evade')) || flags.targetEvade;
            const raises = parseInt(button.data('raises')) || 0;
            // Compute numDice from ACTOR at click time (not from stale flags)
            // This ensures we always use the current attribute value
            const attackerForRoll = message.speaker?.actor ?
                game.actors.get(message.speaker.actor) :
                (game.actors?.get(flags.attackerId));
            const attributeKey = flags.attribute?.toLowerCase();
            const liveAttr = attackerForRoll?.system?.attributes?.[attributeKey]?.value;
            let numDice = Number.isFinite(liveAttr) && liveAttr > 0 ? liveAttr : (flags.attributeValue ?? 2);
            // Apply health penalty (reduces dice pool)
            const { getCurrentPenalty } = await import('../utils/calculations.js');
            const healthBars = attackerForRoll?.system?.health?.bars || [];
            const currentBar = attackerForRoll?.system?.health?.currentBar ?? 0;
            const healthPenalty = getCurrentPenalty(healthBars, currentBar);
            // Health penalty reduces the dice pool (numDice)
            // Penalty is negative (e.g., -1, -2, -4), so we add it to reduce numDice
            numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
            // Get keepDice from flags (or compute from actor/mastery rank if needed)
            const keepDice = flags.masteryRank ?? (attackerForRoll?.system?.mastery?.rank ?? 2);
            console.log('Mastery System | DEBUG: Roll parameters', {
                numDice: numDice,
                keepDice: keepDice,
                skill: 0,
                tn: currentTargetEvade,
                raises,
                baseEvade: flags.targetEvade,
                adjustedEvade: currentTargetEvade,
                attributeFromFlags: flags.attribute,
                attributeValueFromFlags: flags.attributeValue,
                liveAttributeValue: liveAttr,
                usingLiveValue: Number.isFinite(liveAttr) && liveAttr > 0,
                masteryRankFromFlags: flags.masteryRank
            });
            // Warn if values don't match (for debugging)
            if (flags.attributeValue !== numDice && flags.attributeValue > 0) {
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
            const result = await masteryRoll({
                numDice: numDice,
                keepDice: keepDice,
                skill: 0,
                tn: currentTargetEvade,
                label: `Attack Roll (${flags.attribute.charAt(0).toUpperCase() + flags.attribute.slice(1)})`,
                flavor: `Roll ${numDice}d8 keep ${keepDice} vs ${game.actors?.get(flags.targetId)?.name || 'Target'}'s Evade (${currentTargetEvade}${raises > 0 ? `, ${raises} raise${raises > 1 ? 's' : ''}` : ''})`,
                actorId: flags.attackerId
            });
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
                    if (!weaponId) {
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
                    // Get raises from button data (the manually entered raises)
                    // result.raises is the number of successful raises (TN exceeded), not the input raises
                    const inputRaises = parseInt(button.data('raises')) || 0;
                    const totalRaises = inputRaises; // Use the input raises, not result.raises
                    console.log('Mastery System | [BEFORE DAMAGE DIALOG] Raises calculation', {
                        messageId: messageId,
                        resultRaises: result.raises, // Successful raises (TN exceeded)
                        inputRaises: inputRaises, // Manually entered raises
                        totalRaises: totalRaises, // Total raises to use for damage dialog
                        resultRaisesType: typeof result.raises,
                        resultSuccess: result.success,
                        resultTotal: result.total,
                        resultTN: result.tn,
                        currentTargetEvade: currentTargetEvade,
                        baseEvade: flags.targetEvade,
                        raisesFromButton: inputRaises
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
            console.error('Mastery System | DEBUG: Error during roll', error);
            console.error('Mastery System | Error rolling attack:', error);
            ui.notifications?.error('Failed to roll attack');
            button.prop('disabled', false).html('<i class="fas fa-dice-d20"></i> Roll');
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
    const attackerToken = attacker.getActiveTokens?.()?.[0]?.document || null;
    const chatData = {
        speaker: ChatMessage.getSpeaker({ actor: attacker, token: attackerToken }),
        content: `<div class="mastery-system-damage">
      <h3><i class="fas fa-sword"></i> Damage: ${damageResult.totalDamage}</h3>
      <p>${damageText}</p>
      <p><strong>Target:</strong> ${target.name}</p>
    </div>`,
        style: CONST.CHAT_MESSAGE_STYLES.OTHER
    };
    try {
        await ChatMessage.create(chatData);
    }
    catch (error) {
        console.warn('Mastery System | Could not create damage chat message:', error);
    }
}
//# sourceMappingURL=attack-roll-handler.js.map