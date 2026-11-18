/**
 * Legacy skill fields (`system.skills`, `system.skillsSpent`, `system.skillPoints`,
 * `system.creation.skillsRedistributing`) and the retired Echo Card picks
 * (`system.echo.selectedCardIds`, `system.echo.cardUses`) are not part of the active data model.
 * Professions (`system.specializations`) are the only skill structure. Writes to
 * the legacy fields are dropped; only `-=` deletions pass so the legacy-cleanup
 * migration can remove the archived data.
 */

/** Update option set only by the legacy-cleanup migration's apply/rollback writes. */
export const LEGACY_SKILL_MIGRATION_OPTION = 'masteryLegacySkillMigration';

export const LEGACY_SKILL_SYSTEM_KEYS = ['skills', 'skillsSpent', 'skillPoints'] as const;

const LEGACY_FLAT_PREFIXES = LEGACY_SKILL_SYSTEM_KEYS.map((k) => `system.${k}`);

export const RETIRED_ECHO_CARD_KEYS = ['selectedCardIds', 'cardUses'] as const;

const ECHO_CARD_FLAT_PREFIXES = RETIRED_ECHO_CARD_KEYS.map((k) => `system.echo.${k}`);

function isLegacyFlatKey(key: string): boolean {
  if (key === 'system.creation.skillsRedistributing') return true;
  return [...LEGACY_FLAT_PREFIXES, ...ECHO_CARD_FLAT_PREFIXES].some((p) => key === p || key.startsWith(`${p}.`));
}

/** Flag holding the archived legacy skill data (migration and homepage import). */
export const LEGACY_SKILLS_ARCHIVE_FLAG = 'legacySkillsArchive';

/** Flag holding dropped legacy writes until the legacy-cleanup migration archives them. */
export const LEGACY_SKILL_QUARANTINE_FLAG = 'legacySkillWriteQuarantine';

/** Removes legacy skill writes from an update/create payload in place. Returns the dropped values by path. */
export function stripLegacySkillWrites(changed: any): Record<string, unknown> {
  const dropped: Record<string, unknown> = {};
  if (!changed || typeof changed !== 'object') return dropped;

  for (const key of Object.keys(changed)) {
    if (isLegacyFlatKey(key)) {
      dropped[key] = changed[key];
      delete changed[key];
    }
  }

  const system = changed.system;
  if (system && typeof system === 'object') {
    for (const key of LEGACY_SKILL_SYSTEM_KEYS) {
      if (Object.prototype.hasOwnProperty.call(system, key)) {
        dropped[`system.${key}`] = system[key];
        delete system[key];
      }
    }
    for (const key of Object.keys(system)) {
      if (LEGACY_SKILL_SYSTEM_KEYS.some((k) => key.startsWith(`${k}.`))) {
        dropped[`system.${key}`] = system[key];
        delete system[key];
      }
    }
    if (Object.prototype.hasOwnProperty.call(system, 'creation.skillsRedistributing')) {
      dropped['system.creation.skillsRedistributing'] = system['creation.skillsRedistributing'];
      delete system['creation.skillsRedistributing'];
    }
    const creation = system.creation;
    if (creation && typeof creation === 'object' && Object.prototype.hasOwnProperty.call(creation, 'skillsRedistributing')) {
      dropped['system.creation.skillsRedistributing'] = creation.skillsRedistributing;
      delete creation.skillsRedistributing;
    }
    for (const key of Object.keys(system)) {
      if (ECHO_CARD_FLAT_PREFIXES.some((p) => `system.${key}` === p || `system.${key}`.startsWith(`${p}.`))) {
        dropped[`system.${key}`] = system[key];
        delete system[key];
      }
    }
    const echo = system.echo;
    if (echo && typeof echo === 'object') {
      for (const key of RETIRED_ECHO_CARD_KEYS) {
        if (Object.prototype.hasOwnProperty.call(echo, key)) {
          dropped[`system.echo.${key}`] = echo[key];
          delete echo[key];
        }
      }
    }
  }
  return dropped;
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value == null || value === false || value === 0 || value === '') return false;
  if (Array.isArray(value)) return value.some(hasMeaningfulValue);
  if (typeof value === 'object') return Object.values(value as object).some(hasMeaningfulValue);
  return true;
}

/**
 * Strips legacy skill writes and, when they carry data, records them under
 * `flags.mastery-system.${LEGACY_SKILL_QUARANTINE_FLAG}` on the same payload so
 * nothing is lost silently (e.g. a JSON import of a pre-cleanup actor).
 */
export function quarantineLegacySkillWrites(changed: any, existingQuarantine?: unknown): string[] {
  const dropped = stripLegacySkillWrites(changed);
  const meaningful = Object.entries(dropped).filter(([, v]) => hasMeaningfulValue(v));
  if (!meaningful.length) return Object.keys(dropped);
  const prior =
    existingQuarantine && typeof existingQuarantine === 'object' && !Array.isArray(existingQuarantine)
      ? (existingQuarantine as Record<string, unknown>)
      : {};
  const entries = Array.isArray((prior as any).entries) ? [...(prior as any).entries] : [];
  entries.push({ at: Date.now(), values: Object.fromEntries(meaningful) });
  changed.flags ??= {};
  changed.flags['mastery-system'] ??= {};
  changed.flags['mastery-system'][LEGACY_SKILL_QUARANTINE_FLAG] = { entries };
  return Object.keys(dropped);
}
