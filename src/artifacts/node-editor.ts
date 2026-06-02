/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */

import type {
  ArtifactArmorProfile,
  ArtifactBaseProfileKey,
  ArtifactBaseValue,
  ArtifactBaseValueType,
  ArtifactKind,
  ArtifactProgressionPick,
  ArtifactShieldProfile,
  ArtifactSlotKey,
  ArtifactStoneFunction,
  ArtifactStoneFunctionKind,
  ArtifactWeaponProfile,
  ArtifactWeaponSpecialRef
} from '../types/item.js';
import {
  ARTIFACT_GEAR_SLOT_OPTIONS,
  getArtifactPowerCatalogOptions,
  getArtifactSpecialSelectOptions,
  getArtifactTreeWeaponDamagePresets,
  getArtifactWeaponInnateOptions
} from '../utils/artifact-node-options.js';
import {
  ARTIFACT_SLOT_KEYS,
  ARTIFACT_SLOT_LABELS,
  ATTRIBUTE_ACCESS_BY_SLOT,
  BASE_PROFILE_LABELS,
  BASE_PROFILES_BY_SLOT,
  BASE_VALUE_LIMIT_BY_SLOT,
  BASE_VALUE_TYPE_LABELS,
  isAttributeAllowedForStoneFunctionInSlot,
  isBaseValueTypeAllowedForSlot,
  SLOT_POWER_ACCESS,
  type ArtifactBaseValueType as SpecBaseValueType,
} from '../utils/artifact-rules.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { pushWorldArtifactNodeToEmbeddedActors } from '../utils/artifact-embedded-sync.js';
import { inferArtifactEquipSlots } from '../utils/equip-slots.js';
import {
  buildArtifactNodeIdMap,
  findRootItem,
  getAncestorChainRootFirst,
  getLockedWeaponBasics,
  getMaxTotalEmbeddedPowers,
  getMergedAncestorPowerIds,
  getTreeDepth,
  isLineageRootItem,
  mergeInnatesFromAncestors,
  mergeSpecialRefsFromAncestors,
  specialRefKey
} from '../utils/artifact-tree-lineage.js';
import { normalizePowersForEditor } from '../utils/embedded-power-ui-constants.js';
import { EmbeddedPowerDialog } from './embedded-power-dialog.js';
import { getEffectById, parseEffectStrings } from '../utils/special-effects.js';

// Use V1 Application for reliable template rendering in v13
const BaseDialog: any = (foundry as any)?.appv1?.Application || (Application as any);

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
] as const;

function defaultWeaponProfile(): ArtifactWeaponProfile {
  return {
    weaponType: 'melee',
    damage: '1d8',
    range: '0m',
    hands: 1,
    innateAbilities: [],
    specials: []
  };
}

function defaultArmorProfile(): ArtifactArmorProfile {
  return { type: 'light', armorValue: 0, evadeModifier: 0, skillPenalty: '' };
}

function defaultShieldProfile(): ArtifactShieldProfile {
  return { type: 'parry', shieldValue: 0, evadeBonus: 0, skillPenalty: '' };
}

function migrateWeaponSpecials(weaponSys: any, bonuses: any): ArtifactWeaponSpecialRef[] {
  const raw = weaponSys?.specials;
  if (Array.isArray(raw) && raw.length > 0) {
    const first = raw[0];
    if (typeof first === 'object' && first !== null && 'specialId' in first) {
      return raw
        .map((x: any) => ({
          specialId: String(x.specialId || '').trim(),
          value: x.value != null && x.value !== '' ? Number(x.value) : undefined
        }))
        .filter((x: ArtifactWeaponSpecialRef) => x.specialId);
    }
    const strs = raw.map((s: unknown) => String(s).trim()).filter(Boolean);
    return parseEffectStrings(strs);
  }
  const bonusStrs = (bonuses?.specials || []).map((s: unknown) => String(s).trim()).filter(Boolean);
  return parseEffectStrings(bonusStrs);
}

/** Normalize legacy `bonuses` into profiles when new fields are missing. */
function resolveProfiles(system: any): {
  artifactKind: ArtifactKind;
  gearSlot: string;
  weapon: ArtifactWeaponProfile;
  armor: ArtifactArmorProfile;
  shield: ArtifactShieldProfile;
} {
  const bonuses = system.bonuses || { attack: 0, damage: '', defense: 0, specials: [] };
  let artifactKind: ArtifactKind = (system.artifactKind as ArtifactKind) || 'weapon';
  if (!['weapon', 'armor', 'shield', 'gear'].includes(artifactKind)) artifactKind = 'weapon';

  const gearSlot = typeof system.gearSlot === 'string' ? system.gearSlot : '';

  let weapon: ArtifactWeaponProfile = system.artifactWeapon
    ? foundry.utils.duplicate(system.artifactWeapon)
    : defaultWeaponProfile();
  if (!system.artifactWeapon) {
    if (bonuses.damage) weapon.damage = String(bonuses.damage);
  }
  weapon.specials = migrateWeaponSpecials(system.artifactWeapon, bonuses);

  const armor: ArtifactArmorProfile = system.artifactArmor
    ? foundry.utils.duplicate(system.artifactArmor)
    : defaultArmorProfile();

  const shield: ArtifactShieldProfile = system.artifactShield
    ? foundry.utils.duplicate(system.artifactShield)
    : defaultShieldProfile();

  return { artifactKind, gearSlot, weapon, armor, shield };
}

function getFolderArtifactItemsForItem(item: Item): Item[] {
  const folderId = (item as any).folder?.id;
  if (!folderId) return [];
  return (
    (game as any).items?.filter((it: any) => it.folder?.id === folderId && it.type === 'artifact') || []
  );
}

function resolveLineageForItem(item: Item) {
  const folderItems = getFolderArtifactItemsForItem(item);
  const nodeIdMap = buildArtifactNodeIdMap(folderItems as any);
  const isLineageRoot = folderItems.length === 0 || isLineageRootItem(item as any);
  const ancestors = getAncestorChainRootFirst(item as any, nodeIdMap);
  const rootItem = folderItems.length ? findRootItem(item as any, nodeIdMap) : item;
  const rootSystem = (rootItem as Item).system as any;
  const lockedBasics = getLockedWeaponBasics(rootSystem);
  const { ordered: lockedInnateList, set: lockedInnateSet } = mergeInnatesFromAncestors(ancestors as any);
  const { ordered: lockedSpecialList, keySet: lockedSpecialKeySet } = mergeSpecialRefsFromAncestors(ancestors as any);
  const mergedAncestorPowerIds = getMergedAncestorPowerIds(ancestors as any);
  const depth = folderItems.length ? getTreeDepth(item as any, nodeIdMap) : 1;
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

function buildInnateRows(innates: string[], lockedSet: Set<string>): { value: string; locked: boolean }[] {
  const list = (innates || []).map((s) => String(s).trim()).filter(Boolean);
  const rows: { value: string; locked: boolean }[] = list.map((value) => ({
    value,
    locked: lockedSet.has(value)
  }));
  return rows.length ? rows : [{ value: '', locked: false }];
}

function buildSpecialRows(refs: ArtifactWeaponSpecialRef[], lockedKeySet: Set<string>): any[] {
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

function coerceTreeDamage(damageStr: string): string {
  const t = String(damageStr || '').trim();
  if (TREE_PRESET_VALUES.has(t)) return t;
  return '1d8';
}

/**
 * Derive the legacy `artifactKind` from the new spec Base Profile.
 * The Item Type is no longer chosen directly; Slot + Base Profile drive it.
 */
function deriveArtifactKindFromProfile(baseProfile: string): ArtifactKind {
  switch (baseProfile) {
    case 'oneHandedWeapon':
    case 'twoHandedWeapon':
      return 'weapon';
    case 'shield':
      return 'shield';
    case 'bodyArmor':
    case 'robe':
    case 'noArmorBody':
      return 'armor';
    default:
      return 'gear';
  }
}

/** Derive the legacy gear paperdoll slot from the canonical artifact Slot. */
function deriveGearSlotFromSlot(slot: string): string {
  switch (slot) {
    case 'head':
      return 'head';
    case 'feet':
      return 'feet';
    case 'amulet':
      return 'amulet';
    case 'ring':
      return 'ring';
    default:
      return '';
  }
}

function syncWeaponRangeLabel(html: JQuery): void {
  const melee = html.find('#node-weapon-type').val() === 'melee';
  html.find('#node-weapon-range-label').text(melee ? 'Reach' : 'Range');
  html
    .find('#node-weapon-range')
    .attr('placeholder', melee ? 'e.g. 0m, Reach (+1 m)' : 'e.g. 8/16/32m');
}

function syncSpecialRowValueVisibility($row: JQuery): void {
  const $sel = $row.find('.node-weapon-special-id');
  const id = String($sel.val() || '').trim();
  const $opt = $sel.find('option:selected');
  const dataHv = $opt.attr('data-has-value');
  const hasValue = dataHv !== 'false' && id.length > 0;
  $row.find('.node-weapon-special-val-wrap').toggleClass('hidden', !hasValue);
}

export class NodeEditor extends BaseDialog {
  private item: Item;
  private _onSaved?: () => void | Promise<void>;

  constructor(item: Item, options?: { onSaved?: () => void | Promise<void> }) {
    super();
    this.item = item;
    this._onSaved = options?.onSaved;
  }

  static get defaultOptions(): any {
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

  getData(options?: any): any {
    const data: any = super.getData ? super.getData(options) : {};
    const system = this.item.system as any;

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
    data.inventorySizeOptions = INVENTORY_SIZE_PRESETS.includes(curInv as (typeof INVENTORY_SIZE_PRESETS)[number])
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
    const specSlot = String(system.slot || '') as ArtifactSlotKey | '';
    const specBaseProfile = String(system.baseProfile || '') as ArtifactBaseProfileKey | '';
    const specBinding = String(system.binding || 'unbound');
    const baseValues = Array.isArray(system.baseValues)
      ? (system.baseValues as ArtifactBaseValue[])
      : [];
    const stoneFn = (system.stoneFunction as ArtifactStoneFunction | null | undefined) || null;

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
      label: BASE_PROFILE_LABELS[k as ArtifactBaseProfileKey],
    }));
    data.specBaseValueTypeOptions = Object.entries(BASE_VALUE_TYPE_LABELS)
      .filter(([type]) =>
        specSlot ? isBaseValueTypeAllowedForSlot(specSlot, type as SpecBaseValueType) : true,
      )
      .map(([key, label]) => ({ key, label }));

    const attrCatalog: Record<string, string> = {
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
      ? `Slot "${ARTIFACT_SLOT_LABELS[specSlot as ArtifactSlotKey]}" — Primary: ${slotAccess.primary.join(', ')}. Secondary: ${slotAccess.secondary.join(', ') || '—'}. Not allowed: ${slotAccess.notAllowed.join(', ') || '—'}.`
      : 'Pick a Slot to see allowed Powers / Base Values.';

    data.specBaseValueRows = (baseValues.length > 0
      ? baseValues
      : [{ slot: 'a', type: 'minorFeature', label: '', value: '' } as ArtifactBaseValue]
    ).map((bv) => ({
      slot: bv.slot || 'a',
      type: bv.type || 'minorFeature',
      label: bv.label || '',
      valueStr: bv.value != null ? String(bv.value) : '',
    }));

    if (specSlot) {
      const limit = BASE_VALUE_LIMIT_BY_SLOT[specSlot];
      data.specBaseValueLimit = limit;
    } else {
      data.specBaseValueLimit = 3;
    }

    // ---- Level Progression picks (3 lines @ Basic Level 1/2/3) ----
    data.powerCatalogOptions = getArtifactPowerCatalogOptions();

    const storedPicks = Array.isArray(system.progressionPicks)
      ? (system.progressionPicks as ArtifactProgressionPick[])
      : [];
    const pickByLevel = new Map<number, ArtifactProgressionPick>();
    for (const p of storedPicks) {
      const lvl = Number(p?.level);
      if (lvl >= 1 && lvl <= 3) pickByLevel.set(lvl, p);
    }
    // Back-compat: if no picks yet but a legacy single stoneFunction exists, seed it on Level 1.
    if (storedPicks.length === 0 && stoneFn) {
      pickByLevel.set(1, { level: 1, kind: 'stoneFunction', stoneFunction: stoneFn });
    }
    data.progressionPickRows = [1, 2, 3].map((lvl) => {
      const p = pickByLevel.get(lvl);
      const sf = p?.stoneFunction || null;
      return {
        level: lvl,
        kind: p?.kind || 'none',
        isPower: p?.kind === 'power',
        isStoneFn: p?.kind === 'stoneFunction',
        powerTemplateId: p?.powerTemplateId || '',
        stoneKind: sf?.kind || '',
        stoneAttr: sf?.attribute || '',
        stonePowerId: sf?.stonePowerId || '',
      };
    });

    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    const syncKindUi = () => {
      const profile = String(html.find('#node-spec-base-profile').val() || '');
      const kind = deriveArtifactKindFromProfile(profile);
      html.find('#node-derived-kind').val(kind);
      html.find('[data-profile]').each((_i, el) => {
        const $el = $(el);
        const p = String($el.data('profile') || '');
        $el.toggleClass('hidden', p !== kind);
      });
    };
    syncKindUi();

    html.find('#node-weapon-type').on('change', () => syncWeaponRangeLabel(html));
    syncWeaponRangeLabel(html);

    // --- Artifact Spec: dynamic slot → base-profile / base-value-types / stone-fn attribute sync ---
    const $specSlot = html.find('#node-spec-slot');
    const $specBaseProfile = html.find('#node-spec-base-profile');
    const $specBvContainer = html.find('#node-spec-base-values');
    const $specBvLimitHint = html.find('#node-spec-bv-limit-hint');
    const $specSlotHint = html.find('#node-spec-slot-power-hint');

    const ATTR_LABELS: Record<string, string> = {
      might: 'Might',
      agility: 'Agility',
      vitality: 'Vitality',
      intellect: 'Intellect',
      resolve: 'Resolve',
      influence: 'Influence',
      wits: 'Wits',
    };

    const refreshSpecForSlot = () => {
      const slot = String($specSlot.val() || '').trim() as ArtifactSlotKey | '';

      // Base Profile options
      const allowedProfiles = slot
        ? BASE_PROFILES_BY_SLOT[slot] || []
        : (Object.keys(BASE_PROFILE_LABELS) as ArtifactBaseProfileKey[]);
      const currentProfile = String($specBaseProfile.val() || '');
      $specBaseProfile.empty();
      $specBaseProfile.append('<option value="">— Choose Profile —</option>');
      for (const k of allowedProfiles) {
        const sel = k === currentProfile ? ' selected' : '';
        $specBaseProfile.append(
          `<option value="${k}"${sel}>${BASE_PROFILE_LABELS[k as ArtifactBaseProfileKey]}</option>`,
        );
      }

      // Base Value type options (per row dropdown)
      const allowedTypes = (Object.keys(BASE_VALUE_TYPE_LABELS) as SpecBaseValueType[]).filter(
        (t) => (slot ? isBaseValueTypeAllowedForSlot(slot, t) : true),
      );
      $specBvContainer.find('.node-spec-bv-type').each((_i, el) => {
        const $sel = $(el);
        const prev = String($sel.val() || '');
        $sel.empty();
        for (const t of allowedTypes) {
          const sel = t === prev ? ' selected' : '';
          $sel.append(`<option value="${t}"${sel}>${BASE_VALUE_TYPE_LABELS[t]}</option>`);
        }
      });

      // Stone Function attribute options (per Level Progression pick, slot-gated)
      const allowedAttrs = slot
        ? ATTRIBUTE_ACCESS_BY_SLOT[slot] || []
        : (Object.keys(ATTR_LABELS) as (keyof typeof ATTR_LABELS)[]);
      html.find('.node-pick-stone-attr').each((_i, el) => {
        const $sel = $(el);
        const curAttr = String($sel.val() || '');
        $sel.empty();
        $sel.append('<option value="">— Attribute (slot-gated) —</option>');
        for (const a of allowedAttrs) {
          const sel = a === curAttr ? ' selected' : '';
          $sel.append(`<option value="${a}"${sel}>${ATTR_LABELS[a as string] || a}</option>`);
        }
      });

      // Limit hint
      const limit = slot ? BASE_VALUE_LIMIT_BY_SLOT[slot] : 3;
      $specBvLimitHint.text(`(max ${limit} Base Value${limit === 1 ? '' : 's'} for this slot)`);

      // Slot access hint
      if (slot) {
        const access = SLOT_POWER_ACCESS[slot];
        const label = ARTIFACT_SLOT_LABELS[slot];
        $specSlotHint.text(
          `Slot "${label}" — Primary: ${access.primary.join(', ')}. Secondary: ${access.secondary.join(', ') || '—'}. Not allowed: ${access.notAllowed.join(', ') || '—'}.`,
        );
      } else {
        $specSlotHint.text('Pick a Slot to see allowed Powers / Base Values.');
      }

      // Keep the derived Item Type + visible profile block in sync.
      syncKindUi();
    };

    $specSlot.on('change', refreshSpecForSlot);
    $specBaseProfile.on('change', syncKindUi);
    refreshSpecForSlot();

    // --- Level Progression picks: toggle Power vs Stone Function fields per row ---
    const syncProgressionRow = ($row: JQuery) => {
      const kind = String($row.find('.node-pick-kind').val() || 'none');
      $row.find('.node-pick-power').toggleClass('hidden', kind !== 'power');
      $row.find('.node-pick-stonefn').toggleClass('hidden', kind !== 'stoneFunction');
    };
    const refreshStoneFnWarning = () => {
      const count = html
        .find('.node-progression-pick .node-pick-kind')
        .toArray()
        .filter((el) => String($(el).val() || '') === 'stoneFunction').length;
      html.find('.node-progression-stonefn-warning').toggleClass('hidden', count <= 1);
    };
    html.find('.node-progression-pick').each((_i, el) => syncProgressionRow($(el)));
    refreshStoneFnWarning();
    html.on('change', '.node-pick-kind', (e: JQuery.ChangeEvent) => {
      syncProgressionRow($(e.currentTarget).closest('.node-progression-pick'));
      refreshStoneFnWarning();
    });

    // --- "+ Add Base Value" cloning ---
    html.find('.node-add-row[data-target="spec-bv"]').on('click', () => {
      const slot = String($specSlot.val() || '').trim() as ArtifactSlotKey | '';
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
        if (opts.length > 0) $sel.val(String(opts.first().attr('value') || ''));
      });
      $specBvContainer.append($clone);
    });

    // Remove handler for spec base-value rows (uses existing .node-row-remove, but must allow removing all the way down to 0)
    html.on('click', '.node-spec-bv-row .node-row-remove', (e: JQuery.ClickEvent) => {
      const $row = $(e.currentTarget).closest('.node-spec-bv-row');
      const $parent = $row.parent();
      if ($parent.find('.node-spec-bv-row').length <= 1) {
        $row.find('input').val('');
      } else {
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

    html.on('change', '.node-weapon-special-id', (e: JQuery.ChangeEvent) => {
      const $row = $(e.currentTarget).closest('.node-special-row');
      syncSpecialRowValueVisibility($row);
    });

    html.find('.node-special-row').each((_i, el) => {
      syncSpecialRowValueVisibility($(el));
    });

    html.on('click', '.node-row-remove', (e: JQuery.ClickEvent) => {
      const $row = $(e.currentTarget).closest('.node-select-row, .node-special-row');
      if ($row.hasClass('node-row-locked')) return;
      const $parent = $row.parent();
      const isSpecial = $row.hasClass('node-special-row');
      const minRows = 1;
      if ($parent.find(isSpecial ? '.node-special-row' : '.node-select-row').length <= minRows) {
        if (isSpecial) {
          $row.find('.node-weapon-special-id').val('');
          $row.find('.node-weapon-special-val').val('');
          $row.find('.node-weapon-special-val-wrap').addClass('hidden');
        } else {
          $row.find('.node-weapon-innate').val('');
        }
        return;
      }
      $row.remove();
    });

    html.find('button[data-button="save"]').on('click', async (e: JQuery.ClickEvent) => {
      e.preventDefault();
      try {
        await this.saveNode(html);
        await Promise.resolve(this._onSaved?.());
        (this as any).close();
      } catch (err) {
        console.error(err);
        ui.notifications?.error('Could not save artifact node.');
      }
    });

    html.find('button[data-button="cancel"]').on('click', () => {
      (this as any).close();
    });

    html.find('[data-action="open-embedded-powers"]').on('click', () => {
      const lin = resolveLineageForItem(this.item);
      new EmbeddedPowerDialog(this.item, {
        onSaved: () => (this as any).render(false),
        lineage: {
          isLineageRoot: lin.isLineageRoot,
          lockedPowerIds: lin.mergedAncestorPowerIds,
          maxTotalPowers: lin.maxTotalPowers,
          treeDepth: lin.depth
        }
      }).render(true);
    });
  }

  collectSelectValues(html: JQuery, selectClass: string): string[] {
    const out: string[] = [];
    html.find(selectClass).each((_i, el) => {
      const v = ($(el).val() as string || '').trim();
      if (v) out.push(v);
    });
    return out;
  }

  collectWeaponSpecials(html: JQuery): ArtifactWeaponSpecialRef[] {
    const out: ArtifactWeaponSpecialRef[] = [];
    html.find('.node-special-row').each((_i, el) => {
      const $r = $(el);
      const id = String($r.find('.node-weapon-special-id').val() || '').trim();
      if (!id) return;
      const ef = getEffectById(id);
      let value: number | undefined;
      if (ef?.hasValue) {
        const raw = String($r.find('.node-weapon-special-val').val() || '').trim();
        if (raw !== '') {
          const n = parseInt(raw, 10);
          if (Number.isFinite(n)) value = n;
        }
      }
      out.push({ specialId: id, value });
    });
    return out;
  }

  mergeInnatesForSave(html: JQuery, lineage: ReturnType<typeof resolveLineageForItem>): string[] {
    const dom = this.collectSelectValues(html, '.node-weapon-innate');
    const merged: string[] = [...lineage.lockedInnateList];
    const seen = new Set(merged);
    for (const v of dom) {
      if (v && !lineage.lockedInnateSet.has(v) && !seen.has(v)) {
        seen.add(v);
        merged.push(v);
      }
    }
    return merged;
  }

  mergeSpecialsForSave(html: JQuery, lineage: ReturnType<typeof resolveLineageForItem>): ArtifactWeaponSpecialRef[] {
    const collected = this.collectWeaponSpecials(html);
    const byKey = new Map(collected.map((r) => [specialRefKey(r), r]));
    const merged: ArtifactWeaponSpecialRef[] = [];
    for (const lock of lineage.lockedSpecialList) {
      merged.push(byKey.get(specialRefKey(lock)) || lock);
    }
    for (const c of collected) {
      if (!lineage.lockedSpecialKeySet.has(specialRefKey(c))) merged.push(c);
    }
    return merged;
  }

  async saveNode(html: JQuery): Promise<void> {
    const lineage = resolveLineageForItem(this.item);

    const baseProfileVal = String(html.find('#node-spec-base-profile').val() || '').trim();
    const slotVal = String(html.find('#node-spec-slot').val() || '').trim();
    let kind = deriveArtifactKindFromProfile(baseProfileVal);
    let gearSlot = kind === 'gear' ? deriveGearSlotFromSlot(slotVal) : '';
    let weaponType = (html.find('#node-weapon-type').val() as 'melee' | 'ranged') || 'melee';
    let hands = Math.min(2, Math.max(1, parseInt(html.find('#node-weapon-hands').val() as string, 10) || 1));

    if (!lineage.isLineageRoot) {
      kind = lineage.lockedBasics.artifactKind;
      gearSlot = lineage.lockedBasics.gearSlot;
      weaponType = lineage.lockedBasics.weaponType;
      hands = lineage.lockedBasics.hands;
    }

    const preset = html.find('#node-weapon-damage-preset').val() as string;
    const damage = coerceTreeDamage(preset || '1d8');

    const innateAbilities = this.mergeInnatesForSave(html, lineage);
    const specials = this.mergeSpecialsForSave(html, lineage);

    const artifactWeapon: ArtifactWeaponProfile = {
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

    const artifactArmor: ArtifactArmorProfile = {
      type: armorType,
      armorValue: parseInt(html.find('#node-armor-value').val() as string, 10) || 0,
      evadeModifier: parseInt(html.find('#node-armor-evade').val() as string, 10) || 0,
      skillPenalty: String(html.find('#node-armor-skill-penalty').val() || '').trim()
    };

    const artifactShield: ArtifactShieldProfile = {
      type: shieldType,
      shieldValue: parseInt(html.find('#node-shield-value').val() as string, 10) || 0,
      evadeBonus: parseInt(html.find('#node-shield-evade').val() as string, 10) || 0,
      skillPenalty: String(html.find('#node-shield-skill-penalty').val() || '').trim()
    };

    const requirements = {
      stones: parseInt(html.find('#node-stones').val() as string, 10) || 0,
      masteryRank: parseInt(html.find('#node-mastery-rank').val() as string, 10) || 1
    };

    const inventorySize =
      String(html.find('#node-inventory-size').val() || '1x1').trim() || '1x1';

    const clearedBonuses = { attack: 0, damage: '', defense: 0, specials: [] as string[] };

    // ---- New Artifact Spec (Slot / Base Profile / Base Values / Stone Function / Binding) ----
    const specSlotRaw = String(html.find('#node-spec-slot').val() || '').trim();
    const specSlot = (ARTIFACT_SLOT_KEYS as readonly string[]).includes(specSlotRaw)
      ? (specSlotRaw as ArtifactSlotKey)
      : null;

    const specBaseProfileRaw = String(html.find('#node-spec-base-profile').val() || '').trim();
    let specBaseProfile: ArtifactBaseProfileKey | null = null;
    if (specSlot && specBaseProfileRaw) {
      const allowed = BASE_PROFILES_BY_SLOT[specSlot] || [];
      if (allowed.includes(specBaseProfileRaw as ArtifactBaseProfileKey)) {
        specBaseProfile = specBaseProfileRaw as ArtifactBaseProfileKey;
      }
    }

    // Binding is no longer edited here; preserve whatever the item already has.
    const existingBinding = String((this.item.system as any).binding || 'unbound').trim();
    const specBinding =
      existingBinding === 'echo' || existingBinding === 'bound' ? existingBinding : 'unbound';

    const baseValueLimit = specSlot ? BASE_VALUE_LIMIT_BY_SLOT[specSlot] : 3;
    const baseValueRows = html.find('.node-spec-bv-row').toArray();
    const baseValues: ArtifactBaseValue[] = [];
    for (const row of baseValueRows) {
      if (baseValues.length >= baseValueLimit) break;
      const $row = $(row);
      const slotLetterRaw = String($row.find('.node-spec-bv-slot').val() || 'a').trim().toLowerCase();
      const slotLetter: 'a' | 'b' | 'c' =
        slotLetterRaw === 'b' || slotLetterRaw === 'c' ? slotLetterRaw : 'a';
      const typeRaw = String($row.find('.node-spec-bv-type').val() || '').trim();
      if (!typeRaw) continue;
      if (specSlot && !isBaseValueTypeAllowedForSlot(specSlot, typeRaw as SpecBaseValueType)) {
        continue;
      }
      const label = String($row.find('.node-spec-bv-label').val() || '').trim();
      const valueStr = String($row.find('.node-spec-bv-value').val() || '').trim();
      const valueNum = Number(valueStr);
      baseValues.push({
        slot: slotLetter,
        type: typeRaw as ArtifactBaseValueType,
        label,
        value: valueStr === '' || Number.isNaN(valueNum) ? valueStr : valueNum,
      });
    }

    // ---- Level Progression picks (Level 1/2/3 = Power or Stone Function) ----
    const stoneFnKinds: ArtifactStoneFunctionKind[] = [
      'stonePowerSupport',
      'stonePool',
      'stoneRefresh',
      'stoneBattery',
    ];
    const progressionPicks: ArtifactProgressionPick[] = [];
    html.find('.node-progression-pick').each((_i, el) => {
      const $row = $(el);
      const levelRaw = parseInt(String($row.attr('data-level') || ''), 10);
      const level = (levelRaw === 2 || levelRaw === 3 ? levelRaw : 1) as 1 | 2 | 3;
      const kindRaw = String($row.find('.node-pick-kind').val() || 'none').trim();

      if (kindRaw === 'power') {
        const powerTemplateId = String($row.find('.node-pick-power').val() || '').trim();
        if (powerTemplateId) {
          progressionPicks.push({ level, kind: 'power', powerTemplateId });
        }
      } else if (kindRaw === 'stoneFunction') {
        const sfKind = String($row.find('.node-pick-stone-kind').val() || '').trim();
        const sfAttr = String($row.find('.node-pick-stone-attr').val() || '').trim();
        const sfPower = String($row.find('.node-pick-stone-power').val() || '').trim();
        if (
          sfKind &&
          sfAttr &&
          (stoneFnKinds as string[]).includes(sfKind) &&
          (!specSlot || isAttributeAllowedForStoneFunctionInSlot(specSlot, sfAttr as any))
        ) {
          const sf: ArtifactStoneFunction = {
            kind: sfKind as ArtifactStoneFunctionKind,
            attribute: sfAttr as any,
          };
          if (sfKind === 'stonePowerSupport' && sfPower) sf.stonePowerId = sfPower;
          progressionPicks.push({ level, kind: 'stoneFunction', stoneFunction: sf });
        }
      }
    });

    // Derive the single canonical Stone Function from the first Stone Function pick
    // (keeps the actor-side aggregator working). Spec allows only one; soft-warn on more.
    const stoneFnPicks = progressionPicks.filter((p) => p.kind === 'stoneFunction' && p.stoneFunction);
    const stoneFunction: ArtifactStoneFunction | null = stoneFnPicks[0]?.stoneFunction || null;
    if (stoneFnPicks.length > 1) {
      ui.notifications?.warn(
        'More than one Stone Function selected; the spec allows at most one per artifact. Only the first is applied.',
      );
    }

    const equipSlots = inferArtifactEquipSlots({
      artifactKind: kind,
      gearSlot,
      artifactWeapon,
      slot: specSlot || undefined,
      baseProfile: specBaseProfile || undefined,
    });

    const updates: any = {
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
      'system.progressionPicks': progressionPicks,
      'system.binding': specBinding,
      ...(equipSlots ? { 'system.equipSlots': equipSlots } : {})
    };

    await this.item.update(updates);

    const childIds = ((this.item as any).getFlag('mastery-system', 'childIds') as string[]) || [];
    if (childIds.length > 0) {
      await syncArtifactInheritedFromParent(this.item);
    }

    await pushWorldArtifactNodeToEmbeddedActors(this.item);

    ui.notifications?.info('Artifact node updated.');
  }
}
