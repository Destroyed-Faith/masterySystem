/**
 * Player-facing Stone Powers Quick Help.
 * Static copy and screenshot paths only — never reads or writes combat state.
 */

export const STONE_POWERS_HELP_ASSET_DIR = 'systems/mastery-system/assets/helper';
export const STONE_POWERS_HELP_COUNT = 7;
export const STONE_HELP_START_INITIATIVE = 1;
export const STONE_HELP_START_STONES = 4;

export type StoneHelpImage = {
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
  return `${STONE_POWERS_HELP_ASSET_DIR}/${fileName}`;
}

export function clampStoneHelpPage(page: number): number {
  const n = Math.floor(Number(page) || 1);
  return Math.min(STONE_POWERS_HELP_COUNT, Math.max(1, n));
}

export const STONE_POWERS_HELP_SCREENS: StoneHelpScreen[] = [
  {
    id: 1,
    title: '1. Roll Initiative',
    body: 'Roll Initiative first. Your Initiative roll, Combat Reflexes and Armor Penalty determine your starting Initiative.',
    images: [
      {
        src: stoneHelpAssetUrl('01-roll-initiative.png'),
        alt: 'Stone Powers window before Initiative is rolled',
      },
    ],
  },
  {
    id: 2,
    title: '2. Choose Stones to convert',
    body: 'Choose how much Initiative you want to convert into Colorless Stones. The minimum is 1 Stone — converting 0 would have no effect.',
    images: [
      {
        src: stoneHelpAssetUrl('02-before-conversion.png'),
        alt: 'Initiative row with one Stone staged for conversion',
      },
    ],
  },
  {
    id: 3,
    title: '3. Convert to Colorless Stones',
    body: 'Select Convert to Colorless Stones. Your Initiative is reduced and the converted Stone becomes available as a Colorless Stone.',
    images: [
      {
        src: stoneHelpAssetUrl('03-after-conversion.png'),
        alt: 'Initiative row after converting into a Colorless Stone',
      },
    ],
  },
  {
    id: 4,
    title: '4. Check your available Stones',
    body: 'Your Attribute Stones are shown here. Converted Initiative appears in the Colorless pool. Attributes below 8 do not provide a Stone pool.',
    images: [
      {
        src: stoneHelpAssetUrl('04-available-colorless-stones.png'),
        alt: 'Available Stones row with Attribute and Colorless pools',
      },
    ],
  },
  {
    id: 5,
    title: '5. Choose a Stone Power',
    body: 'Stone Powers are grouped into General Powers and Attribute sections. Open the section containing the Power you want to use.',
    images: [
      {
        src: stoneHelpAssetUrl('05-power-sections.png'),
        alt: 'General and Attribute Stone Power sections',
      },
    ],
  },
  {
    id: 6,
    title: '6. Pay the full Tier',
    body: 'Assign Stones to the Power you want to activate. An incomplete Tier is not active yet. The Tier becomes active only when its full cost is paid.',
    images: [
      {
        src: stoneHelpAssetUrl('06a-power-empty.png'),
        alt: 'Extra Attack with no Stones assigned',
        caption: 'EMPTY',
      },
      {
        src: stoneHelpAssetUrl('06b-power-incomplete.png'),
        alt: 'Extra Attack with Stones assigned but the Tier not fully paid',
        caption: 'INCOMPLETE',
      },
      {
        src: stoneHelpAssetUrl('06c-power-active.png'),
        alt: 'Extra Attack with the required Tier fully paid',
        caption: 'ACTIVE',
      },
    ],
  },
  {
    id: 7,
    title: '7. Apply your assignment',
    body: 'Select Apply & Close when you are finished. Fully paid Stone waves are settled. Incomplete waves remain open until the next full wave.',
    note: 'Save defaults remembers your preferred choices for future rounds.',
    images: [
      {
        src: stoneHelpAssetUrl('07-apply-close.png'),
        alt: 'Stone Powers footer with Save defaults and Apply & Close',
      },
    ],
  },
];
