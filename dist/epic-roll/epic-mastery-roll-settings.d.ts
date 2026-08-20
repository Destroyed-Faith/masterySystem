/**
 * Epic Mastery Roll — module settings.
 */
import type { EpicMasteryRollPreset } from './epic-mastery-roll-types.js';
export declare function registerEpicMasteryRollSettings(): void;
export declare function loadEpicRollRecentPresets(): EpicMasteryRollPreset[];
export declare function saveEpicRollRecentPreset(preset: EpicMasteryRollPreset): Promise<void>;
type EpicRollActorRow = {
    id: string;
    name: string;
    type: string;
    img: string;
};
/**
 * Skill Roll participants: player character sheets only.
 * NPC sheets, summons, and generic/other actor types never qualify.
 */
export declare function isEpicRollPlayerCharacter(actor: unknown): boolean;
export declare function listEpicRollCandidatesFrom(actors: Iterable<unknown>): EpicRollActorRow[];
export declare function listEpicRollCandidateActors(): EpicRollActorRow[];
export {};
//# sourceMappingURL=epic-mastery-roll-settings.d.ts.map