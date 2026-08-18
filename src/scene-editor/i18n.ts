export function t(key: string, fallback: string, data?: Record<string, string | number>): string {
  const raw = (globalThis as any).game?.i18n?.localize?.(`MASTERY.sceneEditor.${key}`) || fallback;
  if (!data) return raw;
  return Object.entries(data).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), raw);
}
