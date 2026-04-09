/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */

import { describeInnateAbility, getWeapon, WEAPONS } from '../utils/weapons.js';
import {
  BASE_SHIELDS,
  getArmorDefinitionForType,
  getShieldDefinitionForType,
  normalizeShieldTypeKey
} from '../utils/equipment.js';

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
    masteryNode: 'Mastery Node'
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

export class ItemInfoDialog extends BaseDialog {
  private _item: any;

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

      if (canEdit) {
        const dmgCur =
          sys.damage != null && String(sys.damage).trim() !== ''
            ? String(sys.damage)
            : String(cat?.weaponDamage ?? '1d8');
        const damages = uniqueSortedWeaponDamages();
        if (!damages.includes(dmgCur)) damages.unshift(dmgCur);
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
        ruleHint:
          'Armor Value + Shield value + Mastery Rank = total armor subtracted from incoming damage (subject to rule exceptions).'
      };

      if (canEdit) {
        const curType = (sys.type || 'light').toLowerCase();
        (base as any).armorEdit = {
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

      if (canEdit) {
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

    const catSel = root.querySelector('.js-item-info-weapon-catalog') as HTMLSelectElement | null;
    if (catSel) {
      catSel.onchange = async () => {
        const name = catSel.value?.trim();
        if (!name) return;
        const def = getWeapon(name);
        if (!def) return;
        const specialsArr =
          def.special === '—' ? [] : def.special.split(',').map((s) => s.trim()).filter(Boolean);
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

    const dmgSel = root.querySelector('.js-item-info-weapon-damage') as HTMLSelectElement | null;
    if (dmgSel) {
      dmgSel.onchange = async () => {
        await this._item.update({ 'system.damage': dmgSel.value });
        await this.#resyncItemAfterUpdate();
      };
    }

    const handsSel = root.querySelector('.js-item-info-weapon-hands') as HTMLSelectElement | null;
    if (handsSel) {
      handsSel.onchange = async () => {
        await this._item.update({ 'system.hands': parseInt(handsSel.value, 10) || 1 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const wtSel = root.querySelector('.js-item-info-weapon-type') as HTMLSelectElement | null;
    if (wtSel) {
      wtSel.onchange = async () => {
        await this._item.update({ 'system.weaponType': wtSel.value });
        await this.#resyncItemAfterUpdate();
      };
    }

    const rangeInp = root.querySelector('.js-item-info-weapon-range') as HTMLInputElement | null;
    if (rangeInp) {
      rangeInp.onchange = async () => {
        await this._item.update({ 'system.range': rangeInp.value.trim() || '0m' });
        await this.#resyncItemAfterUpdate();
      };
    }

    const armorType = root.querySelector('.js-item-info-armor-type') as HTMLSelectElement | null;
    if (armorType) {
      armorType.onchange = async () => {
        const def = getArmorDefinitionForType(armorType.value);
        if (def) {
          await this._item.update({
            'system.type': armorType.value,
            'system.armorValue': def.armorValue,
            'system.evadeModifier': def.evadeModifier
          });
        } else {
          await this._item.update({ 'system.type': armorType.value });
        }
        await this.#resyncItemAfterUpdate();
      };
    }

    const av = root.querySelector('.js-item-info-armor-value') as HTMLInputElement | null;
    if (av) {
      av.onchange = async () => {
        await this._item.update({ 'system.armorValue': parseInt(av.value, 10) || 0 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const ae = root.querySelector('.js-item-info-armor-evade') as HTMLInputElement | null;
    if (ae) {
      ae.onchange = async () => {
        await this._item.update({ 'system.evadeModifier': parseInt(ae.value, 10) || 0 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const shieldType = root.querySelector('.js-item-info-shield-type') as HTMLSelectElement | null;
    if (shieldType) {
      shieldType.onchange = async () => {
        const def = BASE_SHIELDS.find((s) => s.type === shieldType.value);
        if (def) {
          await this._item.update({
            'system.type': shieldType.value,
            'system.shieldValue': def.shieldValue,
            'system.evadeBonus': def.evadeBonus
          });
        } else {
          await this._item.update({ 'system.type': shieldType.value });
        }
        await this.#resyncItemAfterUpdate();
      };
    }

    const sv = root.querySelector('.js-item-info-shield-value') as HTMLInputElement | null;
    if (sv) {
      sv.onchange = async () => {
        await this._item.update({ 'system.shieldValue': parseInt(sv.value, 10) || 0 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const se = root.querySelector('.js-item-info-shield-evade') as HTMLInputElement | null;
    if (se) {
      se.onchange = async () => {
        await this._item.update({ 'system.evadeBonus': parseInt(se.value, 10) || 0 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const gSize = root.querySelector('.js-item-info-gear-size') as HTMLSelectElement | null;
    if (gSize) {
      gSize.onchange = async () => {
        await this._item.update({ 'system.inventorySize': gSize.value });
        await this.#resyncItemAfterUpdate();
      };
    }

    const gQty = root.querySelector('.js-item-info-gear-qty') as HTMLInputElement | null;
    if (gQty) {
      gQty.onchange = async () => {
        await this._item.update({ 'system.quantity': Math.max(0, parseInt(gQty.value, 10) || 0) });
        await this.#resyncItemAfterUpdate();
      };
    }

    const gW = root.querySelector('.js-item-info-gear-weight') as HTMLInputElement | null;
    if (gW) {
      gW.onchange = async () => {
        await this._item.update({ 'system.weight': parseFloat(gW.value) || 0 });
        await this.#resyncItemAfterUpdate();
      };
    }

    const gDesc = root.querySelector('.js-item-info-gear-desc') as HTMLTextAreaElement | null;
    if (gDesc) {
      gDesc.onchange = async () => {
        await this._item.update({ 'system.description': gDesc.value });
        await this.#resyncItemAfterUpdate();
      };
    }
  }
}
