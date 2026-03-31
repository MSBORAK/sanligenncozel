import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETED_KEY = 'onboarding_completed_v1';

export const markOnboardingCompleted = async () => {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
};

export const hasCompletedOnboarding = async () => {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return value === 'true';
};
