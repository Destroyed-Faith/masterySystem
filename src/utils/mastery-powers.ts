/**
 * Mastery Powers - All powers from Mastery Trees in the Players Guide
 * 
 * DEPRECATED: This file now re-exports from the modular powers/ directory.
 * Each tree is now in its own file for better maintainability.
 * 
 * To add a new tree:
 * 1. Create a new file in src/utils/powers/your-tree.ts
 * 2. Export a const YOUR_TREE_POWERS: PowerDefinition[]
 * 3. Import and add it to powers/index.ts
 * 
 * @see src/utils/powers/
 */

// Re-export everything from the new modular structure
export * from './powers/types';
export { 
  ALL_MASTERY_POWERS as MASTERY_POWERS,
  getPowersForTree,
  getPower,
  getTreesWithPowers
} from './powers/index';
