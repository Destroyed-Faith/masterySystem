/**
 * Attack Power classification (docs/Rules/Canonical/Actives.md, Power Use Limit).
 *
 * Attack Powers are the Single Target, AoE, Split, Autofire, Single Target
 * Special and AoE Special templates. They may be used repeatedly in the same
 * Round while Attack Actions remain. Every other Active (Support, Barrier,
 * Power Image, Mental, Persistent Special Zones, Control, Limited, …) keeps the
 * once-per-Round-per-instance rule.
 */

const ATTACK_POWER_TEMPLATE_RE =
  /^active-(?:melee|ranged)-(?:weapon-(?:single|aoe|split)|instant-special-t[3-6]|aoe-damage-t[3-6]|damage-t[3-6])$|^active-ranged-weapon-autofire$/;

/**
 * True for the six Attack Power templates. The legacy Damage + Special family
 * (`active-*-damage-t*`) counts as Single Target until the v0.9.9.6 migration
 * moves it to Single Target Special.
 */
export function isAttackPowerTemplateId(templateId: string | null | undefined): boolean {
  return ATTACK_POWER_TEMPLATE_RE.test(String(templateId ?? '').trim());
}

/** Embedded power item (learned or granted) whose template is an Attack Power. */
export function isAttackPowerItem(item: { type?: string; system?: any } | null | undefined): boolean {
  if (!item || item.type !== 'power') return false;
  const sys = item.system ?? {};
  if (sys.limited === true) return false;
  return isAttackPowerTemplateId(sys.templateId ?? sys.powerTemplateId);
}
