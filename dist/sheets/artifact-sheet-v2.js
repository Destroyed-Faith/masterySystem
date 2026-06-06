/**
 * Artifact Item Sheet (Foundry v13)
 *
 * Built on the proven classic `ItemSheet` base (same as `MasteryItemSheet`)
 * so that `item.sheet` resolves and double-click opens reliably — a plain
 * ApplicationV2 is NOT a document sheet and makes `item.sheet` null, which is
 * what previously threw `cannot read properties of null (reading 'render')`
 * when clicking an artifact in the Items directory.
 *
 * Provides a read-friendly summary (slot / profile / level, Base Values, and
 * the per-level abilities from `system.levelProgression`) plus GM power editing.
 */
import { EMBEDDED_POWER_ACTION_COSTS, EMBEDDED_POWER_AOE_SHAPES, EMBEDDED_POWER_CATEGORIES, EMBEDDED_POWER_DURATION_KINDS, EMBEDDED_POWER_LIMIT_PERS, EMBEDDED_POWER_RANGE_KINDS, createDefaultEmbeddedPower, ensurePowerLevels } from '../utils/embedded-power-ui-constants.js';
import { isOldPowerStructure, migrateArtifactPower } from '../utils/power-migration.js';
import { ARTIFACT_SLOT_LABELS, BASE_PROFILE_LABELS, BASE_VALUE_TYPE_LABELS, } from '../utils/artifact-rules.js';
export class ArtifactSheetV2 extends foundry.appv1.sheets.ItemSheet {
    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['mastery-system', 'sheet', 'item', 'artifact-sheet-v2'],
            width: 700,
            height: 800,
            resizable: true,
            submitOnChange: true,
            closeOnSubmit: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs',
                    contentSelector: '.sheet-body',
                    initial: 'description'
                }
            ]
        });
    }
    /** @override */
    get template() {
        return 'systems/mastery-system/templates/item/artifact-sheet-v2.hbs';
    }
    /** @override */
    getData(options) {
        const context = super.getData(options);
        const item = this.item;
        const system = item.system;
        // Migrate any legacy embedded powers in place for display.
        if (system.powers && Array.isArray(system.powers)) {
            system.powers = system.powers.map((power) => isOldPowerStructure(power) ? migrateArtifactPower(power) : power);
        }
        const powers = (system.powers || []).map((power, index) => {
            const powerData = {
                ...power,
                index,
                tagsString: Array.isArray(power.tags) ? power.tags.join(', ') : '',
            };
            powerData.levels = ensurePowerLevels(powerData);
            powerData.levelsArray = [
                { key: '1', data: powerData.levels['1'] },
                { key: '2', data: powerData.levels['2'] },
                { key: '3', data: powerData.levels['3'] },
                { key: '4', data: powerData.levels['4'] },
            ];
            return powerData;
        });
        // ---- Read-friendly summary (what the artifact is + what it does) ----
        const slotKey = String(system.slot || '');
        const profileKey = String(system.baseProfile || '');
        const currentLevel = Math.max(1, Math.min(10, Number(system.currentLevel) || Number(system.level) || 1));
        const baseValueRows = (Array.isArray(system.baseValues) ? system.baseValues : []).map((bv) => ({
            slot: String(bv.slot || '').toUpperCase(),
            typeLabel: BASE_VALUE_TYPE_LABELS[bv.type] || bv.type || '',
            label: bv.label || '',
            value: bv.value != null && bv.value !== '' ? String(bv.value) : bv.note || '',
        }));
        const abilities = (Array.isArray(system.levelProgression) ? system.levelProgression : [])
            .slice()
            .sort((a, b) => (Number(a?.level) || 0) - (Number(b?.level) || 0))
            .map((row) => ({
            level: Number(row.level) || 1,
            name: row.name || '',
            type: row.type || '',
            effect: row.effect || '',
            special: row.special || '',
            unlocked: (Number(row.level) || 1) <= currentLevel,
        }));
        context.item = item;
        context.system = system;
        context.powers = powers;
        context.isEditable = this.isEditable;
        context.summary = {
            slotLabel: ARTIFACT_SLOT_LABELS[slotKey] || '',
            baseProfileLabel: BASE_PROFILE_LABELS[profileKey] || '',
            currentLevel,
            baseValues: baseValueRows,
            abilities,
            hasAbilities: abilities.length > 0,
            hasBaseValues: baseValueRows.length > 0,
        };
        context.categories = EMBEDDED_POWER_CATEGORIES;
        context.actionCosts = EMBEDDED_POWER_ACTION_COSTS;
        context.rangeKinds = EMBEDDED_POWER_RANGE_KINDS;
        context.aoeShapes = EMBEDDED_POWER_AOE_SHAPES;
        context.durationKinds = EMBEDDED_POWER_DURATION_KINDS;
        context.limitPers = EMBEDDED_POWER_LIMIT_PERS;
        return context;
    }
    /** @override */
    activateListeners(html) {
        super.activateListeners(html);
        if (!this.isEditable)
            return;
        // Delegated so dynamically-rendered power rows keep working after re-render.
        html.on('click', '[data-action]', (ev) => {
            const el = ev.currentTarget;
            const action = el.dataset.action;
            if (!action)
                return;
            if (action === 'add-special' || action === 'remove-special') {
                void this._onSpecialAction(el);
            }
            else {
                void this._onPowerAction(el);
            }
        });
        // Keep the comma-separated tag field in sync as an array on change.
        html.on('change', 'input[name$=".tags"]', (ev) => {
            const input = ev.currentTarget;
            const m = input.name.match(/system\.powers\.(\d+)\.tags/);
            if (!m)
                return;
            const index = parseInt(m[1], 10);
            const system = this.item.system;
            const powers = foundry.utils.deepClone(system.powers || []);
            if (index >= 0 && index < powers.length) {
                powers[index] = {
                    ...powers[index],
                    tags: input.value.split(',').map((t) => t.trim()).filter(Boolean),
                };
                void this.item.update({ 'system.powers': powers });
            }
        });
    }
    /**
     * Rebuild the powers array (and other array-shaped fields) from the flattened
     * form data. The classic ItemSheet would otherwise expand `system.powers.0.x`
     * into an index-keyed object and clobber the array.
     * @override
     */
    async _updateObject(_event, formData) {
        const expanded = foundry.utils.expandObject(formData);
        const sys = expanded.system || {};
        if (sys.powers && typeof sys.powers === 'object' && !Array.isArray(sys.powers)) {
            const current = foundry.utils.deepClone(this.item.system.powers || []);
            for (const [k, patch] of Object.entries(sys.powers)) {
                const idx = Number(k);
                if (!Number.isInteger(idx) || idx < 0)
                    continue;
                const merged = foundry.utils.mergeObject(current[idx] || {}, patch, { inplace: false });
                if (typeof merged.tags === 'string') {
                    merged.tags = merged.tags.split(',').map((t) => t.trim()).filter(Boolean);
                }
                current[idx] = merged;
            }
            sys.powers = current;
        }
        if (sys.bonuses && typeof sys.bonuses.specials === 'string') {
            sys.bonuses.specials = sys.bonuses.specials
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean);
        }
        expanded.system = sys;
        return this.item.update(expanded);
    }
    async _onPowerAction(target) {
        const action = target.dataset.action;
        if (!action)
            return;
        const system = this.item.system;
        const powers = (system.powers || []).map((power) => isOldPowerStructure(power) ? migrateArtifactPower(power) : power);
        if (action === 'add-power') {
            powers.push(createDefaultEmbeddedPower(foundry.utils.randomID()));
            await this.item.update({ 'system.powers': powers });
        }
        else if (action === 'duplicate-power') {
            const index = parseInt(target.dataset.index || '0', 10);
            if (index >= 0 && index < powers.length) {
                const powerToClone = powers[index];
                const cloned = {
                    ...powerToClone,
                    id: foundry.utils.randomID(),
                    name: `${powerToClone.name} (Copy)`,
                };
                powers.splice(index + 1, 0, cloned);
                await this.item.update({ 'system.powers': powers });
            }
        }
        else if (action === 'delete-power') {
            const index = parseInt(target.dataset.index || '0', 10);
            if (index >= 0 && index < powers.length) {
                powers.splice(index, 1);
                await this.item.update({ 'system.powers': powers });
            }
        }
        else if (action === 'toggle-power') {
            const powerElement = target.closest('.power-item');
            const editor = powerElement?.querySelector('.power-editor');
            if (editor)
                editor.style.display = editor.style.display === 'none' ? '' : 'none';
        }
    }
    _createEmptyLevel() {
        return {
            type: '',
            range: null,
            aoe: null,
            duration: { kind: 'instant' },
            effect: { text: '' },
            specials: [],
        };
    }
    async _onSpecialAction(target) {
        const action = target.dataset.action;
        if (action !== 'add-special' && action !== 'remove-special')
            return;
        const powerIndex = parseInt(target.dataset.powerIndex || '0', 10);
        const levelKey = target.dataset.levelKey;
        const specialIndex = target.dataset.specialIndex ? parseInt(target.dataset.specialIndex, 10) : undefined;
        const system = this.item.system;
        const powers = (system.powers || []).map((power) => isOldPowerStructure(power) ? migrateArtifactPower(power) : power);
        if (powerIndex < 0 || powerIndex >= powers.length)
            return;
        const power = { ...powers[powerIndex] };
        if (!power.levels) {
            power.levels = {
                '1': this._createEmptyLevel(),
                '2': this._createEmptyLevel(),
                '3': this._createEmptyLevel(),
                '4': this._createEmptyLevel(),
            };
        }
        const level = { ...power.levels[levelKey] };
        const specials = [...(level.specials || [])];
        if (action === 'add-special') {
            const key = await this._promptForSpecialKey();
            if (!key)
                return;
            specials.push({ key });
        }
        else if (action === 'remove-special' && specialIndex !== undefined) {
            specials.splice(specialIndex, 1);
        }
        else {
            return;
        }
        level.specials = specials;
        power.levels = { ...power.levels, [levelKey]: level };
        powers[powerIndex] = power;
        await this.item.update({ 'system.powers': powers });
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
          </form>
        `,
                buttons: {
                    add: {
                        label: 'Add',
                        callback: (html) => {
                            const key = html.find('[name="specialKey"]').val();
                            resolve(key?.trim() || null);
                        },
                    },
                    cancel: { label: 'Cancel', callback: () => resolve(null) },
                },
                default: 'add',
            }).render(true);
        });
    }
}
//# sourceMappingURL=artifact-sheet-v2.js.map