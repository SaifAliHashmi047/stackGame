Build me a complete, production-ready 3D Stack game in React Native CLI (TypeScript) that looks exactly like the classic Stack game with isometric 3D blocks, gradient color themes, physics-based animations, and polished UI. Here is everything that must be implemented end to end:

---

PROJECT SETUP

- React Native CLI with TypeScript
- Target: iOS and Android
- Install and configure all required dependencies:
  - react-native-reanimated (v3+) for all animations
  - react-native-gesture-handler for tap input
  - @react-navigation/native + @react-navigation/stack for screen navigation
  - react-native-screens + react-native-safe-area-context
  - @react-native-async-storage/async-storage for high score persistence
  - react-native-haptic-feedback for tactile feedback
  - react-native-sound for audio effects
  - react-native-linear-gradient for background gradients
  - react-native-svg for any SVG-based UI elements
- Run pod install for iOS automatically
- Set up proper tsconfig.json with strict mode
- Configure babel.config.js for reanimated plugin

---

FOLDER STRUCTURE

Create this exact structure:
src/
screens/ HomeScreen.tsx, GameScreen.tsx, GameOverScreen.tsx
components/ Block3D.tsx, MovingBlock.tsx, ScoreDisplay.tsx, ComboLabel.tsx, ParticleEffect.tsx, GameOverlay.tsx
hooks/ useGame.ts, useHighScore.ts, useSound.ts, useHaptics.ts
utils/ gameLogic.ts, colorThemes.ts, physics.ts, scoreStorage.ts
constants/ config.ts, colors.ts
assets/sounds/ tap.mp3, perfect.mp3, gameover.mp3, combo.mp3
navigation/ AppNavigator.tsx

---

3D ISOMETRIC VISUAL RENDERING

Render every block as a proper 3D isometric box using three visible faces:

- Top face (lightest shade of the block color)
- Left face (medium shade)
- Right face (darkest shade)
  Each face drawn with React Native View transforms using matrix3d or skewX/skewY transforms to simulate true isometric perspective. Block dimensions: width ~280, height ~28 per layer. The isometric angle must be consistent — 30 degrees for the classic stack look. Blocks must appear to have real depth and shadow. The right face has a subtle dark overlay (rgba 0,0,0,0.25) and the left face has (rgba 0,0,0,0.15) to sell the 3D depth. Top face is the full block color. Do NOT use flat 2D rectangles — every block must look like a real 3D slab.

---

COLOR THEMES

Implement 3 color themes that automatically cycle as score increases. Each theme has a gradient background and a block color palette that transitions smoothly across layers:

Theme 1 (Rainbow): Background gradient from #1a8fe3 to #a8edea. Block colors cycle through: #f06, #f93, #ff6, #6f6, #36f, #96f — hue-shifted per layer, creating a rainbow tower effect like the left screenshot.

Theme 2 (Warm Sand): Background gradient from #74b49b to #f7d08a. Block colors go from deep red #8b1a1a up through coral, salmon, peach to light sand #f5deb3 — warm earthy tones like the center screenshot.

Theme 3 (Ocean Teal): Background gradient from #0f2027 via #203a43 to #2c5364. Block colors go from deep navy #1a237e up through cobalt, steel blue, to teal #4dd0e1 — cool ocean tones like the right screenshot.

Theme switches automatically every 30 blocks. Each new block gets the next color in the current theme palette, giving the tower a layered rainbow effect when viewed from the side.

---

GAME LOGIC (gameLogic.ts)

Implement full game logic in a pure utility file:

Block data structure:
type Block = {
id: string
x: number // left edge X position
z: number // depth Z position (for 3D axis)
width: number // current width
depth: number // current depth
color: string
axis: 'x' | 'z' // which axis this block slides on
}

Sliding behavior:

- Blocks alternate axis: first block slides on X axis (left-right), next on Z axis (front-back), alternating every block
- On X-axis: block moves from -blockWidth to screenWidth + blockWidth and bounces back (ping-pong loop)
- On Z-axis: simulate front-back movement using scale transforms (perspective scaling from 0.85 to 1.0)
- Speed starts at 2.5 units per frame and increases by 0.08 every 5 blocks, capped at 6.5

Collision detection on tap:

- Calculate overlap between moving block and the top of the stack
- overlapX = min(movingBlock.x + movingBlock.width, topBlock.x + topBlock.width) - max(movingBlock.x, topBlock.x)
- overlapZ = same logic for Z axis
- If overlap <= 0 on the active axis: trigger GAME OVER
- If overlap > 0: trim the block to the overlap size and position
- Perfect detection: if the misalignment is less than 8px, snap to perfect alignment, do NOT trim, award bonus points

Cut-off piece:

- The trimmed-off portion must animate falling: translateY from 0 to +600, with rotation (rotateX or rotateZ depending on axis), opacity fading from 1 to 0, duration 600ms using Reanimated

Stack camera follow:

- As blocks stack up, translateY the entire tower upward so the top always stays centered on screen
- Use smooth spring animation: damping 20, stiffness 120

---

PHYSICS ENGINE (physics.ts)

Implement using react-native-reanimated worklets:

- All animations run on the UI thread using useAnimatedStyle and withTiming / withSpring
- Sliding animation: useSharedValue for position, Animated.loop with withTiming bouncing between min and max bounds
- Cut-off physics: withTiming translateY (gravity fall), withTiming rotateZ (tumble), withTiming opacity (fade out) — all run simultaneously via withParallel equivalent
- Camera spring: withSpring for smooth tower scroll
- Score pop: withSequence(withTiming(1.4, {duration: 120}), withTiming(1.0, {duration: 180})) on score scale
- Perfect flash: withSequence of opacity pulses on the placed block — 3 rapid flashes in white
- Combo shake: small screen shake using translateX withSequence of ±6px oscillations

---

SCORING SYSTEM

- Base score: +1 per block placed
- Perfect placement: +3 bonus, show "PERFECT!" label with yellow glow animation
- Combo system: consecutive perfects multiply score — 2x after 2 perfects, 3x after 3, max 5x
- Combo label animates in from below with scale bounce and fades after 1.5s
- Score display at top center: large white bold number, font size 72, with drop shadow
- Best score (diamond icon + number) displayed top right corner
- When a new high score is beaten mid-game, the best score display pulses gold

---

SCREENS

HomeScreen:

- Full gradient background matching Theme 1
- Animated logo "STACK" in large bold white letters with subtle float animation (translateY ±8px, 2s loop)
- Best Score display with diamond icon below logo
- "TAP TO PLAY" button that pulses opacity (1.0 to 0.6, repeat)
- Smooth transition to GameScreen using shared element feel (fade + scale)

GameScreen:

- Full screen gameplay, no status bar (StatusBar hidden)
- Background: LinearGradient that smoothly transitions color when theme changes
- Tower rendered from bottom center of screen, stacking upward
- Moving block slides above the tower
- Score centered at top
- Best score top right
- Tap anywhere on screen to place block (GestureDetector with Tap gesture)
- Pause button (top left, subtle icon)
- No other UI clutter during gameplay

GameOverScreen:

- Dramatic entrance: score flies in from above with bounce
- "GAME OVER" text in white, large
- Final score displayed prominently
- "NEW BEST!" banner if high score beaten — gold shimmer animation
- "PLAY AGAIN" button and "HOME" button
- Shows last tower snapshot (faded in background)
- Share score button (native share sheet)

---

PARTICLE EFFECTS (ParticleEffect.tsx)

On perfect placement: emit 12–16 small square particles (4x4px) in the block's color, exploding outward from the placed block position. Each particle has random angle, random velocity (80–160px), random rotation, fades out over 500ms. Implemented purely with Reanimated shared values, no third-party particle library.

On game over: emit larger particles falling downward with gravity simulation.

---

HAPTICS (useHaptics.ts)

- Normal placement: light impact (ImpactFeedbackStyle.Light)
- Perfect placement: medium impact (ImpactFeedbackStyle.Medium)
- Combo: heavy impact (ImpactFeedbackStyle.Heavy)
- Game over: NotificationFeedbackType.Error

---

SOUND (useSound.ts)

Load all sounds at app start. Play:

- tap.mp3 on every block placement (short click, ~80ms)
- perfect.mp3 on perfect placement (chime)
- combo.mp3 on combo milestone
- gameover.mp3 on game over
  Respect device silent mode — if silent, skip sounds but keep haptics.

---

HIGH SCORE (scoreStorage.ts + useHighScore.ts)

- Persist best score to AsyncStorage with key 'stack_best_score'
- Load on app start
- Update whenever current score exceeds best
- Expose: { bestScore, updateIfBest(score) }

---

CONFIGURATION (config.ts)

Export all tunable constants:
BLOCK_WIDTH_INITIAL = 280
BLOCK_HEIGHT = 28
BLOCK_DEPTH = 280
INITIAL_SPEED = 2.5
SPEED_INCREMENT = 0.08
SPEED_MAX = 6.5
PERFECT_THRESHOLD = 8
THEME_CHANGE_INTERVAL = 30
COMBO_BONUS_MULTIPLIER = [1, 1, 2, 3, 4, 5]

---

NAVIGATION (AppNavigator.tsx)

Stack navigator with:

- HomeScreen (initial)
- GameScreen
- GameOverScreen
  Transitions: custom fade + scale interpolation, duration 300ms. No default header shown on any screen.

---

ANDROID SPECIFIC

- Set windowSoftInputMode to adjustNothing in AndroidManifest.xml
- Enable hardware acceleration
- Set immersive fullscreen mode (hide nav bar + status bar) using react-native-navigation-bar-color or SystemUI flags
- Ensure 60fps by keeping all animations on UI thread

---

IOS SPECIFIC

- Hide status bar with StatusBar hidden prop
- Support safe area insets (do not clip content behind notch)
- Set UIRequiresFullScreen = true in Info.plist
- Splash screen matches game background gradient

---

FINAL DELIVERABLES

1. Every file listed in the folder structure above, fully implemented
2. App compiles and runs on both iOS and Android with zero errors
3. All animations are smooth at 60fps
4. Game is fully playable from cold launch: Home → Game → GameOver → Replay
5. High score persists across app restarts
6. No placeholder code, no TODO comments — everything implemented
7. README.md with exact commands to install dependencies, run iOS, run Android

Start by creating the folder structure and config files, then implement gameLogic.ts and physics.ts, then build components bottom-up (Block3D first), then screens, then wire navigation. Do not stop until every file is complete and the game runs end to end.
