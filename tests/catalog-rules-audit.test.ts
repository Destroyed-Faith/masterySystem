import { describe, expect, it } from 'vitest';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
    AUDIT_CORRECTED_TEMPLATE_IDS,
    RETIRED_AWARENESS_PASSIVE_IDS,
    RULES_AB_ARMOR_CURVE,
    RULES_AB_EVADE_CURVE,
    RULES_EXPECTED_ACTIVE_BUFFS,
    RULES_EXPECTED_ACTIVES,
    RULES_EXPECTED_MOVEMENT,
    RULES_EXPECTED_REACTIONS,
    checkTemplateStructure,
    getBlockingAuditEntries,
    parseArtifactSummonTokenRatio,
    parsePrefixedPowerNames,
    readMechanicsCurve,
    runAndWriteCatalogAudit,
    runCatalogRulesAudit,
} from '../src/utils/catalog-rules-audit';
import { ACTIVE_BUFF_TEMPLATES } from '../src/utils/powers/templates/activeBuffs';
import { PASSIVE_TEMPLATES } from '../src/utils/powers/templates/passives';
import { ACTIVE_TEMPLATES } from '../src/utils/powers/templates/actives';
import { REACTION_TEMPLATES } from '../src/utils/powers/templates/reaction';
import { MOVEMENT_TEMPLATES } from '../src/utils/powers/templates/movement';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

describe('catalog-rules-audit helpers', () => {
    it('parses Active Buff / Reaction prefixed names from markdown', () => {
        const md = `
  Active Buff: Armor
  Active Buff: Evade
| **Level** | **Effect** |
  Reaction: Riposte
        `;
        expect(parsePrefixedPowerNames(md, 'Active Buff')).toEqual(['Armor', 'Evade']);
        expect(parsePrefixedPowerNames(md, 'Reaction')).toEqual(['Riposte']);
    });

    it('parses Artifact Summon Token Generator 4-token ratio', () => {
        const md = `
| **Artifact Effect** | **Summon Tokens Generated** |
| 1 Summon Stone | 4 Tokens |
| 2 Summon Stones | 8 Tokens |
`;
        expect(parseArtifactSummonTokenRatio(md)).toBe(4);
    });

    it('checks 16-level structure on every live template', () => {
        const all = [
            ...ACTIVE_TEMPLATES,
            ...ACTIVE_BUFF_TEMPLATES,
            ...PASSIVE_TEMPLATES,
            ...REACTION_TEMPLATES,
            ...MOVEMENT_TEMPLATES,
        ];
        const broken = all.flatMap((t) => checkTemplateStructure(t));
        expect(broken).toEqual([]);
    });

    it('Active Buff Armor / Evade curves match Rules', () => {
        const armor = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-armor')!;
        const evade = ACTIVE_BUFF_TEMPLATES.find((t) => t.templateId === 'ab-evade')!;
        expect(readMechanicsCurve(armor, 'armor')).toEqual([...RULES_AB_ARMOR_CURVE]);
        expect(readMechanicsCurve(evade, 'evade')).toEqual([...RULES_AB_EVADE_CURVE]);
    });

    it('keeps Awareness / Heightened Senses filtered from PASSIVE_TEMPLATES', () => {
        const ids = new Set(PASSIVE_TEMPLATES.map((t) => t.templateId));
        for (const id of RETIRED_AWARENESS_PASSIVE_IDS) {
            expect(ids.has(id)).toBe(false);
        }
    });

    it('curated manifests cover core categories', () => {
        expect(RULES_EXPECTED_ACTIVE_BUFFS.length).toBeGreaterThanOrEqual(25);
        expect(RULES_EXPECTED_REACTIONS.length).toBeGreaterThanOrEqual(18);
        expect(RULES_EXPECTED_MOVEMENT.length).toBe(10);
        expect(RULES_EXPECTED_ACTIVES.length).toBe(ACTIVE_TEMPLATES.length);
    });
});

describe('catalog-rules-audit report', () => {
    it('writes docs/catalog-audit.json and has no undocument missing/obsolete', () => {
        const report = runAndWriteCatalogAudit({
            rootDir: repoRoot,
            correctedIds: AUDIT_CORRECTED_TEMPLATE_IDS,
        });

        expect(report.entries.length).toBeGreaterThan(50);
        expect(report.summary.correct + report.summary.corrected).toBeGreaterThan(50);

        // Critical(X) is fully defined: X attacks/round, explode 7–8
        const crit = report.entries.find((e) => e.id === 'ab-critical');
        expect(crit?.status).toBe('correct');
        expect(crit?.notes).toMatch(/Critical\(X\).*per Round/i);
        expect(report.summary['requires-rule-decision']).toBe(0);

        // Artifact Summon Token Generator is correct (4 tokens — not a conflict)
        const tokens = report.entries.find((e) => e.id === 'artifact-summon-token-generator');
        expect(tokens?.status).toBe('correct');
        expect(tokens?.notes).toMatch(/4 Tokens/i);

        // Evade corrections recorded
        for (const id of ['ab-evade', 'ab-evade-temp-hp', 'ab-armor-evade']) {
            const row = report.entries.find((e) => e.id === id);
            expect(row?.status).toBe('corrected');
        }

        // Retired awareness filtered → correct (not obsolete)
        for (const id of RETIRED_AWARENESS_PASSIVE_IDS) {
            const row = report.entries.find((e) => e.id === id);
            expect(row?.status).toBe('correct');
        }

        const blocking = getBlockingAuditEntries(report);
        if (blocking.length > 0) {
            const detail = blocking.map((e) => `${e.status}:${e.id} — ${e.notes}`).join('\n');
            expect(blocking, `Unexpected missing/obsolete entries:\n${detail}`).toEqual([]);
        }
    });

    it('runCatalogRulesAudit is pure (no write) and stable on categories', () => {
        const report = runCatalogRulesAudit({ rootDir: repoRoot, generatedAt: '2026-08-01T00:00:00.000Z' });
        const categories = new Set(report.entries.map((e) => e.category));
        expect(categories.has('activeBuff')).toBe(true);
        expect(categories.has('reaction')).toBe(true);
        expect(categories.has('passive')).toBe(true);
        expect(categories.has('movement')).toBe(true);
        expect(categories.has('active')).toBe(true);
        expect(categories.has('artifact')).toBe(true);
        expect(categories.has('artifact-rule')).toBe(true);
    });
});
