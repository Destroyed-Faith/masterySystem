/**
 * Charged Powers & Mastery Charges System
 * 
 * Rules:
 * - Mastery Charges = Mastery Rank per day
 * - Refresh at dawn or after long rest
 * - Powers with (Charged) tag consume 1 Charge
 * - Max 1 Charged Power per round
 * - Can burn 1 Stone out of combat → +2 temporary Charges (until dawn)
 */

/**
 * Get current charges for an actor
 */
export function getCharges(actor: any): { current: number; maximum: number; temporary: number } {
  const masteryRank = actor.system.mastery?.rank || 2;
  const charges = actor.system.mastery?.charges || {
    current: masteryRank,
    maximum: masteryRank,
    temporary: 0
  };
  
  return {
    current: charges.current || masteryRank,
    maximum: charges.maximum || masteryRank,
    temporary: charges.temporary || 0
  };
}

/**
 * Spend a Mastery Charge
 * 
 * @param actor - The actor spending the charge
 * @param powerName - Name of the power being activated
 * @returns True if charge was spent successfully
 */
export async function spendCharge(
  actor: any,
  powerName: string = 'a Charged Power'
): Promise<boolean> {
  
  const charges = getCharges(actor);
  const totalCharges = charges.current + charges.temporary;
  
  if (totalCharges <= 0) {
    ui.notifications?.error('No Mastery Charges remaining!');
    return false;
  }
  
  // Spend temporary charges first
  let newCurrent = charges.current;
  let newTemporary = charges.temporary;
  
  if (newTemporary > 0) {
    newTemporary--;
  } else {
    newCurrent--;
  }
  
  await actor.update({
    'system.mastery.charges': {
      current: newCurrent,
      maximum: charges.maximum,
      temporary: newTemporary
    }
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-charge-spent">
        <h3>${actor.name} activates ${powerName}!</h3>
        <p><strong>Mastery Charge spent:</strong> ${totalCharges - 1} / ${charges.maximum} remaining</p>
        ${newTemporary > 0 ? `<p><em>(${newTemporary} temporary charges remaining)</em></p>` : ''}
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  ui.notifications?.info(`Charge spent: ${totalCharges - 1} / ${charges.maximum} remaining`);
  console.log(`Mastery System | ${actor.name} spent charge for ${powerName}`);
  
  return true;
}

/**
 * Restore all Mastery Charges (long rest or dawn)
 */
export async function restoreCharges(actor: any): Promise<void> {
  const masteryRank = actor.system.mastery?.rank || 2;
  
  await actor.update({
    'system.mastery.charges': {
      current: masteryRank,
      maximum: masteryRank,
      temporary: 0 // Temporary charges are lost
    }
  });
  
  ui.notifications?.info(`${actor.name}'s Mastery Charges restored to ${masteryRank}`);
  console.log(`Mastery System | ${actor.name} restored ${masteryRank} charges`);
}

/**
 * Burn a Stone to gain +2 temporary Charges (out of combat only)
 * The Stone is lost until dawn
 * 
 * @param actor - The actor burning a stone
 * @returns True if successful
 */
export async function burnStoneForCharges(actor: any): Promise<boolean> {
  const stones = actor.system.resources?.stones;
  
  if (!stones || stones.current <= 0) {
    ui.notifications?.error('No Stones available to burn!');
    return false;
  }
  
  const charges = getCharges(actor);
  
  // Reduce stones by 1
  await actor.update({
    'system.resources.stones.current': stones.current - 1,
    'system.mastery.charges': {
      current: charges.current,
      maximum: charges.maximum,
      temporary: charges.temporary + 2
    }
  });
  
  // Post chat message
  await ChatMessage.create({
    user: (game as any).user?.id,
    speaker: ChatMessage.getSpeaker({ actor }),
    content: `
      <div class="mastery-stone-burned">
        <h3>${actor.name} burns a Stone for power!</h3>
        <p><strong>+2 temporary Mastery Charges</strong> (until dawn)</p>
        <p>Stone will be restored at dawn.</p>
        <p><em>Stones: ${stones.current - 1} / ${stones.maximum}</em></p>
        <p><em>Charges: ${charges.current + charges.temporary + 2}</em></p>
      </div>
    `,
    type: CONST.CHAT_MESSAGE_TYPES.OTHER
  });
  
  ui.notifications?.info('Stone burned: +2 temporary charges!');
  console.log(`Mastery System | ${actor.name} burned stone for +2 charges`);
  
  return true;
}

/**
 * Check if actor can use a Charged Power this round
 * Tracks if they've already used one this round
 */
export function canUseChargedPowerThisRound(actor: any): boolean {
  const usedThisRound = actor.getFlag('mastery-system', 'chargedPowerUsedThisRound') || false;
  return !usedThisRound;
}

/**
 * Mark that a Charged Power was used this round
 */
export async function markChargedPowerUsed(actor: any): Promise<void> {
  await actor.setFlag('mastery-system', 'chargedPowerUsedThisRound', true);
}

/**
 * Reset Charged Power usage at start of new round
 */
export async function resetChargedPowerFlag(actor: any): Promise<void> {
  await actor.unsetFlag('mastery-system', 'chargedPowerUsedThisRound');
}

/**
 * Activate a Charged Power
 * Validates charges available and round limit
 * 
 * @param actor - The actor activating the power
 * @param power - The power item
 * @returns True if successfully activated
 */
export async function activateChargedPower(
  actor: any,
  power: any
): Promise<boolean> {
  
  // Check if already used one this round
  if (!canUseChargedPowerThisRound(actor)) {
    ui.notifications?.error('You can only activate 1 Charged Power per round!');
    return false;
  }
  
  // Spend the charge
  const success = await spendCharge(actor, power.name);
  
  if (success) {
    // Mark as used this round
    await markChargedPowerUsed(actor);
  }
  
  return success;
}

/**
 * Check if a power is Charged
 */
export function isChargedPower(power: any): boolean {
  return power.system.charged === true || 
         (power.system.tags && power.system.tags.includes('charged'));
}

/**
 * Get total available charges (current + temporary)
 */
export function getTotalCharges(actor: any): number {
  const charges = getCharges(actor);
  return charges.current + charges.temporary;
}

