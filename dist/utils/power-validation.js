/**
 * Power Validation Utilities
 * Validates power data according to system rules
 */
/**
 * Validate that a power has no damage types
 */
export function validateNoDamageTypes(power) {
    const errors = [];
    // Check for damageTypes field
    if ('damageTypes' in power) {
        errors.push('Power contains forbidden "damageTypes" field');
    }
    // Check for damage array
    if (Array.isArray(power.damage)) {
        errors.push('Power contains forbidden "damage" array');
    }
    // Check in levels
    if (power.levels && typeof power.levels === 'object') {
        for (const levelKey of ['1', '2', '3', '4']) {
            const level = power.levels[levelKey];
            if (level) {
                if ('damageTypes' in level) {
                    errors.push(`Level ${levelKey} contains forbidden "damageTypes" field`);
                }
                if (Array.isArray(level.damage)) {
                    errors.push(`Level ${levelKey} contains forbidden "damage" array`);
                }
                if (level.effect && 'damageTypes' in level.effect) {
                    errors.push(`Level ${levelKey} effect contains forbidden "damageTypes" field`);
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
 * Validate that charged powers have charges cost
 */
export function validateChargedPower(power) {
    const errors = [];
    if (power.tags && power.tags.includes('charged')) {
        if (!power.cost.charges || power.cost.charges < 1) {
            errors.push('Power tagged as "charged" must have cost.charges >= 1');
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
    // Check required fields
    if (!power.name || typeof power.name !== 'string') {
        errors.push('Power must have a name (string)');
    }
    if (!power.category || !['active', 'activeBuff', 'utility', 'reaction', 'passive', 'movement'].includes(power.category)) {
        errors.push('Power must have a valid category');
    }
    if (!power.levels || typeof power.levels !== 'object') {
        errors.push('Power must have levels object');
    }
    else {
        // Validate all 4 levels exist
        for (const levelKey of ['1', '2', '3', '4']) {
            if (!power.levels[levelKey]) {
                errors.push(`Power must have level ${levelKey}`);
            }
            else {
                const level = power.levels[levelKey];
                if (!level.type || typeof level.type !== 'string') {
                    errors.push(`Level ${levelKey} must have type (string)`);
                }
                if (!level.duration || !level.duration.kind) {
                    errors.push(`Level ${levelKey} must have duration.kind`);
                }
                if (!level.effect || !level.effect.text) {
                    errors.push(`Level ${levelKey} must have effect.text`);
                }
                if (!Array.isArray(level.specials)) {
                    errors.push(`Level ${levelKey} must have specials array`);
                }
            }
        }
    }
    // Check for forbidden fields
    const noDamageTypes = validateNoDamageTypes(power);
    if (!noDamageTypes.valid) {
        errors.push(...noDamageTypes.errors);
    }
    // Check charged validation
    if (power.tags && power.tags.includes('charged')) {
        const charged = validateChargedPower(power);
        if (!charged.valid) {
            errors.push(...charged.errors);
        }
    }
    return {
        valid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=power-validation.js.map