/** Foundry i18n with English fallback when keys are missing (e.g. in unit tests). */
export function masteryLocalize(key: string, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(key);
  if (typeof raw === 'string' && raw.length > 0 && raw !== key) return raw;
  return fallback;
}

export function masteryFormat(key: string, data: Record<string, string | number>, fallback: string): string {
  const raw = (globalThis as any).game?.i18n?.format?.(key, data);
  if (typeof raw === 'string' && raw.length > 0 && raw !== key) return raw;
  return fallback;
}
