/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */

import { describeInnateAbility, getWeapon, WEAPONS } from '../utils/weapons.js';
import { getArmorDefinitionForType, getShieldDefinitionForType, normalizeShieldTypeKey } from '../utils/equipment.js';
import { formatEffectReference, type SpecialEffectReference } from '../utils/special-effects.js';
import { ARTIFACT_GEAR_SLOT_OPTIONS } from '../utils/artifact-node-options.js';
import {
  ARTIFACT_SLOT_LABELS,
  BASE_PROFILE_LABELS,
  BASE_VALUE_TYPE_LABELS,
  formatArtifactWeaponRangeDisplay,
  resolveArtifactWeaponKind,
} from '../utils/artifact-rules.js';

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

function typeLabel(t: string): string {
  const labels: Record<string, string> = {
    weapon: 'Weapon',
    armor: 'Armor',
    shield: 'Shield',
    gear: 'Gear',
    artifact: 'Artifact',
    power: 'Power',
    condition: 'Condition',
    echo: 'Echo',
    schtick: 'Schtick',
  };
  return labels[t] || t;
}

function fmtMod(n: number | null | undefined, empty = '—'): string {
  if (n === null || n === undefined) return empty;
  if (n === 0) return '0';
  return n > 0 ? `+${n}` : `${n}`;
}

const DAMAGE_ORDER = ['1', '1d8', '2d8', '4d8'];

function uniqueSortedWeaponDamages(): string[] {
  const set = new Set<string>();
  for (const w of WEAPONS) set.add(w.weaponDamage);
  const ordered = DAMAGE_ORDER.filter((d) => set.has(d));
  const rest = [...set].filter((d) => !DAMAGE_ORDER.includes(d)).sort();
  return [...ordered, ...rest];
}

function selectOptions(
  values: string[],
  current: string
): { value: string; label: string; selected: boolean }[] {
  return values.map((value) => ({
    value,
    label: value,
    selected: value === current
  }));
}

function formatArtifactWeaponSpecialLines(specials: unknown): string[] {
  if (!Array.isArray(specials)) return [];
  const out: string[] = [];
  for (const s of specials) {
    if (typeof s === 'string' && s.trim()) {
      out.push(s.trim());
      continue;
    }
    if (s && typeof s === 'object' && typeof (s as { specialId?: string }).specialId === 'string') {
      out.push(formatEffectReference(s as SpecialEffectReference));
    }
  }
  return out;
}

function artifactGearSlotLabel(value: string): string {
  const v = String(value || '').trim();
  if (!v) return '—';
  const opt = ARTIFACT_GEAR_SLOT_OPTIONS.find((o) => o.value === v);
  return opt?.label || v;
}

/** Quick-edit only for items embedded on an actor (not world / compendium templates). */
function isEmbeddedOnActor(item: any): boolean {
  const p = item?.parent;
  return !!(p && p.documentName === 'Actor');
}

/** Reach bonus from innate lines (matches radial-menu reach parsing). */
function reachBonusKeyFromInnates(innates: string[]): '0' | '1' | '2' {
  for (const a of innates) {
    const m = a.match(/Reach\s*\(\+\s*(\d+)\s*m\)/i);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n >= 2) return '2';
      if (n >= 1) return '1';
    }
    const leg = a.match(/Reach\s*\((\d+)\s*m\)/i);
    if (leg) {
      const total = parseInt(leg[1], 10);
      const bonus = Math.max(0, total - 2);
      if (bonus >= 2) return '2';
      if (bonus >= 1) return '1';
    }
  }
  return '0';
}

function innatesWithoutReach(innates: string[]): string[] {
  return innates.filter((a) => !/^\s*reach\b/i.test(a));
}

function applyReachToInnates(innates: string[], reachKey: '0' | '1' | '2'): string[] {
  const base = innatesWithoutReach(innates);
  if (reachKey === '1') base.push('Reach (+1 m)');
  else if (reachKey === '2') base.push('Reach (+2 m)');
  return base;
}

/** Item override or armor type table default for display. */
function armorSkillPenaltyLabel(sys: any, def: ReturnType<typeof getArmorDefinitionForType>): string {
  const raw = sys.skillPenalty;
  if (raw != null && String(raw).trim() !== '') return String(raw);
  return def?.skillPenalty || '—';
}

function armorSkillPenaltyEditValue(sys: any, def: ReturnType<typeof getArmorDefinitionForType>): string {
  const raw = sys.skillPenalty;
  if (raw != null && String(raw).trim() !== '') return String(raw);
  return def?.skillPenalty ?? '';
}

export class ItemInfoDialog extends BaseDialog {
  private _item: any;
  /** Preserve <details open> across re-renders after Save. */
  private _quickEditOpen = false;

  static DEFAULT_OPTIONS = {
    id: 'mastery-item-info',
    classes: ['mastery-system', 'item-info-dialog'],
    tag: 'div',
    position: { width: 520, height: 'auto' as const },
    window: {
      title: 'Item',
      resizable: true,
      icon: 'fa-solid fa-circle-info'
    }
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/item-info-dialog.hbs' }
  };

  constructor(item: any, options: Record<string, unknown> = {}) {
    const merged = foundry.utils.mergeObject(ItemInfoDialog.DEFAULT_OPTIONS, options, { inplace: false });
    merged.window = foundry.utils.mergeObject(
      (merged.window as object) || {},
      { title: item.name || 'Item' }
    );
    super(merged);
    this._item = item;
  }

  get item(): any {
    return this._item;
  }

  static async show(item: any): Promise<void> {
    // Artifacts have their own clean, read-only summary sheet (ArtifactSheetV2).
    // Open it directly instead of the generic, verbose info dialog.
    if (item?.type === 'artifact' && typeof item.sheet?.render === 'function') {
      await item.sheet.render(true);
      return;
    }
    const id = `mastery-item-info-${item.id}`;
    const existing = foundry.applications.instances.get(id) as ItemInfoDialog | undefined;
    if (existing) {
      (existing as any)._item = item;
      (existing as any).options.window = foundry.utils.mergeObject(
        (existing as any).options.window || {},
        { title: item.name || 'Item' }
      );
      await (existing as any).render({ force: true });
      (existing as any).bringToFront?.();
      return;
    }
    const app = new ItemInfoDialog(item, { id } as Record<string, unknown>);
    await (app as any).render(true);
  }

  async _prepareContext(_options: Record<string, unknown>): Promise<Record<string, unknown>> {
    const item = this._item;
    const sys: any = item.system || {};
    const t = item.type;

    const canEdit = !!(game.user?.isGM || item.isOwner);
    const hasSheet = typeof (item.sheet as any)?.render === 'function';
    const embeddedOnActor = isEmbeddedOnActor(item);

    const base: Record<string, unknown> = {
      item,
      cssClass: 'item-info-dialog',
      typeLabel: typeLabel(t),
      itemImg: item.img || 'icons/svg/item-bag.svg',
      itemName: item.name,
      enrichedDescription: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        sys.description || ''
      ),
      canEdit,
      embeddedOnActor,
      quickEditOpen: this._quickEditOpen,
      showQuickEdit: false as boolean,
      showAdvancedSheetLink: false as boolean,
      isWeapon: t === 'weapon',
      isArmor: t === 'armor',
      isShield: t === 'shield',
      isGear: t === 'gear',
      isArtifact: t === 'artifact',
      isGeneric: !['weapon', 'armor', 'shield', 'gear', 'artifact'].includes(t)
    };

    if (t === 'weapon') {
      const cat = getWeapon(item.name || '');
      let innates: string[] = Array.isArray(sys.innateAbilities) ? [...sys.innateAbilities] : [];
      if (innates.length === 0 && cat?.innateAbilities?.length) {
        innates = [...cat.innateAbilities];
      }
      const innateRows = innates.map((label) => ({
        label,
        description: describeInnateAbility(label)
      }));
      let specials: string[] = Array.isArray(sys.specials)
        ? sys.specials.map((s: unknown) => String(s))
        : [];
      if (
        specials.length === 0 &&
        cat?.special &&
        cat.special !== '—'
      ) {
        specials = cat.special
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      base.weaponBlock = {
        damage:
          sys.damage != null && String(sys.damage).trim() !== ''
            ? String(sys.damage)
            : cat?.weaponDamage ?? '—',
        hands: sys.hands != null && sys.hands !== '' ? sys.hands : cat?.hands ?? '—',
        weaponType: sys.weaponType === 'ranged' ? 'Ranged' : 'Melee',
        innateRows,
        specials,
        specialsNote:
          'Weapon specials are typically chosen or enhanced using Raises during combat (when rules allow).',
        catalogNote: cat?.description || ''
      };

      if (canEdit && embeddedOnActor) {
        const dmgCur =
          sys.damage != null && String(sys.damage).trim() !== ''
            ? String(sys.damage)
            : String(cat?.weaponDamage ?? '1d8');
        const damages = uniqueSortedWeaponDamages();
        if (!damages.includes(dmgCur)) damages.unshift(dmgCur);
        const handsCur = sys.hands === 2 ? 2 : 1;
        const wtCur = sys.weaponType === 'ranged' ? 'ranged' : 'melee';
        const innatesForReach: string[] = Array.isArray(sys.innateAbilities)
          ? sys.innateAbilities.map((x: unknown) => String(x))
          : [];
        const reachKey = reachBonusKeyFromInnates(innatesForReach);
        const rangedRange =
          sys.range != null && String(sys.range).trim() !== ''
            ? String(sys.range).trim()
            : '8m';
        (base as any).weaponEdit = {
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
        ruleHint:
          'Armor Value + Shield value + Mastery Rank = total armor subtracted from incoming damage (subject to rule exceptions).'
      };

      if (canEdit && embeddedOnActor) {
        const curType = (sys.type || 'light').toLowerCase();
        (base as any).armorEdit = {
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
      const typePretty =
        k === 'parry' ? 'Parry Shield' : k === 'medium' ? 'Medium Shield' : k === 'tower' ? 'Tower Shield' : String(sys.type || '—');
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
        (base as any).shieldEdit = {
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
        (base as any).gearEdit = {
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
      const atk = bonuses.attack != null ? Number(bonuses.attack) : 0;
      const def = bonuses.defense != null ? Number(bonuses.defense) : 0;
      const dmgLegacy = typeof bonuses.damage === 'string' ? bonuses.damage.trim() : '';
      const showLegacyBonuses =
        atk !== 0 || def !== 0 || (dmgLegacy !== '' && dmgLegacy !== '—');

      const kindRaw = sys.artifactKind;
      const kind =
        kindRaw === 'weapon' || kindRaw === 'armor' || kindRaw === 'shield' || kindRaw === 'gear'
          ? kindRaw
          : 'weapon';

      const aw = sys.artifactWeapon || {};
      const profileKey = String(sys.baseProfile || '');
      const innates: string[] = Array.isArray(aw.innateAbilities)
        ? aw.innateAbilities.map((x: unknown) => String(x))
        : [];
      const innateRows = innates.map((label) => ({
        label,
        description: describeInnateAbility(label)
      }));
      const weaponSpecials = formatArtifactWeaponSpecialLines(aw.specials);
      const wtKind = resolveArtifactWeaponKind(aw, profileKey);
      const wt = wtKind === 'ranged' ? 'Ranged' : 'Melee';
      const handsN = aw.hands === 2 ? 2 : 1;

      const aa = sys.artifactArmor || {};
      const armorTypeStr = aa.type ? String(aa.type) : '—';
      const armorDef = getArmorDefinitionForType(aa.type);
      const armorTypePretty = armorTypeStr !== '—' ? armorTypeStr.charAt(0).toUpperCase() + armorTypeStr.slice(1) : '—';

      const ash = sys.artifactShield || {};
      const shieldTypeKey = normalizeShieldTypeKey(ash.type) || 'parry';
      const shieldDef = getShieldDefinitionForType(shieldTypeKey);
      const shieldTypePretty =
        shieldTypeKey === 'parry'
          ? 'Parry'
          : shieldTypeKey === 'medium'
            ? 'Medium'
            : shieldTypeKey === 'tower'
              ? 'Tower'
              : String(ash.type || '—');

      const gearSlotRaw = typeof sys.gearSlot === 'string' ? sys.gearSlot : '';

      // New spec: slot / profile, Base Values, and the per-level abilities.
      const currentLevel = Math.max(
        1,
        Math.min(10, Number(sys.currentLevel) || Number(sys.level) || 1),
      );
      const slotKey = String(sys.slot || '');
      const baseValueRows = (Array.isArray(sys.baseValues) ? sys.baseValues : []).map((bv: any) => ({
        slot: String(bv.slot || '').toUpperCase(),
        typeLabel: (BASE_VALUE_TYPE_LABELS as any)[bv.type] || bv.type || '',
        label: bv.label || '',
        value: bv.value != null && bv.value !== '' ? String(bv.value) : (bv.note || ''),
      }));
      const abilityRows = (Array.isArray(sys.levelProgression) ? sys.levelProgression : [])
        .slice()
        .sort((a: any, b: any) => (Number(a?.level) || 0) - (Number(b?.level) || 0))
        .map((row: any) => ({
          level: Number(row.level) || 1,
          name: row.name || '',
          type: row.type || '',
          effect: row.effect || '',
          special: row.special || '',
          unlocked: (Number(row.level) || 1) <= currentLevel,
        }));

      const req = sys.requirements && typeof sys.requirements === 'object' ? sys.requirements : null;
      const reqStones = req && (req as { stones?: number }).stones != null ? (req as { stones: number }).stones : null;
      const reqMr = req && (req as { masteryRank?: number }).masteryRank != null ? (req as { masteryRank: number }).masteryRank : null;

      base.artifactProfile = {
        level: sys.level ?? '—',
        currentLevel,
        slotLabel: (ARTIFACT_SLOT_LABELS as any)[slotKey] || '',
        baseProfileLabel: (BASE_PROFILE_LABELS as any)[profileKey] || '',
        baseValues: baseValueRows,
        hasBaseValues: baseValueRows.length > 0,
        abilities: abilityRows,
        hasAbilities: abilityRows.length > 0,
        lore: sys.lore || '',
        requirements:
          reqStones != null || reqMr != null
            ? {
                stones: reqStones ?? '—',
                masteryRank: reqMr ?? '—'
              }
            : null,
        inventorySize: sys.inventorySize || '—',
        kind,
        isWeapon: kind === 'weapon',
        isArmor: kind === 'armor',
        isShield: kind === 'shield',
        isGear: kind === 'gear',
        legacyBonuses: showLegacyBonuses
          ? {
              show: true,
              attack: bonuses.attack != null ? String(bonuses.attack) : '0',
              defense: bonuses.defense != null ? String(bonuses.defense) : '0',
              damage: bonuses.damage || '—'
            }
          : { show: false },
        weapon:
          kind === 'weapon'
            ? {
                damage:
                  aw.damage != null && String(aw.damage).trim() !== ''
                    ? String(aw.damage)
                    : '—',
                hands: handsN,
                handsLabel: handsN === 2 ? '2 hands' : '1 hand',
                weaponType: wt,
                rangeOrReach: formatArtifactWeaponRangeDisplay(aw, profileKey).label,
                innateRows,
                specials: weaponSpecials,
                specialsNote:
                  'Weapon specials are typically chosen or enhanced using Raises during combat (when rules allow).'
              }
            : null,
        armor:
          kind === 'armor'
            ? {
                typeLabel: armorTypePretty,
                name: armorDef?.name || armorTypePretty,
                armorValue: fmtMod(aa.armorValue, '0'),
                evade: fmtMod(aa.evadeModifier, '0'),
                initiative: armorDef ? fmtMod(armorDef.initiativeModifier) : '—',
                skillPenalty: armorSkillPenaltyLabel(aa, armorDef),
                ruleHint:
                  'Armor Value + Shield value + Mastery Rank = total armor subtracted from incoming damage (subject to rule exceptions).'
              }
            : null,
        shield:
          kind === 'shield'
            ? {
                typeLabel: shieldTypePretty,
                name: shieldDef?.name || shieldTypePretty,
                shieldValue: fmtMod(ash.shieldValue, '0'),
                evade: fmtMod(ash.evadeBonus, '0'),
                initiative: shieldDef ? fmtMod(shieldDef.initiativeModifier) : '—',
                skillPenalty: ash.skillPenalty != null && String(ash.skillPenalty).trim() !== '' ? String(ash.skillPenalty) : shieldDef?.skillPenalty || '—',
                ruleHint: 'Shield Value stacks with armor and Mastery for total armor (see core rules).'
              }
            : null,
        gear:
          kind === 'gear'
            ? {
                slotLabel: artifactGearSlotLabel(gearSlotRaw),
                slotKey: gearSlotRaw || '—'
              }
            : null
      };
    }

    (base as any).showAdvancedSheetLink =
      canEdit &&
      hasSheet &&
      (t === 'artifact' || (base as any).isGeneric || !(base as any).showQuickEdit);

    return base;
  }

  async #resyncItemAfterUpdate(): Promise<void> {
    const parent = this._item.parent;
    if (parent && typeof parent.items?.get === 'function') {
      const fresh = parent.items.get(this._item.id);
      if (fresh) this._item = fresh;
    } else {
      const world = (game as any).items?.get(this._item.id);
      if (world) this._item = world;
    }
    (this as any).options.window = foundry.utils.mergeObject(
      (this as any).options.window || {},
      { title: this._item.name || 'Item' }
    );
    await (this as any).render({ force: true });
  }

  async #saveQuickEditsFromRoot(root: HTMLElement): Promise<void> {
    if (!isEmbeddedOnActor(this._item)) {
      ui.notifications?.warn('Values can only be saved for items on a character (not world or compendium items).');
      return;
    }

    const item = this._item;
    const t = item.type;

    try {
      if (t === 'weapon') {
        const dmgSel = root.querySelector('.js-item-info-weapon-damage') as HTMLSelectElement | null;
        const handsSel = root.querySelector('.js-item-info-weapon-hands') as HTMLSelectElement | null;
        const wtSel = root.querySelector('.js-item-info-weapon-type') as HTMLSelectElement | null;
        const reachSel = root.querySelector('.js-item-info-weapon-reach') as HTMLSelectElement | null;
        const rangeInp = root.querySelector('.js-item-info-weapon-range') as HTMLInputElement | null;
        if (!dmgSel || !handsSel || !wtSel || !reachSel || !rangeInp) return;

        const wt = wtSel.value === 'ranged' ? 'ranged' : 'melee';
        const sysInnates: string[] = Array.isArray(item.system?.innateAbilities)
          ? item.system.innateAbilities.map((x: unknown) => String(x))
          : [];
        const reachKey = (reachSel.value === '2' ? '2' : reachSel.value === '1' ? '1' : '0') as '0' | '1' | '2';
        let innateAbilities = sysInnates;
        if (wt === 'melee') {
          innateAbilities = applyReachToInnates(sysInnates, reachKey);
        } else {
          innateAbilities = innatesWithoutReach(sysInnates);
        }

        const payload: Record<string, unknown> = {
          'system.damage': dmgSel.value,
          'system.hands': parseInt(handsSel.value, 10) || 1,
          'system.weaponType': wt,
          'system.innateAbilities': innateAbilities
        };
        if (wt === 'melee') {
          payload['system.range'] = '0m';
        } else {
          const r = rangeInp.value.trim() || '8m';
          payload['system.range'] = r;
        }
        await item.update(payload);
      } else if (t === 'armor') {
        const armorType = root.querySelector('.js-item-info-armor-type') as HTMLSelectElement | null;
        const av = root.querySelector('.js-item-info-armor-value') as HTMLInputElement | null;
        const ae = root.querySelector('.js-item-info-armor-evade') as HTMLInputElement | null;
        const asp = root.querySelector('.js-item-info-armor-skill-penalty') as HTMLInputElement | null;
        if (!armorType || !av || !ae || !asp) return;
        await item.update({
          'system.type': armorType.value,
          'system.armorValue': parseInt(av.value, 10) || 0,
          'system.evadeModifier': parseInt(ae.value, 10) || 0,
          'system.skillPenalty': asp.value.trim()
        });
      } else if (t === 'shield') {
        const shieldType = root.querySelector('.js-item-info-shield-type') as HTMLSelectElement | null;
        const sv = root.querySelector('.js-item-info-shield-value') as HTMLInputElement | null;
        const se = root.querySelector('.js-item-info-shield-evade') as HTMLInputElement | null;
        if (!shieldType || !sv || !se) return;
        await item.update({
          'system.type': shieldType.value,
          'system.shieldValue': parseInt(sv.value, 10) || 0,
          'system.evadeBonus': parseInt(se.value, 10) || 0
        });
      } else if (t === 'gear') {
        const gSize = root.querySelector('.js-item-info-gear-size') as HTMLSelectElement | null;
        const gQty = root.querySelector('.js-item-info-gear-qty') as HTMLInputElement | null;
        const gW = root.querySelector('.js-item-info-gear-weight') as HTMLInputElement | null;
        const gDesc = root.querySelector('.js-item-info-gear-desc') as HTMLTextAreaElement | null;
        if (!gSize || !gQty || !gW || !gDesc) return;
        await item.update({
          'system.inventorySize': gSize.value,
          'system.quantity': Math.max(0, parseInt(gQty.value, 10) || 0),
          'system.weight': parseFloat(gW.value) || 0,
          'system.description': gDesc.value
        });
      } else {
        return;
      }

      const panel = root.querySelector('.item-info-edit-panel') as HTMLDetailsElement | null;
      this._quickEditOpen = !!panel?.open;

      ui.notifications?.info('Item updated.');
      await this.#resyncItemAfterUpdate();
    } catch (e) {
      console.error(e);
      ui.notifications?.error('Could not save item changes.');
    }
  }

  async _onRender(context: unknown, options: Record<string, unknown>): Promise<void> {
    await super._onRender?.(context, options);
    const root = (this as any).element as HTMLElement | undefined;
    if (!root) return;

    const closeBtn = root.querySelector('.js-item-info-close') as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.onclick = (ev) => {
        ev.preventDefault();
        void (this as any).close?.();
      };
    }

    const adv = root.querySelector('.js-item-info-advanced-sheet') as HTMLButtonElement | null;
    if (adv) {
      adv.onclick = async (ev) => {
        ev.preventDefault();
        const sheet = this._item.sheet;
        if (sheet && typeof (sheet as any).render === 'function') {
          await (sheet as any).render(true);
        }
      };
    }

    const saveBtn = root.querySelector('.js-item-info-save-edits') as HTMLButtonElement | null;
    if (saveBtn) {
      saveBtn.onclick = (ev) => {
        ev.preventDefault();
        void this.#saveQuickEditsFromRoot(root);
      };
    }

    const wtSel = root.querySelector('.js-item-info-weapon-type') as HTMLSelectElement | null;
    const reachRow = root.querySelector('.js-item-info-weapon-reach-row') as HTMLElement | null;
    const rangeRow = root.querySelector('.js-item-info-weapon-range-row') as HTMLElement | null;
    const syncWeaponRows = () => {
      if (!wtSel || !reachRow || !rangeRow) return;
      const ranged = wtSel.value === 'ranged';
      reachRow.classList.toggle('item-info-edit-hidden', ranged);
      rangeRow.classList.toggle('item-info-edit-hidden', !ranged);
    };
    if (wtSel) {
      wtSel.addEventListener('change', syncWeaponRows);
      syncWeaponRows();
    }

    const armorType = root.querySelector('.js-item-info-armor-type') as HTMLSelectElement | null;
    if (armorType) {
      armorType.addEventListener('change', () => {
        const def = getArmorDefinitionForType(armorType.value);
        const av = root.querySelector('.js-item-info-armor-value') as HTMLInputElement | null;
        const ae = root.querySelector('.js-item-info-armor-evade') as HTMLInputElement | null;
        const asp = root.querySelector('.js-item-info-armor-skill-penalty') as HTMLInputElement | null;
        if (def && av && ae) {
          av.value = String(def.armorValue);
          ae.value = String(def.evadeModifier);
        }
        if (def && asp) {
          asp.value = def.skillPenalty === '—' ? '' : def.skillPenalty;
        }
      });
    }

    const shieldType = root.querySelector('.js-item-info-shield-type') as HTMLSelectElement | null;
    if (shieldType) {
      shieldType.addEventListener('change', () => {
        const def = getShieldDefinitionForType(shieldType.value);
        const sv = root.querySelector('.js-item-info-shield-value') as HTMLInputElement | null;
        const se = root.querySelector('.js-item-info-shield-evade') as HTMLInputElement | null;
        if (def && sv && se) {
          sv.value = String(def.shieldValue);
          se.value = String(def.evadeBonus ?? 0);
        }
      });
    }

    const editPanel = root.querySelector('.item-info-edit-panel') as HTMLDetailsElement | null;
    if (editPanel) {
      editPanel.addEventListener('toggle', () => {
        this._quickEditOpen = editPanel.open;
      });
    }
  }
}
