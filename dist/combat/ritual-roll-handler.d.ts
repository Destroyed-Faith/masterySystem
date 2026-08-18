/**
 * Ritual skill-check flow: declared Raises, Base TN = 8 × Ritual MR,
 * stones Sealed on the attempt (success or failure).
 */
import { type RitualDefinition } from '../utils/rituals.js';
export declare function showRitualRollDialog(actor: Actor, ritualId?: string): Promise<void>;
export declare function performRitualRoll(actor: Actor, ritual: RitualDefinition, opts: {
    skillKey: string;
    attributeKey: string;
    baseTn: number;
    ritualMR: number;
    gmMod: number;
    declaredRaises: number;
    placedAttrs?: string[];
}): Promise<void>;
//# sourceMappingURL=ritual-roll-handler.d.ts.map