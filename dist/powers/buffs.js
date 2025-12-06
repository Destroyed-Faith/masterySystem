/**
 * Buff Duration & Limits System for Mastery System
 *
 * Rules:
 * - Active Buffs last 2-6 rounds
 * - Max 1 Buff of same type active at once
 * - Cannot reactivate until expired
 * - Tracked per actor
 */
/**
 * Buff types (categories that cannot stack)
 */
export var BuffType;
(function (BuffType) {
    BuffType["ATTACK"] = "attack";
    BuffType["DEFENSE"] = "defense";
    BuffType["DAMAGE"] = "damage";
    BuffType["MOVEMENT"] = "movement";
    BuffType["ATTRIBUTE"] = "attribute";
    BuffType["RESISTANCE"] = "resistance";
    BuffType["REGENERATION"] = "regeneration";
    BuffType["CUSTOM"] = "custom"; // Unique buffs
})(BuffType || (BuffType = {}));
/**
 * Get all active buffs for an actor
 */
export function getActiveBuffs(actor) {
    return actor.system.activeBuffs || [];
}
/**
 * Check if actor has a buff of a specific type
 */
export function hasBuffType(actor, buffType) {
    const buffs = getActiveBuffs(actor);
    return buffs.some(buff => buff.type === buffType);
}
/**
 * Get buff of a specific type
 */
export function getBuffByType(actor, buffType) {
    const buffs = getActiveBuffs(actor);
    return buffs.find(buff => buff.type === buffType) || null;
}
/**
 * Apply a buff to an actor
 * Validates that no buff of same type is active
 */
export async function applyBuff(actor, buffData) {
    // Check if buff of this type already exists
    if (hasBuffType(actor, buffData.type)) {
        const existingBuff = getBuffByType(actor, buffData.type);
        ui.notifications?.error(`Cannot apply ${buffData.name}: ${existingBuff?.name} is already active!`);
        return false;
    }
    // Get current combat round
    const combat = game.combat;
    const currentRound = combat?.round || 0;
    // Create the buff
    const buff = {
        id: `buff-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...buffData,
        duration: buffData.maxDuration,
        appliedRound: currentRound
    };
    // Add to actor's active buffs
    const currentBuffs = getActiveBuffs(actor);
    const newBuffs = [...currentBuffs, buff];
    await actor.update({
        'system.activeBuffs': newBuffs
    });
    // Post chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-buff-applied">
        <h3>${actor.name} gains ${buff.name}!</h3>
        <p><strong>Type:</strong> ${buff.type}</p>
        <p><strong>Duration:</strong> ${buff.maxDuration} rounds</p>
        <p>${buff.effect}</p>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info(`${buff.name} applied for ${buff.maxDuration} rounds!`);
    console.log(`Mastery System | Applied buff ${buff.name} to ${actor.name}`);
    // Recalculate stats
    actor.prepareData();
    return true;
}
/**
 * Remove a buff from an actor
 */
export async function removeBuff(actor, buffId) {
    const currentBuffs = getActiveBuffs(actor);
    const buff = currentBuffs.find(b => b.id === buffId);
    if (!buff) {
        console.warn(`Mastery System | Buff ${buffId} not found on ${actor.name}`);
        return;
    }
    const newBuffs = currentBuffs.filter(b => b.id !== buffId);
    await actor.update({
        'system.activeBuffs': newBuffs
    });
    // Post chat message
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content: `
      <div class="mastery-buff-expired">
        <h3>${buff.name} expired on ${actor.name}</h3>
      </div>
    `,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    ui.notifications?.info(`${buff.name} expired!`);
    console.log(`Mastery System | Removed buff ${buff.name} from ${actor.name}`);
    // Recalculate stats
    actor.prepareData();
}
/**
 * Update buff durations at start of round
 * Called by combat hooks
 */
export async function updateBuffDurations(actor) {
    const buffs = getActiveBuffs(actor);
    const updatedBuffs = [];
    const expiredBuffs = [];
    for (const buff of buffs) {
        const newDuration = buff.duration - 1;
        if (newDuration <= 0) {
            // Buff expired
            expiredBuffs.push(buff);
        }
        else {
            // Update duration
            updatedBuffs.push({
                ...buff,
                duration: newDuration
            });
        }
    }
    // Update actor
    await actor.update({
        'system.activeBuffs': updatedBuffs
    });
    // Notify about expired buffs
    for (const buff of expiredBuffs) {
        await ChatMessage.create({
            user: game.user?.id,
            speaker: ChatMessage.getSpeaker({ actor }),
            content: `
        <div class="mastery-buff-expired">
          <h3>${buff.name} expired on ${actor.name}</h3>
        </div>
      `,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }
    if (expiredBuffs.length > 0) {
        console.log(`Mastery System | ${expiredBuffs.length} buff(s) expired on ${actor.name}`);
        // Recalculate stats
        actor.prepareData();
    }
}
/**
 * Get all buff effects for stat calculations
 * Similar to passive effects but from active buffs
 */
export function getActiveBuffEffects(actor) {
    const buffs = getActiveBuffs(actor);
    const effects = [];
    for (const buff of buffs) {
        effects.push(...buff.effects);
    }
    return effects;
}
/**
 * Apply buff effects to a stat calculation
 */
export function applyBuffEffects(actor, target, baseValue) {
    const effects = getActiveBuffEffects(actor);
    let value = baseValue;
    for (const effect of effects) {
        if (effect.target === target && effect.type === 'flat') {
            value += Number(effect.value);
        }
    }
    return value;
}
/**
 * Get buff dice bonuses for rolls
 */
export function getBuffDiceBonus(actor, rollType) {
    const effects = getActiveBuffEffects(actor);
    let bonus = 0;
    for (const effect of effects) {
        if (effect.target === rollType && effect.type === 'dice') {
            bonus += Number(effect.value);
        }
    }
    return bonus;
}
/**
 * Check if actor has a specific buff flag
 */
export function hasBuffFlag(actor, flagName) {
    const effects = getActiveBuffEffects(actor);
    return effects.some(effect => effect.type === 'flag' &&
        effect.target === flagName &&
        effect.value);
}
/**
 * Clear all buffs from an actor (e.g., at end of combat)
 */
export async function clearAllBuffs(actor) {
    await actor.update({
        'system.activeBuffs': []
    });
    console.log(`Mastery System | Cleared all buffs from ${actor.name}`);
}
//# sourceMappingURL=buffs.js.map