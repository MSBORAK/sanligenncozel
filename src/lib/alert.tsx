import React, { useCallback, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert as NativeAlert } from 'react-native';
import { useAppTheme } from '@/theme/useAppTheme';

// =====================================================
// UYGULAMAYA ÖZEL UYARI KUTUSU
// React Native'in native Alert.alert()'ü Android'de ve iOS'ta
// birbirinden tamamen farklı görünüyor (farklı köşe yuvarlaklığı,
// buton dizilimi, tipografi). Bu modül aynı çağrı şeklini
// (başlık, mesaj, butonlar) koruyarak, HER İKİ PLATFORMDA DA
// BİREBİR AYNI görünen, markaya uygun bir kutu gösterir.
//
// Kullanım: Alert.alert(...) yerine AppAlert.alert(...) — imza aynı.
// =====================================================

export interface AppAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
}

type Listener = (state: Omit<AlertState, 'visible'>) => void;

let listener: Listener | null = null;

function alert(title: string, message?: string, buttons?: AppAlertButton[]) {
  const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: 'Tamam' }];
  if (listener) {
    listener({ title, message, buttons: finalButtons });
  } else {
    // Host henüz mount olmadıysa (ör. çok erken bir çağrı) sessizce kaybolmasın —
    // native uyarı kutusuna düşerek her zaman kullanıcıya bir şey gösterilsin.
    if (__DEV__) console.warn('AppAlert: host henüz hazır değil, native Alert\'e düşülüyor.');
    NativeAlert.alert(title, message, finalButtons as any);
  }
}

export const AppAlert = { alert };

export const AppAlertHost: React.FC = () => {
  const t = useAppTheme();
  const [state, setState] = useState<AlertState>({ visible: false, title: '', buttons: [] });

  React.useEffect(() => {
    listener = (next) => setState({ ...next, visible: true });
    return () => { listener = null; };
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, visible: false })), []);

  const handlePress = useCallback((btn: AppAlertButton) => {
    close();
    // onPress'i kapanış animasyonu başladıktan hemen sonra çalıştır
    setTimeout(() => btn.onPress?.(), 0);
  }, [close]);

  const isSingleButton = state.buttons.length === 1;

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        const cancelBtn = state.buttons.find((b) => b.style === 'cancel');
        handlePress(cancelBtn || state.buttons[0]);
      }}
    >
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: t.cardBg, borderColor: t.cardBdr }]}>
          <Text style={[styles.title, { color: t.txt1 }]}>{state.title}</Text>
          {!!state.message && (
            <Text style={[styles.message, { color: t.txt2 }]}>{state.message}</Text>
          )}

          <View style={[styles.buttonRow, isSingleButton && styles.buttonRowSingle]}>
            {state.buttons.map((btn, i) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => handlePress(btn)}
                  style={[
                    styles.button,
                    isSingleButton && styles.buttonSingle,
                    {
                      backgroundColor: isDestructive ? '#ef4444' : isCancel ? t.chipBg : t.ctaBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: isDestructive ? '#fff' : isCancel ? t.txt1 : t.ctaTxt },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  buttonRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  buttonRowSingle: {
    marginTop: 4,
  },
  button: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSingle: {
    width: '100%',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
