import { isHealthBarScarred } from '../utils/calculations.js';

/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export function hideCarouselHpNumbers(actorType: string | undefined, disposition: number): boolean {
  if (actorType !== 'npc') return false;
  return Number(disposition) < 0;
}

export interface CarouselHpSegment {
  name: string;
  shortName: string;
  current: number;
  max: number;
  severity: number;
  widthPct: number;
  scarred: boolean;
}

const SHORT_BAR_NAMES: Record<string, string> = {
  healthy: 'H',
  bruised: 'B',
  injured: 'I',
  wounded: 'W',
  broken: 'Bk',
  incapacitated: 'Out',
};

export function carouselHpBarShortName(name: string, index = 0): string {
  const key = String(name || '').trim().toLowerCase();
  if (SHORT_BAR_NAMES[key]) return SHORT_BAR_NAMES[key];
  const compact = String(name || '').trim();
  return compact.slice(0, 2) || String(index + 1);
}

/** One carousel HP segment per Health Bar, including Scarred so players can see the lock. */
export function buildCarouselHpSegments(bars: unknown): CarouselHpSegment[] {
  if (!Array.isArray(bars) || bars.length === 0) return [];
  let totalMax = 0;
  const normalized = bars.map((bar: any, idx: number) => {
    const current = Math.max(0, Math.floor(Number(bar?.current ?? 0) || 0));
    const max = Math.max(0, Math.floor(Number(bar?.max ?? 0) || 0));
    totalMax += max;
    const name = String(bar?.name ?? `Bar ${idx + 1}`);
    return {
      name,
      shortName: carouselHpBarShortName(name, idx),
      current,
      max,
      severity: Math.min(4, idx),
      scarred: isHealthBarScarred(bar),
    };
  });
  if (totalMax <= 0) return [];
  return normalized.map((bar) => ({
    ...bar,
    widthPct: bar.max > 0 ? (bar.max / totalMax) * 100 : 0,
  }));
}
