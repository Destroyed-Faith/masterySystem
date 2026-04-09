/**
 * Read-only item summary dialog (weapons, armor, shields, gear, artifacts).
 * Unified layout for equipment clicks and future callers.
 */

import { describeInnateAbility, getWeapon } from '../utils/weapons.js';
import {
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

    const base: Record<string, unknown> = {
      item,
      cssClass: 'item-info-dialog',
      typeLabel: typeLabel(t),
      itemImg: item.img || 'icons/svg/item-bag.svg',
      itemName: item.name,
      enrichedDescription: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        sys.description || ''
      ),
      showEditButton:
        !!(game.user?.isGM || item.isOwner) && typeof (item.sheet as any)?.render === 'function',
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
    }

    if (t === 'gear') {
      base.gearBlock = {
        weight: sys.weight != null ? String(sys.weight) : '—',
        quantity: sys.quantity != null ? String(sys.quantity) : '1',
        inventorySize: sys.inventorySize || '1x1'
      };
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

    return base;
  }

  async _onRender(context: unknown, options: Record<string, unknown>): Promise<void> {
    await super._onRender?.(context, options);
    const root = (this as any).element as HTMLElement | undefined;
    if (!root) return;

    const editBtn = root.querySelector('.js-item-info-edit') as HTMLButtonElement | null;
    if (editBtn) {
      editBtn.onclick = async (ev) => {
        ev.preventDefault();
        const sheet = this._item.sheet;
        if (sheet && typeof (sheet as any).render === 'function') {
          await (sheet as any).render(true);
        }
      };
    }

    const closeBtn = root.querySelector('.js-item-info-close') as HTMLButtonElement | null;
    if (closeBtn) {
      closeBtn.onclick = (ev) => {
        ev.preventDefault();
        void (this as any).close?.();
      };
    }
  }
}
