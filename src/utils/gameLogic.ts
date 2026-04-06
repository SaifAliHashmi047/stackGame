import { PERFECT_THRESHOLD } from '../constants/config';

export interface Block {
  id: string;
  x: number;    // left edge, screen pixels
  width: number;
  color: string;
}

export interface CutoffPiece {
  id: string;
  x: number;
  width: number;
  color: string;
  isLeft: boolean; // which side was cut
}

export interface OverlapResult {
  overlapWidth: number;
  overlapStart: number;
  cutoffX: number;
  cutoffWidth: number;
  isLeft: boolean;
}

/**
 * Calculate how much the moving block overlaps with the top stacked block
 * along the X axis. Returns overlap dimensions and the cut-off piece dims.
 */
export function calculateOverlap(
  movingX: number,
  blockWidth: number,
  topX: number,
  topWidth: number,
): OverlapResult {
  const overlapStart = Math.max(movingX, topX);
  const overlapEnd = Math.min(movingX + blockWidth, topX + topWidth);
  const overlapWidth = overlapEnd - overlapStart;

  const isLeft = movingX < topX;
  // Right-side cut starts at the right edge of the top block (= overlapEnd)
  const cutoffX = isLeft ? movingX : overlapEnd;
  const cutoffWidth = isLeft
    ? topX - movingX
    : movingX + blockWidth - (topX + topWidth);

  return { overlapWidth, overlapStart, cutoffX, cutoffWidth: Math.max(0, cutoffWidth), isLeft };
}

/**
 * Returns true if the moving block is within PERFECT_THRESHOLD pixels
 * of perfect alignment with the top block.
 */
export function isPerfect(movingX: number, topX: number): boolean {
  return Math.abs(movingX - topX) < PERFECT_THRESHOLD;
}

/**
 * Compute camera translateY offset so the moving block stays at the
 * desired anchor fraction (0 = top, 1 = bottom) of the screen.
 */
export function computeCameraOffset(
  blockIndex: number,
  blockStep: number,
  groundHeight: number,
  screenHeight: number,
  anchor: number,
): number {
  const movingBlockBottom = groundHeight + blockIndex * blockStep;
  const movingBlockTop = screenHeight - movingBlockBottom;
  const targetTop = screenHeight * (1 - anchor);
  const required = movingBlockTop - targetTop;
  return Math.max(0, required);
}
