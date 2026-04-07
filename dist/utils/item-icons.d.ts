export type ItemIconSystemHint = {
    type?: string;
};
/**
 * Resolve the best icon path for an item by name and type.
 * For armor and shields, pass `system` (with `type` tier) so renamed items still match the correct art.
 * Returns null if no custom icon is available.
 */
export declare function getItemIcon(name: string, type: string, system?: ItemIconSystemHint | null): string | null;
//# sourceMappingURL=item-icons.d.ts.map