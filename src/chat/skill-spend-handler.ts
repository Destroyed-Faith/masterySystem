/**
 * Skill Spend Handler
 * Handles skill point spending from chat message buttons
 */

/**
 * Register click handlers for skill spend buttons in chat messages
 */
export function registerSkillSpendClickHandler(): void {
  console.log('Mastery System | Registering skill spend click handler');
  
  Hooks.on('renderChatMessageHTML', (message: ChatMessage, htmlRaw: HTMLElement | JQuery) => {
    try {
    const htmlEl = (htmlRaw instanceof HTMLElement) ? $(htmlRaw) : htmlRaw;
    const spendButton = htmlEl.find('[data-action="spend-skill-success"]');
    
    if (spendButton.length === 0) return;
    
    // Check if already processed (prevent duplicate handlers)
    if (spendButton.data('handler-attached')) return;
    spendButton.data('handler-attached', true);
    
    // Check if skill points already spent (disable button)
    const flags = message.flags?.['mastery-system'] || {};
    if (flags.skillSpentApplied === true) {
      spendButton.prop('disabled', true).addClass('disabled');
      return;
    }
    
    spendButton.off('click.skill-spend').on('click.skill-spend', async (event: JQuery.ClickEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const button = $(event.currentTarget);
      const skillKey = button.data('skill-key');
      const actorId = button.data('actor-id');
      const spendAmount = parseInt(button.data('spend') || '0');
      
      console.log('SkillSpend | Click handler triggered', {
        skillKey,
        actorId,
        spendAmount,
        messageId: message.id
      });
      
      // Get message flags
      const messageFlags = message.flags?.['mastery-system'] || {};
      if (!messageFlags.isSkillRoll || !messageFlags.skillKey || !messageFlags.actorId) {
        console.warn('SkillSpend | Message is not a skill roll or missing required flags');
        return;
      }
      
      // Permission check: only message author or GM can spend
      const isAuthor = message.user?.id === (game as any).user?.id;
      const isGM = (game as any).user?.isGM;
      
      if (!isAuthor && !isGM) {
        ui.notifications?.warn('Only the message author or GM can spend skill points.');
        return;
      }
      
      // Load actor
      const actor = (game as any).actors?.get(actorId);
      if (!actor) {
        console.error('SkillSpend | Actor not found', { actorId });
        ui.notifications?.error('Actor not found.');
        return;
      }
      
      const system = (actor as any).system;
      const skillRating = system.skills?.[skillKey] || 0;
      const currentSpent = system.skillsSpent?.[skillKey] || 0;
      const remaining = Math.max(0, skillRating - currentSpent);
      
      console.log('SkillSpend | Actor data', {
        actorId,
        actorName: actor.name,
        skillKey,
        skillRating,
        currentSpent,
        remaining,
        spendAmount
      });
      
      // Validation: check if we have enough points
      if (spendAmount <= 0) {
        ui.notifications?.warn('Invalid skill point amount.');
        return;
      }
      
      if (spendAmount > remaining) {
        ui.notifications?.warn(`Cannot spend ${spendAmount} points. Only ${remaining} remaining.`);
        return;
      }
      
      const finalSpend = spendAmount;
      
      // Update actor: increase skillsSpent
      const newSpent = Math.min(skillRating, currentSpent + finalSpend);
      await actor.update({
        [`system.skillsSpent.${skillKey}`]: newSpent
      });
      
      console.log('SkillSpend | Actor updated', {
        actorId,
        skillKey,
        oldSpent: currentSpent,
        newSpent,
        spent: finalSpend
      });
      
      // Update message: recalculate roll result
      const rollResult = messageFlags.rollResult;
      if (!rollResult) {
        console.error('SkillSpend | No rollResult in message flags');
        return;
      }
      
      // Calculate new total
      const diceSum = rollResult.kept.reduce((sum: number, die: number) => sum + die, 0);
      const baseModifier = messageFlags.baseModifier || 0;
      const newTotal = diceSum + finalSpend + baseModifier;
      
      // Update rollResult
      rollResult.skill = finalSpend;
      rollResult.total = newTotal;
      
      // Recalculate success/raises if TN > 0
      if (rollResult.tn > 0) {
        rollResult.success = newTotal >= rollResult.tn;
        const RAISE_INCREMENT = 4;
        rollResult.raises = rollResult.success ? Math.floor((newTotal - rollResult.tn) / RAISE_INCREMENT) : 0;
      }
      
      // Mark as finalized
      const updatedFlags = {
        ...messageFlags,
        skillSpentApplied: true
      };
      
      // Rebuild HTML content
      const keptIndices = (rollResult as any).keptIndices || [];
      const successClass = rollResult.success ? 'success' : 'failure';
      
      // Get original roll data from message content or flags
      const originalLabel = rollResult.label || messageFlags.rollResult?.label || 'Roll';
      const originalFlavor = rollResult.flavor || messageFlags.rollResult?.flavor || '';
      
      let content = `
        <div class="mastery-roll">
          <div class="roll-header">
            <h3>${originalLabel}</h3>
            ${originalFlavor ? `<div class="flavor">${originalFlavor}</div>` : ''}
          </div>
          
          <div class="roll-details">
            <div class="roll-breakdown">
              <div class="breakdown-line">
                <span>Rolled ${rollResult.dice.length}d8, kept ${rollResult.kept.length}</span>
              </div>
              <div class="breakdown-line">
                <span>Dice Rolled:</span>
                <span class="value">${rollResult.dice.map((d: number, i: number) => {
                  const isKept = keptIndices.includes(i);
                  return isKept ? `<strong>${d}</strong>` : d;
                }).join(', ')}</span>
              </div>
              <div class="breakdown-line">
                <span>Dice Total (kept):</span>
                <span class="value">${diceSum}</span>
              </div>
              ${finalSpend > 0 ? `
                <div class="breakdown-line">
                  <span>Skill Points Spent:</span>
                  <span class="value">+${finalSpend}</span>
                </div>
              ` : ''}
              ${baseModifier !== 0 ? `
                <div class="breakdown-line">
                  <span>Modifier:</span>
                  <span class="value">${baseModifier >= 0 ? '+' : ''}${baseModifier}</span>
                </div>
              ` : ''}
              <div class="breakdown-line total">
                <span><strong>Final Total:</strong></span>
                <span class="value"><strong>${newTotal}</strong></span>
              </div>
            </div>
            
            ${rollResult.tn > 0 ? `
              <div class="roll-result ${successClass}">
                <div class="result-line">
                  <span>Target Number:</span>
                  <span class="value">${rollResult.tn}</span>
                </div>
                <div class="result-line">
                  <span><strong>Result:</strong></span>
                  <span class="value"><strong>${rollResult.success ? 'SUCCESS' : 'FAILURE'}</strong></span>
                </div>
                ${rollResult.raises > 0 ? `
                  <div class="result-line">
                    <span><strong>Raises:</strong></span>
                    <span class="value"><strong>${rollResult.raises}</strong></span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          
          <div class="skill-spend-panel skill-spend-applied">
            <div class="skill-spend-header">
              <h4>Skill Points Spent</h4>
              <span class="skill-pool-info">Pool: ${Math.max(0, remaining - finalSpend)}/${skillRating}</span>
            </div>
            <div class="skill-spend-applied-message">
              Spent ${finalSpend} skill point${finalSpend !== 1 ? 's' : ''} from ${skillKey}
            </div>
          </div>
        </div>
      `;
      
      // Update message
      await message.update({
        content,
        flags: {
          'mastery-system': updatedFlags
        }
      });
      
      console.log('SkillSpend | Message updated', {
        messageId: message.id,
        skillKey,
        spend: finalSpend,
        newTotal,
        remainingBefore: remaining,
        remainingAfter: Math.max(0, remaining - finalSpend)
      });
      
      ui.notifications?.info(`Spent ${finalSpend} skill point${finalSpend !== 1 ? 's' : ''} from ${skillKey}. New total: ${newTotal}`);
    });
    } catch (e) {
      console.error('Mastery System | skill-spend renderChatMessageHTML (skill) failed', e);
    }
  });
  
  // Handle Vitality spending for saves
  Hooks.on('renderChatMessageHTML', (message: ChatMessage, htmlRaw2: HTMLElement | JQuery) => {
    try {
    const htmlEl = (htmlRaw2 instanceof HTMLElement) ? $(htmlRaw2) : htmlRaw2;
    const spendButton = htmlEl.find('[data-action="spend-vitality-save"]');
    
    if (spendButton.length === 0) return;
    if (spendButton.data('handler-attached')) return;
    spendButton.data('handler-attached', true);
    
    const flags = message.flags?.['mastery-system'] || {};
    if (flags.vitalitySpentApplied === true) {
      spendButton.prop('disabled', true).addClass('disabled');
      return;
    }
    
    spendButton.off('click.vitality-spend').on('click.vitality-spend', async (event: JQuery.ClickEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const button = $(event.currentTarget);
      const actorId = button.data('actor-id');
      const spendAmount = parseInt(button.data('spend') || '0');
      
      const messageFlags = message.flags?.['mastery-system'] || {};
      if (!messageFlags.isSaveRoll || !messageFlags.actorId) return;
      
      const isAuthor = message.user?.id === (game as any).user?.id;
      const isGM = (game as any).user?.isGM;
      if (!isAuthor && !isGM) {
        ui.notifications?.warn('Only the message author or GM can spend Vitality.');
        return;
      }
      
      const actor = (game as any).actors?.get(actorId);
      if (!actor) {
        ui.notifications?.error('Actor not found.');
        return;
      }
      
      const system = (actor as any).system;
      const vitality = system.attributes?.vitality?.value || 0;
      const vitalitySpent = system.saves?.vitalitySpent || 0;
      const usesRemaining = system.saves?.vitalityUsesRemaining ?? 4;
      const pool = Math.max(0, vitality - vitalitySpent);
      
      if (usesRemaining <= 0) {
        ui.notifications?.warn('No Vitality uses remaining until Safe Haven Rest.');
        return;
      }
      if (spendAmount > pool) {
        ui.notifications?.warn(`Cannot spend ${spendAmount} Vitality. Only ${pool} remaining.`);
        return;
      }
      
      await actor.update({
        'system.saves.vitalitySpent': vitalitySpent + spendAmount,
        'system.saves.vitalityUsesRemaining': Math.max(0, usesRemaining - 1)
      });
      
      const rollResult = messageFlags.rollResult;
      if (!rollResult) return;
      
      const keptIndices = (rollResult as any).keptIndices || [];
      const diceSum = rollResult.kept.reduce((sum: number, die: number) => sum + die, 0);
      const baseModifier = messageFlags.baseModifier || 0;
      const newTotal = diceSum + spendAmount + baseModifier;
      
      rollResult.skill = spendAmount;
      rollResult.total = newTotal;
      
      if (rollResult.tn > 0) {
        rollResult.success = newTotal >= rollResult.tn;
        const RAISE_INCREMENT = 4;
        rollResult.raises = rollResult.success ? Math.floor((newTotal - rollResult.tn) / RAISE_INCREMENT) : 0;
      }
      
      const updatedFlags = { ...messageFlags, vitalitySpentApplied: true };
      const successClass = rollResult.success ? 'success' : 'failure';
      const originalLabel = rollResult.label || 'Save';
      const originalFlavor = rollResult.flavor || '';
      
      let content = `
        <div class="mastery-roll">
          <div class="roll-header">
            <h3>${originalLabel}</h3>
            ${originalFlavor ? `<div class="flavor">${originalFlavor}</div>` : ''}
          </div>
          <div class="roll-details">
            <div class="roll-breakdown">
              <div class="breakdown-line">
                <span>Rolled ${rollResult.dice.length}d8, kept ${rollResult.kept.length}</span>
              </div>
              <div class="breakdown-line">
                <span>Dice Rolled:</span>
                <span class="value">${rollResult.dice.map((d: number, i: number) => {
                  const isKept = keptIndices.includes(i);
                  return isKept ? `<strong>${d}</strong>` : d;
                }).join(', ')}</span>
              </div>
              <div class="breakdown-line">
                <span>Dice Total (kept):</span>
                <span class="value">${diceSum}</span>
              </div>
              ${spendAmount > 0 ? `
                <div class="breakdown-line">
                  <span>Vitality Spent:</span>
                  <span class="value">+${spendAmount}</span>
                </div>
              ` : ''}
              ${baseModifier !== 0 ? `
                <div class="breakdown-line">
                  <span>Modifier:</span>
                  <span class="value">${baseModifier >= 0 ? '+' : ''}${baseModifier}</span>
                </div>
              ` : ''}
              <div class="breakdown-line total">
                <span><strong>Final Total:</strong></span>
                <span class="value"><strong>${newTotal}</strong></span>
              </div>
            </div>
            ${rollResult.tn > 0 ? `
              <div class="roll-result ${successClass}">
                <div class="result-line">
                  <span>Target Number:</span>
                  <span class="value">${rollResult.tn}</span>
                </div>
                <div class="result-line">
                  <span><strong>Result:</strong></span>
                  <span class="value"><strong>${rollResult.success ? 'SUCCESS' : 'FAILURE'}</strong></span>
                </div>
                ${rollResult.raises > 0 ? `
                  <div class="result-line">
                    <span><strong>Raises:</strong></span>
                    <span class="value"><strong>${rollResult.raises}</strong></span>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
          <div class="skill-spend-panel skill-spend-applied">
            <div class="skill-spend-header">
              <h4>Vitality Spent</h4>
              <span class="skill-pool-info">Pool: ${Math.max(0, pool - spendAmount)}/${vitality} (${Math.max(0, usesRemaining - 1)} uses left)</span>
            </div>
            <div class="skill-spend-applied-message">
              Spent ${spendAmount} Vitality on this save
            </div>
          </div>
        </div>
      `;
      
      await message.update({
        content,
        flags: { 'mastery-system': updatedFlags }
      });
      
      ui.notifications?.info(`Spent ${spendAmount} Vitality on save. New total: ${newTotal}`);
    });
    } catch (e) {
      console.error('Mastery System | skill-spend renderChatMessageHTML (vitality) failed', e);
    }
  });
  
  console.log('Mastery System | Skill spend click handler registered');
}

