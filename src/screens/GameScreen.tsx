import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BannerAd,
  BannerAdSize,
  useInterstitialAd,
} from 'react-native-google-mobile-ads';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useGame } from '../hooks/useGame';
import { useHighScore } from '../hooks/useHighScore';
import { useHaptics } from '../hooks/useHaptics';
import { useSound } from '../hooks/useSound';

import Block3D from '../components/Block3D';
import MovingBlock from '../components/MovingBlock';
import ScoreDisplay from '../components/ScoreDisplay';
import ComboLabel from '../components/ComboLabel';
import ParticleEffect from '../components/ParticleEffect';
import CutoffAnimation from '../components/CutoffAnimation';
import GameOverlay from '../components/GameOverlay';

import {
  BLOCK_HEIGHT,
  BLOCK_STEP,
  GROUND_HEIGHT,
  ISO_DY,
  SCREEN_HEIGHT,
} from '../constants/config';
import { getColorForBlock, getThemeForBlock } from '../utils/colorThemes';
import { BANNER_AD_UNIT_ID, INTERSTITIAL_AD_UNIT_ID } from '../constants/adConfig';

type Props = StackScreenProps<RootStackParamList, 'Game'>;

// Must match ScoreDisplay so pause button sits in the exact same left zone
const HUD_PADDING_TOP = 12; // added to insets.top in ScoreDisplay
const HUD_PADDING_H = 16;
const BEST_CARD_WIDTH = 72;
const PAUSE_BTN_SIZE = 38;

const TOWER_HEIGHT = SCREEN_HEIGHT * 12;

export default function GameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const game = useGame();
  const { bestScore, updateIfBest } = useHighScore();
  const { lightImpact, mediumImpact, errorFeedback } = useHaptics();
  const { playTap, playPerfect, playCombo, playGameOver } = useSound();

  const [isNewBest, setIsNewBest] = useState(false);

  // ── Interstitial ad ───────────────────────────────────────────────────────
  const {
    isLoaded: interstitialLoaded,
    load: loadInterstitial,
    show: showInterstitial,
    isClosed: interstitialClosed,
  } = useInterstitialAd(INTERSTITIAL_AD_UNIT_ID);

  // Ref instead of state: no re-render means no effect cleanup that would cancel the timeout
  const pendingAdRef = useRef(false);

  // Pre-load ad at mount
  useEffect(() => {
    loadInterstitial();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-load after close so it's ready for the next game
  useEffect(() => {
    if (interstitialClosed) {
      loadInterstitial();
    }
  }, [interstitialClosed, loadInterstitial]);

  // Handles the "ad loads AFTER game over" case (slow / delayed connection)
  useEffect(() => {
    if (!interstitialLoaded || !pendingAdRef.current) return;
    pendingAdRef.current = false; // ref write — no re-render, no cleanup cancellation
    setTimeout(() => {
      try { showInterstitial(); } catch { /* no internet / unavailable — skip */ }
    }, 900);
  }, [interstitialLoaded, showInterstitial]);

  // ── Perfect label animation ───────────────────────────────────────────────
  const perfectOpacity = useSharedValue(0);
  const perfectScale = useSharedValue(0.5);

  // Tracks whether this game-over has already been handled
  const wasGameOverRef = useRef(false);

  // ── Tap gesture ─────────────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(game.onTap)(game.movingX.value);
  });

  // ── Effects ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (game.isPerfectPlacement) {
      perfectOpacity.value = 0;
      perfectScale.value = 0.5;
      perfectOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 90 }),
          withTiming(0.4, { duration: 90 }),
        ),
        3,
        false,
      );
      perfectScale.value = withTiming(1, { duration: 200 });
      mediumImpact();
      playPerfect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isPerfectPlacement]);

  useEffect(() => {
    if (game.combo >= 3) {
      playCombo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.combo]);

  useEffect(() => {
    if (game.blocks.length > 1 && !game.isPerfectPlacement && !game.isGameOver) {
      lightImpact();
      playTap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.blocks.length]);

  // Game-over: one-shot handler — haptics, score, interstitial
  useEffect(() => {
    if (game.isGameOver && !wasGameOverRef.current) {
      wasGameOverRef.current = true;
      errorFeedback();
      playGameOver();
      updateIfBest(game.score).then(newBest => setIsNewBest(newBest));

      if (interstitialLoaded) {
        // Ad is already in memory — schedule directly.
        // The other effect won't re-run because interstitialLoaded didn't change.
        setTimeout(() => {
          try { showInterstitial(); } catch { /* skip if unavailable */ }
        }, 900);
      } else {
        // Ad not ready yet — mark pending.
        // The other effect fires when (and if) isLoaded becomes true.
        // If there's no internet it stays false forever → ad is silently skipped.
        pendingAdRef.current = true;
      }
    }
    if (!game.isGameOver) {
      wasGameOverRef.current = false;
      pendingAdRef.current = false;
      setIsNewBest(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isGameOver]);

  // ── Animated styles ───────────────────────────────────────────────────────
  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: game.cameraOffset.value }],
  }));

  const perfectLabelStyle = useAnimatedStyle(() => ({
    opacity: perfectOpacity.value,
    transform: [{ scale: perfectScale.value }],
  }));

  // ── Derived data ─────────────────────────────────────────────────────────
  const theme = getThemeForBlock(game.blocks.length);
  const nextColor = getColorForBlock(game.blocks.length);
  const topBlock = game.topBlock;
  const movingBlockBottom = GROUND_HEIGHT + game.blocks.length * BLOCK_STEP;

  const particleX = topBlock.x + topBlock.width / 2;
  const particleY =
    SCREEN_HEIGHT +
    game.cameraOffset.value -
    GROUND_HEIGHT -
    (game.blocks.length - 1) * BLOCK_STEP -
    (BLOCK_HEIGHT + ISO_DY) / 2;

  // ── Navigation / actions ──────────────────────────────────────────────────
  const handleHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handlePlayAgain = useCallback(() => {
    game.restart();
  }, [game]);

  const handlePausePress = useCallback(() => {
    if (game.isGameOver) return;
    game.pause();
  }, [game]);

  const handleResume = useCallback(() => {
    game.resume();
  }, [game]);

  const handleQuit = useCallback(() => {
    game.resume();
    navigation.navigate('Home');
  }, [game, navigation]);

  // ── Pause button position — pixel-perfect aligned with ScoreDisplay ───────
  // ScoreDisplay uses: paddingTop = insets.top + HUD_PADDING_TOP, paddingHorizontal = HUD_PADDING_H
  // The left zone (spacer) is BEST_CARD_WIDTH wide starting at HUD_PADDING_H.
  // We center the pause button inside that zone vertically and horizontally.
  const pauseBtnTop = insets.top + HUD_PADDING_TOP;
  const pauseBtnLeft = HUD_PADDING_H + (BEST_CARD_WIDTH - PAUSE_BTN_SIZE) / 2;

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Gradient background */}
      <LinearGradient colors={theme.gradientColors} style={StyleSheet.absoluteFill} />

      {/* Tap-to-place gesture area — full screen */}
      <GestureDetector gesture={tapGesture}>
        <View style={StyleSheet.absoluteFill}>
          {/* Tower */}
          <Animated.View style={[styles.tower, cameraStyle]}>
            <View style={styles.ground} />

            {game.blocks.map((block, index) => (
              <View
                key={block.id}
                style={{
                  position: 'absolute',
                  left: block.x,
                  bottom: GROUND_HEIGHT + index * BLOCK_STEP,
                }}
              >
                <Block3D width={block.width} color={block.color} />
              </View>
            ))}

            {game.cutoffPieces.map(piece => (
              <CutoffAnimation
                key={piece.id}
                piece={piece}
                bottomOffset={GROUND_HEIGHT + (game.blocks.length - 1) * BLOCK_STEP}
              />
            ))}

            {!game.isGameOver && (
              <MovingBlock
                movingX={game.movingX}
                width={topBlock.width}
                color={nextColor}
                bottomOffset={movingBlockBottom}
              />
            )}
          </Animated.View>

          {/* Particles */}
          {game.isPerfectPlacement && (
            <ParticleEffect
              x={particleX}
              y={particleY}
              color={topBlock.color}
              active={game.isPerfectPlacement}
              count={14}
            />
          )}
        </View>
      </GestureDetector>

      {/* ── HUD — above GestureDetector ──────────────────────────────────── */}

      {/* Score centered + Best card top-right (pointerEvents=none inside) */}
      <ScoreDisplay
        score={game.score}
        bestScore={bestScore}
        scoreScale={game.scoreScale}
        isBestBeaten={isNewBest}
      />

      {/* Pause button — top-left, exactly mirroring the Best card position */}
      {!game.isGameOver && (
        <TouchableOpacity
          style={[styles.pauseBtn, { top: pauseBtnTop, left: pauseBtnLeft }]}
          onPress={handlePausePress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, left: 8, bottom: 8, right: 8 }}
        >
          <View style={styles.pauseIconRow}>
            <View style={styles.pauseBar} />
            <View style={styles.pauseBar} />
          </View>
        </TouchableOpacity>
      )}

      {/* PERFECT flash */}
      {game.isPerfectPlacement && (
        <Animated.View style={[styles.perfectLabel, perfectLabelStyle]} pointerEvents="none">
          <Text style={styles.perfectText}>PERFECT!</Text>
        </Animated.View>
      )}

      {/* Combo label */}
      <ComboLabel combo={game.combo} />

      {/* Game over overlay */}
      {game.isGameOver && (
        <GameOverlay
          score={game.score}
          isNewBest={isNewBest}
          onPlayAgain={handlePlayAgain}
          onHome={handleHome}
        />
      )}

      {/* Pause overlay */}
      {game.isPaused && !game.isGameOver && (
        <View style={styles.pauseOverlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>PAUSED</Text>

            <TouchableOpacity style={styles.resumeBtn} onPress={handleResume} activeOpacity={0.8}>
              <Text style={styles.resumeText}>RESUME</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quitBtn} onPress={handleQuit} activeOpacity={0.8}>
              <Text style={styles.quitText}>QUIT TO HOME</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Banner ad — pinned to bottom, outside gesture area */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={BANNER_AD_UNIT_ID}
          size={BannerAdSize.BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f2027',
    overflow: 'hidden',
  },
  tower: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: TOWER_HEIGHT,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: GROUND_HEIGHT,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 2,
    borderTopColor: '#0d0d1a',
  },
  perfectLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '45%',
    alignItems: 'center',
    zIndex: 50,
  },
  perfectText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: 3,
    textShadowColor: 'rgba(255,215,0,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },

  // ── Pause button ──────────────────────────────────────────────────────────
  // top / left are set dynamically via inline style using insets
  pauseBtn: {
    position: 'absolute',
    width: PAUSE_BTN_SIZE,
    height: PAUSE_BTN_SIZE,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
  },
  pauseIconRow: {
    flexDirection: 'row',
    gap: 5,
  },
  pauseBar: {
    width: 3.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },

  // ── Pause overlay ─────────────────────────────────────────────────────────
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pauseCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 40,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    width: 260,
  },
  pauseTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 8,
  },
  resumeBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  resumeText: {
    color: '#0f2027',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quitBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  quitText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // ── Banner ────────────────────────────────────────────────────────────────
  bannerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
});
