/**
 * Player-facing Stone Powers Quick Help.
 * Static copy plus fixed screenshot names in assets/helper — never writes combat state.
 */

export const STONE_POWERS_HELP_COUNT = 7;
export const STONE_HELP_START_INITIATIVE = 1;
export const STONE_HELP_START_STONES = 4;

export const STONE_HELP_DIR = 'systems/mastery-system/assets/helper';

/** Exact filenames Help loads from assets/helper. Rename local files to these. */
export const STONE_HELP_FILES = {
  '01': '01-roll-initiative.png',
  '02': '02-before-conversion.png',
  '03': '03-after-conversion.png',
  '04': '04-available-colorless-stones.png',
  '05': '05-power-sections.png',
  '06a': '06a-power-empty.png',
  '06b': '06b-power-incomplete.png',
  '06c': '06c-power-active.png',
  '07': '07-apply-close.png',
} as const;

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

export function stoneHelpAssetUrl(fileName: string): string {
  return `${STONE_HELP_DIR}/${fileName}`;
}

export function stoneHelpPublicUrl(path: string): string {
  const raw = String(path || '').trim();
  if (!raw) return '';
  if (/^(?:https?:|data:|blob:)/i.test(raw)) return raw;
  const getRoute = (globalThis as any).foundry?.utils?.getRoute;
  const routed = typeof getRoute === 'function' ? String(getRoute(raw) || raw) : raw;
  if (/^(?:https?:|data:|blob:)/i.test(routed)) return routed;
  return routed.startsWith('/') ? routed : `/${routed.replace(/^\/+/, '')}`;
}

export function clampStoneHelpPage(page: number): number {
  const n = Math.floor(Number(page) || 1);
  return Math.min(STONE_POWERS_HELP_COUNT, Math.max(1, n));
}

function helpImage(slot: keyof typeof STONE_HELP_FILES, alt: string, caption?: string): StoneHelpImage {
  const file = STONE_HELP_FILES[slot];
  return {
    slot,
    file,
    src: stoneHelpPublicUrl(stoneHelpAssetUrl(file)),
    alt,
    caption,
  };
}

export const STONE_POWERS_HELP_SCREENS: StoneHelpScreen[] = [
  {
    id: 1,
    title: '1. Roll Initiative',
    body: 'Roll Initiative first. Your Initiative roll, Combat Reflexes and Armor Penalty determine your starting Initiative.',
    images: [helpImage('01', 'Stone Powers window before Initiative is rolled')],
  },
  {
    id: 2,
    title: '2. Choose Stones to convert',
    body: 'Choose how much Initiative you want to convert into Colorless Stones. The minimum is 1 Stone — converting 0 would have no effect.',
    images: [helpImage('02', 'Initiative row with one Stone staged for conversion')],
  },
  {
    id: 3,
    title: '3. Convert to Colorless Stones',
    body: 'Select Convert to Colorless Stones. Your Initiative is reduced and the converted Stone becomes available as a Colorless Stone.',
    images: [helpImage('03', 'Initiative row after converting into a Colorless Stone')],
  },
  {
    id: 4,
    title: '4. Check your available Stones',
    body: 'Your Attribute Stones are shown here. Converted Initiative appears in the Colorless pool. Attributes below 8 do not provide a Stone pool.',
    images: [helpImage('04', 'Available Stones row with Attribute and Colorless pools')],
  },
  {
    id: 5,
    title: '5. Choose a Stone Power',
    body: 'Stone Powers are grouped into General Powers and Attribute sections. Open the section containing the Power you want to use.',
    images: [helpImage('05', 'General and Attribute Stone Power sections')],
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
    images: [helpImage('07', 'Stone Powers footer with Save defaults and Apply & Close')],
  },
];
