# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
# Start Metro bundler
yarn start

# Run on Android (Metro must be running)
yarn android

# Run on iOS (Metro must be running)
yarn ios

# First-time iOS setup (also run after updating native deps)
bundle install
bundle exec pod install

# Lint
yarn lint

# Tests
yarn test

# Run a single test file
yarn test __tests__/App.test.tsx
```

Node >= 22.11.0 is required.

## Architecture

This is a single-screen React Native game app. All game logic, rendering, and styles live in **`App.tsx`** — there are no separate screens, navigation, or state management libraries.

### Game concept

"StackHouse" / "DinoNeck" is a stacking block game: a moving block oscillates horizontally; the player taps to drop it. The overlap between the falling block and the last stacked block becomes the new block (narrower on a miss). A complete miss ends the game. The stack grows upward, simulating a dinosaur neck made of scaly segments.

### Key data model

- `blocks` — array of `{ x, width }` representing all stacked segments. The first element is always the fixed base block.
- `movingX` — the current left-position of the oscillating block (same width as the last block in `blocks`).
- Score increments by 100 per successful stack; speed (`speedRef`) increases by 0.5 after each drop.

### Core functions

| Function | Purpose |
|---|---|
| `stackLayout(blocks)` | Computes `bottom` offset for each stacked block and the total `stackTop` |
| `segmentHeight(blockWidth)` | Derives segment height from width, clamped to `[SEG_MIN, SEG_MAX]` |
| `scaleGridForBlock(index, w, h)` | Generates the pseudo-random scale-tile pattern for a segment's interior |
| `dropBlock()` | Calculates overlap, adds new block or triggers game over |
| `DinoNeckSegment` | Pure visual component for one block (stack or moving) |
| `DinoNeckGame` | Main game component — owns all state and the animation loop |

### Persistence

High score is persisted via `@react-native-async-storage/async-storage` under the key `@StackHouse_highScore`. It is read on mount and written on game over if the current score beats the stored value.

### Animation loop

The moving block is driven by a `setInterval` at ~16 ms (not `requestAnimationFrame`). Direction and speed are stored in refs (`directionRef`, `speedRef`) to avoid stale closures inside the interval callback.
