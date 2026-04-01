import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const HIGH_SCORE_KEY = "@StackHouse_highScore";

/** Square-ish: height tracks width, clamped so early segments are not huge. */
const SEG_MIN = 22;
const SEG_MAX = 40;
const SEG_GAP = 2;

function segmentHeight(blockWidth: number) {
  return Math.min(SEG_MAX, Math.max(SEG_MIN, blockWidth));
}

const BASE_WIDTH = Math.min(250, SCREEN_WIDTH - 48);
const BASE_X = (SCREEN_WIDTH - BASE_WIDTH) / 2;

const COLORS = {
  skyTop: "#3D5F6E",
  skyMid: "#5E8A8C",
  horizon: "#8FA89A",
  ground: "#3A3228",
  neckBase: "#3D6B52",
  neckDark: "#2A4A38",
  scaleA: "#4F8F68",
  scaleB: "#3D6E52",
  edge: "#1E3328",
  neckMoving: "#5CB87E",
  edgeMoving: "#2D5C40",
  hudText: "#1A2420",
  hudMuted: "#3D4F45",
  hudCard: "rgba(232, 245, 236, 0.72)",
  hudBorder: "rgba(45, 92, 64, 0.45)",
  overlay: "rgba(18, 28, 22, 0.94)",
};

function scaleGridForBlock(index: number, w: number, h: number) {
  const cols = Math.max(3, Math.min(8, Math.floor(w / 26)));
  const rows = Math.max(2, Math.min(4, Math.floor(h / 12)));
  const seed = (index + 1) * 2654435761;
  const cells: { key: string; left: number; top: number; sw: number; sh: number; shade: 0 | 1 }[] =
    [];
  const cellW = w / cols;
  const cellH = h / rows;
  const gap = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bit = ((seed >> (r * cols + c)) ^ (r * 17 + c * 31)) & 1;
      cells.push({
        key: `${r}-${c}`,
        left: c * cellW + gap,
        top: r * cellH + gap,
        sw: cellW - gap * 2,
        sh: cellH - gap * 2,
        shade: bit as 0 | 1,
      });
    }
  }
  return cells;
}

function DinoNeckSegment({
  left,
  bottom,
  width,
  height,
  index,
  isMoving,
}: {
  left: number;
  bottom: number;
  width: number;
  height: number;
  index: number;
  isMoving?: boolean;
}) {
  const innerW = width - 6;
  const innerH = height - 6;
  const scales = useMemo(
    () => scaleGridForBlock(index, innerW, innerH),
    [index, innerW, innerH]
  );

  return (
    <View
      pointerEvents="none"
      style={[styles.segmentWrap, { left, bottom, width, height: height + SEG_GAP }]}
    >
      <View
        style={[
          styles.segmentBox,
          isMoving && styles.segmentBoxMoving,
          { width, height },
        ]}
      >
        <View style={[styles.segmentInner, { width: innerW, height: innerH }]}>
          {scales.map((cell) => (
            <View
              key={cell.key}
              style={[
                styles.scaleTile,
                {
                  left: cell.left,
                  top: cell.top,
                  width: cell.sw,
                  height: cell.sh,
                  backgroundColor:
                    cell.shade === 0 ? COLORS.scaleA : COLORS.scaleB,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.boxShine} />
      </View>
    </View>
  );
}

function stackLayout(blocks: { width: number }[]) {
  let acc = 0;
  const bottoms: number[] = [];
  for (const b of blocks) {
    bottoms.push(acc);
    acc += segmentHeight(b.width) + SEG_GAP;
  }
  return { bottoms, stackTop: acc };
}

function DinoNeckGame() {
  const [blocks, setBlocks] = useState([{ x: BASE_X, width: BASE_WIDTH }]);
  const [movingX, setMovingX] = useState(BASE_X);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [showNewBest, setShowNewBest] = useState(false);
  const storedHighRef = useRef(0);

  const speedRef = useRef(4);
  const directionRef = useRef(1);
  const movingWidthRef = useRef(blocks[0].width);

  const { bottoms, stackTop } = useMemo(() => stackLayout(blocks), [blocks]);
  const movingH = segmentHeight(blocks[blocks.length - 1].width);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(HIGH_SCORE_KEY)
      .then((raw) => {
        if (!mounted || raw == null) return;
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) {
          storedHighRef.current = n;
          setHighScore(n);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!gameOver) return;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
        const stored = raw != null ? parseInt(raw, 10) : 0;
        const best = Number.isNaN(stored) ? 0 : stored;
        if (cancelled) return;
        if (score > best) {
          await AsyncStorage.setItem(HIGH_SCORE_KEY, String(score));
          storedHighRef.current = score;
          setHighScore(score);
        } else {
          setHighScore(best);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [gameOver, score]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setMovingX((prev) => {
        const w = movingWidthRef.current;
        const maxX = SCREEN_WIDTH - w;
        let next = prev + speedRef.current * directionRef.current;

        if (next <= 0) {
          directionRef.current = 1;
          return 0;
        }
        if (next >= maxX) {
          directionRef.current = -1;
          return maxX;
        }
        return next;
      });
    }, 16);

    return () => clearInterval(interval);
  }, [gameOver]);

  const restart = useCallback(() => {
    setBlocks([{ x: BASE_X, width: BASE_WIDTH }]);
    setMovingX(BASE_X);
    setScore(0);
    setGameOver(false);
    setShowNewBest(false);
    speedRef.current = 4;
    directionRef.current = 1;
    movingWidthRef.current = BASE_WIDTH;
  }, []);

  const dropBlock = () => {
    if (gameOver) return;

    const last = blocks[blocks.length - 1];
    const overlapStart = Math.max(movingX, last.x);
    const overlapEnd = Math.min(movingX + last.width, last.x + last.width);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      setShowNewBest(score > storedHighRef.current);
      setGameOver(true);
      return;
    }

    const newBlock = { x: overlapStart, width: overlapWidth };
    movingWidthRef.current = overlapWidth;
    setBlocks((prev) => [...prev, newBlock]);
    setScore((prev) => prev + 100);
    speedRef.current += 0.5;
    setMovingX(overlapStart);
  };

  const onPress = () => {
    if (gameOver) {
      restart();
      return;
    }
    dropBlock();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="light-content" />
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.container}>
          <View style={styles.skyBand} />
          <View style={[styles.skyBand, styles.skyBand2]} />
          <View style={[styles.skyBand, styles.skyBand3]} />
          <View style={styles.groundStrip} />

          <View style={styles.hud} pointerEvents="none">
            <View style={styles.hudRow}>
              <View style={styles.hudCard}>
                <Text style={styles.hudLabel}>SCORE</Text>
                <Text style={styles.hudValue}>{score}</Text>
              </View>
              <View style={styles.hudCard}>
                <Text style={styles.hudLabel}>BEST</Text>
                <Text style={styles.hudValue}>{highScore}</Text>
              </View>
            </View>
            <Text style={styles.hudHint}>
              {gameOver
                ? "Tap to play again"
                : "Tap to stack — build the dino neck!"}
            </Text>
          </View>

          {blocks.map((block, index) => (
            <DinoNeckSegment
              key={index}
              index={index}
              left={block.x}
              bottom={bottoms[index] ?? 0}
              width={block.width}
              height={segmentHeight(block.width)}
            />
          ))}

          {!gameOver && (
            <DinoNeckSegment
              index={blocks.length}
              left={movingX}
              bottom={stackTop}
              width={blocks[blocks.length - 1].width}
              height={movingH}
              isMoving
            />
          )}

          {gameOver && (
            <View style={styles.gameOver} pointerEvents="none">
              <Text style={styles.gameOverTitle}>Neck broke!</Text>
              <Text style={styles.gameOverScore}>Score {score}</Text>
              {showNewBest && <Text style={styles.newBest}>New best!</Text>}
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <DinoNeckGame />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.skyTop,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.horizon,
  },
  skyBand: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.22,
    backgroundColor: COLORS.skyTop,
  },
  skyBand2: {
    top: SCREEN_HEIGHT * 0.06,
    height: SCREEN_HEIGHT * 0.12,
    backgroundColor: COLORS.skyMid,
    opacity: 0.95,
  },
  skyBand3: {
    top: SCREEN_HEIGHT * 0.14,
    height: SCREEN_HEIGHT * 0.12,
    backgroundColor: COLORS.horizon,
    opacity: 0.75,
  },
  groundStrip: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 56,
    backgroundColor: COLORS.ground,
  },
  hud: {
    paddingHorizontal: 20,
    paddingTop: 8,
    zIndex: 10,
  },
  hudRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  hudCard: {
    flex: 1,
    backgroundColor: COLORS.hudCard,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 2,
    borderColor: COLORS.hudBorder,
  },
  hudLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: COLORS.hudMuted,
  },
  hudValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.hudText,
    marginTop: 2,
  },
  hudHint: {
    textAlign: "center",
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.hudMuted,
  },
  segmentWrap: {
    position: "absolute",
  },
  segmentBox: {
    backgroundColor: COLORS.neckBase,
    borderRadius: 3,
    borderWidth: 3,
    borderColor: COLORS.edge,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 4,
  },
  segmentBoxMoving: {
    backgroundColor: COLORS.neckMoving,
    borderColor: COLORS.edgeMoving,
    shadowOpacity: 0.35,
    elevation: 8,
  },
  segmentInner: {
    position: "absolute",
    left: 2,
    top: 2,
    overflow: "hidden",
    borderRadius: 1,
  },
  scaleTile: {
    position: "absolute",
    borderRadius: 2,
    opacity: 0.95,
  },
  boxShine: {
    position: "absolute",
    top: 3,
    left: "8%",
    right: "8%",
    height: 3,
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  gameOver: {
    position: "absolute",
    left: 24,
    right: 24,
    top: "36%",
    alignItems: "center",
    backgroundColor: COLORS.overlay,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: "rgba(92, 184, 126, 0.35)",
  },
  gameOverTitle: {
    color: "#9FD4B0",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gameOverScore: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    marginTop: 12,
  },
  newBest: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    color: "#C8F7A8",
  },
});
