import { useState, useEffect, useCallback } from 'react';
import { getBestScore, saveBestScore, addToLeaderboard } from '../utils/scoreStorage';

export function useHighScore() {
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    getBestScore().then(setBestScore);
  }, []);

  /**
   * Called on every game over. Saves every score to the leaderboard.
   * Also updates the all-time best. Returns true if a new best was set.
   */
  const updateIfBest = useCallback(
    async (score: number): Promise<boolean> => {
      await addToLeaderboard(score);
      const stored = await getBestScore();
      if (score > stored) {
        await saveBestScore(score);
        setBestScore(score);
        return true;
      }
      setBestScore(stored);
      return false;
    },
    [],
  );

  return { bestScore, updateIfBest };
}
