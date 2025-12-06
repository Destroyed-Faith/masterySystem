/**
 * Initiative Shop Dialog
 * Allows players to spend initiative points to buy tactical advantages
 * 
 * Shop Options:
 * - 4 points: +2m Movement
 * - 8 points: Initiative Swap (requires 2 raises, 1x/round)
 * - 20 points: +1 Extra Attack (max 1x/round)
 */

import { INITIATIVE_SHOP } from '../utils/constants';
import { calculateShopCost, validateShopPurchases, type InitiativeShopResult } from '../utils/initiative';

export class InitiativeShopDialog extends Dialog {
  /**
   * Show the Initiative Shop dialog
   * @param actor - The actor shopping
   * @param rawInitiative - Total initiative before spending
   * @returns Promise resolving to shop result or null if cancelled
   */
  static async show(actor: any, rawInitiative: number): Promise<InitiativeShopResult | null> {
    return new Promise((resolve) => {
      const data = {
        actor,
        rawInitiative,
        purchases: {
          extraMovement: 0,
          initiativeSwap: false,
          extraAttack: false
        }
      };
      
      const dialog = new InitiativeShopDialog({
        title: `Initiative Shop - ${actor.name}`,
        content: this._getDialogContent(data),
        buttons: {
          confirm: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Confirm',
            callback: (html: JQuery) => {
              const result = this._parseFormData(html, rawInitiative);
              resolve(result);
            }
          },
          skip: {
            icon: '<i class="fas fa-forward"></i>',
            label: 'Skip Shop',
            callback: () => {
              resolve({
                finalInitiative: rawInitiative,
                spentPoints: 0,
                purchases: {
                  extraMovement: 0,
                  initiativeSwap: false,
                  extraAttack: false
                },
                cancelled: false
              });
            }
          }
        },
        default: 'confirm',
        render: (html: JQuery) => {
          this._activateListeners(html, data);
        },
        close: () => {
          // If closed without button, treat as skip
          resolve({
            finalInitiative: rawInitiative,
            spentPoints: 0,
            purchases: {
              extraMovement: 0,
              initiativeSwap: false,
              extraAttack: false
            },
            cancelled: true
          });
        }
      }, {
        width: 500,
        classes: ['mastery-system', 'initiative-shop-dialog']
      });
      
      dialog.render(true);
    });
  }
  
  /**
   * Generate the HTML content for the dialog
   */
  private static _getDialogContent(data: any): string {
    const { rawInitiative } = data;
    
    return `
      <div class="initiative-shop-content">
        <div class="shop-header">
          <h2>Spend Initiative Points</h2>
          <div class="raw-initiative">
            <label>Raw Initiative:</label>
            <span class="value">${rawInitiative}</span>
          </div>
        </div>
        
        <div class="shop-info">
          <p>You may spend points from your Initiative Score to gain tactical advantages this round.</p>
          <p><strong>Your remaining initiative after spending determines turn order.</strong></p>
        </div>
        
        <form class="shop-form">
          <!-- Extra Movement -->
          <div class="shop-item">
            <div class="item-header">
              <i class="fas fa-running"></i>
              <label for="extra-movement">Extra Movement</label>
              <span class="cost">${INITIATIVE_SHOP.MOVEMENT.COST} points per +2m</span>
            </div>
            <div class="item-control">
              <button type="button" class="quantity-btn minus" data-target="extra-movement">
                <i class="fas fa-minus"></i>
              </button>
              <input 
                type="number" 
                id="extra-movement" 
                name="extraMovement" 
                min="0" 
                max="${Math.floor(rawInitiative / INITIATIVE_SHOP.MOVEMENT.COST) * 2}"
                step="2"
                value="0"
              />
              <button type="button" class="quantity-btn plus" data-target="extra-movement">
                <i class="fas fa-plus"></i>
              </button>
              <span class="unit">meters</span>
            </div>
          </div>
          
          <!-- Initiative Swap -->
          <div class="shop-item">
            <div class="item-header">
              <i class="fas fa-exchange-alt"></i>
              <label for="initiative-swap">Initiative Swap</label>
              <span class="cost">${INITIATIVE_SHOP.SWAP.COST} points</span>
            </div>
            <div class="item-description">
              <small>Exchange initiative with another player (requires ${INITIATIVE_SHOP.SWAP.RAISES_REQUIRED} raises, 1x/round)</small>
            </div>
            <div class="item-control checkbox-control">
              <input 
                type="checkbox" 
                id="initiative-swap" 
                name="initiativeSwap"
                ${rawInitiative < INITIATIVE_SHOP.SWAP.COST ? 'disabled' : ''}
              />
              <label for="initiative-swap" class="checkbox-label">Unlock Initiative Swap</label>
            </div>
          </div>
          
          <!-- Extra Attack -->
          <div class="shop-item">
            <div class="item-header">
              <i class="fas fa-bolt"></i>
              <label for="extra-attack">Extra Attack</label>
              <span class="cost">${INITIATIVE_SHOP.EXTRA_ATTACK.COST} points</span>
            </div>
            <div class="item-description">
              <small>Gain +1 additional Attack Action this round (max ${INITIATIVE_SHOP.EXTRA_ATTACK.MAX_PER_ROUND}x/round)</small>
            </div>
            <div class="item-control checkbox-control">
              <input 
                type="checkbox" 
                id="extra-attack" 
                name="extraAttack"
                ${rawInitiative < INITIATIVE_SHOP.EXTRA_ATTACK.COST ? 'disabled' : ''}
              />
              <label for="extra-attack" class="checkbox-label">Buy Extra Attack</label>
            </div>
          </div>
          
          <!-- Summary -->
          <div class="shop-summary">
            <div class="summary-row">
              <span class="label">Total Cost:</span>
              <span class="value cost-value">0</span>
            </div>
            <div class="summary-row final">
              <span class="label">Final Initiative:</span>
              <span class="value final-initiative-value">${rawInitiative}</span>
            </div>
            <div class="error-message" style="display: none;">
              <i class="fas fa-exclamation-triangle"></i>
              <span class="error-text"></span>
            </div>
          </div>
        </form>
      </div>
    `;
  }
  
  /**
   * Activate event listeners on the dialog
   */
  private static _activateListeners(html: JQuery, data: any): void {
    const { rawInitiative } = data;
    
    // Update summary whenever values change
    const updateSummary = () => {
      const extraMovement = parseInt((html.find('[name="extraMovement"]').val() as string) || '0');
      const initiativeSwap = html.find('[name="initiativeSwap"]').is(':checked');
      const extraAttack = html.find('[name="extraAttack"]').is(':checked');
      
      const purchases = {
        extraMovement,
        initiativeSwap,
        extraAttack
      };
      
      const cost = calculateShopCost(purchases);
      const finalInitiative = Math.max(0, rawInitiative - cost);
      const validation = validateShopPurchases(rawInitiative, purchases);
      
      html.find('.cost-value').text(cost);
      html.find('.final-initiative-value').text(finalInitiative);
      
      // Show/hide error
      if (!validation.valid) {
        html.find('.error-message').show();
        html.find('.error-text').text(validation.error || 'Invalid purchase');
        html.find('button[data-button="confirm"]').prop('disabled', true);
      } else {
        html.find('.error-message').hide();
        html.find('button[data-button="confirm"]').prop('disabled', false);
      }
    };
    
    // Plus/minus buttons for movement
    html.find('.quantity-btn').on('click', (event) => {
      event.preventDefault();
      const button = $(event.currentTarget);
      const target = button.data('target');
      const input = html.find(`#${target}`);
      const currentVal = parseInt((input.val() as string) || '0');
      const step = 2;
      const max = parseInt(input.attr('max') || '999');
      
      if (button.hasClass('plus')) {
        input.val(Math.min(max, currentVal + step));
      } else {
        input.val(Math.max(0, currentVal - step));
      }
      
      updateSummary();
    });
    
    // Input changes
    html.find('input').on('change', updateSummary);
    
    // Initial summary update
    updateSummary();
  }
  
  /**
   * Parse form data and return the result
   */
  private static _parseFormData(html: JQuery, rawInitiative: number): InitiativeShopResult {
    const extraMovement = parseInt((html.find('[name="extraMovement"]').val() as string) || '0');
    const initiativeSwap = html.find('[name="initiativeSwap"]').is(':checked');
    const extraAttack = html.find('[name="extraAttack"]').is(':checked');
    
    const purchases = {
      extraMovement,
      initiativeSwap,
      extraAttack
    };
    
    const spentPoints = calculateShopCost(purchases);
    const finalInitiative = Math.max(0, rawInitiative - spentPoints);
    
    return {
      finalInitiative,
      spentPoints,
      purchases,
      cancelled: false
    };
  }
}

