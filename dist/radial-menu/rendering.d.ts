/**
 * Rendering Functions for Radial Menu
 */
import type { RadialCombatOption, InnerSegment } from './types';
/**
 * Render the outer ring of option wedges
 */
export declare function renderOuterRing(root: PIXI.Container, token: any, bySegment: Record<InnerSegment['id'], RadialCombatOption[]>, segmentId: InnerSegment['id']): void;
/**
 * Render the inner segmented circle
 * The inner quadrants (Buff/Move/Util/Atk) act as clickable filters
 */
export declare function renderInnerSegments(root: PIXI.Container, getCurrentSegmentId: () => InnerSegment['id'], setCurrentSegmentId: (id: InnerSegment['id']) => void, token?: any): void;
/**
 * Refresh inner segments visual state (update appearance based on active segment)
 * This is called when the segment changes to update the visual highlighting
 */
export declare function refreshInnerSegmentsVisual(root: PIXI.Container, getCurrentSegmentId: () => InnerSegment['id']): void;
//# sourceMappingURL=rendering.d.ts.map