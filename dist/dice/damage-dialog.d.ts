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
    type: 'power' | 'passive' | 'weapon' | 'power-special';
    description: string;
    effect?: string;
    value?: number;
}
export interface DamageResult {
    baseDamage: number;
    powerDamage: number;
    passiveDamage: number;
    raiseDamage: number;
    specialsUsed: string[];
    totalDamage: number;
    /** One line per rolled pool (base / power / passive / each raise d8) for chat */
    rollDetails?: string[];
    /**
     * Evaluated Foundry `Roll` instances (base, power, passive, raise d8s) for chat + 3D dice.
     * Ephemeral — not stored on documents.
     */
    damageChatRolls?: any[];
}
export declare function showDamageDialog(attacker: Actor, target: Actor, weaponId: string | null, selectedPowerId: string | null, raises: number, flags?: any): Promise<DamageResult | null>;
//# sourceMappingURL=damage-dialog.d.ts.map