/**
 * NPC attack helpers — d8 pool sizes, phase index, damage formula.
 */
import type { AttackValue } from '../types/actor.js';
/** Human-readable name for chat / attack card (catalog id or legacy key). */
export declare function displayNpcSpecialName(raw: string): string;
/** Effective attack row for display / damage (includes merged specials). */
export declare function normalizeNpcAttackRow(attack: AttackValue): AttackValue;
/** Per-power attack uses this round (sheet dropdown 1–5; default 1). */
export declare function npcAttacksPerRoundCap(attack: AttackValue | null | undefined): number;
export declare function resolveNpcAttackList(system: any): {
    attacks: AttackValue[];
    phaseIndex: number | null;
};
export declare function getNpcAttackByIndex(system: any, attackIndex: number, phaseIndex: number | null | undefined): AttackValue | null;
/** Attack roll pool: explicit count (2–16 typical), else parse legacy attackDice */
export declare function npcAttackDiceCount(attack: AttackValue | null | undefined): number;
/** Damage formula: Nd8 from count (4–16 typical), else legacy damage string */
export declare function npcDamageDiceFormula(attack: AttackValue | null | undefined): string;
export declare function formatNpcSpecialLabel(name: string, value: string | number | undefined | null): string;
/** All specials on one attack (array or legacy single). */
export declare function formatNpcAttackSpecialsLine(attack: AttackValue | null | undefined): string;
/** Compact "Name(12)" for status / effect application (no spaces). */
export declare function npcSpecialEffectString(name: string, value: string | number | undefined | null): string;
//# sourceMappingURL=npc-attack-model.d.ts.map