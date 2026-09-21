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
  return typeof getRoute === 'function' ? String(getRoute(raw) || raw) : raw;
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

function browseFns(): Array<(source: string, target: string) => Promise<{ files?: string[] }>> {
  const picker =
    (globalThis as any).foundry?.applications?.apps?.FilePicker ??
    (globalThis as any).foundry?.applications?.FilePicker ??
    (globalThis as any).FilePicker;
  return [
    picker?.implementation?.browse?.bind(picker.implementation),
    picker?.browse?.bind(picker),
  ].filter((fn) => typeof fn === 'function');
}

export async function listStoneHelpAssetFiles(): Promise<string[]> {
  const found = new Set<string>();
  const browsers = browseFns();
  for (const dir of stoneHelpAssetDirs()) {
    for (const browse of browsers) {
      try {
        const result = await browse('data', dir);
        for (const file of result?.files ?? []) {
          const name = String(file || '').trim();
          if (name) found.add(name);
        }
        if (found.size) break;
      } catch {
        /* try the next browser / directory */
      }
    }
  }
  return [...found];
}

export function resolveStoneHelpImagePath(
  files: readonly string[],
  slot: string,
  fallbackFile: string,
  used: Set<string> = new Set(),
): string {
  const remaining = files.filter((file) => {
    const base = helperFileBaseName(file).toLowerCase();
    return !used.has(file) && !used.has(base);
  });
  const matched = matchHelperAsset(remaining, slot);
  if (matched) {
    used.add(matched);
    used.add(helperFileBaseName(matched).toLowerCase());
    return matched.includes('/') || matched.includes('\\') ? matched.replace(/\\/g, '/') : stoneHelpAssetUrl(matched);
  }
  return stoneHelpAssetUrl(fallbackFile);
}

export function stoneHelpScreensForFiles(files: readonly string[]): StoneHelpScreen[] {
  const used = new Set<string>();
  return STONE_POWERS_HELP_SCREENS.map((screen) => ({
    ...screen,
    images: screen.images.map((image) => {
      const path = resolveStoneHelpImagePath(files, image.slot, image.file, used);
      return {
        ...image,
        file: helperFileBaseName(path) || image.file,
        src: stoneHelpPublicUrl(path),
      };
    }),
  }));
}

function helpImage(slot: string, file: string, alt: string, caption?: string): StoneHelpImage {
  return {
    slot,
    file,
    src: stoneHelpAssetUrl(file),
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
      helpImage('01', '01-roll-initiative.png', 'Stone Powers window before Initiative is rolled'),
    ],
  },
  {
    id: 2,
    title: '2. Choose Stones to convert',
    body: 'Choose how much Initiative you want to convert into Colorless Stones. The minimum is 1 Stone — converting 0 would have no effect.',
    images: [
      helpImage('02', '02-before-conversion.png', 'Initiative row with one Stone staged for conversion'),
    ],
  },
  {
    id: 3,
    title: '3. Convert to Colorless Stones',
    body: 'Select Convert to Colorless Stones. Your Initiative is reduced and the converted Stone becomes available as a Colorless Stone.',
    images: [
      helpImage('03', '03-after-conversion.png', 'Initiative row after converting into a Colorless Stone'),
    ],
  },
  {
    id: 4,
    title: '4. Check your available Stones',
    body: 'Your Attribute Stones are shown here. Converted Initiative appears in the Colorless pool. Attributes below 8 do not provide a Stone pool.',
    images: [
      helpImage('04', '04-available-colorless-stones.png', 'Available Stones row with Attribute and Colorless pools'),
    ],
  },
  {
    id: 5,
    title: '5. Choose a Stone Power',
    body: 'Stone Powers are grouped into General Powers and Attribute sections. Open the section containing the Power you want to use.',
    images: [
      helpImage('05', '05-power-sections.png', 'General and Attribute Stone Power sections'),
    ],
  },
  {
    id: 6,
    title: '6. Pay the full Tier',
    body: 'Assign Stones to the Power you want to activate. An incomplete Tier is not active yet. The Tier becomes active only when its full cost is paid.',
    images: [
      helpImage('06a', '06a-power-empty.png', 'Extra Attack with no Stones assigned', 'EMPTY'),
      helpImage(
        '06b',
        '06b-power-incomplete.png',
        'Extra Attack with Stones assigned but the Tier not fully paid',
        'INCOMPLETE',
      ),
      helpImage('06c', '06c-power-active.png', 'Extra Attack with the required Tier fully paid', 'ACTIVE'),
    ],
  },
  {
    id: 7,
    title: '7. Apply your assignment',
    body: 'Select Apply & Close when you are finished. Fully paid Stone waves are settled. Incomplete waves remain open until the next full wave.',
    note: 'Save defaults remembers your preferred choices for future rounds.',
    images: [
      helpImage('07', '07-apply-close.png', 'Stone Powers footer with Save defaults and Apply & Close'),
    ],
  },
];
