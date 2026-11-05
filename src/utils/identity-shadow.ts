/**
 * C1 Shadow-Compare: legacy path decides; identity path runs in parallel and logs diffs.
 * Never changes combat outcomes (plan §10.5 / Batch C1 / K5).
 */

export type IdentityShadowDecision =
  | {
      kind: 'resolved';
      templateId: string | null;
      artifactFunctionId: string | null;
      category: string | null;
      rank: number | null;
      extras?: Record<string, unknown>;
    }
  | { kind: 'unresolved'; reason: string }
  | { kind: 'legacy'; value: unknown };

export interface IdentityShadowEntry {
  siteId: string;
  at: string;
  legacy: unknown;
  identity: unknown;
  equal: boolean;
  ref?: Record<string, unknown>;
  /** Stable dedupe key (siteId + fingerprint). */
  dedupeKey: string;
}

/** Soft cap — oldest mismatch entries are dropped first when exceeded. */
export const IDENTITY_SHADOW_LOG_CAP = 500;

const sessionLog: IdentityShadowEntry[] = [];
const dedupeIndex = new Map<string, number>();
let enabled = true;
let skippedNpcOrManeuver = 0;

export function setIdentityShadowEnabled(value: boolean): void {
  enabled = value;
}

export function getIdentityShadowLog(): readonly IdentityShadowEntry[] {
  return sessionLog;
}

export function clearIdentityShadowLog(): void {
  sessionLog.length = 0;
  dedupeIndex.clear();
  skippedNpcOrManeuver = 0;
}

export function getIdentityShadowSkipCount(): number {
  return skippedNpcOrManeuver;
}

export function exportIdentityShadowReport(opts?: { cluster?: string }): {
  generatedAt: string;
  total: number;
  mismatches: number;
  skippedNpcOrManeuver: number;
  cluster?: string;
  entries: IdentityShadowEntry[];
} {
  let entries = [...sessionLog];
  if (opts?.cluster) {
    const prefix = opts.cluster.endsWith('.') ? opts.cluster : `${opts.cluster}.`;
    entries = entries.filter(
      (e) => e.siteId === opts.cluster || e.siteId.startsWith(prefix) || e.siteId.startsWith(opts.cluster!),
    );
  }
  const mismatches = entries.filter((e) => !e.equal).length;
  return {
    generatedAt: new Date().toISOString(),
    total: entries.length,
    mismatches,
    skippedNpcOrManeuver,
    ...(opts?.cluster ? { cluster: opts.cluster } : {}),
    entries,
  };
}

/** Group mismatches by siteId prefix (first segment before `.`). */
export function exportIdentityShadowClusterReports(): Record<
  string,
  ReturnType<typeof exportIdentityShadowReport>
> {
  const clusters = new Set<string>();
  for (const e of sessionLog) {
    clusters.add(e.siteId.split('.')[0] || e.siteId);
  }
  const out: Record<string, ReturnType<typeof exportIdentityShadowReport>> = {};
  for (const c of clusters) {
    out[c] = exportIdentityShadowReport({ cluster: c });
  }
  return out;
}

function stableEqual(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

function fingerprint(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function shouldSkipRef(ref?: Record<string, unknown>): boolean {
  if (!ref) return false;
  const source = String(ref.source || ref.optionSource || '');
  if (source === 'npc-attack' || source === 'maneuver') return true;
  if (ref.skipNpcOrManeuver === true) return true;
  return false;
}

function pushEntry(entry: IdentityShadowEntry): void {
  const existingIdx = dedupeIndex.get(entry.dedupeKey);
  if (existingIdx != null && sessionLog[existingIdx]) {
    // Refresh timestamp; keep first mismatch semantics (still one slot).
    sessionLog[existingIdx] = entry;
    return;
  }
  if (sessionLog.length >= IDENTITY_SHADOW_LOG_CAP) {
    // Drop oldest equal entries first; if none, drop oldest overall.
    let dropIdx = sessionLog.findIndex((e) => e.equal);
    if (dropIdx < 0) dropIdx = 0;
    const dropped = sessionLog.splice(dropIdx, 1)[0];
    if (dropped) dedupeIndex.delete(dropped.dedupeKey);
    // Rebuild index for shifted positions.
    dedupeIndex.clear();
    sessionLog.forEach((e, i) => dedupeIndex.set(e.dedupeKey, i));
  }
  dedupeIndex.set(entry.dedupeKey, sessionLog.length);
  sessionLog.push(entry);
}

/**
 * Compare legacy decision vs identity decision. Always returns the legacy value.
 * Identity exceptions are swallowed and logged — they must never affect the legacy path.
 */
export function compareIdentityDecision<T>(
  siteId: string,
  legacyDecision: T,
  identityDecisionFactory: () => unknown,
  ref?: Record<string, unknown>,
): T {
  if (!enabled) return legacyDecision;
  if (shouldSkipRef(ref)) {
    skippedNpcOrManeuver += 1;
    return legacyDecision;
  }

  let identity: unknown;
  try {
    identity = identityDecisionFactory();
  } catch (err) {
    identity = {
      kind: 'identity-threw',
      message: err instanceof Error ? err.message : String(err),
    };
  }
  const equal = stableEqual(legacyDecision, identity);
  const dedupeKey = `${siteId}::${fingerprint(ref)}::${fingerprint(legacyDecision)}::${fingerprint(identity)}`;
  const entry: IdentityShadowEntry = {
    siteId,
    at: new Date().toISOString(),
    legacy: legacyDecision,
    identity,
    equal,
    ref,
    dedupeKey,
  };
  pushEntry(entry);
  if (!equal && typeof console !== 'undefined' && console.info) {
    console.info('[identity-shadow]', siteId, { legacy: legacyDecision, identity, ref });
  }
  return legacyDecision;
}
