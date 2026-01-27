/**
 * Power Data Validation Utilities
 * Validates power data according to schema rules
 */
import type { EmbeddedPowerData } from '../types/item.js';
/**
 * Validate that a power has no damage type arrays
 */
export declare function validateNoDamageTypes(power: any): {
    valid: boolean;
    errors: string[];
};
/**
 * Validate that charged powers have charges >= 1
 */
export declare function validateChargedPower(power: EmbeddedPowerData): {
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