/**
 * Foundry parks `#tooltip` under the cursor. If that node can receive
 * pointer events, the hovered button loses :hover (active/inactive flicker)
 * and the click lands on the tooltip instead of the control.
 *
 * Hover text may still appear. It must never steal the pointer.
 *
 * This also covers Foundry chrome (sidebar / scene-controls): when the
 * tooltip steals hover, faded-ui buttons stay `inert` + `pointer-events: none`.
 */
/** Make every known Foundry tooltip / toolclip surface ignore the pointer. */
export declare function makeFoundryTooltipInert(): void;
/**
 * Install / refresh tooltip passthrough. Safe to call again after `canvasReady`
 * in case Foundry replaced `game.tooltip`.
 */
export declare function installTooltipPassthrough(): void;
/**
 * Fire the action on pointerdown so a Foundry tooltip appearing between
 * mousedown and mouseup cannot swallow the click. A leftover click is ignored.
 */
export declare function bindReliableControlClick(root: JQuery, selector: string, handler: (event: any) => void): void;
//# sourceMappingURL=tooltip-passthrough.d.ts.map