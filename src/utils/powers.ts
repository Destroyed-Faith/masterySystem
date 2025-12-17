/**
 * Power utilities for the Mastery System
 */

export interface PowerDefinition {
  id: string;
  name: string;
  type: 'active' | 'passive' | 'reaction' | 'movement' | 'utility' | 'spell' | 'buff';
  description: string;
  cost?: {
    actions?: number;
    stones?: number;
    movement?: number;
  };
  requirements?: {
    masteryRank?: number;
    attributes?: Record<string, number>;
  };
}

/**
 * Get all available powers for an actor
 */
export function getAvailablePowers(actor: Actor): PowerDefinition[] {
  const items = (actor as any).items || [];
  
  return items.filter((item: any) => 
    item.type === 'power' || 
    item.type === 'spell'
  );
}

/**
 * Check if a power can be used
 */
export function canUsePower(actor: Actor, power: any): boolean {
  const system = (actor as any).system;
  
  // Check action economy
  if (power.system?.cost?.actions) {
    const availableActions = system.resources?.actions?.value || 0;
    if (availableActions < power.system.cost.actions) {
      return false;
    }
  }
  
  // Check stone cost
  if (power.system?.cost?.stones) {
    const availableStones = system.stones?.current || 0;
    if (availableStones < power.system.cost.stones) {
      return false;
    }
  }
  
  return true;
}
