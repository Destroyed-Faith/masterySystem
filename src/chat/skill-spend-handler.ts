/**
 * Skill Spend Handler
 * Handles skill point spending from chat message buttons
 */

/**
 * Register click handlers for skill spend buttons in chat messages
 */
export function registerSkillSpendClickHandler(): void {
  console.log('Mastery System | Registering skill spend click handler');
  
  Hooks.on('renderChatMessageHTML', (message: ChatMessage, htmlEl: JQuery) => {
    // Find skill spend buttons
    const spendButtons = htmlEl.find('[data-action="spend-skill"], [data-action="spend-skill-allin"]');
    
    if (spendButtons.length === 0) return;
    
    // Check if already processed (prevent duplicate handlers)
    if (spendButtons.data('handler-attached')) return;
    spendButtons.data('handler-attached', true);
    
    // Check if skill points already spent (disable buttons)
    const flags = message.flags?.['mastery-system'] || {};
    if (flags.skillSpentApplied === true) {
      spendButtons.prop('disabled', true).addClass('disabled');
      return;
    }
    
    spendButtons.off('click.skill-spend').on('click.skill-spend', async (event: JQuery.ClickEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const button = $(event.currentTarget);
      const action = button.data('action');
      const skillKey = button.data('skill-key');
      const actorId = button.data('actor-id');
      const spendAmount = parseInt(button.data('spend') || '0');
      const isAllIn = action === 'spend-skill-allin';
      
      console.log('SkillSpend | Click handler triggered', {
        action,
        skillKey,
        actorId,
        spendAmount,
        isAllIn,
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
      const MR = system.mastery?.rank || 2;
      
      console.log('SkillSpend | Actor data', {
        actorId,
        actorName: actor.name,
        skillKey,
        skillRating,
        currentSpent,
        remaining,
        MR
      });
      
      // Validation
      let finalSpend = spendAmount;
      
      if (isAllIn) {
        // All-in: allow spending remaining pool (even if < MR, even if not multiple of MR)
        finalSpend = remaining;
      } else {
        // Step spending: must be >= MR, multiple of MR, and <= remaining
        if (finalSpend < MR) {
          ui.notifications?.warn(`Must spend at least ${MR} skill points (Mastery Rank).`);
          return;
        }
        if (finalSpend % MR !== 0) {
          ui.notifications?.warn(`Must spend in multiples of ${MR} (Mastery Rank).`);
          return;
        }
        if (finalSpend > remaining) {
          ui.notifications?.warn(`Cannot spend ${finalSpend} points. Only ${remaining} remaining.`);
          return;
        }
      }
      
      if (finalSpend <= 0) {
        ui.notifications?.warn('Cannot spend 0 or negative skill points.');
        return;
      }
      
      if (finalSpend > remaining) {
        ui.notifications?.warn(`Cannot spend ${finalSpend} points. Only ${remaining} remaining.`);
        return;
      }
      
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
                <span class="value">${rollResult.dice.map((d, i) => {
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
  });
  
  console.log('Mastery System | Skill spend click handler registered');
}

