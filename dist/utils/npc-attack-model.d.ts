/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */
import type { AttackValue } from '../types/actor.js';
export declare function resolveNpcAttackList(system: any): {
    attacks: AttackValue[];
    phaseIndex: number | null;
};
export declare function getNpcAttackByIndex(system: any, attackIndex: number, phaseIndex: number | null | undefined): AttackValue | null;
/** Attack roll pool: explicit count, else parse legacy attackDice as integer, else 0 */
export declare function npcAttackDiceCount(attack: AttackValue | null | undefined): number;
/** Damage formula: Nd8 from count, else legacy damage string */
export declare function npcDamageDiceFormula(attack: AttackValue | null | undefined): string;
export declare function formatNpcSpecialLabel(name: string, value: string | number | undefined | null): string;
/** Compact "Name(12)" for status / effect application (no spaces). */
export declare function npcSpecialEffectString(name: string, value: string | number | undefined | null): string;
//# sourceMappingURL=npc-attack-model.d.ts.map