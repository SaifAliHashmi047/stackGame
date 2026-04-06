import { useState, useEffect, useCallback } from 'react';
import { getBestScore, saveBestScore } from '../utils/scoreStorage';

export function useHighScore() {
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    getBestScore().then(setBestScore);
  }, []);

  /** Saves score if it's a new best. Returns true if a new best was set. */
  const updateIfBest = useCallback(
    async (score: number): Promise<boolean> => {
      // Re-read from storage to avoid stale in-memory value
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
