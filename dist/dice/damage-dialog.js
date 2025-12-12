/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
/**
 * Show damage dialog after successful attack
 */
export async function showDamageDialog(attacker, target, weapon, raises, _flags) {
    console.log('Mastery System | DEBUG: showDamageDialog - starting', {
        attackerName: attacker.name,
        targetName: target.name,
        hasWeapon: !!weapon,
        raises
    });
    // Calculate base damage from weapon
    const baseDamage = weapon ? (weapon.system?.damage || weapon.system?.weaponDamage || '1d8') : '1d8';
    console.log('Mastery System | DEBUG: showDamageDialog - baseDamage', baseDamage);
    // Get weapon specials
    const weaponSpecials = weapon ? (weapon.system?.specials || []) : [];
    console.log('Mastery System | DEBUG: showDamageDialog - weaponSpecials', weaponSpecials);
    // Calculate power damage (from powers used in attack - for now, we'll need to track this)
    const powerDamage = '0'; // TODO: Get from attack flags if powers were used
    console.log('Mastery System | DEBUG: showDamageDialog - powerDamage', powerDamage);
    // Calculate passive damage (from equipped passives)
    const passiveDamage = await calculatePassiveDamage(attacker);
    console.log('Mastery System | DEBUG: showDamageDialog - passiveDamage', passiveDamage);
    // Collect available specials
    const availableSpecials = await collectAvailableSpecials(attacker, weapon);
    console.log('Mastery System | DEBUG: showDamageDialog - availableSpecials', availableSpecials.length);
    const dialogData = {
        attacker,
        target,
        weapon,
        baseDamage: baseDamage || '0',
        powerDamage: powerDamage || '0',
        passiveDamage: passiveDamage || '0',
        raises: raises || 0,
        availableSpecials: availableSpecials || [],
        weaponSpecials: weaponSpecials || []
    };
    console.log('Mastery System | DEBUG: showDamageDialog - dialogData prepared', {
        baseDamage: dialogData.baseDamage,
        powerDamage: dialogData.powerDamage,
        passiveDamage: dialogData.passiveDamage,
        raises: dialogData.raises,
        availableSpecialsCount: dialogData.availableSpecials.length,
        weaponSpecialsCount: dialogData.weaponSpecials.length
    });
    return new Promise((resolve) => {
        console.log('Mastery System | DEBUG: showDamageDialog - creating dialog', {
            hasData: !!dialogData,
            raises: dialogData.raises,
            baseDamage: dialogData.baseDamage,
            availableSpecials: dialogData.availableSpecials?.length || 0
        });
        try {
            const dialog = new DamageDialog(dialogData, resolve);
            console.log('Mastery System | DEBUG: showDamageDialog - dialog created, rendering...');
            dialog.render(true);
            console.log('Mastery System | DEBUG: showDamageDialog - render called');
        }
        catch (error) {
            console.error('Mastery System | DEBUG: showDamageDialog - error creating dialog', error);
            throw error;
        }
    });
}
/**
 * Calculate passive damage bonuses
 */
async function calculatePassiveDamage(actor) {
    try {
        console.log('Mastery System | DEBUG: calculatePassiveDamage - starting', { actorName: actor.name });
        // Import passive functions to get slots (try multiple paths)
        let passivesModule;
        try {
            console.log('Mastery System | DEBUG: calculatePassiveDamage - trying ../../dist/powers/passives.js');
            passivesModule = await import('../../dist/powers/passives.js');
            console.log('Mastery System | DEBUG: calculatePassiveDamage - loaded passives module', { hasModule: !!passivesModule });
        }
        catch (e) {
            console.warn('Mastery System | DEBUG: calculatePassiveDamage - first import failed', e);
            // Try alternative path
            try {
                console.log('Mastery System | DEBUG: calculatePassiveDamage - trying ../../utils/powers/passives.js');
                passivesModule = await import('../../utils/powers/passives.js');
                console.log('Mastery System | DEBUG: calculatePassiveDamage - loaded passives module from utils', { hasModule: !!passivesModule });
            }
            catch (e2) {
                console.warn('Mastery System | Could not load passives module, skipping passive damage', e2);
                return '0';
            }
        }
        const { getPassiveSlots } = passivesModule;
        const slots = getPassiveSlots(actor);
        const activePassives = slots.filter((slot) => slot.active && slot.passive);
        let totalDamage = 0;
        let damageDice = '';
        // Check each active passive for damage bonuses
        for (const slot of activePassives) {
            const passive = slot.passive;
            // Check if passive has damage bonus in its definition
            if (passive.damageBonus) {
                if (typeof passive.damageBonus === 'number') {
                    totalDamage += passive.damageBonus;
                }
                else if (typeof passive.damageBonus === 'string') {
                    // Parse dice notation like "1d8"
                    damageDice += (damageDice ? ' + ' : '') + passive.damageBonus;
                }
            }
        }
        if (damageDice && totalDamage > 0) {
            return `${damageDice} + ${totalDamage}`;
        }
        else if (damageDice) {
            return damageDice;
        }
        else if (totalDamage > 0) {
            return totalDamage.toString();
        }
        return '0';
    }
    catch (error) {
        console.warn('Mastery System | Could not calculate passive damage:', error);
        return '0';
    }
}
/**
 * Collect all available specials (powers, passives, weapon specials)
 */
async function collectAvailableSpecials(actor, weapon) {
    const specials = [];
    const items = actor.items || [];
    // Get attack powers
    const attackPowers = items.filter((item) => item.type === 'power' &&
        item.system?.powerType === 'active' &&
        item.system?.canUseOnAttack === true);
    for (const power of attackPowers) {
        const system = power.system;
        specials.push({
            id: power.id,
            name: power.name,
            type: 'power',
            description: system.description || '',
            effect: system.effect || ''
        });
    }
    // Get passives that can be used on attack (from passive slots)
    try {
        console.log('Mastery System | DEBUG: collectAvailableSpecials - loading passives module');
        // Try multiple paths for passives module
        let passivesModule;
        try {
            console.log('Mastery System | DEBUG: collectAvailableSpecials - trying ../../dist/powers/passives.js');
            passivesModule = await import('../../dist/powers/passives.js');
            console.log('Mastery System | DEBUG: collectAvailableSpecials - loaded passives module', { hasModule: !!passivesModule });
        }
        catch (e) {
            console.warn('Mastery System | DEBUG: collectAvailableSpecials - first import failed', e);
            try {
                console.log('Mastery System | DEBUG: collectAvailableSpecials - trying ../../utils/powers/passives.js');
                passivesModule = await import('../../utils/powers/passives.js');
                console.log('Mastery System | DEBUG: collectAvailableSpecials - loaded passives module from utils', { hasModule: !!passivesModule });
            }
            catch (e2) {
                console.warn('Mastery System | Could not load passives module for specials', e2);
                return specials; // Return what we have so far
            }
        }
        const { getPassiveSlots } = passivesModule;
        const slots = getPassiveSlots(actor);
        const activePassives = slots.filter((slot) => slot.active && slot.passive);
        for (const slot of activePassives) {
            const passive = slot.passive;
            // Check if passive can be used on attack (this would need to be defined in passive data)
            if (passive.canUseOnAttack !== false) { // Default to true if not specified
                specials.push({
                    id: `passive-${slot.slotIndex}`,
                    name: passive.name,
                    type: 'passive',
                    description: passive.description || '',
                    effect: passive.effect || ''
                });
            }
        }
    }
    catch (error) {
        console.warn('Mastery System | Could not load passives for specials:', error);
    }
    // Get weapon specials
    if (weapon && weapon.system?.specials) {
        const weaponSpecials = weapon.system.specials;
        for (const special of weaponSpecials) {
            specials.push({
                id: `weapon-${special}`,
                name: special,
                type: 'weapon',
                description: `Weapon special: ${special}`,
                effect: special
            });
        }
    }
    return specials;
}
/**
 * Damage Dialog Application
 * Implements _renderHTML and _replaceHTML for Foundry VTT v13 compatibility
 */
class DamageDialog extends Application {
    data;
    resolve;
    raiseSelections = new Map();
    constructor(data, resolve) {
        super({});
        this.data = data;
        this.resolve = resolve;
        console.log('Mastery System | DEBUG: DamageDialog constructor', {
            hasData: !!data,
            raises: data.raises,
            baseDamage: data.baseDamage,
            availableSpecials: data.availableSpecials?.length || 0
        });
    }
    static get defaultOptions() {
        const opts = super.defaultOptions || {};
        console.log('Mastery System | DEBUG: DamageDialog defaultOptions - super.defaultOptions', super.defaultOptions);
        opts.id = 'mastery-damage-dialog';
        opts.title = 'Calculate Damage';
        opts.template = 'systems/mastery-system/templates/dice/damage-dialog.hbs';
        opts.width = 600;
        opts.height = 'auto';
        opts.resizable = true;
        opts.classes = ['mastery-damage-dialog'];
        opts.popOut = true;
        console.log('Mastery System | DEBUG: DamageDialog defaultOptions - final opts', opts);
        return opts;
    }
    // Implement required methods for Handlebars templates (Foundry VTT v13)
    async _renderHTML(data) {
        const template = this.constructor.defaultOptions.template || this.options.template;
        if (!template) {
            throw new Error('Template path is required');
        }
        console.log('Mastery System | DEBUG: DamageDialog _renderHTML - rendering template', {
            template,
            hasData: !!data,
            dataKeys: data ? Object.keys(data) : []
        });
        // Get data if not provided
        const templateData = data || await this.getData();
        console.log('Mastery System | DEBUG: DamageDialog _renderHTML - templateData', {
            hasData: !!templateData,
            keys: templateData ? Object.keys(templateData) : [],
            baseDamage: templateData?.baseDamage,
            powerDamage: templateData?.powerDamage,
            passiveDamage: templateData?.passiveDamage,
            raises: templateData?.raises,
            availableSpecials: templateData?.availableSpecials?.length || 0,
            attacker: templateData?.attacker ? templateData.attacker.name : 'none',
            target: templateData?.target ? templateData.target.name : 'none'
        });
        const html = await foundry.applications.handlebars.renderTemplate(template, templateData);
        console.log('Mastery System | DEBUG: DamageDialog _renderHTML - template rendered', {
            htmlLength: html.length,
            htmlPreview: html.substring(0, 500)
        });
        return $(html);
    }
    async _replaceHTML(element, html) {
        console.log('Mastery System | DEBUG: DamageDialog _replaceHTML - replacing element');
        element.replaceWith(html);
    }
    async getData() {
        console.log('Mastery System | DEBUG: DamageDialog getData() - called', {
            hasData: !!this.data,
            raises: this.data?.raises,
            baseDamage: this.data?.baseDamage,
            powerDamage: this.data?.powerDamage,
            passiveDamage: this.data?.passiveDamage,
            availableSpecials: this.data?.availableSpecials?.length || 0,
            weaponSpecials: this.data?.weaponSpecials?.length || 0,
            attacker: this.data?.attacker?.name,
            target: this.data?.target?.name
        });
        const data = {
            attacker: this.data?.attacker || null,
            target: this.data?.target || null,
            weapon: this.data?.weapon || null,
            baseDamage: this.data?.baseDamage || '0',
            powerDamage: this.data?.powerDamage || '0',
            passiveDamage: this.data?.passiveDamage || '0',
            raises: this.data?.raises || 0,
            availableSpecials: this.data?.availableSpecials || [],
            weaponSpecials: this.data?.weaponSpecials || [],
            raiseSelections: Array.from(this.raiseSelections.entries()).map(([index, selection]) => ({
                index,
                ...selection
            }))
        };
        console.log('Mastery System | DEBUG: DamageDialog getData() - returning', {
            hasData: !!data,
            raises: data.raises,
            baseDamage: data.baseDamage,
            powerDamage: data.powerDamage,
            passiveDamage: data.passiveDamage,
            availableSpecials: data.availableSpecials?.length || 0,
            weaponSpecials: data.weaponSpecials?.length || 0,
            raiseSelectionsCount: data.raiseSelections?.length || 0,
            attackerName: data.attacker ? data.attacker.name : 'none',
            targetName: data.target ? data.target.name : 'none'
        });
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        // Handle raise selection changes
        html.find('.raise-selection').on('change', (ev) => {
            const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
            const selectionType = $(ev.currentTarget).val();
            if (selectionType === 'damage') {
                this.raiseSelections.set(raiseIndex, { type: 'damage', value: '1d8' });
            }
            else if (selectionType === 'special') {
                // Show special selection dropdown
                const specialSelect = html.find(`.special-select[data-raise-index="${raiseIndex}"]`);
                specialSelect.show();
            }
            else {
                this.raiseSelections.delete(raiseIndex);
                html.find(`.special-select[data-raise-index="${raiseIndex}"]`).hide();
            }
            this.render();
        });
        // Handle special selection
        html.find('.special-select').on('change', (ev) => {
            const raiseIndex = parseInt($(ev.currentTarget).data('raise-index'));
            const specialId = $(ev.currentTarget).val();
            this.raiseSelections.set(raiseIndex, { type: 'special', value: specialId });
        });
        // Handle roll damage button
        html.find('.roll-damage-btn').on('click', async () => {
            const result = await this.calculateDamage();
            this.resolve(result);
            this.close();
        });
        // Handle cancel button
        html.find('.cancel-btn').on('click', () => {
            this.resolve(null);
            this.close();
        });
    }
    async calculateDamage() {
        // Roll base damage
        const baseDamage = await this.rollDice(this.data.baseDamage);
        // Roll power damage
        const powerDamage = await this.rollDice(this.data.powerDamage || '0');
        // Roll passive damage
        const passiveDamage = await this.rollDice(this.data.passiveDamage || '0');
        // Calculate raise damage and collect specials
        let raiseDamage = 0;
        const specialsUsed = [];
        for (let i = 0; i < this.data.raises; i++) {
            const selection = this.raiseSelections.get(i);
            if (selection) {
                if (selection.type === 'damage') {
                    raiseDamage += await this.rollDice('1d8');
                }
                else if (selection.type === 'special') {
                    const special = this.data.availableSpecials.find(s => s.id === selection.value);
                    if (special) {
                        specialsUsed.push(special.name);
                    }
                }
            }
        }
        const totalDamage = baseDamage + powerDamage + passiveDamage + raiseDamage;
        return {
            baseDamage,
            powerDamage,
            passiveDamage,
            raiseDamage,
            specialsUsed,
            totalDamage
        };
    }
    async rollDice(diceNotation) {
        if (!diceNotation || diceNotation === '0')
            return 0;
        // Parse dice notation (e.g., "2d8+3" or "1d8")
        const match = diceNotation.match(/(\d+)d(\d+)([+-]\d+)?/);
        if (!match) {
            // Try to parse as flat number
            const num = parseInt(diceNotation);
            return isNaN(num) ? 0 : num;
        }
        const numDice = parseInt(match[1]);
        const dieSize = parseInt(match[2]);
        const modifier = match[3] ? parseInt(match[3]) : 0;
        let total = 0;
        for (let i = 0; i < numDice; i++) {
            total += Math.floor(Math.random() * dieSize) + 1;
        }
        return total + modifier;
    }
}
//# sourceMappingURL=damage-dialog.js.map