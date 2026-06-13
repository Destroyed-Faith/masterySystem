import { describe, expect, it } from 'vitest';
import { computeBuildRoleRating, AXIS_LABELS } from '../src/creation/tower-wizard/tower-wizard-build-rating.js';
import { getOffenseActiveSpecialGroups } from '../src/creation/tower-wizard/tower-wizard-packages.js';
import type { ReviewPowerRow } from '../src/creation/tower-wizard/tower-wizard-types.js';

function row(templateId: string, special: string | null = null, rank = 4): ReviewPowerRow {
    return {
        grantKey: 'passive-1',
        role: 'role',
        playerName: 'name',
        rank,
        category: '',
        hasCatalogOverride: false,
        spec: { templateId, special, rank },
        showSpellConfig: false,
    } as ReviewPowerRow;
}

function topAxisKey(rating: ReturnType<typeof computeBuildRoleRating>): string {
    return [...rating.axes].sort((a, b) => b.score - a.score)[0]!.key;
}

function scoreOf(rating: ReturnType<typeof computeBuildRoleRating>, key: string): number {
    return rating.axes.find((a) => a.key === key)!.score;
}

describe('computeBuildRoleRating', () => {
    it('rates a defensive build as Defense-leaning', () => {
        const rating = computeBuildRoleRating([
            row('passive-fortified-frame'),
            row('passive-stone-stance'),
            row('ab-armor'),
            row('reaction-damage-reduction'),
            row('reaction-armor'),
            row('passive-temp-hp'),
        ]);
        expect(topAxisKey(rating)).toBe('defense');
        expect(scoreOf(rating, 'defense')).toBeGreaterThan(scoreOf(rating, 'offense'));
        expect(rating.directionLabel.toLowerCase()).toContain('defensive');
        expect(rating.focusKey).toBe('sharp');
    });

    it('rates an offensive build as Offense-leaning', () => {
        const rating = computeBuildRoleRating([
            row('ab-damage'),
            row('ab-penetration'),
            row('ab-critical'),
            row('passive-killing-intent'),
            row('passive-bloodlust'),
            row('passive-executioner'),
        ]);
        expect(topAxisKey(rating)).toBe('offense');
        expect(scoreOf(rating, 'offense')).toBeGreaterThan(scoreOf(rating, 'defense'));
        expect(rating.directionLabel.toLowerCase()).toContain('offensive');
    });

    it('rates a sustain-heavy build as Sustain-leaning and focused', () => {
        const rating = computeBuildRoleRating([
            row('passive-regeneration'),
            row('passive-deep-vitality'),
            row('ab-healing'),
            row('ab-temp-hp-healing'),
            row('passive-blood-feast'),
            row('passive-battle-trance'),
        ]);
        expect(topAxisKey(rating)).toBe('sustain');
        expect(rating.focusKey).toBe('sharp');
    });

    it('rates a build spread across all axes as not sharply focused', () => {
        const groups = getOffenseActiveSpecialGroups(null);
        const controlGroup = groups.find((g) =>
            ['blinded', 'frightened', 'prone', 'stunned', 'weaken'].includes(g.specialKey ?? ''),
        );
        const controlVariant = controlGroup?.patterns[0]?.variants[0];
        expect(controlVariant).toBeDefined();

        const rating = computeBuildRoleRating([
            row('passive-fortified-frame'),
            row('passive-killing-intent'),
            row(controlVariant!.templateId, controlVariant!.special ?? null),
            row('passive-regeneration'),
            row('passive-ghostform'),
            row('passive-heightened-senses'),
        ]);
        expect(rating.focusKey).not.toBe('sharp');
    });

    it('produces a well-formed radar geometry', () => {
        const rating = computeBuildRoleRating([
            row('passive-fortified-frame'),
            row('passive-temp-hp'),
            row('ab-armor'),
            row('reaction-armor'),
            row('passive-regeneration'),
            row('ab-damage'),
        ]);
        expect(rating.radar.size).toBe(240);
        expect(rating.radar.center).toBe(120);
        expect(rating.radar.gridPolygons).toHaveLength(4);
        expect(rating.radar.axisLines).toHaveLength(4);
        expect(rating.radar.labels).toHaveLength(4);
        expect(rating.axes).toHaveLength(4);
        expect(rating.axes.map((a) => a.key)).toEqual(['offense', 'control', 'sustain', 'defense']);
        expect(rating.radar.dataPolygon).toMatch(/\d/);
        for (const label of rating.radar.labels) {
            expect(Object.values(AXIS_LABELS)).toContain(label.label);
        }
    });
});
