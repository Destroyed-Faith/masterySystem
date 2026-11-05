/**
 * Central power identity resolution (Batch B / plan §7.2).
 * Reads only structured identity fields — never name/description/text.
 * Does not execute mechanics (I2).
 */

import type { PowerCategory, PowerMechanics } from '../types/item.js';
import { getTemplate, type PowerTemplate } from './powers/templates/index.js';
import {
  ARTIFACT_FUNCTION_CONTRACT,
  isArtifactFunctionId,
  type ArtifactFunctionId,
} from './artifact-functions.js';
import { resolvePowerMechanicsById } from './power-mechanics.js';

export type PowerIdentitySource =
  | { kind: 'power-item'; item: any }
  | { kind: 'artifact-row'; artifact?: any; row: any }
  | { kind: 'active-effect'; effect: any }
  | { kind: 'radial-option'; option: any };

export type UnresolvedIdentityReason =
  | 'missing-identity'
  | 'unknown-template-id'
  | 'unknown-artifact-function-id'
  | 'artifact-function-contract-violation'
  | 'rank-missing'
  | 'rank-out-of-range'
  | 'category-conflict'
  | 'special-key-unknown';

export type UnresolvedSeverity = 'blocks-activation' | 'omits-contribution' | 'informational';

export interface ResolvedPowerIdentity {
  ok: true;
  templateId: string | null;
  template: PowerTemplate | null;
  category: PowerCategory;
  subfamily: string | null;
  rank: number;
  chosenSpecialKey: string | null;
  mechanics: PowerMechanics | null;
  limited: boolean;
  isSpell: boolean;
  artifactFunctionId: ArtifactFunctionId | null;
  artifactLevel: number | null;
  source: PowerIdentitySource['kind'];
}

export interface UnresolvedPowerIdentity {
  ok: false;
  reason: UnresolvedIdentityReason;
  severity: UnresolvedSeverity;
  diagnostic: string;
  ref: {
    actorId?: string;
    actorName?: string;
    itemId?: string;
    itemName?: string;
    effectId?: string;
    echoArtifactKey?: string;
    rowLevel?: number;
  };
  suggestedIdentity?: {
    templateId?: string;
    artifactFunctionId?: ArtifactFunctionId;
    rank?: number;
    basis: 'echoArtifactKey+level' | 'flags.powerId' | 'templateName-exact';
  };
}

export type PowerIdentityResult = ResolvedPowerIdentity | UnresolvedPowerIdentity;

function clampRank(raw: unknown): number | null {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const r = Math.floor(n);
  if (r < 1 || r > 16) return null;
  return r;
}

function severityFor(reason: UnresolvedIdentityReason, source: PowerIdentitySource['kind']): UnresolvedSeverity {
  if (reason === 'missing-identity' || reason === 'unknown-template-id' || reason === 'unknown-artifact-function-id') {
    return source === 'active-effect' ? 'omits-contribution' : 'blocks-activation';
  }
  if (reason === 'artifact-function-contract-violation' || reason === 'rank-missing' || reason === 'rank-out-of-range' || reason === 'category-conflict') {
    return 'blocks-activation';
  }
  return 'informational';
}

function unresolved(
  reason: UnresolvedIdentityReason,
  diagnostic: string,
  source: PowerIdentitySource['kind'],
  ref: UnresolvedPowerIdentity['ref'] = {},
  suggestedIdentity?: UnresolvedPowerIdentity['suggestedIdentity'],
): UnresolvedPowerIdentity {
  return {
    ok: false,
    reason,
    severity: severityFor(reason, source),
    diagnostic,
    ref,
    ...(suggestedIdentity ? { suggestedIdentity } : {}),
  };
}

function readPowerItemFields(item: any): {
  templateId: string | null;
  rankRaw: unknown;
  chosenSpecialKey: string | null;
  limited: boolean;
  isSpell: boolean;
  categoryRaw: string | null;
  artifactFunctionId: string | null;
  ref: UnresolvedPowerIdentity['ref'];
} {
  const sys = item?.system ?? {};
  const chosen =
    sys.chosenSpecial?.key ??
    (typeof sys.chosenSpecialKey === 'string' ? sys.chosenSpecialKey : null);
  return {
    templateId: sys.templateId ? String(sys.templateId).trim() : null,
    rankRaw: sys.rank ?? sys.level,
    chosenSpecialKey: chosen ? String(chosen) : null,
    limited: sys.limited === true,
    isSpell: sys.isSpell === true,
    categoryRaw: sys.category ? String(sys.category) : null,
    artifactFunctionId: sys.artifactFunctionId ? String(sys.artifactFunctionId) : null,
    ref: {
      itemId: item?.id ? String(item.id) : undefined,
      itemName: item?.name ? String(item.name) : undefined,
    },
  };
}

function readArtifactRowFields(artifact: any, row: any): {
  templateId: string | null;
  rankRaw: unknown;
  chosenSpecialKey: string | null;
  limited: boolean;
  isSpell: boolean;
  artifactFunctionId: string | null;
  artifactLevel: number | null;
  ref: UnresolvedPowerIdentity['ref'];
} {
  const flags = artifact?.flags?.['mastery-system'] ?? {};
  const lvl = Number(row?.level);
  return {
    templateId: row?.powerTemplateId ? String(row.powerTemplateId).trim() : null,
    rankRaw: row?.rank,
    chosenSpecialKey: row?.chosenSpecialKey ? String(row.chosenSpecialKey) : null,
    limited: row?.limited === true,
    isSpell: row?.isSpell === true,
    artifactFunctionId: row?.artifactFunctionId ? String(row.artifactFunctionId) : null,
    artifactLevel: Number.isFinite(lvl) ? Math.floor(lvl) : null,
    ref: {
      itemId: artifact?.id ? String(artifact.id) : undefined,
      itemName: artifact?.name ? String(artifact.name) : undefined,
      echoArtifactKey: flags.echoArtifactKey ? String(flags.echoArtifactKey) : undefined,
      rowLevel: Number.isFinite(lvl) ? Math.floor(lvl) : undefined,
    },
  };
}

function readEffectFields(effect: any): {
  templateId: string | null;
  rankRaw: unknown;
  chosenSpecialKey: string | null;
  limited: boolean;
  isSpell: boolean;
  artifactFunctionId: string | null;
  ref: UnresolvedPowerIdentity['ref'];
} {
  const flags = effect?.flags?.['mastery-system'] ?? {};
  return {
    templateId: flags.powerTemplateId ? String(flags.powerTemplateId).trim() : null,
    rankRaw: flags.rank,
    chosenSpecialKey: null,
    limited: false,
    isSpell: false,
    artifactFunctionId: flags.artifactFunctionId ? String(flags.artifactFunctionId) : null,
    ref: {
      effectId: effect?.id ? String(effect.id) : undefined,
      itemName: effect?.name ? String(effect.name) : undefined,
    },
  };
}

function readRadialOptionFields(option: any): {
  templateId: string | null;
  rankRaw: unknown;
  chosenSpecialKey: string | null;
  limited: boolean;
  isSpell: boolean;
  artifactFunctionId: string | null;
  artifactLevel: number | null;
  ref: UnresolvedPowerIdentity['ref'];
} {
  const item = option?.item;
  if (item && (item.type === 'power' || item.system?.templateId)) {
    const base = readPowerItemFields(item);
    return {
      ...base,
      artifactFunctionId:
        option.artifactFunctionId
          ? String(option.artifactFunctionId)
          : base.artifactFunctionId,
      artifactLevel:
        option.artifactRowLevel != null && Number.isFinite(Number(option.artifactRowLevel))
          ? Math.floor(Number(option.artifactRowLevel))
          : null,
    };
  }
  return {
    templateId: option?.artifactPowerTemplateId
      ? String(option.artifactPowerTemplateId).trim()
      : null,
    rankRaw: option?.rank ?? option?.powerLevel,
    chosenSpecialKey: option?.artifactChosenSpecialKey
      ? String(option.artifactChosenSpecialKey)
      : null,
    limited: option?.limited === true,
    isSpell: option?.artifactIsSpell === true,
    artifactFunctionId: option?.artifactFunctionId ? String(option.artifactFunctionId) : null,
    artifactLevel:
      option?.artifactRowLevel != null && Number.isFinite(Number(option.artifactRowLevel))
        ? Math.floor(Number(option.artifactRowLevel))
        : null,
    ref: {
      itemName: option?.name ? String(option.name) : undefined,
      rowLevel:
        option?.artifactRowLevel != null && Number.isFinite(Number(option.artifactRowLevel))
          ? Math.floor(Number(option.artifactRowLevel))
          : undefined,
    },
  };
}

function normalizeCategory(raw: string | null | undefined): PowerCategory | null {
  if (!raw) return null;
  const s = String(raw).trim().toLowerCase().replace(/[\s_]+/g, '-');
  if (s === 'active') return 'active';
  if (s === 'activebuff' || s === 'active-buff' || s === 'buff') return 'activeBuff';
  if (s === 'reaction') return 'reaction';
  if (s === 'passive') return 'passive';
  if (s === 'movement') return 'movement';
  return null;
}

/**
 * Resolve a structured power identity. Never reads name/description/effect text.
 */
export function resolvePowerIdentity(source: PowerIdentitySource): PowerIdentityResult {
  let fields: {
    templateId: string | null;
    rankRaw: unknown;
    chosenSpecialKey: string | null;
    limited: boolean;
    isSpell: boolean;
    categoryRaw?: string | null;
    artifactFunctionId: string | null;
    artifactLevel?: number | null;
    ref: UnresolvedPowerIdentity['ref'];
  };

  switch (source.kind) {
    case 'power-item':
      fields = readPowerItemFields(source.item);
      break;
    case 'artifact-row':
      fields = readArtifactRowFields(source.artifact, source.row);
      break;
    case 'active-effect':
      fields = readEffectFields(source.effect);
      break;
    case 'radial-option':
      fields = readRadialOptionFields(source.option);
      break;
    default:
      return unresolved('missing-identity', 'Unknown identity source kind.', 'power-item');
  }

  const fnRaw = fields.artifactFunctionId;
  const fnId = fnRaw && isArtifactFunctionId(fnRaw) ? fnRaw : null;
  if (fnRaw && !fnId) {
    return unresolved(
      'unknown-artifact-function-id',
      `Unknown artifactFunctionId "${fnRaw}".`,
      source.kind,
      fields.ref,
    );
  }

  const templateId = fields.templateId;
  if (!templateId && !fnId) {
    return unresolved(
      'missing-identity',
      'Neither powerTemplateId/templateId nor artifactFunctionId is set.',
      source.kind,
      fields.ref,
    );
  }

  if (fnId) {
    const contract = ARTIFACT_FUNCTION_CONTRACT[fnId];
    if (contract.klass === 'K3') {
      if (!templateId || templateId !== contract.requiresTemplateId) {
        return unresolved(
          'artifact-function-contract-violation',
          `K3 function "${fnId}" requires templateId "${contract.requiresTemplateId}", got "${templateId ?? 'null'}".`,
          source.kind,
          fields.ref,
        );
      }
    } else if (contract.klass === 'K2' && templateId) {
      return unresolved(
        'artifact-function-contract-violation',
        `K2 function "${fnId}" must not set powerTemplateId (got "${templateId}").`,
        source.kind,
        fields.ref,
      );
    }

    if (contract.klass === 'K2') {
      const artifactLevel = fields.artifactLevel ?? null;
      return {
        ok: true,
        templateId: null,
        template: null,
        category: contract.category === 'inherit' ? 'passive' : contract.category,
        subfamily: null,
        rank: 1,
        chosenSpecialKey: null,
        mechanics: null,
        limited: false,
        isSpell: false,
        artifactFunctionId: fnId,
        artifactLevel,
        source: source.kind,
      };
    }
  }

  // K1 or K3 with template
  if (!templateId) {
    return unresolved(
      'missing-identity',
      'Catalog templateId is required for this identity class.',
      source.kind,
      fields.ref,
    );
  }

  const template = getTemplate(templateId) as PowerTemplate | undefined;
  if (!template) {
    return unresolved(
      'unknown-template-id',
      `Unknown templateId "${templateId}".`,
      source.kind,
      fields.ref,
    );
  }

  let rank = clampRank(fields.rankRaw);
  if (rank == null && source.kind === 'artifact-row') {
    // Standard stage mapping from artifact level (plan: stagePowerLevels default 4/10/16).
    // Not text-derived — purely from numeric row.level / artifactLevel.
    const artLvl = fields.artifactLevel ?? fields.ref.rowLevel ?? null;
    if (artLvl != null && artLvl >= 1 && artLvl <= 9) {
      const stage = Math.floor((artLvl - 1) / 3); // 0,1,2
      rank = ([4, 10, 16] as const)[stage];
    } else if (artLvl === 10) {
      // Ultimate rows rarely use catalog ranks; leave unresolved if rank required.
      return unresolved(
        'rank-missing',
        `Artifact L10 row for template "${templateId}" has no numeric rank.`,
        source.kind,
        fields.ref,
      );
    } else {
      return unresolved(
        'rank-missing',
        `Artifact row for template "${templateId}" has no numeric rank.`,
        source.kind,
        fields.ref,
      );
    }
  }
  if (rank == null) {
    // Power items historically default to 1; treat missing as out-of-range only when explicitly invalid.
    if (fields.rankRaw == null || fields.rankRaw === '') {
      rank = 1;
    } else {
      return unresolved(
        'rank-out-of-range',
        `Rank "${String(fields.rankRaw)}" is not in 1..16.`,
        source.kind,
        fields.ref,
      );
    }
  }

  const itemCategory = normalizeCategory(fields.categoryRaw ?? null);
  if (itemCategory && itemCategory !== template.category) {
    return unresolved(
      'category-conflict',
      `Item category "${itemCategory}" conflicts with template.category "${template.category}".`,
      source.kind,
      fields.ref,
    );
  }

  const mechanics = resolvePowerMechanicsById(templateId, rank);
  const limited = fields.limited === true || template.limited === true;

  return {
    ok: true,
    templateId,
    template,
    category: template.category,
    subfamily: template.subfamily ?? null,
    rank,
    chosenSpecialKey: fields.chosenSpecialKey,
    mechanics,
    limited,
    isSpell: fields.isSpell === true,
    artifactFunctionId: fnId,
    artifactLevel: fields.artifactLevel ?? null,
    source: source.kind,
  };
}

/** Derive radial segment for an active-category identity (plan §7.5). */
export function deriveActiveSegment(
  identity: ResolvedPowerIdentity,
): 'attack' | 'utility' {
  if (identity.category !== 'active') {
    return 'utility';
  }
  const tpl = identity.template;
  if (!tpl) return 'utility';
  if (tpl.roll?.kind === 'attack') return 'attack';
  const sub = String(tpl.subfamily || '');
  if (
    /^(damage-|weapon-|special-|persistent-zone|limited|autofire|split|damage-transfer)/.test(sub)
  ) {
    return 'attack';
  }
  return 'utility';
}
