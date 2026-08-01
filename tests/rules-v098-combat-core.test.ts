import { describe, expect, it } from 'vitest';
import { BASE_SPEED_M, attributeCheckTn } from '../src/utils/constants';
import { findTemplateById } from '../src/utils/power-catalog';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import { SKILL_CATEGORIES } from '../src/utils/skills';

describe('Rules v0.9.8 combat core constants', () => {
  it('base speed is 8 m', () => {
    expect(BASE_SPEED_M).toBe(8);
  });

  it('Attribute Check TN = 8 × source MR', () => {
    expect(attributeCheckTn(1)).toBe(8);
    expect(attributeCheckTn(3)).toBe(24);
    expect(attributeCheckTn(5)).toBe(40);
  });

  it('Perception category label is not Awareness', () => {
    expect(SKILL_CATEGORIES.AWARENESS).toBe('Perception');
  });
});

describe('Rules v0.9.8 catalog alignment samples', () => {
  it('removes Awareness / Heightened Senses passives from catalog', () => {
    const ids = new Set(PASSIVE_TEMPLATES.map((t) => t.templateId));
    expect(ids.has('passive-heightened-senses')).toBe(false);
    expect(ids.has('passive-awareness-evade')).toBe(false);
    expect(ids.has('passive-awareness-damage')).toBe(false);
  });

  it('Active Buff Armor uses +5 / +9 / +65 curve', () => {
    const ab = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-armor');
    expect(ab).toBeTruthy();
    const levels = ab!.levels as Record<string, any>;
    expect(levels['1']?.mechanics?.armor).toBe(5);
    expect(levels['16']?.mechanics?.armor).toBe(65);
  });

  it('Active Buff Critical milestones remain closed-subsystem', () => {
    const crit = findTemplateById('ab-critical') || ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-critical');
    expect(crit).toBeTruthy();
    const levels = crit!.levels as Record<string, any>;
    expect(levels['3']?.mechanics?.critical).toBeUndefined();
    expect(levels['4']?.mechanics?.critical).toBe(1);
    expect(levels['8']?.mechanics?.critical).toBe(2);
    expect(levels['16']?.mechanics?.critical).toBe(4);
  });

  it('Summon Armor Aura uses banded radii 8/16/24/32', () => {
    const aura = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-summon-armor-aura');
    expect(aura).toBeTruthy();
    const levels = aura!.levels as Record<string, any>;
    expect(String(levels['1']?.effect?.text || '')).toMatch(/8 m/);
    expect(String(levels['5']?.effect?.text || '')).toMatch(/16 m/);
    expect(String(levels['16']?.effect?.text || '')).toMatch(/32 m/);
  });
});
