import { useCallback } from 'react';

type HapticType = 'impactLight' | 'impactMedium' | 'impactHeavy' | 'notificationError';

function triggerHaptic(type: HapticType) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const RNHapticFeedback = require('react-native-haptic-feedback').default;
    const options = { enableVibrateFallback: true, ignoreAndroidSystemSettings: false };
    RNHapticFeedback.trigger(type, options);
  } catch {
    // Haptic feedback unavailable — silent fallback
  }
}

export function useHaptics() {
  const lightImpact = useCallback(() => triggerHaptic('impactLight'), []);
  const mediumImpact = useCallback(() => triggerHaptic('impactMedium'), []);
  const heavyImpact = useCallback(() => triggerHaptic('impactHeavy'), []);
  const errorFeedback = useCallback(() => triggerHaptic('notificationError'), []);

  return { lightImpact, mediumImpact, heavyImpact, errorFeedback };
}
