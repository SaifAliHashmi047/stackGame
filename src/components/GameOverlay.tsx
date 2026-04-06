import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS } from '../constants/colors';
import { ENTRANCE_SPRING } from '../utils/physics';

interface GameOverlayProps {
  score: number;
  isNewBest: boolean;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function GameOverlay({ score, isNewBest, onPlayAgain, onHome }: GameOverlayProps) {
  const overlayOpacity = useSharedValue(0);
  const scoreTranslateY = useSharedValue(-80);
  const scoreScale = useSharedValue(0.5);
  const buttonsOpacity = useSharedValue(0);
  const bannerScale = useSharedValue(0);

  useEffect(() => {
    overlayOpacity.value = withTiming(1, { duration: 300 });
    scoreTranslateY.value = withDelay(150, withSpring(0, ENTRANCE_SPRING));
    scoreScale.value = withDelay(150, withSpring(1, ENTRANCE_SPRING));
    buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
    if (isNewBest) {
      bannerScale.value = withDelay(700, withSpring(1, ENTRANCE_SPRING));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scoreTranslateY.value }, { scale: scoreScale.value }],
  }));
  const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}>
      <Animated.View style={[styles.scoreBlock, scoreStyle]}>
        <Text style={styles.gameOverText}>GAME OVER</Text>
        <Text style={styles.scoreValue}>{score}</Text>
        <Text style={styles.scoreSub}>SCORE</Text>
      </Animated.View>

      {isNewBest && (
        <Animated.View style={[styles.newBestBanner, bannerStyle]}>
          <Text style={styles.newBestText}>✦ NEW BEST ✦</Text>
        </Animated.View>
      )}

      <Animated.View style={[styles.buttons, buttonsStyle]}>
        <TouchableOpacity style={styles.btnPrimary} onPress={onPlayAgain} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>PLAY AGAIN</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary} onPress={onHome} activeOpacity={0.8}>
          <Text style={styles.btnSecondaryText}>HOME</Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: COLORS.overlayBg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  scoreBlock: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameOverText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 12,
  },
  scoreValue: {
    color: COLORS.white,
    fontSize: 96,
    fontWeight: '900',
    lineHeight: 96,
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  scoreSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },
  newBestBanner: {
    backgroundColor: COLORS.newBestBg,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderWidth: 1.5,
    borderColor: COLORS.newBestGold,
    marginBottom: 32,
  },
  newBestText: {
    color: COLORS.newBestGold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  buttons: {
    width: '72%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: COLORS.buttonPrimary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.buttonText,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  btnSecondary: {
    backgroundColor: COLORS.buttonSecondary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.hudBorder,
  },
  btnSecondaryText: {
    color: COLORS.buttonSecondaryText,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
