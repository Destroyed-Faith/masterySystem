import { describe, expect, it } from 'vitest';
import {
    ECHO_ARTIFACTS,
    ECHO_ARTIFACT_RULES,
    buildArtifactSystemFromEchoDef,
    getEchoArtifact,
    getEchoArtifactRules,
    listSelectableEchoArtifacts,
} from '../src/utils/echo-artifacts.js';

const KNOWN_ECHOES = ['dwarfs', 'elorians', 'titanborn', 'dragonborn', 'sentinels', 'unbound', 'halflings'];

describe('Echo Artifact catalog — shape & coverage', () => {
    it('contains a non-empty registry', () => {
        const keys = Object.keys(ECHO_ARTIFACTS);
        expect(keys.length).toBeGreaterThanOrEqual(5);
    });

    it('every catalog entry has required fields', () => {
        for (const [key, def] of Object.entries(ECHO_ARTIFACTS)) {
            expect(def.key, `${key}.key`).toBe(key);
            expect(typeof def.name, `${key}.name`).toBe('string');
            expect(typeof def.echoKey, `${key}.echoKey`).toBe('string');
            expect(typeof def.slot, `${key}.slot`).toBe('string');
            expect(typeof def.baseProfile, `${key}.baseProfile`).toBe('string');
            expect(Array.isArray(def.baseValues), `${key}.baseValues`).toBe(true);
            expect(def.baseValues.length, `${key}.baseValues.length`).toBeGreaterThanOrEqual(1);
            expect(Array.isArray(def.levelProgression), `${key}.levelProgression`).toBe(true);
            expect(def.levelProgression.length, `${key}.levelProgression.length`).toBeGreaterThanOrEqual(
                3,
            );
        }
    });

    it('every level-progression row has level/name/type', () => {
        for (const [key, def] of Object.entries(ECHO_ARTIFACTS)) {
            for (const row of def.levelProgression) {
                expect(typeof row.level, `${key} row.level`).toBe('number');
                expect(typeof row.name, `${key} row.name`).toBe('string');
                expect(typeof row.type, `${key} row.type`).toBe('string');
            }
        }
    });
});

describe('Echo Artifact rules — per-echo selection rules', () => {
    it('exposes rules for every known Echo', () => {
        for (const echo of KNOWN_ECHOES) {
            const r = getEchoArtifactRules(echo);
            expect(r, `rules for ${echo}`).toBeTruthy();
            expect(r.requiredAtCreation).toBeGreaterThanOrEqual(0);
            expect(r.maxAtCreation).toBeGreaterThanOrEqual(r.requiredAtCreation);
        }
    });

    it('every rule lists available artifact keys that exist in the catalog', () => {
        for (const [echo, rule] of Object.entries(ECHO_ARTIFACT_RULES)) {
            for (const key of rule.availableKeys) {
                expect(ECHO_ARTIFACTS[key], `echo ${echo} → key ${key}`).toBeTruthy();
            }
        }
    });
});

describe('Echo Artifact catalog — lookups', () => {
    it('getEchoArtifact returns the catalog entry by key', () => {
        const stonebound = getEchoArtifact('stoneboundSoles');
        expect(stonebound).toBeTruthy();
        expect(stonebound!.echoKey).toBe('dwarfs');
    });

    it('listSelectableEchoArtifacts returns the right set per Echo', () => {
        const dwarfList = listSelectableEchoArtifacts('dwarfs');
        expect(dwarfList.length).toBeGreaterThanOrEqual(1);
        for (const def of dwarfList) {
            expect(def.echoKey).toBe('dwarfs');
        }
    });

    it('Elorians pick Elorian Stride as their echo-bound feet artifact', () => {
        const list = listSelectableEchoArtifacts('elorians');
        expect(list.map((d) => d.key)).toEqual(['elorianStride']);
        const rule = getEchoArtifactRules('elorians');
        expect(rule.requiredAtCreation).toBe(1);
        expect(rule.maxAtCreation).toBe(1);
        expect(rule.exclusiveGroups).toBeUndefined();
    });

    it('getEchoArtifactRules resolves legacy elves echo key', () => {
        expect(getEchoArtifactRules('elves').availableKeys).toEqual(['elorianStride']);
    });

    it('getEchoArtifact resolves legacy Elven Stride keys to Elorian Stride', () => {
        expect(getEchoArtifact('elvenStrideFire')?.key).toBe('elorianStride');
        expect(getEchoArtifact('elvenStrideEarth')?.key).toBe('elorianStride');
    });

    it('getEchoArtifact resolves legacy wyrm/serpent keys to current variants', () => {
        expect(getEchoArtifact('wyrmScales')?.key).toBe('wyrmScalesHeavy');
        expect(getEchoArtifact('wyrmScalesMedium')?.key).toBe('wyrmScalesHeavy');
        expect(getEchoArtifact('serpentScales')?.key).toBe('wyrmScalesLight');
    });

    it('Unbound grants exactly one identity artifact', () => {
        const rule = getEchoArtifactRules('unbound');
        expect(rule.requiredAtCreation).toBe(1);
        expect(rule.maxAtCreation).toBe(1);
        expect(listSelectableEchoArtifacts('unbound', 'witch-root').map((d) => d.key)).toEqual([
            'witchStaffRoot',
        ]);
        expect(listSelectableEchoArtifacts('unbound', 'beast').map((d) => d.key)).toEqual([
            'predatorCrownMight',
            'predatorCrownWits',
            'predatorCrownIntellect',
        ]);
    });

    it('Titanborn pick the single Titan Scars artifact', () => {
        expect(listSelectableEchoArtifacts('titanborn').map((d) => d.key)).toEqual(['titanScars']);
        expect(getEchoArtifact('titanScarsMight')?.key).toBe('titanScars');
    });

    it('Halflings may optionally take the Ringchain of Kept Names', () => {
        const rule = getEchoArtifactRules('halflings');
        expect(rule.requiredAtCreation).toBe(0);
        expect(rule.maxAtCreation).toBe(1);
        expect(listSelectableEchoArtifacts('halflings').map((d) => d.key)).toEqual(['ringchainOfKeptNames']);
    });

    it('Dragonborn pick exactly one of two body armor variants', () => {
        const list = listSelectableEchoArtifacts('dragonborn');
        const wyrmKeys = list
            .filter((d) => d.variantGroupKey === 'wyrmScales')
            .map((d) => d.key)
            .sort();
        expect(wyrmKeys).toEqual(['wyrmScalesHeavy', 'wyrmScalesLight']);
        const rule = getEchoArtifactRules('dragonborn');
        expect(rule.exclusiveGroups?.[0]?.sort()).toEqual(wyrmKeys);
    });
});

describe('buildArtifactSystemFromEchoDef — artifact item shape', () => {
    it('builds a system payload with binding=echo and current canonical fields', () => {
        const def = getEchoArtifact('stoneboundSoles')!;
        const sys = buildArtifactSystemFromEchoDef(def);
        expect(sys.slot).toBe(def.slot);
        expect(sys.baseProfile).toBe(def.baseProfile);
        expect(sys.binding).toBe('echo');
        expect(sys.echoKey).toBe(def.echoKey);
        expect(Array.isArray(sys.baseValues)).toBe(true);
        expect(Array.isArray(sys.levelProgression)).toBe(true);
        expect(typeof sys.currentLevel).toBe('number');
        expect((sys.currentLevel as number)).toBeGreaterThanOrEqual(1);
    });
});
