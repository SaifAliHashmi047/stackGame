import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  CardStyleInterpolators,
  createStackNavigator,
  TransitionPresets,
} from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import GameOverScreen from '../screens/GameOverScreen';

export type RootStackParamList = {
  Home: undefined;
  Game: undefined;
  GameOver: { score: number; isNewBest: boolean };
};

const Stack = createStackNavigator<RootStackParamList>();

/** Custom fade + scale card interpolator (300 ms) */
function fadeScaleInterpolator({
  current,
}: Parameters<typeof CardStyleInterpolators.forFadeFromCenter>[0]) {
  return {
    cardStyle: {
      opacity: current.progress,
      transform: [
        {
          scale: current.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0.93, 1],
          }),
        },
      ],
    },
  };
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          cardStyleInterpolator: fadeScaleInterpolator,
          transitionSpec: {
            open: { animation: 'timing', config: { duration: 300 } },
            close: { animation: 'timing', config: { duration: 250 } },
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="GameOver" component={GameOverScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
