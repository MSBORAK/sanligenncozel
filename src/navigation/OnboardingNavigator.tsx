import React from 'react';
import { createStackNavigator, StackCardInterpolationProps, StackNavigationOptions } from '@react-navigation/stack';
import OnboardingScreen from '@/screens/OnboardingScreen';
import LoginScreen from '@/screens/LoginScreen';

export type OnboardingStackParamList = {
  Onboarding: undefined;
  Login: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

const slideFade = ({ current, layouts }: StackCardInterpolationProps) => {
  const translateX = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.width * 0.12, 0],
  });
  const opacity = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });
  return {
    cardStyle: {
      transform: [{ translateX }],
      opacity,
    },
    overlayStyle: {
      opacity: current.progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 0.15],
      }),
    },
  };
};

const screenOptions: StackNavigationOptions = {
  headerShown: false,
  cardStyleInterpolator: slideFade,
};

/**
 * Dedicated stack for onboarding and authentication flow.
 */
export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator initialRouteName="Onboarding" screenOptions={screenOptions}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
