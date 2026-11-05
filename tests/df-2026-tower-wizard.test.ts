import { describe, expect, it } from 'vitest';
import {
    WIZARD_IDENTITY_STEPS,
    WIZARD_STEP_ORDER,
    getVisibleWizardSteps,
} from '../src/creation/tower-wizard/tower-wizard-packages.js';
import {
    TOWER_WIZARD_STARTING_STONES,
    validatePackageSpecs,
    validateTowerWizardIdentity,
    validateTowerWizardSelection,
    validateWizardIdentityStep,
} from '../src/creation/tower-wizard/tower-wizard-validation.js';
import {
    buildIdentityUpdateData,
    buildReconciliationPreview,
    buildWizardImprintGroups,
    buildWizardSpecRows,
    readActorIdentityPrefill,
    specRecordsFromDraft,
} from '../src/creation/tower-wizard/tower-wizard-identity.js';
import type { TowerWizardSelection } from '../src/creation/tower-wizard/tower-wizard-types.js';
import { ECHO_IMPRINTS } from '../src/rules/echo-imprints.js';

const ATTRS = { might: 4, agility: 4, vitality: 3, intellect: 3, resolve: 2, influence: 2, wits: 2 };
const STONES = { might: 1, agility: 1, vitality: 0, intellect: 0, resolve: 0, influence: 0, wits: 0 };

function fourProfessions() {
    return specRecordsFromDraft([
        { name: 'Burglar', origin: 'Apprenticed to a Karaveth locksmith.', scope: 'Opening mechanical locks and quiet entry.' },
        { name: 'Tracker', origin: 'Hunted the hill trails.', scope: 'Following trails in the wild.' },
        { name: 'Herbalist', origin: 'Learned plants from a hospice.', scope: 'Identifying and preparing plants.' },
        { name: 'Courtier', origin: 'Served a minor house.', scope: 'Bargaining, favors, and ceremony.' },
    ]);
}

const imprintFor = (attribute: string) => ECHO_IMPRINTS.filter((e) => e.attribute === attribute);

const baseGuided: TowerWizardSelection = {
    defenseId: 'armor',
    passive1TemplateId: 'passive-fortified-frame',
    secondPassiveTemplateId: 'passive-temp-hp',
    activeBuffMode: 'defensive',
    offenseId: 'direct-damage',
    delivery: 'melee',
    weakenSave: null,
};

describe('DF 2026 Tower Wizard — step order', () => {
    it('starts at passive1 (no identity steps) and ends at review', () => {
        expect(WIZARD_STEP_ORDER[0]).toBe('passive1');
        expect(WIZARD_STEP_ORDER).not.toEqual(expect.arrayContaining([...WIZARD_IDENTITY_STEPS]));
        expect(WIZARD_STEP_ORDER[WIZARD_STEP_ORDER.length - 1]).toBe('review');
        expect(getVisibleWizardSteps({ activeBuffMode: 'defensive' })[0]).toBe('passive1');
        expect(getVisibleWizardSteps({ activeBuffMode: 'defensive' })).not.toEqual(
            expect.arrayContaining([...WIZARD_IDENTITY_STEPS]),
        );
    });

    it('Quick (manualBuildMode) jumps straight to review', () => {
        expect(getVisibleWizardSteps({ manualBuildMode: true })).toEqual(['review']);
        expect(getVisibleWizardSteps({ manualBuildMode: true, skipIdentitySteps: true })).toEqual(['review']);
    });

    it('includes offensiveBuff only when replacing the defensive Active Buff', () => {
        expect(getVisibleWizardSteps({ activeBuffMode: 'defensive' })).not.toContain('offensiveBuff');
        expect(getVisibleWizardSteps({ activeBuffMode: 'offensive' })).toContain('offensiveBuff');
        expect(getVisibleWizardSteps({ activeBuffMode: 'support' })).toContain('offensiveBuff');
    });
});

describe('DF 2026 Tower Wizard — Scenario A (starting budget)', () => {
    it('accepts four Rank 2 Professions and two Imprints at MR2', () => {
        const might = imprintFor('might')[0];
        const agility = imprintFor('agility')[0];
        const sel = {
            ...baseGuided,
            masteryRank: 2,
            attributeValues: ATTRS,
            stoneAssignments: STONES,
            echoImprintIds: [might.id, agility.id],
            specializations: fourProfessions(),
        };
        expect(sel.specializations).toHaveLength(4);
        expect(sel.specializations.every((s) => s.rank === 2)).toBe(true);
        expect(validateTowerWizardIdentity(sel, { hasEcho: true }, { requireComplete: true })).toBeNull();
        expect(validateTowerWizardSelection(sel)).toBeNull();
        expect(validatePackageSpecs(sel)).toBeNull();
    });

    it('rejects fewer or more than four Professions', () => {
        const three = fourProfessions().slice(0, 3);
        expect(validateTowerWizardIdentity({ specializations: three })).toMatch(/exactly 4/i);
        const five = [...fourProfessions(), ...specRecordsFromDraft([{ name: 'Extra', origin: 'A short posting.', scope: 'Anything agreed.' }])];
        expect(validateTowerWizardIdentity({ specializations: five })).toMatch(/exactly 4/i);
    });

    it('rejects a starting Specialization that is not Rank 2', () => {
        const specs = fourProfessions();
        specs[0] = { ...specs[0], rank: 3 };
        expect(validateTowerWizardIdentity({ specializations: specs })).toMatch(/Rank 2/);
    });

    it('rejects duplicate names within a Field and missing scope', () => {
        const dup = fourProfessions();
        dup[1] = { ...dup[0], id: dup[0].id };
        expect(validateTowerWizardIdentity({ specializations: dup })).toMatch(/Duplicate Profession/);
        const noScope = fourProfessions();
        noScope[2] = { ...noScope[2], scope: '' };
        expect(validateTowerWizardIdentity({ specializations: noScope })).toMatch(/Scope required/);
    });

    it('caps Echo Imprints at Mastery Rank', () => {
        const picks = [...imprintFor('might'), ...imprintFor('agility')].slice(0, 3).map((e) => e.id);
        const err = validateTowerWizardIdentity({
            masteryRank: 2,
            attributeValues: ATTRS,
            echoImprintIds: picks,
        });
        expect(err).toMatch(/At most 2 Echo Imprint/);
        // A single Imprint at MR1 is fine; two is not.
        expect(
            validateTowerWizardIdentity({ masteryRank: 1, attributeValues: ATTRS, echoImprintIds: picks.slice(0, 2) }),
        ).toMatch(/At most 1 Echo Imprint/);
    });

    it('requires the linked Attribute to be 4+ for an Imprint', () => {
        const wits = imprintFor('wits')[0];
        const err = validateTowerWizardIdentity({
            masteryRank: 2,
            attributeValues: ATTRS,
            echoImprintIds: [wits.id],
        });
        expect(err).toMatch(/requires wits 4\+/i);
    });

    it('rejects duplicate Imprint ids', () => {
        const might = imprintFor('might')[0];
        expect(
            validateTowerWizardIdentity({ masteryRank: 2, attributeValues: ATTRS, echoImprintIds: [might.id, might.id] }),
        ).toMatch(/Duplicate Echo Imprint/);
    });

    it('validates the 4,4,3,3,2,2,2 package and exactly 2 Stones (≤ MR × 2 each)', () => {
        expect(TOWER_WIZARD_STARTING_STONES).toBe(2);
        expect(validateTowerWizardIdentity({ attributeValues: { ...ATTRS, wits: 4 } })).toMatch(/4, 4, 3, 3, 2, 2, 2/);
        expect(validateTowerWizardIdentity({ attributeValues: ATTRS, stoneAssignments: STONES })).toBeNull();
        expect(
            validateTowerWizardIdentity({ stoneAssignments: { ...STONES, might: 2, agility: 1 } }),
        ).toMatch(/exactly 2 starting Attribute Stones/);
        // Both Stones on one Attribute is legal at MR2 (cap 4); MR1 cap is 2 so still legal.
        expect(validateTowerWizardIdentity({ masteryRank: 2, stoneAssignments: { ...STONES, might: 2, agility: 0 } })).toBeNull();
    });

    it('requireComplete flags every missing early step', () => {
        const err = validateTowerWizardIdentity({}, {}, { requireComplete: true });
        expect(err).toMatch(/Choose your Echo/);
        expect(err).toMatch(/Assign your Attributes/);
        expect(err).toMatch(/Place your starting Stones/);
        expect(err).toMatch(/four Professions/);
        expect(validateTowerWizardIdentity({}, { hasEcho: true }, { requireComplete: true })).not.toMatch(/Echo\./);
    });

    it('skips identity DTO checks when skipIdentitySteps is set (Combat Package Wizard)', () => {
        const bad = { specializations: fourProfessions().slice(0, 3) };
        expect(
            validateTowerWizardSelection({ ...baseGuided, ...bad, skipIdentitySteps: true }),
        ).toBeNull();
    });

    it('still validates identity when skipIdentitySteps is not set (legacy callers)', () => {
        const bad = { specializations: fourProfessions().slice(0, 3) };
        expect(validateTowerWizardSelection({ ...baseGuided, ...bad })).toMatch(/exactly 4/i);
    });

    it('leaves existing selections without identity fields valid (legacy / import callers)', () => {
        expect(validateTowerWizardSelection(baseGuided)).toBeNull();
        expect(validateTowerWizardSelection({ ...baseGuided, skipIdentitySteps: true })).toBeNull();
    });
});

describe('DF 2026 Tower Wizard — per-step gate and view models', () => {
    it('gates each early step', () => {
        expect(validateWizardIdentityStep('echo', {}, { hasEcho: false })).toMatch(/Choose your Echo/);
        expect(validateWizardIdentityStep('echo', {}, { hasEcho: true })).toBeNull();
        expect(validateWizardIdentityStep('attributesStones', {})).not.toBeNull();
        expect(
            validateWizardIdentityStep('attributesStones', { attributeValues: ATTRS, stoneAssignments: STONES }),
        ).toBeNull();
        // Imprints are optional ("up to MR").
        expect(validateWizardIdentityStep('echoImprints', { attributeValues: ATTRS })).toBeNull();
        expect(validateWizardIdentityStep('specializations', {})).not.toBeNull();
        expect(validateWizardIdentityStep('specializations', { specializations: fourProfessions() })).toBeNull();
    });

    it('lists four candidates per eligible Attribute and locks Attributes below 4', () => {
        const groups = buildWizardImprintGroups({ attributeValues: ATTRS });
        const might = groups.find((g) => g.attribute === 'might')!;
        const wits = groups.find((g) => g.attribute === 'wits')!;
        expect(might.eligible).toBe(true);
        expect(might.imprints).toHaveLength(4);
        expect(might.tier).toBe(4);
        expect(wits.eligible).toBe(false);
        expect(wits.imprints).toHaveLength(0);
    });

    it('always offers four Rank 2 Profession rows', () => {
        const rows = buildWizardSpecRows({});
        expect(rows).toHaveLength(4);
        expect(rows.every((r) => r.rank === 2)).toBe(true);
    });

    it('warns about later steps only when Powers were already chosen', () => {
        expect(buildReconciliationPreview({}, ['attributes'])).toEqual([]);
        const lines = buildReconciliationPreview(baseGuided, ['attributes', 'imprints']);
        expect(lines.length).toBeGreaterThan(0);
        expect(lines.join(' ')).toMatch(/re-check|step through/i);
        expect(buildReconciliationPreview(baseGuided, [])).toEqual([]);
    });
});

describe('DF 2026 Tower Wizard — finalize payload', () => {
    it('writes system.specializations and system.echoImprints, never legacy skills', () => {
        const might = imprintFor('might')[0];
        const data = buildIdentityUpdateData({
            attributeValues: ATTRS,
            stoneAssignments: STONES,
            echoImprintIds: [might.id],
            specializations: fourProfessions(),
        });
        expect(data['system.echoImprints']).toEqual([might.id]);
        const specs = data['system.specializations'] as Array<{ rank: number; name: string }>;
        expect(specs).toHaveLength(4);
        expect(specs.every((s) => s.rank === 2)).toBe(true);
        expect(data['system.attributes.might.value']).toBe(4);
        expect(data['system.progression.stoneAssignments.might']).toBe(1);
        expect(Object.keys(data).some((k) => /^system\.skills/.test(k))).toBe(false);
    });

    it('omits identity keys that were never chosen', () => {
        expect(buildIdentityUpdateData({})).toEqual({});
    });

    it('prefills from an actor that already has valid identity data', () => {
        const might = imprintFor('might')[0];
        const system = {
            echo: { key: 'humans', subChoiceKey: '', veiledFormKey: '' },
            attributes: Object.fromEntries(Object.entries(ATTRS).map(([k, v]) => [k, { value: v }])),
            progression: { stoneAssignments: STONES },
            echoImprints: [might.id],
            specializations: fourProfessions(),
        };
        const prefill = readActorIdentityPrefill(system);
        expect(prefill.echoKey).toBe('humans');
        expect(prefill.attributeValues).toEqual(ATTRS);
        expect(prefill.stoneAssignments).toEqual(STONES);
        expect(prefill.echoImprintIds).toEqual([might.id]);
        expect(prefill.specializations).toHaveLength(4);
    });
});
