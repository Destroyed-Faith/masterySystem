/**
 * XP Management Settings Application
 * Allows GM to view character XP spending and grant XP allowances
 */

// Use ApplicationV2 with HandlebarsApplicationMixin if available, otherwise fall back to Application
let BaseApplication: any;
if ((foundry as any)?.applications?.api?.ApplicationV2 && (foundry as any)?.applications?.api?.HandlebarsApplicationMixin) {
  BaseApplication = (foundry as any).applications.api.ApplicationV2;
  // Apply HandlebarsApplicationMixin
  const HandlebarsMixin = (foundry as any).applications.api.HandlebarsApplicationMixin;
  BaseApplication = HandlebarsMixin(BaseApplication);
} else {
  BaseApplication = Application;
}

export class XpManagementSettings extends BaseApplication {
  static get defaultOptions() {
    const baseOptions = super.defaultOptions || {};
    return foundry.utils.mergeObject(baseOptions, {
      id: 'mastery-xp-management',
      title: 'Character XP Management',
      template: 'systems/mastery-system/templates/settings/xp-management.hbs',
      width: 800,
      height: 600,
      resizable: true,
      tabs: [
        {
          navSelector: '.tabs',
          contentSelector: '.content',
          initial: 'characters'
        }
      ]
    });
  }

  getData(options?: any) {
    const data: any = super.getData ? super.getData(options) : {};
    
    // Get all player characters
    const characters = (game as any).actors?.filter((actor: any) => actor.type === 'character') || [];
    
    // Prepare character data with XP information
    data.characters = characters.map((actor: any) => {
      const system = actor.system || {};
      const points = system.points || {};
      const xp = system.xp || {};
      
      // Get XP state (backward compatible)
      const totalEarned = xp.totalEarned ?? 0;
      const totalSpent = xp.totalSpent ?? 0;
      const spentAttributes = xp.spentAttributes ?? 0;
      const available = points.xp ?? 0;
      const maxAttributeSpend = Math.floor(totalEarned / 2);
      
      return {
        id: actor.id,
        name: actor.name,
        img: actor.img,
        player: (game as any).users?.find((u: any) => u.character?.id === actor.id)?.name || 'Unassigned',
        xp: {
          spent: totalSpent,
          available: available,
          totalEarned: totalEarned,
          spentAttributes: spentAttributes,
          maxAttributeSpend: maxAttributeSpend
        }
      };
    });
    
    return data;
  }

  // Implement required methods for ApplicationV2 with Handlebars
  async _renderHTML(_data?: any) {
    const template = (this.constructor as any).defaultOptions?.template || this.options.template;
    if (!template) {
      throw new Error('Template path is required');
    }
    const templateData = await this.getData();
    const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
    return $(html);
  }

  async _replaceHTML(element: JQuery, html: JQuery) {
    element.replaceWith(html);
  }

  activateListeners(html: JQuery) {
    super.activateListeners(html);
    
    // Helper function to get XP state
    const getXpState = (actor: any) => {
      const system = actor.system || {};
      const points = system.points || {};
      const xp = system.xp || {};
      return {
        available: points.xp ?? 0,
        totalEarned: xp.totalEarned ?? 0,
        totalSpent: xp.totalSpent ?? 0,
        spentAttributes: xp.spentAttributes ?? 0,
        history: xp.history ?? []
      };
    };
    
    // Helper function to push XP history
    const pushXpHistory = (actor: any, entry: any) => {
      const system = actor.system || {};
      if (!system.xp) {
        system.xp = { totalEarned: 0, totalSpent: 0, spentAttributes: 0, history: [] };
      }
      if (!system.xp.history) {
        system.xp.history = [];
      }
      system.xp.history.push(entry);
      if (system.xp.history.length > 200) {
        system.xp.history = system.xp.history.slice(-200);
      }
    };
    
    // Handle grant XP buttons
    html.find('.grant-xp-btn').on('click', async (event) => {
      const button = $(event.currentTarget);
      const characterId = button.data('character-id');
      const amount = parseInt(button.siblings('.xp-amount-input').val() as string) || 0;
      
      if (amount <= 0) {
        ui.notifications?.warn('Please enter a valid amount greater than 0.');
        return;
      }
      
      const actor = (game as any).actors?.get(characterId);
      if (!actor) {
        ui.notifications?.error('Character not found.');
        return;
      }
      
      const xpState = getXpState(actor);
      const beforeState = {
        available: xpState.available,
        totalEarned: xpState.totalEarned,
        totalSpent: xpState.totalSpent,
        spentAttributes: xpState.spentAttributes
      };
      
      const updates: any = {
        'system.points.xp': xpState.available + amount,
        'system.xp.totalEarned': xpState.totalEarned + amount
      };
      
      if (!actor.system.xp) {
        updates['system.xp.totalSpent'] = 0;
        updates['system.xp.spentAttributes'] = 0;
        updates['system.xp.history'] = [];
      }
      
      await actor.update(updates);
      
      // Add history entry
      const user = (game as any).user;
      const historyEntry = {
        ts: Date.now(),
        userId: user?.id || '',
        userName: user?.name || 'System',
        kind: 'grant',
        category: 'xp',
        amount: amount,
        before: beforeState,
        after: {
          available: xpState.available + amount,
          totalEarned: xpState.totalEarned + amount,
          totalSpent: xpState.totalSpent,
          spentAttributes: xpState.spentAttributes
        }
      };
      pushXpHistory(actor, historyEntry);
      await actor.update({ 'system.xp.history': actor.system.xp.history });
      
      ui.notifications?.info(`Granted ${amount} XP to ${actor.name}.`);
      
      // Re-render to update display
      this.render();
    });
    
    // Handle bulk grant
    html.find('.bulk-grant-btn').on('click', async (event) => {
      const amount = parseInt(html.find('.bulk-xp-amount').val() as string) || 0;
      
      if (amount <= 0) {
        ui.notifications?.warn('Please enter a valid amount greater than 0.');
        return;
      }
      
      const characters = (game as any).actors?.filter((actor: any) => actor.type === 'character') || [];
      let updated = 0;
      const user = (game as any).user;
      
      for (const actor of characters) {
        const xpState = getXpState(actor);
        const beforeState = {
          available: xpState.available,
          totalEarned: xpState.totalEarned,
          totalSpent: xpState.totalSpent,
          spentAttributes: xpState.spentAttributes
        };
        
        const updates: any = {
          'system.points.xp': xpState.available + amount,
          'system.xp.totalEarned': xpState.totalEarned + amount
        };
        
        if (!actor.system.xp) {
          updates['system.xp.totalSpent'] = 0;
          updates['system.xp.spentAttributes'] = 0;
          updates['system.xp.history'] = [];
        }
        
        await actor.update(updates);
        
        // Add history entry
        const historyEntry = {
          ts: Date.now(),
          userId: user?.id || '',
          userName: user?.name || 'System',
          kind: 'grant',
          category: 'xp',
          amount: amount,
          before: beforeState,
          after: {
            available: xpState.available + amount,
            totalEarned: xpState.totalEarned + amount,
            totalSpent: xpState.totalSpent,
            spentAttributes: xpState.spentAttributes
          }
        };
        pushXpHistory(actor, historyEntry);
        await actor.update({ 'system.xp.history': actor.system.xp.history });
        updated++;
      }
      
      ui.notifications?.info(`Granted ${amount} XP to ${updated} characters.`);
      
      // Re-render to update display
      this.render();
    });
    
    // History button
    html.find('.history-xp-btn').on('click', async (event) => {
      const button = $(event.currentTarget);
      const characterId = button.data('character-id');
      
      const actor = (game as any).actors?.get(characterId);
      if (!actor) {
        ui.notifications?.error('Character not found.');
        return;
      }
      
      const xpState = getXpState(actor);
      const history = xpState.history.slice(-50).reverse(); // Last 50, newest first
      
      let historyContent = '<div class="xp-history-dialog">';
      historyContent += `<h3>XP History: ${actor.name}</h3>`;
      historyContent += '<table class="xp-history-table"><thead><tr>';
      historyContent += '<th>Time</th><th>Kind</th><th>Category</th><th>Amount</th><th>Note/Details</th>';
      historyContent += '</tr></thead><tbody>';
      
      if (history.length === 0) {
        historyContent += '<tr><td colspan="5" class="empty-message">No history entries.</td></tr>';
      } else {
        history.forEach((entry: any) => {
          const date = new Date(entry.ts);
          const timeStr = date.toLocaleString();
          const detailsStr = entry.details ? JSON.stringify(entry.details, null, 0).substring(0, 100) : (entry.note || '—');
          historyContent += `<tr>`;
          historyContent += `<td>${timeStr}</td>`;
          historyContent += `<td>${entry.kind}</td>`;
          historyContent += `<td>${entry.category}</td>`;
          historyContent += `<td>${entry.amount}</td>`;
          historyContent += `<td title="${detailsStr.length > 100 ? detailsStr : ''}">${detailsStr.length > 50 ? detailsStr.substring(0, 50) + '...' : detailsStr}</td>`;
          historyContent += `</tr>`;
        });
      }
      
      historyContent += '</tbody></table>';
      
      if ((game as any).user?.isGM && history.length > 0) {
        historyContent += '<div class="history-actions">';
        historyContent += `<button type="button" class="clear-history-btn" data-character-id="${characterId}">Clear History</button>`;
        historyContent += '</div>';
      }
      
      historyContent += '</div>';
      
      new Dialog({
        title: `XP History: ${actor.name}`,
        content: historyContent,
        buttons: {
          close: {
            label: 'Close',
            callback: () => {}
          }
        },
        default: 'close',
        render: (html: JQuery) => {
          html.find('.clear-history-btn').on('click', async () => {
            await actor.update({ 'system.xp.history': [] });
            ui.notifications?.info(`Cleared XP history for ${actor.name}.`);
            this.render();
            html.closest('.dialog').find('.close').click();
          });
        }
      }).render(true);
    });
  }
}

