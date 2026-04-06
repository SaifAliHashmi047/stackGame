import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ScoreDisplayProps {
  score: number;
  bestScore: number;
  scoreScale: SharedValue<number>;
  isBestBeaten?: boolean;
}

const ScoreDisplay = memo(
  ({ score, bestScore, scoreScale, isBestBeaten = false }: ScoreDisplayProps) => {
    const insets = useSafeAreaInsets();

    const scoreStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scoreScale.value }],
    }));

    return (
      <View style={[styles.container, { paddingTop: insets.top + 12 }]} pointerEvents="none">
        {/* Current score — center */}
        <View style={styles.center}>
          <Animated.Text style={[styles.score, scoreStyle]}>{score}</Animated.Text>
        </View>

        {/* Best score — top right */}
        <View style={styles.bestCard}>
          <Text style={styles.bestLabel}>BEST</Text>
          <Text style={[styles.bestValue, isBestBeaten && styles.bestValueGold]}>
            {bestScore}
          </Text>
        </View>
      </View>
    );
  },
);

ScoreDisplay.displayName = 'ScoreDisplay';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  score: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.scoreText,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: -2,
  },
  bestCard: {
    backgroundColor: COLORS.hudCardBg,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.hudBorder,
    alignItems: 'center',
    minWidth: 68,
  },
  bestLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.2,
  },
  bestValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
    marginTop: 1,
  },
  bestValueGold: {
    color: COLORS.bestText,
  },
});

export default ScoreDisplay;
