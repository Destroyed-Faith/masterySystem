/**
 * Damage Dialog for Mastery System
 * Appears after successful attack roll to calculate and apply damage
 */
export interface DamageDialogData {
    attacker: Actor;
    target: Actor;
    weapon: any | null;
    baseDamage: string;
    powerDamage: string;
    passiveDamage: string;
    raises: number;
    availableSpecials: SpecialOption[];
    weaponSpecials: string[];
}
export interface SpecialOption {
    id: string;
    name: string;
    type: 'power' | 'passive' | 'weapon';
    description: string;
    effect?: string;
}
export interface DamageResult {
    baseDamage: number;
    powerDamage: number;
    passiveDamage: number;
    raiseDamage: number;
    specialsUsed: string[];
    totalDamage: number;
}
/**
 * Show damage dialog after successful attack
 */
export declare function showDamageDialog(attacker: Actor, target: Actor, weapon: any | null, raises: number, _flags?: any): Promise<DamageResult | null>;
//# sourceMappingURL=damage-dialog.d.ts.map