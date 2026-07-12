/**
 * Tower Wizard — Echo + Echo Artifact awareness.
 *
 * Characters maintain one Active Buff at a time. Echo Artifacts already grant
 * Active Buff lines via their progression picks; the combat package must not
 * duplicate those axes without a deliberate choice (offensive/support buff, or
 * a different defensive subsystem).
 */
import { buildEchoProgressionPicks, getEchoArtifact } from '../../utils/echo-artifacts.js';
import { getEchoArtifactKey, isEchoBoundArtifact } from '../../utils/echo-artifact-equip.js';
import { findCatalogEntry, powerIdentityKey } from '../../utils/power-catalog.js';
import { getDefensePackage } from './tower-wizard-packages.js';
const ECHO_LABELS = {
    humans: 'Human',
    dwarfs: 'Dwarf',
    elorians: 'Elorian',
    sentinels: 'Sentinel',
    titanborn: 'Titanborn',
    dragonborn: 'Dragonborn',
    unbound: 'Unbound',
};
/** Catalog Active Buff template → main defense axis it overlaps with. */
const ACTIVE_BUFF_DEFENSE_AXIS = {
    'ab-armor': 'armor',
    'ab-evade': 'evade',
    'ab-damage-reduction': 'damage-reduction',
    'ab-phasing': 'phasing',
    'ab-armor-temp-hp': 'armor',
    'ab-evade-temp-hp': 'evade',
    'ab-immovable-temp-hp': 'armor',
    'ab-armor-aura': 'armor',
};
const ALL_DEFENSE_PACKAGES = [
    'armor',
    'evade',
    'damage-reduction',
    'phasing',
];
const PREMIUM_ALTERNATIVES = ['phasing', 'damage-reduction'];
function echoLabelForKey(echoKey) {
    const key = String(echoKey || '').trim().toLowerCase();
    if (!key)
        return null;
    return ECHO_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}
function activeBuffTemplateIdsFromPick(pick) {
    if (pick.kind !== 'power')
        return [];
    if (Array.isArray(pick.stageTemplateIds) && pick.stageTemplateIds.length > 0) {
        return [...new Set(pick.stageTemplateIds.filter(Boolean))];
    }
    return pick.powerTemplateId ? [pick.powerTemplateId] : [];
}
function isActiveBuffTemplate(templateId) {
    const entry = findCatalogEntry(templateId);
    return entry?.category === 'activeBuff';
}
/** Collect Active Buff lines granted by Echo Artifacts on this actor. */
export function collectEchoArtifactActiveBuffs(actor) {
    const out = [];
    const seen = new Set();
    for (const item of actor.items.filter((i) => i.type === 'artifact' && isEchoBoundArtifact(i))) {
        const artifactKey = getEchoArtifactKey(item);
        if (!artifactKey)
            continue;
        const def = getEchoArtifact(artifactKey);
        if (!def)
            continue;
        for (const pick of buildEchoProgressionPicks(def)) {
            const level = Number(pick.level);
            if (level < 1 || level > 3)
                continue;
            for (const templateId of activeBuffTemplateIdsFromPick(pick)) {
                if (!isActiveBuffTemplate(templateId))
                    continue;
                const dedupeKey = `${artifactKey}::${templateId}`;
                if (seen.has(dedupeKey))
                    continue;
                seen.add(dedupeKey);
                const entry = findCatalogEntry(templateId);
                out.push({
                    artifactKey,
                    artifactName: def.name,
                    pickLevel: level,
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
export function buildTowerWizardEchoContext(actor) {
    const echoKey = String(actor.system?.echo?.key || '').trim().toLowerCase()
        || null;
    const artifactActiveBuffs = collectEchoArtifactActiveBuffs(actor);
    const occupiedDefenseAxes = [
        ...new Set(artifactActiveBuffs
            .map((b) => b.defenseAxis)
            .filter((axis) => !!axis)),
    ];
    const artifactKeys = [
        ...new Set(actor.items
            .filter((i) => i.type === 'artifact' && isEchoBoundArtifact(i))
            .map((i) => getEchoArtifactKey(i))
            .filter((k) => !!k)),
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
export function defensePackageConflictsWithEcho(defenseId, ctx) {
    return ctx.artifactActiveBuffs.find((b) => b.defenseAxis === defenseId) ?? null;
}
/** Defense packages that complement (rather than duplicate) Echo Artifact Active Buffs. */
export function recommendDefensePackages(ctx) {
    if (ctx.occupiedDefenseAxes.length === 0)
        return [...ALL_DEFENSE_PACKAGES];
    const occupied = new Set(ctx.occupiedDefenseAxes);
    const premium = PREMIUM_ALTERNATIVES.filter((id) => !occupied.has(id));
    const rest = ALL_DEFENSE_PACKAGES.filter((id) => !occupied.has(id) && !premium.includes(id));
    return [...premium, ...rest];
}
export function buildDefensePackagesWithEcho(ctx) {
    const recommended = new Set(recommendDefensePackages(ctx));
    return ALL_DEFENSE_PACKAGES.map((id) => {
        const pkg = getDefensePackage(id);
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
export function collectArtifactActiveBuffIdentityKeys(ctx) {
    const keys = new Set();
    for (const buff of ctx.artifactActiveBuffs) {
        const key = powerIdentityKey({
            templateId: buff.templateId,
            category: 'activeBuff',
            chosenSpecial: null,
        });
        if (key)
            keys.add(key);
    }
    return keys;
}
export function validateEchoRequiredForTowerWizard(ctx) {
    if (ctx.hasEcho)
        return null;
    return 'Select your Echo in the Echo dialog before building your combat package. Your Echo Artifacts determine which Active Buffs you already carry.';
}
export function collectEchoAdvisorWarnings(selection, ctx) {
    const out = [];
    const echoRequired = validateEchoRequiredForTowerWizard(ctx);
    if (echoRequired) {
        out.push(echoRequired);
        return out;
    }
    if (ctx.artifactActiveBuffs.length === 0)
        return out;
    for (const buff of ctx.artifactActiveBuffs) {
        const axisNote = buff.defenseAxis
            ? ` (same defensive axis as the ${buff.defenseAxis.replace('-', ' ')} package)`
            : '';
        out.push(`${buff.artifactName} already grants ${buff.displayName} as an Active Buff${axisNote}. You only maintain one Active Buff at a time.`);
    }
    const defenseId = selection.defenseId;
    if (defenseId && (selection.activeBuffMode ?? 'defensive') === 'defensive') {
        const conflict = defensePackageConflictsWithEcho(defenseId, ctx);
        if (conflict) {
            const pkg = getDefensePackage(defenseId);
            out.push(`Your ${pkg?.label.split('.')[0] ?? defenseId} package adds another defensive Active Buff, but ${conflict.artifactName} already covers that role. Consider Phasing or Damage Reduction, Conditional Passives for Passive slots, or switching your package Active Buff to offensive or support.`);
        }
    }
    const activeBuffOverride = selection.powerOverrides?.find((o) => o.grantKey === 'active-buff');
    if (activeBuffOverride?.templateId) {
        const duplicate = ctx.artifactActiveBuffs.find((b) => b.templateId === activeBuffOverride.templateId);
        if (duplicate) {
            out.push(`Your chosen Active Buff duplicates ${duplicate.artifactName}'s ${duplicate.displayName}. Pick a different role or use an offensive/support Active Buff.`);
        }
    }
    return [...new Set(out)];
}
export function buildEchoAdvisorSummary(ctx) {
    if (!ctx.hasEcho)
        return null;
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
//# sourceMappingURL=tower-wizard-echo-advisor.js.map