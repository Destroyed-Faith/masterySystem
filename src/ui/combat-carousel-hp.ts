/** Hide exact HP numbers on hostile/secret NPC cards. The bar itself stays. */
export function hideCarouselHpNumbers(actorType: string | undefined, disposition: number): boolean {
  if (actorType !== 'npc') return false;
  return Number(disposition) < 0;
}
