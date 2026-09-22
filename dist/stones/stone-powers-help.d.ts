/**
 * Player-facing Stone Powers Quick Help.
 * Static copy plus fixed screenshot names in assets/helper — never writes combat state.
 */
export declare const STONE_POWERS_HELP_COUNT = 7;
export declare const STONE_HELP_START_INITIATIVE = 1;
export declare const STONE_HELP_START_STONES = 4;
export type StoneHelpTrackId = 'initiative' | 'stones';
export declare const STONE_HELP_TRACKS: Record<StoneHelpTrackId, {
    id: StoneHelpTrackId;
    first: number;
    last: number;
    title: string;
}>;
export declare const STONE_HELP_DIR = "systems/mastery-system/assets/helper";
/** Exact filenames Help loads from assets/helper. Rename local files to these. */
export declare const STONE_HELP_FILES: {
    readonly '01': "01-roll-intiative.png";
    readonly '02': "02-rolled-intiative.png";
    readonly '03': "03-convert-initiative.png";
    readonly '04': "04-available-colorlessstones.png";
    readonly '05': "05-power-sections.png";
    readonly '06a': "06a-power-empty.png";
    readonly '06b': "06b-power-incomplete.png";
    readonly '06c': "06c-power-active.png";
    readonly '07': "07-apply-close.png";
};
export type StoneHelpImage = {
    slot: string;
    file: string;
    src: string;
    alt: string;
    caption?: string;
};
export type StoneHelpScreen = {
    id: number;
    track: StoneHelpTrackId;
    step: number;
    title: string;
    body: string;
    note?: string;
    images: StoneHelpImage[];
};
export declare function stoneHelpAssetUrl(fileName: string): string;
export declare function stoneHelpPublicUrl(path: string): string;
export declare function stoneHelpTrackForPage(page: number): (typeof STONE_HELP_TRACKS)[StoneHelpTrackId];
export declare function clampStoneHelpPage(page: number, track?: {
    first: number;
    last: number;
}): number;
export declare const STONE_POWERS_HELP_SCREENS: StoneHelpScreen[];
//# sourceMappingURL=stone-powers-help.d.ts.map