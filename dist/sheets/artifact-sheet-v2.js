/**
 * Artifact Item Sheet V2 (Foundry v13 ApplicationV2)
 * Supports editing artifact powers with the new schema
 */
import { isOldPowerStructure, migrateArtifactPower } from '../utils/power-migration.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
// Type workaround for Mixin
const BaseSheet = HandlebarsApplicationMixin(ApplicationV2);
export class ArtifactSheetV2 extends BaseSheet {
    _item;
    static DEFAULT_OPTIONS = {
        id: 'mastery-artifact-sheet',
        classes: ['mastery-system', 'sheet', 'item', 'artifact'],
        width: 700,
        height: 800,
        resizable: true,
        tabs: [
            {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'description'
            }
        ]
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs' }
    };
    constructor(item, options = {}) {
        const mergedOptions = foundry.utils.mergeObject(ArtifactSheetV2.DEFAULT_OPTIONS, options);
        super(mergedOptions);
        this._item = item;
    }
    get item() {
        return this._item;
    }
    get document() {
        return this._item;
    }
    async _prepareContext(_options) {
        const system = this.item.system;
        // Ensure powers are migrated
        if (system.powers && Array.isArray(system.powers)) {
            system.powers = system.powers.map((power) => {
                if (isOldPowerStructure(power)) {
                    return migrateArtifactPower(power);
                }
                return power;
            });
        }
        // Prepare power data for template
        const powers = (system.powers || []).map((power, index) => {
            const powerData = {
                ...power,
                index,
                expanded: false, // UI state for expanded editor
                tagsString: Array.isArray(power.tags) ? power.tags.join(', ') : ''
            };
            // Ensure all 4 levels exist and prepare them as arrays for template
            if (!powerData.levels) {
                powerData.levels = {
                    '1': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '2': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '3': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '4': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] }
                };
            }
            // Convert levels to array for easier template iteration
            powerData.levelsArray = [
                { key: '1', data: powerData.levels['1'] },
                { key: '2', data: powerData.levels['2'] },
                { key: '3', data: powerData.levels['3'] },
                { key: '4', data: powerData.levels['4'] }
            ];
            return powerData;
        });
        return {
            item: this.item,
            system,
            powers,
            isEditable: this.item.isOwner,
            categories: ['active', 'activeBuff', 'utility', 'movement', 'reaction', 'passive'],
            actionCosts: ['attack', 'movement', 'full', 'reaction', 'none'],
            rangeKinds: ['self', 'touch', 'melee', 'distance'],
            aoeShapes: ['none', 'radius', 'cone', 'line', 'burst'],
            durationKinds: ['instant', 'rounds', 'masteryRounds', 'untilNextTurn', 'scene'],
            limitPers: ['round', 'combat', 'day', 'week']
        };
    }
    async _onRender(_element, _options) {
        await super._onRender?.(_element, _options);
        if (!this.item.isOwner)
            return;
        const html = this.element;
        if (!html)
            return;
        // Handle power actions
        html.addEventListener('click', this._onPowerAction.bind(this));
        // Handle form changes - debounced updates
        let formUpdateTimeout = null;
        const handleFormChange = (event) => {
            if (formUpdateTimeout)
                clearTimeout(formUpdateTimeout);
            formUpdateTimeout = window.setTimeout(() => {
                this._onFormChange(event);
            }, 300);
        };
        html.addEventListener('change', handleFormChange);
        html.addEventListener('input', handleFormChange);
        // Handle special add/remove
        html.addEventListener('click', this._onSpecialAction.bind(this));
        // Initialize tabs using Foundry's tab system
        const tabs = html.querySelector('.sheet-tabs');
        if (tabs && !tabs._tabs) {
            new Tabs({ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }).bind(html);
        }
    }
    async _onPowerAction(event) {
        const target = event.target;
        const action = target.dataset.action;
        if (!action)
            return;
        event.preventDefault();
        event.stopPropagation();
        const system = this.item.system;
        const powers = (system.powers || []).map((power) => {
            if (isOldPowerStructure(power)) {
                return migrateArtifactPower(power);
            }
            return power;
        });
        if (action === 'add-power') {
            const newPower = {
                id: foundry.utils.randomID(),
                name: 'New Power',
                category: 'active',
                tags: [],
                cost: { action: 'attack' },
                levels: {
                    '1': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '2': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '3': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] },
                    '4': { type: '', range: null, aoe: null, duration: { kind: 'instant' }, effect: { text: '' }, specials: [] }
                }
            };
            powers.push(newPower);
            await this.item.update({ 'system.powers': powers });
            await this.render();
        }
        else if (action === 'duplicate-power') {
            const index = parseInt(target.dataset.index || '0');
            if (index >= 0 && index < powers.length) {
                const powerToClone = powers[index];
                const cloned = {
                    ...powerToClone,
                    id: foundry.utils.randomID(),
                    name: `${powerToClone.name} (Copy)`
                };
                powers.splice(index + 1, 0, cloned);
                await this.item.update({ 'system.powers': powers });
                await this.render();
            }
        }
        else if (action === 'delete-power') {
            const index = parseInt(target.dataset.index || '0');
            if (index >= 0 && index < powers.length) {
                powers.splice(index, 1);
                await this.item.update({ 'system.powers': powers });
                await this.render();
            }
        }
        else if (action === 'toggle-power') {
            const powerElement = target.closest('.power-item');
            if (powerElement) {
                const editor = powerElement.querySelector('.power-editor');
                if (editor) {
                    editor.classList.toggle('expanded');
                }
            }
        }
    }
    async _onFormChange(event) {
        const target = event.target;
        if (!target.name || !target.name.startsWith('system.'))
            return;
        // Handle tags field (comma-separated string to array)
        if (target.name.includes('.tags') && target.name.startsWith('system.powers.')) {
            const match = target.name.match(/system\.powers\.(\d+)\.tags/);
            if (match) {
                const index = parseInt(match[1]);
                const tagsString = target.value;
                const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);
                const system = this.item.system;
                const powers = [...(system.powers || [])];
                if (index >= 0 && index < powers.length) {
                    const power = { ...powers[index], tags };
                    powers[index] = power;
                    await this.item.update({ 'system.powers': powers });
                    return;
                }
            }
        }
        // Handle power level field updates
        if (target.name.startsWith('system.powers.')) {
            const match = target.name.match(/system\.powers\.(\d+)\.(.+)/);
            if (match) {
                const index = parseInt(match[1]);
                const fieldPath = match[2];
                const system = this.item.system;
                const powers = [...(system.powers || [])];
                if (index >= 0 && index < powers.length) {
                    const power = foundry.utils.deepClone(powers[index]);
                    // Handle level field updates
                    if (fieldPath.startsWith('levels.')) {
                        const levelMatch = fieldPath.match(/levels\.([1234])\.(.+)/);
                        if (levelMatch) {
                            const levelKey = levelMatch[1];
                            const levelField = levelMatch[2];
                            if (!power.levels) {
                                power.levels = {
                                    '1': this._createEmptyLevel(),
                                    '2': this._createEmptyLevel(),
                                    '3': this._createEmptyLevel(),
                                    '4': this._createEmptyLevel()
                                };
                            }
                            const level = foundry.utils.deepClone(power.levels[levelKey]);
                            this._updateLevelField(level, levelField, target.value, target.type);
                            power.levels = { ...power.levels, [levelKey]: level };
                        }
                    }
                    else {
                        // Handle top-level power fields
                        const pathParts = fieldPath.split('.');
                        let current = power;
                        for (let i = 0; i < pathParts.length - 1; i++) {
                            if (!current[pathParts[i]]) {
                                current[pathParts[i]] = {};
                            }
                            current = current[pathParts[i]];
                        }
                        const lastKey = pathParts[pathParts.length - 1];
                        const value = target.type === 'number' ? (target.value === '' ? undefined : parseFloat(target.value)) :
                            target.type === 'checkbox' ? target.checked :
                                target.value;
                        current[lastKey] = value;
                    }
                    powers[index] = power;
                    await this.item.update({ 'system.powers': powers });
                    return;
                }
            }
        }
        // For other system fields, use standard update
        const updateData = {};
        updateData[target.name] = target.type === 'number' ? (target.value === '' ? undefined : parseFloat(target.value)) :
            target.type === 'checkbox' ? target.checked :
                target.value;
        await this.item.update(updateData);
    }
    _updateLevelField(level, fieldPath, value, inputType) {
        const parts = fieldPath.split('.');
        if (parts[0] === 'range') {
            if (parts[1] === 'kind') {
                level.range = value === '' || value === 'none' ? null : { kind: value, m: level.range?.m, note: level.range?.note };
            }
            else if (parts[1] === 'm') {
                if (!level.range)
                    level.range = { kind: 'distance' };
                level.range.m = value === '' ? undefined : (inputType === 'number' ? parseFloat(value) || undefined : parseFloat(value) || undefined);
            }
            else if (parts[1] === 'note') {
                if (!level.range)
                    level.range = { kind: 'distance' };
                level.range.note = value || undefined;
            }
        }
        else if (parts[0] === 'aoe') {
            if (parts[1] === 'shape') {
                level.aoe = value === '' || value === 'none' ? null : { shape: value, m: level.aoe?.m, note: level.aoe?.note };
            }
            else if (parts[1] === 'm') {
                if (!level.aoe)
                    level.aoe = { shape: 'radius' };
                level.aoe.m = value === '' ? undefined : (inputType === 'number' ? parseFloat(value) || undefined : parseFloat(value) || undefined);
            }
            else if (parts[1] === 'note') {
                if (!level.aoe)
                    level.aoe = { shape: 'radius' };
                level.aoe.note = value || undefined;
            }
        }
        else if (parts[0] === 'duration') {
            if (parts[1] === 'kind') {
                level.duration = { ...level.duration, kind: value };
            }
            else if (parts[1] === 'rounds') {
                level.duration = { ...level.duration, rounds: value === '' ? undefined : parseFloat(value) || undefined };
            }
            else if (parts[1] === 'note') {
                level.duration = { ...level.duration, note: value || undefined };
            }
        }
        else if (parts[0] === 'effect') {
            if (parts[1] === 'text') {
                level.effect = { ...level.effect, text: value };
            }
            else if (parts[1] === 'dice') {
                level.effect = { ...level.effect, dice: value || undefined };
            }
        }
        else if (parts[0] === 'type') {
            level.type = value;
        }
    }
    _createEmptyLevel() {
        return {
            type: '',
            range: null,
            aoe: null,
            duration: { kind: 'instant' },
            effect: { text: '' },
            specials: []
        };
    }
    async _onSpecialAction(event) {
        const target = event.target;
        const action = target.dataset.action;
        if (!action || (action !== 'add-special' && action !== 'remove-special'))
            return;
        event.preventDefault();
        event.stopPropagation();
        const powerIndex = parseInt(target.dataset.powerIndex || '0');
        const levelKey = target.dataset.levelKey;
        const specialIndex = target.dataset.specialIndex ? parseInt(target.dataset.specialIndex) : undefined;
        const system = this.item.system;
        const powers = (system.powers || []).map((power) => {
            if (isOldPowerStructure(power)) {
                return migrateArtifactPower(power);
            }
            return power;
        });
        if (powerIndex >= 0 && powerIndex < powers.length) {
            const power = { ...powers[powerIndex] };
            if (!power.levels) {
                power.levels = {
                    '1': this._createEmptyLevel(),
                    '2': this._createEmptyLevel(),
                    '3': this._createEmptyLevel(),
                    '4': this._createEmptyLevel()
                };
            }
            const level = { ...power.levels[levelKey] };
            const specials = [...(level.specials || [])];
            if (action === 'add-special') {
                const key = await this._promptForSpecialKey();
                if (key) {
                    specials.push({ key });
                    level.specials = specials;
                    power.levels = { ...power.levels, [levelKey]: level };
                    powers[powerIndex] = power;
                    await this.item.update({ 'system.powers': powers });
                    await this.render();
                }
            }
            else if (action === 'remove-special' && specialIndex !== undefined) {
                specials.splice(specialIndex, 1);
                level.specials = specials;
                power.levels = { ...power.levels, [levelKey]: level };
                powers[powerIndex] = power;
                await this.item.update({ 'system.powers': powers });
                await this.render();
            }
        }
    }
    async _promptForSpecialKey() {
        return new Promise((resolve) => {
            new Dialog({
                title: 'Add Special',
                content: `
          <form>
            <div class="form-group">
              <label>Special Key:</label>
              <input type="text" name="specialKey" placeholder="e.g., Push, Ignite, Bleed"/>
            </div>
            <div class="form-group">
              <label>Rank (optional):</label>
              <input type="number" name="rank" placeholder="e.g., 2"/>
            </div>
            <div class="form-group">
              <label>Note (optional):</label>
              <input type="text" name="note" placeholder="Additional details"/>
            </div>
          </form>
        `,
                buttons: {
                    add: {
                        label: 'Add',
                        callback: (html) => {
                            const key = html.find('[name="specialKey"]').val();
                            resolve(key?.trim() || null);
                        }
                    },
                    cancel: {
                        label: 'Cancel',
                        callback: () => resolve(null)
                    }
                },
                default: 'add'
            }).render(true);
        });
    }
}
//# sourceMappingURL=artifact-sheet-v2.js.map