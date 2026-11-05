/**
 * Global Limited Power charge — exactly one declaration per Safe Haven Rest.
 *
 * Shared by every Limited Active (learned, Echo Artifact, general Artifact).
 * Spent at attack declaration (createAttackCard), even on miss / resisted spell /
 * empty Instant AoE. Cleared only by Safe Haven Rest.
 */

import { resolvePowerIdentity } from '../utils/power-identity.js';
import { compareIdentityDecision } from '../utils/identity-shadow.js';

export const LIMITED_CHARGE_FLAG = 'limitedChargeSpent';

/** Canonical Limited Active template ids (exactly four Instant Damage deliveries). */
export const LIMITED_POWER_TEMPLATE_IDS = [
  'active-melee-limited-single',
  'active-ranged-limited-single',
  'active-melee-limited-aoe',
  'active-ranged-limited-aoe',
] as const;

export type LimitedPowerTemplateId = (typeof LIMITED_POWER_TEMPLATE_IDS)[number];

const LIMITED_ID_SET = new Set<string>(LIMITED_POWER_TEMPLATE_IDS);

export function isLimitedPowerTemplateId(templateId: unknown): boolean {
  return LIMITED_ID_SET.has(String(templateId || '').trim());
}

/** Templates that must never be Limited (catalogue gate + runtime refuse). */
export function isForbiddenLimitedTemplateId(templateId: unknown): boolean {
  const id = String(templateId || '').trim();
  if (!id) return false;
  if (isLimitedPowerTemplateId(id)) return false;
  if (/instant-special/i.test(id)) return true;
  if (/aoe-damage-t[3-6]$/i.test(id)) return true; // Special-only Instant AoE
  if (/targeted-special/i.test(id)) return true;
  if (/damage-transfer/i.test(id)) return true;
  if (/weapon-split|weapon-autofire/i.test(id)) return true;
  if (/heal|restoration|cleanse|dispel|barrier|illusion|zone|control|mental/i.test(id)) {
    return true;
  }
  // Damage+Special ST templates are not the four Limited Instant Damage Attacks.
  if (/^active-(melee|ranged)-damage-t[3-6]$/.test(id)) return true;
  return false;
}

/**
 * True when this attack declaration is a Limited Instant Damage Attack.
 * Prefers mechanical flags / Limited template ids; never trusts description alone.
 */
export function isLimitedAttackDeclaration(opts: {
  limited?: boolean;
  artifactLimited?: boolean;
  templateId?: string | null;
  item?: { system?: { limited?: boolean; templateId?: string } } | null;
}): boolean {
  const tid = String(
    opts.templateId ||
      opts.item?.system?.templateId ||
      '',
  ).trim();
  if (isForbiddenLimitedTemplateId(tid)) return false;
  if (opts.limited === true || opts.artifactLimited === true) return true;
  if (opts.item?.system?.limited === true) return true;
  const legacy = isLimitedPowerTemplateId(tid);

  // C1 Shadow-Compare (identity.limited); legacy decides.
  return compareIdentityDecision(
    'limited.isLimitedAttackDeclaration',
    legacy,
    () => {
      if (!opts.item && !tid) return false;
      const id = resolvePowerIdentity({
        kind: 'power-item',
        item: opts.item ?? { system: { templateId: tid, limited: opts.limited } },
      });
      if (!id.ok) return false;
      return id.limited === true || isLimitedPowerTemplateId(id.templateId || '');
    },
    { templateId: tid },
  );
}

function readSpent(actor: any): boolean {
  if (!actor) return false;
  try {
    const v = actor.getFlag?.('mastery-system', LIMITED_CHARGE_FLAG);
    if (v === true || v === 1 || String(v) === 'true') return true;
  } catch {
    /* ignore */
  }
  const nested = actor.flags?.['mastery-system']?.[LIMITED_CHARGE_FLAG];
  return nested === true || nested === 1 || String(nested) === 'true';
}

async function writeSpent(actor: any, spent: boolean): Promise<void> {
  if (!actor) return;
  if (typeof actor.setFlag === 'function') {
    if (!spent) {
      if (typeof actor.unsetFlag === 'function') {
        try {
          if (actor.getFlag?.('mastery-system', LIMITED_CHARGE_FLAG) != null) {
            await actor.unsetFlag('mastery-system', LIMITED_CHARGE_FLAG);
          }
          return;
        } catch {
          /* fall through */
        }
      }
      await actor.setFlag('mastery-system', LIMITED_CHARGE_FLAG, false);
      return;
    }
    await actor.setFlag('mastery-system', LIMITED_CHARGE_FLAG, true);
    return;
  }
  actor.flags = actor.flags || {};
  actor.flags['mastery-system'] = actor.flags['mastery-system'] || {};
  if (!spent) delete actor.flags['mastery-system'][LIMITED_CHARGE_FLAG];
  else actor.flags['mastery-system'][LIMITED_CHARGE_FLAG] = true;
}

/** Remaining global Limited declarations (0 or 1). */
export function limitedChargeRemaining(actor: any): number {
  return readSpent(actor) ? 0 : 1;
}

export function isLimitedChargeAvailable(actor: any): boolean {
  return limitedChargeRemaining(actor) > 0;
}

/**
 * Spend the one global Limited charge at declaration.
 * Idempotent for the same declaration via `alreadySpentOnOption` (card recreate).
 */
export async function spendLimitedCharge(
  actor: any,
  opts?: { alreadySpentOnOption?: boolean },
): Promise<{ ok: true; remaining: number } | { ok: false; reason: 'exhausted' | 'missing-actor' }> {
  if (!actor) return { ok: false, reason: 'missing-actor' };
  if (opts?.alreadySpentOnOption) {
    return { ok: true, remaining: limitedChargeRemaining(actor) };
  }
  if (readSpent(actor)) return { ok: false, reason: 'exhausted' };
  await writeSpent(actor, true);
  return { ok: true, remaining: 0 };
}

/** Safe Haven Rest only — never combat end / preparation / level-up. */
export async function clearLimitedCharge(actor: any): Promise<void> {
  await writeSpent(actor, false);
}
