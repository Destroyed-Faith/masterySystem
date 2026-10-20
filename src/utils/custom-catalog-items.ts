/**
 * Session-time custom mundane items for General Items Storage.
 * Not artifacts — simple gear with name, description, effect text, and an icon.
 */

import { listMundaneItemIconChoices } from './item-icons.js';
import {
  getOrCreateGeneralItemsStorageFolder,
  getDefaultInventorySizeForItemData,
  STORAGE_FOLDER_NAME,
} from './seed-general-items.js';

export const CUSTOM_CATALOG_FLAG = 'customCatalogItem';

export { STORAGE_FOLDER_NAME, listMundaneItemIconChoices };

export type CustomCatalogItemInput = {
  name: string;
  description?: string;
  /** Free-text “what it does” — stored alongside description. */
  effect?: string;
  img?: string;
  inventorySize?: string;
  /** Also embed a copy on this actor’s inventory. */
  giveToActor?: any | null;
  /** Write into the world General Items Storage folder (GM). Default true when GM. */
  addToWorldCatalog?: boolean;
};

function buildDescription(description: string, effect: string): string {
  const desc = String(description || '').trim();
  const use = String(effect || '').trim();
  if (desc && use) return `${desc}\n\n**Use:** ${use}`;
  if (use) return `**Use:** ${use}`;
  return desc;
}

export function isCustomCatalogItem(item: any): boolean {
  if (!item) return false;
  if (typeof item.getFlag === 'function') {
    return item.getFlag('mastery-system', CUSTOM_CATALOG_FLAG) === true;
  }
  return item?.flags?.['mastery-system']?.[CUSTOM_CATALOG_FLAG] === true;
}

export function listCustomCatalogItemsInStorage(): any[] {
  const g = globalThis as any;
  const folder = g.game?.folders?.find?.(
    (f: any) => f.name === STORAGE_FOLDER_NAME && f.type === 'Item',
  );
  if (!folder) return [];
  const all = Array.from(g.game?.items || []);
  return all
    .filter((it: any) => it.folder?.id === folder.id && isCustomCatalogItem(it))
    .sort((a: any, b: any) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }),
    );
}

/**
 * Create a mundane gear item. GM writes to world catalog; owners can always get
 * an embedded copy on their actor when `giveToActor` is set.
 */
export async function createCustomCatalogItem(
  input: CustomCatalogItemInput,
): Promise<{ worldItem: any | null; actorItem: any | null }> {
  const g = globalThis as any;
  const name = String(input.name || '').trim();
  if (!name) {
    g.ui?.notifications?.warn?.('Name is required.');
    return { worldItem: null, actorItem: null };
  }

  const img =
    String(input.img || '').trim() ||
    listMundaneItemIconChoices()[0]?.path ||
    'icons/svg/item-bag.svg';
  const description = buildDescription(
    String(input.description || ''),
    String(input.effect || ''),
  );
  const inventorySize =
    String(input.inventorySize || '').trim() ||
    getDefaultInventorySizeForItemData({ type: 'gear', name }) ||
    '1x1';

  const baseData: Record<string, unknown> = {
    name,
    type: 'gear',
    img,
    system: {
      description,
      inventorySize,
      weight: 0,
      quantity: 1,
      equipped: false,
      equipSlots: [],
      consumable: false,
    },
    flags: {
      'mastery-system': {
        [CUSTOM_CATALOG_FLAG]: true,
        customEffect: String(input.effect || '').trim() || null,
      },
    },
  };

  const isGM = !!g.game?.user?.isGM;
  const wantWorld = input.addToWorldCatalog !== false && isGM;
  let worldItem: any | null = null;

  const deepClone =
    g.foundry?.utils?.deepClone?.bind(g.foundry.utils) ||
    ((x: unknown) => JSON.parse(JSON.stringify(x)));

  if (wantWorld) {
    const folder = await getOrCreateGeneralItemsStorageFolder();
    if (!folder) {
      g.ui?.notifications?.warn?.('Could not open General Items Storage.');
    } else {
      const [created] = await g.Item.createDocuments([
        { ...deepClone(baseData), folder: folder.id },
      ]);
      worldItem = created ?? null;
    }
  }

  let actorItem: any | null = null;
  const actor = input.giveToActor;
  if (actor && typeof actor.createEmbeddedDocuments === 'function') {
    const embed = deepClone(baseData) as any;
    delete embed.folder;
    embed.flags = {
      ...(embed.flags || {}),
      'mastery-system': {
        ...(embed.flags?.['mastery-system'] || {}),
        [CUSTOM_CATALOG_FLAG]: true,
        customEffect: String(input.effect || '').trim() || null,
        equipment: {
          container: 'inventory',
          band: 'not',
          slot: null,
        },
      },
    };
    embed.system = { ...(embed.system || {}), equipped: false };
    const [created] = await actor.createEmbeddedDocuments('Item', [embed]);
    actorItem = created ?? null;
    try {
      actor.sheet?.render?.(false);
    } catch {
      /* ignore */
    }
  }

  if (!worldItem && !actorItem) {
    if (!isGM) {
      g.ui?.notifications?.warn?.(
        'Only the GM can add items to the shared catalog. Ask them, or check “Give to this character”.',
      );
    }
    return { worldItem: null, actorItem: null };
  }

  const label = worldItem?.name || actorItem?.name || name;
  if (worldItem && actorItem) {
    g.ui?.notifications?.info?.(`Created “${label}” in General Items and on the character.`);
  } else if (worldItem) {
    g.ui?.notifications?.info?.(`Created “${label}” in General Items Storage.`);
  } else {
    g.ui?.notifications?.info?.(`Created “${label}” on the character.`);
  }
  return { worldItem, actorItem };
}

/** Delete a world catalog item (GM). Prefer custom items; seeded catalog needs confirm. */
export async function deleteCatalogStorageItem(
  itemId: string,
  options?: { force?: boolean },
): Promise<boolean> {
  const g = globalThis as any;
  if (!g.game?.user?.isGM) {
    g.ui?.notifications?.warn?.('Only the GM can remove catalog items.');
    return false;
  }
  const item = g.game?.items?.get?.(itemId);
  if (!item) return false;
  const folder = g.game?.folders?.find?.(
    (f: any) => f.name === STORAGE_FOLDER_NAME && f.type === 'Item',
  );
  if (!folder || item.folder?.id !== folder.id) {
    g.ui?.notifications?.warn?.('Item is not in General Items Storage.');
    return false;
  }
  if (!isCustomCatalogItem(item) && !options?.force) {
    const DialogV2 = g.foundry?.applications?.api?.DialogV2;
    let ok = false;
    if (typeof DialogV2?.confirm === 'function') {
      ok = !!(await DialogV2.confirm({
        window: { title: 'Remove catalog item?' },
        content: `<p>Remove <strong>${String(item.name || '')}</strong> from General Items Storage? Seeded Players Guide items can be re-added by re-opening storage (GM).</p>`,
      }));
    } else {
      ok = !!g.window?.confirm?.(
        `Remove “${String(item.name || '')}” from General Items Storage?`,
      );
    }
    if (!ok) return false;
  }
  await item.delete();
  g.ui?.notifications?.info?.(`Removed “${item.name}” from General Items Storage.`);
  return true;
}
