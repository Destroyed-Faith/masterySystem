/**
 * Spell Tag System for Mastery System
 * 
 * Rules:
 * - Powers with (Spell) tag interact with the Veil
 * - Can be dispelled, suppressed, or countered
 * - Only powers with Spell tag are affected by anti-magic
 */

/**
 * Check if a power/item has the Spell tag
 */
export function isSpell(item: any): boolean {
  // Check explicit spell tag
  if (item.system.tags && Array.isArray(item.system.tags)) {
    return item.system.tags.includes('spell') || item.system.tags.includes('Spell');
  }
  
  // Check spell flag
  if (item.system.isSpell === true) {
    return true;
  }
  
  // Some power types are always spells (configurable)
  const spellPowerTypes = ['arcane', 'divine', 'primal', 'occult'];
  if (item.system.powerSchool && spellPowerTypes.includes(item.system.powerSchool)) {
    return true;
  }
  
  return false;
}

/**
 * Get all active spells on an actor
 */
export function getActiveSpells(actor: any): any[] {
  const spells: any[] = [];
  
  // Check active buffs that are spells
  const buffs = actor.system.activeBuffs || [];
  for (const buff of buffs) {
    if (buff.sourceItem) {
      const item = actor.items.get(buff.sourceItem);
      if (item && isSpell(item)) {
        spells.push({
          type: 'buff',
          name: buff.name,
          item,
          buff
        });
      }
    }
  }
  
  // Check conditions that are spells
  const conditions = actor.items.filter((i: any) => i.type === 'condition');
  for (const condition of conditions) {
    if (condition.system.sourceItem) {
      const item = actor.items.get(condition.system.sourceItem);
      if (item && isSpell(item)) {
        spells.push({
          type: 'condition',
          name: condition.name,
          item,
          condition
        });
      }
    }
  }
  
  return spells;
}

/**
 * Attempt to dispel a spell
 * 
 * @param caster - Actor attempting to dispel
 * @param target - Actor with spell effect
 * @param spellLevel - Level of spell to dispel (optional, targets highest if not specified)
 * @returns True if successful
 */
export async function dispelSpell(
  caster: any,
  target: any,
  spellLevel?: number
): Promise<boolean> {
  
  const activeSpells = getActiveSpells(target);
  
  if (activeSpells.length === 0) {
    ui.notifications?.warn(`${target.name} has no active spells to dispel!`);
    return false;
  }
  
  // Select spell to dispel (highest level if not specified)
  let spellToDispel = activeSpells[0];
  if (spellLevel !== undefined) {
    spellToDispel = activeSpells.find(s => s.item.system.level === spellLevel) || activeSpells[0];
  } else {
    // Target highest level
    for (const spell of activeSpells) {
      if ((spell.item.system.level || 1) > (spellToDispel.item.system.level || 1)) {
        spellToDispel = spell;
      }
    }
  }
  
  // Dispel check: Roll Intellect vs (Spell Level × 4 + 8)
  // TN = 8 + (Spell Level × 4)
  // Level 1 = TN 12, Level 2 = TN 16, Level 3 = TN 20, etc.
  const spellLvl = spellToDispel.item.system.level || 1;
  const tn = 8 + (spellLvl * 4);
  
  // Perform check
  const { performQuickCheck } = await import('../rolls/checks.js');
  const result = await performQuickCheck(
    caster,
    'intellect',
    tn,
    `Dispel ${spellToDispel.name}`
  );
  
  if (result.success) {
    // Remove the spell effect
    if (spellToDispel.type === 'buff') {
      const { removeBuff } = await import('../powers/buffs.js');
      await removeBuff(target, spellToDispel.buff.id);
    } else if (spellToDispel.type === 'condition') {
      await spellToDispel.condition.delete();
    }
    
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: caster }),
      content: `
        <div class="mastery-dispel-success">
          <h3>${caster.name} dispels ${spellToDispel.name}!</h3>
          <p><strong>Target:</strong> ${target.name}</p>
          <p><strong>Spell Level:</strong> ${spellLvl}</p>
          <p>${spellToDispel.name} has been dispelled.</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    
    ui.notifications?.info(`${spellToDispel.name} dispelled!`);
    return true;
  } else {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: caster }),
      content: `
        <div class="mastery-dispel-fail">
          <h3>${caster.name} fails to dispel ${spellToDispel.name}</h3>
          <p>The spell resists dispelling.</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    
    ui.notifications?.warn(`Failed to dispel ${spellToDispel.name}!`);
    return false;
  }
}

/**
 * Suppress all spells on a target for X rounds
 * 
 * @param target - Actor to suppress spells on
 * @param duration - Rounds to suppress
 * @param source - Actor applying suppression
 */
export async function suppressSpells(
  target: any,
  duration: number,
  source?: any
): Promise<void> {
  
  // Apply Anti-Magic condition
  const { applyCondition } = await import('../effects/conditions.js');
  
  await applyCondition(target, {
    name: 'Anti-Magic Field',
    value: duration,
    diminishing: false,
    duration: {
      type: 'rounds',
      remaining: duration
    },
    save: {
      type: 'mind',
      tn: 0,
      frequency: 'none'
    },
    effect: `All spell effects suppressed for ${duration} rounds. Cannot cast spells.`,
    source: source?.name
  });
  
  ui.notifications?.warn(`${target.name} is under Anti-Magic Field!`);
}

/**
 * Counterspell - attempt to counter a spell as it's being cast
 * 
 * @param caster - Actor casting the spell
 * @param counterer - Actor attempting to counter
 * @param spellLevel - Level of spell being cast
 * @returns True if successfully countered
 */
export async function counterspell(
  caster: any,
  counterer: any,
  spellLevel: number
): Promise<boolean> {
  
  // Check if counterer has Reaction available
  const { hasReactionAvailable } = await import('../powers/reactions.js');
  if (!hasReactionAvailable(counterer)) {
    ui.notifications?.error(`${counterer.name} has no Reaction available!`);
    return false;
  }
  
  // Counterspell check: Roll Intellect vs (Spell Level × 4 + 12)
  const tn = 12 + (spellLevel * 4);
  
  const { performQuickCheck } = await import('../rolls/checks.js');
  const result = await performQuickCheck(
    counterer,
    'intellect',
    tn,
    `Counterspell (Level ${spellLevel})`
  );
  
  if (result.success) {
    // Consume Reaction
    const { useAction } = await import('../combat/actions.js');
    await useAction(counterer, 'reaction', 1);
    
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: counterer }),
      content: `
        <div class="mastery-counterspell-success">
          <h3>${counterer.name} counterspells ${caster.name}!</h3>
          <p>The spell is negated before it takes effect.</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    
    ui.notifications?.info('Counterspell successful!');
    return true;
  } else {
    await ChatMessage.create({
      user: (game as any).user?.id,
      speaker: ChatMessage.getSpeaker({ actor: counterer }),
      content: `
        <div class="mastery-counterspell-fail">
          <h3>${counterer.name} fails to counterspell</h3>
          <p>The spell takes effect.</p>
        </div>
      `,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
    
    ui.notifications?.warn('Counterspell failed!');
    return false;
  }
}

/**
 * Check if target is immune to spells (Anti-Magic Field)
 */
export function hasSpellImmunity(actor: any): boolean {
  const { hasCondition } = require('../effects/conditions');
  return hasCondition(actor, 'Anti-Magic Field');
}

/**
 * Get spell school/type for categorization
 */
export function getSpellSchool(item: any): string {
  return item.system.powerSchool || item.system.spellSchool || 'arcane';
}

