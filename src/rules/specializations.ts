/**
 * Free-named Specializations organized into seven Fields.
 * Replaces the fixed purchasable Skill catalog.
 */

export const SKILL_FIELDS = [
  'physical',
  'finesse',
  'survival',
  'science-craft',
  'occult',
  'social',
  'investigation',
] as const;

export type SkillField = (typeof SKILL_FIELDS)[number];

export const SKILL_FIELD_LABELS: Record<SkillField, string> = {
  physical: 'Physical',
  finesse: 'Finesse',
  survival: 'Survival',
  'science-craft': 'Science & Craft',
  occult: 'Occult',
  social: 'Social',
  investigation: 'Investigation',
};

/** Example free-named Specs per Field (inspiration only — not a closed list). */
export interface SpecializationFieldExample {
  name: string;
  /** One-sentence scope; often reads like a job vignette. */
  scope: string;
}

export const SPECIALIZATION_FIELD_EXAMPLES: Record<SkillField, SpecializationFieldExample[]> = {
  physical: [
    { name: 'Heavy Labor', scope: 'Hauling, breaking, and forcing objects with raw strength — dockworker, quarry hand, or siege crew.' },
    { name: 'Climbing', scope: 'Scaling walls, cliffs, and ship rigging by muscle and grip — steeplejack, sailor, or mountain guide.' },
    { name: 'Blacksmithing', scope: 'Forging, reshaping, and repairing metal with hammer and heat — smith, farrier, or armorer.' },
    { name: 'Masonry', scope: 'Cutting, setting, and repairing stone, brick, and mortar work — builder, stonemason, or fortification crew.' },
    { name: 'Wrestling', scope: 'Holding, throwing, and controlling bodies in close struggle — pit fighter, town guard, or pit steward.' },
    { name: 'Swimming', scope: 'Distance, depth, and survival in water under strain — diver, ferryman, or salvage hand.' },
    { name: 'Digging', scope: 'Earthworks, trenches, graves, and mining cuts under time pressure — sapper, miner, or grave digger.' },
    { name: 'Siege Labor', scope: 'Bracing gates, raising beams, and manning rams under fire — siege engineer crew or castle laborer.' },
  ],
  finesse: [
    { name: 'Lockpicking', scope: 'Opening locks and catches the way a burglar would, quietly and without force.' },
    { name: 'Pickpocket', scope: 'Lifting purses, cutting pockets, and planting small items in a crowd — cutpurse or stage magician.' },
    { name: 'Circus Acrobat', scope: 'Leaps, balance, and tumbling like a circus acrobat through tight or uneven spaces.' },
    { name: 'Trapcraft', scope: 'Setting, noticing, and disarming small traps, wires, and triggers by hand — tomb robber or locksmith.' },
    { name: 'Stealth', scope: 'Moving unseen through sightlines without force — scout, burglar, or night watch infiltrator.' },
    { name: 'Sleight of Hand', scope: 'Palming, switching, and planting small objects mid-conversation — con artist or dealer.' },
    { name: 'Rope Work', scope: 'Knots, climbing lines, and securing loads with fine control — sailor, rigger, or executioner.' },
    { name: 'Concealment', scope: 'Choosing where to vanish and leave no trace — poacher, courier, or urban shadow.' },
  ],
  survival: [
    { name: 'Tracking', scope: 'Following footprints and disturbed ground outdoors — hunter, bounty tracker, or ranger.' },
    { name: 'Foraging', scope: 'Finding food, water, and shelter in the wild — woodsman, pilgrim guide, or refugee scout.' },
    { name: 'Animal Handling', scope: 'Calming, guiding, and reading beasts without spooking them — wrangler, stable hand, or beast trainer.' },
    { name: 'Weather Sense', scope: 'Reading sky, wind, and storm signs before they hit — sailor, shepherd, or caravan master.' },
    { name: 'Navigation', scope: 'Finding routes by landmarks, stars, and chart — guide, navigator, or courier.' },
    { name: 'Herbalism', scope: 'Identifying wild plants for food, medicine, or poison — herbalist, midwife, or hedge witch.' },
    { name: 'Campcraft', scope: 'Building shelter, fire, and safe camps in hostile country — ranger, soldier, or expedition cook.' },
    { name: 'Hunting', scope: 'Stalking game and taking clean kills in the wild — hunter, trapper, or gamekeeper.' },
  ],
  'science-craft': [
    { name: 'Field Medicine', scope: 'Stabilizing wounds and treating injuries under pressure — battlefield medic or ship surgeon.' },
    { name: 'Tinkering', scope: 'Repairing and jury-rigging tools, traps, and devices — tinkerer, siege mechanic, or clock-hand.' },
    { name: 'Alchemy', scope: 'Mixing reagents, solvents, and remedies safely — alchemist, dye-maker, or poisoner.' },
    { name: 'Cartography', scope: 'Drawing and reading practical maps of routes and sites — surveyor, scout-cartographer, or estate clerk.' },
    { name: 'Engineering', scope: 'Designing machines, fortifications, and load-bearing structures — engineer, millwright, or siege architect.' },
    { name: 'Artisanry', scope: 'Fine soft-goods and decorative craft: cloth, jewelry, finishing — tailor, jeweler, or court artisan.' },
    { name: 'Apothecary', scope: 'Preparing doses, poultices, and measured remedies from known recipes — apothecary or hospice attendant.' },
    { name: 'Appraisal', scope: 'Judging worth, authenticity, and craft quality of goods — merchant, pawnbroker, or customs officer.' },
  ],
  occult: [
    { name: 'Demon Lore', scope: 'Recognizing demons, their marks, bargains, and telltale signs — exorcist aide or cult hunter.' },
    { name: 'Religious Lore', scope: 'Knowing the old gods, faiths, and religious rituals practiced in the world — cleric, scribe, or temple guide.' },
    { name: 'Ward Craft', scope: 'Reading wards and seals others left, and understanding what was done there — warder or relic keeper.' },
    { name: 'Folklore', scope: 'Recalling local curses, omens, and old bargains — village elder, storyteller, or hedge witch.' },
    { name: 'Ritual Theory', scope: 'Reading ritual steps, circles, and what a working needs to hold — ritualist or circle scribe.' },
    { name: 'Echo Signs', scope: 'Spotting Echo marks, awakenings, and power-residue on people and places — Echo-watcher or inquisitor.' },
    { name: 'Spirit Lore', scope: 'Recognizing spirits, hauntings, and bargains with the dead — medium, grave warden, or mourner-priest.' },
    { name: 'Forbidden Tongues', scope: 'Reading and speaking fragments of old occult languages — forbidden scholar or vault librarian.' },
  ],
  social: [
    { name: 'Cold Read', scope: 'Reading people in tense social stakes — interrogator, gambler, or court whisperer.' },
    { name: 'Persuasion', scope: 'Steering someone toward a choice they can almost already accept — advocate, recruiter, or diplomat.' },
    { name: 'Intimidation', scope: 'Pressing will through threat, presence, and hard stares — enforcer, sergeant, or debt collector.' },
    { name: 'Etiquette', scope: 'Moving correctly through courts, crews, and formal rooms — courtier, majordomo, or embassy aide.' },
    { name: 'Deception', scope: 'Selling lies and half-truths under scrutiny — spy, smuggler face, or confidence artist.' },
    { name: 'Leadership', scope: 'Rallying allies and holding a group to a plan under stress — captain, gang boss, or expedition lead.' },
    { name: 'Streetwise', scope: 'Reading underworld rules, fences, and city rumor — fixer, informant, or alley guide.' },
    { name: 'Negotiation', scope: 'Closing deals with leverage, terms, and hidden costs — merchant, broker, or hostage go-between.' },
  ],
  investigation: [
    { name: 'Crime Scene', scope: 'Reconstructing what happened from physical clues left behind — watch detective or coroner’s aide.' },
    { name: 'Interrogation', scope: 'Drawing answers from reluctant witnesses without losing the thread — inquisitor, watch officer, or advocate.' },
    { name: 'Research', scope: 'Digging facts from records, ledgers, and archives — clerk, scholar, or estate auditor.' },
    { name: 'Deduction', scope: 'Connecting partial clues into a workable theory — consulting detective or case solicitor.' },
    { name: 'Surveillance', scope: 'Watching targets over time without being noticed — private eye, spy, or night watch.' },
    { name: 'Forensics', scope: 'Matching wounds, residues, and tool marks to causes — coroner, battlefield surgeon, or poison tester.' },
    { name: 'Cryptography', scope: 'Breaking codes, ciphers, and hidden writing — code clerk, spy handler, or vault scribe.' },
    { name: 'Search', scope: 'Methodically combing rooms, bodies, and caches for hidden items — customs searcher or tomb explorer.' },
  ],
};

export interface SpecializationRecord {
  /** Stable identity key (normalized name + field). */
  id: string;
  name: string;
  field: SkillField;
  /** One-sentence scope. */
  scope: string;
  rank: number;
}

export function normalizeSpecializationName(name: string): string {
  return String(name || '')
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function specializationIdentityKey(name: string, field: SkillField): string {
  return `${field}:${normalizeSpecializationName(name)}`;
}

export function isSkillField(value: string | null | undefined): value is SkillField {
  return SKILL_FIELDS.includes(String(value || '') as SkillField);
}

export interface SpecializationValidation {
  ok: boolean;
  errors: string[];
}

/** Free universal Perception Spec — not one of the five paid starting Specs. */
export const CHARACTER_PERCEPTION_FIELD: SkillField = 'investigation';
export const CHARACTER_PERCEPTION_SPEC_ID = specializationIdentityKey(
  'Perception',
  CHARACTER_PERCEPTION_FIELD,
);
export const CHARACTER_PERCEPTION_SCOPE = 'Notice, search, and read the scene';
/** Matches `UNIVERSAL_PERCEPTION_RANK` in skill-check.ts. */
export const CHARACTER_PERCEPTION_MIN_RANK = 2;

export function isCharacterPerceptionSpec(
  spec: Pick<Partial<SpecializationRecord>, 'id' | 'name'>,
): boolean {
  return (
    String(spec.id || '') === CHARACTER_PERCEPTION_SPEC_ID ||
    normalizeSpecializationName(String(spec.name || '')) === 'perception'
  );
}

/**
 * Every character has Perception at least Rank 2 (free). Adds the Spec when
 * missing; raises Rank when below the floor. Never lowers a higher Rank.
 */
export function ensureCharacterHasPerceptionSpec(system: any): {
  specializations: SpecializationRecord[];
  changed: boolean;
} {
  const raw = system?.specializations;
  const list: any[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.values(raw)
      : [];
  const specializations: SpecializationRecord[] = [];
  let foundIdx = -1;
  for (const s of list) {
    if (!s || !String(s.name ?? '').trim()) continue;
    const field: SkillField = isSkillField(s.field) ? s.field : 'physical';
    const name = String(s.name).trim();
    const rec: SpecializationRecord = {
      id: String(s.id || specializationIdentityKey(name, field)).trim(),
      name,
      field,
      scope: String(s.scope ?? ''),
      rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
    };
    if (foundIdx < 0 && isCharacterPerceptionSpec(rec)) foundIdx = specializations.length;
    specializations.push(rec);
  }

  if (foundIdx < 0) {
    specializations.push({
      id: CHARACTER_PERCEPTION_SPEC_ID,
      name: 'Perception',
      field: CHARACTER_PERCEPTION_FIELD,
      scope: CHARACTER_PERCEPTION_SCOPE,
      rank: CHARACTER_PERCEPTION_MIN_RANK,
    });
    return { specializations, changed: true };
  }

  const cur = specializations[foundIdx]!;
  const nextRank = Math.max(CHARACTER_PERCEPTION_MIN_RANK, Math.floor(Number(cur.rank) || 0));
  const nextScope = String(cur.scope || '').trim() || CHARACTER_PERCEPTION_SCOPE;
  const nextField: SkillField = isSkillField(cur.field) ? cur.field : CHARACTER_PERCEPTION_FIELD;
  if (
    nextRank === cur.rank &&
    nextScope === cur.scope &&
    nextField === cur.field &&
    cur.id === CHARACTER_PERCEPTION_SPEC_ID
  ) {
    return { specializations, changed: false };
  }
  specializations[foundIdx] = {
    ...cur,
    id: CHARACTER_PERCEPTION_SPEC_ID,
    field: nextField,
    scope: nextScope,
    rank: nextRank,
  };
  return { specializations, changed: true };
}

export function validateSpecializationList(
  specs: Array<Partial<SpecializationRecord>>,
  opts?: { requireStartingBudget?: boolean },
): SpecializationValidation {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const spec of specs) {
    const name = String(spec.name || '').trim();
    if (!name) {
      errors.push('Specialization name is required.');
      continue;
    }
    if (!isSkillField(String(spec.field || ''))) {
      errors.push(`Invalid Field for "${name}".`);
      continue;
    }
    const key = specializationIdentityKey(name, spec.field as SkillField);
    if (seen.has(key)) {
      errors.push(`Duplicate Specialization: ${name} (${SKILL_FIELD_LABELS[spec.field as SkillField]}).`);
    }
    seen.add(key);
    const rank = Math.floor(Number(spec.rank) || 0);
    if (rank < 1 || rank > 8) {
      errors.push(`Rank for "${name}" must be 1–8 (got ${rank}).`);
    }
    if (!String(spec.scope || '').trim()) {
      errors.push(`Scope required for "${name}".`);
    }
  }
  if (opts?.requireStartingBudget) {
    // Free Perception sits alongside the five paid starting Specs.
    const paid = specs.filter((s) => !isCharacterPerceptionSpec(s));
    if (paid.length !== 5) {
      errors.push('Starting characters need exactly five Specializations.');
    }
    const ranks = paid.map((s) => Math.floor(Number(s.rank) || 0));
    if (ranks.length === 5 && !ranks.every((r) => r === 2)) {
      errors.push('Each starting Specialization must be Rank 2.');
    }
    const totalRanks = ranks.reduce((a, b) => a + b, 0);
    if (ranks.length === 5 && totalRanks !== 10) {
      errors.push(`Starting Rank total must be 10 (20 Creation Points); got ${totalRanks}.`);
    }
    const perception = specs.find((s) => isCharacterPerceptionSpec(s));
    if (perception) {
      const pRank = Math.floor(Number(perception.rank) || 0);
      if (pRank < CHARACTER_PERCEPTION_MIN_RANK) {
        errors.push(
          `Perception must be at least Rank ${CHARACTER_PERCEPTION_MIN_RANK} (free universal Spec).`,
        );
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Read an actor's Specialization list tolerant of array / keyed-object shapes. */
export function readActorSpecializations(system: any): Array<Partial<SpecializationRecord>> {
  const raw = system?.specializations;
  const list: any[] = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? Object.values(raw) : [];
  return list
    .filter((s) => s && String(s.name ?? '').trim())
    .map((s) => ({
      id: String(s.id ?? '').trim() || specializationIdentityKey(String(s.name), s.field),
      name: String(s.name),
      field: s.field,
      scope: s.scope,
      rank: Math.max(0, Math.floor(Number(s.rank) || 0)),
    }));
}

/**
 * Highest Rank among Medicine-like Specializations: name or scope mentions
 * medicine / medic / healing, or a Science & Craft Spec named Medicine.
 */
export function medicineSpecializationRank(system: any): number {
  let best = 0;
  for (const spec of readActorSpecializations(system)) {
    const name = normalizeSpecializationName(String(spec.name ?? ''));
    const scope = String(spec.scope ?? '').toLowerCase();
    const medicineNamed = /\bmedic(ine|al)?\b/.test(name) || name.includes('physician') || name.includes('surgery');
    const medicineScoped = /\bmedicine\b|\bmedic\b|\bfirst aid\b/.test(scope);
    const scienceCraftMedicine = spec.field === 'science-craft' && name.startsWith('medic');
    if (medicineNamed || medicineScoped || scienceCraftMedicine) {
      best = Math.max(best, Math.floor(Number(spec.rank) || 0));
    }
  }
  return best;
}

/** Closed Summon task list (owner mapping). */
export const SUMMON_TASKS = [
  'perception',
  'tracking',
  'navigation',
  'weather-sense',
  'stealth',
  'concealment',
  'athletics',
  'acrobatics',
  'search',
  'survival',
] as const;

export type SummonTask = (typeof SUMMON_TASKS)[number];

export function summonTaskSlotCount(boundStones: number): number {
  const n = Math.max(0, Math.floor(Number(boundStones) || 0));
  if (n <= 0) return 0;
  if (n === 1) return 2;
  if (n === 2) return 3;
  return 4;
}

/** Dice cap for a Summon task: Perception uses 2×owner MR; others 2×one matching Spec Rank. */
export function summonSkillDiceCap(opts: {
  task: SummonTask;
  ownerMasteryRank: number;
  matchingSpecializationRank?: number;
}): number {
  if (opts.task === 'perception') {
    return 2 * Math.max(1, Math.floor(Number(opts.ownerMasteryRank) || 1));
  }
  return 2 * Math.max(0, Math.floor(Number(opts.matchingSpecializationRank) || 0));
}

/** Task → owner Specialization id mapping stored on a Summon Bond. */
export type SummonTaskSpecMap = Partial<Record<SummonTask, string>>;

export function isSummonTask(value: string): value is SummonTask {
  return (SUMMON_TASKS as readonly string[]).includes(value);
}

/** Drop unknown tasks / blank ids from a stored map. */
export function normalizeSummonTaskSpecMap(raw: unknown): SummonTaskSpecMap {
  const out: SummonTaskSpecMap = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [task, id] of Object.entries(raw as Record<string, unknown>)) {
    const spec = String(id ?? '').trim();
    if (isSummonTask(task) && spec) out[task] = spec;
  }
  return out;
}

/** Number of mapped tasks that still need a Spec (Perception uses owner MR, no Spec). */
function mappedTaskCount(map: SummonTaskSpecMap): number {
  return Object.keys(map).length;
}

/**
 * Validate a Summon Bond's task mapping. Summons never receive Free Raises;
 * the task list is capped by `summonTaskSlotCount(boundStones)`.
 */
export function validateSummonTaskSpecMap(opts: {
  map: SummonTaskSpecMap;
  boundStones: number;
  ownerSpecs: Array<Partial<SpecializationRecord>>;
}): string[] {
  const errors: string[] = [];
  const map = normalizeSummonTaskSpecMap(opts.map);
  const slots = summonTaskSlotCount(opts.boundStones);
  if (mappedTaskCount(map) > slots) {
    errors.push(`Summon has ${mappedTaskCount(map)} mapped tasks but only ${slots} slot${slots === 1 ? '' : 's'} (Bound Stones).`);
  }
  const ids = new Set(opts.ownerSpecs.map((s) => String(s.id ?? '')));
  for (const [task, specId] of Object.entries(map)) {
    if (task === 'perception') continue; // uses 2 × owner MR; mapping optional
    if (!ids.has(String(specId))) errors.push(`Task ${task}: owner Specialization not found.`);
  }
  return errors;
}

/** Dice cap per mapped task using the mapped owner Spec Rank (Perception: owner MR). */
export function summonTaskDiceCaps(opts: {
  map: SummonTaskSpecMap;
  ownerSpecs: Array<Partial<SpecializationRecord>>;
  ownerMasteryRank: number;
}): Partial<Record<SummonTask, number>> {
  const out: Partial<Record<SummonTask, number>> = {};
  const map = normalizeSummonTaskSpecMap(opts.map);
  for (const task of Object.keys(map) as SummonTask[]) {
    const spec = opts.ownerSpecs.find((s) => String(s.id ?? '') === map[task]);
    out[task] = summonSkillDiceCap({
      task,
      ownerMasteryRank: opts.ownerMasteryRank,
      matchingSpecializationRank: spec?.rank ?? 0,
    });
  }
  return out;
}

/** Summons never receive Free Raises (DF 2026). */
export const SUMMON_FREE_RAISES = 0;
