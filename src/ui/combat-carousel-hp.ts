import { isHealthBarScarred } from '../utils/calculations.js';
import { HEALTH_PENALTY_FRACTIONS } from '../utils/constants.js';

/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export function hideCarouselHpNumbers(actorType: string | undefined, disposition: number): boolean {
  if (actorType !== 'npc') return false;
  return Number(disposition) < 0;
}

export interface CarouselHpSegment {
  name: string;
  shortName: string;
  /** Deducted pool percent for this bar, e.g. "−10%". Healthy is "0%". */
  penaltyLabel: string;
  /** Bar name plus the deducted percent, for the segment hover. */
  hoverTitle: string;
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

/** Pool percent this wound bar deducts. Index follows HEALTH_PENALTY_FRACTIONS. */
export function carouselHpPenaltyLabel(index: number): string {
  const clamped = Math.max(0, Math.floor(Number(index) || 0));
  const fraction =
    HEALTH_PENALTY_FRACTIONS[Math.min(clamped, HEALTH_PENALTY_FRACTIONS.length - 1)] ?? 0;
  const pct = Math.round(fraction * 100);
  if (pct <= 0) return '0%';
  return `−${pct}%`;
}

export function carouselHpHoverTitle(name: string, index: number, scarred: boolean): string {
  const label = String(name || '').trim() || `Bar ${index + 1}`;
  const penalty = carouselHpPenaltyLabel(index);
  const base = `${label} · ${penalty}`;
  return scarred ? `${base} · Scarred` : base;
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
    const scarred = isHealthBarScarred(bar);
    return {
      name,
      shortName: carouselHpBarShortName(name, idx),
      penaltyLabel: carouselHpPenaltyLabel(idx),
      hoverTitle: carouselHpHoverTitle(name, idx, scarred),
      current,
      max,
      severity: Math.min(4, idx),
      scarred,
    };
  });
  if (totalMax <= 0) return [];
  return normalized.map((bar) => ({
    ...bar,
    widthPct: bar.max > 0 ? (bar.max / totalMax) * 100 : 0,
  }));
}
