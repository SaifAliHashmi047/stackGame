import { WithSpringConfig, WithTimingConfig, Easing } from 'react-native-reanimated';

/** Spring config for camera follow */
export const CAMERA_SPRING: WithSpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 1,
};

/** Spring config for game-over entrance animations */
export const ENTRANCE_SPRING: WithSpringConfig = {
  damping: 14,
  stiffness: 140,
  mass: 1,
};

/** Timing for cut-off piece fall */
export const CUTOFF_FALL: WithTimingConfig = {
  duration: 600,
  easing: Easing.in(Easing.quad),
};

/** Timing for score pop scale up */
export const SCORE_POP_UP: WithTimingConfig = {
  duration: 120,
  easing: Easing.out(Easing.back(2)),
};

/** Timing for score pop scale back down */
export const SCORE_POP_DOWN: WithTimingConfig = {
  duration: 180,
  easing: Easing.inOut(Easing.quad),
};

/** Timing for particle fade out */
export const PARTICLE_FADE: WithTimingConfig = {
  duration: 500,
  easing: Easing.out(Easing.quad),
};

/** Timing for "PERFECT!" flash pulses */
export const PERFECT_FLASH: WithTimingConfig = {
  duration: 100,
};

/** Linear easing (used for block slide) */
export const LINEAR: WithTimingConfig = {
  easing: Easing.linear,
};

/**
 * Convert speed (pixels/frame at 60fps) + distance to withTiming duration (ms).
 */
export function speedToDuration(distancePx: number, speedPxPerFrame: number): number {
  return (distancePx / (speedPxPerFrame * 60)) * 1000;
}
