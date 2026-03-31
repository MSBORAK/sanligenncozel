import React, { useEffect } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, useWindowDimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useThemeMode } from '@/context/ThemeContext';
import {
  Bell,
  Bus,
  Camera,
  Home,
  MessageSquare,
  QrCode,
  User,
} from 'lucide-react-native';

const ICONS = {
  Home,
  Notifications: Bell,
  Camera,
  Transport: Bus,
  GencKart: QrCode,
  Assistant: MessageSquare,
  Profile: User,
};

const TAB_ACTIVE_COLORS: Record<string, string> = {
  Home: '#3b82f6',
  Transport: '#f472b6',
  GencKart: '#f59e0b',
  Assistant: '#10b981',
  Profile: '#8b5cf6',
  Notifications: '#ef4444',
  Camera: '#0ea5e9',
};

type TabName =
  | 'Home'
  | 'Notifications'
  | 'Camera'
  | 'Transport'
  | 'GencKart'
  | 'Assistant'
  | 'Profile';

interface LegacyTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  tabNames: readonly TabName[];
}

type CustomTabBarProps = LegacyTabBarProps | BottomTabBarProps;

const HORIZONTAL_MARGIN = 48;
const BOTTOM_MARGIN = 20;
const TAB_BAR_HEIGHT = 66;
const TAB_CONTENT_INSET = 16;

const isLegacyProps = (props: CustomTabBarProps): props is LegacyTabBarProps =>
  'tabNames' in props && 'activeIndex' in props;

const resolveIcon = (name: string) => {
  if (name in ICONS) return ICONS[name as TabName];
  const lower = name.toLowerCase();
  if (lower.includes('home')) return Home;
  if (lower.includes('profile')) return User;
  if (lower.includes('notification')) return Bell;
  if (lower.includes('camera')) return Camera;
  return Home;
};

const withOpacity = (hexColor: string, opacity: number) => {
  if (!hexColor.startsWith('#')) return hexColor;
  let hex = hexColor.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map(char => char + char)
      .join('');
  }
  if (hex.length !== 6) return hexColor;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${opacity})`;
};

const CustomTabBar = (props: CustomTabBarProps) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const isLegacy = isLegacyProps(props);
  const tabNames = isLegacy
    ? props.tabNames
    : (props.state.routes.map(route => route.name) as readonly TabName[]);
  const activeIndex = isLegacy ? props.activeIndex : props.state.index;
  const onTabPress = isLegacy
    ? props.onTabPress
    : (index: number) => {
        const route = props.state.routes[index];
        const event = props.navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) {
          props.navigation.navigate(route.name);
        }
      };

  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tabBarWidth = screenWidth - HORIZONTAL_MARGIN * 2;
  const contentWidth = tabBarWidth - TAB_CONTENT_INSET * 2;
  const tabWidth = contentWidth / tabNames.length;
  const bottomOffset = Math.max(BOTTOM_MARGIN, insets.bottom + 8);
  const indicatorX = React.useRef(new Animated.Value(activeIndex * tabWidth)).current;
  const activeTabName = tabNames[activeIndex];
  const activeTabColor = TAB_ACTIVE_COLORS[activeTabName] || '#f3f4f6';

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 20,
      stiffness: 260,
      mass: 0.7,
    }).start();
  }, [activeIndex, tabWidth, indicatorX]);

  const renderTab = (tabName: string, index: number) => {
    const Icon = resolveIcon(tabName);
    return (
      <TabIconButton
        key={tabName}
        tabName={tabName}
        Icon={Icon}
        index={index}
        isFocused={activeIndex === index}
        onPress={onTabPress}
        tabWidth={tabWidth}
        activeColor={TAB_ACTIVE_COLORS[tabName] || '#f3f4f6'}
        isDark={isDark}
      />
    );
  };

  return (
    <View
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight,
        { width: tabBarWidth, bottom: bottomOffset },
      ]}
    >
      <BlurView intensity={isDark ? 35 : 55} tint={isDark ? 'dark' : 'light'} style={styles.blurFill}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeSpotWrap,
            {
              width: tabWidth,
              transform: [{ translateX: Animated.add(indicatorX, new Animated.Value(TAB_CONTENT_INSET)) }],
            },
          ]}
        >
          <View
            style={[
              styles.spotTopBar,
              {
                backgroundColor: withOpacity(activeTabColor, 0.95),
                shadowColor: activeTabColor,
              },
            ]}
          />
          <View
            style={[
              styles.spotBeamSoft,
              {
                borderBottomColor: withOpacity(activeTabColor, 0.22),
              },
            ]}
          />
        </Animated.View>
        <View style={styles.tabsRow}>{tabNames.map(renderTab)}</View>
      </BlurView>
    </View>
  );
};

const TabIconButton = ({
  tabName,
  Icon,
  index,
  isFocused,
  onPress,
  tabWidth,
  activeColor,
  isDark,
}: {
  tabName: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  index: number;
  isFocused: boolean;
  onPress: (index: number) => void;
  tabWidth: number;
  activeColor: string;
  isDark: boolean;
}) => {
  const pressScale = React.useRef(new Animated.Value(1)).current;
  const focusOpacity = React.useRef(new Animated.Value(isFocused ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.spring(focusOpacity, {
      toValue: isFocused ? 1 : 0.9,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
  }, [isFocused, focusOpacity]);

  const iconColor = isFocused ? activeColor : isDark ? 'rgba(15,15,18,0.72)' : 'rgba(51,65,85,0.66)';

  return (
    <TouchableOpacity
      onPress={() => onPress(index)}
      onPressIn={() => {
        Animated.spring(pressScale, {
          toValue: 0.9,
          useNativeDriver: true,
          damping: 14,
          stiffness: 300,
        }).start();
      }}
      onPressOut={() => {
        Animated.spring(pressScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 260,
        }).start();
      }}
      style={[styles.tabButton, { width: tabWidth }]}
      accessibilityRole="button"
      accessibilityLabel={tabName}
      activeOpacity={0.9}
    >
      <Animated.View style={{ transform: [{ scale: pressScale }], opacity: focusOpacity }}>
        <Icon size={22} color={iconColor} strokeWidth={2.25} />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    left: HORIZONTAL_MARGIN,
    height: TAB_BAR_HEIGHT,
    borderRadius: 33,
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 14,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  containerDark: {
    backgroundColor: '#59595e',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  containerLight: {
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderColor: 'rgba(15,23,42,0.08)',
  },
  blurFill: {
    flex: 1,
  },
  activeSpotWrap: {
    position: 'absolute',
    top: 0,
    height: TAB_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  spotTopBar: {
    marginTop: 8,
    width: 24,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.88)',
    zIndex: 3,
    shadowColor: '#ffffff',
    shadowOpacity: 0.14,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  spotBeamSoft: {
    position: 'absolute',
    top: 7,
    width: 0,
    height: 0,
    borderLeftWidth: 28,
    borderRightWidth: 28,
    borderBottomWidth: 58,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'rgba(255,255,255,0.14)',
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: TAB_CONTENT_INSET,
  },
  tabButton: {
    height: TAB_BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CustomTabBar;
