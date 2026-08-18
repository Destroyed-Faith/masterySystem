/**
 * One table for every editor colour. Tools and the overlay read from here so a
 * later theme change does not hunt through a dozen files.
 */
export declare const SCENE_EDITOR_COLORS: {
    readonly suggestionWall: 5099745;
    readonly suggestionDoor: 11766015;
    readonly suggestionWindow: 8445674;
    readonly confirmedWall: 16766287;
    readonly confirmedDoor: 13538264;
    readonly confirmedWindow: 5227511;
    readonly selected: 16777215;
    readonly handle: 16775393;
    readonly preview: 16772275;
    readonly snap: 10868391;
    readonly uncertain: 16758605;
    readonly gap: 15684432;
    readonly hintWall: 8505220;
    readonly hintDoor: 12216520;
    readonly hintWindow: 5099745;
    readonly hintIgnore: 15037299;
    readonly ignoreFill: 15684432;
};
export declare function hexCss(value: number): string;
//# sourceMappingURL=colors.d.ts.map