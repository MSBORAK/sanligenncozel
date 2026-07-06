import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizonal, Bot, Bus, Percent, Calendar, MapPin, BookOpen, Map as MapIcon, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Clean } from '@/constants/Colors';
import { cardOuterShadow, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { FontFamily } from '@/constants/Typography';
import { MOCK_MESSAGES } from '@/api/mockData';
import { ChatMessage } from '@/types';
import { useThemeMode } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

// Gemini çağrısı client'ta değil, Supabase Edge Function (gemini-proxy) üzerinden
// yapılıyor — API key ve sistem talimatı sunucu tarafında tutulur, client'a hiç gömülmez.

const QUICK_ACTIONS = [
  { id: 'bus', label: 'Otobüs Saatleri', icon: Bus, text: 'Otobüs saatlerini öğrenmek istiyorum.', accent: false },
  { id: 'discounts', label: 'Öğrenci İndirimleri', icon: Percent, text: 'Genç Kart ile nerelerde indirim var?', accent: true },
  { id: 'events', label: 'Bugünkü Etkinlikler', icon: Calendar, text: 'Bugün veya yakında hangi etkinlikler var?', accent: false },
  { id: 'pharmacy', label: 'Yakınımdaki Eczane', icon: MapPin, text: 'Nöbetçi eczaneleri gösterir misin?', accent: false },
  { id: 'library', label: 'Kütüphaneler', icon: BookOpen, text: 'Şanlıurfa\'da hangi kütüphaneler var?', accent: false },
  { id: 'cultural', label: 'Gezilecek Yerler', icon: MapIcon, text: 'Şanlıurfa\'da hangi kültürel rotalar var?', accent: false },
];

const CHAT_QUICK_CHIPS = [
  { id: 'weather', label: 'Bugün hava nasıl?', text: 'Bugün hava nasıl?' },
  { id: 'lib2', label: 'En yakın kütüphane', text: 'En yakın kütüphane neresi?' },
  { id: 'genc', label: 'Gençlik merkezi', text: 'Gençlik merkezi hakkında bilgi ver.' },
];

const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_MARGIN = 24;
const TYPING_DELAY_MS = 900;
const ASSISTANT_QUOTA_KEY = 'sanliasistan_quota_v1';
const DAILY_LIMIT = 40;
const PER_MINUTE_LIMIT = 8;

const AssistantScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const tabBarLift = Math.max(TAB_BAR_BOTTOM_MARGIN, insets.bottom + 8);
  const pageBottomMargin = tabBarLift + TAB_BAR_HEIGHT + 14;

  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES.slice());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingDots, setTypingDots] = useState('.');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'ready' | 'error'>('ready');
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

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

  useEffect(() => {
    if (!isTyping) {
      setTypingDots('.');
      return;
    }
    const interval = setInterval(() => {
      setTypingDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
    }, 350);
    return () => clearInterval(interval);
  }, [isTyping]);

  const scrollToEnd = () => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  const addSystemBotMessage = (text: string) => {
    setMessages(prev => [...prev, { id: `${Date.now()}-bot-system`, sender: 'bot', text, timestamp: '' }]);
    scrollToEnd();
  };

  const consumeQuota = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
    const now = Date.now();
    const dayKey = new Date(now).toISOString().slice(0, 10);
    const minuteSlot = Math.floor(now / 60000);

    try {
      const raw = await AsyncStorage.getItem(ASSISTANT_QUOTA_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const day = parsed.day === dayKey ? parsed.day : dayKey;
      const dailyCount = parsed.day === dayKey ? Number(parsed.dailyCount ?? 0) : 0;
      const minuteCount = parsed.minuteSlot === minuteSlot ? Number(parsed.minuteCount ?? 0) : 0;

      if (dailyCount >= DAILY_LIMIT) {
        return { ok: false, message: 'Bugünlük mesaj limitine ulaştın. Yarın tekrar dene.' };
      }
      if (minuteCount >= PER_MINUTE_LIMIT) {
        return { ok: false, message: 'Çok hızlı gidiyoruz. Lütfen 1 dakika sonra tekrar dene.' };
      }

      await AsyncStorage.setItem(
        ASSISTANT_QUOTA_KEY,
        JSON.stringify({ day, dailyCount: dailyCount + 1, minuteSlot, minuteCount: minuteCount + 1 })
      );
      return { ok: true };
    } catch {
      return { ok: true };
    }
  };

  const getGeminiReply = async (userText: string): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-proxy', { body: { text: userText } });

      if (error) {
        setConnectionStatus('error');
        return 'Şu an yanıt veremiyorum, lütfen biraz sonra tekrar dene.';
      }
      if (data?.error) {
        if (String(data.error).includes('429')) {
          return 'Yoğunluk var, lütfen 30 saniye sonra tekrar dene.';
        }
        return 'Bir hata oluştu.';
      }
      if (!data?.reply) {
        return 'Cevap alınamadı.';
      }
      setConnectionStatus('ready');
      return data.reply;
    } catch {
      setConnectionStatus('error');
      return 'İnternet bağlantısında sorun var.';
    }
  };

  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const quota = await consumeQuota();
    if (!quota.ok) {
      addSystemBotMessage(quota.message);
      return;
    }

    setMessages(prev => [...prev, { id: `${Date.now()}-user`, sender: 'user', text: trimmed, timestamp: '' }]);
    setInputText('');
    setIsTyping(true);
    scrollToEnd();

    setTimeout(async () => {
      const geminiReply = await getGeminiReply(trimmed);
      setMessages(prev => [...prev, { id: `${Date.now()}-bot`, sender: 'bot', text: geminiReply, timestamp: '' }]);
      setIsTyping(false);
      scrollToEnd();
    }, TYPING_DELAY_MS);
  };

  const pageBg  = isDark ? '#0C0C0E' : Clean.bgSoft;
  const cardBg  = isDark ? '#18181B' : Clean.surface;
  const cardBdr = isDark ? 'rgba(255,255,255,0.08)' : Clean.border;
  const txt1    = isDark ? '#F5F5F7' : Clean.textPrimary;
  const txt2    = isDark ? 'rgba(245,245,247,0.55)' : Clean.textSecondary;
  const ctaBg   = isDark ? '#F5F5F7' : Clean.ctaBg;
  const ctaTxt  = isDark ? '#111114' : Clean.ctaText;
  const chipBg  = isDark ? '#1F1F23' : Clean.chipBg;
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const hasMessages = messages.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* ── HERO ── */}
      <View style={[styles.hero, { paddingTop: insets.top + 18, backgroundColor: pageBg }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={[styles.heroLabel, { color: txt2 }]}>ŞANLI ASİSTAN</Text>
            <Text style={[styles.heroTitle, { color: txt1 }]}>Urfa'ya dair{'\n'}ne varsa sor.</Text>
          </View>
          <View style={[styles.heroIconWrap, { backgroundColor: txt1 }]}>
            <Bot color={pageBg} size={22} strokeWidth={1.8} />
          </View>
        </View>
        <View style={[styles.heroPill, { backgroundColor: chipBg, borderColor: cardBdr }]}>
          <View style={[styles.statusDot, { backgroundColor: connectionStatus === 'error' ? '#EF4444' : '#22C55E' }]} />
          <Text style={[styles.heroPillTxt, { color: txt1 }]}>
            {connectionStatus === 'error' ? 'Bağlantı sorunu' : 'Çevrimiçi'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={{ flex: 1, backgroundColor: pageBg }}
      >
        {/* Sohbet başladıktan sonra: kısa öneri çipleri */}
        {hasMessages && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={{ backgroundColor: pageBg, flexGrow: 0 }}
            contentContainerStyle={styles.quickStartContainer}
          >
            {CHAT_QUICK_CHIPS.map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={[styles.quickStartChip, styles.softShadow, { backgroundColor: cardBg, borderColor: cardBdr }]}
                onPress={() => { void sendUserMessage(chip.text); }}
                activeOpacity={0.88}
              >
                <Text style={[styles.quickStartText, { color: txt1 }]}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1, backgroundColor: pageBg }}
          contentContainerStyle={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
        >
          {!hasMessages && (
            <View>
              <View style={[styles.welcomeCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
                <View style={[styles.welcomeAvatarRing, { borderColor: cardBdr }]}>
                  <View style={[styles.welcomeAvatar, { backgroundColor: txt1 }]}>
                    <Bot color={pageBg} size={28} strokeWidth={1.6} />
                  </View>
                </View>
                <Text style={[styles.welcomeTitle, { color: txt1 }]}>
                  Şanlıurfa'da ihtiyacın olan her konuda buradayım.
                </Text>
                <Text style={[styles.welcomeSub, { color: txt2 }]}>
                  Ulaşım, etkinlikler, indirimler, eczaneler, kütüphaneler ve daha fazlası için sorunu sor, hemen yardımcı olayım.
                </Text>
              </View>

              <Text style={[styles.popularLabel, { color: txt1 }]}>Popüler Sorular</Text>
              <View style={styles.quickGrid}>
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={[styles.quickCard, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}
                      onPress={() => { void sendUserMessage(action.text); }}
                      activeOpacity={0.88}
                    >
                      {action.accent && (
                        <View style={[styles.featuredBadge, { backgroundColor: txt1 }]}>
                          <Sparkles color={pageBg} size={10} strokeWidth={2.4} />
                        </View>
                      )}
                      <View style={[styles.quickCardIcon, { backgroundColor: chipBg }]}>
                        <Icon color={txt1} size={19} strokeWidth={2} />
                      </View>
                      <Text style={[styles.quickCardTitle, { color: txt1 }]} numberOfLines={2}>{action.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {messages.map((item) => (
            <View
              key={item.id}
              style={[styles.bubbleContainer, item.sender === 'user' ? styles.userBubbleContainer : styles.botBubbleContainer]}
            >
              {item.sender === 'bot' && (
                <View style={[styles.botAvatar, { backgroundColor: chipBg }]}>
                  <Bot color={txt1} size={18} />
                </View>
              )}
              {item.sender === 'user' ? (
                <View style={[styles.bubble, styles.userBubble, { backgroundColor: ctaBg }]}>
                  <Text style={[styles.userBubbleText, { color: ctaTxt }]}>{item.text}</Text>
                </View>
              ) : (
                <View style={[styles.bubble, styles.botBubble, styles.softShadow, { backgroundColor: cardBg, borderColor: cardBdr }]}>
                  <Text style={[styles.botBubbleText, { color: txt1 }]}>{item.text}</Text>
                </View>
              )}
            </View>
          ))}

          {isTyping && (
            <View style={[styles.bubbleContainer, styles.botBubbleContainer]}>
              <View style={[styles.botAvatar, { backgroundColor: chipBg }]}>
                <Bot color={txt1} size={18} />
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble, { backgroundColor: cardBg, borderColor: cardBdr }]}>
                <Text style={[styles.typingText, { color: txt1 }]}>{typingDots}</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input — tab bar'ın üstünde sabit */}
        <View style={{ backgroundColor: pageBg, borderTopWidth: 1, borderTopColor: cardBdr }}>
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Mesajını buraya yaz..."
              style={[styles.input, { backgroundColor: cardBg, borderColor: cardBdr, color: txt1 }]}
              placeholderTextColor={txt2}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => { void sendUserMessage(inputText); }}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendButton, styles.softShadow, { backgroundColor: ctaBg }]}
              onPress={() => { void sendUserMessage(inputText); }}
              activeOpacity={0.9}
            >
              <SendHorizonal color={ctaTxt} size={20} />
            </TouchableOpacity>
          </View>
          {/* Tab bar boşluğu — klavye açıkken gerekmiyor */}
          <View style={{ height: keyboardVisible ? Math.max(insets.bottom, 8) : pageBottomMargin }} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroPillTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  welcomeCard: {
    alignItems: 'center',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginBottom: 22,
  },
  welcomeAvatarRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  welcomeSub: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 10,
  },
  popularLabel: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  quickCard: {
    width: '31.5%',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    position: 'relative',
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  quickStartContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    alignItems: 'center',
  },
  quickStartChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  quickStartText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chatContainer: {
    paddingHorizontal: 15,
    paddingTop: 6,
    paddingBottom: 16,
  },
  bubbleContainer: {
    marginVertical: 8,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userBubbleContainer: {
    alignSelf: 'flex-end',
  },
  botBubbleContainer: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  botBubble: {
    borderBottomLeftRadius: 6,
    borderWidth: 1,
  },
  softShadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubbleText: {
    fontFamily: FontFamily.medium,
    fontSize: 15.5,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  botBubbleText: {
    fontFamily: FontFamily.regular,
    fontSize: 15.5,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  typingBubble: {
    minWidth: 50,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 16,
    borderWidth: 1,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AssistantScreen;
