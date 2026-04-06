import React, { memo, useEffect } from 'react';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Block3D from './Block3D';
import { CutoffPiece } from '../utils/gameLogic';
import { CUTOFF_FALL } from '../utils/physics';

interface CutoffAnimationProps {
  piece: CutoffPiece;
  bottomOffset: number;
}

const CutoffAnimation = memo(({ piece, bottomOffset }: CutoffAnimationProps) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(640, CUTOFF_FALL);
    opacity.value = withTiming(0, { duration: 550 });
    rotate.value = withTiming(piece.isLeft ? -30 : 30, CUTOFF_FALL);

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
      cancelAnimation(rotate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: piece.x,
          bottom: bottomOffset,
        },
        animStyle,
      ]}
    >
      <Block3D width={piece.width} color={piece.color} />
    </Animated.View>
  );
});

CutoffAnimation.displayName = 'CutoffAnimation';

export default CutoffAnimation;
