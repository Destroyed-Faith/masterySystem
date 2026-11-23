/**
 * Actives v0.9.9.6: there is no automatic Basic Attack. Grapple and the other
 * Basic Maneuvers stay; Unarmed delivery runs through Melee Attack Powers.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { getAllCombatOptionsForActor } from '../src/radial-menu/options.js';
import { COMBAT_MANEUVERS } from '../src/system/combat-maneuvers.js';
import { RADIAL_STANDARD_MANEUVER_IDS } from '../src/utils/radial-maneuver-prefs.js';
import { attackRequiresGrappleRelease } from '../src/combat/grapple-state.js';
import { evaluateReactionEligibility } from '../src/combat/reaction-eligibility.js';
import * as basicCombat from '../src/combat/basic-combat.js';

function installFoundry(): void {
  const g = globalThis as any;
  g.game = {
    user: { id: 'gm', isGM: true },
    combat: null,
    actors: { get: () => null },
    messages: { get: () => null },
    settings: { get: () => undefined },
    i18n: { localize: (k: string) => k, format: (k: string) => k },
  };
  g.Hooks = { callAll: () => undefined, on: () => undefined, off: () => undefined };
  g.ui = { notifications: { warn: () => undefined, info: () => undefined } };
  g.canvas = { ready: false };
}

function bareCharacter(items: any[] = []): any {
  return {
    id: 'pc1',
    name: 'Bjorn',
    type: 'character',
    system: { mastery: { rank: 2 }, attributes: { might: { value: 4 } } },
    items,
    flags: { 'mastery-system': {} },
    getFlag: () => undefined,
  };
}

describe('Actives v0.9.9.6 — no Basic Attack', () => {
  beforeEach(installFoundry);

  it('the radial of a character without Attack Powers offers no weapon attack', async () => {
    const options = await getAllCombatOptionsForActor(bareCharacter());
    const ids = options.map((o) => o.id);
    expect(ids).not.toContain('weapon-attack');
    expect(options.some((o) => /basic attack/i.test(o.name))).toBe(false);
    expect(ids).toContain('grapple');
  });

  it('Grapple and the other Basic Maneuvers stay; Basic Attack is gone from the catalog and prefs', () => {
    const ids = new Set(COMBAT_MANEUVERS.map((m) => m.id));
    for (const id of ['grapple', 'grapple-escape', 'grapple-release', 'guard', 'dive-for-cover']) {
      expect(ids.has(id)).toBe(true);
    }
    expect(ids.has('weapon-attack')).toBe(false);
    expect(RADIAL_STANDARD_MANEUVER_IDS).not.toContain('weapon-attack');
    expect((basicCombat as any).basicAttackMrDamageFormula).toBeUndefined();
  });

  it('Counterattack and Opportunity Attack are retired, not offered', () => {
    for (const id of ['counterattack', 'opportunity-attack']) {
      const m = COMBAT_MANEUVERS.find((x) => x.id === id);
      if (m) expect(m.tags).toContain('retired');
    }
    const counter = { basicReaction: 'counterattack', id: 'basic-reaction-counterattack' };
    const r = evaluateReactionEligibility(counter, {
      phase: 'defender',
      hit: true,
      rangeToAttackerM: 1,
    } as any);
    expect(r.shown).toBe(false);
  });

  it('an unarmed Melee Attack Power keeps the Grapple; a drawn weapon does not', () => {
    const grappler: any = bareCharacter();
    grappler.flags['mastery-system'].grapple = { role: 'grappler', partnerActorId: 'n1', partnerName: 'Wolf' };
    grappler.getFlag = (_ns: string, key: string) => grappler.flags['mastery-system'][key];
    const melee = {
      id: 'p1',
      slot: 'attack',
      source: 'power',
      item: { system: { powerType: 'active', isSpell: false, templateId: 'active-melee-instant-special-t3' } },
    };
    expect(attackRequiresGrappleRelease(grappler, melee as any, { unarmedNow: true })).toBe(false);
    expect(attackRequiresGrappleRelease(grappler, melee as any, { unarmedNow: false })).toBe(true);
  });
});
