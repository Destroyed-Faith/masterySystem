/**
 * Stepped Autofire — attack slots, repeats, stepped TN, one shared roll.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  AUTOFIRE_CHAIN_LINK_M,
  autofireDamageFlags,
  autofireRequiredTn,
  autofireSlotTnSurcharge,
  evaluateAutofireChain,
  isAutofireSlotLegal,
} from '../src/combat/autofire-stepped';
import * as autofireModule from '../src/combat/autofire-stepped';
import { martialWeaponDamageApplies, isInstantAoeFlags } from '../src/combat/damage-transfer';
import { toSharedAoeDamagePayload } from '../src/combat/aoe-melee-resolution';
import { ACTIVE_TEMPLATES, AUTOFIRE_PROG } from '../src/utils/powers/templates/actives';

const ROOT = join(__dirname, '..');

function autofireLevels(): any[] {
  const tpl: any = ACTIVE_TEMPLATES.find((t: any) => t.templateId === 'active-ranged-weapon-autofire');
  expect(tpl).toBeTruthy();
  const levels = tpl.levels;
  return Array.isArray(levels) ? levels : Object.values(levels);
}

describe('Stepped Autofire — slot validation', () => {
  it('allows the same target in multiple slots', () => {
    const chain = ['A'];
    for (let i = 0; i < 4; i++) {
      expect(
        isAutofireSlotLegal({
          slotCount: chain.length,
          capacity: 9,
          previousTargetId: chain[chain.length - 1]!,
          candidateId: 'A',
        }),
      ).toBe(true);
      chain.push('A');
    }
    expect(chain).toEqual(['A', 'A', 'A', 'A', 'A']);
  });

  it('enforces capacity', () => {
    expect(
      isAutofireSlotLegal({ slotCount: 2, capacity: 2, previousTargetId: 'A', candidateId: 'A' }),
    ).toBe(false);
  });

  it('enforces the 4 m link; same target is always valid', () => {
    expect(AUTOFIRE_CHAIN_LINK_M).toBe(4);
    const base = { slotCount: 1, capacity: 5, previousTargetId: 'A' };
    expect(isAutofireSlotLegal({ ...base, candidateId: 'B', distanceFromPreviousM: 4 })).toBe(true);
    expect(isAutofireSlotLegal({ ...base, candidateId: 'B', distanceFromPreviousM: 4.5 })).toBe(false);
    expect(isAutofireSlotLegal({ ...base, candidateId: 'A', distanceFromPreviousM: 99 })).toBe(true);
    expect(isAutofireSlotLegal({ ...base, candidateId: 'A' })).toBe(true);
  });

  it('the first slot has no link requirement', () => {
    expect(
      isAutofireSlotLegal({ slotCount: 0, capacity: 2, previousTargetId: null, candidateId: 'A' }),
    ).toBe(true);
  });
});

describe('Stepped Autofire — progression unchanged', () => {
  it('capacity and dice for PL1–16 match AUTOFIRE_PROG', () => {
    const levels = autofireLevels();
    expect(levels.length).toBe(16);
    expect(AUTOFIRE_PROG.length).toBe(16);
    AUTOFIRE_PROG.forEach((p, i) => {
      const row = levels[i];
      expect(row.mechanics.autofire.extraTargets).toBe(p.extra);
      expect(row.aoe.targets).toBe(1 + p.extra);
      if (p.dice === 0) {
        expect(row.effect.dice).toBeUndefined();
      } else {
        expect(row.effect.dice).toBe(`+${p.dice}d8`);
      }
    });
  });

  it('keeps the printed endpoints (PL1 cap 2 / 0d8 … PL16 cap 9 / 11d8)', () => {
    expect(1 + AUTOFIRE_PROG[0]!.extra).toBe(2);
    expect(AUTOFIRE_PROG[0]!.dice).toBe(0);
    expect(1 + AUTOFIRE_PROG[15]!.extra).toBe(9);
    expect(AUTOFIRE_PROG[15]!.dice).toBe(11);
    // Capacity table 2..9
    const caps = AUTOFIRE_PROG.map((p) => 1 + p.extra);
    expect(Math.min(...caps)).toBe(2);
    expect(Math.max(...caps)).toBe(9);
  });

  it('effect text describes slots, repeats and the shared damage roll', () => {
    const text = String(autofireLevels()[7].effect.text);
    expect(text).toMatch(/attack slots/);
    expect(text).toMatch(/same creature may repeat/);
    expect(text).toMatch(/shared Damage Roll/);
  });
});

describe('Stepped Autofire — TN', () => {
  it('slot surcharge is 4 × index', () => {
    expect([0, 1, 2, 3].map(autofireSlotTnSurcharge)).toEqual([0, 4, 8, 12]);
  });

  it('TN progression 10 / 14 / 18 for defense 10', () => {
    const tns = [0, 1, 2].map((i) => autofireRequiredTn({ defense: 10, slotIndex0Based: i }));
    expect(tns).toEqual([10, 14, 18]);
  });

  it('different defenses change TNs', () => {
    const defs = [10, 15, 8];
    const tns = defs.map((d, i) => autofireRequiredTn({ defense: d, slotIndex0Based: i }));
    expect(tns).toEqual([10, 19, 16]);
  });

  it('Paid Raises add +4 to every slot', () => {
    const tns = [0, 1, 2].map((i) =>
      autofireRequiredTn({ defense: 10, slotIndex0Based: i, paidRaises: 2 }),
    );
    expect(tns).toEqual([18, 22, 26]);
  });

  it('Autofire surcharge is not a Raise (Raises only come from paidRaises)', () => {
    const noRaise = autofireRequiredTn({ defense: 10, slotIndex0Based: 3, paidRaises: 0 });
    const oneRaise = autofireRequiredTn({ defense: 10, slotIndex0Based: 3, paidRaises: 1 });
    expect(noRaise).toBe(22);
    expect(oneRaise - noRaise).toBe(4);
    // The surcharge never produces a Raise count: evaluation reports it separately.
    const ev = evaluateAutofireChain({
      attackTotal: 100,
      slots: [{ defense: 10 }, { defense: 10 }, { defense: 10 }],
      paidRaises: 0,
    });
    expect(ev.slots.map((s) => s.surcharge)).toEqual([0, 4, 8]);
    expect(ev.slots.every((s) => s.requiredTn === s.defense + s.surcharge)).toBe(true);
  });
});

describe('Stepped Autofire — chain evaluation', () => {
  const same = [{ defense: 10 }, { defense: 10 }, { defense: 10 }]; // TN 10 / 14 / 18

  it('roll 9 → 0 hits', () => {
    const ev = evaluateAutofireChain({ attackTotal: 9, slots: same });
    expect(ev.hits).toBe(0);
    expect(ev.endedAtSlot).toBe(0);
  });

  it('roll 16 → 2 hits', () => {
    const ev = evaluateAutofireChain({ attackTotal: 16, slots: same });
    expect(ev.hits).toBe(2);
    expect(ev.endedAtSlot).toBe(2);
  });

  it('roll 18 → 3 hits', () => {
    const ev = evaluateAutofireChain({ attackTotal: 18, slots: same });
    expect(ev.hits).toBe(3);
    expect(ev.endedAtSlot).toBeNull();
  });

  it('first fail stops the chain; prior hits kept; later slots unchecked', () => {
    // TN 10 / 30 / 14: slot 2 fails at 20, slot 3 would pass but is never checked.
    const ev = evaluateAutofireChain({
      attackTotal: 20,
      slots: [{ defense: 10 }, { defense: 26 }, { defense: 6 }],
    });
    expect(ev.slots.map((s) => s.hit)).toEqual([true, false]);
    expect(ev.hits).toBe(1);
    expect(ev.slots).toHaveLength(2);
  });

  it('repeated target uses separate stepped TNs (slots are not deduped)', () => {
    const ev = evaluateAutofireChain({
      attackTotal: 18,
      slots: [{ defense: 10 }, { defense: 10 }, { defense: 10 }],
    });
    expect(ev.slots.map((s) => s.requiredTn)).toEqual([10, 14, 18]);
    expect(ev.hits).toBe(3);
  });

  it('Paid Raises shift the chain', () => {
    const ev = evaluateAutofireChain({ attackTotal: 21, slots: same, paidRaises: 1 }); // 14 / 18 / 22
    expect(ev.slots.map((s) => s.requiredTn)).toEqual([14, 18, 22]);
    expect(ev.hits).toBe(2);
  });
});

describe('Stepped Autofire — damage', () => {
  it('martial weapon damage applies for Autofire flags (not Instant AoE)', () => {
    const flags = autofireDamageFlags({ autofire: true, attackType: 'ranged' });
    expect(flags.autofire).toBe(true);
    expect(isInstantAoeFlags(flags)).toBe(false);
    expect(martialWeaponDamageApplies(flags)).toBe(true);
    expect(martialWeaponDamageApplies({ autofire: true } as any)).toBe(true);
  });

  it('strips accidental Instant AoE flags but never sets them', () => {
    const flags = autofireDamageFlags({ aoeMeleeWeapon: true, instantAoe: true });
    expect('aoeMeleeWeapon' in flags).toBe(false);
    expect('instantAoe' in flags).toBe(false);
    expect(martialWeaponDamageApplies(flags)).toBe(true);
  });

  it('Spell Autofire does not use weapon damage', () => {
    expect(martialWeaponDamageApplies({ powerIsSpell: true })).toBe(false);
  });

  it('one shared payload is reused for every slot, repeated creature included', () => {
    const shared = toSharedAoeDamagePayload({ totalDamage: 17, count8s: 1, specialsUsed: [] })!;
    const hits = ['A', 'A', 'B'].map((id) => ({ id, ...shared }));
    expect(hits.map((h) => h.totalDamage)).toEqual([17, 17, 17]);
    expect(hits).toHaveLength(3); // no dedupe by token id
    // Autofire never stamps a "specials already applied" token id on the payload.
    expect(shared.specialsAppliedToTargetId).toBeUndefined();
  });

  it('exports the public helpers', () => {
    expect(typeof autofireModule.autofireSlotTnSurcharge).toBe('function');
    expect(typeof autofireModule.autofireRequiredTn).toBe('function');
  });
});

describe('Stepped Autofire — docs and journals', () => {
  it('Players Guide and actives rules describe the stepped chain', () => {
    const pg = readFileSync(join(ROOT, 'docs/Rules/players-guide.md'), 'utf8');
    expect(pg).toMatch(/Stepped/i);
    const actives = readFileSync(join(ROOT, 'docs/Rules/actives.md'), 'utf8');
    expect(actives).toMatch(/Stepped Attack Chain/);
    expect(actives).toMatch(/4 × \(i − 1\)/);
    expect(actives).not.toMatch(/cannot appear more than once in the same Autofire chain/);
  });

  it('rules-core journals mention Stepped Autofire after build', () => {
    const dir = join(ROOT, 'src/packs/rules-core');
    if (!existsSync(dir)) return;
    const blob = readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    expect(blob).toMatch(/Stepped/i);
  });
});
