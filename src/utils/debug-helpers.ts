/**
 * Debug Helpers for Mastery System
 * Utility functions for logging and diagnostics
 */

/**
 * Log a comprehensive summary of an actor's items
 * Useful for debugging weapon/item resolution issues
 */
export function logActorItemSummary(actor: any, tag: string): void {
  if (!actor) {
    console.log(`Mastery System | [${tag}] Actor is null/undefined`);
    return;
  }

  // Safely collect items
  let items: any[] = [];
  if (actor.items) {
    if (Array.isArray(actor.items)) {
      items = actor.items;
    } else if (actor.items instanceof Map) {
      items = Array.from(actor.items.values());
    } else if (actor.items.size !== undefined && actor.items.values) {
      items = Array.from(actor.items.values());
    }
  }

  // Count items by type
  const itemTypes: Record<string, number> = {};
  items.forEach((item: any) => {
    const type = item.type || 'unknown';
    itemTypes[type] = (itemTypes[type] || 0) + 1;
  });

  // Find all weapon items
  const weaponItems = items.filter((item: any) => item.type === 'weapon');
  
  // Build weapon details
  const weaponDetails = weaponItems.map((weapon: any) => {
    const system = weapon.system || {};
    const systemKeys = Object.keys(system);
    
    return {
      id: weapon.id,
      name: weapon.name,
      systemKeys: systemKeys,
      equipped: system.equipped ?? false,
      damage: system.damage ?? null,
      weaponDamage: system.weaponDamage ?? null,
      rollDamage: system.roll?.damage ?? null,
      damageValue: system.damage?.value ?? null,
      weaponDamageValue: system.weaponDamage?.value ?? null
    };
  });

  console.log(`Mastery System | [${tag}] Actor Item Summary`, {
    actorId: actor.id,
    actorName: actor.name,
    itemsCount: items.length,
    itemTypes: itemTypes,
    weaponItemsCount: weaponItems.length,
    weaponDetails: weaponDetails
  });
}

