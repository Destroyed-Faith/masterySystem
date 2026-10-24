/**
 * Combat Package Wizard — free first/second Passive selection from the 28 catalogue.
 */
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_PASSIVE_TEMPLATE_IDS,
  FINAL_PASSIVE_TEMPLATE_IDS,
} from '../src/utils/power-catalog.js';
import {
  deriveDefenseIdFromPassive1,
  getFirstPassiveIntentGroups,
  getGuidedPassiveSelectionGroups,
  getSecondPassiveIntentGroups,
  buildPackageGrantSpecs,
  WIZARD_STEP_ORDER,
  getVisibleWizardSteps,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import { passiveWizardChoiceLabel } from '../src/creation/tower-wizard/tower-wizard-passive-labels.js';
import {
  isAllowedFirstPassive,
  isAllowedSecondPassive,
} from '../src/creation/tower-wizard/tower-wizard-passive-categories.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';

describe('passiveWizardChoiceLabel', () => {
  it('strips exactly one Passive: prefix', () => {
    expect(passiveWizardChoiceLabel('Passive: Armor')).toBe('Armor');
    expect(passiveWizardChoiceLabel('Passive: Spell Resistance Piercing')).toBe(
      'Spell Resistance Piercing',
    );
    expect(passiveWizardChoiceLabel('Passive: Passive: Parry')).toBe('Passive: Parry');
    expect(passiveWizardChoiceLabel('Armor')).toBe('Armor');
  });
});

describe('Wizard free Passive selection', () => {
  it('step order starts at passive1 then passive2 (no identity / main-defense step)', () => {
    const p1 = WIZARD_STEP_ORDER.indexOf('passive1');
    expect(p1).toBe(0);
    expect(WIZARD_STEP_ORDER[p1 + 1]).toBe('passive2');
    expect(WIZARD_STEP_ORDER).not.toContain('defense');
    expect(WIZARD_STEP_ORDER).not.toContain('echo');
    const visible = getVisibleWizardSteps({
      passive1TemplateId: 'passive-killing-intent',
      defenseId: 'armor',
      activeBuffMode: 'defensive',
    });
    expect(visible[0]).toBe('passive1');
    expect(getVisibleWizardSteps({ skipIdentitySteps: true, activeBuffMode: 'defensive' })[0]).toBe('passive1');
  });

  it('Step 1 offers the full catalogue minus character-specific Echo gates', () => {
    expect(FINAL_PASSIVE_TEMPLATE_IDS).toHaveLength(28);
    const groups = getFirstPassiveIntentGroups();
    const ids = groups.flatMap((g) => g.passives.map((p) => p.id));
    // Thorns requires Green Warden — hidden without that sub-choice.
    expect(new Set(ids).size).toBe(27);
    expect(ids).not.toContain('passive-thornhide');
    for (const id of FINAL_PASSIVE_TEMPLATE_IDS) {
      if (id === 'passive-thornhide') continue;
      expect(ids).toContain(id);
    }
    expect(ids).toContain('passive-killing-intent');
    expect(ids).toContain('passive-speed');
    expect(ids).toContain('passive-special-amplification');

    const withGw = getFirstPassiveIntentGroups('unbound', 'bane-greenwarden');
    expect(withGw.flatMap((g) => g.passives.map((p) => p.id))).toHaveLength(28);
  });

  it('Step 1 permits non-defensive first Passives', () => {
    expect(isAllowedFirstPassive('passive-killing-intent')).toBe(true);
    expect(isAllowedFirstPassive('passive-speed')).toBe(true);
    expect(isAllowedFirstPassive('passive-critical')).toBe(true);
  });

  it('Step 1 and Step 2 share the same catalogue provider', () => {
    const first = getGuidedPassiveSelectionGroups({ markRecommended: true });
    const second = getGuidedPassiveSelectionGroups({
      excludeTemplateId: 'passive-fortified-frame',
    });
    expect(first.map((g) => g.intentLabel)).toEqual([
      'Offensive',
      'Defensive',
      'Utility & Mobility',
    ]);
    expect(second.map((g) => g.intentLabel)).toEqual(first.map((g) => g.intentLabel));
  });

  it('Step 2 excludes the already selected Passive and enforces categories', () => {
    const groups = getSecondPassiveIntentGroups(undefined, 'passive-killing-intent');
    const ids = groups.flatMap((g) => g.passives.map((p) => p.id));
    expect(ids).not.toContain('passive-killing-intent');
    expect(ids).toContain('passive-fortified-frame');
    expect(ids).toContain('passive-special-aura');
    expect(isAllowedSecondPassive('passive-special-aura', 'passive-killing-intent')).toBe(true);
    expect(isAllowedSecondPassive('passive-fortified-frame', 'passive-killing-intent')).toBe(true);
    expect(isAllowedSecondPassive('passive-deep-vitality', 'passive-fortitude')).toBe(false);
  });

  it('Passive: Thorns appears when Green Warden sub-choice is present', () => {
    const without = getFirstPassiveIntentGroups('unbound', null);
    expect(without.flatMap((g) => g.passives.map((p) => p.id))).not.toContain('passive-thornhide');

    const withGw = getFirstPassiveIntentGroups('unbound', 'bane-greenwarden');
    expect(withGw.flatMap((g) => g.passives.map((p) => p.id))).toContain('passive-thornhide');

    const step2 = getSecondPassiveIntentGroups(
      'armor',
      'passive-fortified-frame',
      'unbound',
      'bane-greenwarden',
    );
    expect(step2.flatMap((g) => g.passives.map((p) => p.id))).toContain('passive-thornhide');
  });

  it('choice cards use short names; powerName keeps canonical heading', () => {
    const groups = getFirstPassiveIntentGroups();
    const armor = groups.flatMap((g) => g.passives).find((p) => p.id === 'passive-fortified-frame');
    const pierce = groups
      .flatMap((g) => g.passives)
      .find((p) => p.id === 'passive-spell-resistance-piercing');
    expect(armor?.label).toBe('Armor');
    expect(armor?.powerName).toBe('Passive: Armor');
    expect(pierce?.label).toBe('Spell Resistance Piercing');
    expect(pierce?.label).not.toMatch(/^Passive:/);
    expect(groups.flatMap((g) => g.passives).every((p) => !/^Passive:\s*Passive:/i.test(p.label))).toBe(
      true,
    );
  });

  it('deriveDefenseIdFromPassive1 recommends axis without forcing Passive purchase', () => {
    expect(deriveDefenseIdFromPassive1('passive-evade')).toBe('evade');
    expect(deriveDefenseIdFromPassive1('passive-killing-intent')).toBe('armor');
    expect(deriveDefenseIdFromPassive1('passive-speed')).toBe('armor');
  });

  it('offensive first Passive does not inject a free Armor Passive into grants', () => {
    const selection: TowerWizardSelection = {
      defenseId: deriveDefenseIdFromPassive1('passive-killing-intent'),
      passive1TemplateId: 'passive-killing-intent',
      secondPassiveTemplateId: 'passive-temp-hp',
      activeBuffMode: 'defensive',
      offenseActivePicks: [
        { pickId: 'active-melee-weapon-single', templateId: 'active-melee-weapon-single' },
        {
          pickId: 'active-melee-damage-t4::lacerate',
          templateId: 'active-melee-damage-t4',
          special: 'lacerate',
        },
      ],
      delivery: 'melee',
      weakenSave: null,
    };
    const specs = buildPackageGrantSpecs(selection);
    const passives = specs.filter((s) =>
      CANONICAL_PASSIVE_TEMPLATE_IDS.has(s.templateId) || s.templateId.startsWith('passive-'),
    );
    const passiveIds = specs
      .map((s) => s.templateId)
      .filter((id) => id.startsWith('passive-') || id.startsWith('conditional-passive-'));
    expect(passiveIds).toEqual(['passive-killing-intent', 'passive-temp-hp']);
    expect(passiveIds).not.toContain('passive-fortified-frame');
    expect(specs.some((s) => s.templateId === 'ab-armor')).toBe(true);
    expect(passives).toHaveLength(2);
  });

  it('changing first Passive invalidates incompatible second (category)', () => {
    expect(isAllowedSecondPassive('passive-temp-hp', 'passive-fortified-frame')).toBe(true);
    expect(isAllowedSecondPassive('passive-temp-hp', 'passive-temp-hp')).toBe(false);
    expect(isAllowedSecondPassive('passive-fortified-frame', 'passive-evade')).toBe(true);
    expect(isAllowedSecondPassive('passive-deep-vitality', 'passive-fortitude')).toBe(false);
  });
});
