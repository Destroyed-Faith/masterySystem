/**
 * Which Active Buff button is the one currently maintained, and which of
 * those was chosen in this Preparation. Artifact buffs store artifactBuffKey
 * instead of powerId, and empowerment can raise the shown Power Level above
 * the listed row.
 */

export interface ActiveBuffOptionRef {
  id: string;
  name: string;
  level: number;
}

export interface ActiveBuffOptionMarks {
  isActive: boolean;
  chosenThisRound: boolean;
}

function flagsOf(effect: any): Record<string, unknown> {
  return (effect?.flags?.['mastery-system'] ?? {}) as Record<string, unknown>;
}

function sameName(a: unknown, b: unknown): boolean {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  return left.length > 0 && left === right;
}

export function activeBuffOptionMarks(
  option: ActiveBuffOptionRef,
  maintained: any | null | undefined,
  round: number,
  options: readonly ActiveBuffOptionRef[],
): ActiveBuffOptionMarks {
  if (!maintained) return { isActive: false, chosenThisRound: false };
  const flags = flagsOf(maintained);
  const id = String(option.id || '');
  const powerId = flags.powerId != null ? String(flags.powerId) : '';
  const artifactKey = flags.artifactBuffKey != null ? String(flags.artifactBuffKey) : '';
  let isActive = (!!powerId && powerId === id) || (!!artifactKey && artifactKey === id);

  if (!isActive) {
    const effectName = flags.powerName ?? maintained.name;
    if (sameName(option.name, effectName)) {
      const effectLevel = Math.floor(Number(flags.effectiveLevel ?? flags.level) || 0);
      const same = options.filter((row) => sameName(row.name, effectName));
      if (effectLevel > 0 && option.level === effectLevel) isActive = true;
      else if (same.length === 1) isActive = true;
    }
  }

  const actRound = Math.floor(Number(flags.activationRound ?? flags.activatedRound) || 0);
  const chosenThisRound = isActive && actRound > 0 && actRound === Math.floor(Number(round) || 0);
  return { isActive, chosenThisRound };
}
