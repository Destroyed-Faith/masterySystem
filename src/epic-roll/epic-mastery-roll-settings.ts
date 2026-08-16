/**
 * Epic Mastery Roll — module settings.
 */

import type { EpicMasteryRollPreset } from './epic-mastery-roll-types.js';

export function registerEpicMasteryRollSettings(): void {
  game.settings.register('mastery-system', 'epicRollSummaryVisibility', {
    name: 'Epic Mastery Roll: Summary Visibility',
    hint: 'Who can see the final Epic Mastery Roll summary in chat.',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      all: 'Everyone',
      gm: 'GM only (whisper)',
    },
    default: 'all',
  });

  game.settings.register('mastery-system', 'epicRollRecentPresets', {
    name: 'Epic Mastery Roll: Recent Presets',
    scope: 'client',
    config: false,
    type: Object,
    default: [] as EpicMasteryRollPreset[],
  });
}

export function loadEpicRollRecentPresets(): EpicMasteryRollPreset[] {
  const raw = game.settings.get('mastery-system', 'epicRollRecentPresets');
  return Array.isArray(raw) ? (raw as EpicMasteryRollPreset[]) : [];
}

export async function saveEpicRollRecentPreset(preset: EpicMasteryRollPreset): Promise<void> {
  const existing = loadEpicRollRecentPresets();
  const filtered = existing.filter(
    (p) =>
      !(
        p.title === preset.title &&
        p.roll.kind === preset.roll.kind &&
        JSON.stringify(p.roll) === JSON.stringify(preset.roll) &&
        p.tn.baseTN === preset.tn.baseTN
      ),
  );
  const next = [preset, ...filtered].slice(0, 5);
  await game.settings.set('mastery-system', 'epicRollRecentPresets', next);
}

export function listEpicRollCandidateActors(): Array<{
  id: string;
  name: string;
  type: string;
  img: string;
}> {
  const actors = (game.actors?.contents ?? []) as Actor[];
  return actors
    .filter((a: Actor) => a.type === 'character')
    .map((a: Actor) => {
      const actor = a as any;
      return {
        id: String(actor.id),
        name: String(actor.name ?? 'Unknown'),
        type: String(actor.type),
        img: String(actor.img ?? ''),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
