import React, { memo } from 'react';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Block3D from './Block3D';

interface MovingBlockProps {
  movingX: SharedValue<number>;
  width: number;
  color: string;
  bottomOffset: number;
}

/**
 * The horizontally-sliding block that the player must tap to drop.
 * Uses Reanimated's useAnimatedStyle to drive position on the UI thread.
 */
const MovingBlock = memo(({ movingX, width, color, bottomOffset }: MovingBlockProps) => {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: movingX.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: bottomOffset,
          left: 0,
        },
        animStyle,
      ]}
    >
      <Block3D width={width} color={color} />
    </Animated.View>
  );
});

MovingBlock.displayName = 'MovingBlock';

export default MovingBlock;
