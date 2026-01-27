/**
 * Power Data Migration Utilities
 * Migrates old power structure to new structure
 */
import type { ArtifactPowerData, EmbeddedPowerData, PowerData } from '../types/item.js';
/**
 * Check if a power uses the new structure
 */
export declare function isNewPowerStructure(power: any): power is EmbeddedPowerData;
/**
 * Check if a power uses the old structure
 */
export declare function isOldPowerStructure(power: any): power is ArtifactPowerData;
/**
 * Migrate old ArtifactPowerData to EmbeddedPowerData
 */
export declare function migrateArtifactPower(oldPower: ArtifactPowerData): EmbeddedPowerData;
/**
 * Migrate old PowerData (item-level) to new structure
 * This is called during Item.prepareData()
 */
export declare function migratePowerData(oldPower: PowerData): PowerData;
//# sourceMappingURL=power-migration.d.ts.map