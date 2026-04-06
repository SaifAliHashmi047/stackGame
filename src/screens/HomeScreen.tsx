import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID } from '../constants/adConfig';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useHighScore } from '../hooks/useHighScore';
import { THEMES } from '../utils/colorThemes';
import { COLORS } from '../constants/colors';

type Props = StackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { bestScore } = useHighScore();
  const theme = THEMES[0];

  // Floating logo animation
  const floatY = useSharedValue(0);
  // Pulsing tap button
  const tapOpacity = useSharedValue(1);
  // Entrance fade
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 500 });

    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );

    tapOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(1.0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));
  const tapStyle = useAnimatedStyle(() => ({ opacity: tapOpacity.value }));

  const handlePlay = () => {
    navigation.navigate('Game');
  };

  const handleLeaderboard = () => {
    navigation.navigate('Leaderboard');
  };

  return (
    <LinearGradient colors={theme.gradientColors} style={styles.gradient}>
      {/* Banner ad — pinned to bottom */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
          {/* Logo */}
          <Animated.View style={logoStyle}>
            <Text style={styles.logo}>STACK</Text>
            <Text style={styles.logoSub}>build the tower</Text>
          </Animated.View>

          {/* Best score */}
          {bestScore > 0 && (
            <View style={styles.bestCard}>
              <Text style={styles.bestLabel}>BEST SCORE</Text>
              <Text style={styles.bestValue}>{bestScore}</Text>
            </View>
          )}
        </View>

        {/* Decorative block stack preview */}
        <View style={styles.previewStack}>
          {[...Array(5)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.previewBlock,
                {
                  width: 160 - i * 8,
                  backgroundColor: theme.blockPalette[i % theme.blockPalette.length],
                  marginBottom: 3,
                  alignSelf: 'center',
                },
              ]}
            />
          ))}
        </View>

        {/* Tap to play */}
        <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 28 }]}>
          <TouchableOpacity style={styles.tapArea} onPress={handlePlay} activeOpacity={1}>
            <Animated.Text style={[styles.tapText, tapStyle]}>TAP TO PLAY</Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.leaderboardBtn}
            onPress={handleLeaderboard}
            activeOpacity={0.8}
          >
            <Text style={styles.leaderboardText}>LEADERBOARD</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    gap: 32,
  },
  logo: {
    fontSize: 80,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 16,
  },
  logoSub: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    letterSpacing: 3,
    marginTop: -8,
  },
  bestCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  bestLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bestValue: {
    color: COLORS.bestText,
    fontSize: 38,
    fontWeight: '900',
    marginTop: 2,
  },
  previewStack: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 12,
  },
  previewBlock: {
    height: 22,
    borderRadius: 3,
    opacity: 0.85,
  },
  bottomArea: {
    alignItems: 'center',
    gap: 16,
  },
  tapArea: {
    alignItems: 'center',
    paddingTop: 20,
  },
  tapText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  leaderboardBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  leaderboardText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
  },
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
