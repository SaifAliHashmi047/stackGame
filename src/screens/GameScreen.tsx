import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import { StackScreenProps } from '@react-navigation/stack';

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

type Props = StackScreenProps<RootStackParamList, 'Game'>;

const TOWER_HEIGHT = SCREEN_HEIGHT * 12;

export default function GameScreen({ navigation }: Props) {
  const game = useGame();
  const { bestScore, updateIfBest } = useHighScore();
  const { lightImpact, mediumImpact, errorFeedback } = useHaptics();
  const { playTap, playPerfect, playCombo, playGameOver } = useSound();

  const [isNewBest, setIsNewBest] = useState(false);

  // Perfect label flash
  const perfectOpacity = useSharedValue(0);
  const perfectScale = useSharedValue(0.5);

  // Track previous game over state to fire only once
  const wasGameOverRef = useRef(false);

  // ── Tap gesture ─────────────────────────────────────────────────────────────
  const tapGesture = Gesture.Tap().onEnd(() => {
    'worklet';
    runOnJS(game.onTap)(game.movingX.value);
  });

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Perfect placement visual feedback
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

  // Combo haptic
  useEffect(() => {
    if (game.combo >= 3) {
      playCombo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.combo]);

  // Normal placement haptic
  useEffect(() => {
    if (game.blocks.length > 1 && !game.isPerfectPlacement && !game.isGameOver) {
      lightImpact();
      playTap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.blocks.length]);

  // Game over
  useEffect(() => {
    if (game.isGameOver && !wasGameOverRef.current) {
      wasGameOverRef.current = true;
      errorFeedback();
      playGameOver();
      updateIfBest(game.score).then(newBest => setIsNewBest(newBest));
    }
    if (!game.isGameOver) {
      wasGameOverRef.current = false;
      setIsNewBest(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.isGameOver]);

  // ── Styles ───────────────────────────────────────────────────────────────────
  // Positive translateY moves the tower container DOWN, keeping the
  // moving block visible near the center as the stack grows upward.
  const cameraStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: game.cameraOffset.value }],
  }));

  const perfectLabelStyle = useAnimatedStyle(() => ({
    opacity: perfectOpacity.value,
    transform: [{ scale: perfectScale.value }],
  }));

  // ── Derived data ─────────────────────────────────────────────────────────────
  const theme = getThemeForBlock(game.blocks.length);
  const nextColor = getColorForBlock(game.blocks.length);
  const topBlock = game.topBlock;
  const movingBlockBottom = GROUND_HEIGHT + game.blocks.length * BLOCK_STEP;

  // Particle position: center of the last placed block in screen-space.
  // Container translateY = +cameraOffset, so container bottom = SCREEN_HEIGHT + cameraOffset.
  // Block n bottom = (SCREEN_HEIGHT + cameraOffset) - (GROUND_HEIGHT + n * BLOCK_STEP)
  const particleX = topBlock.x + topBlock.width / 2;
  const particleY =
    SCREEN_HEIGHT +
    game.cameraOffset.value -
    GROUND_HEIGHT -
    (game.blocks.length - 1) * BLOCK_STEP -
    (BLOCK_HEIGHT + ISO_DY) / 2;

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  const handlePlayAgain = useCallback(() => {
    game.restart();
  }, [game]);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.root}>
        <StatusBar hidden />

        {/* Animated gradient background */}
        <LinearGradient
          colors={theme.gradientColors}
          style={StyleSheet.absoluteFill}
        />

        {/* Tower container — translateY drives camera */}
        <Animated.View style={[styles.tower, cameraStyle]}>
          {/* Ground strip */}
          <View style={styles.ground} />

          {/* Stacked blocks */}
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

          {/* Cut-off falling pieces */}
          {game.cutoffPieces.map(piece => (
            <CutoffAnimation
              key={piece.id}
              piece={piece}
              bottomOffset={GROUND_HEIGHT + (game.blocks.length - 1) * BLOCK_STEP}
            />
          ))}

          {/* Moving block */}
          {!game.isGameOver && (
            <MovingBlock
              movingX={game.movingX}
              width={topBlock.width}
              color={nextColor}
              bottomOffset={movingBlockBottom}
            />
          )}
        </Animated.View>

        {/* Particle burst on perfect */}
        {game.isPerfectPlacement && (
          <ParticleEffect
            x={particleX}
            y={particleY}
            color={topBlock.color}
            active={game.isPerfectPlacement}
            count={14}
          />
        )}

        {/* HUD */}
        <ScoreDisplay
          score={game.score}
          bestScore={bestScore}
          scoreScale={game.scoreScale}
          isBestBeaten={isNewBest}
        />

        {/* "PERFECT!" flash label */}
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
      </View>
    </GestureDetector>
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
});
