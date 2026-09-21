/**
 * Player-facing Stone Powers Quick Help.
 * Static copy plus screenshot paths from assets/helper — never writes combat state.
 */

export const STONE_POWERS_HELP_COUNT = 7;
export const STONE_HELP_START_INITIATIVE = 1;
export const STONE_HELP_START_STONES = 4;

export type StoneHelpImage = {
  slot: string;
  file: string;
  src: string;
  alt: string;
  caption?: string;
};

export type StoneHelpScreen = {
  id: number;
  title: string;
  body: string;
  note?: string;
  images: StoneHelpImage[];
};

const SLOT_HINTS: Record<string, string[]> = {
  '01': ['roll-initiative', 'roll_initiative', 'roll-initative', 'initiative'],
  '02': ['before-conversion', 'before_conversion', 'choose'],
  '03': ['after-conversion', 'after_conversion', 'converted'],
  '04': ['available', 'colorless'],
  '05': ['power-section', 'sections', 'power_section'],
  '06a': ['empty'],
  '06b': ['incomplete'],
  '06c': ['active'],
  '07': ['apply-close', 'apply_close', 'apply'],
};

export function stoneHelpSystemId(): string {
  return String((globalThis as any).game?.system?.id || 'mastery-system');
}

export function stoneHelpAssetDirs(): string[] {
  const id = stoneHelpSystemId();
  return [
    `systems/${id}/assets/helper`,
    'systems/mastery-system/assets/helper',
    'assets/helper',
  ];
}

export function stoneHelpAssetUrl(fileName: string, dir = stoneHelpAssetDirs()[0]): string {
  const name = String(fileName || '').replace(/\\/g, '/').split('/').filter(Boolean).pop() || '';
  if (!name) return dir;
  return `${dir}/${name}`;
}

export function stoneHelpPublicUrl(path: string): string {
  const raw = String(path || '').trim();
  if (!raw) return '';
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
  const getRoute = (globalThis as any).foundry?.utils?.getRoute;
  const routed = typeof getRoute === 'function' ? String(getRoute(raw) || raw) : raw;
  if (/^(?:https?:|data:|blob:)/i.test(routed)) return routed;
  const withSlash = routed.startsWith('/') ? routed : `/${routed.replace(/^\/+/, '')}`;
  return withSlash
    .split('/')
    .map((seg, idx) => {
      if (!seg || idx === 0) return seg;
      try {
        return encodeURIComponent(decodeURIComponent(seg));
      } catch {
        return encodeURIComponent(seg);
      }
    })
    .join('/');
}

export function clampStoneHelpPage(page: number): number {
  const n = Math.floor(Number(page) || 1);
  return Math.min(STONE_POWERS_HELP_COUNT, Math.max(1, n));
}

export function helperFileBaseName(path: string): string {
  const clean = String(path || '').split('?')[0].replace(/\\/g, '/');
  try {
    return decodeURIComponent(clean.split('/').pop() || '');
  } catch {
    return clean.split('/').pop() || '';
  }
}

function isImageName(name: string): boolean {
  return /\.(png|jpe?g|webp|gif)$/i.test(name);
}

function compactName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9.]/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 01 → 01, 1; 06b → 06b, 6b */
export function helperSlotAliases(slot: string): string[] {
  const wanted = String(slot || '').toLowerCase().trim();
  if (!wanted) return [];
  const aliases = [wanted];
  if (/^0+\d/.test(wanted)) aliases.push(wanted.replace(/^0+/, ''));
  return [...new Set(aliases)];
}

function hasSlotToken(fileName: string, slot: string): boolean {
  const base = fileName.toLowerCase();
  const token = slot.toLowerCase();
  if (!token) return false;
  if (
    base.startsWith(`${token}-`) ||
    base.startsWith(`${token}_`) ||
    base.startsWith(`${token}.`) ||
    base.startsWith(`${token} `)
  ) {
    return true;
  }
  return new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(token)}(?:[^a-z0-9]|$)`).test(base);
}

/** Pick the real file from assets/helper for a help slot such as 01 or 06b. */
export function matchHelperAsset(files: readonly string[], slot: string): string | null {
  const wanted = String(slot || '').toLowerCase().trim();
  if (!wanted) return null;
  const aliases = helperSlotAliases(wanted);
  const rows = files
    .map((raw) => ({ raw, base: helperFileBaseName(raw) }))
    .filter((row) => isImageName(row.base));

  const numbered = rows.find((row) => aliases.some((alias) => hasSlotToken(row.base, alias)));
  if (numbered) return numbered.raw;

  const compactWanted = compactName(wanted);
  const compactHit = rows.find((row) => {
    const compact = compactName(row.base);
    return aliases.some((alias) => compact.startsWith(compactName(alias)));
  });
  if (compactHit) return compactHit.raw;

  const hints = SLOT_HINTS[wanted] ?? [];
  for (const hint of hints) {
    const hit = rows.find((row) => row.base.toLowerCase().includes(hint));
    if (hit) return hit.raw;
  }
  if (compactWanted) {
    const loose = rows.find((row) => compactName(row.base).includes(compactWanted));
    if (loose) return loose.raw;
  }
  return null;
}

const BROWSE_TIMEOUT_MS = 800;

let cachedHelperFiles: string[] | null = null;
let cachedHelperFilesPromise: Promise<string[]> | null = null;

export function resetStoneHelpAssetFileCache(): void {
  cachedHelperFiles = null;
  cachedHelperFilesPromise = null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('stone-help-browse-timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function browseCandidates(): Array<(source: string, target: string, options?: object) => Promise<unknown>> {
  const picker =
    (globalThis as any).foundry?.applications?.apps?.FilePicker ??
    (globalThis as any).foundry?.applications?.FilePicker ??
    (globalThis as any).FilePicker;
  const impl = picker?.implementation;
  return [
    impl?.browse?.bind(impl),
    picker?.browse?.bind(picker),
  ].filter((fn) => typeof fn === 'function');
}

function collectBrowseFiles(result: any): string[] {
  const rows = Array.isArray(result?.files) ? result.files : [];
  return rows
    .map((file: unknown) => {
      if (typeof file === 'string') return file.trim();
      const row = file as { path?: string; url?: string; name?: string } | null;
      return String(row?.path || row?.url || row?.name || '').trim();
    })
    .filter(Boolean);
}

export function sortedHelperImages(files: readonly string[]): string[] {
  return [...files]
    .filter((file) => isImageName(helperFileBaseName(file)))
    .sort((a, b) =>
      helperFileBaseName(a).localeCompare(helperFileBaseName(b), undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    );
}

/** Nine image slots: screens 1–5, Extra Attack empty/incomplete/active, then Apply. */
export const STONE_HELP_FILE_SLOTS = ['01', '02', '03', '04', '05', '06a', '06b', '06c', '07'] as const;

function helperAssetPath(file: string): string {
  const raw = String(file || '').replace(/\\/g, '/');
  if (!raw) return '';
  if (/^(?:https?:|data:|blob:)/i.test(raw) || raw.includes('/')) return raw;
  return stoneHelpAssetUrl(raw);
}

/**
 * Use the real filenames from assets/helper.
 * Numbered names win first; leftover files fill leftover slots in folder order.
 * Never invent a filename that is not in the folder.
 */
export function assignHelperFilesToSlots(files: readonly string[]): Map<string, string> {
  const sorted = sortedHelperImages(files);
  const assigned = new Map<string, string>();
  const used = new Set<string>();
  const slots =
    sorted.length === 7 ? (['01', '02', '03', '04', '05', '06a', '07'] as string[]) : [...STONE_HELP_FILE_SLOTS];

  for (const slot of slots) {
    const remaining = sorted.filter((file) => !used.has(file));
    const hit = matchHelperAsset(remaining, slot);
    if (!hit) continue;
    assigned.set(slot, helperAssetPath(hit));
    used.add(hit);
  }

  const leftoverSlots = slots.filter((slot) => !assigned.has(slot));
  const leftoverFiles = sorted.filter((file) => !used.has(file));
  leftoverSlots.forEach((slot, index) => {
    const file = leftoverFiles[index];
    if (!file) return;
    assigned.set(slot, helperAssetPath(file));
  });
  return assigned;
}

async function listStoneHelpAssetFilesUncached(): Promise<string[]> {
  const browsers = browseCandidates();
  for (const dir of stoneHelpAssetDirs()) {
    for (const browse of browsers) {
      try {
        const result = await withTimeout(Promise.resolve(browse('data', dir)), BROWSE_TIMEOUT_MS);
        const files = sortedHelperImages(collectBrowseFiles(result));
        if (files.length) return files;
      } catch (err) {
        if (String((err as Error)?.message || err).includes('stone-help-browse-timeout')) {
          return [];
        }
      }
    }
  }
  return [];
}

export async function listStoneHelpAssetFiles(): Promise<string[]> {
  if (cachedHelperFiles) return cachedHelperFiles;
  if (cachedHelperFilesPromise) return cachedHelperFilesPromise;
  cachedHelperFilesPromise = listStoneHelpAssetFilesUncached()
    .then((files) => {
      cachedHelperFiles = files;
      return files;
    })
    .finally(() => {
      cachedHelperFilesPromise = null;
    });
  return cachedHelperFilesPromise;
}

export function resolveStoneHelpImagePath(
  files: readonly string[],
  slot: string,
  _fallbackFile = '',
  used: Set<string> = new Set(),
): string {
  const remaining = files.filter((file) => {
    const base = helperFileBaseName(file).toLowerCase();
    return !used.has(file) && !used.has(base);
  });
  const matched = assignHelperFilesToSlots(remaining).get(String(slot || ''));
  if (!matched) return '';
  used.add(matched);
  used.add(helperFileBaseName(matched).toLowerCase());
  const original = remaining.find((file) => helperFileBaseName(file) === helperFileBaseName(matched));
  if (original) used.add(original);
  return matched;
}

export function stoneHelpScreensForFiles(files: readonly string[]): StoneHelpScreen[] {
  const assigned = assignHelperFilesToSlots(files);
  const hasFiles = assigned.size > 0;
  return STONE_POWERS_HELP_SCREENS.map((screen) => ({
    ...screen,
    images: screen.images.flatMap((image) => {
      const path = assigned.get(image.slot);
      if (!path && hasFiles) return [];
      if (!path) return [{ ...image, file: '', src: '' }];
      return [
        {
          ...image,
          file: helperFileBaseName(path),
          src: stoneHelpPublicUrl(path),
        },
      ];
    }),
  }));
}

function helpImage(slot: string, alt: string, caption?: string): StoneHelpImage {
  return {
    slot,
    file: '',
    src: '',
    alt,
    caption,
  };
}

export const STONE_POWERS_HELP_SCREENS: StoneHelpScreen[] = [
  {
    id: 1,
    title: '1. Roll Initiative',
    body: 'Roll Initiative first. Your Initiative roll, Combat Reflexes and Armor Penalty determine your starting Initiative.',
    images: [
      helpImage('01', 'Stone Powers window before Initiative is rolled'),
    ],
  },
  {
    id: 2,
    title: '2. Choose Stones to convert',
    body: 'Choose how much Initiative you want to convert into Colorless Stones. The minimum is 1 Stone — converting 0 would have no effect.',
    images: [
      helpImage('02', 'Initiative row with one Stone staged for conversion'),
    ],
  },
  {
    id: 3,
    title: '3. Convert to Colorless Stones',
    body: 'Select Convert to Colorless Stones. Your Initiative is reduced and the converted Stone becomes available as a Colorless Stone.',
    images: [
      helpImage('03', 'Initiative row after converting into a Colorless Stone'),
    ],
  },
  {
    id: 4,
    title: '4. Check your available Stones',
    body: 'Your Attribute Stones are shown here. Converted Initiative appears in the Colorless pool. Attributes below 8 do not provide a Stone pool.',
    images: [
      helpImage('04', 'Available Stones row with Attribute and Colorless pools'),
    ],
  },
  {
    id: 5,
    title: '5. Choose a Stone Power',
    body: 'Stone Powers are grouped into General Powers and Attribute sections. Open the section containing the Power you want to use.',
    images: [
      helpImage('05', 'General and Attribute Stone Power sections'),
    ],
  },
  {
    id: 6,
    title: '6. Pay the full Tier',
    body: 'Assign Stones to the Power you want to activate. An incomplete Tier is not active yet. The Tier becomes active only when its full cost is paid.',
    images: [
      helpImage('06a', 'Extra Attack with no Stones assigned', 'EMPTY'),
      helpImage('06b', 'Extra Attack with Stones assigned but the Tier not fully paid', 'INCOMPLETE'),
      helpImage('06c', 'Extra Attack with the required Tier fully paid', 'ACTIVE'),
    ],
  },
  {
    id: 7,
    title: '7. Apply your assignment',
    body: 'Select Apply & Close when you are finished. Fully paid Stone waves are settled. Incomplete waves remain open until the next full wave.',
    note: 'Save defaults remembers your preferred choices for future rounds.',
    images: [
      helpImage('07', 'Stone Powers footer with Save defaults and Apply & Close'),
    ],
  },
];
