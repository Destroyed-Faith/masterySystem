/**
 * Dialog: create a mundane custom item (gear) for General Items Storage / actor.
 */
import { createCustomCatalogItem, listMundaneItemIconChoices, } from '../utils/custom-catalog-items.js';
function esc(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/"/g, '&quot;');
}
function loc(key, fallback) {
    const raw = globalThis.game?.i18n?.localize?.(`MASTERY.customCatalog.${key}`);
    return raw && raw !== `MASTERY.customCatalog.${key}` ? raw : fallback;
}
/**
 * Open a simple create dialog: name, description, effect, icon grid.
 */
export async function openCustomCatalogItemDialog(options = {}) {
    const g = globalThis;
    const DialogCtor = g.Dialog;
    if (typeof DialogCtor !== 'function')
        return;
    const icons = listMundaneItemIconChoices();
    let selectedImg = icons[0]?.path || 'icons/svg/item-bag.svg';
    const isGM = !!g.game?.user?.isGM;
    const hasActor = !!options.actor;
    const iconButtons = icons
        .map((icon, i) => `<button type="button" class="ms-custom-catalog-icon-btn${i === 0 ? ' is-selected' : ''}" data-icon-path="${esc(icon.path)}" title="${esc(icon.label)}" aria-label="${esc(icon.label)}" aria-pressed="${i === 0 ? 'true' : 'false'}">
        <img src="${esc(icon.path)}" alt="" />
      </button>`)
        .join('');
    await new Promise((resolve) => {
        const dialog = new DialogCtor({
            title: loc('title', 'New Equipment Item'),
            content: `<form class="ms-custom-catalog-dialog">
        <p class="ms-custom-catalog-lead">${esc(loc('lead', 'Create a normal gear item.'))}</p>
        <label class="ms-custom-catalog-field">
          <span>${esc(loc('name', 'Name'))}</span>
          <input type="text" class="js-custom-item-name" maxlength="80" required placeholder="${esc(loc('namePlaceholder', 'e.g. Travel Lantern'))}" />
        </label>
        <label class="ms-custom-catalog-field">
          <span>${esc(loc('description', 'Description'))}</span>
          <textarea class="js-custom-item-description" rows="3" placeholder="${esc(loc('descriptionPlaceholder', 'What it looks like…'))}"></textarea>
        </label>
        <label class="ms-custom-catalog-field">
          <span>${esc(loc('effect', 'What it does'))}</span>
          <textarea class="js-custom-item-effect" rows="2" placeholder="${esc(loc('effectPlaceholder', 'Optional rules note…'))}"></textarea>
        </label>
        <fieldset class="ms-custom-catalog-icons">
          <legend>${esc(loc('icon', 'Icon'))}</legend>
          <div class="ms-custom-catalog-icon-grid">${iconButtons}</div>
        </fieldset>
        <div class="ms-custom-catalog-options">
          ${isGM
                ? `<label class="ms-custom-catalog-check"><input type="checkbox" class="js-custom-item-world" checked /> <span>${esc(loc('addToWorld', 'Add to General Items Storage (shared catalog)'))}</span></label>`
                : ''}
          ${hasActor
                ? `<label class="ms-custom-catalog-check"><input type="checkbox" class="js-custom-item-give"${isGM ? '' : ' checked'} /> <span>${esc(loc('giveToActor', 'Also give a copy to this character'))}</span></label>`
                : ''}
        </div>
      </form>`,
            buttons: {
                create: {
                    icon: '<i class="fas fa-plus"></i>',
                    label: loc('create', 'Create'),
                    callback: async (html) => {
                        const root = g.$(html);
                        const name = String(root.find('.js-custom-item-name').val() || '').trim();
                        const description = String(root.find('.js-custom-item-description').val() || '');
                        const effect = String(root.find('.js-custom-item-effect').val() || '');
                        const addToWorldCatalog = isGM ? !!root.find('.js-custom-item-world').prop('checked') : false;
                        const giveChecked = !!root.find('.js-custom-item-give').prop('checked');
                        const giveToActor = giveChecked ? options.actor : null;
                        if (!name) {
                            g.ui?.notifications?.warn?.(loc('nameRequired', 'Name is required.'));
                            return;
                        }
                        if (!addToWorldCatalog && !giveToActor) {
                            g.ui?.notifications?.warn?.(loc('needTarget', 'Choose the shared catalog and/or give to this character.'));
                            return;
                        }
                        const result = await createCustomCatalogItem({
                            name,
                            description,
                            effect,
                            img: selectedImg,
                            addToWorldCatalog,
                            giveToActor,
                        });
                        if (!result.worldItem && !result.actorItem)
                            return;
                        try {
                            await options.onCreated?.();
                        }
                        catch {
                            /* ignore */
                        }
                    },
                },
                cancel: { label: loc('cancel', 'Cancel') },
            },
            default: 'create',
            close: () => resolve(),
            render: (html) => {
                const root = g.$(html);
                root.find('.ms-custom-catalog-icon-btn').on('click', (ev) => {
                    ev.preventDefault();
                    const btn = ev.currentTarget;
                    const path = String(btn.dataset.iconPath || '');
                    if (!path)
                        return;
                    selectedImg = path;
                    root.find('.ms-custom-catalog-icon-btn').removeClass('is-selected').attr('aria-pressed', 'false');
                    g.$(btn).addClass('is-selected').attr('aria-pressed', 'true');
                });
            },
        });
        dialog.render(true);
    });
}
//# sourceMappingURL=custom-catalog-item-dialog.js.map