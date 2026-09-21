/**
 * Pure targeting rules for utility / heal powers.
 * Kept free of Foundry / PIXI so the self-target gate can be unit tested.
 */

export function utilitySingleTargetAllowsSelf(group: string | undefined): boolean {
  return group === 'ally' || group === 'self' || group === 'creature' || group === 'any';
}
