import AsyncStorage from '@react-native-async-storage/async-storage';

const BEST_SCORE_KEY = 'stack_best_score';
const LEADERBOARD_KEY = 'stack_leaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

export interface LeaderboardEntry {
  score: number;
  date: string;
}

// ── Best score ────────────────────────────────────────────────────────────────

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

// ── Leaderboard ───────────────────────────────────────────────────────────────

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
    if (raw == null) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export async function addToLeaderboard(score: number): Promise<void> {
  try {
    const entries = await getLeaderboard();
    const newEntry: LeaderboardEntry = {
      score,
      date: new Date().toLocaleDateString(),
    };
    const updated = [...entries, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_LEADERBOARD_ENTRIES);
    await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}
