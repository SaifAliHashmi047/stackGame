import React, { memo } from 'react';
import Svg, { Polygon } from 'react-native-svg';
import { BLOCK_HEIGHT, ISO_DX, ISO_DY } from '../constants/config';
import { darkenColor } from '../utils/colorThemes';

interface Block3DProps {
  width: number;
  color: string;
}

/**
 * Renders a single isometric 3-D slab using SVG polygons.
 *
 * Coordinate layout (SVG origin = top-left):
 *
 *   ISO_DX→|   W   |
 *          ┌────────┐  ─ y=0
 *         ╱        ╱   ↓ ISO_DY  ← top face (lightest)
 *        ┌──────────┐  ─ y=ISO_DY
 *        │ front    │█  ← front face (medium)  █ = right face (darkest)
 *        └──────────┘█  ─ y=ISO_DY + BLOCK_HEIGHT
 *
 * Total SVG size: (width + ISO_DX) × (BLOCK_HEIGHT + ISO_DY)
 */
const Block3D = memo(({ width, color }: Block3DProps) => {
  const W = width;
  const H = BLOCK_HEIGHT;
  const dx = ISO_DX;
  const dy = ISO_DY;

  const svgW = W + dx;
  const svgH = H + dy;

  const topColor = color;
  const frontColor = darkenColor(color, 0.18);
  const rightColor = darkenColor(color, 0.38);

  // Top face — parallelogram
  const topPoints = `${dx},0 ${W + dx},0 ${W},${dy} 0,${dy}`;
  // Front face — rectangle
  const frontPoints = `0,${dy} ${W},${dy} ${W},${dy + H} 0,${dy + H}`;
  // Right face — parallelogram
  const rightPoints = `${W},${dy} ${W + dx},0 ${W + dx},${H} ${W},${dy + H}`;

  return (
    <Svg width={svgW} height={svgH}>
      <Polygon points={topPoints} fill={topColor} />
      <Polygon points={frontPoints} fill={frontColor} />
      <Polygon points={rightPoints} fill={rightColor} />
    </Svg>
  );
});

Block3D.displayName = 'Block3D';

export default Block3D;
