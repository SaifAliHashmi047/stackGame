import React, { memo, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { PARTICLE_FADE } from '../utils/physics';

// ─── Single particle ──────────────────────────────────────────────────────────

interface ParticleProps {
  originX: number;
  originY: number;
  angle: number;
  velocity: number;
  rotation: number;
  color: string;
  size: number;
  active: boolean;
}

const Particle = memo(
  ({ originX, originY, angle, velocity, rotation, color, size, active }: ParticleProps) => {
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const opacity = useSharedValue(0);
    const rotate = useSharedValue(0);

    useEffect(() => {
      if (!active) return;
      tx.value = 0;
      ty.value = 0;
      opacity.value = 1;
      rotate.value = 0;

      tx.value = withTiming(Math.cos(angle) * velocity, PARTICLE_FADE);
      ty.value = withTiming(Math.sin(angle) * velocity, PARTICLE_FADE);
      opacity.value = withTiming(0, PARTICLE_FADE);
      rotate.value = withTiming(rotation, PARTICLE_FADE);

      return () => {
        cancelAnimation(tx);
        cancelAnimation(ty);
        cancelAnimation(opacity);
        cancelAnimation(rotate);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    const animStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate.value}deg` },
      ],
    }));

    return (
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: originX - size / 2,
            top: originY - size / 2,
            width: size,
            height: size,
            backgroundColor: color,
            borderRadius: 1,
          },
          animStyle,
        ]}
      />
    );
  },
);
Particle.displayName = 'Particle';

// ─── Particle burst ───────────────────────────────────────────────────────────

interface ParticleEffectProps {
  /** Burst center in screen-space (relative to parent) */
  x: number;
  y: number;
  color: string;
  active: boolean;
  count?: number;
}

interface ParticleConfig {
  angle: number;
  velocity: number;
  rotation: number;
  size: number;
}

function buildParticles(count: number): ParticleConfig[] {
  return Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4,
    velocity: 80 + Math.random() * 80,
    rotation: (Math.random() - 0.5) * 720,
    size: 4 + Math.random() * 4,
  }));
}

const ParticleEffect = memo(({ x, y, color, active, count = 14 }: ParticleEffectProps) => {
  const particles = useRef<ParticleConfig[]>(buildParticles(count));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.current.map((p, i) => (
        <Particle
          // eslint-disable-next-line react/no-array-index-key
          key={i}
          originX={x}
          originY={y}
          angle={p.angle}
          velocity={p.velocity}
          rotation={p.rotation}
          color={color}
          size={p.size}
          active={active}
        />
      ))}
    </View>
  );
});
ParticleEffect.displayName = 'ParticleEffect';

export default ParticleEffect;
