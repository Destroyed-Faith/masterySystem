/**
 * Tests for the new Upgrade Step rule (`src/utils/xp-step-rule.ts`).
 *
 * New spec: each individual Attribute / Skill / Power / Artifact may be
 * bumped at most once per Upgrade Step. The previous 50%-of-step attribute
 * cap is gone. State is stored on the actor as
 *   `system.xp.currentStep = { attributes: string[], skills: string[], powers: string[], artifacts: string[] }`
 * and is cleared by `endStep`.
 */

import { describe, it, expect, vi } from 'vitest';
import {
    emptyStep,
    readStep,
    isBumped,
    recordBump,
    undoBump,
    endStep,
    commitStep,
    type XpStepState,
} from '../src/utils/xp-step-rule';

function makeMockActor(initialStep?: Partial<XpStepState>) {
    const xp: any = {
        currentStep: {
            attributes: [...(initialStep?.attributes ?? [])],
            skills: [...(initialStep?.skills ?? [])],
            powers: [...(initialStep?.powers ?? [])],
            artifacts: [...(initialStep?.artifacts ?? [])],
        },
        history: [],
    };
    const actor: any = {
        system: { xp },
        update: vi.fn(async (data: Record<string, any>) => {
            for (const [path, value] of Object.entries(data)) {
                const segments = path.split('.');
                let target = actor;
                for (let i = 0; i < segments.length - 1; i++) {
                    const seg = segments[i];
                    if (target[seg] == null) target[seg] = {};
                    target = target[seg];
                }
                target[segments[segments.length - 1]] = value;
            }
        }),
    };
    return actor;
}

describe('emptyStep()', () => {
    it('returns four empty lists', () => {
        const s = emptyStep();
        expect(s).toEqual({ attributes: [], skills: [], powers: [], artifacts: [] });
    });
});

describe('readStep()', () => {
    it('returns an empty step for an actor with no XP state', () => {
        expect(readStep({})).toEqual(emptyStep());
        expect(readStep(null)).toEqual(emptyStep());
    });

    it('coerces legacy / numeric shapes into empty lists', () => {
        const actor = { system: { xp: { currentStep: { attrSpent: 4, nonAttrSpent: 2 } } } };
        expect(readStep(actor)).toEqual(emptyStep());
    });

    it('preserves valid string lists and drops duplicates / empty entries', () => {
        const actor = makeMockActor({
            attributes: ['might', 'might', '', 'agility'],
            skills: ['  ', 'athletics'],
            powers: ['power-1'],
            artifacts: [],
        });
        expect(readStep(actor)).toEqual({
            attributes: ['might', 'agility'],
            skills: ['athletics'],
            powers: ['power-1'],
            artifacts: [],
        });
    });
});

describe('isBumped()', () => {
    it('returns false for an empty step', () => {
        expect(isBumped(emptyStep(), 'attribute', 'might')).toBe(false);
    });

    it('returns true when the key is in the matching list', () => {
        const s: XpStepState = { attributes: ['might'], skills: [], powers: [], artifacts: [] };
        expect(isBumped(s, 'attribute', 'might')).toBe(true);
    });

    it('does not cross-pollinate kinds', () => {
        const s: XpStepState = { attributes: ['might'], skills: ['might'], powers: [], artifacts: [] };
        expect(isBumped(s, 'power', 'might')).toBe(false);
        expect(isBumped(s, 'artifact', 'might')).toBe(false);
    });

    it('returns false for blank ids', () => {
        const s: XpStepState = { attributes: [''], skills: [], powers: [], artifacts: [] };
        expect(isBumped(s, 'attribute', '')).toBe(false);
        expect(isBumped(s, 'attribute', '   ')).toBe(false);
    });
});

describe('recordBump()', () => {
    it('adds a new key to the matching list and is idempotent', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        expect(s.attributes).toEqual(['might']);
        s = recordBump(s, 'attribute', 'might');
        expect(s.attributes).toEqual(['might']);
    });

    it('keeps different kinds isolated', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        s = recordBump(s, 'skill', 'might');
        s = recordBump(s, 'power', 'might');
        s = recordBump(s, 'artifact', 'might');
        expect(s).toEqual({
            attributes: ['might'],
            skills: ['might'],
            powers: ['might'],
            artifacts: ['might'],
        });
    });

    it('returns a new object (does not mutate input)', () => {
        const before = emptyStep();
        const after = recordBump(before, 'attribute', 'might');
        expect(before.attributes).toEqual([]);
        expect(after).not.toBe(before);
    });

    it('ignores blank ids', () => {
        const s = recordBump(emptyStep(), 'attribute', '   ');
        expect(s.attributes).toEqual([]);
    });
});

describe('undoBump() — refund flow', () => {
    it('removes the key, allowing a re-bump in the same step', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        expect(isBumped(s, 'attribute', 'might')).toBe(true);
        s = undoBump(s, 'attribute', 'might');
        expect(isBumped(s, 'attribute', 'might')).toBe(false);
        s = recordBump(s, 'attribute', 'might');
        expect(s.attributes).toEqual(['might']);
    });

    it('is a no-op for unknown ids', () => {
        let s = emptyStep();
        s = recordBump(s, 'skill', 'athletics');
        const after = undoBump(s, 'skill', 'stealth');
        expect(after.skills).toEqual(['athletics']);
    });

    it('only touches the matching kind', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        s = recordBump(s, 'skill', 'might');
        s = undoBump(s, 'attribute', 'might');
        expect(s.attributes).toEqual([]);
        expect(s.skills).toEqual(['might']);
    });
});

describe('once-per-step enforcement scenario', () => {
    it('rejects a second bump of the same attribute, accepts another attribute', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        expect(isBumped(s, 'attribute', 'might')).toBe(true);
        // Caller would refuse a second bump here.
        expect(isBumped(s, 'attribute', 'agility')).toBe(false);
        s = recordBump(s, 'attribute', 'agility');
        expect(s.attributes).toEqual(['might', 'agility']);
    });

    it('allows the same id across different kinds in one step', () => {
        let s = emptyStep();
        s = recordBump(s, 'attribute', 'might');
        s = recordBump(s, 'skill', 'might');
        expect(isBumped(s, 'attribute', 'might')).toBe(true);
        expect(isBumped(s, 'skill', 'might')).toBe(true);
        expect(isBumped(s, 'power', 'might')).toBe(false);
    });
});

describe('commitStep()', () => {
    it('persists all four lists via actor.update and appends an optional history note', async () => {
        const actor = makeMockActor();
        const next: XpStepState = {
            attributes: ['might'],
            skills: ['athletics'],
            powers: ['power-1'],
            artifacts: ['artifact-1'],
        };
        await commitStep(actor, next, { historyNote: 'bumped might' });
        expect(actor.update).toHaveBeenCalled();
        const finalStep = actor.system.xp.currentStep;
        expect(finalStep).toEqual(next);
        const history = actor.system.xp.history;
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({ kind: 'step', note: 'bumped might', after: next });
    });

    it('is a no-op when actor is missing', async () => {
        await expect(commitStep(null, emptyStep())).resolves.toBeUndefined();
    });
});

describe('endStep()', () => {
    it('clears all four lists and appends a summary history entry', async () => {
        const actor = makeMockActor({
            attributes: ['might', 'agility'],
            skills: ['athletics'],
            powers: [],
            artifacts: ['art-1'],
        });
        const cleared = await endStep(actor);
        expect(cleared).toEqual(emptyStep());
        expect(actor.system.xp.currentStep).toEqual(emptyStep());
        const history = actor.system.xp.history;
        expect(history).toHaveLength(1);
        expect(history[0]).toMatchObject({
            kind: 'step-end',
            before: {
                attributes: ['might', 'agility'],
                skills: ['athletics'],
                powers: [],
                artifacts: ['art-1'],
            },
            after: emptyStep(),
        });
        expect(typeof history[0].note).toBe('string');
        expect(history[0].note).toContain('attr');
        expect(history[0].note).toContain('skill');
    });
});
