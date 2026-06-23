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
  ArtifactLevelProgressionRow,
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
  getArtifactSpecialSelectOptions,
  getArtifactTreeWeaponDamagePresets,
  getArtifactWeaponInnateOptions
} from '../utils/artifact-node-options.js';
import {
  isMartialDamageTemplateId,
  listMartialDamageSpecialOptions,
  MARTIAL_DELIVERY_OPTIONS,
  parseLegacyPick,
  resolvePickFromUi,
  type MartialDelivery,
} from '../utils/artifact-power-pick.js';
import {
  ARTIFACT_SLOT_KEYS,
  ARTIFACT_SLOT_LABELS,
  ATTRIBUTE_ACCESS_BY_SLOT,
  BASE_PROFILE_LABELS,
  BASE_PROFILES_BY_SLOT,
  BASE_VALUE_HARD_CAP,
  BASE_VALUE_LIMIT_BY_SLOT,
  BASE_VALUE_TYPE_LABELS,
  isAttributeAllowedForStoneFunctionInSlot,
  isBaseValueTypeAllowedForSlot,
  weaponBasicsForProfile,
  SLOT_POWER_ACCESS,
  type ArtifactBaseValueType as SpecBaseValueType,
} from '../utils/artifact-rules.js';
import { syncArtifactInheritedFromParent } from '../utils/artifact-folder-sync.js';
import { pushWorldArtifactNodeToEmbeddedActors } from '../utils/artifact-embedded-sync.js';
import { deriveLevelProgressionFromPicks } from './progression-compiler.js';
import { resolveFullLevelProgression } from '../utils/artifact-visible-abilities.js';
import {
  ACTIVE_TEMPLATES,
  ACTIVE_BUFF_TEMPLATES,
  REACTION_TEMPLATES,
  MOVEMENT_TEMPLATES,
  PASSIVE_TEMPLATES,
  getTemplate as getPowerTemplate,
} from '../utils/powers/index.js';
import { inferArtifactEquipSlots } from '../utils/equip-slots.js';
import {
  buildArtifactNodeIdMap,
  findRootItem,
  getAncestorChainRootFirst,
  getLockedWeaponBasics,
  getTreeDepth,
  isLineageRootItem,
  mergeInnatesFromAncestors,
  mergeSpecialRefsFromAncestors,
  specialRefKey
} from '../utils/artifact-tree-lineage.js';
import { getEffectById, parseEffectStrings } from '../utils/special-effects.js';
import { STONE_POWERS_BY_ATTRIBUTE } from '../stones/stone-powers.js';
import {
  deriveBaseValueDisplay,
  scaleWeaponSpecial,
  isScalingWeaponSpecial,
} from '../utils/artifact-base-derive.js';
import {
  catalogSpecialTierForTemplate,
  catalogTemplateRequiresSpecial,
  listCatalogSpecialOptions,
} from '../utils/artifact-catalog-pick.js';

// Use V1 Application for reliable template rendering in v13
const BaseDialog: any = (foundry as any)?.appv1?.Application || (Application as any);

const TREE_DAMAGE_PRESETS = getArtifactTreeWeaponDamagePresets();
const TREE_PRESET_VALUES = new Set(TREE_DAMAGE_PRESETS.map((p) => p.value));

/**
 * Catalog Power templates the GM can assign to a progression pick, grouped by
 * power-mode. `martial` is handled separately (delivery + Special); the other
 * modes expose every catalog template of that category so the GM is never
 * limited. Martial damage tier templates are filtered out of `active` because
 * they belong to the `martial` mode.
 */
const POWER_PICK_MODE_OPTIONS = [
  { value: 'martial', label: 'Martial Special Damage' },
  { value: 'active', label: 'Active' },
  { value: 'activeBuff', label: 'Active Buff' },
  { value: 'reaction', label: 'Reaction' },
  { value: 'movement', label: 'Movement' },
  { value: 'passive', label: 'Passive' },
] as const;

function tplOpts(list: ReadonlyArray<{ templateId: string; templateName: string }>): { id: string; name: string }[] {
  return list
    .map((t) => ({ id: t.templateId, name: t.templateName }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildPowerCatalogOptions(): Record<string, { id: string; name: string }[]> {
  return {
    active: tplOpts((ACTIVE_TEMPLATES as any[]).filter((t) => !isMartialDamageTemplateId(t.templateId))),
    activeBuff: tplOpts(ACTIVE_BUFF_TEMPLATES as any[]),
    reaction: tplOpts(REACTION_TEMPLATES as any[]),
    movement: tplOpts(MOVEMENT_TEMPLATES as any[]),
    passive: tplOpts(PASSIVE_TEMPLATES as any[]),
  };
}

/** Power-mode + selected template/name for an existing pick (render helper). */
function resolvePowerPickMode(pick: ArtifactProgressionPick): {
  powerMode: string;
  templateId: string;
  displayName: string;
} {
  const tid = String(pick.powerTemplateId || '').trim();
  if (pick.delivery || (tid && isMartialDamageTemplateId(tid))) {
    return { powerMode: 'martial', templateId: '', displayName: pick.displayName || '' };
  }
  if (tid) {
    const tpl = getPowerTemplate(tid);
    const cat = String((tpl as any)?.category || 'active');
    return { powerMode: cat, templateId: tid, displayName: pick.displayName || '' };
  }
  return { powerMode: 'martial', templateId: '', displayName: pick.displayName || '' };
}

/**
 * Read a Power pick from a progression-pick row. Supports two modes:
 *  - `martial`: delivery + Special → a Martial Special Damage template.
 *  - any other category: a freely chosen catalog template (`node-pick-template`).
 * An optional flavor display name (`node-pick-name`) is carried along so the GM
 * can rename a power (e.g. "Breath Weapon") without touching its mechanics.
 */
function readPowerPickFieldsFromRow(
  $row: JQuery,
): Pick<ArtifactProgressionPick, 'powerTemplateId' | 'delivery' | 'chosenSpecial' | 'displayName'> | null {
  const displayName = String($row.find('.node-pick-name').val() || '').trim() || undefined;
  const mode = String($row.find('.node-pick-power-mode').val() || 'martial').trim() || 'martial';

  if (mode === 'martial') {
    const delivery = String($row.find('.node-pick-delivery').val() || '').trim();
    const specialKey = String($row.find('.node-pick-special').val() || '').trim();
    if (delivery && specialKey) {
      try {
        return { ...resolvePickFromUi(delivery as MartialDelivery, specialKey), displayName };
      } catch {
        return null;
      }
    }
    return null;
  }

  const templateId = String($row.find('.node-pick-template').val() || '').trim();
  if (!templateId) return null;
  if (catalogTemplateRequiresSpecial(templateId)) {
    const specialKey = String($row.find('.node-pick-catalog-special').val() || '').trim();
    if (!specialKey) return null;
    const tier = catalogSpecialTierForTemplate(templateId);
    if (!tier) return null;
    return {
      powerTemplateId: templateId,
      displayName,
      chosenSpecial: { key: specialKey, tier },
    };
  }
  return { powerTemplateId: templateId, displayName };
}

/** Base Value slot letters → label (letter + the Artifact Level it unlocks at). */
const BV_LETTER_LABELS: Record<'a' | 'b' | 'c', string> = {
  a: 'A · Level 1',
  b: 'B · Level 4',
  c: 'C · Level 7',
};
const BV_UNLOCK_LEVEL: Record<'a' | 'b' | 'c', number> = { a: 1, b: 4, c: 7 };
const BV_LETTERS: readonly ('a' | 'b' | 'c')[] = ['a', 'b', 'c'];

function isBaseValueSlotUnlocked(slot: 'a' | 'b' | 'c', artifactLevel: number): boolean {
  return artifactLevel >= (BV_UNLOCK_LEVEL[slot] ?? 1);
}

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
  const depth = folderItems.length ? getTreeDepth(item as any, nodeIdMap) : 1;
  return {
    isLineageRoot,
    lockedBasics,
    lockedInnateList,
    lockedInnateSet,
    lockedSpecialList,
    lockedSpecialKeySet,
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
    case 'oneHandedWeaponRanged':
    case 'twoHandedWeapon':
    case 'twoHandedWeaponRanged':
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

  /**
   * GM-only tool. Players must never be able to open or edit world artifact
   * node definitions — block the render at the source.
   */
  render(...args: any[]): any {
    if (!game.user?.isGM) {
      ui.notifications?.warn('Only the GM can edit artifact nodes.');
      return this;
    }
    return super.render(...args);
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
      : 'Tree child: item type, weapon type, hands, gear slot, and armor/shield type match the root node. Inherited innates/specials cannot be removed; you can add more.';

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

    // Auto-derive: Base Values scale from Base Profile + this node's level.
    // The GM picks the *type* (and, for Specials, *which* Special); the value
    // is computed. A small override is allowed for fairness tuning.
    const nodeLevel = Math.max(1, Math.min(10, Number(system.level) || 1));
    const specialOptions = (data.specialSelectOptions as { id: string; label: string }[]) || [];

    // Map: base-value type → derived display at this level/profile (for JS recompute).
    const typeDerivedMap: Record<string, string> = {};
    for (const type of Object.keys(BASE_VALUE_TYPE_LABELS)) {
      typeDerivedMap[type] = deriveBaseValueDisplay(
        type as ArtifactBaseValueType,
        nodeLevel,
        specBaseProfile || undefined,
      ).display;
    }
    // Map: special option id → derived numeric value at this level ('' if qualitative).
    const specialValueMap: Record<string, string> = {};
    for (const opt of specialOptions) {
      const v = scaleWeaponSpecial(opt.label, nodeLevel);
      specialValueMap[opt.id] = v == null ? '' : String(v);
    }
    (this as any)._typeDerivedMap = typeDerivedMap;
    (this as any)._specialValueMap = specialValueMap;
    (this as any)._nodeLevel = nodeLevel;

    const deriveRowDisplay = (slot: 'a' | 'b' | 'c', type: string, specialId: string): string => {
      if (!isBaseValueSlotUnlocked(slot, nodeLevel)) return '';
      if (type === 'weaponSpecial') return specialValueMap[specialId] || '';
      return typeDerivedMap[type] || '';
    };

    // The Slot fixes how many Base Value slots exist (A=Level 1, B=Level 4,
    // C=Level 7). We render exactly that many rows with fixed letters — the GM
    // only picks what each slot does (or leaves it as "None"). No add/remove and
    // no duplicate letters.
    const bvLimit = specSlot ? BASE_VALUE_LIMIT_BY_SLOT[specSlot] : BASE_VALUE_HARD_CAP;
    data.specBaseValueLimit = bvLimit;
    const bvLetters = (['a', 'b', 'c'] as const).slice(0, Math.max(1, bvLimit));
    const bvByLetter = new Map<string, ArtifactBaseValue>();
    for (const bv of baseValues) {
      const letter = bv.slot === 'b' || bv.slot === 'c' ? bv.slot : 'a';
      if (!bvByLetter.has(letter)) bvByLetter.set(letter, bv);
    }

    data.specBaseValueRows = bvLetters.map((letter) => {
      const slotLabel = BV_LETTER_LABELS[letter];
      const unlocked = isBaseValueSlotUnlocked(letter, nodeLevel);
      const bv = bvByLetter.get(letter);
      if (!bv) {
        return {
          slot: letter,
          slotLabel,
          unlocked,
          unlockLevel: BV_UNLOCK_LEVEL[letter],
          type: 'none',
          isNone: true,
          isSpecial: false,
          specialId: '',
          derivedDisplay: '',
          overrideStr: '',
        };
      }
      const type = bv.type || 'minorFeature';
      const isSpecial = type === 'weaponSpecial';
      // For Specials the stored label holds the chosen Special; match it back to an option id.
      const storedLabel = String(bv.label || '');
      const matched = isSpecial
        ? specialOptions.find((o) => o.id === storedLabel || o.label === storedLabel)
        : undefined;
      const specialId = matched?.id || '';
      const derivedDisplay = deriveRowDisplay(letter, type, specialId);
      const storedValue = bv.value != null ? String(bv.value) : '';
      // Treat a stored value that differs from the derived one as a manual override.
      const overrideStr = storedValue && storedValue !== derivedDisplay ? storedValue : '';
      return {
        slot: letter,
        slotLabel,
        unlocked,
        unlockLevel: BV_UNLOCK_LEVEL[letter],
        type,
        isNone: false,
        isSpecial,
        specialId,
        derivedDisplay,
        overrideStr,
      };
    });

    data.specSpecialOptions = specialOptions.map((o) => ({
      id: o.id,
      label: isScalingWeaponSpecial(o.label) ? o.label : `${o.label} (qualitative)`,
    }));

    // ---- Level Progression picks (3 lines @ Basic Level 1/2/3) ----
    data.martialDeliveryOptions = MARTIAL_DELIVERY_OPTIONS;
    data.martialSpecialOptions = listMartialDamageSpecialOptions();
    data.powerModeOptions = POWER_PICK_MODE_OPTIONS;
    data.powerCatalogOptions = buildPowerCatalogOptions();
    const stonePowerOptionsByAttr: Record<string, { id: string; name: string }[]> = {};
    for (const [attr, list] of Object.entries(STONE_POWERS_BY_ATTRIBUTE)) {
      stonePowerOptionsByAttr[attr] = (list as any[]).map((p) => ({ id: p.id, name: p.name }));
    }
    (this as any)._stonePowerOptionsByAttr = stonePowerOptionsByAttr;
    (this as any)._powerCatalogOptions = data.powerCatalogOptions;

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
      const legacy = p?.kind === 'power' ? parseLegacyPick(p) : null;
      const isAuthored = p?.kind === 'authored';
      const authoredSummary = isAuthored
        ? (p?.authoredStages || [])
            .map((r) => (r?.name || '').trim())
            .filter((n) => n.length > 0)
            .join(' → ')
        : '';
      const mode = p?.kind === 'power' ? resolvePowerPickMode(p) : { powerMode: 'martial', templateId: '', displayName: '' };
      const catalogSpecialKey =
        p?.kind === 'power' && p.chosenSpecial?.key && !p.delivery ? p.chosenSpecial.key : '';
      const needsCatalogSpecial =
        p?.kind === 'power' &&
        mode.powerMode !== 'martial' &&
        !!mode.templateId &&
        catalogTemplateRequiresSpecial(mode.templateId);
      return {
        level: lvl,
        kind: p?.kind || 'none',
        isPower: p?.kind === 'power',
        isStoneFn: p?.kind === 'stoneFunction',
        isAuthored,
        authoredSummary,
        powerMode: mode.powerMode,
        isMartialMode: mode.powerMode === 'martial',
        selectedTemplateId: mode.templateId,
        displayName: mode.displayName,
        delivery: legacy?.delivery || '',
        specialKey: legacy?.specialKey || catalogSpecialKey,
        needsSpecial: legacy?.needsSpecial || false,
        needsCatalogSpecial,
        catalogSpecialOptions:
          needsCatalogSpecial && mode.templateId
            ? listCatalogSpecialOptions(mode.templateId)
            : [],
        stoneKind: sf?.kind || '',
        stoneAttr: sf?.attribute || '',
        stonePowerId: sf?.stonePowerId || '',
      };
    });

    // ---- Read-only Level Progression overview (Level 1..10) ----
    // The authored table from `system.levelProgression`: shows exactly what the
    // artifact grants at each level so the GM/player can see the whole curve.
    const lpRowsRaw = Array.isArray(system.levelProgression)
      ? (system.levelProgression as ArtifactLevelProgressionRow[])
      : [];
    const nodeLvlForHighlight = Math.max(1, Math.min(10, Number(system.level) || 1));
    data.levelProgressionRows = lpRowsRaw
      .slice()
      .sort((a, b) => (Number(a?.level) || 0) - (Number(b?.level) || 0))
      .map((r) => ({
        level: r.level,
        name: r.name || '—',
        type: r.type || '—',
        range: r.range || '—',
        duration: r.duration || '—',
        effect: r.effect || '',
        special: r.special || '',
        isCurrent: Number(r.level) === nodeLvlForHighlight,
      }));
    data.hasLevelProgression = data.levelProgressionRows.length > 0;

    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    const { isLineageRoot } = resolveLineageForItem(this.item);

    const syncKindUi = () => {
      const profile = String(html.find('#node-spec-base-profile').val() || '');
      const kind = deriveArtifactKindFromProfile(profile);
      html.find('#node-derived-kind').val(kind);
      html.find('[data-profile]').each((_i, el) => {
        const $el = $(el);
        const p = String($el.data('profile') || '');
        $el.toggleClass('hidden', p !== kind);
      });

      // The Base Profile dictates melee/ranged + hands for weapon profiles, so
      // mirror it into the (now read-only) Type / Hands controls and refresh the
      // Reach/Range label. Non-root nodes keep their lineage-locked basics.
      const basics = weaponBasicsForProfile(profile);
      if (basics && isLineageRoot) {
        html.find('#node-weapon-type').val(basics.weaponType).prop('disabled', true);
        html.find('#node-weapon-hands').val(String(basics.hands)).prop('disabled', true);
        syncWeaponRangeLabel(html);
      }
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

    // --- Base Values: auto-derived value + Special picker (no free-text math) ---
    const typeDerivedMap = ((this as any)._typeDerivedMap || {}) as Record<string, string>;
    const specialValueMap = ((this as any)._specialValueMap || {}) as Record<string, string>;
    const syncBvRow = ($row: JQuery) => {
      const slotLetter = (String($row.attr('data-bv-slot') || 'a').toLowerCase() || 'a') as 'a' | 'b' | 'c';
      const nodeLevel = Math.max(1, Math.min(10, Number((this as any)._nodeLevel) || 1));
      const unlocked = isBaseValueSlotUnlocked(slotLetter, nodeLevel);
      const type = String($row.find('.node-spec-bv-type').val() || '');
      const isSpecial = type === 'weaponSpecial';
      $row.find('.node-spec-bv-special').toggleClass('hidden', !isSpecial);
      const isNone = type === 'none' || type === '';
      $row.find('.node-spec-bv-override').prop('disabled', isNone || !unlocked);
      if (!unlocked) {
        $row
          .find('.node-spec-bv-derived')
          .text(`— (unlocks L${BV_UNLOCK_LEVEL[slotLetter]})`)
          .attr('data-derived', '');
        $row.find('.node-spec-bv-override').attr('placeholder', `Unlocks at L${BV_UNLOCK_LEVEL[slotLetter]}`);
        return;
      }
      $row.find('.node-spec-bv-override').attr('placeholder', 'Value');
      let derived = '';
      if (isSpecial) {
        const sid = String($row.find('.node-spec-bv-special').val() || '');
        derived = specialValueMap[sid] || '';
      } else if (!isNone) {
        derived = typeDerivedMap[type] || '';
      }
      $row
        .find('.node-spec-bv-derived')
        .text(derived ? `auto: ${derived}` : '—')
        .attr('data-derived', derived);
    };

    // Render exactly the Base Value slots this Slot grants (A / B / C up to the
    // slot limit), each with a fixed letter — no add/remove, no duplicates.
    const rebuildBaseValueRows = (slot: ArtifactSlotKey | '') => {
      const limit = slot ? BASE_VALUE_LIMIT_BY_SLOT[slot] : BASE_VALUE_HARD_CAP;
      const count = Math.max(1, limit);
      const allowedTypes = (Object.keys(BASE_VALUE_TYPE_LABELS) as SpecBaseValueType[]).filter(
        (t) => (slot ? isBaseValueTypeAllowedForSlot(slot, t) : true),
      );

      // Add or remove whole rows so we have exactly `count`.
      while ($specBvContainer.find('.node-spec-bv-row').length < count) {
        const $clone = $specBvContainer.find('.node-spec-bv-row').first().clone();
        $clone.find('.node-spec-bv-type').val('none');
        $clone.find('.node-spec-bv-special').val('').addClass('hidden');
        $clone.find('.node-spec-bv-override').val('');
        $specBvContainer.append($clone);
      }
      while ($specBvContainer.find('.node-spec-bv-row').length > count) {
        $specBvContainer.find('.node-spec-bv-row').last().remove();
      }

      // Fix the letter label + repopulate the type dropdown (keeping the choice
      // if it is still legal, otherwise falling back to None).
      $specBvContainer.find('.node-spec-bv-row').each((i, el) => {
        const $row = $(el);
        const letter = BV_LETTERS[i] || 'a';
        $row.attr('data-bv-slot', letter);
        $row.find('.node-spec-bv-slot-label').text(BV_LETTER_LABELS[letter]);

        const $type = $row.find('.node-spec-bv-type');
        const prev = String($type.val() || 'none');
        $type.empty();
        $type.append('<option value="none">— None —</option>');
        for (const t of allowedTypes) {
          const sel = t === prev ? ' selected' : '';
          $type.append(`<option value="${t}"${sel}>${BASE_VALUE_TYPE_LABELS[t]}</option>`);
        }
        if (prev !== 'none' && !allowedTypes.includes(prev as SpecBaseValueType)) {
          $type.val('none');
        }
        syncBvRow($row);
      });
    };

    // Enforce no-duplicate Base Value types across rows: a type chosen in one
    // row is disabled in every other row's dropdown. "Weapon Special" is exempt
    // (two different specials are allowed), but the *same* special is disabled
    // in other rows. Keeps the UI honest with the save-time dedup.
    const syncBaseValueExclusivity = () => {
      const $rows = $specBvContainer.find('.node-spec-bv-row');
      const chosenTypes = new Set<string>();
      const chosenSpecials = new Set<string>();
      $rows.each((_i, el) => {
        const t = String($(el).find('.node-spec-bv-type').val() || '');
        if (t && t !== 'none' && t !== 'weaponSpecial') chosenTypes.add(t);
        const sid = String($(el).find('.node-spec-bv-special').val() || '');
        if (sid) chosenSpecials.add(sid);
      });
      $rows.each((_i, el) => {
        const $row = $(el);
        const own = String($row.find('.node-spec-bv-type').val() || '');
        $row.find('.node-spec-bv-type option').each((_j, opt) => {
          const $opt = $(opt);
          const val = String($opt.attr('value') || '');
          if (val === 'none' || val === 'weaponSpecial' || val === own) {
            $opt.prop('disabled', false);
            return;
          }
          $opt.prop('disabled', chosenTypes.has(val));
        });
        const ownSpecial = String($row.find('.node-spec-bv-special').val() || '');
        $row.find('.node-spec-bv-special option').each((_j, opt) => {
          const $opt = $(opt);
          const val = String($opt.attr('value') || '');
          if (!val || val === ownSpecial) {
            $opt.prop('disabled', false);
            return;
          }
          $opt.prop('disabled', chosenSpecials.has(val));
        });
      });
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

      // Base Value rows: fixed slots (A/B/C up to the slot limit), fixed letters.
      rebuildBaseValueRows(slot);

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
      const limit = slot ? BASE_VALUE_LIMIT_BY_SLOT[slot] : BASE_VALUE_HARD_CAP;
      $specBvLimitHint.text(`(this slot grants ${limit} Base Value slot${limit === 1 ? '' : 's'} — values auto-scale with the Artifact's level)`);

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

      // Disable already-used types across the freshly-built rows.
      syncBaseValueExclusivity();
    };

    $specSlot.on('change', refreshSpecForSlot);
    $specBaseProfile.on('change', syncKindUi);
    refreshSpecForSlot();

    // --- Level Progression picks: Power (catalog, filtered by category) or Stone Function ---
    const stonePowerOptionsByAttr = ((this as any)._stonePowerOptionsByAttr || {}) as Record<
      string,
      { id: string; name: string }[]
    >;
    const escHtml = (s: string) =>
      String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const readPowerPickFields = readPowerPickFieldsFromRow;

    const populateStonePowerSelect = ($row: JQuery, desired: string) => {
      const attr = String($row.find('.node-pick-stone-attr').val() || '');
      const $sel = $row.find('.node-pick-stone-power');
      const opts = stonePowerOptionsByAttr[attr] || [];
      $sel.empty();
      $sel.append('<option value="">— Choose Stone Power —</option>');
      for (const o of opts) {
        const sel = o.id === desired ? ' selected' : '';
        $sel.append(`<option value="${escHtml(o.id)}"${sel}>${escHtml(o.name)}</option>`);
      }
    };

    const powerCatalogOptions = ((this as any)._powerCatalogOptions || {}) as Record<
      string,
      { id: string; name: string }[]
    >;

    const populatePowerTemplateSelect = ($row: JQuery, mode: string, desired: string) => {
      const $sel = $row.find('.node-pick-template');
      const opts = powerCatalogOptions[mode] || [];
      $sel.empty();
      $sel.append('<option value="">— Choose Power —</option>');
      for (const o of opts) {
        const sel = o.id === desired ? ' selected' : '';
        $sel.append(`<option value="${escHtml(o.id)}"${sel}>${escHtml(o.name)}</option>`);
      }
    };

    const populateCatalogSpecialSelect = ($row: JQuery, templateId: string, desired: string) => {
      const $wrap = $row.find('.node-pick-catalog-special-wrap');
      const $sel = $row.find('.node-pick-catalog-special');
      const needs = catalogTemplateRequiresSpecial(templateId);
      $wrap.toggleClass('hidden', !needs);
      if (!needs) {
        $sel.empty();
        return;
      }
      const opts = listCatalogSpecialOptions(templateId);
      $sel.empty();
      $sel.append('<option value="">— Choose Special —</option>');
      for (const o of opts) {
        const sel = o.key === desired ? ' selected' : '';
        $sel.append(
          `<option value="${escHtml(o.key)}" title="${escHtml(o.description)}"${sel}>${escHtml(o.label)}</option>`,
        );
      }
    };

    const syncProgressionRow = ($row: JQuery) => {
      const kind = String($row.find('.node-pick-kind').val() || 'none');
      $row.find('.node-pick-power-wrap').toggleClass('hidden', kind !== 'power');
      $row.find('.node-pick-stonefn').toggleClass('hidden', kind !== 'stoneFunction');
      const mode = String($row.find('.node-pick-power-mode').val() || 'martial');
      $row.find('.node-pick-martial').toggleClass('hidden', mode !== 'martial');
      $row.find('.node-pick-template-wrap').toggleClass('hidden', mode === 'martial');
      const templateId = String($row.find('.node-pick-template').val() || '');
      populateCatalogSpecialSelect(
        $row,
        templateId,
        String($row.find('.node-pick-catalog-special').val() || ''),
      );
      const stoneKind = String($row.find('.node-pick-stone-kind').val() || '');
      $row.find('.node-pick-stone-power-wrap').toggleClass('hidden', stoneKind !== 'stonePowerSupport');
    };

    const refreshStoneFnWarning = () => {
      const count = html
        .find('.node-progression-pick .node-pick-kind')
        .toArray()
        .filter((el) => String($(el).val() || '') === 'stoneFunction').length;
      html.find('.node-progression-stonefn-warning').toggleClass('hidden', count <= 1);
    };

    // Authored picks aren't editable in the DOM; keep them around so the live
    // preview (and save) reflect them instead of dropping the bespoke lines.
    const storedAuthoredByLevel = new Map<number, ArtifactProgressionPick>();
    for (const p of (Array.isArray((this.item.system as any).progressionPicks)
      ? ((this.item.system as any).progressionPicks as ArtifactProgressionPick[])
      : [])) {
      if (p?.kind === 'authored') storedAuthoredByLevel.set(Number(p.level), p);
    }

    // Read the current picks straight from the DOM (same shape `saveNode` builds).
    const readProgressionPicksFromDom = (): ArtifactProgressionPick[] => {
      const picks: ArtifactProgressionPick[] = [];
      html.find('.node-progression-pick').each((_i, el) => {
        const $row = $(el);
        const levelRaw = parseInt(String($row.attr('data-level') || ''), 10);
        const level = (levelRaw === 2 || levelRaw === 3 ? levelRaw : 1) as 1 | 2 | 3;
        const kind = String($row.find('.node-pick-kind').val() || 'none').trim();
        if (kind === 'authored') {
          const stored = storedAuthoredByLevel.get(level);
          if (stored) picks.push(stored);
        } else if (kind === 'power') {
          const resolved = readPowerPickFields($row);
          if (resolved?.powerTemplateId) {
            picks.push({ level, kind: 'power', ...resolved });
          }
        } else if (kind === 'stoneFunction') {
          const sfKind = String($row.find('.node-pick-stone-kind').val() || '').trim();
          const sfAttr = String($row.find('.node-pick-stone-attr').val() || '').trim();
          const sfPower = String($row.find('.node-pick-stone-power').val() || '').trim();
          if (sfKind && sfAttr) {
            const sf: ArtifactStoneFunction = {
              kind: sfKind as ArtifactStoneFunctionKind,
              attribute: sfAttr,
            };
            if (sfKind === 'stonePowerSupport' && sfPower) sf.stonePowerId = sfPower;
            picks.push({ level, kind: 'stoneFunction', stoneFunction: sf });
          }
        }
      });
      return picks;
    };

    // Regenerate the read-only Level Progression table from the live picks so the
    // bottom table stays in sync with the picks above without needing a save.
    const previewNodeLevel = Math.max(1, Math.min(10, Number((this.item.system as any)?.level) || 1));
    const rebuildLevelProgressionPreview = () => {
      const rows = deriveLevelProgressionFromPicks(readProgressionPicksFromDom());
      const $tbody = html.find('.node-levelprog-table tbody');
      $tbody.empty();
      for (const r of rows) {
        const cur = Number(r.level) === previewNodeLevel ? ' class="node-levelprog-current"' : '';
        const special = r.special
          ? `<span class="node-levelprog-special" title="Special">${escHtml(r.special)}</span>`
          : '';
        $tbody.append(
          `<tr${cur}>` +
            `<td class="node-levelprog-lvl">${escHtml(String(r.level))}</td>` +
            `<td class="node-levelprog-name">${escHtml(r.name || '—')}${special}</td>` +
            `<td>${escHtml(r.type || '—')}</td>` +
            `<td>${escHtml(r.range || '—')}</td>` +
            `<td>${escHtml(r.duration || '—')}</td>` +
            `<td class="node-levelprog-effect">${escHtml(r.effect || '')}</td>` +
            `</tr>`,
        );
      }
      html.find('.node-levelprog-empty').toggleClass('hidden', rows.length > 0);
    };

    html.find('.node-progression-pick').each((_i, el) => {
      const $row = $(el);
      const $delivery = $row.find('.node-pick-delivery');
      if ($delivery.length) $delivery.val(String($delivery.attr('data-current') || ''));
      const $special = $row.find('.node-pick-special');
      if ($special.length) $special.val(String($special.attr('data-current') || ''));
      const $tpl = $row.find('.node-pick-template');
      if ($tpl.length) $tpl.val(String($tpl.attr('data-current') || ''));
      const $catalogSpecial = $row.find('.node-pick-catalog-special');
      if ($catalogSpecial.length) {
        $catalogSpecial.val(String($catalogSpecial.attr('data-current') || ''));
      }
      populateCatalogSpecialSelect(
        $row,
        String($tpl.val() || $tpl.attr('data-current') || ''),
        String($catalogSpecial.attr('data-current') || ''),
      );
      populateStonePowerSelect($row, String($row.find('.node-pick-stone-power').attr('data-current') || ''));
      syncProgressionRow($row);
    });
    refreshStoneFnWarning();
    rebuildLevelProgressionPreview();

    html.on('change', '.node-pick-kind', (e: JQuery.ChangeEvent) => {
      syncProgressionRow($(e.currentTarget).closest('.node-progression-pick'));
      refreshStoneFnWarning();
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-delivery, .node-pick-special', () => {
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-power-mode', (e: JQuery.ChangeEvent) => {
      const $row = $(e.currentTarget).closest('.node-progression-pick');
      const mode = String($(e.currentTarget).val() || 'martial');
      if (mode !== 'martial') populatePowerTemplateSelect($row, mode, '');
      populateCatalogSpecialSelect($row, '', '');
      syncProgressionRow($row);
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-template, .node-pick-name, .node-pick-catalog-special', (e: JQuery.ChangeEvent) => {
      const $row = $(e.currentTarget).closest('.node-progression-pick');
      if ($(e.currentTarget).hasClass('node-pick-template')) {
        populateCatalogSpecialSelect($row, String($(e.currentTarget).val() || ''), '');
      }
      syncProgressionRow($row);
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-stone-kind', (e: JQuery.ChangeEvent) => {
      syncProgressionRow($(e.currentTarget).closest('.node-progression-pick'));
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-stone-attr', (e: JQuery.ChangeEvent) => {
      const $row = $(e.currentTarget).closest('.node-progression-pick');
      populateStonePowerSelect($row, String($row.find('.node-pick-stone-power').val() || ''));
      rebuildLevelProgressionPreview();
    });
    html.on('change', '.node-pick-stone-power', () => {
      rebuildLevelProgressionPreview();
    });
    // When the Slot changes (attribute access changes), refresh per-pick Stone Power lists.
    $specSlot.on('change', () => {
      html.find('.node-progression-pick').each((_i, el) => {
        const $row = $(el);
        populateStonePowerSelect($row, String($row.find('.node-pick-stone-power').val() || ''));
      });
      rebuildLevelProgressionPreview();
    });

    // Base Value rows are kept in sync by `rebuildBaseValueRows` (called from
    // refreshSpecForSlot). Here we only react to the per-row choices changing.
    html.on('change', '.node-spec-bv-type', (e: JQuery.ChangeEvent) => {
      syncBvRow($(e.currentTarget).closest('.node-spec-bv-row'));
      syncBaseValueExclusivity();
    });
    html.on('change', '.node-spec-bv-special', (e: JQuery.ChangeEvent) => {
      syncBvRow($(e.currentTarget).closest('.node-spec-bv-row'));
      syncBaseValueExclusivity();
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
    if (!game.user?.isGM) {
      ui.notifications?.warn('Only the GM can edit artifact nodes.');
      return;
    }
    const lineage = resolveLineageForItem(this.item);

    const baseProfileVal = String(html.find('#node-spec-base-profile').val() || '').trim();
    const slotVal = String(html.find('#node-spec-slot').val() || '').trim();
    let kind = deriveArtifactKindFromProfile(baseProfileVal);
    let gearSlot = kind === 'gear' ? deriveGearSlotFromSlot(slotVal) : '';
    let weaponType = (html.find('#node-weapon-type').val() as 'melee' | 'ranged') || 'melee';
    let hands = Math.min(2, Math.max(1, parseInt(html.find('#node-weapon-hands').val() as string, 10) || 1));

    // The Base Profile is the source of truth for weapon basics: a
    // *Ranged*/*Melee*, One-/Two-Handed profile fixes both weaponType and the
    // hand count (which then drives the printable sheet's range rule).
    const profileBasics = weaponBasicsForProfile(baseProfileVal);
    if (profileBasics) {
      weaponType = profileBasics.weaponType;
      hands = profileBasics.hands;
    }

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

    const baseValueLimit = specSlot ? BASE_VALUE_LIMIT_BY_SLOT[specSlot] : BASE_VALUE_HARD_CAP;
    const baseValueRows = html.find('.node-spec-bv-row').toArray();
    const baseValues: ArtifactBaseValue[] = [];
    const usedLetters = new Set<string>();
    // A Base Value type may appear only once per artifact — except "Weapon
    // Special", where two *different* specials are allowed (e.g. Dragon Claws:
    // Penetration + Brutal Impact). Duplicates are dropped on save.
    const usedTypes = new Set<string>();
    const usedSpecialIds = new Set<string>();
    for (const row of baseValueRows) {
      if (baseValues.length >= baseValueLimit) break;
      const $row = $(row);
      const slotLetterRaw = String($row.attr('data-bv-slot') || 'a').trim().toLowerCase();
      const slotLetter: 'a' | 'b' | 'c' =
        slotLetterRaw === 'b' || slotLetterRaw === 'c' ? slotLetterRaw : 'a';
      if (usedLetters.has(slotLetter)) continue; // never emit duplicate letters
      const typeRaw = String($row.find('.node-spec-bv-type').val() || '').trim();
      if (!typeRaw || typeRaw === 'none') continue; // "None" slots are not stored
      if (specSlot && !isBaseValueTypeAllowedForSlot(specSlot, typeRaw as SpecBaseValueType)) {
        continue;
      }
      const isSpecial = typeRaw === 'weaponSpecial';
      if (!isSpecial && usedTypes.has(typeRaw)) continue; // no duplicate non-special types
      // Label: for a Special, store the chosen Special id; otherwise the type label.
      let label: string;
      if (isSpecial) {
        label = String($row.find('.node-spec-bv-special').val() || '').trim();
        if (!label) continue; // a Special row with no Special chosen is dropped
        if (usedSpecialIds.has(label)) continue; // no duplicate Specials
        usedSpecialIds.add(label);
      } else {
        label = BASE_VALUE_TYPE_LABELS[typeRaw as ArtifactBaseValueType] || '';
        usedTypes.add(typeRaw);
      }
      usedLetters.add(slotLetter);
      const nodeLevel = Math.max(1, Math.min(10, Number((this.item.system as any).level) || 1));
      const bvUnlocked = isBaseValueSlotUnlocked(slotLetter, nodeLevel);
      // Value: manual override wins, else the auto-derived value (only when unlocked).
      const overrideStr = String($row.find('.node-spec-bv-override').val() || '').trim();
      const derivedStr = bvUnlocked
        ? String($row.find('.node-spec-bv-derived').attr('data-derived') || '').trim()
        : '';
      const valueStr = overrideStr || derivedStr;
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
    // Authored (bespoke) picks are read-only in the UI; reuse the stored pick so
    // a save never recompiles them away.
    const storedAuthoredByLevel = new Map<number, ArtifactProgressionPick>();
    for (const p of (Array.isArray((this.item.system as any).progressionPicks)
      ? ((this.item.system as any).progressionPicks as ArtifactProgressionPick[])
      : [])) {
      if (p?.kind === 'authored') storedAuthoredByLevel.set(Number(p.level), p);
    }

    const progressionPicks: ArtifactProgressionPick[] = [];
    html.find('.node-progression-pick').each((_i, el) => {
      const $row = $(el);
      const levelRaw = parseInt(String($row.attr('data-level') || ''), 10);
      const level = (levelRaw === 2 || levelRaw === 3 ? levelRaw : 1) as 1 | 2 | 3;
      const kindRaw = String($row.find('.node-pick-kind').val() || 'none').trim();

      if (kindRaw === 'authored') {
        const stored = storedAuthoredByLevel.get(level);
        if (stored) progressionPicks.push(stored);
      } else if (kindRaw === 'power') {
        const resolved = readPowerPickFieldsFromRow($row);
        if (resolved?.powerTemplateId) {
          progressionPicks.push({ level, kind: 'power', ...resolved });
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

    // Picks are the single source of truth for the staged 1-9 rows; the Level 10
    // Ultimate (e.g. True Dragon Head) lives only in the authored table, so merge
    // it back in via resolveFullLevelProgression rather than dropping it.
    const authoredTable = Array.isArray((this.item.system as any).levelProgression)
      ? ((this.item.system as any).levelProgression as ArtifactLevelProgressionRow[])
      : [];
    const levelProgression = resolveFullLevelProgression(authoredTable, progressionPicks);

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
      'system.levelProgression': levelProgression,
      'system.powers': [],
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
