/**
 * Summon Bond Ritual Dialog — canonical Summons V2 create / redistribute / dissolve UI.
 */

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const BaseDialog = HandlebarsApplicationMixin(ApplicationV2) as typeof ApplicationV2;

import { getStoneGemStyle } from '../utils/stone-attribute-ui.js';
import { creatureTypeSelectOptions, normalizeCreatureTypeValue } from '../utils/creature-type.js';
import { getFilePickerClass } from '../utils/foundry-v14.js';
import { evaluateSummonPower, listSummonPowerCatalog } from './summon-power-allowlist.js';
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
  DISSOLVE_BOND_CONFIRM,
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
  SUMMON_CAPS,
  SUMMON_ELIGIBLE_SPECIALS,
  SUMMON_MOVEMENT_MODES,
  SUMMON_SKILL_IDS,
  baseMovementM,
  computeSummonBond,
  emptyBondSpend,
  isSummonSkillEligible,
  maxMovementPurchases,
  maxSummonPowerLevel,
  normalizeMovementMode,
  summonSkillMinRating,
  summonTokensFromStones,
  type SharedSenseGroup,
  type SummonMovementMode,
  type SummonSkillId,
} from './summon-bond-rules.js';
import {
  applyBondFieldDelta,
  applyBodyFieldDelta,
  applyBonusTokenDelta,
  applySkillDiceAllocDelta,
  bodyStepperView,
  bondStepperView,
  inspectBondSpend,
  isIllegalBonusTokens,
  maxAssignableArtifactBonusTokens,
  resetIllegalPurchases,
  safePurchaseInt,
  sanitizeBonusTokens,
  sanitizeSpendNumbers,
  type BondSpendField,
  type BodySpendField,
  type SpendClampContext,
} from './summon-bond-spend.js';

const ATTR_LABELS: Record<StonePoolAttr, string> = {
  might: 'Might',
  agility: 'Agility',
  vitality: 'Vitality',
  intellect: 'Intellect',
  resolve: 'Resolve',
  influence: 'Influence',
  wits: 'Wits',
};

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
  private uiScrollTop = 0;
  private uiWindowScrollTop = 0;
  private openBodyIndexes = new Set<number>([0]);
  private identityOpen = false;
  private stonesOpen = false;
  private sensesOpen = false;
  private powersOpen = false;
  private specialOpen = false;
  private skillsOpen = false;
  private restoreUiAfterRender = false;

  static DEFAULT_OPTIONS = {
    id: 'mastery-summon-bond',
    classes: ['mastery-system', 'summon-bond-dialog-app'],
    position: { width: 800, height: 820 },
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
        creatureType: '',
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

  #poolGemsForCreate(): Array<{
    attr: StonePoolAttr;
    label: string;
    spendable: number;
    available: boolean;
    fill: string;
    stroke: string;
  }> {
    const spendable = getActorPoolSpendable(this.actor);
    const reserved: Partial<Record<StonePoolAttr, number>> = {};
    for (const a of this.createAttrs) reserved[a] = (reserved[a] ?? 0) + 1;
    return STONE_POOL_ATTRS.map((attr) => {
      const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
      const free = Math.max(0, (spendable[attr] ?? 0) - (reserved[attr] ?? 0));
      return {
        attr,
        label: ATTR_LABELS[attr],
        spendable: free,
        available: free > 0,
        fill: style.fill,
        stroke: style.stroke,
      };
    }).filter((g) => (spendable[g.attr] ?? 0) > 0 || (reserved[g.attr] ?? 0) > 0);
  }

  #poolGemsForRitual(): Array<{
    attr: StonePoolAttr;
    label: string;
    spendable: number;
    available: boolean;
    fill: string;
    stroke: string;
  }> {
    const spendable = getActorPoolSpendable(this.actor);
    return STONE_POOL_ATTRS.map((attr) => {
      const style = getStoneGemStyle(attr) ?? { fill: '#888888', stroke: '#aaaaaa' };
      const n = spendable[attr] ?? 0;
      return {
        attr,
        label: ATTR_LABELS[attr],
        spendable: n,
        available: n > 0,
        fill: style.fill,
        stroke: style.stroke,
      };
    }).filter((g) => g.spendable > 0);
  }

  async _prepareContext(_options: any): Promise<any> {
    if (this.mode === 'create') {
      const poolGems = this.#poolGemsForCreate();
      const stoneChips = this.createAttrs.map((attr) => ATTR_LABELS[attr] ?? attr);
      return {
        isCreate: true,
        isRitual: false,
        draft: {
          name: this.createName,
          img: this.createImg,
          expression: this.createExpression,
          creatureType: this.createExpression,
          stoneAttributes: stoneChips,
        },
        movementModes: SUMMON_MOVEMENT_MODES.map((m) => ({
          ...m,
          selected: m.value === this.createMode,
          hint: `base ${m.baseM} m, max ${m.maxM} m`,
        })),
        timingBefore: this.createTiming === 'before',
        timingAfter: this.createTiming === 'after',
        poolGems,
        createStoneCount: this.createAttrs.length,
        createTokenPreview: summonTokensFromStones(this.createAttrs.length),
        createErrors: this.createErrors,
        canCreate: this.createAttrs.length >= 1 && !!this.createName.trim(),
        creatureTypeOptions: creatureTypeSelectOptions(this.createExpression),
      };
    }

    this.draft.movementMode = normalizeMovementMode(this.draft.movementMode);
    this.ensureSpendBodies();
    const ratings = ownerSkillRatingsFromActor(this.actor);
    const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1));
    const otherBonds = getSummonBondsFromActor(this.actor);
    const maxBonusTokens = maxAssignableArtifactBonusTokens(this.actor, this.draft.id, otherBonds);
    const spendCtx: SpendClampContext = {
      boundStoneCount: this.draft.boundStoneCount,
      bonusTokens: this.draft.bonusTokens,
      movementMode: this.draft.movementMode,
      selectedSkills: this.draft.selectedSkills,
      ownerSkillRatings: ratings,
      ownerMasteryRank: mr,
      maxBonusTokens,
      skillDiceAlloc: this.draft.skillDiceAlloc,
    };
    const inspect = inspectBondSpend(this.draft.spend, spendCtx);
    const computed = computeSummonBond({
      boundStoneCount: this.draft.boundStoneCount,
      bonusTokens: sanitizeBonusTokens(this.draft.bonusTokens, maxBonusTokens),
      movementMode: this.draft.movementMode,
      spend: sanitizeSpendNumbers(this.draft.spend),
    });
    const tokens = tokensSummary({
      ...this.draft,
      bonusTokens: sanitizeBonusTokens(this.draft.bonusTokens, maxBonusTokens),
      spend: sanitizeSpendNumbers(this.draft.spend),
    });
    const validation = validateBondRitual(this.draft, ratings, mr, { maxBonusTokens });
    const selectedSkills = new Set(this.draft.selectedSkills);
    const purchasedDice = computed.skillDiceTotal;
    const skillMinRating = summonSkillMinRating(mr);
    const eligibleSelectedCount = this.draft.selectedSkills.filter((id) =>
      isSummonSkillEligible(ratings[id] ?? 0, mr),
    ).length;
    const allSkillRows = SUMMON_SKILL_IDS.map((id) => {
      const selected = selectedSkills.has(id);
      const ownerRating = ratings[id] ?? 0;
      const eligible = isSummonSkillEligible(ownerRating, mr);
      const canSelect = eligible && (selected || eligibleSelectedCount < tokens.skillSlots);
      const dice = Math.min(safePurchaseInt(this.draft.skillDiceAlloc[id] ?? 0), ownerRating);
      return {
        id,
        label: SKILL_LABELS[id] ?? id,
        selected,
        eligible,
        canSelect,
        ownerRating,
        dice,
        canMinusDice:
          eligible &&
          applySkillDiceAllocDelta(this.draft.skillDiceAlloc, id, -1, ownerRating, purchasedDice) != null,
        canPlusDice:
          eligible &&
          applySkillDiceAllocDelta(this.draft.skillDiceAlloc, id, 1, ownerRating, purchasedDice) != null,
      };
    });
    const skillOptions = allSkillRows.filter((s) => s.eligible);
    const invalidSkillOptions = allSkillRows.filter((s) => s.selected && !s.eligible);
    const hasEligibleSelected = eligibleSelectedCount > 0;

    const steppers = {
      attack: bondStepperView(this.draft.spend, 'attackPurchases', spendCtx, `+${SUMMON_CAPS.attackDiceGain}d8 Attack`),
      damage: bondStepperView(this.draft.spend, 'damagePurchases', spendCtx, `+${SUMMON_CAPS.damageDiceGain}d8 Damage`),
      movement: bondStepperView(this.draft.spend, 'movementPurchases', spendCtx, `+${SUMMON_CAPS.movementGainM} m`),
      extraAttack: bondStepperView(this.draft.spend, 'extraAttackPurchases', spendCtx, '+1 Bond Attack / round'),
      skillDice: bondStepperView(this.draft.spend, 'skillDicePurchases', spendCtx, `+${SUMMON_CAPS.skillDicePerPurchase} Skill Dice`),
      bodies: bondStepperView(this.draft.spend, 'additionalBodies', spendCtx, '+1 Body'),
      specialValue: bondStepperView(this.draft.spend, 'specialValuePurchases', spendCtx, '+1 Special Value'),
    };

    const assignedBonus = sanitizeBonusTokens(this.draft.bonusTokens, maxBonusTokens);
    const remaining = tokens.remaining;
    const artifactBonus = {
      value: assignedBonus,
      stones: assignedBonus / SUMMON_CAPS.artifactSummonTokensPerStone,
      maxBonus: maxBonusTokens,
      maxStones: maxBonusTokens / SUMMON_CAPS.artifactSummonTokensPerStone,
      canMinus: applyBonusTokenDelta(this.draft.bonusTokens, -1, maxBonusTokens, this.draft.boundStoneCount) != null,
      canPlus: applyBonusTokenDelta(this.draft.bonusTokens, 1, maxBonusTokens, this.draft.boundStoneCount) != null,
      detected: maxBonusTokens > 0 || assignedBonus > 0,
    };
    const skillDiceAssigned = Object.values(this.draft.skillDiceAlloc || {}).reduce(
      (sum, n) => sum + safePurchaseInt(n),
      0,
    );
    const canAffordSpecialAccess =
      !!this.draft.spend.specialAccess || remaining >= SUMMON_CAPS.specialAccessTokenCost;

    const bodyViews = this.draft.bodies.map((body, index) => ({
      index,
      n: index + 1,
      open: this.openBodyIndexes.has(index) || (this.openBodyIndexes.size === 0 && index === 0),
      dormant: !!body.dormant,
      hp: computed.bodies[index]?.hp ?? body.hp,
      armor: computed.bodies[index]?.armor ?? body.armor,
      evade: computed.bodies[index]?.evade ?? body.evade,
      hpPurchases: this.draft.spend.bodies[index]?.hpPurchases ?? 0,
      armorPurchases: this.draft.spend.bodies[index]?.armorPurchases ?? 0,
      evadePurchases: this.draft.spend.bodies[index]?.evadePurchases ?? 0,
      hpStepper: bodyStepperView(this.draft.spend, index, 'hpPurchases', spendCtx, `+${SUMMON_CAPS.hpGain} HP`),
      armorStepper: bodyStepperView(this.draft.spend, index, 'armorPurchases', spendCtx, `+${SUMMON_CAPS.armorGain} Armor`),
      evadeStepper: bodyStepperView(this.draft.spend, index, 'evadePurchases', spendCtx, `+${SUMMON_CAPS.evadeGain} Evade`),
      summonActorId: body.summonActorId,
      senses: SHARED_SENSE_GROUPS.map((s) => {
        const checked = (this.draft.spend.bodies[index]?.sharedSenses || []).includes(s.value);
        return {
          ...s,
          checked,
          canAfford: checked || remaining >= SUMMON_CAPS.sharedSenseTokenCost,
        };
      }),
      powers: (body.powers || []).map((p) => {
        const ev = evaluateSummonPower(p.templateId, p.level, mr);
        return {
          ...p,
          name: ev.name,
          legal: ev.legal,
          reason: ev.reason,
          ppCost: ev.ppCost,
          tokenCost: ev.tokenCost,
        };
      }),
    }));

    const powerCatalog = listSummonPowerCatalog(mr, 1)
      .map((ev) => ({
        templateId: ev.templateId,
        name: ev.name,
        category: ev.category,
        ppCost: ev.ppCost,
        tokenCost: ev.tokenCost,
        legal: ev.legal,
        reason: ev.reason,
        affordable: ev.legal && ev.tokenCost <= remaining,
      }))
      .sort((a, b) => Number(b.affordable) - Number(a.affordable));
    const canAddPower = powerCatalog.some((p) => p.affordable);

    const specialOptions = SUMMON_ELIGIBLE_SPECIALS.map((s) => ({
      ...s,
      selected: this.draft.specialKey === s.id,
    }));

    const sv = computed.specialValue;
    const specialDisplay =
      this.draft.spend.specialAccess && this.draft.specialKey
        ? `${this.draft.specialKey}(${sv})`
        : 'None';

    const stoneChips = this.draft.stoneAttributes.map((attr) => ATTR_LABELS[attr as StonePoolAttr] ?? attr);
    const moveMaxPurchases = maxMovementPurchases(this.draft.movementMode);

    return {
      isCreate: false,
      isRitual: true,
      draft: { ...this.draft, stoneAttributeLabels: stoneChips },
      stoneChips,
      movementModes: SUMMON_MOVEMENT_MODES.map((m) => ({
        ...m,
        selected: m.value === this.draft.movementMode,
        hint: `base ${m.baseM} m, max ${m.maxM} m`,
      })),
      movementBaseM: baseMovementM(this.draft.movementMode),
      movementMaxPurchases: moveMaxPurchases,
      timingBefore: this.draft.activationTiming === 'before',
      timingAfter: this.draft.activationTiming === 'after',
      poolGems: this.#poolGemsForRitual(),
      tokens: {
        ...tokens,
        over: remaining < 0,
        noneLeft: remaining <= 0,
        boundTotal: this.draft.boundStoneCount * SUMMON_CAPS.tokensPerStone,
        artifactBonus: assignedBonus,
        bodySpentViews: (tokens.bodySpent || []).map((n, i) => ({
          label: String.fromCharCode(65 + i),
          spent: n,
        })),
      },
      canAffordSpecialAccess,
      skillDiceAssigned,
      skillDiceUnassigned: Math.max(0, computed.skillDiceTotal - skillDiceAssigned),
      canAddPower,
      bondStatus: validation.status,
      bondStatusLabel: validation.statusLabel,
      computed,
      skillOptions,
      invalidSkillOptions,
      skillMinRating,
      hasEligibleSelected,
      creatureTypeOptions: creatureTypeSelectOptions(this.draft.creatureType || this.draft.expression),
      identityOpen: this.identityOpen,
      stonesOpen: this.stonesOpen,
      sensesOpen: this.sensesOpen,
      powersOpen: this.powersOpen,
      specialOpen: this.specialOpen,
      skillsOpen: this.skillsOpen,
      multiBody: computed.bodyCount > 1,
      previewStats: {
        attack: `${computed.attackDice}d8`,
        damage: `${computed.damageDice}d8`,
        move: `${computed.movementM} m`,
        attacks: `${computed.summonAttacks}/rd`,
        bodies: computed.bodyCount,
        special: specialDisplay,
        showSpecial: !!this.draft.spend.specialAccess && !!this.draft.specialKey,
        hp: bodyViews[0]?.hp ?? 10,
        armor: bodyViews[0]?.armor ?? 0,
        evade: bodyViews[0]?.evade ?? 4,
        multiBody: computed.bodyCount > 1,
        bodyRows: bodyViews.map((b) => ({
          n: b.n,
          hp: b.hp,
          armor: b.armor,
          evade: b.evade,
        })),
      },
      createActorBodyIndex: bodyViews.find((b) => !b.summonActorId)?.index ?? 0,
      canCreateActor: bodyViews.some((b) => !b.summonActorId),
      bodyViews,
      powerCatalog,
      specialOptions,
      specialDisplay,
      maxPowerLevel: maxSummonPowerLevel(mr),
      powerLevels: Array.from({ length: maxSummonPowerLevel(mr) }, (_, i) => i + 1),
      onlyOneStone: this.draft.stoneAttributes.length <= 1,
      ritualErrors: this.ritualErrors.length ? this.ritualErrors : validation.errors,
      ritualWarnings: this.ritualWarnings.length ? this.ritualWarnings : validation.warnings,
      canApplyRitual: validation.ok && !inspect.illegal,
      steppers,
      artifactBonus,
      illegalSpend: inspect.illegal,
      illegalReasons: inspect.reasons,
    };
  }

  #spendCtx(): SpendClampContext {
    return {
      boundStoneCount: this.draft.boundStoneCount,
      bonusTokens: this.draft.bonusTokens,
      movementMode: this.draft.movementMode,
      selectedSkills: this.draft.selectedSkills,
      ownerSkillRatings: ownerSkillRatingsFromActor(this.actor),
      ownerMasteryRank: Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1)),
      skillDiceAlloc: this.draft.skillDiceAlloc,
      maxBonusTokens: maxAssignableArtifactBonusTokens(
        this.actor,
        this.draft.id,
        getSummonBondsFromActor(this.actor),
      ),
    };
  }

  #remaining(): number {
    const ctx = this.#spendCtx();
    return computeSummonBond({
      boundStoneCount: this.draft.boundStoneCount,
      bonusTokens: sanitizeBonusTokens(this.draft.bonusTokens, ctx.maxBonusTokens),
      movementMode: this.draft.movementMode,
      spend: sanitizeSpendNumbers(this.draft.spend),
    }).tokensRemaining;
  }

  #scrollRoots(root: HTMLElement): { inner: HTMLElement | null; frame: HTMLElement | null } {
    return {
      inner: root.querySelector('.summon-bond-dialog'),
      frame: root.querySelector('.window-content'),
    };
  }

  #captureUi(): void {
    const root = (this as any).element as HTMLElement | null;
    if (!root) return;
    const { inner, frame } = this.#scrollRoots(root);
    this.uiScrollTop = inner?.scrollTop ?? 0;
    this.uiWindowScrollTop = frame?.scrollTop ?? 0;
    this.openBodyIndexes = new Set(
      Array.from(root.querySelectorAll<HTMLElement>('.sb-body[open]')).map((el) => Number(el.dataset.bodyIndex)),
    );
    this.identityOpen = !!root.querySelector('.sb-fold[data-fold="identity"][open]');
    this.stonesOpen = !!root.querySelector('.sb-fold[data-fold="stones"][open]');
    this.sensesOpen = !!root.querySelector('.sb-fold[data-fold="senses"][open]');
    this.powersOpen = !!root.querySelector('.sb-fold[data-fold="powers"][open]');
    this.specialOpen = !!root.querySelector('.sb-fold[data-fold="special"][open]');
    this.skillsOpen = !!root.querySelector('.sb-fold[data-fold="skills"][open]');
  }

  #restoreUi(): void {
    const root = (this as any).element as HTMLElement | null;
    if (!root) return;
    const apply = () => {
      const { inner, frame } = this.#scrollRoots(root);
      if (inner) inner.scrollTop = this.uiScrollTop;
      if (frame) frame.scrollTop = this.uiWindowScrollTop;
    };
    apply();
    requestAnimationFrame(() => {
      apply();
      requestAnimationFrame(apply);
    });
  }

  async #refresh(): Promise<void> {
    this.#captureUi();
    this.restoreUiAfterRender = true;
    await this.render({ force: true });
  }

  async _onRender(context: any, options: any): Promise<void> {
    await (super._onRender as any)?.(context, options);
    const root = (this as any).element as HTMLElement;
    if (!root) return;
    if (this.restoreUiAfterRender) {
      this.restoreUiAfterRender = false;
      this.#restoreUi();
    }

    root.querySelector('.js-sb-cancel')?.addEventListener('click', () => this.#close(null));

    if (this.mode === 'create') {
      const syncCreateFields = () => {
        this.createName = (root.querySelector('.js-sb-name') as HTMLInputElement)?.value ?? this.createName;
        this.createExpression = normalizeCreatureTypeValue(
          (root.querySelector('.js-sb-creature-type') as HTMLSelectElement)?.value ?? this.createExpression,
        );
        this.createImg = (root.querySelector('.js-sb-img') as HTMLInputElement)?.value ?? this.createImg;
        const mov = (root.querySelector('input[name="sbMovement"]:checked') as HTMLInputElement)?.value;
        if (mov) this.createMode = normalizeMovementMode(mov);
        const timing = (root.querySelector('input[name="sbTiming"]:checked') as HTMLInputElement)?.value;
        if (timing === 'before' || timing === 'after') this.createTiming = timing;
      };
      root.querySelector('.js-sb-name')?.addEventListener('input', (ev) => {
        this.createName = (ev.target as HTMLInputElement).value;
        const btn = root.querySelector('.js-sb-create') as HTMLButtonElement | null;
        if (btn) btn.disabled = !(this.createAttrs.length >= 1 && !!this.createName.trim());
      });
      root.querySelector('.js-sb-creature-type')?.addEventListener('change', (ev) => {
        this.createExpression = normalizeCreatureTypeValue((ev.target as HTMLSelectElement).value);
      });
      root.querySelector('.js-sb-img')?.addEventListener('change', (ev) => {
        this.createImg = (ev.target as HTMLInputElement).value;
      });
      root.querySelector('.js-sb-browse-img')?.addEventListener('click', (ev) => {
        ev.preventDefault();
        void this.#browseImage((path) => {
          this.createImg = path;
          const input = root.querySelector('.js-sb-img') as HTMLInputElement | null;
          if (input) input.value = path;
        });
      });
      root.querySelectorAll('input[name="sbMovement"]').forEach((el) => {
        el.addEventListener('change', (ev) => {
          this.createMode = normalizeMovementMode((ev.target as HTMLInputElement).value);
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
          if (!attr) return;
          const gem = this.#poolGemsForCreate().find((g) => g.attr === attr);
          if (!gem?.available) {
            ui.notifications?.warn(`No free ${ATTR_LABELS[attr] ?? attr} stones left to bind.`);
            return;
          }
          this.createAttrs.push(attr);
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
      root.querySelector('.js-sb-create')?.addEventListener('click', () => {
        syncCreateFields();
        void this.#doCreate();
      });
      return;
    }

    // Ritual listeners
    const readIdentity = () => {
      this.draft.name = (root.querySelector('.js-sb-name') as HTMLInputElement)?.value ?? this.draft.name;
      const creatureType = normalizeCreatureTypeValue(
        (root.querySelector('.js-sb-creature-type') as HTMLSelectElement)?.value ??
          this.draft.creatureType ??
          this.draft.expression,
      );
      this.draft.creatureType = creatureType;
      this.draft.expression = creatureType;
      this.draft.img = (root.querySelector('.js-sb-img') as HTMLInputElement)?.value ?? this.draft.img;
      const mov = (root.querySelector('input[name="sbMovement"]:checked') as HTMLInputElement)?.value;
      if (mov) this.draft.movementMode = normalizeMovementMode(mov);
      const timing = (root.querySelector('input[name="sbTiming"]:checked') as HTMLInputElement)?.value;
      if (timing === 'before' || timing === 'after') this.draft.activationTiming = timing;
    };

    root.querySelector('.js-sb-browse-img')?.addEventListener('click', (ev) => {
      ev.preventDefault();
      void this.#browseImage((path) => {
        this.draft.img = path;
        const input = root.querySelector('.js-sb-img') as HTMLInputElement | null;
        if (input) input.value = path;
      });
    });

    root.querySelectorAll('input[name="sbMovement"]').forEach((el) => {
      el.addEventListener('change', (ev) => {
        readIdentity();
        this.draft.movementMode = normalizeMovementMode((ev.target as HTMLInputElement).value);
        const maxMove = maxMovementPurchases(this.draft.movementMode);
        if (this.draft.spend.movementPurchases > maxMove) {
          this.draft.spend.movementPurchases = maxMove;
        }
        this.draft = recomputeBondDerived(this.draft);
        void this.#refresh();
      });
    });

    root.querySelectorAll('.js-sb-step').forEach((el) => {
      el.addEventListener('click', () => {
        const btn = el as HTMLElement;
        if ((btn as HTMLButtonElement).disabled) return;
        readIdentity();
        const field = btn.dataset.field as BondSpendField | BodySpendField | 'bonusTokens' | 'skillDice';
        const delta = parseInt(String(btn.dataset.delta ?? ''), 10);
        if (delta !== 1 && delta !== -1) return;
        const ctx = this.#spendCtx();

        if (field === 'bonusTokens') {
          const next = applyBonusTokenDelta(
            this.draft.bonusTokens,
            delta,
            ctx.maxBonusTokens ?? 0,
            this.draft.boundStoneCount,
          );
          if (next == null) return;
          void this.#setBonus(next);
          return;
        }

        if (field === 'skillDice') {
          const skill = btn.dataset.skill as SummonSkillId;
          if (!skill) return;
          const ratings = ownerSkillRatingsFromActor(this.actor);
          const purchased = computeSummonBond({
            boundStoneCount: this.draft.boundStoneCount,
            bonusTokens: sanitizeBonusTokens(this.draft.bonusTokens, ctx.maxBonusTokens),
            movementMode: this.draft.movementMode,
            spend: sanitizeSpendNumbers(this.draft.spend),
          }).skillDiceTotal;
          const nextAlloc = applySkillDiceAllocDelta(
            this.draft.skillDiceAlloc,
            skill,
            delta,
            ratings[skill] ?? 0,
            purchased,
          );
          if (!nextAlloc) return;
          this.draft.skillDiceAlloc = nextAlloc;
          void this.#refresh();
          return;
        }

        const bodyRaw = btn.dataset.body;
        if (bodyRaw != null && bodyRaw !== '') {
          const bi = parseInt(bodyRaw, 10);
          if (!Number.isFinite(bi) || bi < 0) return;
          const next = applyBodyFieldDelta(this.draft.spend, bi, field as BodySpendField, delta, ctx);
          if (!next) return;
          this.draft.spend = next;
        } else {
          const next = applyBondFieldDelta(this.draft.spend, field as BondSpendField, delta, ctx);
          if (!next) return;
          this.draft.spend = next;
        }
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        void this.#refresh();
      });
    });

    root.querySelector('.js-sb-reset-illegal')?.addEventListener('click', () => {
      readIdentity();
      this.draft.spend = resetIllegalPurchases(this.draft.spend);
      this.draft.skillDiceAlloc = {};
      const ctx = this.#spendCtx();
      if (isIllegalBonusTokens(this.draft.bonusTokens, ctx.maxBonusTokens ?? 0, this.draft.boundStoneCount)) {
        this.draft.bonusTokens = 0;
        void this.#setBonus(0);
        return;
      }
      this.ensureSpendBodies();
      this.draft = recomputeBondDerived(this.draft);
      void this.#refresh();
    });

    root.querySelector('.js-sb-special-access')?.addEventListener('change', (ev) => {
      readIdentity();
      const on = (ev.target as HTMLInputElement).checked;
      if (on && this.#remaining() < SUMMON_CAPS.specialAccessTokenCost) {
        (ev.target as HTMLInputElement).checked = false;
        ui.notifications?.warn(`Special Access costs ${SUMMON_CAPS.specialAccessTokenCost} Tokens.`);
        return;
      }
      this.draft.spend.specialAccess = on;
      if (!this.draft.spend.specialAccess) {
        this.draft.specialKey = null;
        this.draft.spend.specialValuePurchases = 0;
      }
      this.draft = recomputeBondDerived(this.draft);
      void this.#refresh();
    });

    root.querySelector('.js-sb-special-key')?.addEventListener('change', (ev) => {
      this.draft.specialKey = (ev.target as HTMLSelectElement).value || null;
    });

    root.querySelectorAll('.js-sb-skill-select').forEach((el) => {
      el.addEventListener('change', () => {
        readIdentity();
        const skill = (el as HTMLElement).dataset.skill as SummonSkillId;
        const checked = (el as HTMLInputElement).checked;
        const ratings = ownerSkillRatingsFromActor(this.actor);
        const mr = Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1));
        if (checked && !isSummonSkillEligible(ratings[skill] ?? 0, mr)) {
          (el as HTMLInputElement).checked = false;
          ui.notifications?.warn(`Owner skill too low. Needs MR × 2.`);
          return;
        }
        const set = new Set(this.draft.selectedSkills);
        if (checked) set.add(skill);
        else {
          set.delete(skill);
          delete this.draft.skillDiceAlloc[skill];
        }
        this.draft.selectedSkills = [...set] as SummonSkillId[];
        void this.#refresh();
      });
    });

    root.querySelectorAll('.js-sb-body-sense').forEach((el) => {
      el.addEventListener('change', (ev) => {
        const bi = Number((el as HTMLElement).dataset.body);
        const sense = (el as HTMLElement).dataset.sense as SharedSenseGroup;
        const checked = (el as HTMLInputElement).checked;
        if (checked && this.#remaining() < SUMMON_CAPS.sharedSenseTokenCost) {
          (ev.target as HTMLInputElement).checked = false;
          ui.notifications?.warn(`Shared Senses cost ${SUMMON_CAPS.sharedSenseTokenCost} Tokens.`);
          return;
        }
        const list = new Set(this.draft.spend.bodies[bi]?.sharedSenses || []);
        if (checked) list.add(sense);
        else list.delete(sense);
        this.draft.spend.bodies[bi].sharedSenses = [...list] as SharedSenseGroup[];
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        void this.#refresh();
      });
    });

    root.querySelectorAll('.js-sb-add-power').forEach((btn) => {
      btn.addEventListener('click', () => {
        const bi = Number((btn as HTMLElement).dataset.body);
        const sel = root.querySelector(`.js-sb-power-template[data-body="${bi}"]`) as HTMLSelectElement;
        const lvlEl = root.querySelector(`.js-sb-power-level[data-body="${bi}"]`) as HTMLSelectElement;
        const templateId = sel?.value;
        const rawLevel = parseInt(String(lvlEl?.value ?? ''), 10);
        const maxLvl = maxSummonPowerLevel(Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1)));
        const level = Number.isFinite(rawLevel) ? Math.max(1, Math.min(maxLvl, rawLevel)) : 1;
        if (!templateId) return;
        const ev = evaluateSummonPower(templateId, level, Math.max(1, Math.floor(Number((this.actor as any).system?.mastery?.rank) || 1)));
        if (!ev.legal) {
          ui.notifications?.warn(ev.reason);
          return;
        }
        if (ev.tokenCost > this.#remaining()) {
          ui.notifications?.warn(`Need ${ev.tokenCost} Tokens, ${this.#remaining()} left.`);
          return;
        }
        const body = this.draft.bodies[bi];
        if (!body) return;
        body.powers = [...(body.powers || []), { templateId, level, tokenCost: ev.tokenCost, category: ev.category }];
        this.ensureSpendBodies();
        this.draft = recomputeBondDerived(this.draft);
        void this.#refresh();
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
        void this.#refresh();
      });
    });

    root.querySelectorAll('.js-sb-add-stone').forEach((btn) => {
      btn.addEventListener('click', () => void this.#addStone((btn as HTMLElement).dataset.attr as StonePoolAttr));
    });
    root.querySelectorAll('.js-sb-remove-stone').forEach((btn) => {
      btn.addEventListener('click', () => void this.#removeStone(Number((btn as HTMLElement).dataset.index)));
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

  async #browseImage(onPick: (path: string) => void): Promise<void> {
    const FilePickerClass = getFilePickerClass();
    if (!FilePickerClass) {
      ui.notifications?.error('File picker is not available in this Foundry version.');
      return;
    }
    const current =
      this.mode === 'create' ? this.createImg : this.draft.img || '';
    const fp = new FilePickerClass({
      type: 'image',
      current: current || 'icons/',
      callback: (path: string) => {
        if (path) onPick(path);
      },
    });
    await fp.browse();
  }

  async #doCreate(): Promise<void> {
    this.createErrors = [];
    const result = await createSummonBondWithStones(this.actor, {
      name: this.createName,
      img: this.createImg,
      expression: this.createExpression,
      creatureType: this.createExpression,
      movementMode: normalizeMovementMode(this.createMode),
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
    await this.#refresh();
  }

  async #removeStone(index: number): Promise<void> {
    const res = await removeBoundStonesFromBond(this.actor, this.draft.id, [index]);
    if (!res.bond) {
      ui.notifications?.warn(res.errors[0] ?? 'Cannot remove stone.');
      return;
    }
    this.draft = structuredCloneBond(res.bond);
    await this.#refresh();
  }

  async #setBonus(n: number): Promise<void> {
    const updated = await setBondBonusTokens(this.actor, this.draft.id, n);
    if (updated) this.draft = structuredCloneBond(updated);
    await this.#refresh();
  }

  async #applyRitual(): Promise<void> {
    this.ritualErrors = [];
    this.ritualWarnings = [];
    const ctx = this.#spendCtx();
    this.draft.spend = sanitizeSpendNumbers(this.draft.spend);
    this.draft.bonusTokens = sanitizeBonusTokens(this.draft.bonusTokens, ctx.maxBonusTokens);
    const inspect = inspectBondSpend(this.draft.spend, ctx);
    if (inspect.illegal) {
      this.ritualErrors = inspect.reasons;
      await this.#refresh();
      ui.notifications?.warn(inspect.reasons[0] ?? 'Bond Ritual failed: illegal purchases.');
      return;
    }
    const ratings = ownerSkillRatingsFromActor(this.actor);
    const result = await applyBondRitual(this.actor, this.draft, ratings);
    if (!result.bond) {
      this.ritualErrors = result.errors;
      this.ritualWarnings = result.warnings;
      await this.#refresh();
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
    await this.#refresh();
  }

  async #dissolve(): Promise<void> {
    const confirmed =
      typeof (globalThis as any).foundry?.applications?.api?.DialogV2?.confirm === 'function'
        ? await (globalThis as any).foundry.applications.api.DialogV2.confirm({
            window: { title: 'Dissolve Summon Bond' },
            content: `<p>${DISSOLVE_BOND_CONFIRM}</p><p><strong>${this.draft.name}</strong></p>`,
          })
        : (globalThis as any).confirm?.(`${DISSOLVE_BOND_CONFIRM}\n\n${this.draft.name}`);
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
    await this.#refresh();
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
