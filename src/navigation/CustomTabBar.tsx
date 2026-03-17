import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Bus, QrCode, MessageSquare, User } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';
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
  const tabBarWidth = screenWidth - HORIZONTAL_MARGIN * 2;
  const tabWidth = tabBarWidth / tabNames.length;
  const bottomOffset = Math.max(BOTTOM_MARGIN, insets.bottom + 8);

  const indicatorAnim = useRef(new Animated.Value(activeIndex * tabWidth)).current;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();
  }, [activeIndex, tabWidth]);

  return (
    <View style={[styles.container, { width: tabBarWidth, bottom: bottomOffset }]}>
      <BlurView intensity={70} tint="dark" style={styles.blurView}>
        <View style={styles.tabsRow}>
          {tabNames.map((tabName, index) => {
            const isFocused = activeIndex === index;
            const Icon = ICONS[tabName];

            const onPress = () => {
              if (!isFocused) {
                onTabPress(index);
              }
            };

            return (
              <AnimatedPressable
                key={tabName}
                onPress={onPress}
                style={styles.tabButton}
                scaleTo={0.9}
              >
                <Icon
                  color={isFocused ? Colors.primaryHex : Colors.textHighlight}
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
  blurView: {
    flex: 1,
    borderRadius: 36,
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
    backgroundColor: Colors.primaryHex,
  },
});

export default CustomTabBar;
