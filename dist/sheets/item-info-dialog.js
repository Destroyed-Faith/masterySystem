/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */
import { describeInnateAbility, getWeapon, WEAPONS } from '../utils/weapons.js';
import { BASE_SHIELDS, getArmorDefinitionForType, getShieldDefinitionForType, normalizeShieldTypeKey } from '../utils/equipment.js';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2);
function typeLabel(t) {
    const labels = {
        weapon: 'Weapon',
        armor: 'Armor',
        shield: 'Shield',
        gear: 'Gear',
        artifact: 'Artifact',
        power: 'Power',
        condition: 'Condition',
        echo: 'Echo',
        schtick: 'Schtick',
        masteryNode: 'Mastery Node'
    };
    return labels[t] || t;
}
function fmtMod(n, empty = '—') {
    if (n === null || n === undefined)
        return empty;
    if (n === 0)
        return '0';
    return n > 0 ? `+${n}` : `${n}`;
}
const DAMAGE_ORDER = ['1', '1d8', '2d8', '4d8'];
function uniqueSortedWeaponDamages() {
    const set = new Set();
    for (const w of WEAPONS)
        set.add(w.weaponDamage);
    const ordered = DAMAGE_ORDER.filter((d) => set.has(d));
    const rest = [...set].filter((d) => !DAMAGE_ORDER.includes(d)).sort();
    return [...ordered, ...rest];
}
function selectOptions(values, current) {
    return values.map((value) => ({
        value,
        label: value,
        selected: value === current
    }));
}
export class ItemInfoDialog extends BaseDialog {
    _item;
    static DEFAULT_OPTIONS = {
        id: 'mastery-item-info',
        classes: ['mastery-system', 'item-info-dialog'],
        tag: 'div',
        position: { width: 520, height: 'auto' },
        window: {
            title: 'Item',
            resizable: true,
            icon: 'fa-solid fa-circle-info'
        }
    };
    static PARTS = {
        content: { template: 'systems/mastery-system/templates/dialogs/item-info-dialog.hbs' }
    };
    constructor(item, options = {}) {
        const merged = foundry.utils.mergeObject(ItemInfoDialog.DEFAULT_OPTIONS, options, { inplace: false });
        merged.window = foundry.utils.mergeObject(merged.window || {}, { title: item.name || 'Item' });
        super(merged);
        this._item = item;
    }
    get item() {
        return this._item;
    }
    static async show(item) {
        const id = `mastery-item-info-${item.id}`;
        const existing = foundry.applications.instances.get(id);
        if (existing) {
            existing._item = item;
            existing.options.window = foundry.utils.mergeObject(existing.options.window || {}, { title: item.name || 'Item' });
            await existing.render({ force: true });
            existing.bringToFront?.();
            return;
        }
        const app = new ItemInfoDialog(item, { id });
        await app.render(true);
    }
    async _prepareContext(_options) {
        const item = this._item;
        const sys = item.system || {};
        const t = item.type;
        const canEdit = !!(game.user?.isGM || item.isOwner);
        const hasSheet = typeof item.sheet?.render === 'function';
        const base = {
            item,
            cssClass: 'item-info-dialog',
            typeLabel: typeLabel(t),
            itemImg: item.img || 'icons/svg/item-bag.svg',
            itemName: item.name,
            enrichedDescription: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.description || ''),
            canEdit,
            showQuickEdit: false,
            showAdvancedSheetLink: false,
            isWeapon: t === 'weapon',
            isArmor: t === 'armor',
            isShield: t === 'shield',
            isGear: t === 'gear',
            isArtifact: t === 'artifact',
            isGeneric: !['weapon', 'armor', 'shield', 'gear', 'artifact'].includes(t)
        };
        if (t === 'weapon') {
            const cat = getWeapon(item.name || '');
            let innates = Array.isArray(sys.innateAbilities) ? [...sys.innateAbilities] : [];
            if (innates.length === 0 && cat?.innateAbilities?.length) {
                innates = [...cat.innateAbilities];
            }
            const innateRows = innates.map((label) => ({
                label,
                description: describeInnateAbility(label)
            }));
            let specials = Array.isArray(sys.specials)
                ? sys.specials.map((s) => String(s))
                : [];
            if (specials.length === 0 &&
                cat?.special &&
                cat.special !== '—') {
                specials = cat.special
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
            }
            base.weaponBlock = {
                damage: sys.damage != null && String(sys.damage).trim() !== ''
                    ? String(sys.damage)
                    : cat?.weaponDamage ?? '—',
                hands: sys.hands != null && sys.hands !== '' ? sys.hands : cat?.hands ?? '—',
                weaponType: sys.weaponType === 'ranged' ? 'Ranged' : 'Melee',
                innateRows,
                specials,
                specialsNote: 'Weapon specials are typically chosen or enhanced using Raises during combat (when rules allow).',
                catalogNote: cat?.description || ''
            };
            if (canEdit) {
                const dmgCur = sys.damage != null && String(sys.damage).trim() !== ''
                    ? String(sys.damage)
                    : String(cat?.weaponDamage ?? '1d8');
                const damages = uniqueSortedWeaponDamages();
                if (!damages.includes(dmgCur))
                    damages.unshift(dmgCur);
                const handsCur = sys.hands === 2 ? 2 : 1;
                const wtCur = sys.weaponType === 'ranged' ? 'ranged' : 'melee';
                const catalogOpts = [
                    { value: '', label: '— Keep current stats —', selected: true },
                    ...[...WEAPONS]
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((w) => ({
                        value: w.name,
                        label: w.name,
                        selected: false
                    }))
                ];
                base.weaponEdit = {
                    damageOptions: selectOptions(damages, dmgCur),
                    handsOptions: [
                        { value: '1', label: '1 hand', selected: handsCur === 1 },
                        { value: '2', label: '2 hands', selected: handsCur === 2 }
                    ],
                    weaponTypeOptions: [
                        { value: 'melee', label: 'Melee', selected: wtCur === 'melee' },
                        { value: 'ranged', label: 'Ranged', selected: wtCur === 'ranged' }
                    ],
                    catalogOptions: catalogOpts,
                    range: sys.range != null ? String(sys.range) : ''
                };
                base.showQuickEdit = true;
            }
        }
        if (t === 'armor') {
            const def = getArmorDefinitionForType(sys.type);
            const typePretty = sys.type ? String(sys.type).charAt(0).toUpperCase() + String(sys.type).slice(1) : '—';
            base.armorBlock = {
                typeLabel: typePretty,
                name: def?.name || typePretty,
                armorValue: fmtMod(sys.armorValue, '0'),
                evade: fmtMod(sys.evadeModifier, '0'),
                initiative: def ? fmtMod(def.initiativeModifier) : '—',
                skillPenalty: def?.skillPenalty || '—',
                canonicalArmor: def ? String(def.armorValue) : null,
                canonicalEvade: def ? fmtMod(def.evadeModifier, '0') : null,
                ruleHint: 'Armor Value + Shield value + Mastery Rank = total armor subtracted from incoming damage (subject to rule exceptions).'
            };
            if (canEdit) {
                const curType = (sys.type || 'light').toLowerCase();
                base.armorEdit = {
                    typeOptions: ['light', 'medium', 'heavy'].map((v) => ({
                        value: v,
                        label: v.charAt(0).toUpperCase() + v.slice(1),
                        selected: v === curType
                    })),
                    armorValue: sys.armorValue ?? 0,
                    evadeModifier: sys.evadeModifier ?? 0
                };
                base.showQuickEdit = true;
            }
        }
        if (t === 'shield') {
            const def = getShieldDefinitionForType(sys.type);
            const k = normalizeShieldTypeKey(sys.type);
            const typePretty = k === 'parry' ? 'Parry Shield' : k === 'medium' ? 'Medium Shield' : k === 'tower' ? 'Tower Shield' : String(sys.type || '—');
            base.shieldBlock = {
                typeLabel: typePretty,
                name: def?.name || typePretty,
                shieldValue: fmtMod(sys.shieldValue, '0'),
                evade: fmtMod(sys.evadeBonus, '0'),
                initiative: def ? fmtMod(def.initiativeModifier) : '—',
                skillPenalty: def?.skillPenalty || '—',
                ruleHint: 'Shield Value stacks with armor and Mastery for total armor (see core rules).'
            };
            if (canEdit) {
                const sk = normalizeShieldTypeKey(sys.type) || 'parry';
                base.shieldEdit = {
                    typeOptions: [
                        { value: 'parry', label: 'Parry', selected: sk === 'parry' },
                        { value: 'medium', label: 'Medium', selected: sk === 'medium' },
                        { value: 'tower', label: 'Tower', selected: sk === 'tower' }
                    ],
                    shieldValue: sys.shieldValue ?? 0,
                    evadeBonus: sys.evadeBonus ?? 0
                };
                base.showQuickEdit = true;
            }
        }
        if (t === 'gear') {
            base.gearBlock = {
                weight: sys.weight != null ? String(sys.weight) : '—',
                quantity: sys.quantity != null ? String(sys.quantity) : '1',
                inventorySize: sys.inventorySize || '1x1'
            };
            if (canEdit) {
                const sizes = [
                    '1x1',
                    '1x2',
                    '1x3',
                    '1x4',
                    '2x1',
                    '2x2',
                    '2x3',
                    '2x4',
                    '3x3',
                    '4x2'
                ];
                const curSize = sys.inventorySize || '1x1';
                const sizeList = sizes.includes(curSize) ? sizes : [curSize, ...sizes];
                base.gearEdit = {
                    sizeOptions: selectOptions(sizeList, curSize),
                    quantity: sys.quantity ?? 1,
                    weight: sys.weight ?? 0,
                    descriptionPlain: typeof sys.description === 'string' ? sys.description : ''
                };
                base.showQuickEdit = true;
            }
        }
        if (t === 'artifact') {
            const bonuses = sys.bonuses || {};
            const powers = Array.isArray(sys.powers) ? sys.powers : [];
            base.artifactBlock = {
                level: sys.level ?? '—',
                attack: bonuses.attack != null ? String(bonuses.attack) : '0',
                defense: bonuses.defense != null ? String(bonuses.defense) : '0',
                damage: bonuses.damage || '—',
                lore: sys.lore || '',
                powersCount: powers.length,
                requirements: sys.requirements || {}
            };
        }
        base.showAdvancedSheetLink =
            canEdit &&
                hasSheet &&
                (t === 'artifact' || base.isGeneric || !base.showQuickEdit);
        return base;
    }
    async #resyncItemAfterUpdate() {
        const parent = this._item.parent;
        if (parent && typeof parent.items?.get === 'function') {
            const fresh = parent.items.get(this._item.id);
            if (fresh)
                this._item = fresh;
        }
        else {
            const world = game.items?.get(this._item.id);
            if (world)
                this._item = world;
        }
        this.options.window = foundry.utils.mergeObject(this.options.window || {}, { title: this._item.name || 'Item' });
        await this.render({ force: true });
    }
    async _onRender(context, options) {
        await super._onRender?.(context, options);
        const root = this.element;
        if (!root)
            return;
        const closeBtn = root.querySelector('.js-item-info-close');
        if (closeBtn) {
            closeBtn.onclick = (ev) => {
                ev.preventDefault();
                void this.close?.();
            };
        }
        const adv = root.querySelector('.js-item-info-advanced-sheet');
        if (adv) {
            adv.onclick = async (ev) => {
                ev.preventDefault();
                const sheet = this._item.sheet;
                if (sheet && typeof sheet.render === 'function') {
                    await sheet.render(true);
                }
            };
        }
        const catSel = root.querySelector('.js-item-info-weapon-catalog');
        if (catSel) {
            catSel.onchange = async () => {
                const name = catSel.value?.trim();
                if (!name)
                    return;
                const def = getWeapon(name);
                if (!def)
                    return;
                const specialsArr = def.special === '—' ? [] : def.special.split(',').map((s) => s.trim()).filter(Boolean);
                const ranged = def.innateAbilities.some((a) => /^ranged/i.test(a.trim()));
                await this._item.update({
                    'system.damage': def.weaponDamage,
                    'system.hands': def.hands,
                    'system.innateAbilities': [...def.innateAbilities],
                    'system.specials': specialsArr,
                    'system.weaponType': ranged ? 'ranged' : 'melee'
                });
                catSel.value = '';
                await this.#resyncItemAfterUpdate();
            };
        }
        const dmgSel = root.querySelector('.js-item-info-weapon-damage');
        if (dmgSel) {
            dmgSel.onchange = async () => {
                await this._item.update({ 'system.damage': dmgSel.value });
                await this.#resyncItemAfterUpdate();
            };
        }
        const handsSel = root.querySelector('.js-item-info-weapon-hands');
        if (handsSel) {
            handsSel.onchange = async () => {
                await this._item.update({ 'system.hands': parseInt(handsSel.value, 10) || 1 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const wtSel = root.querySelector('.js-item-info-weapon-type');
        if (wtSel) {
            wtSel.onchange = async () => {
                await this._item.update({ 'system.weaponType': wtSel.value });
                await this.#resyncItemAfterUpdate();
            };
        }
        const rangeInp = root.querySelector('.js-item-info-weapon-range');
        if (rangeInp) {
            rangeInp.onchange = async () => {
                await this._item.update({ 'system.range': rangeInp.value.trim() || '0m' });
                await this.#resyncItemAfterUpdate();
            };
        }
        const armorType = root.querySelector('.js-item-info-armor-type');
        if (armorType) {
            armorType.onchange = async () => {
                const def = getArmorDefinitionForType(armorType.value);
                if (def) {
                    await this._item.update({
                        'system.type': armorType.value,
                        'system.armorValue': def.armorValue,
                        'system.evadeModifier': def.evadeModifier
                    });
                }
                else {
                    await this._item.update({ 'system.type': armorType.value });
                }
                await this.#resyncItemAfterUpdate();
            };
        }
        const av = root.querySelector('.js-item-info-armor-value');
        if (av) {
            av.onchange = async () => {
                await this._item.update({ 'system.armorValue': parseInt(av.value, 10) || 0 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const ae = root.querySelector('.js-item-info-armor-evade');
        if (ae) {
            ae.onchange = async () => {
                await this._item.update({ 'system.evadeModifier': parseInt(ae.value, 10) || 0 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const shieldType = root.querySelector('.js-item-info-shield-type');
        if (shieldType) {
            shieldType.onchange = async () => {
                const def = BASE_SHIELDS.find((s) => s.type === shieldType.value);
                if (def) {
                    await this._item.update({
                        'system.type': shieldType.value,
                        'system.shieldValue': def.shieldValue,
                        'system.evadeBonus': def.evadeBonus
                    });
                }
                else {
                    await this._item.update({ 'system.type': shieldType.value });
                }
                await this.#resyncItemAfterUpdate();
            };
        }
        const sv = root.querySelector('.js-item-info-shield-value');
        if (sv) {
            sv.onchange = async () => {
                await this._item.update({ 'system.shieldValue': parseInt(sv.value, 10) || 0 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const se = root.querySelector('.js-item-info-shield-evade');
        if (se) {
            se.onchange = async () => {
                await this._item.update({ 'system.evadeBonus': parseInt(se.value, 10) || 0 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const gSize = root.querySelector('.js-item-info-gear-size');
        if (gSize) {
            gSize.onchange = async () => {
                await this._item.update({ 'system.inventorySize': gSize.value });
                await this.#resyncItemAfterUpdate();
            };
        }
        const gQty = root.querySelector('.js-item-info-gear-qty');
        if (gQty) {
            gQty.onchange = async () => {
                await this._item.update({ 'system.quantity': Math.max(0, parseInt(gQty.value, 10) || 0) });
                await this.#resyncItemAfterUpdate();
            };
        }
        const gW = root.querySelector('.js-item-info-gear-weight');
        if (gW) {
            gW.onchange = async () => {
                await this._item.update({ 'system.weight': parseFloat(gW.value) || 0 });
                await this.#resyncItemAfterUpdate();
            };
        }
        const gDesc = root.querySelector('.js-item-info-gear-desc');
        if (gDesc) {
            gDesc.onchange = async () => {
                await this._item.update({ 'system.description': gDesc.value });
                await this.#resyncItemAfterUpdate();
            };
        }
    }
}
//# sourceMappingURL=item-info-dialog.js.map