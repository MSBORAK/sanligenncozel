import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETED_KEY = 'onboarding_completed_v1';

export const markOnboardingCompleted = async () => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
  } catch (e) {
    // Yazma başarısız olursa onboarding bir dahaki açılışta tekrar gösterilir — akışı bozmaz
  }
};

export const hasCompletedOnboarding = async () => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch (e) {
    return false;
  }
};
