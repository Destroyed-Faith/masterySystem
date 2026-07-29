/**
 * Encounter Generator — Threat Report.
 *
 * Pure and Foundry-free. Computes the measurable target values the GM sees
 * before saving: hit chances vs low/avg/high evade, expected damage before/
 * after armor, persistent (armor-ignoring) damage, first-round burst, group
 * damage per round, enemy actions incl. adds, expected duration — plus the
 * same numbers expressed in party HEALTH LEVELS, and balancing warnings.
 */
import { type Rng } from './encounter-generator-analysis.js';
import type { EncounterProjectPlan, PartyMetrics, ThreatReport } from './encounter-generator-types.js';
export declare function buildThreatReport(party: PartyMetrics, plan: EncounterProjectPlan, rng?: Rng): ThreatReport;
//# sourceMappingURL=encounter-generator-threat.d.ts.map