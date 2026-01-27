/**
 * Power Validation Utilities
 * Validates power data according to system rules
 */
import type { EmbeddedPowerData, PowerData } from '../types/item.js';
/**
 * Validate that a power has no damage types
 */
export declare function validateNoDamageTypes(power: any): {
    valid: boolean;
    errors: string[];
};
/**
 * Validate that charged powers have charges cost
 */
export declare function validateChargedPower(power: EmbeddedPowerData | PowerData): {
    valid: boolean;
    errors: string[];
};
/**
 * Validate a power's structure
 */
export declare function validatePower(power: any): {
    valid: boolean;
    errors: string[];
};
//# sourceMappingURL=power-validation.d.ts.map