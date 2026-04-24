/**
 * Dragon Trees Echo-Gating tests.
 *
 * Covers:
 *  - Warden Dragon, Raptor Dragon, and Sky Tyrant register the expected
 *    power counts and category distributions.
 *  - Every power in those trees carries requiresEcho: ['dragonborn'].
 *  - filterCatalog hides echo-gated entries unless actorEchoKey matches.
 */

import { describe, it, expect } from 'vitest';
import { WARDEN_DRAGON_POWERS } from '../src/utils/powers/warden-dragon';
import { RAPTOR_DRAGON_POWERS } from '../src/utils/powers/raptor-dragon';
import { SKY_TYRANT_POWERS } from '../src/utils/powers/sky-tyrant';
import { filterCatalog } from '../src/utils/power-catalog';

const DRAGON_POWER_NAMES = new Set<string>([
    ...WARDEN_DRAGON_POWERS.map(p => p.name),
    ...RAPTOR_DRAGON_POWERS.map(p => p.name),
    ...SKY_TYRANT_POWERS.map(p => p.name)
]);

const DRAGON_TOTAL =
    WARDEN_DRAGON_POWERS.length +
    RAPTOR_DRAGON_POWERS.length +
    SKY_TYRANT_POWERS.length;

function isDragonEntry(e: { name: string; requiresEcho?: string[] }): boolean {
    return !!(e.requiresEcho && e.requiresEcho.includes('dragonborn') && DRAGON_POWER_NAMES.has(e.name));
}

describe('Dragon Trees — content', () => {
    it('Warden Dragon has 14 powers, each requiring the dragonborn Echo', () => {
        expect(WARDEN_DRAGON_POWERS).toHaveLength(14);
        for (const p of WARDEN_DRAGON_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('Raptor Dragon has 9 powers, each requiring the dragonborn Echo', () => {
        expect(RAPTOR_DRAGON_POWERS).toHaveLength(9);
        for (const p of RAPTOR_DRAGON_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('Sky Tyrant has 7 powers, each requiring the dragonborn Echo', () => {
        expect(SKY_TYRANT_POWERS).toHaveLength(7);
        for (const p of SKY_TYRANT_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('Warden Dragon has the 4/2/3/3/2 distribution', () => {
        const byCat: Record<string, number> = {};
        for (const p of WARDEN_DRAGON_POWERS) byCat[p.category] = (byCat[p.category] || 0) + 1;
        expect(byCat['active']).toBe(4);
        expect(byCat['passive']).toBe(2);
        expect(byCat['reaction']).toBe(3);
        expect(byCat['activeBuff']).toBe(3);
        expect(byCat['movement']).toBe(2);
    });

    it('Raptor Dragon has the 3/0/2/2/2 distribution', () => {
        const byCat: Record<string, number> = {};
        for (const p of RAPTOR_DRAGON_POWERS) byCat[p.category] = (byCat[p.category] || 0) + 1;
        expect(byCat['active']).toBe(3);
        expect(byCat['passive'] ?? 0).toBe(0);
        expect(byCat['reaction']).toBe(2);
        expect(byCat['activeBuff']).toBe(2);
        expect(byCat['movement']).toBe(2);
    });

    it('Sky Tyrant has the focused category distribution (2/2/1/1/1)', () => {
        const byCat: Record<string, number> = {};
        for (const p of SKY_TYRANT_POWERS) byCat[p.category] = (byCat[p.category] || 0) + 1;
        expect(byCat['active']).toBe(2);
        expect(byCat['passive']).toBe(2);
        expect(byCat['activeBuff']).toBe(1);
        expect(byCat['reaction']).toBe(1);
        expect(byCat['movement']).toBe(1);
    });

    it('Sky Tyrant DR subsystem only declares `damageReductionPct` on the three sanctioned powers', () => {
        const DR_ALLOWED = new Set(['Damage Reduction', 'Unyielding Shell', 'Unyielding Intercept']);
        for (const p of SKY_TYRANT_POWERS) {
            for (const [rank, lvl] of Object.entries(p.levels ?? {})) {
                const dr = (lvl as any)?.mechanics?.damageReductionPct;
                if (dr !== undefined) {
                    expect(
                        DR_ALLOWED.has(p.name),
                        `Sky Tyrant power "${p.name}" (rank ${rank}) declares damageReductionPct but is not on the sanctioned DR whitelist`
                    ).toBe(true);
                }
            }
        }
    });

    it('Rending Claws carries `splitAttack: true` on every rank', () => {
        const rc = SKY_TYRANT_POWERS.find(p => p.name === 'Rending Claws');
        expect(rc).toBeDefined();
        for (const rank of ['1', '2', '3', '4']) {
            const m = (rc!.levels as any)?.[rank]?.mechanics;
            expect(m?.splitAttack).toBe(true);
        }
    });
});

describe('Dragon Trees — power picker gating', () => {
    it('hides dragon-gated powers when no actorEchoKey is provided (safe default)', () => {
        const entries = filterCatalog({});
        const dragonHits = entries.filter(isDragonEntry);
        expect(dragonHits).toHaveLength(0);
    });

    it('hides dragon-gated powers for a non-dragonborn Echo (e.g. humans)', () => {
        const entries = filterCatalog({ actorEchoKey: 'humans' });
        const dragonHits = entries.filter(isDragonEntry);
        expect(dragonHits).toHaveLength(0);
    });

    it('reveals dragon-gated powers for dragonborn actors (case-insensitive)', () => {
        const entries = filterCatalog({ actorEchoKey: 'dragonborn' });
        const dragonHits = entries.filter(isDragonEntry);
        expect(dragonHits).toHaveLength(DRAGON_TOTAL);

        const upper = filterCatalog({ actorEchoKey: 'Dragonborn' });
        const upperHits = upper.filter(isDragonEntry);
        expect(upperHits).toHaveLength(DRAGON_TOTAL);
    });

    it('still respects other filter criteria (category) while unlocked for dragonborn', () => {
        const entries = filterCatalog({ actorEchoKey: 'dragonborn', category: 'active' });
        const dragonActives = entries.filter(isDragonEntry);
        // Warden Dragon (4) + Raptor Dragon (3) + Sky Tyrant (2) = 9
        expect(dragonActives).toHaveLength(9);
    });

    it('does not accidentally hide non-gated existing powers when actorEchoKey is set', () => {
        const noEcho = filterCatalog({});
        const withEcho = filterCatalog({ actorEchoKey: 'dragonborn' });
        // withEcho contains everything noEcho had PLUS the dragon-gated entries.
        expect(withEcho.length).toBe(noEcho.length + DRAGON_TOTAL);
    });

    it('reveals Sky Tyrant specifically when the actor is Dragonborn', () => {
        const entries = filterCatalog({ actorEchoKey: 'dragonborn', sourceName: 'Sky Tyrant' });
        expect(entries).toHaveLength(SKY_TYRANT_POWERS.length);
        for (const e of entries) {
            expect(e.requiresEcho).toEqual(['dragonborn']);
        }
    });
});
