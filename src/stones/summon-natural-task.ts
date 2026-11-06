/**
 * Summon natural noncombat tasks — owner Profession / Perception Training Rolls.
 *
 * There is no Summon Skill list and no Summon Skill Dice pool. A plausible
 * animal-like task uses the owner's Attribute Pool, MR Keep, and one eligible
 * Profession (or free Perception), with Training Advantage / Crit unchanged.
 */

import {
  CHARACTER_PERCEPTION_SPEC_ID,
  isCharacterPerceptionSpec,
  readActorSpecializations,
  type SpecializationRecord,
} from '../rules/specializations.js';
import {
  skillAdvantageRerollMax,
  skillCritDailyAllowance,
  getSkillCritUsesRemaining,
  consumeSkillCritUse,
} from '../rules/skill-advantage.js';
import { getRulesMasteryRank } from '../utils/mastery-rank-sync.js';

const ATTRIBUTE_KEYS = [
  'might',
  'agility',
  'vitality',
  'intellect',
  'resolve',
  'influence',
  'wits',
] as const;

export type SummonNaturalAttribute = (typeof ATTRIBUTE_KEYS)[number];

/** Categories the GM may reject as non-transferable humanoid professional work. */
export const SUMMON_FORBIDDEN_TASK_KINDS = [
  'social',
  'craft',
  'scholarship',
  'language',
  'medical',
  'ritual',
  'negotiation',
  'persuasion',
  'forging',
  'alchemy',
  'surgery',
  'documents',
] as const;

export type SummonForbiddenTaskKind = (typeof SUMMON_FORBIDDEN_TASK_KINDS)[number];

/** Stable one-check key for a Bond natural task (Profession + description slug). */
export function buildSummonNaturalTaskKey(description: string, professionId: string): string {
  const base = String(description || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `${professionId || 'perception'}:${base || 'task'}`;
}

export interface SummonNaturalTaskInput {
  /** Free-text description of the creature's natural method. */
  taskDescription: string;
  /** Optional GM/policy classification used by acceptance helpers. */
  taskKind?: string;
  attributeKey: SummonNaturalAttribute | string;
  /** Profession id, Perception id, or empty for Perception-only independent observation. */
  professionId?: string | null;
  /** Player explanation of why the owner's training applies to this creature. */
  transferExplanation?: string;
  /** GM must approve a non-Perception Profession transfer. */
  gmApproved?: boolean;
  declareTrainingCrit?: boolean;
  /** When true, this is independent natural Perception (owner Perception Rank). */
  independentPerception?: boolean;
  /** Owner viewing through a purchased Shared Sense (still uses owner Perception). */
  sharedSenseActive?: boolean;
  /** Body actually has the named Shared Sense purchased. */
  bodyHasSharedSense?: boolean;
  /** Required purchased Power id, if the fiction needs one. */
  requiredPowerId?: string | null;
  /** Powers present on the acting Body. */
  bodyPowerIds?: string[];
  /** Bond id — one check per task per Bond (caller tracks). */
  bondId?: string;
  /** Already-resolved task keys for this Bond this scene (caller-supplied). */
  resolvedTaskKeys?: string[];
  taskKey?: string;
}

export interface SummonNaturalTaskPlan {
  ok: boolean;
  error?: string;
  /** Soft rejection the UI/GM can show without rolling. */
  rejected?: boolean;
  rejectReason?: string;
  attributeKey: SummonNaturalAttribute;
  poolDice: number;
  keepDice: number;
  profession: SpecializationRecord | null;
  skillAdvantageRerollMax: number;
  rollDisadvantage: false;
  canDeclareTrainingCrit: boolean;
  trainingCritRemaining: number;
  usesPerception: boolean;
  flavor: string;
}

function isAttributeKey(raw: string): raw is SummonNaturalAttribute {
  return (ATTRIBUTE_KEYS as readonly string[]).includes(raw);
}

function looksForbidden(kind: string, description: string): string | null {
  const blob = `${kind} ${description}`.toLowerCase();
  const hits: Array<[RegExp, string]> = [
    [
      /\b(negotiat\w*|persuad\w*|diplom\w*|court\w*|speech|deceiv\w*|bargain\w*|treaty)\b/,
      'social / negotiation',
    ],
    [
      /\b(forg(e|ing)|smith\w*|craft\w*|brew\w*|alchem\w*|engineer\w*|horseshoe|anvil|write|document|scroll)\b/,
      'craft / scholarship',
    ],
    [
      /\b(surger\w*|medic\w*|heal wound|diagnose|language|translate|ritual|rite|incant\w*)\b/,
      'medical / ritual / language',
    ],
  ];
  for (const [re, label] of hits) {
    if (re.test(blob)) return `Not a transferable natural Summon task (${label}).`;
  }
  return null;
}

/**
 * Pure planner — no Foundry writes. GM rejection and forbidden-task heuristics
 * are explicit; the planner never invents eligibility from Profession titles alone.
 */
export function planSummonNaturalTask(
  owner: any,
  input: SummonNaturalTaskInput,
): SummonNaturalTaskPlan {
  const attributeKey = String(input.attributeKey || '').trim().toLowerCase();
  if (!isAttributeKey(attributeKey)) {
    return failPlan('Choose a valid owner Attribute.', attributeKey);
  }
  const mr = Math.max(1, getRulesMasteryRank(owner));
  const poolDice = Math.max(0, Math.floor(Number(owner?.system?.attributes?.[attributeKey]?.value) || 0));
  const taskDescription = String(input.taskDescription || '').trim();
  if (!taskDescription) {
    return failPlan('Describe the creature\'s natural method for this task.', attributeKey, poolDice, mr);
  }

  if (input.taskKey && (input.resolvedTaskKeys || []).includes(String(input.taskKey))) {
    return failPlan(
      'This Bond already resolved that noncombat task — one check per task per Bond.',
      attributeKey,
      poolDice,
      mr,
    );
  }

  const forbidden = looksForbidden(String(input.taskKind || ''), taskDescription);
  if (forbidden) {
    return {
      ...failPlan(forbidden, attributeKey, poolDice, mr),
      ok: false,
      rejected: true,
      rejectReason: forbidden,
    };
  }

  if (input.requiredPowerId) {
    const have = new Set((input.bodyPowerIds || []).map((id) => String(id)));
    if (!have.has(String(input.requiredPowerId))) {
      return failPlan(
        `This action needs purchased Power "${input.requiredPowerId}" on the Body.`,
        attributeKey,
        poolDice,
        mr,
      );
    }
  }

  if (input.sharedSenseActive && !input.bodyHasSharedSense) {
    return failPlan(
      'Owner remote sensing requires a purchased Shared Sense on that Body.',
      attributeKey,
      poolDice,
      mr,
    );
  }

  const specs = readActorSpecializations(owner?.system);
  const usesPerception = !!input.independentPerception || !!input.sharedSenseActive;
  let profession: SpecializationRecord | null = null;

  const asRecord = (raw: Partial<SpecializationRecord> | undefined): SpecializationRecord | null => {
    if (!raw || !String(raw.name || '').trim()) return null;
    const id = String(raw.id || '').trim();
    if (!id) return null;
    return {
      id,
      name: String(raw.name).trim(),
      scope: String(raw.scope ?? ''),
      rank: Math.max(0, Math.floor(Number(raw.rank) || 0)),
      ...(raw.origin ? { origin: String(raw.origin) } : {}),
      ...(raw.category ? { category: String(raw.category) } : {}),
      ...(raw.field ? { field: raw.field } : {}),
      ...(raw.startingSlot ? { startingSlot: true } : {}),
    };
  };

  if (usesPerception) {
    profession =
      asRecord(specs.find((s) => isCharacterPerceptionSpec(s))) ??
      asRecord(specs.find((s) => String(s.id) === CHARACTER_PERCEPTION_SPEC_ID)) ??
      null;
    if (!profession) {
      return failPlan('Owner has no Perception Profession record.', attributeKey, poolDice, mr);
    }
  } else {
    const want = String(input.professionId || '').trim();
    if (!want) {
      return failPlan('Name one owner Profession for this natural transfer.', attributeKey, poolDice, mr);
    }
    profession = asRecord(specs.find((s) => String(s.id) === want));
    if (!profession) {
      return failPlan('Selected Profession was not found on the owner.', attributeKey, poolDice, mr);
    }
    if (isCharacterPerceptionSpec(profession) && !input.independentPerception) {
      // Perception may still be used for observation tasks when explicitly chosen.
    }
    if (!input.gmApproved) {
      return {
        ...failPlan(
          'GM must approve that this Profession credibly transfers to the creature\'s natural method.',
          attributeKey,
          poolDice,
          mr,
        ),
        rejected: true,
        rejectReason:
          'GM approval required for Profession transfer to a Summon natural task.',
      };
    }
    const explanation = String(input.transferExplanation || '').trim();
    if (!explanation) {
      return failPlan(
        'Explain why this Profession applies to the creature\'s natural capability.',
        attributeKey,
        poolDice,
        mr,
      );
    }
  }

  const rank = Math.max(0, Math.floor(Number(profession?.rank) || 0));
  const adv = rank > 0 ? skillAdvantageRerollMax(rank) : 0;
  const critAllow = skillCritDailyAllowance(rank);
  const trackId = String(profession?.id || '');
  const critRemaining = trackId ? getSkillCritUsesRemaining(owner, trackId, rank) : 0;

  return {
    ok: true,
    attributeKey,
    poolDice,
    keepDice: mr,
    profession,
    skillAdvantageRerollMax: adv,
    rollDisadvantage: false,
    canDeclareTrainingCrit: critAllow > 0 && critRemaining > 0,
    trainingCritRemaining: critRemaining,
    usesPerception,
    flavor:
      `Summon natural task · owner ${attributeKey} ${poolDice}k${mr}` +
      (profession
        ? ` · ${profession.name} Rank ${rank}` + (adv > 0 ? ` (Training Advantage 1–${adv})` : '')
        : '') +
      (usesPerception ? ' · Perception' : ''),
  };
}

function failPlan(
  error: string,
  attributeKey: string,
  poolDice = 0,
  keepDice = 1,
): SummonNaturalTaskPlan {
  return {
    ok: false,
    error,
    attributeKey: isAttributeKey(attributeKey) ? attributeKey : 'wits',
    poolDice,
    keepDice,
    profession: null,
    skillAdvantageRerollMax: 0,
    rollDisadvantage: false,
    canDeclareTrainingCrit: false,
    trainingCritRemaining: 0,
    usesPerception: false,
    flavor: '',
  };
}

/** Acceptance helpers used by tests and GM tools. */
export function summonTaskAllowsProfessionTransfer(opts: {
  taskDescription: string;
  taskKind?: string;
}): { ok: boolean; reason?: string } {
  const forbidden = looksForbidden(String(opts.taskKind || ''), opts.taskDescription);
  if (forbidden) return { ok: false, reason: forbidden };
  return { ok: true };
}

export async function executeSummonNaturalTask(
  owner: any,
  input: SummonNaturalTaskInput,
  opts?: { skipChat?: boolean },
): Promise<{ ok: boolean; plan: SummonNaturalTaskPlan; total?: number; error?: string }> {
  const plan = planSummonNaturalTask(owner, input);
  if (!plan.ok || !plan.profession) {
    return { ok: false, plan, error: plan.error };
  }

  let trainingCrit = false;
  if (input.declareTrainingCrit) {
    if (!plan.canDeclareTrainingCrit) {
      return { ok: false, plan, error: 'No Training Crit use available for this Profession today.' };
    }
    const spent = await consumeSkillCritUse(owner, String(plan.profession.id), plan.profession.rank);
    if (!spent) {
      return { ok: false, plan, error: 'Failed to spend Training Crit use.' };
    }
    trainingCrit = true;
  }

  const { masteryRoll } = await import('../dice/roll-handler.js');
  const result = await masteryRoll({
    numDice: plan.poolDice,
    keepDice: plan.keepDice,
    skill: 0,
    tn: 0,
    normalTn: 0,
    raiseTn: 0,
    declaredRaiseSlots: 0,
    stoneBonusRaises: 0,
    freeRaisesAvailableAtSuccess: 0,
    raiseModel: 'skill',
    rollDisadvantage: false,
    skillAdvantageRerollMax: plan.skillAdvantageRerollMax,
    attackExplodeDiceOn78: trainingCrit,
    label: 'Summon Natural Task',
    flavor: plan.flavor + (trainingCrit ? ' · Training Crit' : ''),
    actorId: String(owner?.id ?? ''),
    isSkillRoll: true,
    rollKind: 'skill',
    poolAttribute: plan.attributeKey,
    applyPoolPenalties: false,
    skipChat: !!opts?.skipChat,
  } as any);

  return {
    ok: true,
    plan,
    total: Math.floor(Number(result?.total) || 0),
  };
}
