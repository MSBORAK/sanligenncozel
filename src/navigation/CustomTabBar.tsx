import React from 'react';
import { View, StyleSheet } from 'react-native';
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

const CustomTabBar = ({ activeIndex, onTabPress, tabNames }: CustomTabBarProps) => {
  return (
    <View style={styles.container}>
      <BlurView intensity={90} tint="dark" style={styles.blurView}>
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
              <View style={[styles.iconContainer, isFocused ? styles.iconFocused : {}]}>
                <Icon color={isFocused ? Colors.primary.indigo : '#9ca3af'} size={28} />
              </View>
            </AnimatedPressable>
          );
        })}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  blurView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  iconFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 30,
    overflow: 'hidden',
  },
});

export default CustomTabBar;
