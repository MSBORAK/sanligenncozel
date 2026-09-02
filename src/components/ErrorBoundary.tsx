import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clean } from '@/constants/Colors';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Beklenmeyen bir render hatasında tüm uygulamanın kırmızı/beyaz ekrana
 * düşmesini önler; kullanıcıya "tekrar dene" seçeneği olan sade bir ekran gösterir.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    if (__DEV__) {
      console.error('ErrorBoundary yakaladı:', error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.desc}>
            Beklenmedik bir hata oluştu. Tekrar denemek uygulamayı düzeltebilir.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={this.handleRetry} activeOpacity={0.85}>
            <Text style={styles.btnText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Clean.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Clean.textPrimary,
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: Clean.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  btn: {
    height: 52,
    paddingHorizontal: 28,
    borderRadius: 14,
    backgroundColor: Clean.ctaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: Clean.ctaText,
    fontWeight: '800',
    fontSize: 15,
  },
});
