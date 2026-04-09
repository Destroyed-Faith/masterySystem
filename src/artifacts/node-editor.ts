/**
 * Node Editor Dialog
 * Edit a single artifact node's data (kind + type-specific profile).
 */

import type {
  ArtifactArmorProfile,
  ArtifactKind,
  ArtifactShieldProfile,
  ArtifactWeaponProfile,
  ArtifactWeaponSpecialRef
} from '../types/item.js';
import {
  ARTIFACT_GEAR_SLOT_OPTIONS,
  getArtifactSpecialSelectOptions,
  getArtifactWeaponDamagePresets,
  getArtifactWeaponInnateOptions
} from '../utils/artifact-node-options.js';
import { getEffectById, parseEffectStrings } from '../utils/special-effects.js';
import { EmbeddedPowerDialog } from './embedded-power-dialog.js';

// Use V1 Application for reliable template rendering in v13
const BaseDialog: any = (foundry as any)?.appv1?.Application || (Application as any);

const DAMAGE_PRESETS = getArtifactWeaponDamagePresets();
const PRESET_VALUES = new Set(DAMAGE_PRESETS.map((p) => p.value));

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

function rowsForStrings(values: string[]): string[] {
  const v = (values || []).map((s) => String(s).trim()).filter(Boolean);
  return v.length ? v : [''];
}

function rowsForSpecialRefs(refs: ArtifactWeaponSpecialRef[]): any[] {
  if (!refs.length) {
    return [{ specialId: '', valueStr: '', showValueInput: false }];
  }
  return refs.map((ref) => {
    const ef = getEffectById(ref.specialId);
    const hasVal = ef ? ef.hasValue : true;
    return {
      specialId: ref.specialId,
      value: ref.value,
      valueStr: ref.value != null && Number.isFinite(ref.value) ? String(ref.value) : '',
      showValueInput: Boolean(ref.specialId && hasVal)
    };
  });
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

  constructor(item: Item) {
    super();
    this.item = item;
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
    data.specialSelectOptions = getArtifactSpecialSelectOptions();
    data.weaponInnateRows = rowsForStrings(weapon.innateAbilities || []);
    data.weaponSpecialRows = rowsForSpecialRefs(weapon.specials || []);
    data.requirements = system.requirements || { stones: 0, masteryRank: 1 };

    return data;
  }

  activateListeners(html: JQuery): void {
    super.activateListeners(html);

    const syncKindUi = () => {
      const kind = html.find('#node-artifact-kind').val() as string;
      html.find('[data-profile]').each((_i, el) => {
        const $el = $(el);
        const p = String($el.data('profile') || '');
        $el.toggleClass('hidden', p !== kind);
      });
    };

    html.find('#node-artifact-kind').on('change', syncKindUi);
    syncKindUi();

    html.find('#node-weapon-damage-preset').on('change', (e: JQuery.ChangeEvent) => {
      const v = $(e.currentTarget).val() as string;
      html.find('.node-weapon-damage-custom-wrap').toggleClass('hidden', v !== '__custom__');
    });

    html.find('#node-weapon-type').on('change', () => syncWeaponRangeLabel(html));
    syncWeaponRangeLabel(html);

    const cloneInnateRow = () => {
      const $c = html.find('#node-weapon-innates');
      const $first = $c.find('.node-select-row').first();
      const $clone = $first.clone();
      $clone.find('.node-weapon-innate').val('');
      $c.append($clone);
    };

    const cloneSpecialRow = () => {
      const $c = html.find('#node-weapon-specials');
      const $first = $c.find('.node-special-row').first();
      const $clone = $first.clone();
      $clone.find('.node-weapon-special-id').val('');
      $clone.find('.node-weapon-special-val').val('');
      $clone.find('.node-weapon-special-val-wrap').addClass('hidden');
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
      await this.saveNode(html);
      (this as any).close();
    });

    html.find('button[data-button="cancel"]').on('click', () => {
      (this as any).close();
    });

    html.find('[data-action="open-embedded-powers"]').on('click', () => {
      new EmbeddedPowerDialog(this.item).render(true);
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

  async saveNode(html: JQuery): Promise<void> {
    const kind = html.find('#node-artifact-kind').val() as ArtifactKind;
    const gearSlot = kind === 'gear' ? String(html.find('#node-gear-slot').val() || '').trim() : '';

    const preset = html.find('#node-weapon-damage-preset').val() as string;
    const customDmg = String(html.find('#node-weapon-damage-custom').val() || '').trim();
    const damage =
      preset === '__custom__' ? customDmg : preset === '' ? '' : preset;

    const artifactWeapon: ArtifactWeaponProfile = {
      weaponType: (html.find('#node-weapon-type').val() as 'melee' | 'ranged') || 'melee',
      damage,
      range: String(html.find('#node-weapon-range').val() || '0m').trim() || '0m',
      hands: Math.min(2, Math.max(1, parseInt(html.find('#node-weapon-hands').val() as string, 10) || 1)),
      innateAbilities: this.collectSelectValues(html, '.node-weapon-innate'),
      specials: this.collectWeaponSpecials(html)
    };

    const artifactArmor: ArtifactArmorProfile = {
      type: String(html.find('#node-armor-type').val() || 'light'),
      armorValue: parseInt(html.find('#node-armor-value').val() as string, 10) || 0,
      evadeModifier: parseInt(html.find('#node-armor-evade').val() as string, 10) || 0,
      skillPenalty: String(html.find('#node-armor-skill-penalty').val() || '').trim()
    };

    const artifactShield: ArtifactShieldProfile = {
      type: String(html.find('#node-shield-type').val() || 'parry'),
      shieldValue: parseInt(html.find('#node-shield-value').val() as string, 10) || 0,
      evadeBonus: parseInt(html.find('#node-shield-evade').val() as string, 10) || 0,
      skillPenalty: String(html.find('#node-shield-skill-penalty').val() || '').trim()
    };

    const requirements = {
      stones: parseInt(html.find('#node-stones').val() as string, 10) || 0,
      masteryRank: parseInt(html.find('#node-mastery-rank').val() as string, 10) || 1
    };

    const clearedBonuses = { attack: 0, damage: '', defense: 0, specials: [] as string[] };

    const updates: any = {
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
