/**
 * Actor sheet identity: original world Actor vs unlinked (synthetic) Token actor.
 *
 * Foundry: `actor.isToken === true` means a synthetic Actor embedded in an
 * unlinked Token. Linked Tokens open the world Actor (`isToken === false`).
 * Do not infer from names.
 */

export type ActorSheetIdentityKind = 'unlinked-token' | 'original';

export interface ActorSheetIdentityContext {
  kind: ActorSheetIdentityKind;
  /** True only for synthetic actors from unlinked tokens. */
  isUnlinkedToken: boolean;
  /** Show the optional unobtrusive "original character" chip. */
  showOriginalBadge: boolean;
  /** World Actor id behind an unlinked token, when known. */
  originalActorId: string | null;
  originalActorName: string | null;
  /** User may open the world Actor sheet (OBSERVER+). */
  canOpenOriginal: boolean;
}

function localize(key: string, fallback: string): string {
  try {
    const loc = (globalThis as any).game?.i18n?.localize?.(key);
    if (loc && loc !== key) return String(loc);
  } catch {
    /* ignore */
  }
  return fallback;
}

/** True when `actor` is a synthetic Actor from an unlinked Token. */
export function isUnlinkedTokenActor(actor: any): boolean {
  if (!actor) return false;
  if (actor.isToken === true) return true;
  // Rare edge: TokenDocument present with actorLink explicitly false.
  const token = actor.token;
  if (token && token.actorLink === false && token.actor === actor) return true;
  return false;
}

/** World Actor that seeded this unlinked token, or null. */
export function resolveOriginalActorFromTokenActor(actor: any): any | null {
  if (!isUnlinkedTokenActor(actor)) return null;
  const id = String(actor?.token?.actorId || actor?.token?.actor?.id || '').trim();
  if (!id) return null;
  try {
    return (globalThis as any).game?.actors?.get?.(id) ?? null;
  } catch {
    return null;
  }
}

export function userCanViewActor(actor: any, user?: any): boolean {
  if (!actor) return false;
  const u = user ?? (globalThis as any).game?.user;
  if (!u) return false;
  try {
    if (typeof actor.testUserPermission === 'function') {
      return !!actor.testUserPermission(u, 'OBSERVER');
    }
  } catch {
    /* ignore */
  }
  return !!u.isGM;
}

/** Template context for the shared identity banner / badge. */
export function buildActorSheetIdentityContext(actor: any): ActorSheetIdentityContext {
  if (isUnlinkedTokenActor(actor)) {
    const original = resolveOriginalActorFromTokenActor(actor);
    const canOpen = !!original && userCanViewActor(original);
    return {
      kind: 'unlinked-token',
      isUnlinkedToken: true,
      showOriginalBadge: false,
      originalActorId: original ? String(original.id) : null,
      originalActorName: original ? String(original.name || '') : null,
      canOpenOriginal: canOpen,
    };
  }
  return {
    kind: 'original',
    isUnlinkedToken: false,
    showOriginalBadge: true,
    originalActorId: actor?.id ? String(actor.id) : null,
    originalActorName: actor?.name ? String(actor.name) : null,
    canOpenOriginal: false,
  };
}

/** Open the world Actor sheet for an unlinked token actor (no sync). */
export async function openOriginalActorSheetFromTokenActor(actor: any): Promise<boolean> {
  const original = resolveOriginalActorFromTokenActor(actor);
  const ui = (globalThis as any).ui;
  if (!original) {
    ui?.notifications?.warn?.(
      localize(
        'MASTERY.sheetIdentity.originalMissing',
        'Original character could not be found.',
      ),
    );
    return false;
  }
  if (!userCanViewActor(original)) {
    ui?.notifications?.warn?.(
      localize(
        'MASTERY.sheetIdentity.originalNoPermission',
        'You do not have permission to open the original character.',
      ),
    );
    return false;
  }
  try {
    const sheet = original.sheet;
    if (sheet && typeof sheet.render === 'function') {
      await sheet.render(true);
      sheet.bringToFront?.();
      return true;
    }
  } catch (err) {
    console.warn('Mastery System | openOriginalActorSheetFromTokenActor failed', err);
  }
  ui?.notifications?.warn?.(
    localize(
      'MASTERY.sheetIdentity.originalOpenFailed',
      'Could not open the original character sheet.',
    ),
  );
  return false;
}

/** Bind the "Open Original Character" control (safe to call on every render). */
export function bindActorSheetIdentityControls(root: HTMLElement | JQuery, actor: any): void {
  const el =
    (root as any)?.jquery || (root as any)?.[0]
      ? ((root as any)[0] as HTMLElement)
      : (root as HTMLElement);
  if (!el?.querySelectorAll) return;
  const btns = el.querySelectorAll('[data-action="open-original-actor"]');
  btns.forEach((btn) => {
    if ((btn as HTMLElement).dataset.msIdentityBound === '1') return;
    (btn as HTMLElement).dataset.msIdentityBound = '1';
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      void openOriginalActorSheetFromTokenActor(actor);
    });
  });
}
