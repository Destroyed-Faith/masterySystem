/**
 * Death & Dying System for Mastery System
 *
 * Rules from rulebook (Lines 5153-5167):
 *
 * When Incapacitated:
 * - Make a Death Save at the start of each turn
 * - Roll: Vitality k Mastery Rank vs TN 20
 * - Success: Mark a success
 * - Failure: Mark a Death Mark
 * - 3 successes: Stabilized (no more saves needed)
 * - 3 Death Marks: Character dies
 * - Taking damage while incapacitated: 1 automatic Death Mark
 * - Critical hit while incapacitated: 2 Death Marks
 * - Healing: Removes 1 Death Mark per 3 points healed
 */
/**
 * Get current death save data for actor
 */
export function getDeathSaveData(actor) {
    const system = actor.system;
    if (!system.deathSave) {
        return {
            successes: 0,
            deathMarks: 0,
            stabilized: false,
            dead: false
        };
    }
    return { ...system.deathSave };
}
/**
 * Check if actor is incapacitated (last health level has damage)
 */
export function isIncapacitated(actor) {
    const healthLevels = actor.system.health?.levels || [];
    if (healthLevels.length === 0)
        return false;
    const lastLevel = healthLevels[healthLevels.length - 1];
    return lastLevel.damageBoxes > 0;
}
/**
 * Initialize death save tracking when incapacitated
 */
export async function initializeDeathSaves(actor) {
    if (!isIncapacitated(actor))
        return;
    const currentData = getDeathSaveData(actor);
    // Don't reset if already stabilized or dead
    if (currentData.stabilized || currentData.dead)
        return;
    await actor.update({
        'system.deathSave': {
            successes: 0,
            deathMarks: 0,
            stabilized: false,
            dead: false
        }
    });
    console.log(`Mastery System | ${actor.name} is incapacitated - death saves initialized`);
}
/**
 * Perform a Death Save roll
 *
 * @param actor - The incapacitated actor
 * @returns The roll result
 */
export async function performDeathSave(actor) {
    if (!isIncapacitated(actor)) {
        ui.notifications?.error(`${actor.name} is not incapacitated!`);
        return { success: false, total: 0 };
    }
    const deathSaveData = getDeathSaveData(actor);
    // Already stabilized or dead
    if (deathSaveData.stabilized) {
        ui.notifications?.info(`${actor.name} is already stabilized`);
        return { success: true, total: 0 };
    }
    if (deathSaveData.dead) {
        ui.notifications?.error(`${actor.name} is already dead`);
        return { success: false, total: 0 };
    }
    // Build Death Save roll: Vitality k Mastery Rank vs TN 20
    const vitality = actor.system.attributes?.vitality?.value || 1;
    const masteryRank = actor.system.mastery?.rank || 2;
    const tn = 20;
    // Create roll formula: Xd8k keep K
    const dicePool = vitality;
    const keep = masteryRank;
    // Roll the dice (manual implementation since we don't want rollKeep here)
    const rolls = [];
    for (let i = 0; i < dicePool; i++) {
        let die = Math.floor(Math.random() * 8) + 1;
        let total = die;
        // Exploding 8s
        while (die === 8) {
            die = Math.floor(Math.random() * 8) + 1;
            total += die;
        }
        rolls.push(total);
    }
    // Keep highest K
    rolls.sort((a, b) => b - a);
    const kept = rolls.slice(0, keep);
    const dropped = rolls.slice(keep);
    const total = kept.reduce((sum, val) => sum + val, 0);
    const success = total >= tn;
    // Update death save data
    const newData = { ...deathSaveData };
    if (success) {
        newData.successes++;
        if (newData.successes >= 3) {
            newData.stabilized = true;
        }
    }
    else {
        newData.deathMarks++;
        if (newData.deathMarks >= 3) {
            newData.dead = true;
        }
    }
    await actor.update({
        'system.deathSave': newData
    });
    // Create chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-death-save">
        <h3>Death Save</h3>
        <div class="roll-details">
          <p><strong>${actor.name}</strong> rolls ${dicePool}d8 keep ${keep}</p>
          <p><strong>Kept:</strong> ${kept.join(', ')} = <strong>${total}</strong></p>
          ${dropped.length > 0 ? `<p><em>Dropped: ${dropped.join(', ')}</em></p>` : ''}
          <p><strong>TN:</strong> ${tn}</p>
          <p><strong>Result:</strong> ${success ? '<span style="color: green;">SUCCESS</span>' : '<span style="color: red;">FAILURE</span>'}</p>
        </div>
        <div class="death-save-tracker">
          <p><strong>Successes:</strong> ${newData.successes} / 3</p>
          <p><strong>Death Marks:</strong> ${newData.deathMarks} / 3</p>
          ${newData.stabilized ? '<p style="color: green; font-weight: bold;">✓ STABILIZED</p>' : ''}
          ${newData.dead ? '<p style="color: red; font-weight: bold;">✝ DEAD</p>' : ''}
        </div>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL
    });
    // Notifications
    if (newData.stabilized) {
        ui.notifications?.info(`${actor.name} has stabilized!`);
    }
    else if (newData.dead) {
        ui.notifications?.error(`${actor.name} has DIED!`);
    }
    else if (success) {
        ui.notifications?.info(`${actor.name} succeeded on Death Save (${newData.successes}/3)`);
    }
    else {
        ui.notifications?.warn(`${actor.name} failed Death Save - Death Mark ${newData.deathMarks}/3`);
    }
    console.log(`Mastery System | ${actor.name} Death Save: ${success ? 'SUCCESS' : 'FAIL'} (${total} vs TN ${tn})`);
    return { success, total };
}
/**
 * Add a Death Mark when taking damage while incapacitated
 *
 * @param actor - The incapacitated actor
 * @param isCritical - Whether this was a critical hit (2 marks)
 */
export async function addDeathMark(actor, isCritical = false) {
    if (!isIncapacitated(actor)) {
        return;
    }
    const deathSaveData = getDeathSaveData(actor);
    if (deathSaveData.stabilized) {
        // Becoming unstabilized
        await actor.update({
            'system.deathSave.stabilized': false
        });
        ui.notifications?.warn(`${actor.name} is no longer stabilized!`);
    }
    const marksToAdd = isCritical ? 2 : 1;
    const newMarks = Math.min(3, deathSaveData.deathMarks + marksToAdd);
    const dead = newMarks >= 3;
    await actor.update({
        'system.deathSave.deathMarks': newMarks,
        'system.deathSave.dead': dead
    });
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-death-mark">
        <h3>Death Mark!</h3>
        <p><strong>${actor.name}</strong> takes damage while incapacitated!</p>
        <p><strong>${isCritical ? 'CRITICAL HIT' : 'Damage'}</strong>: +${marksToAdd} Death Mark${marksToAdd > 1 ? 's' : ''}</p>
        <p><strong>Total Death Marks:</strong> ${newMarks} / 3</p>
        ${dead ? '<p style="color: red; font-weight: bold;">✝ CHARACTER HAS DIED</p>' : ''}
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    if (dead) {
        ui.notifications?.error(`${actor.name} has DIED from accumulated Death Marks!`);
    }
    else {
        ui.notifications?.warn(`${actor.name} gains ${marksToAdd} Death Mark${marksToAdd > 1 ? 's' : ''} (${newMarks}/3)`);
    }
    console.log(`Mastery System | ${actor.name} gained ${marksToAdd} Death Mark(s) - total: ${newMarks}`);
}
/**
 * Remove Death Marks through healing
 * 1 Death Mark removed per 3 points healed
 */
export async function removeDeathMarksFromHealing(actor, healingAmount) {
    const deathSaveData = getDeathSaveData(actor);
    if (deathSaveData.deathMarks === 0)
        return;
    const marksToRemove = Math.floor(healingAmount / 3);
    if (marksToRemove > 0) {
        const newMarks = Math.max(0, deathSaveData.deathMarks - marksToRemove);
        await actor.update({
            'system.deathSave.deathMarks': newMarks
        });
        ui.notifications?.info(`${actor.name}'s healing removed ${marksToRemove} Death Mark${marksToRemove > 1 ? 's' : ''}!`);
        console.log(`Mastery System | ${actor.name} healing removed ${marksToRemove} Death Marks (${newMarks} remaining)`);
    }
}
/**
 * Reset death saves (when healed above incapacitated)
 */
export async function resetDeathSaves(actor) {
    await actor.update({
        'system.deathSave': {
            successes: 0,
            deathMarks: 0,
            stabilized: false,
            dead: false
        }
    });
    console.log(`Mastery System | ${actor.name} death saves reset (healed above incapacitation)`);
}
//# sourceMappingURL=death.js.map