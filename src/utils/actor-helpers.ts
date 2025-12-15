/**
 * Actor Helper Functions for Mastery System
 */

/**
 * Check if an actor is currently Prone
 * @param actor - The actor to check
 * @param token - Optional token for the actor (if not provided, will try to find it)
 * @returns true if the actor is Prone
 */
export function isActorProne(actor: any, _token?: any): boolean {
  if (!actor) return false;
  
  // Method 1: Check actor's effects/conditions for Prone
  // In Foundry v13, conditions are typically stored in actor.effects or actor.statuses
  if (actor.effects) {
    const proneEffect = actor.effects.find((e: any) => {
      const name = e.name?.toLowerCase() || '';
      const label = e.label?.toLowerCase() || '';
      return name.includes('prone') || label.includes('prone');
    });
    if (proneEffect) return true;
  }
  
  // Method 2: Check actor's statuses (Foundry v13)
  if ((actor as any).statuses) {
    const statuses = (actor as any).statuses;
    if (statuses.has && statuses.has(CONST.STATUS_EFFECTS.PRONE)) {
      return true;
    }
    // Also check by name
    if (statuses.size > 0) {
      for (const status of statuses) {
        const name = (status.name || status.id || '').toLowerCase();
        if (name.includes('prone')) {
          return true;
        }
      }
    }
  }
  
  // Method 3: Check system flags/flags
  const flags = actor.flags || {};
  const masteryFlags = flags['mastery-system'] || {};
  if (masteryFlags.prone === true || masteryFlags.conditions?.prone === true) {
    return true;
  }
  
  // Method 4: Check system data for prone condition
  const system = (actor.system as any) || {};
  if (system.conditions?.prone === true || system.status?.prone === true) {
    return true;
  }
  
  // Method 5: Check token's elevation (if prone, might be at negative elevation)
  // This is less reliable, but some systems use it
  // Skipped for now as it's system-dependent
  
  return false;
}

