/**
 * One table for every editor colour. Tools and the overlay read from here so a
 * later theme change does not hunt through a dozen files.
 */

export const SCENE_EDITOR_COLORS = {
  suggestionWall: 0x4dd0e1,
  suggestionDoor: 0xb388ff,
  suggestionWindow: 0x80deea,
  confirmedWall: 0xffd54f,
  confirmedDoor: 0xce93d8,
  confirmedWindow: 0x4fc3f7,
  selected: 0xffffff,
  handle: 0xfff8e1,
  preview: 0xffecb3,
  snap: 0xa5d6a7,
  uncertain: 0xffb74d,
  gap: 0xef5350,
  hintWall: 0x81c784,
  hintDoor: 0xba68c8,
  hintWindow: 0x4dd0e1,
  hintIgnore: 0xe57373,
  ignoreFill: 0xef5350,
} as const;

export function hexCss(value: number): string {
  return `#${value.toString(16).padStart(6, '0')}`;
}
