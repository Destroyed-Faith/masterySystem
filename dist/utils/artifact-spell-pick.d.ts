/**
 * Active-as-Spell helpers for artifact progression picks (Node Editor + runtime).
 */
import type { ArtifactProgressionPick, PowerLevelKey } from '../types/item.js';
/** Map artifact level (1–9 staged rows) to catalog Power Level (4 / 10 / 16). */
export declare function artifactLevelToTemplateRank(artifactLevel: number): PowerLevelKey;
export declare function uiTemplateIdCanBeSpell(uiTemplateId: string): boolean;
/** Whether a stored or resolved pick may be flagged as a Spell. */
export declare function artifactPickCanBeSpell(pick: Pick<ArtifactProgressionPick, 'powerTemplateId' | 'delivery'>, uiTemplateId?: string): boolean;
//# sourceMappingURL=artifact-spell-pick.d.ts.map