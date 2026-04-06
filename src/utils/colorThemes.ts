import { THEME_CHANGE_INTERVAL } from '../constants/config';

export interface Theme {
  id: string;
  gradientColors: string[];
  blockPalette: string[];
}

export const THEMES: Theme[] = [
  {
    id: 'rainbow',
    gradientColors: ['#1a8fe3', '#5dc5d0', '#a8edea'],
    blockPalette: ['#ff0066', '#ff9933', '#ffee33', '#66ff66', '#3399ff', '#9966ff', '#ff33cc', '#ff6633'],
  },
  {
    id: 'warm_sand',
    gradientColors: ['#74b49b', '#c8c89e', '#f7d08a'],
    blockPalette: ['#8b1a1a', '#c0392b', '#e74c3c', '#e67e22', '#f39c12', '#f5cba7', '#f0e6d3', '#f5deb3'],
  },
  {
    id: 'ocean_teal',
    gradientColors: ['#0f2027', '#203a43', '#2c5364'],
    blockPalette: ['#1a237e', '#1565c0', '#1976d2', '#0288d1', '#0097a7', '#00acc1', '#26c6da', '#4dd0e1'],
  },
];

/** Returns the correct theme for a given block count */
export function getThemeForBlock(blockIndex: number): Theme {
  const themeIdx = Math.floor(blockIndex / THEME_CHANGE_INTERVAL) % THEMES.length;
  return THEMES[themeIdx];
}

/**
 * Returns a block color by cycling through the current theme's palette.
 * blockIndex = total number of stacked blocks (0 = base block).
 */
export function getColorForBlock(blockIndex: number): string {
  const theme = getThemeForBlock(blockIndex);
  return theme.blockPalette[blockIndex % theme.blockPalette.length];
}

/**
 * Darken a hex color by `factor` (0 = unchanged, 1 = black).
 * Supports 3-digit and 6-digit hex strings.
 */
export function darkenColor(hex: string, factor: number): string {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  const r = Math.round(parseInt(h.slice(0, 2), 16) * (1 - factor));
  const g = Math.round(parseInt(h.slice(2, 4), 16) * (1 - factor));
  const b = Math.round(parseInt(h.slice(4, 6), 16) * (1 - factor));
  return `rgb(${r},${g},${b})`;
}
