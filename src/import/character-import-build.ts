/**
 * Pure helpers to turn a homepage import payload into Foundry actor/item data.
 * No Foundry globals — safe for unit tests.
 */

import {
  buildPackageGrantSpecs,
  buildPackageGrantSpecsFromOverrides,
  isManualBuildMode,
} from '../creation/tower-wizard/tower-wizard-packages.js';
import type { TowerWizardSelection } from '../creation/tower-wizard/tower-wizard-types.js';
import {
  CREATION_MASTERY_RANK,
  CREATION_POWER_TOTAL,
  findCatalogEntry,
} from '../utils/power-catalog.js';
import {
  buildPowerItemFromCatalogEntry,
  type PowerGrantSpec,
} from '../utils/power-item-builder.js';
import { getGeneralArtifact } from '../utils/general-artifacts.js';
import { ECHO_ARTIFACTS } from '../utils/echo-artifacts.js';
import { buildFreshTraitUses, getEcho } from '../utils/echos/index.js';
import {
  getUnboundIdentity,
  resolveUnboundArtifactKey,
} from '../utils/echos/unbound-identities.js';
import { normalizeKnownLanguages } from '../utils/languages.js';
import {
  calculateDisadvantagePoints,
  getDisadvantageDefinition,
} from '../system/disadvantages.js';
import { getMinorExpressionDefinition } from '../utils/minor-expressions.js';
import { SKILLS } from '../utils/skills.js';
import type {
  CharacterImportArtifact,
  CharacterImportAttributeKey,
  CharacterImportDisadvantage,
  CharacterImportGearItem,
  CharacterImportPayload,
} from './character-import-types.js';
import { CHARACTER_IMPORT_ATTRIBUTE_KEYS } from './character-import-types.js';

export function normalizeImportAttributes(
  raw: Partial<Record<CharacterImportAttributeKey, number>> | undefined,
): Record<CharacterImportAttributeKey, number> {
  const out = {} as Record<CharacterImportAttributeKey, number>;
  for (const key of CHARACTER_IMPORT_ATTRIBUTE_KEYS) {
    const n = Math.floor(Number(raw?.[key]));
    out[key] = Number.isFinite(n) ? Math.max(2, Math.min(80, n)) : 2;
  }
  return out;
}

export function isKnownArtifactImportKey(key: string): boolean {
  const k = String(key || '').trim();
  if (!k) return false;
  return !!getGeneralArtifact(k) || k in ECHO_ARTIFACTS;
}

/**
 * Echo Artifact keys to grant echo-bound (same resolution as the Echo dialog):
 * Unbound resolves from identity + predator stone; everyone else uses the
 * explicit `echo.artifactKeys` list.
 */
export function resolveEchoArtifactImportKeys(payload: CharacterImportPayload): string[] {
  const echo = payload.echo;
  if (!echo?.key) return [];
  if (echo.key === 'unbound') {
    const autoKey = resolveUnboundArtifactKey(echo.subChoiceKey, echo.predatorStone ?? null);
    return autoKey ? [autoKey] : [];
  }
  if (!Array.isArray(echo.artifactKeys)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of echo.artifactKeys) {
    const key = String(raw ?? '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function resolvePowerGrantSpecs(payload: CharacterImportPayload): PowerGrantSpec[] | null {
  if (Array.isArray(payload.powers) && payload.powers.length > 0) {
    return payload.powers;
  }
  const pkg = payload.combatPackage;
  if (!pkg) return null;
  if (isManualBuildMode(pkg)) {
    return buildPackageGrantSpecsFromOverrides(pkg as TowerWizardSelection);
  }
  return buildPackageGrantSpecs(pkg as TowerWizardSelection);
}

export function buildPowerItemsFromGrantSpecs(specs: PowerGrantSpec[]): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];
  for (const spec of specs) {
    const entry = findCatalogEntry(spec.templateId, spec.special ?? null);
    if (!entry) {
      throw new Error(`Catalog entry not found: ${spec.templateId}${spec.special ? ` (${spec.special})` : ''}`);
    }
    const itemData = buildPowerItemFromCatalogEntry(entry, spec.rank, {
      isSpell: !!spec.isSpell,
      castingAttribute: spec.castingAttribute,
      spellResolution: spec.spellResolution,
    });
    if (!itemData) {
      throw new Error(`Rank ${spec.rank} missing for ${entry.name}`);
    }
    items.push(itemData);
  }
  return items;
}

export function buildGearItemData(gear: CharacterImportGearItem): Record<string, unknown> {
  return {
    name: String(gear.name || 'Item').trim(),
    type: 'gear',
    system: {
      description: String(gear.description ?? ''),
      inventorySize: String(gear.inventorySize ?? '1x1'),
      quantity: Math.max(1, Math.floor(Number(gear.quantity) || 1)),
      equipSlots: [],
      equipped: false,
    },
  };
}

export function isKnownSkillKey(key: string): boolean {
  return key in SKILLS;
}

export function isKnownMinorExpressionId(id: string): boolean {
  return !!getMinorExpressionDefinition(id);
}

/** Turn homepage disadvantage shorthand into actor `system.disadvantages` rows. */
export function normalizeDisadvantageEntries(
  raw: Array<string | CharacterImportDisadvantage> | undefined,
): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  const out: Record<string, unknown>[] = [];
  for (const entry of raw) {
    if (typeof entry === 'string') {
      const id = entry.trim();
      const def = getDisadvantageDefinition(id);
      if (!def) continue;
      const details: Record<string, unknown> = {};
      const points = calculateDisadvantagePoints(id, details);
      out.push({
        id: def.id,
        name: def.name,
        points,
        details,
        description: def.description,
      });
      continue;
    }
    if (!entry || typeof entry !== 'object') continue;
    const id = String(entry.id ?? '').trim();
    const def = getDisadvantageDefinition(id);
    if (!def) continue;
    const details = { ...(entry.details ?? {}) } as Record<string, unknown>;
    const points =
      Number.isFinite(Number(entry.points)) && Number(entry.points) > 0
        ? Math.floor(Number(entry.points))
        : calculateDisadvantagePoints(id, details);
    out.push({
      id: def.id,
      name: def.name,
      points,
      details,
      description: def.description,
    });
  }
  return out;
}

export function disadvantagePointsTotal(disadvantages: Record<string, unknown>[]): number {
  return disadvantages.reduce((sum, d) => sum + Math.max(0, Math.floor(Number(d.points) || 0)), 0);
}

export function normalizeSkillRanks(raw: Record<string, number> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [key, value] of Object.entries(raw)) {
    if (!isKnownSkillKey(key)) continue;
    const rank = Math.max(0, Math.floor(Number(value) || 0));
    if (rank > 0) out[key] = rank;
  }
  return out;
}

export function normalizeMinorExpressionIds(
  raw: string[] | undefined,
  masteryRank: number,
): string[] {
  if (!Array.isArray(raw)) return [];
  const cap = Math.max(0, Math.floor(masteryRank));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const rawId of raw) {
    const id = String(rawId ?? '').trim();
    if (!id || seen.has(id) || !isKnownMinorExpressionId(id)) continue;
    if (out.length >= cap) break;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export function buildActorSystemFromPayload(payload: CharacterImportPayload): Record<string, unknown> {
  const attrs = normalizeImportAttributes(payload.attributes);
  const masteryRank = Math.max(
    1,
    Math.min(8, Math.floor(Number(payload.masteryRank) || CREATION_MASTERY_RANK)),
  );
  const echo = payload.echo ?? { key: '' };

  const attributeBlock = Object.fromEntries(
    CHARACTER_IMPORT_ATTRIBUTE_KEYS.map((key) => [
      key,
      { value: attrs[key], stones: Math.floor(attrs[key] / 8) },
    ]),
  );

  const stonePools = Object.fromEntries(
    CHARACTER_IMPORT_ATTRIBUTE_KEYS.map((key) => {
      const max = Math.floor(attrs[key] / 8);
      return [key, { current: max, max, sustained: 0 }];
    }),
  );

  const skills = normalizeSkillRanks(payload.skills);
  const skillsSpent = normalizeSkillRanks(payload.skillsSpent);
  const disadvantages = normalizeDisadvantageEntries(payload.disadvantages);
  const minorExpressions = normalizeMinorExpressionIds(payload.minorExpressions, masteryRank);
  const faithPts = disadvantagePointsTotal(disadvantages);

  // Same derivations as the in-game Echo dialog: display name (incl. Unbound
  // identity), fresh trait uses, and echo-locked languages.
  const echoKey = String(echo.key ?? '');
  const echoDef = getEcho(echoKey);
  const unboundIdentity = echoKey === 'unbound' ? getUnboundIdentity(echo.subChoiceKey) : undefined;
  const bioEcho = echoDef
    ? unboundIdentity
      ? `${echoDef.name} — ${unboundIdentity.name}`
      : echoDef.name
    : echoKey;
  const traitUses = echoDef
    ? buildFreshTraitUses(echoKey, echo.subChoiceKey || null, masteryRank)
    : {};
  const knownLanguages = normalizeKnownLanguages(
    Array.isArray(payload.languages?.known) ? [...payload.languages!.known!] : ['common'],
    echoKey || null,
    { replaceExtras: false },
  ).cleaned;

  return {
    bio: {
      name: String(payload.name || '').trim(),
      echo: bioEcho,
      concept: String(payload.bio?.concept ?? ''),
      appearance: String(payload.bio?.appearance ?? ''),
      notes: String(payload.bio?.notes ?? ''),
    },
    echo: {
      key: echoKey,
      subChoiceKey: String(echo.subChoiceKey ?? ''),
      veiledFormKey: String(echo.veiledFormKey ?? ''),
      selectedCardIds: Array.isArray(echo.selectedCardIds) ? [...echo.selectedCardIds] : [],
      cardUses: {},
      traitUses,
      unboundShape: String(echo.unboundShape ?? ''),
    },
    attributes: attributeBlock,
    stonePools,
    mastery: { rank: masteryRank, points: 0, experience: 0 },
    skills,
    skillsSpent,
    disadvantages,
    minorExpressions,
    languages: {
      known: knownLanguages,
    },
    creation: {
      complete: payload.creationComplete !== false,
      importSource: 'homepage',
      importSchemaVersion: 1,
      disadvantagesReviewed: disadvantages.length > 0,
      equipmentReviewed: payload.creationComplete !== false,
      // Same bookkeeping as applyTowerWizardPackage, so post-import rebuilds
      // recognise the package the character was created with.
      towerWizardPackageId:
        payload.combatPackage?.offenseActivePicks?.length === 2
          ? `${payload.combatPackage.defenseId}__${payload.combatPackage.offenseActivePicks[0].pickId}__${payload.combatPackage.offenseActivePicks[1].pickId}`
          : '',
    },
    conditions: [],
    notes: {
      schticks: '',
      faithFractures: '',
      background: '',
    },
    faithFractures: { current: faithPts, maximum: faithPts },
    schticks: { ranks: [] },
    familiars: [],
    ...(payload.systemOverrides ?? {}),
  };
}

export function buildActorCreateDataFromPayload(payload: CharacterImportPayload): Record<string, unknown> {
  return {
    name: String(payload.name || '').trim(),
    type: 'character',
    img: payload.img || 'icons/svg/mystery-man.svg',
    folder: payload.folder ?? null,
    system: buildActorSystemFromPayload(payload),
    flags: {
      'mastery-system': {
        importSource: 'homepage',
        importSchemaVersion: 1,
      },
    },
  };
}

export function validateArtifactImportSpec(spec: CharacterImportArtifact): string | null {
  const key = String(spec?.key ?? '').trim();
  if (!key) return 'Artifact entry is missing `key`.';
  if (!isKnownArtifactImportKey(key)) return `Unknown artifact key "${key}".`;
  const level = Number(spec.level ?? 1);
  if (!Number.isFinite(level) || level < 1 || level > 10) {
    return `Artifact "${key}" level must be 1–10.`;
  }
  return null;
}

export function expectedPowerCount(): number {
  return CREATION_POWER_TOTAL;
}
