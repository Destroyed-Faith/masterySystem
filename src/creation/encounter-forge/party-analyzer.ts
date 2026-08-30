/**
 * Party Combat Analyzer — per-PC combat profiles from the actual selected
 * actors.
 *
 * The analyzer looks at what each selected character can really do: real
 * equipped/artifact weapons, attack powers, spells, specials, penetration,
 * stones, defenses (Evade, Armor, DR%, Spell Resistance, Parry, Phasing) and
 * the six-bar Health Level track.
 *
 * BASELINE NORMALIZATION: encounter generation uses a normalized baseline
 * combat state — healthy, no transient Temp HP, permanent equipment, current
 * legal Artifact Levels, full stone pools, no spent combat resources. Status
 * effects that are transient (Corrode / Expose stacks, ...) are stripped
 * from the derived totals; if the actor's stored state looks transient or
 * inconsistent, a warning is attached instead of silently using nonsense.
 *
 * Pure and Foundry-free: reads plain actor-shaped data, never throws on
 * partial data, usable directly from tests.
 */

import { isArtifactEquippedOnActor } from '../../utils/artifact-actor-rules.js';
import { artifactToVirtualWeapon } from '../../utils/unarmed-fallback.js';
import { canonicalSpecialId, getEffectById } from '../../utils/special-effects.js';
import { baseEvadeForMr, mightMeleeBonus, stonesForAttribute } from './combat-math.js';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PcSpecialOnHit {
  id: string;
  value: number;
}

export interface PcAttackProfile {
  label: string;
  kind: 'martial' | 'spell';
  delivery: 'melee' | 'ranged';
  /** Attack pool = full attack attribute (weapon attacks; keep = MR). */
  pool: number;
  keep: number;
  /** Plain-d8 damage dice per hit (weapon + power rider for martial). */
  damageDice: number;
  /** Flat damage (Might melee bonus etc.). */
  flatDamage: number;
  /** Armor ignored by this attack (explicit Penetration specials). */
  penetration: number;
  /** Specials applied on hit. */
  specials: PcSpecialOnHit[];
  /** Power level for spell Casting TN; null for martial attacks. */
  spellPowerLevel: number | null;
}

export interface PcCombatProfile {
  actorId: string;
  name: string;
  mr: number;
  // Defense (normalized baseline)
  evade: number;
  armor: number;
  drPct: number;
  spellResistance: number;
  /** Max parry pool if a parry stance is available to this PC, else 0. */
  parryPoolMax: number;
  phasingCharges: number;
  reactionsPerRound: number;
  /** Max HP per health bar (index 0 = Healthy ... 5 = Incapacitated). */
  healthBars: number[];
  totalHealth: number;
  /** Size of one full health level (bar 0 max). */
  healthLevelSize: number;
  // Offense
  attacks: PcAttackProfile[];
  /** The profile the PC repeats every round (sustainable primary attack). */
  bestAttack: PcAttackProfile;
  attackActionsPerRound: number;
  // Burst / limited resources
  stonesTotal: number;
  /** Stones needed for +1 attack action (ramp T1+T2 = 3). */
  extraAttackStoneCost: number;
  /** Best affordable one-round melee damage-dice burst from stones. */
  burstBonusDamageDice: number;
  canCleanse: boolean;
  warnings: string[];
}

export interface PartyProfile {
  members: PcCombatProfile[];
  size: number;
  /** Diagnostic only — never a balancing input. */
  medianMr: number;
  warnings: string[];
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function num(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse "3d8+2" / "12" / "2d8" into { dice, flat }. */
export function parseDamageString(raw: unknown): { dice: number; flat: number } {
  const t = String(raw ?? '').trim();
  if (!t) return { dice: 0, flat: 0 };
  const dice = t.match(/(\d+)\s*d\s*8/i);
  const flat = t.match(/([+-]\s*\d+)(?!\s*d)/);
  const out = {
    dice: dice ? parseInt(dice[1], 10) : 0,
    flat: flat ? parseInt(flat[1].replace(/\s+/g, ''), 10) : 0,
  };
  if (out.dice === 0 && out.flat === 0) {
    const bare = parseInt(t, 10);
    // A lone number is Nd8 in Mastery damage notation (damage-dialog.ts).
    if (Number.isFinite(bare) && bare > 0) out.dice = bare;
  }
  return out;
}

/** Parse specials like ["Penetration(4)", "Lacerate(2)"] into id/value pairs. */
export function parseSpecialStrings(list: unknown): PcSpecialOnHit[] {
  if (!Array.isArray(list)) return [];
  const out: PcSpecialOnHit[] = [];
  for (const entry of list) {
    const m = String(entry ?? '').match(/^\s*([A-Za-zÄÖÜäöüß' -]+?)\s*\(\s*(\d+)\s*\)\s*$/);
    if (!m) continue;
    const id = canonicalSpecialId(m[1].trim().toLowerCase());
    if (!id) continue;
    out.push({ id, value: parseInt(m[2], 10) });
  }
  return out;
}

function itemsOf(actor: any): any[] {
  if (Array.isArray(actor?.items?.contents)) return actor.items.contents;
  if (Array.isArray(actor?.items)) return actor.items;
  return [];
}

function statusEffectValue(system: any, specialId: string): number {
  const list = Array.isArray(system?.statusEffects) ? system.statusEffects : [];
  let total = 0;
  for (const e of list) {
    const id = canonicalSpecialId(String(e?.id ?? e?.special ?? '').toLowerCase());
    if (id === specialId) total += Math.max(0, num(e?.value, 0));
  }
  return total;
}

/* ------------------------------------------------------------------ */
/* Extraction                                                          */
/* ------------------------------------------------------------------ */

/**
 * Build the combat profile for one character actor (prepared or plain data).
 */
export function analyzePc(actor: any): PcCombatProfile {
  const system = actor?.system ?? {};
  const combat = system.combat ?? {};
  const attributes = system.attributes ?? {};
  const warnings: string[] = [];

  const mr = Math.max(1, Math.min(8, Math.floor(num(system.mastery?.rank, 2))));
  const might = num(attributes.might?.value, 2);
  const agility = num(attributes.agility?.value, 2);

  /* ---------------- Defense (normalized) ---------------- */

  // Derived totals include transient status maluses (Expose/Corrode) and
  // in-combat stone bonuses. Baseline = totals with transient specials
  // stripped back out; warn when such state exists.
  const exposeValue = statusEffectValue(system, 'expose');
  const corrodeValue = statusEffectValue(system, 'corrode');
  const rawEvade = num(combat.evadeTotal, num(combat.evade, baseEvadeForMr(mr)));
  const rawArmor = num(combat.armorTotal, num(combat.armor, mr));
  const evade = Math.round(rawEvade + exposeValue);
  const armor = Math.round(rawArmor + corrodeValue);
  if (exposeValue > 0 || corrodeValue > 0) {
    warnings.push(
      `${actor?.name ?? '?'}: aktive Status-Effekte (Expose/Corrode) wurden für die Baseline herausgerechnet.`,
    );
  }
  const statusCount = Array.isArray(system.statusEffects) ? system.statusEffects.length : 0;
  if (statusCount > 0 && exposeValue === 0 && corrodeValue === 0) {
    warnings.push(`${actor?.name ?? '?'}: hat aktive Status-Effekte — Baseline ignoriert sie.`);
  }

  const drPct = Math.max(0, Math.min(100, Math.round(num(combat.damageReductionPct, 0))));
  const spellResistance = Math.max(0, Math.round(num(combat.spellResistanceTotal, 0)));

  // Temp HP is transient — never part of baseline durability.
  const tempHP = num(system.health?.tempHP, 0);
  if (tempHP > 0) {
    warnings.push(
      `${actor?.name ?? '?'}: ${tempHP} Temp-HP im Datensatz — Baseline rechnet ohne Temp-HP.`,
    );
  }
  if (system.creation?.skillsRedistributing === true) {
    warnings.push(`${actor?.name ?? '?'}: ist im Skill-Bearbeitungsmodus — Werte können transient sein.`);
  }

  // Health bars: use MAX values (healthy baseline).
  const bars: any[] = Array.isArray(system.health?.bars) ? system.health.bars : [];
  const healthBars = bars.map((b) => Math.max(0, num(b?.max, 0)));
  if (healthBars.length === 0) healthBars.push(Math.max(1, num(attributes.vitality?.value, 2) * 2));
  const totalHealth = healthBars.reduce((a, b) => a + b, 0);
  const healthLevelSize = Math.max(1, healthBars[0]);
  const currentDamage = bars.reduce(
    (acc, b) => acc + Math.max(0, num(b?.max, 0) - num(b?.current, num(b?.max, 0))),
    0,
  );
  if (currentDamage > 0) {
    warnings.push(`${actor?.name ?? '?'}: aktuell verletzt — Baseline nutzt volle Gesundheit.`);
  }

  // Parry: available if a parry passive/pool exists; cap = min(best attr, 5 × level).
  let parryPoolMax = 0;
  for (const it of itemsOf(actor)) {
    if (it?.type !== 'power') continue;
    const tid = String(it?.system?.templateId ?? '').toLowerCase();
    if (tid.includes('parry')) {
      const level = Math.max(1, num(it?.system?.level ?? it?.system?.rank, 1));
      parryPoolMax = Math.max(parryPoolMax, Math.min(Math.max(might, agility), 5 * level));
    }
  }

  // Phasing charges from passives (Ghostform curve) — read persisted flag max
  // if present, else 0 (charges are granted per combat).
  const phasingCharges = Math.max(
    0,
    num((actor?.flags?.['mastery-system'] as any)?.phasingCharges?.max, 0),
  );

  /* ---------------- Offense ---------------- */

  const items = itemsOf(actor);

  // Real weapon: equipped weapon, else equipped artifact weapon, else unarmed.
  let weapon: any = items.find((i) => i?.type === 'weapon' && i?.system?.equipped === true) ?? null;
  let weaponFromArtifact = false;
  for (const it of items) {
    if (it?.type !== 'artifact') continue;
    try {
      if (!isArtifactEquippedOnActor(it)) continue;
      const vw = artifactToVirtualWeapon(it);
      if (!vw?.system) continue;
      const candidate = parseDamageString(vw.system.damage ?? vw.system.baseDamage).dice;
      const current = weapon ? parseDamageString(weapon.system?.damage ?? weapon.system?.baseDamage).dice : 0;
      if (candidate > current) {
        weapon = vw;
        weaponFromArtifact = true;
      }
    } catch {
      /* malformed artifact — ignore */
    }
  }
  if (!weapon) {
    const anyWeapon = items.find((i) => i?.type === 'weapon');
    if (anyWeapon) {
      weapon = anyWeapon;
      warnings.push(`${actor?.name ?? '?'}: keine Waffe als ausgerüstet markiert — beste vorhandene Waffe angenommen.`);
    }
  }

  const weaponSys = weapon?.system ?? {};
  const weaponDamage = parseDamageString(weaponSys.damage ?? weaponSys.baseDamage);
  if (weaponDamage.dice === 0 && weaponDamage.flat === 0) weaponDamage.dice = 1; // unarmed 1d8
  const weaponSpecials = parseSpecialStrings(weaponSys.specials);
  const isRangedWeapon = String(weaponSys.weaponType ?? '').toLowerCase().includes('ranged');
  const finesse =
    String(weaponSys.freeTrait ?? '').toLowerCase().includes('finesse') ||
    weaponSpecials.some((s) => s.id === 'finesse') ||
    String(weaponSys.innateAbilities ?? '').toLowerCase().includes('finesse');
  const attackAttrOverride = String(weaponSys.attackAttribute ?? '').toLowerCase();
  let attackAttrValue: number;
  if (attackAttrOverride && num((attributes as any)[attackAttrOverride]?.value, 0) > 0) {
    attackAttrValue = num((attributes as any)[attackAttrOverride].value, 2);
  } else if (finesse || isRangedWeapon) {
    attackAttrValue = agility;
  } else {
    attackAttrValue = might;
  }

  // Best non-spell attack power rider and best standalone spell.
  let bestRiderDice = 0;
  let bestRiderSpecials: PcSpecialOnHit[] = [];
  let bestSpellDice = 0;
  let bestSpellLevel = 1;
  let bestSpellSpecials: PcSpecialOnHit[] = [];
  let castingAttrValue = Math.max(
    num(attributes.intellect?.value, 2),
    num(attributes.resolve?.value, 2),
    num(attributes.wits?.value, 2),
  );
  let canCleanse = false;

  for (const it of items) {
    if (it?.type !== 'power') continue;
    const sys = it?.system ?? {};
    const subfamily = String(sys.subfamily ?? '').toLowerCase();
    const chosenKey = String(sys.chosenSpecial?.key ?? '').toLowerCase();
    const name = String(it?.name ?? '').toLowerCase();
    if (chosenKey === 'cleanse' || subfamily === 'support-cleanse' || name.includes('cleanse')) {
      canCleanse = true;
    }
    const level = Math.max(1, Math.min(16, num(sys.rank ?? sys.level, 1)));
    const levelRow = sys.levels?.[String(level)] ?? null;
    const dmgRaw = levelRow?.effect?.dice ?? levelRow?.roll?.damage ?? sys.roll?.damage;
    const { dice } = parseDamageString(dmgRaw);
    if (dice <= 0) continue;
    const chosenSpecial = chosenKey ? canonicalSpecialId(chosenKey) : null;
    const chosenTier = Math.max(1, num(sys.chosenSpecial?.tier, 3));
    const specials: PcSpecialOnHit[] = chosenSpecial
      ? [{ id: chosenSpecial, value: Math.max(1, Math.round(chosenTier / 2)) }]
      : [];
    if (sys.isSpell === true) {
      if (dice > bestSpellDice) {
        bestSpellDice = dice;
        bestSpellLevel = level;
        bestSpellSpecials = specials;
        const castAttr = String(sys.castingAttribute ?? '').toLowerCase();
        if (castAttr && num((attributes as any)[castAttr]?.value, 0) > 0) {
          castingAttrValue = num((attributes as any)[castAttr].value, 2);
        }
      }
    } else if (dice > bestRiderDice) {
      bestRiderDice = dice;
      bestRiderSpecials = specials;
    }
  }

  const meleeFlat = isRangedWeapon ? 0 : mightMeleeBonus(might);
  const penetration = weaponSpecials
    .filter((s) => s.id === 'penetration')
    .reduce((a, s) => a + s.value, 0);

  const martialAttack: PcAttackProfile = {
    label: weapon?.name ? String(weapon.name) : 'Unbewaffnet',
    kind: 'martial',
    delivery: isRangedWeapon ? 'ranged' : 'melee',
    pool: Math.max(mr, Math.floor(attackAttrValue)),
    keep: mr,
    damageDice: weaponDamage.dice + bestRiderDice,
    flatDamage: Math.max(0, weaponDamage.flat) + meleeFlat,
    penetration,
    specials: [
      ...weaponSpecials.filter((s) => s.id !== 'penetration' && s.id !== 'finesse'),
      ...bestRiderSpecials,
    ],
    spellPowerLevel: null,
  };
  if (weaponFromArtifact) martialAttack.label += ' (Artefakt)';

  const attacks: PcAttackProfile[] = [martialAttack];
  if (bestSpellDice > 0) {
    attacks.push({
      label: 'Bester Zauber',
      kind: 'spell',
      delivery: 'ranged',
      pool: Math.max(mr, Math.floor(castingAttrValue)),
      keep: mr,
      damageDice: bestSpellDice,
      flatDamage: 0,
      penetration: 0,
      specials: bestSpellSpecials,
      spellPowerLevel: bestSpellLevel,
    });
  }

  // Sustainable primary = the attack with the best expected raw output.
  // (Exact vs-defense choice happens in the simulator, which re-evaluates
  // each attack against the concrete enemy configuration.)
  const bestAttack = attacks.reduce((best, a) =>
    a.damageDice + a.flatDamage / 4.5 > best.damageDice + best.flatDamage / 4.5 ? a : best,
  );

  /* ---------------- Burst resources ---------------- */

  let stonesTotal = 0;
  for (const key of ['might', 'agility', 'vitality', 'intellect', 'resolve', 'influence', 'wits']) {
    stonesTotal += stonesForAttribute(num((attributes as any)[key]?.value, 0));
  }
  // Stone wave costs are 2^(tier-1); extra attack unlocks at T2 → ramp cost 1+2.
  const extraAttackStoneCost = 3;
  // might.meleeDamage tiers: +2 (1 stone), +4 (3), +8 (7), +16 (15 cumulative).
  let burstBonusDamageDice = 0;
  if (!isRangedWeapon) {
    if (stonesTotal >= 15) burstBonusDamageDice = 2 + 4 + 8 + 16;
    else if (stonesTotal >= 7) burstBonusDamageDice = 2 + 4 + 8;
    else if (stonesTotal >= 3) burstBonusDamageDice = 2 + 4;
    else if (stonesTotal >= 1) burstBonusDamageDice = 2;
  }

  return {
    actorId: String(actor?.id ?? ''),
    name: String(actor?.name ?? 'Unbenannt'),
    mr,
    evade,
    armor,
    drPct,
    spellResistance,
    parryPoolMax,
    phasingCharges,
    reactionsPerRound: 1,
    healthBars,
    totalHealth,
    healthLevelSize,
    attacks,
    bestAttack,
    attackActionsPerRound: 1,
    stonesTotal,
    extraAttackStoneCost,
    burstBonusDamageDice,
    canCleanse,
    warnings,
  };
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Analyze all selected party actors. */
export function analyzePartyActors(actors: any[]): PartyProfile {
  const members = actors.map((a) => analyzePc(a));
  return {
    members,
    size: members.length,
    medianMr: Math.round(median(members.map((m) => m.mr))) || 2,
    warnings: members.flatMap((m) => m.warnings),
  };
}
