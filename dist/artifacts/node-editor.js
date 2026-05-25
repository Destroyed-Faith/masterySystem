/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */
import { ARTIFACT_GEAR_SLOT_OPTIONS, getArtifactSpecialSelectOptions, getArtifactTreeWeaponDamagePresets, getArtifactWeaponInnateOptions } from '../utils/artifact-node-options.js';
import { ARTIFACT_SLOT_KEYS, ARTIFACT_SLOT_LABELS, ATTRIBUTE_ACCESS_BY_SLOT, BASE_PROFILE_LABELS, BASE_PROFILES_BY_SLOT, BASE_VALUE_LIMIT_BY_SLOT, BASE_VALUE_TYPE_LABELS, isAttributeAllowedForStoneFunctionInSlot, isBaseValueTypeAllowedForSlot, SLOT_POWER_ACCESS, } from '../utils/artifact-rules.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { pushWorldArtifactNodeToEmbeddedActors } from '../utils/artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from '../utils/equip-slots.js';
import { buildArtifactNodeIdMap, findRootItem, getAncestorChainRootFirst, getLockedWeaponBasics, getMaxTotalEmbeddedPowers, getMergedAncestorPowerIds, getTreeDepth, isLineageRootItem, mergeInnatesFromAncestors, mergeSpecialRefsFromAncestors, specialRefKey } from '../utils/artifact-tree-lineage.js';
import { normalizePowersForEditor } from '../utils/embedded-power-ui-constants.js';
import { EmbeddedPowerDialog } from './embedded-power-dialog.js';
import { getEffectById, parseEffectStrings } from '../utils/special-effects.js';
// Use V1 Application for reliable template rendering in v13
const BaseDialog = foundry?.appv1?.Application || Application;
const TREE_DAMAGE_PRESETS = getArtifactTreeWeaponDamagePresets();
const TREE_PRESET_VALUES = new Set(TREE_DAMAGE_PRESETS.map((p) => p.value));
/** Inventory grid presets (aligned with item-info-dialog gear sizes). */
const INVENTORY_SIZE_PRESETS = [
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
function migrateWeaponSpecials(weaponSys, bonuses) {
    const raw = weaponSys?.specials;
    if (Array.isArray(raw) && raw.length > 0) {
        const first = raw[0];
        if (typeof first === 'object' && first !== null && 'specialId' in first) {
            return raw
                .map((x) => ({
                specialId: String(x.specialId || '').trim(),
                value: x.value != null && x.value !== '' ? Number(x.value) : undefined
            }))
                .filter((x) => x.specialId);
        }
        const strs = raw.map((s) => String(s).trim()).filter(Boolean);
        return parseEffectStrings(strs);
    }
    const bonusStrs = (bonuses?.specials || []).map((s) => String(s).trim()).filter(Boolean);
    return parseEffectStrings(bonusStrs);
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
    }
    weapon.specials = migrateWeaponSpecials(system.artifactWeapon, bonuses);
    const armor = system.artifactArmor
        ? foundry.utils.duplicate(system.artifactArmor)
        : defaultArmorProfile();
    const shield = system.artifactShield
        ? foundry.utils.duplicate(system.artifactShield)
        : defaultShieldProfile();
    return { artifactKind, gearSlot, weapon, armor, shield };
}
function getFolderArtifactItemsForItem(item) {
    const folderId = item.folder?.id;
    if (!folderId)
        return [];
    return (game.items?.filter((it) => it.folder?.id === folderId && it.type === 'artifact') || []);
}
function resolveLineageForItem(item) {
    const folderItems = getFolderArtifactItemsForItem(item);
    const nodeIdMap = buildArtifactNodeIdMap(folderItems);
    const isLineageRoot = folderItems.length === 0 || isLineageRootItem(item);
    const ancestors = getAncestorChainRootFirst(item, nodeIdMap);
    const rootItem = folderItems.length ? findRootItem(item, nodeIdMap) : item;
    const rootSystem = rootItem.system;
    const lockedBasics = getLockedWeaponBasics(rootSystem);
    const { ordered: lockedInnateList, set: lockedInnateSet } = mergeInnatesFromAncestors(ancestors);
    const { ordered: lockedSpecialList, keySet: lockedSpecialKeySet } = mergeSpecialRefsFromAncestors(ancestors);
    const mergedAncestorPowerIds = getMergedAncestorPowerIds(ancestors);
    const depth = folderItems.length ? getTreeDepth(item, nodeIdMap) : 1;
    const maxTotalPowers = getMaxTotalEmbeddedPowers(isLineageRoot, depth, mergedAncestorPowerIds.size);
    return {
        isLineageRoot,
        lockedBasics,
        lockedInnateList,
        lockedInnateSet,
        lockedSpecialList,
        lockedSpecialKeySet,
        mergedAncestorPowerIds,
        maxTotalPowers,
        depth,
        rootArmorType: rootSystem?.artifactArmor?.type || 'light',
        rootShieldType: rootSystem?.artifactShield?.type || 'parry'
    };
}
function buildInnateRows(innates, lockedSet) {
    const list = (innates || []).map((s) => String(s).trim()).filter(Boolean);
    const rows = list.map((value) => ({
        value,
        locked: lockedSet.has(value)
    }));
    return rows.length ? rows : [{ value: '', locked: false }];
}
function buildSpecialRows(refs, lockedKeySet) {
    if (!refs.length) {
        return [{ specialId: '', valueStr: '', showValueInput: false, locked: false }];
    }
    return refs.map((ref) => {
        const ef = getEffectById(ref.specialId);
        const hasVal = ef ? ef.hasValue : true;
        const k = specialRefKey(ref);
        return {
            specialId: ref.specialId,
            value: ref.value,
            valueStr: ref.value != null && Number.isFinite(ref.value) ? String(ref.value) : '',
            showValueInput: Boolean(ref.specialId && hasVal),
            locked: lockedKeySet.has(k)
        };
    });
}
function coerceTreeDamage(damageStr) {
    const t = String(damageStr || '').trim();
    if (TREE_PRESET_VALUES.has(t))
        return t;
    return '1d8';
}
function syncWeaponRangeLabel(html) {
    const melee = html.find('#node-weapon-type').val() === 'melee';
    html.find('#node-weapon-range-label').text(melee ? 'Reach' : 'Range');
    html
        .find('#node-weapon-range')
        .attr('placeholder', melee ? 'e.g. 0m, Reach (+1 m)' : 'e.g. 8/16/32m');
}
function syncSpecialRowValueVisibility($row) {
    const $sel = $row.find('.node-weapon-special-id');
    const id = String($sel.val() || '').trim();
    const $opt = $sel.find('option:selected');
    const dataHv = $opt.attr('data-has-value');
    const hasValue = dataHv !== 'false' && id.length > 0;
    $row.find('.node-weapon-special-val-wrap').toggleClass('hidden', !hasValue);
}
export class NodeEditor extends BaseDialog {
    item;
    _onSaved;
    constructor(item, options) {
        super();
        this.item = item;
        this._onSaved = options?.onSaved;
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
        const lineage = resolveLineageForItem(this.item);
        const damageStr = weapon.damage != null ? String(weapon.damage).trim() : '';
        const weaponDamagePreset = coerceTreeDamage(damageStr);
        data.item = this.item;
        data.level = system.level || 1;
        data.artifactKind = artifactKind;
        data.gearSlot = gearSlot;
        data.gearSlotOptions = ARTIFACT_GEAR_SLOT_OPTIONS;
        const handsN = Math.min(2, Math.max(1, parseInt(String(weapon.hands ?? 1), 10) || 1));
        data.weaponProfile = { ...weapon, damage: weaponDamagePreset, hands: handsN };
        data.weaponHandsIsTwo = handsN === 2;
        data.armorProfile = armor;
        data.shieldProfile = shield;
        data.damagePresetOptions = TREE_DAMAGE_PRESETS;
        data.weaponDamagePreset = weaponDamagePreset;
        data.innateOptions = getArtifactWeaponInnateOptions();
        data.specialSelectOptions = getArtifactSpecialSelectOptions();
        data.weaponInnateRows = buildInnateRows(weapon.innateAbilities || [], lineage.lockedInnateSet);
        data.weaponSpecialRows = buildSpecialRows(weapon.specials || [], lineage.lockedSpecialKeySet);
        data.requirements = system.requirements || { stones: 0, masteryRank: 1 };
        const curInv = String(system.inventorySize || '1x1').trim() || '1x1';
        data.inventorySize = curInv;
        data.inventorySizeOptions = INVENTORY_SIZE_PRESETS.includes(curInv)
            ? [...INVENTORY_SIZE_PRESETS]
            : [curInv, ...INVENTORY_SIZE_PRESETS];
        data.isLineageRoot = lineage.isLineageRoot;
        data.lineageHint = lineage.isLineageRoot
            ? ''
            : 'Tree child: item type, weapon type, hands, gear slot, and armor/shield type match the root node. Inherited innates/specials/powers cannot be removed; you can add more.';
        const emb = normalizePowersForEditor(system.powers);
        data.embeddedPowersSummary =
            emb.length === 0
                ? 'No embedded powers on this item yet.'
                : `${emb.length} power(s) on this item: ${emb.map((p) => p.name).join(', ')}`;
        // ---- New Artifact spec block ----
        const specSlot = String(system.slot || '');
        const specBaseProfile = String(system.baseProfile || '');
        const specBinding = String(system.binding || 'unbound');
        const baseValues = Array.isArray(system.baseValues)
            ? system.baseValues
            : [];
        const stoneFn = system.stoneFunction || null;
        data.specSlot = specSlot;
        data.specBaseProfile = specBaseProfile;
        data.specBinding = specBinding;
        data.specStoneFnKind = stoneFn?.kind || '';
        data.specStoneFnAttr = stoneFn?.attribute || '';
        data.specStoneFnPowerId = stoneFn?.stonePowerId || '';
        data.specSlotOptions = ARTIFACT_SLOT_KEYS.map((k) => ({
            key: k,
            label: ARTIFACT_SLOT_LABELS[k],
        }));
        const allowedProfiles = specSlot ? BASE_PROFILES_BY_SLOT[specSlot] || [] : Object.keys(BASE_PROFILE_LABELS);
        data.specBaseProfileOptions = allowedProfiles.map((k) => ({
            key: k,
            label: BASE_PROFILE_LABELS[k],
        }));
        data.specBaseValueTypeOptions = Object.entries(BASE_VALUE_TYPE_LABELS)
            .filter(([type]) => specSlot ? isBaseValueTypeAllowedForSlot(specSlot, type) : true)
            .map(([key, label]) => ({ key, label }));
        const attrCatalog = {
            might: 'Might',
            agility: 'Agility',
            vitality: 'Vitality',
            intellect: 'Intellect',
            resolve: 'Resolve',
            influence: 'Influence',
            wits: 'Wits',
        };
        const allowedAttrs = specSlot ? ATTRIBUTE_ACCESS_BY_SLOT[specSlot] || [] : Object.keys(attrCatalog);
        data.specStoneFnAttrOptions = allowedAttrs.map((k) => ({
            key: k,
            label: attrCatalog[k] || k,
        }));
        const slotAccess = specSlot ? SLOT_POWER_ACCESS[specSlot] : null;
        data.specSlotAccessHint = slotAccess
            ? `Slot "${ARTIFACT_SLOT_LABELS[specSlot]}" — Primary: ${slotAccess.primary.join(', ')}. Secondary: ${slotAccess.secondary.join(', ') || '—'}. Not allowed: ${slotAccess.notAllowed.join(', ') || '—'}.`
            : 'Pick a Slot to see allowed Powers / Base Values.';
        data.specBaseValueRows = (baseValues.length > 0
            ? baseValues
            : [{ slot: 'a', type: 'minorFeature', label: '', value: '' }]).map((bv) => ({
            slot: bv.slot || 'a',
            type: bv.type || 'minorFeature',
            label: bv.label || '',
            valueStr: bv.value != null ? String(bv.value) : '',
        }));
        if (specSlot) {
            const limit = BASE_VALUE_LIMIT_BY_SLOT[specSlot];
            data.specBaseValueLimit = limit;
        }
        else {
            data.specBaseValueLimit = 3;
        }
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
        html.find('#node-weapon-type').on('change', () => syncWeaponRangeLabel(html));
        syncWeaponRangeLabel(html);
        // --- Artifact Spec: dynamic slot → base-profile / base-value-types / stone-fn attribute sync ---
        const $specSlot = html.find('#node-spec-slot');
        const $specBaseProfile = html.find('#node-spec-base-profile');
        const $specBvContainer = html.find('#node-spec-base-values');
        const $specStoneFnAttr = html.find('#node-spec-stone-fn-attr');
        const $specBvLimitHint = html.find('#node-spec-bv-limit-hint');
        const $specSlotHint = html.find('#node-spec-slot-power-hint');
        const ATTR_LABELS = {
            might: 'Might',
            agility: 'Agility',
            vitality: 'Vitality',
            intellect: 'Intellect',
            resolve: 'Resolve',
            influence: 'Influence',
            wits: 'Wits',
        };
        const refreshSpecForSlot = () => {
            const slot = String($specSlot.val() || '').trim();
            // Base Profile options
            const allowedProfiles = slot
                ? BASE_PROFILES_BY_SLOT[slot] || []
                : Object.keys(BASE_PROFILE_LABELS);
            const currentProfile = String($specBaseProfile.val() || '');
            $specBaseProfile.empty();
            $specBaseProfile.append('<option value="">— Choose Profile —</option>');
            for (const k of allowedProfiles) {
                const sel = k === currentProfile ? ' selected' : '';
                $specBaseProfile.append(`<option value="${k}"${sel}>${BASE_PROFILE_LABELS[k]}</option>`);
            }
            // Base Value type options (per row dropdown)
            const allowedTypes = Object.keys(BASE_VALUE_TYPE_LABELS).filter((t) => (slot ? isBaseValueTypeAllowedForSlot(slot, t) : true));
            $specBvContainer.find('.node-spec-bv-type').each((_i, el) => {
                const $sel = $(el);
                const prev = String($sel.val() || '');
                $sel.empty();
                for (const t of allowedTypes) {
                    const sel = t === prev ? ' selected' : '';
                    $sel.append(`<option value="${t}"${sel}>${BASE_VALUE_TYPE_LABELS[t]}</option>`);
                }
            });
            // Stone Function attribute options
            const allowedAttrs = slot
                ? ATTRIBUTE_ACCESS_BY_SLOT[slot] || []
                : Object.keys(ATTR_LABELS);
            const curAttr = String($specStoneFnAttr.val() || '');
            $specStoneFnAttr.empty();
            $specStoneFnAttr.append('<option value="">— Attribute (slot-gated) —</option>');
            for (const a of allowedAttrs) {
                const sel = a === curAttr ? ' selected' : '';
                $specStoneFnAttr.append(`<option value="${a}"${sel}>${ATTR_LABELS[a] || a}</option>`);
            }
            // Limit hint
            const limit = slot ? BASE_VALUE_LIMIT_BY_SLOT[slot] : 3;
            $specBvLimitHint.text(`(max ${limit} Base Value${limit === 1 ? '' : 's'} for this slot)`);
            // Slot access hint
            if (slot) {
                const access = SLOT_POWER_ACCESS[slot];
                const label = ARTIFACT_SLOT_LABELS[slot];
                $specSlotHint.text(`Slot "${label}" — Primary: ${access.primary.join(', ')}. Secondary: ${access.secondary.join(', ') || '—'}. Not allowed: ${access.notAllowed.join(', ') || '—'}.`);
            }
            else {
                $specSlotHint.text('Pick a Slot to see allowed Powers / Base Values.');
            }
        };
        $specSlot.on('change', refreshSpecForSlot);
        refreshSpecForSlot();
        // --- "+ Add Base Value" cloning ---
        html.find('.node-add-row[data-target="spec-bv"]').on('click', () => {
            const slot = String($specSlot.val() || '').trim();
            const limit = slot ? BASE_VALUE_LIMIT_BY_SLOT[slot] : 3;
            const rows = $specBvContainer.find('.node-spec-bv-row');
            if (rows.length >= limit) {
                ui.notifications?.warn(`Slot allows at most ${limit} Base Value(s).`);
                return;
            }
            const $first = rows.first();
            const $clone = $first.clone();
            $clone.find('input').val('');
            $clone.find('select').each((_i, sel) => {
                const $sel = $(sel);
                const opts = $sel.find('option');
                if (opts.length > 0)
                    $sel.val(String(opts.first().attr('value') || ''));
            });
            $specBvContainer.append($clone);
        });
        // Remove handler for spec base-value rows (uses existing .node-row-remove, but must allow removing all the way down to 0)
        html.on('click', '.node-spec-bv-row .node-row-remove', (e) => {
            const $row = $(e.currentTarget).closest('.node-spec-bv-row');
            const $parent = $row.parent();
            if ($parent.find('.node-spec-bv-row').length <= 1) {
                $row.find('input').val('');
            }
            else {
                $row.remove();
            }
            e.stopPropagation();
        });
        const cloneInnateRow = () => {
            const $c = html.find('#node-weapon-innates');
            const $first = $c.find('.node-select-row').not('.node-row-locked').first();
            const $use = $first.length ? $first : $c.find('.node-select-row').first();
            const $clone = $use.clone();
            $clone.removeClass('node-row-locked');
            $clone.find('.node-weapon-innate').prop('disabled', false).val('');
            $clone.find('.node-row-remove').removeClass('hidden');
            $c.append($clone);
        };
        const cloneSpecialRow = () => {
            const $c = html.find('#node-weapon-specials');
            const $first = $c.find('.node-special-row').not('.node-row-locked').first();
            const $use = $first.length ? $first : $c.find('.node-special-row').first();
            const $clone = $use.clone();
            $clone.removeClass('node-row-locked');
            $clone.find('.node-weapon-special-id').prop('disabled', false).val('');
            $clone.find('.node-weapon-special-val').val('');
            $clone.find('.node-weapon-special-val-wrap').addClass('hidden');
            $clone.find('.node-row-remove').removeClass('hidden');
            $c.append($clone);
        };
        html.find('.node-add-row[data-target="innates"]').on('click', () => {
            cloneInnateRow();
        });
        html.find('.node-add-row[data-target="specials"]').on('click', () => {
            cloneSpecialRow();
        });
        html.on('change', '.node-weapon-special-id', (e) => {
            const $row = $(e.currentTarget).closest('.node-special-row');
            syncSpecialRowValueVisibility($row);
        });
        html.find('.node-special-row').each((_i, el) => {
            syncSpecialRowValueVisibility($(el));
        });
        html.on('click', '.node-row-remove', (e) => {
            const $row = $(e.currentTarget).closest('.node-select-row, .node-special-row');
            if ($row.hasClass('node-row-locked'))
                return;
            const $parent = $row.parent();
            const isSpecial = $row.hasClass('node-special-row');
            const minRows = 1;
            if ($parent.find(isSpecial ? '.node-special-row' : '.node-select-row').length <= minRows) {
                if (isSpecial) {
                    $row.find('.node-weapon-special-id').val('');
                    $row.find('.node-weapon-special-val').val('');
                    $row.find('.node-weapon-special-val-wrap').addClass('hidden');
                }
                else {
                    $row.find('.node-weapon-innate').val('');
                }
                return;
            }
            $row.remove();
        });
        html.find('button[data-button="save"]').on('click', async (e) => {
            e.preventDefault();
            try {
                await this.saveNode(html);
                await Promise.resolve(this._onSaved?.());
                this.close();
            }
            catch (err) {
                console.error(err);
                ui.notifications?.error('Could not save artifact node.');
            }
        });
        html.find('button[data-button="cancel"]').on('click', () => {
            this.close();
        });
        html.find('[data-action="open-embedded-powers"]').on('click', () => {
            const lin = resolveLineageForItem(this.item);
            new EmbeddedPowerDialog(this.item, {
                onSaved: () => this.render(false),
                lineage: {
                    isLineageRoot: lin.isLineageRoot,
                    lockedPowerIds: lin.mergedAncestorPowerIds,
                    maxTotalPowers: lin.maxTotalPowers,
                    treeDepth: lin.depth
                }
            }).render(true);
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
    collectWeaponSpecials(html) {
        const out = [];
        html.find('.node-special-row').each((_i, el) => {
            const $r = $(el);
            const id = String($r.find('.node-weapon-special-id').val() || '').trim();
            if (!id)
                return;
            const ef = getEffectById(id);
            let value;
            if (ef?.hasValue) {
                const raw = String($r.find('.node-weapon-special-val').val() || '').trim();
                if (raw !== '') {
                    const n = parseInt(raw, 10);
                    if (Number.isFinite(n))
                        value = n;
                }
            }
            out.push({ specialId: id, value });
        });
        return out;
    }
    mergeInnatesForSave(html, lineage) {
        const dom = this.collectSelectValues(html, '.node-weapon-innate');
        const merged = [...lineage.lockedInnateList];
        const seen = new Set(merged);
        for (const v of dom) {
            if (v && !lineage.lockedInnateSet.has(v) && !seen.has(v)) {
                seen.add(v);
                merged.push(v);
            }
        }
        return merged;
    }
    mergeSpecialsForSave(html, lineage) {
        const collected = this.collectWeaponSpecials(html);
        const byKey = new Map(collected.map((r) => [specialRefKey(r), r]));
        const merged = [];
        for (const lock of lineage.lockedSpecialList) {
            merged.push(byKey.get(specialRefKey(lock)) || lock);
        }
        for (const c of collected) {
            if (!lineage.lockedSpecialKeySet.has(specialRefKey(c)))
                merged.push(c);
        }
        return merged;
    }
    async saveNode(html) {
        const lineage = resolveLineageForItem(this.item);
        let kind = html.find('#node-artifact-kind').val();
        let gearSlot = kind === 'gear' ? String(html.find('#node-gear-slot').val() || '').trim() : '';
        let weaponType = html.find('#node-weapon-type').val() || 'melee';
        let hands = Math.min(2, Math.max(1, parseInt(html.find('#node-weapon-hands').val(), 10) || 1));
        if (!lineage.isLineageRoot) {
            kind = lineage.lockedBasics.artifactKind;
            gearSlot = lineage.lockedBasics.gearSlot;
            weaponType = lineage.lockedBasics.weaponType;
            hands = lineage.lockedBasics.hands;
        }
        const preset = html.find('#node-weapon-damage-preset').val();
        const damage = coerceTreeDamage(preset || '1d8');
        const innateAbilities = this.mergeInnatesForSave(html, lineage);
        const specials = this.mergeSpecialsForSave(html, lineage);
        const artifactWeapon = {
            weaponType,
            damage,
            range: String(html.find('#node-weapon-range').val() || '0m').trim() || '0m',
            hands,
            innateAbilities,
            specials
        };
        let armorType = String(html.find('#node-armor-type').val() || 'light');
        let shieldType = String(html.find('#node-shield-type').val() || 'parry');
        if (!lineage.isLineageRoot) {
            armorType = lineage.rootArmorType;
            shieldType = lineage.rootShieldType;
        }
        const artifactArmor = {
            type: armorType,
            armorValue: parseInt(html.find('#node-armor-value').val(), 10) || 0,
            evadeModifier: parseInt(html.find('#node-armor-evade').val(), 10) || 0,
            skillPenalty: String(html.find('#node-armor-skill-penalty').val() || '').trim()
        };
        const artifactShield = {
            type: shieldType,
            shieldValue: parseInt(html.find('#node-shield-value').val(), 10) || 0,
            evadeBonus: parseInt(html.find('#node-shield-evade').val(), 10) || 0,
            skillPenalty: String(html.find('#node-shield-skill-penalty').val() || '').trim()
        };
        const requirements = {
            stones: parseInt(html.find('#node-stones').val(), 10) || 0,
            masteryRank: parseInt(html.find('#node-mastery-rank').val(), 10) || 1
        };
        const inventorySize = String(html.find('#node-inventory-size').val() || '1x1').trim() || '1x1';
        const clearedBonuses = { attack: 0, damage: '', defense: 0, specials: [] };
        // ---- New Artifact Spec (Slot / Base Profile / Base Values / Stone Function / Binding) ----
        const specSlotRaw = String(html.find('#node-spec-slot').val() || '').trim();
        const specSlot = ARTIFACT_SLOT_KEYS.includes(specSlotRaw)
            ? specSlotRaw
            : null;
        const specBaseProfileRaw = String(html.find('#node-spec-base-profile').val() || '').trim();
        let specBaseProfile = null;
        if (specSlot && specBaseProfileRaw) {
            const allowed = BASE_PROFILES_BY_SLOT[specSlot] || [];
            if (allowed.includes(specBaseProfileRaw)) {
                specBaseProfile = specBaseProfileRaw;
            }
        }
        const specBindingRaw = String(html.find('#node-spec-binding').val() || 'unbound').trim();
        const specBinding = specBindingRaw === 'echo' || specBindingRaw === 'bound' || specBindingRaw === 'unbound'
            ? specBindingRaw
            : 'unbound';
        const baseValueLimit = specSlot ? BASE_VALUE_LIMIT_BY_SLOT[specSlot] : 3;
        const baseValueRows = html.find('.node-spec-bv-row').toArray();
        const baseValues = [];
        for (const row of baseValueRows) {
            if (baseValues.length >= baseValueLimit)
                break;
            const $row = $(row);
            const slotLetterRaw = String($row.find('.node-spec-bv-slot').val() || 'a').trim().toLowerCase();
            const slotLetter = slotLetterRaw === 'b' || slotLetterRaw === 'c' ? slotLetterRaw : 'a';
            const typeRaw = String($row.find('.node-spec-bv-type').val() || '').trim();
            if (!typeRaw)
                continue;
            if (specSlot && !isBaseValueTypeAllowedForSlot(specSlot, typeRaw)) {
                continue;
            }
            const label = String($row.find('.node-spec-bv-label').val() || '').trim();
            const valueStr = String($row.find('.node-spec-bv-value').val() || '').trim();
            const valueNum = Number(valueStr);
            baseValues.push({
                slot: slotLetter,
                type: typeRaw,
                label,
                value: valueStr === '' || Number.isNaN(valueNum) ? valueStr : valueNum,
            });
        }
        const stoneFnKindRaw = String(html.find('#node-spec-stone-fn-kind').val() || '').trim();
        const stoneFnAttrRaw = String(html.find('#node-spec-stone-fn-attr').val() || '').trim();
        const stoneFnPowerRaw = String(html.find('#node-spec-stone-fn-power').val() || '').trim();
        let stoneFunction = null;
        const stoneFnKinds = [
            'stonePowerSupport',
            'stonePool',
            'stoneRefresh',
            'stoneBattery',
        ];
        if (stoneFnKindRaw &&
            stoneFnAttrRaw &&
            stoneFnKinds.includes(stoneFnKindRaw) &&
            (!specSlot || isAttributeAllowedForStoneFunctionInSlot(specSlot, stoneFnAttrRaw))) {
            stoneFunction = {
                kind: stoneFnKindRaw,
                attribute: stoneFnAttrRaw,
            };
            if (stoneFnKindRaw === 'stonePowerSupport' && stoneFnPowerRaw) {
                stoneFunction.stonePowerId = stoneFnPowerRaw;
            }
        }
        const equipSlots = inferArtifactEquipSlots({
            artifactKind: kind,
            gearSlot,
            artifactWeapon,
            slot: specSlot || undefined,
            baseProfile: specBaseProfile || undefined,
        });
        const updates = {
            'system.artifactKind': kind,
            'system.gearSlot': gearSlot,
            'system.artifactWeapon': artifactWeapon,
            'system.artifactArmor': artifactArmor,
            'system.artifactShield': artifactShield,
            'system.bonuses': clearedBonuses,
            'system.requirements': requirements,
            'system.inventorySize': inventorySize,
            'system.slot': specSlot,
            'system.baseProfile': specBaseProfile,
            'system.baseValues': baseValues,
            'system.stoneFunction': stoneFunction,
            'system.binding': specBinding,
            ...(equipSlots ? { 'system.equipSlots': equipSlots } : {})
        };
        await this.item.update(updates);
        const childIds = this.item.getFlag('mastery-system', 'childIds') || [];
        if (childIds.length > 0) {
            await syncArtifactInheritedFromParent(this.item);
        }
        await pushWorldArtifactNodeToEmbeddedActors(this.item);
        ui.notifications?.info('Artifact node updated.');
    }
}
//# sourceMappingURL=node-editor.js.map