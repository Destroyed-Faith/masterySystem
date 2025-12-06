/**
 * Roll & Keep d8 System for Mastery System
 * 
 * Core dice rolling mechanic:
 * - Roll X d8 (pool = Attribute)
 * - Keep K dice (keep = Mastery Rank)
 * - 8s explode (roll again and add)
 * - Advantage: reroll 1s once
 * - Disadvantage: only highest die explodes
 * - Raises: declared before roll, each adds +4 to TN
 */

import { rollKeepD8, type RollKeepOptions, type RollKeepResult } from '../rolls/rollKeep';
import { createCheckChatCard } from './chatCards';
import { applySkillPenalties } from '../combat/equipment';

/**
 * Data for performing a check
 */
export interface CheckData {
  // Dice pool
  attribute: string;             // Which attribute (might, agility, etc.)
  attributeValue: number;        // Value of that attribute (dice pool)
  skill?: string;                // Optional skill name
  skillValue?: number;           // Optional skill bonus (flat)
  
  // Target
  tn: number;                    // Base Target Number
  declaredRaises?: number;       // Raises declared before roll
  
  // Modifiers
  advantage?: boolean;           // Advantage on the roll
  disadvantage?: boolean;        // Disadvantage on the roll
  situationalBonus?: number;     // Additional flat bonus
  
  // Context
  label: string;                 // Name of the check ("Athletics", "Perception", etc.)
  flavor?: string;               // Flavor text
}

/**
 * Perform a generic check (skill, attribute, save)
 * Shows a dialog for the player to declare Raises before rolling
 * 
 * @param actor - The actor making the check
 * @param checkData - Check configuration
 * @returns Promise resolving when check is complete
 */
export async function performCheck(
  actor: any,
  checkData: CheckData
): Promise<RollKeepResult> {
  
  // Build the roll options
  const masteryRank = actor.system.mastery?.rank || 2;
  const totalFlat = (checkData.skillValue || 0) + (checkData.situationalBonus || 0);
  
  // Apply equipment penalties to dice pool if skill check
  let dicePool = checkData.attributeValue;
  if (checkData.skill) {
    dicePool = applySkillPenalties(actor, checkData.skill, dicePool);
  }
  
  const rollOptions: RollKeepOptions = {
    dice: dicePool,
    keep: masteryRank,
    flat: totalFlat,
    advantage: checkData.advantage,
    disadvantage: checkData.disadvantage,
    tn: checkData.tn,
    declaredRaises: checkData.declaredRaises || 0,
    label: checkData.label,
    flavor: checkData.flavor
  };
  
  // Perform the roll
  const result = await rollKeepD8(actor, rollOptions);
  
  // Create chat card
  await createCheckChatCard(actor, checkData, result);
  
  return result;
}

/**
 * Show dialog to configure and perform a check
 * Allows player to set TN and declare Raises
 * 
 * @param actor - The actor making the check
 * @param baseData - Base check configuration
 * @returns Promise resolving when check is complete
 */
export async function performCheckWithDialog(
  actor: any,
  baseData: Partial<CheckData> & { attribute: string; label: string }
): Promise<RollKeepResult | null> {
  
  return new Promise((resolve) => {
    const attributeValue = actor.system.attributes?.[baseData.attribute]?.value || 2;
    const skillValue = baseData.skill ? (actor.system.skills?.[baseData.skill] || 0) : 0;
    const masteryRank = actor.system.mastery?.rank || 2;
    
    const dialog = new Dialog({
      title: `${baseData.label} Check`,
      content: `
        <form class="mastery-check-dialog">
          <div class="form-group">
            <label>Pool:</label>
            <span><strong>${attributeValue}k${masteryRank}</strong> ${baseData.attribute.charAt(0).toUpperCase() + baseData.attribute.slice(1)}</span>
            ${baseData.skill ? `<span>+ ${skillValue} ${baseData.skill}</span>` : ''}
          </div>
          
          <div class="form-group">
            <label>Target Number (TN):</label>
            <input type="number" name="tn" value="${baseData.tn || 16}" min="1" step="4"/>
            <small>Difficulty: Trivial (8), Easy (12), Standard (16), Challenging (20), Difficult (24), Extreme (28+)</small>
          </div>
          
          <div class="form-group">
            <label>Declared Raises:</label>
            <input type="number" name="raises" value="0" min="0" max="10"/>
            <small>Each Raise adds +4 to TN but grants better outcome on success</small>
          </div>
          
          <div class="form-group">
            <label>Modifiers:</label>
            <div class="checkbox-group">
              <label>
                <input type="checkbox" name="advantage"/> Advantage (reroll 1s once)
              </label>
              <label>
                <input type="checkbox" name="disadvantage"/> Disadvantage (only highest die explodes)
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>Situational Bonus:</label>
            <input type="number" name="bonus" value="0" step="1"/>
          </div>
          
          <div class="form-group">
            <label>Flavor:</label>
            <input type="text" name="flavor" value="" placeholder="Optional description"/>
          </div>
          
          <div class="effective-tn">
            <strong>Effective TN:</strong> <span id="effective-tn-value">16</span>
          </div>
        </form>
      `,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: 'Roll',
          callback: async (html: JQuery) => {
            const tn = parseInt((html.find('[name="tn"]').val() as string) || '16');
            const raises = parseInt((html.find('[name="raises"]').val() as string) || '0');
            const advantage = html.find('[name="advantage"]').is(':checked');
            const disadvantage = html.find('[name="disadvantage"]').is(':checked');
            const bonus = parseInt((html.find('[name="bonus"]').val() as string) || '0');
            const flavor = (html.find('[name="flavor"]').val() as string) || '';
            
            const checkData: CheckData = {
              attribute: baseData.attribute,
              attributeValue,
              skill: baseData.skill,
              skillValue,
              tn,
              declaredRaises: raises,
              advantage,
              disadvantage,
              situationalBonus: bonus,
              label: baseData.label,
              flavor
            };
            
            const result = await performCheck(actor, checkData);
            resolve(result);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel',
          callback: () => resolve(null)
        }
      },
      default: 'roll',
      render: (html: JQuery) => {
        // Update effective TN when TN or Raises change
        const updateEffectiveTN = () => {
          const tn = parseInt((html.find('[name="tn"]').val() as string) || '16');
          const raises = parseInt((html.find('[name="raises"]').val() as string) || '0');
          const effectiveTN = tn + (raises * 4);
          html.find('#effective-tn-value').text(effectiveTN);
        };
        
        html.find('[name="tn"], [name="raises"]').on('input change', updateEffectiveTN);
        updateEffectiveTN();
      },
      close: () => resolve(null)
    }, {
      width: 500,
      classes: ['mastery-system', 'check-dialog']
    });
    
    dialog.render(true);
  });
}

/**
 * Perform a quick check without dialog (for NPCs or automated checks)
 * 
 * @param actor - The actor making the check
 * @param attribute - Attribute to use
 * @param tn - Target Number
 * @param label - Label for the check
 * @param skill - Optional skill to add
 * @param declaredRaises - Optional raises
 * @returns Roll result
 */
export async function performQuickCheck(
  actor: any,
  attribute: string,
  tn: number,
  label: string,
  skill?: string,
  declaredRaises: number = 0
): Promise<RollKeepResult> {
  
  const attributeValue = actor.system.attributes?.[attribute]?.value || 2;
  const skillValue = skill ? (actor.system.skills?.[skill] || 0) : 0;
  
  const checkData: CheckData = {
    attribute,
    attributeValue,
    skill,
    skillValue,
    tn,
    declaredRaises,
    label
  };
  
  return performCheck(actor, checkData);
}

/**
 * Perform a saving throw
 * 
 * @param actor - The actor making the save
 * @param saveType - 'body', 'mind', or 'spirit'
 * @param tn - Save TN (usually 12 * attacker's Mastery Rank)
 * @param label - Description of what they're saving against
 * @returns Roll result
 */
export async function performSave(
  actor: any,
  saveType: 'body' | 'mind' | 'spirit',
  tn: number,
  label: string
): Promise<RollKeepResult> {
  
  // Determine which attributes can be used
  let attribute1: string;
  let attribute2: string;
  
  switch (saveType) {
    case 'body':
      attribute1 = 'might';
      attribute2 = 'agility';
      break;
    case 'mind':
      attribute1 = 'intellect';
      attribute2 = 'wits';
      break;
    case 'spirit':
      attribute1 = 'resolve';
      attribute2 = 'influence';
      break;
  }
  
  const attr1Value = actor.system.attributes?.[attribute1]?.value || 2;
  const attr2Value = actor.system.attributes?.[attribute2]?.value || 2;
  
  // Use the higher attribute
  const useAttribute = attr1Value >= attr2Value ? attribute1 : attribute2;
  const attributeValue = Math.max(attr1Value, attr2Value);
  
  // Add Vitality as flat bonus
  const vitality = actor.system.attributes?.vitality?.value || 2;
  
  const checkData: CheckData = {
    attribute: useAttribute,
    attributeValue,
    skillValue: vitality, // Vitality adds as flat bonus
    tn,
    label: `${saveType.charAt(0).toUpperCase() + saveType.slice(1)} Save: ${label}`
  };
  
  return performCheck(actor, checkData);
}

