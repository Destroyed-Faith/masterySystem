/**
 * Tower Wizard — Echo + Echo Artifact awareness.
 *
 * Characters maintain one Active Buff at a time. Echo Artifacts already grant
 * Active Buff lines via their progression picks; the combat package must not
 * duplicate those axes without a deliberate choice (offensive/support buff, or
 * a different defensive subsystem).
 */

import type { DefensePackageId, TowerWizardSelection } from './tower-wizard-types.js';
import { buildEchoProgressionPicks, getEchoArtifact } from '../../utils/echo-artifacts.js';
import { getEchoArtifactKey, isEchoBoundArtifact } from '../../utils/echo-artifact-equip.js';
import { findCatalogEntry, powerIdentityKey } from '../../utils/power-catalog.js';
import { getDefensePackage } from './tower-wizard-packages.js';

const ECHO_LABELS: Record<string, string> = {
    humans: 'Human',
    dwarfs: 'Dwarf',
    elorians: 'Elorian',
    sentinels: 'Sentinel',
    titanborn: 'Titanborn',
    dragonborn: 'Dragonborn',
    unbound: 'Unbound',
};

/** Catalog Active Buff template → main defense axis it overlaps with. */
const ACTIVE_BUFF_DEFENSE_AXIS: Record<string, DefensePackageId> = {
    'ab-armor': 'armor',
    'ab-evade': 'evade',
    'ab-damage-reduction': 'damage-reduction',
    'ab-phasing': 'phasing',
    'ab-armor-temp-hp': 'armor',
    'ab-evade-temp-hp': 'evade',
    'ab-immovable-temp-hp': 'armor',
    'ab-armor-aura': 'armor',
};

const ALL_DEFENSE_PACKAGES: DefensePackageId[] = [
    'armor',
    'evade',
    'damage-reduction',
    'phasing',
];

const PREMIUM_ALTERNATIVES: DefensePackageId[] = ['phasing', 'damage-reduction'];

export interface EchoArtifactActiveBuff {
    artifactKey: string;
    artifactName: string;
    pickLevel: 1 | 2 | 3;
    templateId: string;
    displayName: string;
    defenseAxis: DefensePackageId | null;
}

export interface TowerWizardEchoContext {
    hasEcho: boolean;
    echoKey: string | null;
    echoLabel: string | null;
    artifactKeys: string[];
    artifactActiveBuffs: EchoArtifactActiveBuff[];
    occupiedDefenseAxes: DefensePackageId[];
}

export interface DefensePackageEchoView {
    id: DefensePackageId;
    label: string;
    explanation: string;
    warning?: string;
    echoConflict: EchoArtifactActiveBuff | null;
    echoRecommended: boolean;
}

function echoLabelForKey(echoKey: string | null | undefined): string | null {
    const key = String(echoKey || '').trim().toLowerCase();
    if (!key) return null;
    return ECHO_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

function activeBuffTemplateIdsFromPick(pick: ReturnType<typeof buildEchoProgressionPicks>[number]): string[] {
    if (pick.kind !== 'power') return [];
    if (Array.isArray(pick.stageTemplateIds) && pick.stageTemplateIds.length > 0) {
        return [...new Set(pick.stageTemplateIds.filter(Boolean))];
    }
    return pick.powerTemplateId ? [pick.powerTemplateId] : [];
}

function isActiveBuffTemplate(templateId: string): boolean {
    const entry = findCatalogEntry(templateId);
    return entry?.category === 'activeBuff';
}

/** Collect Active Buff lines granted by Echo Artifacts on this actor. */
export function collectEchoArtifactActiveBuffs(actor: Actor): EchoArtifactActiveBuff[] {
    const out: EchoArtifactActiveBuff[] = [];
    const seen = new Set<string>();

    for (const item of ((actor as any).items as any[]).filter((i) => i.type === 'artifact' && isEchoBoundArtifact(i))) {
        const artifactKey = getEchoArtifactKey(item);
        if (!artifactKey) continue;
        const def = getEchoArtifact(artifactKey);
        if (!def) continue;

        for (const pick of buildEchoProgressionPicks(def)) {
            const level = Number(pick.level);
            if (level < 1 || level > 3) continue;
            for (const templateId of activeBuffTemplateIdsFromPick(pick)) {
                if (!isActiveBuffTemplate(templateId)) continue;
                const dedupeKey = `${artifactKey}::${templateId}`;
                if (seen.has(dedupeKey)) continue;
                seen.add(dedupeKey);

                const entry = findCatalogEntry(templateId);
                out.push({
                    artifactKey,
                    artifactName: def.name,
                    pickLevel: level as 1 | 2 | 3,
                    templateId,
                    displayName: pick.displayName?.trim()
                        || entry?.templateName
                        || entry?.name
                        || templateId,
                    defenseAxis: ACTIVE_BUFF_DEFENSE_AXIS[templateId] ?? null,
                });
            }
        }
    }

    return out;
}

export function buildTowerWizardEchoContext(actor: Actor): TowerWizardEchoContext {
    const echoKey = String((actor.system as { echo?: { key?: string } })?.echo?.key || '').trim().toLowerCase()
        || null;
    const artifactActiveBuffs = collectEchoArtifactActiveBuffs(actor);
    const occupiedDefenseAxes = [
        ...new Set(
            artifactActiveBuffs
                .map((b) => b.defenseAxis)
                .filter((axis): axis is DefensePackageId => !!axis),
        ),
    ];
    const artifactKeys = [
        ...new Set(
            ((actor as any).items as any[])
                .filter((i) => i.type === 'artifact' && isEchoBoundArtifact(i))
                .map((i) => getEchoArtifactKey(i))
                .filter((k): k is string => !!k),
        ),
    ];

    return {
        hasEcho: !!echoKey,
        echoKey,
        echoLabel: echoLabelForKey(echoKey),
        artifactKeys,
        artifactActiveBuffs,
        occupiedDefenseAxes,
    };
}

export function defensePackageConflictsWithEcho(
    defenseId: DefensePackageId,
    ctx: TowerWizardEchoContext,
): EchoArtifactActiveBuff | null {
    return ctx.artifactActiveBuffs.find((b) => b.defenseAxis === defenseId) ?? null;
}

/** Defense packages that complement (rather than duplicate) Echo Artifact Active Buffs. */
export function recommendDefensePackages(ctx: TowerWizardEchoContext): DefensePackageId[] {
    if (ctx.occupiedDefenseAxes.length === 0) return [...ALL_DEFENSE_PACKAGES];

    const occupied = new Set(ctx.occupiedDefenseAxes);
    const premium = PREMIUM_ALTERNATIVES.filter((id) => !occupied.has(id));
    const rest = ALL_DEFENSE_PACKAGES.filter((id) => !occupied.has(id) && !premium.includes(id));
    return [...premium, ...rest];
}

export function buildDefensePackagesWithEcho(ctx: TowerWizardEchoContext): DefensePackageEchoView[] {
    const recommended = new Set(recommendDefensePackages(ctx));
    return ALL_DEFENSE_PACKAGES.map((id) => {
        const pkg = getDefensePackage(id)!;
        return {
            id,
            label: pkg.label,
            explanation: pkg.explanation,
            warning: pkg.warning,
            echoConflict: defensePackageConflictsWithEcho(id, ctx),
            echoRecommended: ctx.occupiedDefenseAxes.length > 0 && recommended.has(id),
        };
    });
}

export function collectArtifactActiveBuffIdentityKeys(ctx: TowerWizardEchoContext): Set<string> {
    const keys = new Set<string>();
    for (const buff of ctx.artifactActiveBuffs) {
        const key = powerIdentityKey({
            templateId: buff.templateId,
            category: 'activeBuff',
            chosenSpecial: null,
        });
        if (key) keys.add(key);
    }
    return keys;
}

export function validateEchoRequiredForTowerWizard(ctx: TowerWizardEchoContext): string | null {
    if (ctx.hasEcho) return null;
    return 'Select your Echo in the Echo dialog before building your combat package. Your Echo Artifacts determine which Active Buffs you already carry.';
}

export function collectEchoAdvisorWarnings(
    selection: Partial<TowerWizardSelection>,
    ctx: TowerWizardEchoContext,
): string[] {
    const out: string[] = [];
    const echoRequired = validateEchoRequiredForTowerWizard(ctx);
    if (echoRequired) {
        out.push(echoRequired);
        return out;
    }

    if (ctx.artifactActiveBuffs.length === 0) return out;

    for (const buff of ctx.artifactActiveBuffs) {
        const axisNote = buff.defenseAxis
            ? ` (same defensive axis as the ${buff.defenseAxis.replace('-', ' ')} package)`
            : '';
        out.push(
            `${buff.artifactName} already grants ${buff.displayName} as an Active Buff${axisNote}. You only maintain one Active Buff at a time.`,
        );
    }

    const defenseId = selection.defenseId;
    if (defenseId && (selection.activeBuffMode ?? 'defensive') === 'defensive') {
        const conflict = defensePackageConflictsWithEcho(defenseId, ctx);
        if (conflict) {
            const pkg = getDefensePackage(defenseId);
            out.push(
                `Your ${pkg?.label.split('.')[0] ?? defenseId} package adds another defensive Active Buff, but ${conflict.artifactName} already covers that role. Consider Phasing or Damage Reduction, Conditional Passives for Passive slots, or switching your package Active Buff to offensive or support.`,
            );
        }
    }

    const activeBuffOverride = selection.powerOverrides?.find((o) => o.grantKey === 'active-buff');
    if (activeBuffOverride?.templateId) {
        const duplicate = ctx.artifactActiveBuffs.find((b) => b.templateId === activeBuffOverride.templateId);
        if (duplicate) {
            out.push(
                `Your chosen Active Buff duplicates ${duplicate.artifactName}'s ${duplicate.displayName}. Pick a different role or use an offensive/support Active Buff.`,
            );
        }
    }

    return [...new Set(out)];
}

export function buildEchoAdvisorSummary(ctx: TowerWizardEchoContext): string | null {
    if (!ctx.hasEcho) return null;
    if (ctx.artifactActiveBuffs.length === 0) {
        return ctx.artifactKeys.length > 0
            ? `Echo: ${ctx.echoLabel}. Your Echo Artifacts do not grant a maintained Active Buff line — any defensive package works.`
            : `Echo: ${ctx.echoLabel}. No Echo Artifacts selected yet.`;
    }
    const buffList = ctx.artifactActiveBuffs
        .map((b) => `${b.artifactName} → ${b.displayName}`)
        .join('; ');
    const rec = recommendDefensePackages(ctx)
        .slice(0, 2)
        .map((id) => getDefensePackage(id)?.label.split('.')[0] ?? id)
        .join(' or ');
    return `Echo: ${ctx.echoLabel}. Artifact Active Buffs: ${buffList}. Recommended main defense: ${rec}.`;
}
