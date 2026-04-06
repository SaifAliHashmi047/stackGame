import React, { useEffect } from 'react';
import {
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { THEMES } from '../utils/colorThemes';
import { COLORS } from '../constants/colors';
import { ENTRANCE_SPRING } from '../utils/physics';

type Props = StackScreenProps<RootStackParamList, 'GameOver'>;

export default function GameOverScreen({ route, navigation }: Props) {
  const { score, isNewBest } = route.params;
  const insets = useSafeAreaInsets();
  const theme = THEMES[0];

  // Animations
  const scoreY = useSharedValue(-120);
  const scoreScale = useSharedValue(0.4);
  const contentOpacity = useSharedValue(0);
  const bannerScale = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    contentOpacity.value = withTiming(1, { duration: 400 });
    scoreY.value = withDelay(100, withSpring(0, ENTRANCE_SPRING));
    scoreScale.value = withDelay(100, withSpring(1, ENTRANCE_SPRING));

    if (isNewBest) {
      bannerScale.value = withDelay(600, withSpring(1, { damping: 10, stiffness: 200 }));
      shimmer.value = withDelay(
        800,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
            withTiming(0.4, { duration: 700, easing: Easing.in(Easing.quad) }),
          ),
          -1,
        ),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scoreY.value }, { scale: scoreScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));
  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bannerScale.value }],
    opacity: isNewBest ? shimmer.value : 0,
  }));

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I scored ${score} on Stack! Can you beat me? 🏆`,
      });
    } catch {
      // ignore
    }
  };

  return (
    <LinearGradient colors={theme.gradientColors} style={styles.gradient}>
      <Animated.View style={[styles.container, contentStyle, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.topSection}>
          <Text style={styles.title}>GAME OVER</Text>

          <Animated.View style={[styles.scoreBlock, scoreStyle]}>
            <Text style={styles.scoreValue}>{score}</Text>
            <Text style={styles.scoreSub}>SCORE</Text>
          </Animated.View>

          {isNewBest && (
            <Animated.View style={[styles.newBestBanner, bannerStyle]}>
              <Text style={styles.newBestText}>✦  NEW BEST  ✦</Text>
            </Animated.View>
          )}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => navigation.navigate('Game')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnPrimaryText}>PLAY AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.btnSecondaryText}>HOME</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnShare} onPress={handleShare} activeOpacity={0.8}>
            <Text style={styles.btnShareText}>SHARE SCORE</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  topSection: {
    alignItems: 'center',
    gap: 24,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 5,
  },
  scoreBlock: {
    alignItems: 'center',
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 110,
    fontWeight: '900',
    lineHeight: 112,
    textShadowColor: 'rgba(255,255,255,0.18)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  scoreSub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 4,
  },
  newBestBanner: {
    backgroundColor: 'rgba(255,215,0,0.2)',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderWidth: 1.5,
    borderColor: COLORS.newBestGold,
  },
  newBestText: {
    color: COLORS.newBestGold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  btnPrimary: {
    backgroundColor: COLORS.buttonPrimary,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: COLORS.buttonText,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
  btnSecondary: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 2,
  },
  btnShare: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnShareText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
