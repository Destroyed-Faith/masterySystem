import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const rolls: Array<{ options: any }> = [];
let nextTotals: number[] = [];

vi.mock('../src/dice/roll-handler.js', () => ({
  masteryRoll: async (options: any) => {
    rolls.push({ options });
    const total = nextTotals.shift() ?? 10;
    const dice = Array.from({ length: Math.max(1, options.numDice) }, (_, i) => (i === 0 ? total : 1));
    return {
      total,
      dice,
      kept: [total],
      keptIndices: [0],
      dieChains: dice.map((d) => [d]),
      skill: 0,
      tn: 0,
      raises: 0,
      success: true,
      exploded: [],
      flavor: options.flavor,
    };
  },
  showMasteryRollDice3d: async () => undefined,
}));

const economy = { available: 1, consumed: 0, refunded: 0 };
vi.mock('../src/combat/action-economy.js', () => ({
  getActionEconomyActor: (a: any) => a,
  getAvailableAttackActions: () => economy.available,
  consumeAttackAction: async () => {
    if (economy.available <= 0) return false;
    economy.available -= 1;
    economy.consumed += 1;
    return true;
  },
  refundAttackAction: async () => {
    economy.available += 1;
    economy.refunded += 1;
  },
}));

import { COMBAT_MANEUVERS, getAvailableManeuvers, getManeuverById } from '../src/system/combat-maneuvers.js';
import { GRAPPLE_MANEUVER_IDS, RADIAL_ATTACK_MANEUVER_IDS } from '../src/radial-menu/options.js';
import { answerAttributeContest, startAttributeContest, ATTRIBUTE_CONTEST_FLAG } from '../src/contests/contest-card.js';
import { readGrappleState, grappleRoleOf } from '../src/combat/grapple-state.js';
import { hasActiveSpecial } from '../src/system/active-specials.js';
import { describeActiveWeaponProfile } from '../src/utils/weapon-sets.js';
import { basicAttackMrDamageFormula } from '../src/combat/basic-combat.js';

function applyDotted(target: any, patch: Record<string, unknown>) {
  for (const [k, v] of Object.entries(patch)) {
    const parts = k.split('.');
    let obj = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i]!;
      if (obj[key] == null || typeof obj[key] !== 'object') obj[key] = {};
      obj = obj[key];
    }
    const last = parts[parts.length - 1]!;
    if (last.startsWith('-=')) delete obj[last.slice(2)];
    else obj[last] = v;
  }
}

function mockActor(id: string, name: string, attrs: Record<string, number>, rank = 2) {
  const attributes: Record<string, { value: number }> = {};
  for (const [k, v] of Object.entries(attrs)) attributes[k] = { value: v };
  const actor: any = {
    id,
    uuid: `Actor.${id}`,
    name,
    type: 'character',
    items: [],
    system: {
      attributes,
      mastery: { rank },
      statusEffects: [] as unknown[],
      health: { value: 30, max: 30 },
      combat: { speed: 8 },
    },
    flags: { 'mastery-system': {} as Record<string, unknown> },
    getFlag(ns: string, key: string) {
      return actor.flags[ns]?.[key];
    },
    update: async (patch: Record<string, unknown>) => applyDotted(actor, patch),
  };
  return actor;
}

const g = globalThis as any;
const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('Grapple combat maneuver definition', () => {
  const grapple = getManeuverById('grapple')!;

  it('is an attack-slot maneuver (costs 1 Attack Action) resolved as an Opposed Attribute Contest', () => {
    expect(grapple.slot).toBe('attack');
    expect(grapple.effect).toMatch(/1 Attack Action/);
    expect(grapple.effect).toMatch(/Melee Reach/);
    expect(grapple.effect).toMatch(/Opposed Attribute Contest/);
    expect(grapple.effect).toMatch(/Might or Agility/);
    expect(grapple.effect).toMatch(/No TN, no Raises, no Skill Points/);
    expect(grapple.effect).toMatch(/tie leaves the target free/i);
    expect(grapple.effect).toMatch(/both creatures are Grappled/i);
  });

  it('deals no damage, is not Root and does not touch Evade / Armor / pools / Specials', () => {
    expect(grapple.effect).toMatch(/no damage/i);
    expect(grapple.effect).toMatch(/not Root/);
    expect(grapple.effect).toMatch(/Unarmed Basic Attack/);
    expect(grapple.effect).not.toMatch(/Mastery Rank damage|ignores Armor|Pressure/i);
    expect(grapple.effect).toMatch(/does not change Evade, Armor, Attack Pools or Specials/);
  });

  it('describes Surprise Grapple as initial-contest only', () => {
    expect(grapple.effect).toMatch(/Surprise Grapple/);
    expect(grapple.effect).toMatch(/Advantage/);
    expect(grapple.effect).toMatch(/Disadvantage/);
    expect(grapple.effect).toMatch(/initial contest/);
  });

  it('escape and release exist as situational maneuvers', () => {
    const escape = getManeuverById('grapple-escape')!;
    const release = getManeuverById('grapple-release')!;
    expect(escape.slot).toBe('attack');
    expect(escape.requirements?.requiresGrappleRole).toBe('held');
    expect(escape.effect).toMatch(/1 Attack Action/);
    expect(escape.effect).toMatch(/tie, the Grapple remains/);
    expect(release.requirements?.requiresGrappleRole).toBe('grappler');
    expect(release.effect).toMatch(/Costs nothing/);
    expect(grapple.requirements?.requiresNotGrappling).toBe(true);
  });

  it('no maneuver in the catalog still grants automatic Mastery Rank damage for grappling', () => {
    for (const m of COMBAT_MANEUVERS) {
      expect(`${m.description} ${m.effect ?? ''}`).not.toMatch(/Mastery Rank damage once per Round|Pressure:/i);
    }
  });

  it('radial attack segment exposes the Grapple family next to Basic Attack', () => {
    expect(RADIAL_ATTACK_MANEUVER_IDS).toContain('grapple');
    expect(RADIAL_ATTACK_MANEUVER_IDS).toContain('grapple-escape');
    expect(RADIAL_ATTACK_MANEUVER_IDS).toContain('grapple-release');
    expect(GRAPPLE_MANEUVER_IDS).toEqual(['grapple', 'grapple-escape', 'grapple-release']);
  });
});

describe('Grapple maneuver availability by state', () => {
  it('free actor: Grapple yes, Escape / Release no', () => {
    const a = mockActor('a', 'A', { might: 5 });
    const ids = getAvailableManeuvers(a).map((m) => m.id);
    expect(ids).toContain('grapple');
    expect(ids).not.toContain('grapple-escape');
    expect(ids).not.toContain('grapple-release');
  });

  it('held creature: Escape yes, Grapple / Release no', () => {
    const a = mockActor('a', 'A', { might: 5 });
    a.flags['mastery-system'].grapple = { role: 'held', partnerActorId: 'b', partnerName: 'B' };
    const ids = getAvailableManeuvers(a).map((m) => m.id);
    expect(ids).toContain('grapple-escape');
    expect(ids).not.toContain('grapple');
    expect(ids).not.toContain('grapple-release');
  });

  it('grappler: Release yes, Grapple / Escape no; Basic Attack stays available', () => {
    const a = mockActor('a', 'A', { might: 5 });
    a.flags['mastery-system'].grapple = { role: 'grappler', partnerActorId: 'b', partnerName: 'B' };
    const ids = getAvailableManeuvers(a).map((m) => m.id);
    expect(ids).toContain('grapple-release');
    expect(ids).not.toContain('grapple');
    expect(ids).not.toContain('grapple-escape');
    // The unarmed Basic Attack is the existing weapon-set profile, untouched by Grapple.
    const profile = describeActiveWeaponProfile(a);
    expect(profile.unarmed).toBe(true);
    expect(profile.summary).toMatch(/1d8 \+ MR × 2d8/);
    expect(basicAttackMrDamageFormula(a)).toBe('4d8');
  });
});

describe('Grapple contest flow (mocked dice + action economy)', () => {
  let bjorn: any;
  let wolf: any;
  let messages: any[];

  beforeEach(() => {
    rolls.length = 0;
    nextTotals = [];
    economy.available = 1;
    economy.consumed = 0;
    economy.refunded = 0;
    bjorn = mockActor('a1', 'Bjorn', { might: 6, agility: 4 }, 2);
    wolf = mockActor('n1', 'Wolf', { might: 5, agility: 5 }, 2);
    messages = [];
    const actors = new Map<string, any>([
      ['a1', bjorn],
      ['n1', wolf],
    ]);
    g.game = {
      user: { id: 'gm', isGM: true },
      actors: { get: (id: string) => actors.get(id) },
      combat: { id: 'c1', round: 1 },
      messages: { get: (id: string) => messages.find((m) => m.id === id) },
    };
    g.canvas = undefined;
    g.fromUuid = undefined;
    g.ChatMessage = {
      getSpeaker: () => ({}),
      create: async (data: any) => {
        const msg: any = {
          id: `m${messages.length + 1}`,
          ...data,
          author: { id: 'gm' },
          update: async (patch: any) => {
            Object.assign(msg, patch);
          },
        };
        messages.push(msg);
        return msg;
      },
    };
  });

  afterEach(() => {
    delete g.game;
    delete g.canvas;
    delete g.fromUuid;
    delete g.ChatMessage;
  });

  it('starting a Grapple spends exactly 1 Attack Action and rolls the initiator with no skill / TN', async () => {
    nextTotals = [17];
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      costsAttackAction: true,
    });
    expect(msg).toBeTruthy();
    expect(economy.consumed).toBe(1);
    expect(rolls).toHaveLength(1);
    const o = rolls[0].options;
    expect(o.numDice).toBe(6);
    expect(o.keepDice).toBe(2);
    expect(o.skillKey).toBeUndefined();
    expect(o.isSkillRoll).toBe(false);
    expect(o.tn).toBe(0);
    expect(o.declaredRaiseSlots).toBe(0);
    expect(o.rollKind).toBe('generic');
    const state = msg.flags['mastery-system'][ATTRIBUTE_CONTEST_FLAG];
    expect(state.resolved).toBe(false);
    expect(state.attackActionSpent).toBe(true);
    expect(state.opponent.choices).toEqual(['might', 'agility']);
    expect(msg.content).toContain('data-action="ms-contest-answer"');
  });

  it('refuses to start a Grapple without an Attack Action', async () => {
    economy.available = 0;
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      costsAttackAction: true,
    });
    expect(msg).toBeNull();
    expect(rolls).toHaveLength(0);
    expect(messages).toHaveLength(0);
  });

  it('non-combat contests never spend an Attack Action and offer every Attribute', async () => {
    nextTotals = [9];
    const msg = await startAttributeContest({
      context: 'general',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'influence',
      costsAttackAction: false,
    });
    expect(msg).toBeTruthy();
    expect(economy.consumed).toBe(0);
    expect(msg.flags['mastery-system'][ATTRIBUTE_CONTEST_FLAG].opponent.choices).toHaveLength(7);
  });

  it('won Grapple: both Grappled, no damage, no Root; the opponent chose its own Attribute', async () => {
    nextTotals = [17, 12];
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      costsAttackAction: true,
    });
    const ok = await answerAttributeContest(msg.id, 'agility');
    expect(ok).toBe(true);
    expect(rolls).toHaveLength(2);
    expect(rolls[1].options.poolAttribute).toBe('agility');
    expect(rolls[1].options.numDice).toBe(5);
    expect(rolls[1].options.skillKey).toBeUndefined();
    const state = msg.flags['mastery-system'][ATTRIBUTE_CONTEST_FLAG];
    expect(state.resolved).toBe(true);
    expect(state.outcome).toBe('initiator');
    expect(grappleRoleOf(bjorn)).toBe('grappler');
    expect(grappleRoleOf(wolf)).toBe('held');
    expect(hasActiveSpecial(bjorn, 'grappled')).toBe(true);
    expect(hasActiveSpecial(wolf, 'grappled')).toBe(true);
    expect(hasActiveSpecial(wolf, 'root')).toBe(false);
    expect(wolf.system.health.value).toBe(30);
    expect(bjorn.system.health.value).toBe(30);
    expect(msg.content).toContain('Bjorn wins the contest.');
    expect(msg.content).toMatch(/Unarmed Basic Attack/);
    // Second answer is ignored — the card is already resolved.
    expect(await answerAttributeContest(msg.id, 'might')).toBe(false);
    expect(rolls).toHaveLength(2);
  });

  it('tie: target remains free, action stays spent', async () => {
    nextTotals = [14, 14];
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      costsAttackAction: true,
    });
    await answerAttributeContest(msg.id, 'might');
    const state = msg.flags['mastery-system'][ATTRIBUTE_CONTEST_FLAG];
    expect(state.outcome).toBe('tie');
    expect(readGrappleState(bjorn)).toBeNull();
    expect(readGrappleState(wolf)).toBeNull();
    expect(msg.content).toContain('Wolf remains free.');
    expect(economy.consumed).toBe(1);
  });

  it('Surprise Grapple: initiator Advantage, target Disadvantage — only on the initial contest', async () => {
    nextTotals = [20, 8];
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      targetUnaware: true,
      costsAttackAction: true,
    });
    expect(rolls[0].options.rollAdvantage).toBe(true);
    await answerAttributeContest(msg.id, 'might');
    expect(rolls[1].options.rollDisadvantage).toBe(true);
    expect(grappleRoleOf(wolf)).toBe('held');
    // Neither actor carries a permanent advantage / disadvantage.
    expect(hasActiveSpecial(bjorn, 'advantage')).toBe(false);
    expect(hasActiveSpecial(wolf, 'advantage')).toBe(false);

    // Escape contest afterwards: no surprise modifiers at all.
    economy.available = 1;
    nextTotals = [15, 16];
    const esc = await startAttributeContest({
      context: 'grapple-escape',
      initiatorActor: wolf,
      opponentActor: bjorn,
      attributeKey: 'agility',
      targetUnaware: true,
      costsAttackAction: true,
    });
    expect(rolls[2].options.rollAdvantage).toBeUndefined();
    await answerAttributeContest(esc.id, 'might');
    expect(rolls[3].options.rollDisadvantage).toBeUndefined();
    // 15 < 16: escape fails, grapple remains.
    expect(grappleRoleOf(wolf)).toBe('held');
    expect(esc.content).toContain('The Grapple remains.');
  });

  it('escape: the held creature spends 1 Attack Action; a win ends the Grapple for both', async () => {
    nextTotals = [17, 12];
    const msg = await startAttributeContest({
      context: 'grapple',
      initiatorActor: bjorn,
      opponentActor: wolf,
      attributeKey: 'might',
      costsAttackAction: true,
    });
    await answerAttributeContest(msg.id, 'might');
    expect(grappleRoleOf(wolf)).toBe('held');

    economy.available = 1;
    economy.consumed = 0;
    nextTotals = [19, 11];
    const esc = await startAttributeContest({
      context: 'grapple-escape',
      initiatorActor: wolf,
      opponentActor: bjorn,
      attributeKey: 'agility',
      costsAttackAction: true,
    });
    expect(economy.consumed).toBe(1);
    await answerAttributeContest(esc.id, 'might');
    expect(readGrappleState(wolf)).toBeNull();
    expect(readGrappleState(bjorn)).toBeNull();
    expect(hasActiveSpecial(bjorn, 'grappled')).toBe(false);
    expect(hasActiveSpecial(wolf, 'grappled')).toBe(false);
    expect(esc.content).toMatch(/breaks free/);
  });
});

describe('Grapple never carries an attack payload (source contract)', () => {
  it('Grapple resolution modules contain no damage roll, weapon or Special application', () => {
    for (const file of [
      'src/contests/opposed-attribute-contest.ts',
      'src/contests/contest-card.ts',
      'src/combat/grapple-state.ts',
      'src/combat/grapple-actions.ts',
    ]) {
      const text = src(file);
      expect(text, file).not.toMatch(/damage-dialog|createMeleeAttackCard|createRangedAttackCard|applyDamage|weaponDamage|new Roll\(/);
      expect(text, file).not.toMatch(/setActorCatalogStatus\([^)]*'root'/);
      expect(text, file).not.toMatch(/Mastery Rank damage|ignores Armor/i);
    }
  });

  it('the radial routes Grapple to the contest card and gates weapon attacks for a grappler', () => {
    const selector = src('src/token-action-selector.ts');
    expect(selector).toMatch(/maneuver\?\.id === 'grapple'[\s\S]*beginGrappleContest/);
    expect(selector).toMatch(/attackRequiresGrappleRelease/);
    expect(selector).toMatch(/confirmReleaseGrappleForWeaponAttack/);
    expect(selector).toMatch(/'grapple-escape'[\s\S]*beginGrappleEscape/);
    expect(selector).toMatch(/'grapple-release'[\s\S]*releaseGrappleAction/);
  });

  it('the rules text no longer grants Pressure damage', () => {
    const guide = src('docs/Rules/players-guide.md');
    expect(guide).not.toMatch(/\*\*Pressure:\*\*/);
    expect(guide).toMatch(/### Opposed Attribute Contests/);
    expect(guide).toMatch(/Grapple never deals damage/);
    expect(guide).toMatch(/Surprise Grapple/);
  });
});
