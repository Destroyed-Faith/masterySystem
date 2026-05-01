/**
 * Power Data Validation Utilities
 * Validates power data according to schema rules
 */
/**
 * Validate that a power has no damage type arrays
 */
export function validateNoDamageTypes(power) {
    const errors = [];
    // Check for damageTypes field
    if ('damageTypes' in power) {
        errors.push('Power contains forbidden "damageTypes" field');
    }
    // Check for damage array
    if (Array.isArray(power.damage)) {
        errors.push('Power contains forbidden "damage[]" array');
    }
    // Check in levels
    if (power.levels && typeof power.levels === 'object') {
        for (const [levelKey, levelData] of Object.entries(power.levels)) {
            const level = levelData;
            if ('damageTypes' in level) {
                errors.push(`Level ${levelKey} contains forbidden "damageTypes" field`);
            }
            if (Array.isArray(level.damage)) {
                errors.push(`Level ${levelKey} contains forbidden "damage[]" array`);
            }
            // Check in effect
            if (level.effect && typeof level.effect === 'object') {
                if ('damageTypes' in level.effect) {
                    errors.push(`Level ${levelKey}.effect contains forbidden "damageTypes" field`);
                }
                if (Array.isArray(level.effect.damage)) {
                    errors.push(`Level ${levelKey}.effect contains forbidden "damage[]" array`);
                }
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Validate that charged powers have charges >= 1
 */
export function validateChargedPower(power) {
    const errors = [];
    if (power.tags.includes('charged')) {
        if (!power.cost.charges || power.cost.charges < 1) {
            errors.push('Power with "charged" tag must have cost.charges >= 1');
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
/**
 * Validate a power's structure
 */
export function validatePower(power) {
    const errors = [];
    // Check for damage types
    const damageCheck = validateNoDamageTypes(power);
    errors.push(...damageCheck.errors);
    // Check charged validation if it's an EmbeddedPowerData
    if (power.category && power.levels) {
        const chargedCheck = validateChargedPower(power);
        errors.push(...chargedCheck.errors);
    }
    // Ensure required fields exist
    if (power.category && power.levels) {
        if (!power.id) {
            errors.push('Power missing required "id" field');
        }
        if (!power.name) {
            errors.push('Power missing required "name" field');
        }
        if (!power.category) {
            errors.push('Power missing required "category" field');
        }
        if (!Array.isArray(power.tags)) {
            errors.push('Power "tags" must be an array');
        }
        if (!power.cost || typeof power.cost !== 'object') {
            errors.push('Power missing required "cost" field');
        }
        if (!power.levels || typeof power.levels !== 'object') {
            errors.push('Power missing required "levels" field');
        }
        else {
            // Players Guide / Actives.md: Active templates run 1..16. Validate all
            // 16 keys exist so future migrations / catalog rebuilds can rely on a
            // dense level table.
            for (let i = 1; i <= 16; i++) {
                const key = String(i);
                if (!power.levels[key]) {
                    errors.push(`Power missing required level "${key}"`);
                }
            }
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=power-validation.js.map