import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

type Props = TextInputProps & {
  icon: LucideIcon;
};

const InputField: React.FC<Props> = ({ icon: Icon, ...props }) => {
  const [focused, setFocused] = useState(false);
  const glow = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(glow, {
        toValue: focused ? 1 : 0,
        duration: 180,
        useNativeDriver: false,
      }),
      Animated.spring(scale, {
        toValue: focused ? 1.02 : 1,
        speed: 28,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, glow, scale]);

  const borderColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,255,255,0.42)', 'rgba(120,183,255,0.98)'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          transform: [{ scale }],
          borderColor,
          shadowOpacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.45] }),
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon size={18} color="#F1F4FF" strokeWidth={2.2} />
      </View>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="rgba(242, 246, 255, 0.82)"
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#7BAEFF',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 14,
  },
  iconWrap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InputField;
