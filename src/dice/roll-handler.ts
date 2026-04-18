/**
 * Dice rolling handler for Mastery System
 * Implements Roll & Keep with exploding 8s
 */

import { MasteryRollResult } from '../types';
import { EXPLODE_VALUE, RAISE_INCREMENT } from '../utils/constants';

/** Roll-kind hint used by the Power Mechanics Engine to look up dice-pool deltas. */
export type MasteryRollKind =
  | 'attack'
  | 'skill'
  | 'damage'
  | 'saveBody'
  | 'saveMind'
  | 'saveSpirit'
  | 'generic';

export interface RollOptions {
  numDice: number;          // Number of dice to roll (Attribute value)
  keepDice: number;         // Number of dice to keep (Mastery Rank)
  skill: number;            // Skill bonus (flat addition) - DEPRECATED: now handled via skill spending
  tn?: number;              // Target Number (optional)
  label?: string;           // Label for the roll
  flavor?: string;          // Flavor text
  actorId?: string;         // Actor making the roll
  skillKey?: string;        // Skill key for skill rolls (enables post-roll spending)
  isSkillRoll?: boolean;    // Flag indicating this is a skill roll
  isSaveRoll?: boolean;     // Flag indicating this is a saving throw roll
  baseModifier?: number;    // Base modifier (situational, not skill-based)
  /**
   * Roll kind used by the Power Mechanics Engine to consult the actor's
   * aggregated dice-pool deltas (attack / skill / damage / saveBody / ...).
   * When omitted no engine-driven adjustment is applied.
   */
  rollKind?: MasteryRollKind;
  /**
   * Optional target actor id. When supplied together with `rollKind`, the
   * Power Mechanics Engine also evaluates passives / buffs whose `condition`
   * gate is target-facing (e.g. "+1 attack die vs Hexed").
   */
  targetActorId?: string;
}

/** Stored on chat messages so a Faith Fracture reroll can repeat the same roll setup. */
export interface MasteryRollRecipe {
  numDice: number;
  keepDice: number;
  skill: number;
  tn: number;
  label: string;
  flavor: string;
  actorId: string | null;
  skillKey: string | null;
  isSkillRoll: boolean;
  isSaveRoll: boolean;
  baseModifier: number;
}

/**
 * Roll one pool die: exploding d8s while running total is divisible by 8 (Mastery rules).
 * Returns each face for Foundry display (exploded flags) and the pool die total.
 */
function rollExplodingDieChain(): { faces: number[]; total: number; exploded: boolean } {
  const faces: number[] = [];
  let exploded = false;
  while (true) {
    faces.push(Math.floor(Math.random() * 8) + 1);
    const sum = faces.reduce((a, b) => a + b, 0);
    if (sum % EXPLODE_VALUE !== 0) break;
    exploded = true;
  }
  const total = faces.reduce((a, b) => a + b, 0);
  return { faces, total, exploded };
}

/**
 * Roll multiple exploding d8s (pool dice).
 */
function rollDice(numDice: number): { dice: number[]; exploded: number[]; dieChains: number[][] } {
  const dice: number[] = [];
  const exploded: number[] = [];
  const dieChains: number[][] = [];

  for (let i = 0; i < numDice; i++) {
    const chain = rollExplodingDieChain();
    dieChains.push(chain.faces);
    dice.push(chain.total);
    if (chain.exploded) exploded.push(i);
  }

  return { dice, exploded, dieChains };
}

/**
 * Select the highest K dice from an array
 * Returns indices of kept dice
 */
function selectHighestDice(dice: number[], keepDice: number): number[] {
  // Create array of [value, originalIndex] pairs
  const indexed = dice.map((value, index) => ({ value, index }));
  
  // Sort by value descending
  indexed.sort((a, b) => b.value - a.value);
  
  // Take the top K dice
  const kept = indexed.slice(0, keepDice);
  
  // Return the original indices, sorted
  return kept.map(d => d.index).sort((a, b) => a - b);
}

/**
 * Calculate total from kept dice
 */
function calculateTotal(dice: number[], keptIndices: number[]): number {
  return keptIndices.reduce((sum, index) => sum + dice[index], 0);
}

/**
 * Calculate number of raises achieved
 * Each +4 above TN = 1 Raise
 */
function calculateRaises(total: number, tn: number): number {
  if (total < tn) return 0;
  return Math.floor((total - tn) / RAISE_INCREMENT);
}

/**
 * Perform a Mastery System roll
 * Roll N d8, keep K highest, add skill bonus
 * Dice explode on 8
 */
export async function masteryRoll(options: RollOptions): Promise<MasteryRollResult> {
  const { keepDice, skill = 0, tn = 0, label = 'Roll' } = options;
  let { numDice, flavor = '' } = options;

  // Power Mechanics Engine — consult the actor's aggregated dice-pool deltas
  // for this roll kind and adjust the pool before rolling. The delta is
  // additive on top of any caller-supplied numDice (which typically already
  // reflects attribute + health penalty).
  const kind: MasteryRollKind | undefined = options.rollKind;
  if (kind && kind !== 'generic' && options.actorId) {
    try {
      const actor: any = (game as any)?.actors?.get?.(options.actorId);
      if (actor) {
        const { getRollDiceDelta } = await import('../utils/power-mechanics.js');
        const targetActor: any = options.targetActorId
          ? ((game as any)?.actors?.get?.(options.targetActorId) ?? null)
          : null;
        const delta = getRollDiceDelta(actor, kind, targetActor);
        if (delta !== 0) {
          const adjusted = Math.max(1, numDice + delta);
          const sign = delta > 0 ? '+' : '';
          const ctx = targetActor ? ' vs target' : '';
          const note = `Power Mechanics: ${sign}${delta} dice (${kind}${ctx})`;
          flavor = flavor ? `${flavor} | ${note}` : note;
          numDice = adjusted;
        }
      }
    } catch (err) {
      // Best-effort only — never fail a roll because of aggregator issues.
      console.warn('Mastery System | power-mechanics delta lookup failed', err);
    }
  }

  console.log('Mastery System | DEBUG: masteryRoll called', {
    numDice,
    keepDice,
    skill,
    tn,
    label,
    flavor
  });
  
  // Roll the dice
  const { dice, exploded, dieChains } = rollDice(numDice);
  console.log('Mastery System | DEBUG: Dice rolled', {
    numDice,
    dice,
    exploded,
    diceCount: dice.length
  });
  
  // Select highest dice to keep
  const keptIndices = selectHighestDice(dice, keepDice);
  const keptValues = keptIndices.map(i => dice[i]);
  console.log('Mastery System | DEBUG: Dice selection', {
    keptIndices,
    keptValues,
    allDice: dice
  });
  
  // Calculate total from kept dice
  const diceTotal = calculateTotal(dice, keptIndices);
  console.log('Mastery System | DEBUG: Dice total calculated', {
    diceTotal,
    skill,
    totalBeforeSkill: diceTotal
  });
  
  // Add skill bonus (deprecated: now handled via skill spending, but kept for compatibility)
  const total = diceTotal + skill;
  
  // Calculate success and raises
  const success = tn > 0 ? total >= tn : true;
  const raises = tn > 0 ? calculateRaises(total, tn) : 0;
  
  console.log('Mastery System | DEBUG: Roll result calculated', {
    total,
    tn,
    success,
    raises,
    diceTotal,
    skill
  });
  
  // Create result object
  const result: MasteryRollResult & { keptIndices?: number[]; label?: string; flavor?: string } = {
    total,
    dice,
    kept: keptValues,
    keptIndices: keptIndices,  // Store indices for proper dice display
    skill,
    tn,
    raises,
    success,
    exploded,
    dieChains,
    label,
    flavor
  };
  
  console.log('Mastery System | DEBUG: Sending roll to chat', {
    result,
    label,
    flavor
  });

  const rollRecipe: MasteryRollRecipe = {
    numDice,
    keepDice,
    skill,
    tn,
    label,
    flavor,
    actorId: options.actorId ?? null,
    skillKey: options.skillKey ?? null,
    isSkillRoll: !!options.isSkillRoll,
    isSaveRoll: !!options.isSaveRoll,
    baseModifier: options.baseModifier ?? 0
  };

  // Send to chat
  await sendRollToChat(
    result,
    label,
    flavor,
    options.actorId,
    options.skillKey,
    options.isSkillRoll,
    options.baseModifier,
    options.isSaveRoll,
    rollRecipe
  );
  
  console.log('Mastery System | DEBUG: Roll complete, returning result', result);
  
  return result;
}

/**
 * Build a Foundry Roll matching the already-evaluated mastery result (no second RNG).
 * One `1d8`-equivalent Die per pool die so explosion faces appear as separate results (core + Dice So Nice).
 */
function buildMasteryDisplayRoll(
  result: MasteryRollResult & { keptIndices?: number[] },
  skillBonus: number
): Roll {
  const Die = foundry.dice.terms.Die;
  const OperatorTerm = foundry.dice.terms.OperatorTerm;
  const NumericTerm = foundry.dice.terms.NumericTerm;
  const keptIdx = new Set(result.keptIndices ?? []);
  const chains = result.dieChains;
  const n = result.dice.length;
  const terms: InstanceType<typeof foundry.dice.terms.RollTerm>[] = [];

  for (let i = 0; i < n; i++) {
    if (i > 0) terms.push(new OperatorTerm({ operator: '+' }));
    const faces = chains?.[i]?.length ? chains[i]! : [result.dice[i]!];
    const dieResults = faces.map((face, j) => {
      const isLast = j === faces.length - 1;
      const r: Record<string, unknown> = {
        result: face,
        active: true,
        discarded: false,
        exploded: !isLast,
        rerolled: false
      };
      if (keptIdx.has(i)) (r as { kept?: boolean }).kept = true;
      return r;
    });
    const die = new Die({ faces: 8, number: 1, results: dieResults as any });
    (die as unknown as { _evaluated: boolean })._evaluated = true;
    terms.push(die);
  }

  if (skillBonus !== 0) {
    terms.push(new OperatorTerm({ operator: '+' }));
    const num = new NumericTerm({ number: skillBonus });
    (num as unknown as { _evaluated: boolean })._evaluated = true;
    terms.push(num);
  }

  const RollCls = (globalThis as unknown as { Roll: typeof Roll }).Roll;
  const roll = RollCls.fromTerms(terms);
  (roll as unknown as { _evaluated: boolean; _total: number })._evaluated = true;
  (roll as unknown as { _total: number })._total = result.total;
  return roll;
}

/**
 * Send roll result to chat
 */
async function sendRollToChat(
  result: MasteryRollResult,
  label: string,
  flavor: string,
  actorId?: string,
  skillKey?: string,
  isSkillRoll?: boolean,
  baseModifier?: number,
  isSaveRoll?: boolean,
  rollRecipe?: MasteryRollRecipe
): Promise<void> {
  try {
    // Get actor if available
    let actor = null;
    if (actorId && (game as any).actors) {
      actor = (game as any).actors.get(actorId);
    }
    
    // For save rolls, calculate Vitality spending options
    let saveVitalityPool = 0;
    let saveVitalityUsesRemaining = 0;
    let vitalitySpendOptions: Array<{amount: number, newTotal: number, success: boolean, raises: number, label: string}> = [];
    if (isSaveRoll && actor) {
      const actorData = (actor as any).system;
      const vitality = actorData.attributes?.vitality?.value || 0;
      const vitalitySpent = actorData.saves?.vitalitySpent || 0;
      saveVitalityPool = Math.max(0, vitality - vitalitySpent);
      saveVitalityUsesRemaining = actorData.saves?.vitalityUsesRemaining ?? 4;
      const MR = actorData.mastery?.rank || 2;
      const diceTotal = result.kept.reduce((sum: number, d: number) => sum + d, 0) + (baseModifier || 0);

      if (saveVitalityUsesRemaining > 0 && saveVitalityPool > 0) {
        const added = new Set<number>();
        for (let amount = MR; amount <= saveVitalityPool; amount += MR) {
          const newTotal = diceTotal + amount;
          const success = result.tn > 0 ? newTotal >= result.tn : true;
          const raises = result.tn > 0 && success ? Math.floor((newTotal - result.tn) / RAISE_INCREMENT) : 0;
          vitalitySpendOptions.push({ amount, newTotal, success, raises, label: `${amount}` });
          added.add(amount);
        }
        if (!added.has(saveVitalityPool)) {
          const newTotal = diceTotal + saveVitalityPool;
          const success = result.tn > 0 ? newTotal >= result.tn : true;
          const raises = result.tn > 0 && success ? Math.floor((newTotal - result.tn) / RAISE_INCREMENT) : 0;
          vitalitySpendOptions.push({ amount: saveVitalityPool, newTotal, success, raises, label: `All-in (${saveVitalityPool})` });
        }
      }
    }

    // For skill rolls, calculate spending options (MR increments)
    let remainingPool = 0;
    let skillSpendOptions: Array<{amount: number, newTotal: number, success: boolean, raises: number, label: string}> = [];
    if (isSkillRoll && skillKey && actor) {
      const actorData = (actor as any).system;
      const skillRating = actorData.skills?.[skillKey] || 0;
      const skillsSpent = actorData.skillsSpent?.[skillKey] || 0;
      remainingPool = Math.max(0, skillRating - skillsSpent);
      const MR = actorData.mastery?.rank || 2;
      const diceTotal = result.kept.reduce((sum: number, d: number) => sum + d, 0) + (baseModifier || 0);

      if (remainingPool > 0) {
        const added = new Set<number>();
        for (let amount = MR; amount <= remainingPool; amount += MR) {
          const newTotal = diceTotal + amount;
          const success = result.tn > 0 ? newTotal >= result.tn : true;
          const raises = result.tn > 0 && success ? Math.floor((newTotal - result.tn) / RAISE_INCREMENT) : 0;
          skillSpendOptions.push({ amount, newTotal, success, raises, label: `${amount}` });
          added.add(amount);
        }
        if (!added.has(remainingPool)) {
          const newTotal = diceTotal + remainingPool;
          const success = result.tn > 0 ? newTotal >= result.tn : true;
          const raises = result.tn > 0 && success ? Math.floor((newTotal - result.tn) / RAISE_INCREMENT) : 0;
          skillSpendOptions.push({ amount: remainingPool, newTotal, success, raises, label: `All-in (${remainingPool})` });
        }
      }
    }
    
    const diceSum = result.total - result.skill;
    const keptIndices = (result as MasteryRollResult & { keptIndices?: number[] }).keptIndices || [];

    const roll = buildMasteryDisplayRoll(
      result as MasteryRollResult & { keptIndices?: number[] },
      result.skill
    );

    console.log('Mastery System | Roll display built', {
      numDice: result.dice.length,
      keptDice: keptIndices.length,
      formula: roll.formula,
      termCount: roll.terms.length
    });
    
    
    // Build result display HTML
    const successClass = result.success ? 'success' : 'failure';
    
    let content = `
      <div class="mastery-roll">
        <div class="roll-header">
          <h3>${label}</h3>
          ${flavor ? `<div class="flavor">${flavor}</div>` : ''}
        </div>
        
        <div class="roll-details">
          <div class="roll-breakdown">
            <div class="breakdown-line">
              <span>Rolled ${result.dice.length}d8, kept ${result.kept.length}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Rolled:</span>
              <span class="value">${result.dice.map((d, i) => {
                const isKept = keptIndices.includes(i);
                const ch = result.dieChains?.[i];
                const label =
                  ch && ch.length > 1 ? `${ch.join(' + ')} = ${d}` : String(d);
                return isKept ? `<strong>${label}</strong>` : label;
              }).join(', ')}</span>
            </div>
            <div class="breakdown-line">
              <span>Dice Total (kept):</span>
              <span class="value">${diceSum}</span>
            </div>
            ${result.skill > 0 ? `
              <div class="breakdown-line">
                <span>Skill Points Spent:</span>
                <span class="value">+${result.skill}</span>
              </div>
            ` : ''}
            ${baseModifier && baseModifier !== 0 ? `
              <div class="breakdown-line">
                <span>Modifier:</span>
                <span class="value">${baseModifier >= 0 ? '+' : ''}${baseModifier}</span>
              </div>
            ` : ''}
            <div class="breakdown-line total">
              <span><strong>Final Total:</strong></span>
              <span class="value"><strong>${result.total}</strong></span>
            </div>
          </div>
          
          ${result.tn > 0 ? `
            <div class="roll-result ${successClass}">
              <div class="result-line">
                <span>Target Number:</span>
                <span class="value">${result.tn}</span>
              </div>
              <div class="result-line">
                <span><strong>Result:</strong></span>
                <span class="value"><strong>${result.success ? 'SUCCESS' : 'FAILURE'}</strong></span>
              </div>
              ${result.raises > 0 ? `
                <div class="result-line">
                  <span><strong>Raises:</strong></span>
                  <span class="value"><strong>${result.raises}</strong></span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        ${isSkillRoll && skillKey && actorId && skillSpendOptions.length > 0 ? `
          <div class="skill-spend-panel">
            <div class="skill-spend-header">
              <h4>Spend Skill Points</h4>
              <span class="skill-pool-info">Pool: ${remainingPool}/${(actor as any).system?.skills?.[skillKey] || 0}</span>
            </div>
            <div class="skill-spend-buttons">
              ${skillSpendOptions.map(opt => `
                <button type="button" class="skill-spend-btn ${opt.success && !result.success ? 'skill-spend-success' : ''}" data-action="spend-skill-success" data-spend="${opt.amount}" data-skill-key="${skillKey}" data-actor-id="${actorId}">
                  +${opt.label} → ${opt.newTotal}${result.tn > 0 ? (opt.success ? ` ✓${opt.raises > 0 ? ` (${opt.raises} raise${opt.raises > 1 ? 's' : ''})` : ''}` : ' ✗') : ''}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
        ${isSaveRoll && actorId && vitalitySpendOptions.length > 0 ? `
          <div class="skill-spend-panel">
            <div class="skill-spend-header">
              <h4>Spend Vitality</h4>
              <span class="skill-pool-info">Pool: ${saveVitalityPool}/${(actor as any).system?.attributes?.vitality?.value || 0} (${saveVitalityUsesRemaining} use${saveVitalityUsesRemaining !== 1 ? 's' : ''} left)</span>
            </div>
            <div class="skill-spend-buttons">
              ${vitalitySpendOptions.map(opt => `
                <button type="button" class="skill-spend-btn ${opt.success && !result.success ? 'skill-spend-success' : ''}" data-action="spend-vitality-save" data-spend="${opt.amount}" data-actor-id="${actorId}">
                  +${opt.label} → ${opt.newTotal}${result.tn > 0 ? (opt.success ? ` ✓${opt.raises > 0 ? ` (${opt.raises} raise${opt.raises > 1 ? 's' : ''})` : ''}` : ' ✗') : ''}
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    // Flags: omit dieChains — they duplicate explosion data already in rolls[] and can bloat
    // message flags (Forge / large pools), which may break chat create or sync after a few rolls.
    const { dieChains: _omitDieChainsFromFlags, ...rollResultForFlags } = result as MasteryRollResult & {
      dieChains?: number[][];
    };

    // Create chat message with serialized Roll object (Foundry v13 expects serialized rolls)
    // Use roll.toJSON() to serialize the roll properly
    const chatData: any = {
      user: (game as any).user?.id,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
      content,
      // Do not force style to OTHER - let Foundry infer roll display from presence of rolls
      rolls: [roll.toJSON()],
      sound: CONFIG.sounds.dice,
      flags: {
        'mastery-system': {
          rollResult: rollResultForFlags,
          canReroll: true,
          rollRecipe: rollRecipe || null,
          isSkillRoll: isSkillRoll || false,
          isSaveRoll: isSaveRoll || false,
          skillKey: skillKey || null,
          actorId: actorId || null,
          baseModifier: baseModifier || 0,
          skillSpentApplied: false,
          vitalitySpentApplied: false,
          faithRerollConsumed: false
        }
      }
    };
    
    await ChatMessage.create(chatData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Mastery System | Error sending roll to chat:', error);
    ui.notifications.error(`Failed to send mastery roll to chat: ${errorMessage}`);
    throw error;
  }
}

/**
 * Quick roll from actor
 * Helper function to make rolling easier
 */
export async function quickRoll(
  actor: Actor,
  attributeName: string,
  skillName?: string,
  tn?: number,
  label?: string,
  modifier?: number,
  flavor?: string
): Promise<MasteryRollResult> {
  const actorData = actor.system as any;
  
  // Get attribute value (number of dice)
  let numDice = actorData.attributes?.[attributeName]?.value || 0;
  
  // Get mastery rank (number to keep)
  const keepDice = actorData.mastery?.rank || 1;
  
  // For skill rolls, do NOT auto-add skill bonus - it's now a consumable resource spent after the roll
  // Only use provided modifier if explicitly given (for non-skill rolls or situational modifiers)
  const skillBonus = modifier !== undefined ? modifier : 0;
  
  // Apply health penalty (reduces dice pool)
  const { getCurrentPenalty } = await import('../utils/calculations.js');
  const healthBars = actorData.health?.bars || [];
  const currentBar = actorData.health?.currentBar ?? 0;
  const healthPenalty = getCurrentPenalty(healthBars, currentBar);
  
  // Health penalty reduces the dice pool (numDice)
  // Penalty is negative (e.g., -1, -2, -4), so we add it to reduce numDice
  numDice = Math.max(1, numDice + healthPenalty); // Minimum 1 die
  
  // Build label
  const rollLabel = label || `${attributeName.charAt(0).toUpperCase() + attributeName.slice(1)} Roll`;
  let flavorText = flavor || '';
  
  // If no flavor provided, build default
  if (!flavorText) {
    if (skillName) {
      // For skill rolls, show pool info
      const skillRating = actorData.skills?.[skillName] || 0;
      const skillsSpent = actorData.skillsSpent?.[skillName] || 0;
      const remainingPool = Math.max(0, skillRating - skillsSpent);
      flavorText = `Skill: ${skillName} (Pool ${remainingPool}/${skillRating})`;
    } else if (modifier !== undefined) {
      flavorText = `modifier: ${modifier >= 0 ? '+' : ''}${modifier}`;
    }
  }
  
  // Add health penalty to flavor if applicable
  if (healthPenalty < 0) {
    const penaltyText = healthPenalty === -1 ? '1' : healthPenalty === -2 ? '2' : healthPenalty === -4 ? '4' : String(Math.abs(healthPenalty));
    flavorText = flavorText ? `${flavorText} (Health penalty: -${penaltyText} dice)` : `Health penalty: -${penaltyText} dice`;
  }
  
  console.log('Mastery System | quickRoll with health penalty', {
    attributeName,
    skillName,
    baseNumDice: actorData.attributes?.[attributeName]?.value || 0,
    healthPenalty,
    adjustedNumDice: numDice,
    currentBar,
    healthBars: healthBars.map((b: any, i: number) => ({ index: i, name: b.name, current: b.current, max: b.max, penalty: b.penalty }))
  });
  
  return await masteryRoll({
    numDice,
    keepDice,
    skill: skillBonus, // Use modifier if provided, otherwise 0 (for skill rolls, skill points are spent after roll)
    tn,
    label: rollLabel,
    flavor: flavorText,
    actorId: (actor as any).id,
    skillKey: skillName,
    isSkillRoll: !!skillName,
    baseModifier: modifier,
    rollKind: skillName ? 'skill' : 'generic'
  });
}

// Export functions
export default {
  masteryRoll,
  quickRoll
};

