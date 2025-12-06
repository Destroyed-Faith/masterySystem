/**
 * Chat Card Templates for Mastery System
 * Creates beautiful, detailed chat cards for checks, attacks, and damage
 */
/**
 * Get detail level from settings
 */
function getDetailLevel() {
    return game.settings?.get('mastery-system', 'rollDetailLevel') || 'detailed';
}
/**
 * Format dice for display
 * Shows individual die rolls with explosions
 */
function formatDiceDisplay(result, detailed = true) {
    if (!detailed) {
        return `<div class="dice-summary">
      <span class="kept-total">${result.keptSum}</span>
      ${result.flatBonus > 0 ? `<span class="flat-bonus">+${result.flatBonus}</span>` : ''}
      <span class="equals">=</span>
      <span class="total">${result.total}</span>
    </div>`;
    }
    let html = '<div class="dice-detailed">';
    // Show all dice with kept/dropped indication
    result.allDice.forEach((die) => {
        const isKept = result.keptDice.includes(die.total);
        const cssClass = isKept ? 'die kept' : 'die dropped';
        if (die.rolls.length > 1) {
            // Exploded die - show chain
            const rollsStr = die.rolls.join(' + ');
            html += `<span class="${cssClass} exploded" title="${rollsStr}">${die.total}!</span>`;
        }
        else if (die.rerolled) {
            // Rerolled die
            html += `<span class="${cssClass} rerolled" title="Rerolled from 1">${die.total}↻</span>`;
        }
        else {
            html += `<span class="${cssClass}">${die.total}</span>`;
        }
    });
    html += '</div>';
    // Show kept sum + flat
    html += `<div class="dice-calculation">
    <span class="kept-label">Kept:</span>
    <span class="kept-values">[${result.keptDice.join(', ')}]</span>
    <span class="equals">=</span>
    <span class="kept-sum">${result.keptSum}</span>
    ${result.flatBonus > 0 ? `<span class="flat-bonus">+ ${result.flatBonus}</span>` : ''}
    <span class="equals">=</span>
    <span class="total"><strong>${result.total}</strong></span>
  </div>`;
    return html;
}
/**
 * Create chat card for a check (skill, attribute, save)
 */
export async function createCheckChatCard(actor, checkData, result) {
    const detailed = getDetailLevel() === 'detailed';
    const diceDisplay = formatDiceDisplay(result, detailed);
    const content = `
    <div class="mastery-roll check-roll">
      <div class="roll-header">
        <img src="${actor.img}" alt="${actor.name}" class="actor-portrait"/>
        <h3>${checkData.label}</h3>
      </div>
      
      <div class="roll-formula">
        <strong>Pool:</strong> ${result.formula}
      </div>
      
      ${diceDisplay}
      
      <div class="roll-result">
        <div class="tn-comparison">
          <span class="total">${result.total}</span>
          <span class="vs">vs</span>
          <span class="tn">TN ${result.tn}</span>
        </div>
        <div class="result-badge ${result.success ? 'success' : 'failure'}">
          ${result.success ? '✓ SUCCESS' : '✗ FAILURE'}
        </div>
        ${result.success && result.margin > 0 ? `<div class="margin">Margin: +${result.margin}</div>` : ''}
        ${result.declaredRaises > 0 ? `<div class="raises-declared">Raises Declared: ${result.declaredRaises}</div>` : ''}
      </div>
      
      ${checkData.flavor ? `<div class="roll-flavor">${checkData.flavor}</div>` : ''}
    </div>
  `;
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor }),
        content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        sound: result.success ? 'sounds/dice.wav' : undefined,
        flags: {
            'mastery-system': {
                type: 'check',
                result: result.success,
                total: result.total,
                tn: result.tn
            }
        }
    });
}
/**
 * Create chat card for an attack roll
 */
export async function createAttackChatCard(attacker, attackData, attackResult) {
    const detailed = getDetailLevel() === 'detailed';
    const diceDisplay = formatDiceDisplay(attackResult.roll, detailed);
    const result = attackResult.roll;
    const content = `
    <div class="mastery-roll attack-roll">
      <div class="roll-header">
        <img src="${attacker.img}" alt="${attacker.name}" class="actor-portrait"/>
        <h3>${attacker.name} attacks ${attackData.target.name}!</h3>
      </div>
      
      <div class="attack-info">
        <div class="weapon-name"><strong>${attackData.item.name}</strong></div>
        <div class="target-evade">Target Evade: ${attackData.targetEvade}</div>
      </div>
      
      <div class="roll-formula">
        <strong>Attack Pool:</strong> ${result.formula}
      </div>
      
      ${diceDisplay}
      
      <div class="roll-result">
        <div class="tn-comparison">
          <span class="total">${result.total}</span>
          <span class="vs">vs</span>
          <span class="tn">TN ${result.tn}</span>
        </div>
        <div class="result-badge ${attackResult.hit ? 'hit' : 'miss'}">
          ${attackResult.hit ? '⚔ HIT!' : '✗ MISS'}
        </div>
        ${attackResult.hit && result.margin > 0 ? `<div class="margin">Margin: +${result.margin}</div>` : ''}
        ${attackResult.totalRaises > 0 ? `<div class="raises-available">Raises Available: ${attackResult.totalRaises}</div>` : ''}
      </div>
      
      ${attackResult.hit ? '<div class="next-step">Roll damage to continue...</div>' : ''}
    </div>
  `;
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker }),
        content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        sound: attackResult.hit ? 'sounds/dice.wav' : undefined,
        flags: {
            'mastery-system': {
                type: 'attack',
                hit: attackResult.hit,
                total: result.total,
                tn: result.tn,
                raises: attackResult.totalRaises
            }
        }
    });
}
/**
 * Create chat card for damage roll and application
 */
export async function createDamageChatCard(attacker, target, item, damageResult, armor, penetration, effectiveArmor, dr, damageType, finalDamage) {
    const rolls = damageResult.rolls.map(r => `<span class="damage-die ${r === 8 ? 'eight' : ''}">${r}</span>`).join(' ');
    const penetrationDisplay = penetration > 0
        ? `<div class="damage-penetration">Penetration: ${penetration} (Armor: ${armor} → ${effectiveArmor})</div>`
        : '';
    const drDisplay = dr > 0
        ? `<div class="damage-dr">DR (${damageType}): ${dr}</div>`
        : '';
    const content = `
    <div class="mastery-damage">
      <div class="damage-header">
        <h3>${attacker.name} damages ${target.name}!</h3>
      </div>
      
      <div class="damage-weapon">
        <strong>Weapon:</strong> ${item.name}
        <span class="damage-type">(${damageType})</span>
      </div>
      
      <div class="damage-roll">
        <div class="damage-formula"><strong>Damage:</strong> ${damageResult.formula}</div>
        <div class="damage-dice">${rolls}</div>
        <div class="damage-total">Total: <strong>${damageResult.total}</strong></div>
      </div>
      
      ${penetrationDisplay}
      ${drDisplay}
      
      <div class="damage-calculation">
        <div class="damage-before">${damageResult.total} damage</div>
        ${penetration > 0 ? `<div class="damage-penetration-note">− ${penetration} penetration</div>` : ''}
        <div class="damage-armor">− ${effectiveArmor} armor</div>
        ${dr > 0 ? `<div class="damage-dr-note">− ${dr} DR (${damageType})</div>` : ''}
        <div class="damage-final"><strong>${finalDamage} final damage</strong></div>
      </div>
      
      <div class="damage-applied">
        <strong>${target.name}</strong> takes <span class="damage-value">${finalDamage}</span> damage!
      </div>
    </div>
  `;
    await ChatMessage.create({
        user: game.user?.id,
        speaker: ChatMessage.getSpeaker({ actor: attacker }),
        content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        flags: {
            'mastery-system': {
                type: 'damage',
                damage: finalDamage,
                target: target.id,
                damageType,
                penetration
            }
        }
    });
}
/**
 * Register chat card CSS and settings
 */
export function registerChatCardSettings() {
    game.settings?.register('mastery-system', 'rollDetailLevel', {
        name: 'Roll Detail Level',
        hint: 'Show detailed dice rolls or just summary',
        scope: 'client',
        config: true,
        type: String,
        choices: {
            'detailed': 'Detailed (show all dice)',
            'summary': 'Summary (just totals)'
        },
        default: 'detailed'
    });
}
//# sourceMappingURL=chatCards.js.map