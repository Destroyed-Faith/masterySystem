/**
 * Actor sheet identity: original world Actor vs unlinked (synthetic) Token actor.
 *
 * Foundry: `actor.isToken === true` means a synthetic Actor embedded in an
 * unlinked Token. Linked Tokens open the world Actor (`isToken === false`).
 * Do not infer from names.
 */
function localize(key, fallback) {
    try {
        const loc = globalThis.game?.i18n?.localize?.(key);
        if (loc && loc !== key)
            return String(loc);
    }
    catch {
        /* ignore */
    }
    return fallback;
}
/** True when `actor` is a synthetic Actor from an unlinked Token. */
export function isUnlinkedTokenActor(actor) {
    if (!actor)
        return false;
    if (actor.isToken === true)
        return true;
    // Rare edge: TokenDocument present with actorLink explicitly false.
    const token = actor.token;
    if (token && token.actorLink === false && token.actor === actor)
        return true;
    return false;
}
/** True when the current user is a GM (Foundry `game.user.isGM`). */
export function isCurrentUserGm() {
    try {
        return !!globalThis.game?.user?.isGM;
    }
    catch {
        return false;
    }
}
/**
 * Permanent progression edits are blocked on unlinked token sheets for players.
 * GMs may still edit (Dispatch/test tokens are throwaway). Combat stays editable for everyone.
 * Returns false after a warning when locked.
 */
export function assertProgressionEditable(actor, opts) {
    if (!isUnlinkedTokenActor(actor))
        return true;
    if (isCurrentUserGm())
        return true;
    if (!opts?.silent) {
        const ui = globalThis.ui;
        ui?.notifications?.warn?.(localize('MASTERY.sheetIdentity.progressionLocked', 'Progression is locked on this unlinked token. Open the original character to buy powers, assign stones, or spend XP.'));
    }
    return false;
}
/** World Actor that seeded this unlinked token, or null. */
export function resolveOriginalActorFromTokenActor(actor) {
    if (!isUnlinkedTokenActor(actor))
        return null;
    const id = String(actor?.token?.actorId || actor?.token?.actor?.id || '').trim();
    if (!id)
        return null;
    try {
        return globalThis.game?.actors?.get?.(id) ?? null;
    }
    catch {
        return null;
    }
}
export function userCanViewActor(actor, user) {
    if (!actor)
        return false;
    const u = user ?? globalThis.game?.user;
    if (!u)
        return false;
    try {
        if (typeof actor.testUserPermission === 'function') {
            return !!actor.testUserPermission(u, 'OBSERVER');
        }
    }
    catch {
        /* ignore */
    }
    return !!u.isGM;
}
/** Template context for the shared identity banner / badge. */
export function buildActorSheetIdentityContext(actor) {
    if (isUnlinkedTokenActor(actor)) {
        const original = resolveOriginalActorFromTokenActor(actor);
        const canOpen = !!original && userCanViewActor(original);
        const gm = isCurrentUserGm();
        return {
            kind: 'unlinked-token',
            isUnlinkedToken: true,
            // Players locked; GM keeps progression controls for throwaway Dispatch tests.
            progressionLocked: !gm,
            showOriginalBadge: false,
            originalActorId: original ? String(original.id) : null,
            originalActorName: original ? String(original.name || '') : null,
            canOpenOriginal: canOpen,
        };
    }
    return {
        kind: 'original',
        isUnlinkedToken: false,
        progressionLocked: false,
        showOriginalBadge: true,
        originalActorId: actor?.id ? String(actor.id) : null,
        originalActorName: actor?.name ? String(actor.name) : null,
        canOpenOriginal: false,
    };
}
/** Open the world Actor sheet for an unlinked token actor (no sync). */
export async function openOriginalActorSheetFromTokenActor(actor) {
    const original = resolveOriginalActorFromTokenActor(actor);
    const ui = globalThis.ui;
    if (!original) {
        ui?.notifications?.warn?.(localize('MASTERY.sheetIdentity.originalMissing', 'Original character could not be found.'));
        return false;
    }
    if (!userCanViewActor(original)) {
        ui?.notifications?.warn?.(localize('MASTERY.sheetIdentity.originalNoPermission', 'You do not have permission to open the original character.'));
        return false;
    }
    try {
        const sheet = original.sheet;
        if (sheet && typeof sheet.render === 'function') {
            await sheet.render(true);
            sheet.bringToFront?.();
            return true;
        }
    }
    catch (err) {
        console.warn('Mastery System | openOriginalActorSheetFromTokenActor failed', err);
    }
    ui?.notifications?.warn?.(localize('MASTERY.sheetIdentity.originalOpenFailed', 'Could not open the original character sheet.'));
    return false;
}
/** Bind the "Open Original Character" control (safe to call on every render). */
export function bindActorSheetIdentityControls(root, actor) {
    const el = root?.jquery || root?.[0]
        ? root[0]
        : root;
    if (!el?.querySelectorAll)
        return;
    const btns = el.querySelectorAll('[data-action="open-original-actor"]');
    btns.forEach((btn) => {
        if (btn.dataset.msIdentityBound === '1')
            return;
        btn.dataset.msIdentityBound = '1';
        btn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void openOriginalActorSheetFromTokenActor(actor);
        });
    });
}
//# sourceMappingURL=actor-sheet-identity.js.map