import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Keyboard, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import {
  Bell,
  Bus,
  Camera,
  Grid3X3,
  Home,
  MessageSquare,
  QrCode,
  User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';
import { Editorial } from '@/theme/colors';
import { useThemeMode } from '@/context/ThemeContext';

const ICONS = {
  Home,
  Notifications: Bell,
  Camera,
  Transport: Bus,
  GencKart: QrCode,
  HizliErisim: Grid3X3,
  Assistant: MessageSquare,
  Profile: User,
};

const TAB_LABEL_KEYS: Record<string, string> = {
  Home: 'tabBar.home',
  Transport: 'tabBar.transport',
  GencKart: 'tabBar.gencKart',
  HizliErisim: 'tabBar.hizliErisim',
  Assistant: 'tabBar.assistant',
  Profile: 'tabBar.profile',
  Notifications: 'tabBar.notifications',
  Camera: 'tabBar.camera',
};

type TabName =
  | 'Home'
  | 'Notifications'
  | 'Camera'
  | 'Transport'
  | 'GencKart'
  | 'HizliErisim'
  | 'Assistant'
  | 'Profile';

interface LegacyTabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
  tabNames: readonly TabName[];
}

type CustomTabBarProps = LegacyTabBarProps | BottomTabBarProps;

const HORIZONTAL_MARGIN = 56;
const BOTTOM_MARGIN = 20;
const BAR_HEIGHT = 56;
const BUMP_EXTRA = 18;      // dalganın barın üstüne taştığı alan
const BUBBLE_SIZE = 42;
const NOTCH_RADIUS = 13;    // kenar sekmelerde bile kaymadan sığması için küçük tutuldu
const CORNER_RADIUS = 28;   // BAR_HEIGHT/2'ye yakın — tam oval/pill görünüm

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

/** Dalgalı (wave) bar path'i — aktif sekmenin üstünde hareketli kabarcık oluşturur */
const buildBarPath = (width: number, bumpCenterX: number) => {
  const T = BUMP_EXTRA;
  const B = BUMP_EXTRA + BAR_HEIGHT;
  const R = CORNER_RADIUS;

  return [
    `M ${R} ${T}`,
    `L ${width - R} ${T}`,
    `Q ${width} ${T} ${width} ${T + R}`,
    `L ${width} ${B - R}`,
    `Q ${width} ${B} ${width - R} ${B}`,
    `L ${R} ${B}`,
    `Q 0 ${B} 0 ${B - R}`,
    `L 0 ${T + R}`,
    `Q 0 ${T} ${R} ${T}`,
    `Z`,
  ].join(' ');
};

const CustomTabBar = (props: CustomTabBarProps) => {
  const theme = useAppTheme();
  const { mode } = useThemeMode();
  const isInverse = mode === 'inverse';
  const isDarkMode = mode === 'dark';
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
  const tabWidth = tabBarWidth / tabNames.length;
  const bottomOffset = Math.max(BOTTOM_MARGIN, insets.bottom + 8);

  // Klavye açıkken yüzen tab bar input'un/klavyenin üstüne biniyordu (özellikle Android) —
  // klavye görünürken tab bar'ı tamamen gizleyip alanı boşaltıyoruz.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const bumpCenterOf = (index: number) => index * tabWidth + tabWidth / 2;

  // Dalganın merkezi — aktif sekmeye doğru spring ile kayar
  const bumpX = useSharedValue(bumpCenterOf(activeIndex));
  const [pathD, setPathD] = useState(() => buildBarPath(tabBarWidth, bumpCenterOf(activeIndex)));

  useEffect(() => {
    bumpX.value = withSpring(bumpCenterOf(activeIndex), { damping: 15, stiffness: 150, mass: 0.9 });
  }, [activeIndex, tabWidth]);

  // buildBarPath JS-thread'de çalışmalı — worklet (UI-thread) içinden doğrudan
  // çağrılırsa native crash'e yol açar, bu yüzden hesaplamayı runOnJS'in
  // ÇAĞIRDIĞI fonksiyonun İÇİNE alıyoruz.
  const updatePath = (value: number) => {
    setPathD(buildBarPath(tabBarWidth, value));
  };

  useAnimatedReaction(
    () => bumpX.value,
    (value) => {
      runOnJS(updatePath)(value);
    },
  );

  if (keyboardVisible) return null;

  return (
    <View
      style={[
        styles.container,
        { width: tabBarWidth, bottom: bottomOffset, height: BAR_HEIGHT + BUMP_EXTRA },
      ]}
      pointerEvents="box-none"
    >
      {/* Gölgeyi taşıyan opak katman — SVG'nin kendisi gölge vermez */}
      <View style={[
        styles.barShadow,
        { top: BUMP_EXTRA, height: BAR_HEIGHT },
        (isDarkMode || isInverse) && {
          backgroundColor: Editorial.bg,
          borderColor: Editorial.borderSoft,
          shadowColor: Editorial.coffee,
        },
        isInverse && {
          backgroundColor: '#0A0A0C',
          borderColor: 'rgba(255,255,255,0.2)',
          shadowColor: '#000000',
        },
      ]} />

      <Svg width={tabBarWidth} height={BAR_HEIGHT + BUMP_EXTRA} style={StyleSheet.absoluteFill}>
        <Path
          d={pathD}
          fill={isInverse ? '#0A0A0C' : isDarkMode ? Editorial.bg : '#FFFFFF'}
          stroke={isInverse ? 'rgba(255,255,255,0.2)' : isDarkMode ? Editorial.borderSoft : 'rgba(17,17,20,0.12)'}
          strokeWidth={1.1}
        />
      </Svg>

      <View style={[styles.tabsRow, { top: BUMP_EXTRA, width: tabBarWidth }]} pointerEvents="box-none">
        {tabNames.map((name, index) => (
          <TabItem
            key={name}
            name={name}
            Icon={resolveIcon(name)}
            isFocused={activeIndex === index}
            onPress={() => onTabPress(index)}
            isDark={isDarkMode || isInverse}
            isInverse={isInverse}
          />
        ))}
      </View>
    </View>
  );
};

const TabItem = ({
  name,
  Icon,
  isFocused,
  onPress,
  isDark,
  isInverse,
}: {
  name: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  isFocused: boolean;
  onPress: () => void;
  isDark: boolean;
  isInverse: boolean;
}) => {
  const { t } = useTranslation();
  const pressScale = useSharedValue(1);
  const bump = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    bump.value = withSpring(isFocused ? 1 : 0, { damping: 13, stiffness: 220, mass: 0.8 });
  }, [isFocused]);

  const passiveStyle = useAnimatedStyle(() => ({
    opacity: 1 - bump.value,
  }));

  const bubbleStyle = useAnimatedStyle(() => ({
    opacity: bump.value,
    transform: [
      { translateY: -bump.value * 20 },
      { scale: (0.3 + bump.value * 0.7) * pressScale.value },
    ],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { pressScale.value = withSpring(0.92, { damping: 14, stiffness: 300 }); }}
      onPressOut={() => { pressScale.value = withSpring(1, { damping: 14, stiffness: 260 }); }}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityLabel={name}
    >
      {/* Pasif hâl — gri ikon + etiket */}
      <Animated.View style={[styles.tabInner, passiveStyle]} pointerEvents="none">
        <Icon size={20} color={isInverse ? 'rgba(255,255,255,0.6)' : isDark ? 'rgba(58,42,26,0.45)' : 'rgba(17,17,20,0.45)'} strokeWidth={2} />
        <Text numberOfLines={1} style={[styles.tabLabel, isDark && { color: 'rgba(58,42,26,0.45)' }, isInverse && { color: 'rgba(255,255,255,0.6)' }]}>{TAB_LABEL_KEYS[name] ? t(TAB_LABEL_KEYS[name]) : name}</Text>
      </Animated.View>

      {/* Aktif hâl — yükselen kabarcık */}
      <Animated.View pointerEvents="none" style={[
        styles.bubble,
        bubbleStyle,
        isDark && {
          backgroundColor: Editorial.coffee,
          shadowColor: Editorial.coffee,
        },
        isInverse && {
          backgroundColor: '#FFFFFF',
          shadowColor: '#000000',
        },
      ]}>
        <Icon size={22} color={isInverse ? '#111114' : isDark ? '#FFF8EA' : '#FFFFFF'} strokeWidth={2.25} />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: HORIZONTAL_MARGIN,
  },
  barShadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: CORNER_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(17,17,20,0.12)',
    shadowColor: '#111114',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  tabsRow: {
    position: 'absolute',
    height: BAR_HEIGHT,
    flexDirection: 'row',
  },
  tabButton: {
    flex: 1,
    height: BAR_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  tabInner: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(17,17,20,0.45)',
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#111114',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#111114',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
});

export default CustomTabBar;
