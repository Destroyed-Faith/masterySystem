/**
 * Epic Mastery Roll — module settings.
 */
import type { EpicMasteryRollPreset } from './epic-mastery-roll-types.js';
export declare function registerEpicMasteryRollSettings(): void;
export declare function loadEpicRollRecentPresets(): EpicMasteryRollPreset[];
export declare function saveEpicRollRecentPreset(preset: EpicMasteryRollPreset): Promise<void>;
export declare function listEpicRollCandidateActors(): Array<{
    id: string;
    name: string;
    type: string;
    img: string;
}>;
//# sourceMappingURL=epic-mastery-roll-settings.d.ts.map