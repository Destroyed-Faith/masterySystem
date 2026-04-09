/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */
import { ARTIFACT_GEAR_SLOT_OPTIONS, getArtifactWeaponDamagePresets, getArtifactWeaponInnateOptions, getArtifactWeaponSpecialOptions } from '../utils/artifact-node-options.js';
// Use V1 Application for reliable template rendering in v13
const BaseDialog = foundry?.appv1?.Application || Application;
const DAMAGE_PRESETS = getArtifactWeaponDamagePresets();
const PRESET_VALUES = new Set(DAMAGE_PRESETS.map((p) => p.value));
function defaultWeaponProfile() {
    return {
        weaponType: 'melee',
        damage: '1d8',
        range: '0m',
        hands: 1,
        innateAbilities: [],
        specials: []
    };
}
function defaultArmorProfile() {
    return { type: 'light', armorValue: 0, evadeModifier: 0, skillPenalty: '' };
}
function defaultShieldProfile() {
    return { type: 'parry', shieldValue: 0, evadeBonus: 0, skillPenalty: '' };
}
/** Normalize legacy `bonuses` into profiles when new fields are missing. */
function resolveProfiles(system) {
    const bonuses = system.bonuses || { attack: 0, damage: '', defense: 0, specials: [] };
    let artifactKind = system.artifactKind || 'weapon';
    if (!['weapon', 'armor', 'shield', 'gear'].includes(artifactKind))
        artifactKind = 'weapon';
    const gearSlot = typeof system.gearSlot === 'string' ? system.gearSlot : '';
    let weapon = system.artifactWeapon
        ? foundry.utils.duplicate(system.artifactWeapon)
        : defaultWeaponProfile();
    if (!system.artifactWeapon) {
        if (bonuses.damage)
            weapon.damage = String(bonuses.damage);
        if (Array.isArray(bonuses.specials) && bonuses.specials.length) {
            weapon.specials = bonuses.specials.map((s) => String(s));
        }
    }
    const armor = system.artifactArmor
        ? foundry.utils.duplicate(system.artifactArmor)
        : defaultArmorProfile();
    const shield = system.artifactShield
        ? foundry.utils.duplicate(system.artifactShield)
        : defaultShieldProfile();
    return { artifactKind, gearSlot, weapon, armor, shield };
}
function rowsForStrings(values) {
    const v = (values || []).map((s) => String(s).trim()).filter(Boolean);
    return v.length ? v : [''];
}
export class NodeEditor extends BaseDialog {
    item;
    constructor(item) {
        super();
        this.item = item;
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            id: 'node-editor',
            title: 'Edit Artifact Node',
            template: 'systems/mastery-system/templates/artifacts/node-editor.hbs',
            classes: ['mastery-system', 'node-editor'],
            width: 680,
            height: 720,
            resizable: true
        });
    }
    getData(options) {
        const data = super.getData ? super.getData(options) : {};
        const system = this.item.system;
        const { artifactKind, gearSlot, weapon, armor, shield } = resolveProfiles(system);
        const damageStr = weapon.damage != null ? String(weapon.damage).trim() : '';
        const weaponDamageIsCustom = damageStr !== '' && !PRESET_VALUES.has(damageStr);
        const weaponDamagePreset = weaponDamageIsCustom ? '__custom__' : damageStr;
        data.item = this.item;
        data.level = system.level || 1;
        data.artifactKind = artifactKind;
        data.gearSlot = gearSlot;
        data.gearSlotOptions = ARTIFACT_GEAR_SLOT_OPTIONS;
        data.weaponProfile = { ...weapon, damage: damageStr || weapon.damage || '' };
        data.armorProfile = armor;
        data.shieldProfile = shield;
        data.damagePresetOptions = [{ value: '', label: 'None' }, ...DAMAGE_PRESETS];
        data.weaponDamagePreset = weaponDamagePreset;
        data.weaponDamageIsCustom = weaponDamageIsCustom;
        data.innateOptions = getArtifactWeaponInnateOptions();
        data.specialOptions = getArtifactWeaponSpecialOptions();
        data.weaponInnateRows = rowsForStrings(weapon.innateAbilities || []);
        data.weaponSpecialRows = rowsForStrings(weapon.specials || []);
        data.requirements = system.requirements || { stones: 0, masteryRank: 1 };
        return data;
    }
    activateListeners(html) {
        super.activateListeners(html);
        const syncKindUi = () => {
            const kind = html.find('#node-artifact-kind').val();
            html.find('[data-profile]').each((_i, el) => {
                const $el = $(el);
                const p = String($el.data('profile') || '');
                $el.toggleClass('hidden', p !== kind);
            });
        };
        html.find('#node-artifact-kind').on('change', syncKindUi);
        syncKindUi();
        html.find('#node-weapon-damage-preset').on('change', (e) => {
            const v = $(e.currentTarget).val();
            html.find('.node-weapon-damage-custom-wrap').toggleClass('hidden', v !== '__custom__');
        });
        const cloneRow = (containerSel, selectClass) => {
            const $c = html.find(containerSel);
            const $first = $c.find('.node-select-row').first();
            const $clone = $first.clone();
            $clone.find(selectClass).val('');
            $c.append($clone);
        };
        html.find('.node-add-row[data-target="innates"]').on('click', () => {
            cloneRow('#node-weapon-innates', '.node-weapon-innate');
        });
        html.find('.node-add-row[data-target="specials"]').on('click', () => {
            cloneRow('#node-weapon-specials', '.node-weapon-special');
        });
        html.on('click', '.node-row-remove', (e) => {
            const $row = $(e.currentTarget).closest('.node-select-row');
            const $parent = $row.parent();
            if ($parent.find('.node-select-row').length <= 1) {
                $row.find('select').val('');
                return;
            }
            $row.remove();
        });
        html.find('button[data-button="save"]').on('click', async (e) => {
            e.preventDefault();
            await this.saveNode(html);
            this.close();
        });
        html.find('button[data-button="cancel"]').on('click', () => {
            this.close();
        });
    }
    collectSelectValues(html, selectClass) {
        const out = [];
        html.find(selectClass).each((_i, el) => {
            const v = ($(el).val() || '').trim();
            if (v)
                out.push(v);
        });
        return out;
    }
    async saveNode(html) {
        const kind = html.find('#node-artifact-kind').val();
        const gearSlot = kind === 'gear' ? String(html.find('#node-gear-slot').val() || '').trim() : '';
        const preset = html.find('#node-weapon-damage-preset').val();
        const customDmg = String(html.find('#node-weapon-damage-custom').val() || '').trim();
        const damage = preset === '__custom__' ? customDmg : preset === '' ? '' : preset;
        const artifactWeapon = {
            weaponType: html.find('#node-weapon-type').val() || 'melee',
            damage,
            range: String(html.find('#node-weapon-range').val() || '0m').trim() || '0m',
            hands: Math.min(2, Math.max(1, parseInt(html.find('#node-weapon-hands').val(), 10) || 1)),
            innateAbilities: this.collectSelectValues(html, '.node-weapon-innate'),
            specials: this.collectSelectValues(html, '.node-weapon-special')
        };
        const artifactArmor = {
            type: String(html.find('#node-armor-type').val() || 'light'),
            armorValue: parseInt(html.find('#node-armor-value').val(), 10) || 0,
            evadeModifier: parseInt(html.find('#node-armor-evade').val(), 10) || 0,
            skillPenalty: String(html.find('#node-armor-skill-penalty').val() || '').trim()
        };
        const artifactShield = {
            type: String(html.find('#node-shield-type').val() || 'parry'),
            shieldValue: parseInt(html.find('#node-shield-value').val(), 10) || 0,
            evadeBonus: parseInt(html.find('#node-shield-evade').val(), 10) || 0,
            skillPenalty: String(html.find('#node-shield-skill-penalty').val() || '').trim()
        };
        const requirements = {
            stones: parseInt(html.find('#node-stones').val(), 10) || 0,
            masteryRank: parseInt(html.find('#node-mastery-rank').val(), 10) || 1
        };
        const clearedBonuses = { attack: 0, damage: '', defense: 0, specials: [] };
        const updates = {
            'system.artifactKind': kind,
            'system.gearSlot': gearSlot,
            'system.artifactWeapon': artifactWeapon,
            'system.artifactArmor': artifactArmor,
            'system.artifactShield': artifactShield,
            'system.bonuses': clearedBonuses,
            'system.requirements': requirements
        };
        await this.item.update(updates);
        ui.notifications?.info('Artifact node updated.');
    }
}
//# sourceMappingURL=node-editor.js.map