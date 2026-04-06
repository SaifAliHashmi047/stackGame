/**
 * Sound hook — plays short audio cues via react-native-sound if the
 * library is installed and the asset files exist under assets/sounds/.
 *
 * To enable sounds:
 *   1. npm install react-native-sound
 *   2. Add tap.mp3, perfect.mp3, combo.mp3, gameover.mp3 to assets/sounds/
 *   3. For iOS run `pod install`, for Android rebuild.
 *
 * If the library or files are missing the hook silently no-ops.
 */
import { useCallback, useEffect, useRef } from 'react';

type SoundPlayer = { play: () => void } | null;

function loadSound(fileName: string): SoundPlayer {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sound = require('react-native-sound');
    Sound.setCategory('Ambient', true); // respect silent mode
    return new Sound(fileName, Sound.MAIN_BUNDLE, (err: Error | null) => {
      if (err) {
        // file not found or load error — no-op
      }
    });
  } catch {
    return null;
  }
}

export function useSound() {
  const tapRef = useRef<SoundPlayer>(null);
  const perfectRef = useRef<SoundPlayer>(null);
  const comboRef = useRef<SoundPlayer>(null);
  const gameoverRef = useRef<SoundPlayer>(null);

  useEffect(() => {
    tapRef.current = loadSound('tap.mp3');
    perfectRef.current = loadSound('perfect.mp3');
    comboRef.current = loadSound('combo.mp3');
    gameoverRef.current = loadSound('gameover.mp3');
  }, []);

  const playTap = useCallback(() => tapRef.current?.play(), []);
  const playPerfect = useCallback(() => perfectRef.current?.play(), []);
  const playCombo = useCallback(() => comboRef.current?.play(), []);
  const playGameOver = useCallback(() => gameoverRef.current?.play(), []);

  return { playTap, playPerfect, playCombo, playGameOver };
}
