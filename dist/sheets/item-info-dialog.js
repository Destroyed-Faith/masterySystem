/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */
import { describeInnateAbility, getWeapon, WEAPONS } from '../utils/weapons.js';
import { getArmorDefinitionForType, getShieldDefinitionForType, normalizeShieldTypeKey } from '../utils/equipment.js';
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
/** Quick-edit only for items embedded on an actor (not world / compendium templates). */
function isEmbeddedOnActor(item) {
    const p = item?.parent;
    return !!(p && p.documentName === 'Actor');
}
/** Reach bonus from innate lines (matches radial-menu reach parsing). */
function reachBonusKeyFromInnates(innates) {
    for (const a of innates) {
        const m = a.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
        if (m) {
            const n = parseInt(m[1], 10);
            if (n >= 2)
                return '2';
            if (n >= 1)
                return '1';
        }
        const leg = a.match(/Reach\s*\((\d+)\s*m\)/i);
        if (leg) {
            const total = parseInt(leg[1], 10);
            const bonus = Math.max(0, total - 2);
            if (bonus >= 2)
                return '2';
            if (bonus >= 1)
                return '1';
        }
    }
    return '0';
}
function innatesWithoutReach(innates) {
    return innates.filter((a) => !/^\s*reach\b/i.test(a));
}
function applyReachToInnates(innates, reachKey) {
    const base = innatesWithoutReach(innates);
    if (reachKey === '1')
        base.push('Reach (+1 m)');
    else if (reachKey === '2')
        base.push('Reach (+2 m)');
    return base;
}
/** Item override or armor type table default for display. */
function armorSkillPenaltyLabel(sys, def) {
    const raw = sys.skillPenalty;
    if (raw != null && String(raw).trim() !== '')
        return String(raw);
    return def?.skillPenalty || '—';
}
function armorSkillPenaltyEditValue(sys, def) {
    const raw = sys.skillPenalty;
    if (raw != null && String(raw).trim() !== '')
        return String(raw);
    return def?.skillPenalty ?? '';
}
export class ItemInfoDialog extends BaseDialog {
    _item;
    /** Preserve <details open> across re-renders after Save. */
    _quickEditOpen = false;
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
        const embeddedOnActor = isEmbeddedOnActor(item);
        const base = {
            item,
            cssClass: 'item-info-dialog',
            typeLabel: typeLabel(t),
            itemImg: item.img || 'icons/svg/item-bag.svg',
            itemName: item.name,
            enrichedDescription: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.description || ''),
            canEdit,
            embeddedOnActor,
            quickEditOpen: this._quickEditOpen,
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
            if (canEdit && embeddedOnActor) {
                const dmgCur = sys.damage != null && String(sys.damage).trim() !== ''
                    ? String(sys.damage)
                    : String(cat?.weaponDamage ?? '1d8');
                const damages = uniqueSortedWeaponDamages();
                if (!damages.includes(dmgCur))
                    damages.unshift(dmgCur);
                const handsCur = sys.hands === 2 ? 2 : 1;
                const wtCur = sys.weaponType === 'ranged' ? 'ranged' : 'melee';
                const innatesForReach = Array.isArray(sys.innateAbilities)
                    ? sys.innateAbilities.map((x) => String(x))
                    : [];
                const reachKey = reachBonusKeyFromInnates(innatesForReach);
                const rangedRange = sys.range != null && String(sys.range).trim() !== ''
                    ? String(sys.range).trim()
                    : '8m';
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
                    reachOptions: [
                        { value: '0', label: 'No extra reach (base 2 m melee)', selected: reachKey === '0' },
                        { value: '1', label: 'Reach (+1 m)', selected: reachKey === '1' },
                        { value: '2', label: 'Reach (+2 m)', selected: reachKey === '2' }
                    ],
                    initialRanged: wtCur === 'ranged',
                    range: rangedRange
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
                skillPenalty: armorSkillPenaltyLabel(sys, def),
                canonicalArmor: def ? String(def.armorValue) : null,
                canonicalEvade: def ? fmtMod(def.evadeModifier, '0') : null,
                ruleHint: 'Armor Value + Shield value + Mastery Rank = total armor subtracted from incoming damage (subject to rule exceptions).'
            };
            if (canEdit && embeddedOnActor) {
                const curType = (sys.type || 'light').toLowerCase();
                base.armorEdit = {
                    typeOptions: ['light', 'medium', 'heavy'].map((v) => ({
                        value: v,
                        label: v.charAt(0).toUpperCase() + v.slice(1),
                        selected: v === curType
                    })),
                    armorValue: sys.armorValue ?? 0,
                    evadeModifier: sys.evadeModifier ?? 0,
                    skillPenaltyPlain: armorSkillPenaltyEditValue(sys, def)
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
            if (canEdit && embeddedOnActor) {
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
            if (canEdit && embeddedOnActor) {
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
    async #saveQuickEditsFromRoot(root) {
        if (!isEmbeddedOnActor(this._item)) {
            ui.notifications?.warn('Values can only be saved for items on a character (not world or compendium items).');
            return;
        }
        const item = this._item;
        const t = item.type;
        try {
            if (t === 'weapon') {
                const dmgSel = root.querySelector('.js-item-info-weapon-damage');
                const handsSel = root.querySelector('.js-item-info-weapon-hands');
                const wtSel = root.querySelector('.js-item-info-weapon-type');
                const reachSel = root.querySelector('.js-item-info-weapon-reach');
                const rangeInp = root.querySelector('.js-item-info-weapon-range');
                if (!dmgSel || !handsSel || !wtSel || !reachSel || !rangeInp)
                    return;
                const wt = wtSel.value === 'ranged' ? 'ranged' : 'melee';
                const sysInnates = Array.isArray(item.system?.innateAbilities)
                    ? item.system.innateAbilities.map((x) => String(x))
                    : [];
                const reachKey = (reachSel.value === '2' ? '2' : reachSel.value === '1' ? '1' : '0');
                let innateAbilities = sysInnates;
                if (wt === 'melee') {
                    innateAbilities = applyReachToInnates(sysInnates, reachKey);
                }
                else {
                    innateAbilities = innatesWithoutReach(sysInnates);
                }
                const payload = {
                    'system.damage': dmgSel.value,
                    'system.hands': parseInt(handsSel.value, 10) || 1,
                    'system.weaponType': wt,
                    'system.innateAbilities': innateAbilities
                };
                if (wt === 'melee') {
                    payload['system.range'] = '0m';
                }
                else {
                    const r = rangeInp.value.trim() || '8m';
                    payload['system.range'] = r;
                }
                await item.update(payload);
            }
            else if (t === 'armor') {
                const armorType = root.querySelector('.js-item-info-armor-type');
                const av = root.querySelector('.js-item-info-armor-value');
                const ae = root.querySelector('.js-item-info-armor-evade');
                const asp = root.querySelector('.js-item-info-armor-skill-penalty');
                if (!armorType || !av || !ae || !asp)
                    return;
                await item.update({
                    'system.type': armorType.value,
                    'system.armorValue': parseInt(av.value, 10) || 0,
                    'system.evadeModifier': parseInt(ae.value, 10) || 0,
                    'system.skillPenalty': asp.value.trim()
                });
            }
            else if (t === 'shield') {
                const shieldType = root.querySelector('.js-item-info-shield-type');
                const sv = root.querySelector('.js-item-info-shield-value');
                const se = root.querySelector('.js-item-info-shield-evade');
                if (!shieldType || !sv || !se)
                    return;
                await item.update({
                    'system.type': shieldType.value,
                    'system.shieldValue': parseInt(sv.value, 10) || 0,
                    'system.evadeBonus': parseInt(se.value, 10) || 0
                });
            }
            else if (t === 'gear') {
                const gSize = root.querySelector('.js-item-info-gear-size');
                const gQty = root.querySelector('.js-item-info-gear-qty');
                const gW = root.querySelector('.js-item-info-gear-weight');
                const gDesc = root.querySelector('.js-item-info-gear-desc');
                if (!gSize || !gQty || !gW || !gDesc)
                    return;
                await item.update({
                    'system.inventorySize': gSize.value,
                    'system.quantity': Math.max(0, parseInt(gQty.value, 10) || 0),
                    'system.weight': parseFloat(gW.value) || 0,
                    'system.description': gDesc.value
                });
            }
            else {
                return;
            }
            const panel = root.querySelector('.item-info-edit-panel');
            this._quickEditOpen = !!panel?.open;
            ui.notifications?.info('Item updated.');
            await this.#resyncItemAfterUpdate();
        }
        catch (e) {
            console.error(e);
            ui.notifications?.error('Could not save item changes.');
        }
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
        const saveBtn = root.querySelector('.js-item-info-save-edits');
        if (saveBtn) {
            saveBtn.onclick = (ev) => {
                ev.preventDefault();
                void this.#saveQuickEditsFromRoot(root);
            };
        }
        const wtSel = root.querySelector('.js-item-info-weapon-type');
        const reachRow = root.querySelector('.js-item-info-weapon-reach-row');
        const rangeRow = root.querySelector('.js-item-info-weapon-range-row');
        const syncWeaponRows = () => {
            if (!wtSel || !reachRow || !rangeRow)
                return;
            const ranged = wtSel.value === 'ranged';
            reachRow.classList.toggle('item-info-edit-hidden', ranged);
            rangeRow.classList.toggle('item-info-edit-hidden', !ranged);
        };
        if (wtSel) {
            wtSel.addEventListener('change', syncWeaponRows);
            syncWeaponRows();
        }
        const armorType = root.querySelector('.js-item-info-armor-type');
        if (armorType) {
            armorType.addEventListener('change', () => {
                const def = getArmorDefinitionForType(armorType.value);
                const av = root.querySelector('.js-item-info-armor-value');
                const ae = root.querySelector('.js-item-info-armor-evade');
                const asp = root.querySelector('.js-item-info-armor-skill-penalty');
                if (def && av && ae) {
                    av.value = String(def.armorValue);
                    ae.value = String(def.evadeModifier);
                }
                if (def && asp) {
                    asp.value = def.skillPenalty === '—' ? '' : def.skillPenalty;
                }
            });
        }
        const shieldType = root.querySelector('.js-item-info-shield-type');
        if (shieldType) {
            shieldType.addEventListener('change', () => {
                const def = getShieldDefinitionForType(shieldType.value);
                const sv = root.querySelector('.js-item-info-shield-value');
                const se = root.querySelector('.js-item-info-shield-evade');
                if (def && sv && se) {
                    sv.value = String(def.shieldValue);
                    se.value = String(def.evadeBonus ?? 0);
                }
            });
        }
        const editPanel = root.querySelector('.item-info-edit-panel');
        if (editPanel) {
            editPanel.addEventListener('toggle', () => {
                this._quickEditOpen = editPanel.open;
            });
        }
    }
}
//# sourceMappingURL=item-info-dialog.js.map