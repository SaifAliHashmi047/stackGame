import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  BASE_SCORE,
  BLOCK_STEP,
  BLOCK_WIDTH_INITIAL,
  CAMERA_ANCHOR,
  COMBO_BONUS_MULTIPLIER,
  GROUND_HEIGHT,
  INITIAL_SPEED,
  ISO_DX,
  PERFECT_BONUS,
  PERFECT_THRESHOLD,
  SCREEN_HEIGHT,
  SCREEN_WIDTH,
  SPEED_BUMP_EVERY,
  SPEED_INCREMENT,
  SPEED_MAX,
} from '../constants/config';
import { calculateOverlap, isPerfect, Block, CutoffPiece } from '../utils/gameLogic';
import { getColorForBlock } from '../utils/colorThemes';
import { CAMERA_SPRING, SCORE_POP_UP, SCORE_POP_DOWN } from '../utils/physics';

// ─── Internal helpers ────────────────────────────────────────────────────────

function makeBaseBlock(): Block {
  return {
    id: 'base',
    x: (SCREEN_WIDTH - BLOCK_WIDTH_INITIAL) / 2,
    width: BLOCK_WIDTH_INITIAL,
    color: getColorForBlock(0),
  };
}

function clampComboIdx(combo: number): number {
  return Math.min(combo, COMBO_BONUS_MULTIPLIER.length - 1);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface GameStore {
  // State
  blocks: Block[];
  score: number;
  combo: number;
  isGameOver: boolean;
  isPerfectPlacement: boolean;
  cutoffPieces: CutoffPiece[];
  topBlock: Block;
  // Shared values (Reanimated)
  movingX: ReturnType<typeof useSharedValue<number>>;
  cameraOffset: ReturnType<typeof useSharedValue<number>>;
  scoreScale: ReturnType<typeof useSharedValue<number>>;
  // Actions
  onTap: (currentX: number) => void;
  restart: () => void;
}

export function useGame(): GameStore {
  // ── JS State ──────────────────────────────────────────────────────────────
  const [blocks, setBlocks] = useState<Block[]>([makeBaseBlock()]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPerfectPlacement, setIsPerfectPlacement] = useState(false);
  const [cutoffPieces, setCutoffPieces] = useState<CutoffPiece[]>([]);

  // ── Refs (always-fresh reads for stable callbacks) ────────────────────────
  const blocksRef = useRef(blocks);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const isGameOverRef = useRef(false);
  const speedRef = useRef(INITIAL_SPEED);

  // Sync refs every render (fine without concurrent mode)
  blocksRef.current = blocks;
  scoreRef.current = score;
  comboRef.current = combo;
  isGameOverRef.current = isGameOver;

  // ── Reanimated Shared Values ──────────────────────────────────────────────
  const movingX = useSharedValue(-(BLOCK_WIDTH_INITIAL + ISO_DX));
  const cameraOffset = useSharedValue(0);
  const scoreScale = useSharedValue(1);

  // ── Moving block animation (setInterval — runs on JS thread at ~60 fps) ────
  const directionRef = useRef<1 | -1>(1);

  useEffect(() => {
    if (isGameOver) return;

    const top = blocks[blocks.length - 1];
    const blockWidth = top.width;
    const startX = -(blockWidth + ISO_DX);
    const endX = SCREEN_WIDTH + blockWidth;

    // Reset position and direction for the fresh block
    movingX.value = startX;
    directionRef.current = 1;

    const id = setInterval(() => {
      let next = movingX.value + directionRef.current * speedRef.current;
      if (next >= endX) {
        next = endX;
        directionRef.current = -1;
      } else if (next <= startX) {
        next = startX;
        directionRef.current = 1;
      }
      movingX.value = next;
    }, 16);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, isGameOver]);

  // ── Camera follow ─────────────────────────────────────────────────────────
  const updateCamera = useCallback((blockCount: number) => {
    // Natural top of the moving block from the screen top (in upward-stacking coordinates)
    const naturalBottomFromTop = SCREEN_HEIGHT - GROUND_HEIGHT - blockCount * BLOCK_STEP;
    const targetTop = SCREEN_HEIGHT * (1 - CAMERA_ANCHOR);
    const offset = Math.max(0, targetTop - naturalBottomFromTop);
    cameraOffset.value = withSpring(offset, CAMERA_SPRING);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Score pop ─────────────────────────────────────────────────────────────
  const popScore = useCallback(() => {
    scoreScale.value = withSequence(
      withTiming(1.45, SCORE_POP_UP),
      withTiming(1.0, SCORE_POP_DOWN),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tap handler (called from UI thread via runOnJS) ───────────────────────
  const onTap = useCallback((currentX: number) => {
    if (isGameOverRef.current) return;

    const currentBlocks = blocksRef.current;
    const top = currentBlocks[currentBlocks.length - 1];
    const currentScore = scoreRef.current;
    const currentCombo = comboRef.current;

    const perfect = isPerfect(currentX, top.x);

    if (perfect) {
      // Snap to perfect alignment
      const multiplier = COMBO_BONUS_MULTIPLIER[clampComboIdx(currentCombo + 1)];
      const gained = (BASE_SCORE + PERFECT_BONUS) * multiplier;
      const newScore = currentScore + gained;
      const newCombo = currentCombo + 1;
      const newBlock: Block = {
        id: String(Date.now()),
        x: top.x,
        width: top.width,
        color: getColorForBlock(currentBlocks.length),
      };

      scoreRef.current = newScore;
      comboRef.current = newCombo;
      setScore(newScore);
      setCombo(newCombo);
      setIsPerfectPlacement(true);
      setBlocks(prev => [...prev, newBlock]);
      updateCamera(currentBlocks.length + 1);
      popScore();

      // Auto-hide perfect label
      setTimeout(() => setIsPerfectPlacement(false), 900);
    } else {
      const { overlapWidth, overlapStart, cutoffX, cutoffWidth, isLeft } =
        calculateOverlap(currentX, top.width, top.x, top.width);

      if (overlapWidth <= 0) {
        // Miss — game over
        setIsGameOver(true);
        return;
      }

      const multiplier = COMBO_BONUS_MULTIPLIER[clampComboIdx(currentCombo)];
      const gained = BASE_SCORE * multiplier;
      const newScore = currentScore + gained;
      const newBlock: Block = {
        id: String(Date.now()),
        x: overlapStart,
        width: overlapWidth,
        color: getColorForBlock(currentBlocks.length),
      };

      // Cut-off piece animation
      if (cutoffWidth > 0) {
        const piece: CutoffPiece = {
          id: `cut_${Date.now()}`,
          x: cutoffX,
          width: cutoffWidth,
          color: top.color,
          isLeft,
        };
        setCutoffPieces(prev => [...prev, piece]);
        setTimeout(
          () => setCutoffPieces(prev => prev.filter(p => p.id !== piece.id)),
          750,
        );
      }

      scoreRef.current = newScore;
      comboRef.current = 0;
      setScore(newScore);
      setCombo(0);
      setIsPerfectPlacement(false);
      setBlocks(prev => [...prev, newBlock]);
      updateCamera(currentBlocks.length + 1);
      popScore();
    }

    // Speed bump every N blocks
    const newTotal = blocksRef.current.length; // still old ref but close enough
    if (newTotal % SPEED_BUMP_EVERY === 0) {
      speedRef.current = Math.min(SPEED_MAX, speedRef.current + SPEED_INCREMENT);
    }
  }, []); // empty — all reactive reads via refs

  // ── Restart ───────────────────────────────────────────────────────────────
  const restart = useCallback(() => {
    speedRef.current = INITIAL_SPEED;
    scoreRef.current = 0;
    comboRef.current = 0;
    isGameOverRef.current = false;
    directionRef.current = 1;
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setIsPerfectPlacement(false);
    setCutoffPieces([]);
    cameraOffset.value = withSpring(0, CAMERA_SPRING);
    setBlocks([makeBaseBlock()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topBlock = blocks[blocks.length - 1];

  return {
    blocks,
    score,
    combo,
    isGameOver,
    isPerfectPlacement,
    cutoffPieces,
    topBlock,
    movingX,
    cameraOffset,
    scoreScale,
    onTap,
    restart,
  };
}
