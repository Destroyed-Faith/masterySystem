/**
 * Rendering Functions for Radial Menu
 */
import type { RadialCombatOption, InnerSegment } from './types';
/**
 * Handle radial menu opened - suppress hover previews for a short time
 * Called from module.ts hooks
 */
export declare function handleRadialMenuOpened(): void;
/**
 * Handle radial menu closed - clear suppression
 * Called from module.ts hooks
 */
export declare function handleRadialMenuClosed(): void;
/**
 * Render the outer ring of option wedges
 */
export declare function renderOuterRing(root: PIXI.Container, token: any, bySegment: Record<InnerSegment['id'], RadialCombatOption[]>, segmentId: InnerSegment['id']): void;
/**
 * Render the inner segmented circle
 * The inner quadrants (Buff/Move/Util/Atk) act as clickable filters
 * Labels now show action counts from turn state
 */
export declare function renderInnerSegments(root: PIXI.Container, getCurrentSegmentId: () => InnerSegment['id'], setCurrentSegmentId: (id: InnerSegment['id']) => void, token?: any): void;
/**
 * Refresh inner segments visual state (update appearance based on active segment)
 * This is called when the segment changes to update the visual highlighting
 * Also updates action counts in labels
 */
export declare function refreshInnerSegmentsVisual(root: PIXI.Container, getCurrentSegmentId: () => InnerSegment['id'], token?: any): void;
//# sourceMappingURL=rendering.d.ts.map