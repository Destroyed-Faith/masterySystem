import { describe, expect, it } from 'vitest';
import {
    buildTowerWizardEchoContext,
    collectEchoAdvisorWarnings,
    collectEchoArtifactActiveBuffs,
    defensePackageConflictsWithEcho,
    recommendDefensePackages,
    validateEchoRequiredForTowerWizard,
} from '../src/creation/tower-wizard/tower-wizard-echo-advisor.js';
import { buildEchoProgressionPicks, getEchoArtifact } from '../src/utils/echo-artifacts.js';

function mockActor(options: {
    echoKey?: string;
    artifactKeys?: string[];
}): Actor {
    const items = (options.artifactKeys ?? []).map((key, idx) => {
        const def = getEchoArtifact(key)!;
        return {
            id: `art-${idx}`,
            type: 'artifact',
            name: def.name,
            getFlag: (ns: string, flag: string) => {
                if (ns !== 'mastery-system') return undefined;
                if (flag === 'echoArtifactKey') return key;
                if (flag === 'echoBound') return def.echoKey;
                return undefined;
            },
            system: { binding: 'echo' },
        };
    });
    return {
        items,
        system: {
            echo: options.echoKey ? { key: options.echoKey } : {},
        },
    } as unknown as Actor;
}

describe('tower-wizard-echo-advisor', () => {
    it('requires Echo before building a package', () => {
        const ctx = buildTowerWizardEchoContext(mockActor({}));
        expect(ctx.hasEcho).toBe(false);
        expect(validateEchoRequiredForTowerWizard(ctx)).toMatch(/Select your Echo/i);
    });

    it('detects Serpent Scales ab-evade Active Buff from artifact picks', () => {
        const buffs = collectEchoArtifactActiveBuffs(
            mockActor({ echoKey: 'dragonborn', artifactKeys: ['wyrmScalesLight'] }),
        );
        expect(buffs.some((b) => b.templateId === 'ab-evade' && b.artifactName === 'Serpent Scales')).toBe(true);
        expect(buffs.find((b) => b.templateId === 'ab-evade')?.defenseAxis).toBe('evade');
    });

    it('flags evade defense package when Echo already grants evade Active Buff', () => {
        const ctx = buildTowerWizardEchoContext(
            mockActor({ echoKey: 'dragonborn', artifactKeys: ['wyrmScalesLight'] }),
        );
        const conflict = defensePackageConflictsWithEcho('evade', ctx);
        expect(conflict?.templateId).toBe('ab-evade');
        expect(recommendDefensePackages(ctx)).not.toContain('evade');
        expect(recommendDefensePackages(ctx)).toEqual(
            expect.arrayContaining(['phasing', 'damage-reduction']),
        );
    });

    it('does not flag phasing when Echo grants armor Active Buff', () => {
        const ctx = buildTowerWizardEchoContext(
            mockActor({ echoKey: 'dragonborn', artifactKeys: ['wyrmScalesHeavy'] }),
        );
        const picks = buildEchoProgressionPicks(getEchoArtifact('wyrmScalesHeavy')!);
        expect(picks.find((p) => p.level === 2)?.powerTemplateId).toBe('ab-armor');
        expect(defensePackageConflictsWithEcho('phasing', ctx)).toBeNull();
        expect(recommendDefensePackages(ctx)).toContain('phasing');
    });

    it('warns when defensive package duplicates Echo Artifact Active Buff', () => {
        const ctx = buildTowerWizardEchoContext(
            mockActor({ echoKey: 'dragonborn', artifactKeys: ['wyrmScalesLight'] }),
        );
        const warnings = collectEchoAdvisorWarnings(
            { defenseId: 'evade', activeBuffMode: 'defensive' },
            ctx,
        );
        expect(warnings.some((w) => /Serpent Scales/i.test(w) && /Active Buff/i.test(w))).toBe(true);
        expect(warnings.some((w) => /Phasing or Damage Reduction/i.test(w))).toBe(true);
    });
});
