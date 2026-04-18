/**
 * Dragon Trees Echo-Gating tests.
 *
 * Covers:
 *  - Each of the three Dragonborn-exclusive trees (Warden Dragon, Raptor Dragon,
 *    Dreadwyrm) registers exactly 18 powers.
 *  - Every power in those trees carries requiresEcho: ['dragonborn'].
 *  - filterCatalog hides echo-gated entries unless actorEchoKey matches.
 */

import { describe, it, expect } from 'vitest';
import { WARDEN_DRAGON_POWERS } from '../src/utils/powers/warden-dragon';
import { RAPTOR_DRAGON_POWERS } from '../src/utils/powers/raptor-dragon';
import { DREADWYRM_POWERS } from '../src/utils/powers/dreadwyrm';
import { filterCatalog } from '../src/utils/power-catalog';

const DRAGON_POWER_NAMES = new Set<string>([
    ...WARDEN_DRAGON_POWERS.map(p => p.name),
    ...RAPTOR_DRAGON_POWERS.map(p => p.name),
    ...DREADWYRM_POWERS.map(p => p.name)
]);

function isDragonEntry(e: { name: string; requiresEcho?: string[] }): boolean {
    return !!(e.requiresEcho && e.requiresEcho.includes('dragonborn') && DRAGON_POWER_NAMES.has(e.name));
}

describe('Dragon Trees — content', () => {
    it('Warden Dragon has 18 powers, each requiring the dragonborn Echo', () => {
        expect(WARDEN_DRAGON_POWERS).toHaveLength(18);
        for (const p of WARDEN_DRAGON_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('Raptor Dragon has 18 powers, each requiring the dragonborn Echo', () => {
        expect(RAPTOR_DRAGON_POWERS).toHaveLength(18);
        for (const p of RAPTOR_DRAGON_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('Dreadwyrm has 18 powers, each requiring the dragonborn Echo', () => {
        expect(DREADWYRM_POWERS).toHaveLength(18);
        for (const p of DREADWYRM_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('each tree has the expected category distribution (4/4/4/4/2)', () => {
        const trees = [WARDEN_DRAGON_POWERS, RAPTOR_DRAGON_POWERS, DREADWYRM_POWERS];
        for (const powers of trees) {
            const byCat: Record<string, number> = {};
            for (const p of powers) byCat[p.category] = (byCat[p.category] || 0) + 1;
            expect(byCat['active']).toBe(4);
            expect(byCat['passive']).toBe(4);
            expect(byCat['reaction']).toBe(4);
            expect(byCat['activeBuff']).toBe(4);
            expect(byCat['movement']).toBe(2);
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
        // 3 trees × 18 powers = 54
        expect(dragonHits).toHaveLength(54);

        const upper = filterCatalog({ actorEchoKey: 'Dragonborn' });
        const upperHits = upper.filter(isDragonEntry);
        expect(upperHits).toHaveLength(54);
    });

    it('still respects other filter criteria (category) while unlocked for dragonborn', () => {
        const entries = filterCatalog({ actorEchoKey: 'dragonborn', category: 'active' });
        const dragonActives = entries.filter(isDragonEntry);
        // 3 trees × 4 Actives = 12
        expect(dragonActives).toHaveLength(12);
    });

    it('does not accidentally hide non-gated existing powers when actorEchoKey is set', () => {
        const noEcho = filterCatalog({});
        const withEcho = filterCatalog({ actorEchoKey: 'dragonborn' });
        // withEcho contains everything noEcho had PLUS the dragon-gated entries.
        expect(withEcho.length).toBe(noEcho.length + 54);
    });
});
