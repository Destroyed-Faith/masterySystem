/**
 * Attack-roll attribute for powers is determined by mastery tree or spell school (list), not the power's roll.attribute field.
 * Keys are normalized with trim + lowercase for lookup.
 */
/**
 * Attribute key for attack rolls from a power's `system.tree` (mastery tree or spell school name).
 * Returns null if unknown — caller should fall back to roll.attribute / weapon rules.
 */
export declare function getAttackAttributeForPowerTreeOrSchool(treeOrSchool: string | undefined | null): string | null;
//# sourceMappingURL=power-roll-attribute.d.ts.map