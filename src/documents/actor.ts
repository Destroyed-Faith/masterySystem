/**
 * Extended Actor document for Mastery System
 */

export class MasteryActor extends Actor {
  /**
   * Augment the basic actor data with additional dynamic data
   */
  prepareData() {
    super.prepareData();
    this.prepareBaseData();
  }

  /**
   * Prepare base data for the actor
   */
  prepareBaseData() {
    const system = (this as any).system;
    
    // Calculate derived values if needed
    if (system.attributes) {
      // Calculate attribute stones
      for (const attr of Object.values(system.attributes) as any[]) {
        if (attr && typeof attr.value === 'number') {
          attr.stones = Math.floor(attr.value / 2);
        }
      }
    }
  }

  /**
   * Heal the actor
   */
  async heal(amount: number): Promise<void> {
    const system = (this as any).system;
    if (system.health && system.health.bars) {
      const currentBar = system.health.bars[system.health.currentBar || 0];
      if (currentBar) {
        currentBar.current = Math.min(currentBar.current + amount, currentBar.max);
        await (this as any).update({ 'system.health': system.health });
      }
    }
  }

  /**
   * Apply damage to the actor
   */
  async applyDamage(amount: number): Promise<void> {
    const system = (this as any).system;
    if (system.health && system.health.bars) {
      const currentBar = system.health.bars[system.health.currentBar || 0];
      if (currentBar) {
        currentBar.current = Math.max(currentBar.current - amount, 0);
        await (this as any).update({ 'system.health': system.health });
      }
    }
  }
}
