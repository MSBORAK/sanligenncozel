import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bus, QrCode, MessageSquare, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors, DribbbleColors } from '@/constants/Colors';
import { useThemeMode } from '@/context/ThemeContext';
import AnimatedPressable from '@/components/AnimatedPressable';

const ICONS = {
  Home,
  Transport: Bus,
  GencKart: QrCode,
  Assistant: MessageSquare,
  Profile: User,
};

type TabName = 'Home' | 'Transport' | 'GencKart' | 'Assistant' | 'Profile';

interface CustomTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  tabNames: readonly TabName[];
}

const HORIZONTAL_MARGIN = 24;
const BOTTOM_MARGIN = 24;
const TAB_BAR_HEIGHT = 72;
const INDICATOR_WIDTH = 28;
const INDICATOR_HEIGHT = 4;

const CustomTabBar = ({ activeIndex, onTabPress, tabNames }: CustomTabBarProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const tabBarWidth = screenWidth - HORIZONTAL_MARGIN * 2;
  const tabWidth = tabBarWidth / tabNames.length;
  const bottomOffset = Math.max(BOTTOM_MARGIN, insets.bottom + 8);

  const indicatorAnim = useRef(new Animated.Value(activeIndex * tabWidth)).current;

  const TAB_COLORS: Record<TabName, string> = {
    Home:      '#3b82f6', // mavi
    Transport: '#f472b6', // pembe
    GencKart:  '#f59e0b', // sarı
    Assistant: '#10b981', // yeşil
    Profile:   '#8b5cf6', // mor
  };

  const activeColor = isDark ? Colors.primaryHex : TAB_COLORS[tabNames[activeIndex]];
  const inactiveColor = isDark ? Colors.textHighlight : DribbbleColors.textSecondary;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View style={[
      styles.container,
      { width: tabBarWidth, bottom: bottomOffset },
      !isDark && styles.containerLight,
    ]}>
      <BlurView intensity={isDark ? 70 : 80} tint={isDark ? 'dark' : 'light'} style={styles.blurView}>
        <View style={styles.tabsRow}>
          {tabNames.map((tabName, index) => {
            const isFocused = activeIndex === index;
            const Icon = ICONS[tabName];

            const onPress = () => {
              if (!isFocused) {
                onTabPress(index);
              }
            };

            const iconColor = isFocused
              ? (isDark ? Colors.primaryHex : TAB_COLORS[tabName])
              : inactiveColor;

            return (
              <AnimatedPressable
                key={tabName}
                onPress={onPress}
                style={styles.tabButton}
                scaleTo={0.9}
              >
                <Icon
                  color={iconColor}
                  size={26}
                />
              </AnimatedPressable>
            );
          })}
        </View>
        {/* Sliding indicator - pill at bottom */}
        <View style={styles.indicatorTrack}>
          <Animated.View
            style={[
              styles.indicator,
              { backgroundColor: activeColor },
              {
                width: INDICATOR_WIDTH,
                left: (tabWidth - INDICATOR_WIDTH) / 2,
                transform: [{ translateX: indicatorAnim }],
              },
            ]}
          />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: HORIZONTAL_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  containerLight: {
    borderColor: 'rgba(255,255,255,0.6)',
    ...Platform.select({
      ios: {
        shadowColor: '#1e293b',
        shadowOpacity: 0.08,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  blurView: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  indicatorTrack: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    height: INDICATOR_HEIGHT,
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
  },
});

export default CustomTabBar;
