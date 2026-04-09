/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */
import { ARTIFACT_GEAR_SLOT_OPTIONS, getArtifactSpecialSelectOptions, getArtifactTreeWeaponDamagePresets, getArtifactWeaponInnateOptions } from '../utils/artifact-node-options.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { buildArtifactNodeIdMap, findRootItem, getAncestorChainRootFirst, getLockedWeaponBasics, getMaxTotalEmbeddedPowers, getMergedAncestorPowerIds, getTreeDepth, isLineageRootItem, mergeInnatesFromAncestors, mergeSpecialRefsFromAncestors, specialRefKey } from '../utils/artifact-tree-lineage.js';
import { normalizePowersForEditor } from '../utils/embedded-power-ui-constants.js';
import { EmbeddedPowerDialog } from './embedded-power-dialog.js';
import { getEffectById, parseEffectStrings } from '../utils/special-effects.js';
// Use V1 Application for reliable template rendering in v13
const BaseDialog = foundry?.appv1?.Application || Application;
const TREE_DAMAGE_PRESETS = getArtifactTreeWeaponDamagePresets();
const TREE_PRESET_VALUES = new Set(TREE_DAMAGE_PRESETS.map((p) => p.value));
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
        data.isLineageRoot = lineage.isLineageRoot;
        data.lineageHint = lineage.isLineageRoot
            ? ''
            : 'Tree child: item type, weapon type, hands, gear slot, and armor/shield type match the root node. Inherited innates/specials/powers cannot be removed; you can add more.';
        const emb = normalizePowersForEditor(system.powers);
        data.embeddedPowersSummary =
            emb.length === 0
                ? 'No embedded powers on this item yet.'
                : `${emb.length} power(s) on this item: ${emb.map((p) => p.name).join(', ')}`;
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
        const childIds = this.item.getFlag('mastery-system', 'childIds') || [];
        if (childIds.length > 0) {
            await syncArtifactInheritedFromParent(this.item);
        }
        ui.notifications?.info('Artifact node updated.');
    }
}
//# sourceMappingURL=node-editor.js.map