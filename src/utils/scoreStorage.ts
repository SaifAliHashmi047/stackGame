import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_SCORE_KEY = 'stack_best_score';

export async function getBestScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BEST_SCORE_KEY);
    if (raw == null) return 0;
    const n = parseInt(raw, 10);
    return Number.isNaN(n) ? 0 : n;
  } catch {
    return 0;
  }
}

export async function saveBestScore(score: number): Promise<void> {
  try {
    await AsyncStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // ignore storage errors
  }
}
