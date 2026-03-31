import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import GradientBackground from './GradientBackground';
import PrimaryButton from './PrimaryButton';

type Props = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  onPressButton: () => void;
  bottomText?: string;
  onPressBottomText?: () => void;
  illustration: React.ReactNode;
};

const OnboardingScaffold: React.FC<Props> = ({
  title,
  subtitle,
  buttonLabel,
  onPressButton,
  bottomText,
  onPressBottomText,
  illustration,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <GradientBackground>
      <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
        <View style={styles.illustrationWrap}>{illustration}</View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <PrimaryButton label={buttonLabel} onPress={onPressButton} style={styles.button} />
        {bottomText ? (
          <Pressable onPress={onPressBottomText} style={styles.bottomPress}>
            <Text style={styles.bottomText}>{bottomText}</Text>
          </Pressable>
        ) : null}
      </Animated.View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(72, 57, 132, 0.26)',
    textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    fontSize: 17,
    color: 'rgba(244, 246, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 25,
    marginBottom: 30,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginTop: 2,
  },
  bottomPress: {
    marginTop: 18,
    paddingVertical: 8,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default OnboardingScaffold;
