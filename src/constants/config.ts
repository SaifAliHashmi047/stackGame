import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export { SCREEN_WIDTH, SCREEN_HEIGHT };

export const BLOCK_WIDTH_INITIAL = Math.min(280, SCREEN_WIDTH - 60);
export const BLOCK_HEIGHT = 28;
// Isometric offset — right face x-extension and top face y-lift
export const ISO_DX = 14;
export const ISO_DY = 8;
// Total visual height consumed per stacked level
export const BLOCK_STEP = BLOCK_HEIGHT + ISO_DY + 2;
// Height of the ground strip at bottom
export const GROUND_HEIGHT = 72;

// Speed in pixels per frame at 60fps
export const INITIAL_SPEED = 2.5;
export const SPEED_INCREMENT = 0.08;
export const SPEED_MAX = 6.5;
// Blocks placed before each speed bump
export const SPEED_BUMP_EVERY = 5;

export const PERFECT_THRESHOLD = 8; // px — within this = perfect placement

export const THEME_CHANGE_INTERVAL = 30; // blocks per theme

// Index 0 = 1 consecutive perfect, 1 = 2, … capped at index 5 = 5+
export const COMBO_BONUS_MULTIPLIER = [1, 1, 2, 3, 4, 5];

export const BASE_SCORE = 1;
export const PERFECT_BONUS = 3;

// Camera: keep moving block at this fraction from top
export const CAMERA_ANCHOR = 0.52;
