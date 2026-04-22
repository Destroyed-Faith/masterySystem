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
import { SKY_TYRANT_POWERS } from '../src/utils/powers/sky-tyrant';
import { filterCatalog } from '../src/utils/power-catalog';

const DRAGON_POWER_NAMES = new Set<string>([
    ...WARDEN_DRAGON_POWERS.map(p => p.name),
    ...RAPTOR_DRAGON_POWERS.map(p => p.name),
    ...DREADWYRM_POWERS.map(p => p.name),
    ...SKY_TYRANT_POWERS.map(p => p.name)
]);

const DRAGON_TOTAL = 18 + 18 + 18 + SKY_TYRANT_POWERS.length; // 54 + 6 = 60

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

    it('Sky Tyrant has 6 powers, each requiring the dragonborn Echo', () => {
        expect(SKY_TYRANT_POWERS).toHaveLength(6);
        for (const p of SKY_TYRANT_POWERS) {
            expect(p.requiresEcho).toEqual(['dragonborn']);
        }
    });

    it('each full-size tree has the expected category distribution (4/4/4/4/2)', () => {
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

    it('Sky Tyrant has the focused category distribution (1/2/1/1/1)', () => {
        const byCat: Record<string, number> = {};
        for (const p of SKY_TYRANT_POWERS) byCat[p.category] = (byCat[p.category] || 0) + 1;
        expect(byCat['active']).toBe(1);
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
        // 3 × 18 + Sky Tyrant
        expect(dragonHits).toHaveLength(DRAGON_TOTAL);

        const upper = filterCatalog({ actorEchoKey: 'Dragonborn' });
        const upperHits = upper.filter(isDragonEntry);
        expect(upperHits).toHaveLength(DRAGON_TOTAL);
    });

    it('still respects other filter criteria (category) while unlocked for dragonborn', () => {
        const entries = filterCatalog({ actorEchoKey: 'dragonborn', category: 'active' });
        const dragonActives = entries.filter(isDragonEntry);
        // 3 × 4 Actives (big trees) + 1 Active (Sky Tyrant) = 13
        expect(dragonActives).toHaveLength(13);
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
