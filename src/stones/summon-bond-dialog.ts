/**
 * Summon Bond Ritual Dialog — canonical Summons V2 create / redistribute / dissolve UI.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import { ALL_POWER_TEMPLATES } from '../utils/powers/templates/index.js';
import {
  createSummonActorForBondBody,
  deleteSummonActor,
  placeFamiliarToken,
} from './familiar-actor-factory.js';
import { getActorPoolSpendable } from './familiar-bind.js';
import {
  addBoundStonesToBond,
  applyBondRitual,
  createSummonBondWithStones,
  dissolveSummonBond,
  getSummonBondsFromActor,
  ownerSkillRatingsFromActor,
  removeBoundStonesFromBond,
  recomputeBondDerived,
  setBondBonusTokens,
  syncBodiesFromSpend,
  tokensSummary,
  upsertSummonBond,
  validateBondRitual,
  STONE_POOL_ATTRS,
  type StonePoolAttr,
  type SummonBondRecord,
  type SummonBodyRecord,
} from './summon-bond-bind.js';
import {
  SHARED_SENSE_GROUPS,
  SUMMON_ELIGIBLE_SPECIALS,
  SUMMON_MOVEMENT_MODES,
  SUMMON_SKILL_IDS,
  computeSummonBond,
  emptyBondSpend,
  maxSummonPowerLevel,
  standardPowerTokenCost,
  summonTokensFromStones,
  type SharedSenseGroup,
  type SummonMovementMode,
  type SummonSkillId,
} from './summon-bond-rules.js';

type DialogMode = 'create' | 'ritual';

const SKILL_LABELS: Record<string, string> = {
  perception: 'Perception',
  investigation: 'Investigation',
  tracking: 'Tracking',
  survival: 'Survival',
  navigation: 'Navigation',
  weatherSense: 'Weather Sense',
  stealth: 'Stealth',
  concealment: 'Concealment',
  athletics: 'Athletics',
  acrobatics: 'Acrobatics',
};

export class SummonBondDialog extends BaseDialog {
  private actor: Actor;
  private mode: DialogMode;
  private draft: SummonBondRecord;
  private createAttrs: StonePoolAttr[] = [];
  private createName = '';
  private createImg = '';
  private createExpression = '';
  private createMode: SummonMovementMode = 'walking';
  private createTiming: 'before' | 'after' = 'after';
  private createErrors: string[] = [];
  private ritualErrors: string[] = [];
  private ritualWarnings: string[] = [];
  private resolveClose?: (bond: SummonBondRecord | null) => void;

  static DEFAULT_OPTIONS = {
    id: 'mastery-summon-bond',
    classes: ['mastery-system', 'summon-bond-dialog-app'],
    position: { width: 720, height: 820 },
    window: { title: 'Summon Bond Ritual', resizable: true },
  };

  static PARTS = {
    content: { template: 'systems/mastery-system/templates/dialogs/summon-bond.hbs' },
  };

  static async showCreate(actor: Actor): Promise<SummonBondRecord | null> {
    return new Promise((resolve) => {
      const app = new SummonBondDialog(actor, 'create', null, resolve);
      (app as any).render({ force: true });
    });
  }

  static async showRitual(actor: Actor, bondId: string): Promise<SummonBondRecord | null> {
    const bond = getSummonBondsFromActor(actor).find((b) => b.id === bondId);
    if (!bond) {
      ui.notifications?.warn('Summon Bond not found.');
      return null;
    }
    return new Promise((resolve) => {
      const app = new SummonBondDialog(actor, 'ritual', bond, resolve);
      (app as any).render({ force: true });
    });
  }

  constructor(
    actor: Actor,
    mode: DialogMode,
    bond: SummonBondRecord | null,
    resolveClose?: (bond: SummonBondRecord | null) => void,
  ) {
    super({});
    this.actor = actor;
    this.mode = mode;
    this.resolveClose = resolveClose;
    if (bond) {
      this.draft = structuredCloneBond(bond);
      this.ensureSpendBodies();
    } else {
      this.draft = {
        id: '',
        name: '',
        img: '',
        expression: '',
        ownerActorId: (actor as any).id ?? '',
        boundStoneCount: 0,
        stoneAttributes: [],
        bonusTokens: 0,
        movementMode: 'walking',
        movementM: 8,
        attackDice: 2,
        damageDice: 1,
        summonAttacks: 1,
        specialKey: null,
        specialValue: 0,
        selectedSkills: [],
        skillDiceAlloc: {},
        spend: emptyBondSpend(1),
        bodies: [],
        activationTiming: 'after',
        needsRedistribution: true,
        locked: false,
      };
    }
  }

  private ensureSpendBodies(): void {
    const need = 1 + Math.max(0, this.draft.spend.additionalBodies || 0);
    while (this.draft.spend.bodies.length < need) {
      this.draft.spend.bodies.push({
        hpPurchases: 0,
        armorPurchases: 0,
        evadePurchases: 0,
        sharedSenses: [],
        powerTokenCosts: [],
      });
    }
    this.draft.spend.bodies = this.draft.spend.bodies.slice(0, need);
    while (this.draft.bodies.length < need) {
      this.draft.bodies.push({
        id: `body-tmp-${this.draft.bodies.length}`,
        hp: 10,
        armor: 0,
        evade: 4,
        sharedSenses: [],
        powers: [],
        dormant: false,
        hpPurchases: 0,
        armorPurchases: 0,
        evadePurchases: 0,
      });
    }
    // Mirror body purchase fields into spend
    for (let i = 0; i < need; i++) {
      const b = this.draft.bodies[i];
      const s = this.draft.spend.bodies[i];
      b.hpPurchases = s.hpPurchases;
      b.armorPurchases = s.armorPurchases;
      b.evadePurchases = s.evadePurchases;
      b.sharedSenses = [...s.sharedSenses];
      s.powerTokenCosts = (b.powers || []).map((p) => p.tokenCost);
    }
    this.draft = syncBodiesFromSpend(this.draft);
  }

  async _prepareContext(_options: any): Promise<any> {
    const spendable = getActorPoolSpendable(this.actor);
    const poolGems = STONE_POOL_ATTRS.map((attr) => {
      const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
      const n = spendable[attr] ?? 0;
      return {
        attr,
        label: attr.slice(0, 3).toUpperCase(),
        spendable: n,
        available: n > 0,
        fill: style.fill,
        stroke: style.stroke,
      };
    });

    if (this.mode === 'create') {
      return {
        isCreate: true,
        isRitual: false,
        draft: {
          name: this.createName,
          img: this.createImg,
          expression: this.createExpression,
          stoneAttributes: this.createAttrs,
        },
        movementModes: SUMMON_MOVEMENT_MODES.map((m) => ({
          ...m,
          selected: m.value === this.createMode,
        })),
        timingBefore: this.createTiming === 'before',
        timingAfter: this.createTiming === 'after',
        poolGems,
        createStoneCount: this.createAttrs.length,
        createTokenPreview: summonTokensFromStones(this.createAttrs.length),
        createErrors: this.createErrors,
        canCreate: this.createAttrs.length >= 1 && !!this.createName.trim(),
      };
    }

    this.ensureSpendBodies();
    const ratings = ownerSkillRatingsFromActor(this.actor);
    const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1));
    const computed = computeSummonBond({
      boundStoneCount: this.draft.boundStoneCount,
      bonusTokens: this.draft.bonusTokens,
      movementMode: this.draft.movementMode,
      spend: this.draft.spend,
    });
    const tokens = tokensSummary(this.draft);
    const validation = validateBondRitual(this.draft, ratings, mr);
    const selectedSkills = new Set(this.draft.selectedSkills);
    const skillOptions = SUMMON_SKILL_IDS.map((id) => {
      const selected = selectedSkills.has(id);
      const canSelect = selected || selectedSkills.size < tokens.skillSlots;
      return {
        id,
        label: SKILL_LABELS[id] ?? id,
        selected,
        canSelect,
        ownerRating: ratings[id] ?? 0,
        dice: this.draft.skillDiceAlloc[id] ?? 0,
      };
    });

    const bodyViews = this.draft.bodies.map((body, index) => ({
      index,
      n: index + 1,
      open: index === 0,
      dormant: !!body.dormant,
      hp: body.hp,
      armor: body.armor,
      evade: body.evade,
      hpPurchases: this.draft.spend.bodies[index]?.hpPurchases ?? 0,
      armorPurchases: this.draft.spend.bodies[index]?.armorPurchases ?? 0,
      evadePurchases: this.draft.spend.bodies[index]?.evadePurchases ?? 0,
      summonActorId: body.summonActorId,
      senses: SHARED_SENSE_GROUPS.map((s) => ({
        ...s,
        checked: (this.draft.spend.bodies[index]?.sharedSenses || []).includes(s.value),
      })),
      powers: (body.powers || []).map((p) => ({
        ...p,
        name: ALL_POWER_TEMPLATES.find((t) => t.templateId === p.templateId)?.name ?? p.templateId,
      })),
    }));

    const powerCatalog = ALL_POWER_TEMPLATES
      .filter((t) => ['active', 'passive', 'reaction', 'activeBuff', 'movement'].includes(t.category))
      .map((t) => ({
        templateId: t.templateId,
        name: t.name,
        category: t.category,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const specialOptions = SUMMON_ELIGIBLE_SPECIALS.map((s) => ({
      ...s,
      selected: this.draft.specialKey === s.id,
    }));

    const sv = computed.specialValue;
    const specialDisplay =
      this.draft.spend.specialAccess && this.draft.specialKey
        ? `${this.draft.specialKey}(${sv})`
        : 'None';

    return {
      isCreate: false,
      isRitual: true,
      draft: this.draft,
      movementModes: SUMMON_MOVEMENT_MODES.map((m) => ({
        ...m,
        selected: m.value === this.draft.movementMode,
      })),
      timingBefore: this.draft.activationTiming === 'before',
      timingAfter: this.draft.activationTiming === 'after',
      poolGems,
      tokens: { ...tokens, over: tokens.remaining < 0 },
      computed,
      skillOptions,
      bodyViews,
      powerCatalog,
      specialOptions,
      specialDisplay,
      maxPowerLevel: maxSummonPowerLevel(mr),
      onlyOneStone: this.draft.stoneAttributes.length <= 1,
      ritualErrors: this.ritualErrors.length ? this.ritualErrors : validation.errors,
      ritualWarnings: this.ritualWarnings.length ? this.ritualWarnings : validation.warnings,
      canApplyRitual: validation.ok,
    };
  }

  async _onRender(context: any, options: any): Promise<void> {
    await (super._onRender as any)?.(context, options);
    const root = (this as any).element as HTMLElement;
    if (!root) return;

    root.querySelector('.js-sb-cancel')?.addEventListener('click', () => this.#close(null));

    if (this.mode === 'create') {
      root.querySelector('.js-sb-name')?.addEventListener('change', (ev) => {
        this.createName = (ev.target as HTMLInputElement).value;
      });
      root.querySelector('.js-sb-expression')?.addEventListener('change', (ev) => {
        this.createExpression = (ev.target as HTMLInputElement).value;
      });
      root.querySelector('.js-sb-img')?.addEventListener('change', (ev) => {
        this.createImg = (ev.target as HTMLInputElement).value;
      });
      root.querySelectorAll('input[name="sbMovement"]').forEach((el) => {
        el.addEventListener('change', (ev) => {
          this.createMode = (ev.target as HTMLInputElement).value as SummonMovementMode;
        });
      });
      root.querySelectorAll('input[name="sbTiming"]').forEach((el) => {
        el.addEventListener('change', (ev) => {
          this.createTiming = (ev.target as HTMLInputElement).value as 'before' | 'after';
        });
      });
      root.querySelectorAll('.js-sb-add-create-stone').forEach((btn) => {
        btn.addEventListener('click', () => {
          const attr = (btn as HTMLElement).dataset.attr as StonePoolAttr;
          if (attr) this.createAttrs.push(attr);
          this.render({ force: true });
        });
      });
      root.querySelectorAll('.js-sb-remove-create-stone').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = Number((btn as HTMLElement).dataset.index);
          this.createAttrs.splice(i, 1);
          this.render({ force: true });
        });
      });
      root.querySelector('.js-sb-create')?.addEventListener('click', () => void this.#doCreate());
      return;
    }

    // Ritual listeners
    const readIdentity = () => {
      this.draft.name = (root.querySelector('.js-sb-name') as HTMLInputElement)?.value ?? this.draft.name;
      this.draft.expression =
        (root.querySelector('.js-sb-expression') as HTMLInputElement)?.value ?? this.draft.expression;
      this.draft.img = (root.querySelector('.js-sb-img') as HTMLInputElement)?.value ?? this.draft.img;
      const mov = (root.querySelector('input[name="sbMovement"]:checked') as HTMLInputElement)?.value;
      if (mov) this.draft.movementMode = mov as SummonMovementMode;
      const timing = (root.querySelector('input[name="sbTiming"]:checked') as HTMLInputElement)?.value;
      if (timing === 'before' || timing === 'after') this.draft.activationTiming = timing;
      const bonus = Number((root.querySelector('.js-sb-bonus-tokens') as HTMLInputElement)?.value || 0);
      this.draft.bonusTokens = Math.max(0, Math.floor(bonus));
    };

    root.querySelectorAll('.js-sb-spend').forEach((el) => {
      el.addEventListener('change', () => {
        readIdentity();
        const field = (el as HTMLElement).dataset.field as keyof typeof this.draft.spend;
        const val = Math.max(0, Math.floor(Number((el as HTMLInputElement).value) || 0));
        (this.draft.spend as any)[field] = val;
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        this.render({ force: true });
      });
    });

    root.querySelector('.js-sb-special-access')?.addEventListener('change', (ev) => {
      readIdentity();
      this.draft.spend.specialAccess = (ev.target as HTMLInputElement).checked;
      if (!this.draft.spend.specialAccess) {
        this.draft.specialKey = null;
        this.draft.spend.specialValuePurchases = 0;
      }
      this.draft = recomputeBondDerived(this.draft);
      this.render({ force: true });
    });

    root.querySelector('.js-sb-special-key')?.addEventListener('change', (ev) => {
      this.draft.specialKey = (ev.target as HTMLSelectElement).value || null;
    });

    root.querySelectorAll('.js-sb-skill-select').forEach((el) => {
      el.addEventListener('change', () => {
        readIdentity();
        const skill = (el as HTMLElement).dataset.skill as SummonSkillId;
        const checked = (el as HTMLInputElement).checked;
        const set = new Set(this.draft.selectedSkills);
        if (checked) set.add(skill);
        else {
          set.delete(skill);
          delete this.draft.skillDiceAlloc[skill];
        }
        this.draft.selectedSkills = [...set] as SummonSkillId[];
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-skill-dice').forEach((el) => {
      el.addEventListener('change', () => {
        const skill = (el as HTMLElement).dataset.skill as SummonSkillId;
        this.draft.skillDiceAlloc[skill] = Math.max(0, Math.floor(Number((el as HTMLInputElement).value) || 0));
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-body-spend').forEach((el) => {
      el.addEventListener('change', () => {
        readIdentity();
        const bi = Number((el as HTMLElement).dataset.body);
        const field = (el as HTMLElement).dataset.field as 'hpPurchases' | 'armorPurchases' | 'evadePurchases';
        const val = Math.max(0, Math.floor(Number((el as HTMLInputElement).value) || 0));
        if (!this.draft.spend.bodies[bi]) return;
        this.draft.spend.bodies[bi][field] = val;
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-body-sense').forEach((el) => {
      el.addEventListener('change', () => {
        const bi = Number((el as HTMLElement).dataset.body);
        const sense = (el as HTMLElement).dataset.sense as SharedSenseGroup;
        const checked = (el as HTMLInputElement).checked;
        const list = new Set(this.draft.spend.bodies[bi]?.sharedSenses || []);
        if (checked) list.add(sense);
        else list.delete(sense);
        this.draft.spend.bodies[bi].sharedSenses = [...list] as SharedSenseGroup[];
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-add-power').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bi = Number((btn as HTMLElement).dataset.body);
        const sel = root.querySelector(`.js-sb-power-template[data-body="${bi}"]`) as HTMLSelectElement;
        const lvlEl = root.querySelector(`.js-sb-power-level[data-body="${bi}"]`) as HTMLInputElement;
        const templateId = sel?.value;
        const category = (sel?.selectedOptions[0]?.dataset.category || 'active') as any;
        const level = Math.max(1, Math.min(16, Math.floor(Number(lvlEl?.value) || 1)));
        if (!templateId) return;
        const tokenCost = standardPowerTokenCost(category, level);
        const body = this.draft.bodies[bi];
        if (!body) return;
        body.powers = [...(body.powers || []), { templateId, level, tokenCost, category }];
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-remove-power').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bi = Number((btn as HTMLElement).dataset.body);
        const pi = Number((btn as HTMLElement).dataset.powerIdx);
        const body = this.draft.bodies[bi];
        if (!body) return;
        body.powers = (body.powers || []).filter((_, i) => i !== pi);
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        this.render({ force: true });
      });
    });

    root.querySelectorAll('.js-sb-add-stone').forEach((btn) => {
      btn.addEventListener('click', () => void this.#addStone((btn as HTMLElement).dataset.attr as StonePoolAttr));
    });
    root.querySelectorAll('.js-sb-remove-stone').forEach((btn) => {
      btn.addEventListener('click', () => void this.#removeStone(Number((btn as HTMLElement).dataset.index)));
    });

    root.querySelector('.js-sb-bonus-tokens')?.addEventListener('change', async (ev) => {
      const n = Math.max(0, Math.floor(Number((ev.target as HTMLInputElement).value) || 0));
      const updated = await setBondBonusTokens(this.actor, this.draft.id, n);
      if (updated) this.draft = structuredCloneBond(updated);
      this.render({ force: true });
    });

    root.querySelector('.js-sb-apply-ritual')?.addEventListener('click', () => {
      readIdentity();
      void this.#applyRitual();
    });
    root.querySelector('.js-sb-dissolve')?.addEventListener('click', () => void this.#dissolve());

    root.querySelectorAll('.js-sb-create-actor').forEach((btn) => {
      btn.addEventListener('click', () => void this.#createActor(Number((btn as HTMLElement).dataset.body)));
    });
    root.querySelectorAll('.js-sb-open-actor').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bi = Number((btn as HTMLElement).dataset.body);
        const id = this.draft.bodies[bi]?.summonActorId;
        const a = id ? (game as any).actors?.get(id) : null;
        a?.sheet?.render(true);
      });
    });
    root.querySelectorAll('.js-sb-place-token').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const bi = Number((btn as HTMLElement).dataset.body);
        const id = this.draft.bodies[bi]?.summonActorId;
        const a = id ? (game as any).actors?.get(id) : null;
        if (a) await placeFamiliarToken(a, this.actor);
      });
    });
  }

  async #doCreate(): Promise<void> {
    this.createErrors = [];
    const result = await createSummonBondWithStones(this.actor, {
      name: this.createName,
      img: this.createImg,
      expression: this.createExpression,
      movementMode: this.createMode,
      stoneAttributes: this.createAttrs,
      activationTiming: this.createTiming,
    });
    if (!result.bond) {
      this.createErrors = result.errors;
      this.render({ force: true });
      return;
    }
    ui.notifications?.info(
      `Created Summon Bond "${result.bond.name}" (${summonTokensFromStones(result.bond.boundStoneCount)} Tokens). Open Bond Ritual to spend Tokens.`,
    );
    this.mode = 'ritual';
    this.draft = structuredCloneBond(result.bond);
    this.render({ force: true });
  }

  async #addStone(attr: StonePoolAttr): Promise<void> {
    if (!attr) return;
    const res = await addBoundStonesToBond(this.actor, this.draft.id, [attr]);
    if (!res.bond) {
      ui.notifications?.warn(res.errors[0] ?? 'Cannot add stone.');
      return;
    }
    this.draft = structuredCloneBond(res.bond);
    this.render({ force: true });
  }

  async #removeStone(index: number): Promise<void> {
    const res = await removeBoundStonesFromBond(this.actor, this.draft.id, [index]);
    if (!res.bond) {
      ui.notifications?.warn(res.errors[0] ?? 'Cannot remove stone.');
      return;
    }
    this.draft = structuredCloneBond(res.bond);
    this.render({ force: true });
  }

  async #applyRitual(): Promise<void> {
    this.ritualErrors = [];
    this.ritualWarnings = [];
    const ratings = ownerSkillRatingsFromActor(this.actor);
    const result = await applyBondRitual(this.actor, this.draft, ratings);
    if (!result.bond) {
      this.ritualErrors = result.errors;
      this.ritualWarnings = result.warnings;
      this.render({ force: true });
      ui.notifications?.warn(result.errors[0] ?? 'Bond Ritual failed.');
      return;
    }
    this.draft = structuredCloneBond(result.bond);
    // Sync existing summon actors
    for (const body of this.draft.bodies) {
      if (!body.summonActorId) continue;
      const a = (game as any).actors?.get(body.summonActorId);
      if (!a) continue;
      try {
        const { buildSummonActorDataFromBond } = await import('./familiar-actor-factory.js');
        const data = buildSummonActorDataFromBond(this.draft, body, this.actor);
        await a.update({
          name: (data as any).name,
          img: (data as any).img,
          system: (data as any).system,
        });
      } catch (err) {
        console.warn('Mastery System | Failed to sync summon actor', err);
      }
    }
    ui.notifications?.info(`Bond Ritual applied for "${this.draft.name}".`);
    this.render({ force: true });
  }

  async #dissolve(): Promise<void> {
    const confirmed =
      typeof (globalThis as any).foundry?.applications?.api?.DialogV2?.confirm === 'function'
        ? await (globalThis as any).foundry.applications.api.DialogV2.confirm({
            window: { title: 'Dissolve Summon Bond' },
            content: `<p>Release <strong>${this.draft.name}</strong>? Bound Stones return to your pool. Summon actors are deleted.</p>`,
          })
        : (globalThis as any).confirm?.(`Dissolve ${this.draft.name}? Bound Stones return to your pool.`);
    if (!confirmed) return;

    const res = await dissolveSummonBond(this.actor, this.draft.id, deleteSummonActor);
    if (!res.removed) {
      ui.notifications?.warn(res.errors[0] ?? 'Dissolve failed.');
      return;
    }
    ui.notifications?.info(`Dissolved Summon Bond "${res.removed.name}". Stones returned.`);
    this.#close(null);
  }

  async #createActor(bodyIndex: number): Promise<void> {
    await upsertSummonBond(this.actor, this.draft);
    const fresh = getSummonBondsFromActor(this.actor).find((b) => b.id === this.draft.id);
    if (!fresh) return;
    const body = fresh.bodies[bodyIndex] as SummonBodyRecord | undefined;
    if (!body) return;
    const summon = await createSummonActorForBondBody(fresh, body, this.actor);
    if (!summon) return;
    body.summonActorId = (summon as any).id;
    fresh.bodies[bodyIndex] = body;
    await upsertSummonBond(this.actor, fresh);
    this.draft = structuredCloneBond(fresh);
    this.render({ force: true });
  }

  #close(bond: SummonBondRecord | null): void {
    this.resolveClose?.(bond);
    this.resolveClose = undefined;
    this.close();
  }

  async close(options?: any): Promise<any> {
    this.resolveClose?.(this.mode === 'ritual' ? this.draft : null);
    this.resolveClose = undefined;
    return super.close(options);
  }
}

function structuredCloneBond(bond: SummonBondRecord): SummonBondRecord {
  try {
    return (globalThis as any).foundry?.utils?.duplicate?.(bond) ?? structuredClone(bond);
  } catch {
    return JSON.parse(JSON.stringify(bond)) as SummonBondRecord;
  }
}
