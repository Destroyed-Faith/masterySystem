/**
 * Active-as-Spell helpers for artifact progression picks (Node Editor + runtime).
 */

import type { ArtifactProgressionPick, PowerLevelKey } from '../types/item.js';
import { activeTemplateCanBeSpell } from './power-catalog.js';
import {
  isMartialDeliveryPickId,
  parseMartialDeliveryPickId,
} from './artifact-power-pick.js';

/** Map artifact level (1–9 staged rows) to catalog Power Level (4 / 10 / 16). */
export function artifactLevelToTemplateRank(artifactLevel: number): PowerLevelKey {
  const l = Math.max(1, Math.min(10, Math.floor(Number(artifactLevel) || 1)));
  if (l <= 3) return '4';
  if (l <= 6) return '10';
  return '16';
}

export function uiTemplateIdCanBeSpell(uiTemplateId: string): boolean {
  const id = String(uiTemplateId || '').trim();
  if (!id) return false;
  if (isMartialDeliveryPickId(id)) {
    const delivery = parseMartialDeliveryPickId(id);
    return delivery === 'ranged-single' || delivery === 'ranged-aoe';
  }
  return activeTemplateCanBeSpell(id);
}

/** Whether a stored or resolved pick may be flagged as a Spell. */
export function artifactPickCanBeSpell(
  pick: Pick<ArtifactProgressionPick, 'powerTemplateId' | 'delivery'>,
  uiTemplateId?: string,
): boolean {
  const tid = String(pick.powerTemplateId || '').trim();
  if (tid && activeTemplateCanBeSpell(tid)) return true;
  if (pick.delivery === 'ranged-single' || pick.delivery === 'ranged-aoe') return true;
  if (uiTemplateId) return uiTemplateIdCanBeSpell(uiTemplateId);
  return false;
}
