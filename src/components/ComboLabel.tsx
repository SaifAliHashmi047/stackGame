import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';

interface ComboLabelProps {
  combo: number;
}

const COMBO_LABELS = ['', '', '2×', '3×', '4×', '5×'];

export default function ComboLabel({ combo }: ComboLabelProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useEffect(() => {
    if (combo < 2) return;

    // Bounce in
    scale.value = 0;
    opacity.value = 0;
    translateY.value = 30;

    scale.value = withSpring(1, { damping: 10, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 150 });
    translateY.value = withSpring(0, { damping: 12, stiffness: 180 });

    // Fade out after 1.5 s
    const timeout = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 400 });
      translateY.value = withTiming(-20, { duration: 400 });
    }, 1100);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combo]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (combo < 2) return null;

  const label = COMBO_LABELS[Math.min(combo, COMBO_LABELS.length - 1)];

  return (
    <View style={styles.wrapper} pointerEvents="none">
      <Animated.View style={[styles.container, animStyle]}>
        <Text style={styles.comboText}>COMBO {label}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: '38%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  container: {
    backgroundColor: 'rgba(255,107,53,0.9)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  comboText: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
