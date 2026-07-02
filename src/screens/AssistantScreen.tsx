import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizonal, Bot, Activity } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, DribbbleColors, Gradients } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';
import { MOCK_MESSAGES } from '@/api/mockData';
import { ChatMessage } from '@/types';
import { useThemeMode } from '@/context/ThemeContext';

// 🔑 Ortam değişkeninden al (.env dosyasında EXPO_PUBLIC_GOOGLE_AI_KEY)
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_AI_KEY ?? '';

// 🤖 [ÖNEMLİ] YAPAY ZEKANIN KURALLARI BURAYA YAZILIR
// Burayı dilediğin gibi değiştirebilirsin.
const SYSTEM_PROMPT = `
Sen "ŞanlıAsistan" adında yardımcı bir yapay zekasın.
GÖREVLERİN:
1. Sadece Şanlıurfa şehri, otobüs saatleri, öğrenci indirimleri ve yerel etkinlikler hakkında bilgi vermek.
2. Kullanıcı bu konuların DIŞINDA bir şey sorarsa (örneğin: matematik sorusu, yemek tarifi, siyaset, dünya gündemi vb.) kibarca "Ben sadece Şanlıurfa ve ulaşım konularında yardımcı olabilirim." diyerek reddetmek.
3. Cevapların her zaman kısa, net ve samimi olsun.
4. Asla kod yazma veya teknik konularda destek verme.
`;

const QUICK_ACTIONS = [
  {
    id: 'bus',
    label: '📍 Otobüs Saatleri',
    text: 'Otobüs saatlerini öğrenmek istiyorum.',
  },
  {
    id: 'discounts',
    label: '🎫 İndirimler',
    text: 'Genç Kart ile nerelerde indirim var?',
  },
  {
    id: 'events',
    label: '🎉 Etkinlikler',
    text: 'Bugün veya yakında hangi etkinlikler var?',
  },
  {
    id: 'calendar',
    label: '📅 Takvim',
    text: 'Bu ay hangi özel günler var?',
  },
  {
    id: 'library',
    label: '📚 Kütüphaneler',
    text: 'Şanlıurfa\'da hangi kütüphaneler var?',
  },
  {
    id: 'pharmacy',
    label: '💊 Nöbetçi Eczane',
    text: 'Nöbetçi eczaneleri gösterir misin?',
  },
  {
    id: 'cultural',
    label: '🗺️ Kültürel Rotalar',
    text: 'Şanlıurfa\'da hangi kültürel rotalar var?',
  },
  {
    id: 'cafe',
    label: '☕ Kafeler',
    text: 'Genç Kart geçerli kafeler hangileri?',
  },
  {
    id: 'cinema',
    label: '🎬 Sinemalar',
    text: 'Sinema indirimleri hakkında bilgi verir misin?',
  },
  {
    id: 'help',
    label: '❓ Yardım',
    text: 'Uygulamayı nasıl kullanabilirim?',
  },
];

const TAB_BAR_HEIGHT = 72;
const TAB_BAR_BOTTOM_MARGIN = 24;

const TYPING_DELAY_MS = 900;
const ASSISTANT_QUOTA_KEY = 'sanliasistan_quota_v1';
const DAILY_LIMIT = 40;
const PER_MINUTE_LIMIT = 8;

type MessageBubbleProps = {
  item: ChatMessage;
};

const MessageBubble: React.FC<MessageBubbleProps> = ({ item }) => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  // Balonlar her zaman görünür (opacity 1) başlar; animasyon yalnızca hafif bir kayma —
  // inverted FlatList sanallaştırmasında animasyon tamamlanmasa bile balon kaybolmaz.
  const slideAnim = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={[
          styles.bubbleContainer,
          item.sender === 'user' ? styles.userBubbleContainer : styles.botBubbleContainer,
        ]}
      >
        {item.sender === 'bot' && (
          <View style={[styles.botAvatar, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', borderWidth: 1 }]}>
            <Bot color="#8B5CF6" size={18}/>
          </View>
        )}
        {item.sender === 'user' ? (
          <LinearGradient
            colors={['#7C3AED','#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            <Text style={styles.userBubbleText}>{item.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.botBubble, isDark && { backgroundColor: 'rgba(255,255,255,0.055)', borderColor: 'rgba(255,255,255,0.09)' }]}>
            <Text style={[styles.botBubbleText, { color: isDark ? '#F9F8F6' : '#1A1208' }]}>{item.text}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const AssistantScreen = () => {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const insets = useSafeAreaInsets();
  const tabBarLift = Math.max(TAB_BAR_BOTTOM_MARGIN, insets.bottom + 8);
  const pageBottomMargin = tabBarLift + TAB_BAR_HEIGHT + 14;
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES.slice().reverse());
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingDots, setTypingDots] = useState('.');
  
  const [activeModel, setActiveModel] = useState<string>('Model Aranıyor...');
  const flatListRef = useRef<FlatList>(null);

  const addSystemBotMessage = (text: string) => {
    const botMessage: ChatMessage = {
      id: `${Date.now()}-bot-system`,
      sender: 'bot',
      text,
      timestamp: '',
    };
    setMessages(prev => [botMessage, ...prev]);
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
        return { ok: false, message: 'Bugunluk mesaj limitine ulastin. Yarini bekleyelim.' };
      }
      if (minuteCount >= PER_MINUTE_LIMIT) {
        return { ok: false, message: 'Cok hizli gidiyoruz. Lutfen 1 dakika sonra tekrar dene.' };
      }

      await AsyncStorage.setItem(
        ASSISTANT_QUOTA_KEY,
        JSON.stringify({
          day,
          dailyCount: dailyCount + 1,
          minuteSlot,
          minuteCount: minuteCount + 1,
        })
      );
      return { ok: true };
    } catch {
      // Kota depolamasi hata verirse engelleme yapma
      return { ok: true };
    }
  };

  // --- MODEL SEÇİCİ ---
  useEffect(() => {
    const checkModels = async () => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
          const chatModels = data.models
            .filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
            .map((m: any) => m.name.replace("models/", ""));

          console.log("Mevcut Modeller:", chatModels);
          
          // Ücretsiz ve güvenilir modelleri önceliklendir
          const safeModel = chatModels.find((m:string) => m.includes("gemini-1.5-flash") && !m.includes("2.5")) || 
                            chatModels.find((m:string) => m.includes("flash")) ||
                            chatModels.find((m:string) => m.includes("gemini-pro") && !m.includes("vision")) ||
                            chatModels[0];
          
          if (safeModel) {
            console.log("✅ SEÇİLEN MODEL:", safeModel);
            setActiveModel(safeModel);
          } else {
            setActiveModel(chatModels[0]); 
          }

        } else if (data.error) {
           console.error("API Error", data.error);
           setActiveModel("Hata");
        }
      } catch (error) {
        console.error(error);
        setActiveModel("Bağlantı Hatası");
      }
    };

    checkModels();
  }, []);


  const getGeminiReply = async (userText: string): Promise<string> => {
    if (activeModel === 'Model Aranıyor...' || activeModel === 'Hata') {
      return "Model bulunamadı. Lütfen bekleyin...";
    }

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${API_KEY}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 👇 BURASI YENİ EKLENDİ: SİSTEM TALİMATI
          systemInstruction: {
            parts: [
              { text: SYSTEM_PROMPT }
            ]
          },
          // ----------------------------------------
          contents: [{ parts: [{ text: userText }] }]
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("Gemini API Error:", data.error);
        if (data.error.code === 429) {
            return `Yoğunluk var, lütfen 30 saniye sonra tekrar dene.`;
        }
        return `Bir hata oluştu.`;
      }

      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
         return data.candidates[0].content.parts[0].text;
      } else {
         return "Cevap alınamadı.";
      }

    } catch (error) {
      return "İnternet bağlantısında sorun var.";
    }
  };

  const sendUserMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    if (!API_KEY) {
      addSystemBotMessage('Asistan su an hazir degil. API anahtari bulunamadi.');
      return;
    }

    const quota = await consumeQuota();
    if (!quota.ok) {
      addSystemBotMessage(quota.message);
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text: trimmed,
      timestamp: '',
    };

    setMessages(prev => [userMessage, ...prev]);
    setInputText('');
    setIsTyping(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

    const fetchBotReply = async () => {
      const geminiReply = await getGeminiReply(trimmed);
      const botMessage: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: geminiReply,
        timestamp: '',
      };
      setMessages(prev => [botMessage, ...prev]);
      setIsTyping(false);
    };

    setTimeout(fetchBotReply, TYPING_DELAY_MS);
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => (
    <MessageBubble item={item} />
  );

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

  const pageBg = isDark ? '#09070A' : '#F5F3FF';
  const cardBg = isDark ? 'rgba(255,255,255,0.055)' : '#FFFFFF';
  const cardBdr = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const txt1 = isDark ? '#F9F8F6' : '#1A1208';
  const txt2 = isDark ? 'rgba(249,248,246,0.42)' : '#6B7280';

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* ── HERO ── */}
      <LinearGradient
        colors={isDark ? ['#1E0A3C','#2D1B69','#09070A'] : ['#4C1D95','#7C3AED','#F5F3FF']}
        style={[styles.hero, { paddingTop: insets.top + 18 }]}
      >
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>ŞANLI ASİSTAN</Text>
            <Text style={styles.heroTitle}>Urfa'ya dair{'\n'}ne varsa sor.</Text>
          </View>
          <View style={styles.heroIconWrap}>
            <Bot color="#fff" size={22} strokeWidth={1.8}/>
          </View>
        </View>
        <View style={styles.heroPill}>
          <Activity size={12} color="#C4B5FD"/>
          <Text style={styles.heroPillTxt}>
            {activeModel === 'Model Aranıyor...' ? 'Model aranıyor…' : activeModel}
          </Text>
        </View>
      </LinearGradient>

        {/* Quick actions */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickStartContainer}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.quickStartChip, { backgroundColor: cardBg, borderColor: cardBdr }]}
              onPress={() => { void sendUserMessage(action.text); }}
              activeOpacity={0.88}
            >
              <Text style={[styles.quickStartText, { color: txt1 }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat + input — klavye bu bloğu iter */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.chatContainer, messages.length === 0 && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            inverted
            style={{ flex: 1 }}
            initialNumToRender={12}
            maxToRenderPerBatch={4}
            windowSize={10}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(139,92,246,0.12)', borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Bot color="#8B5CF6" size={32} strokeWidth={1.5} />
                </View>
                <Text style={{ color: txt1, fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
                  Hoş geldin! 👋
                </Text>
                <Text style={{ color: txt2, fontSize: 14, textAlign: 'center', lineHeight: 22 }}>
                  Aşağıdan bir soru seç ya da aklındakini yaz — otobüs saatinden Balıklıgöl'e kadar bilirim.
                </Text>
              </View>
            }
          />

          {isTyping && (
            <View style={[styles.bubbleContainer, styles.botBubbleContainer, { paddingHorizontal: 16 }]}>
              <View style={[styles.botAvatar, { backgroundColor: 'rgba(139,92,246,0.15)', borderColor: 'rgba(139,92,246,0.3)', borderWidth: 1 }]}>
                <Bot color="#8B5CF6" size={18}/>
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble, { backgroundColor: cardBg, borderColor: cardBdr }]}>
                <Text style={[styles.typingText, { color: txt1 }]}>{typingDots}</Text>
              </View>
            </View>
          )}

          {/* Input — tab bar'ın üstünde sabit */}
          <View style={{
            backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(245,243,255,0.95)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.12)',
          }}>
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
                style={styles.sendButton}
                onPress={() => { void sendUserMessage(inputText); }}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#7C3AED','#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButtonGradient}
                >
                  <SendHorizonal color="#fff" size={20}/>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            {/* Tab bar boşluğu */}
            <View style={{ height: pageBottomMargin }}/>
          </View>
        </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
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
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(196,181,253,0.3)',
  },
  heroPillTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#C4B5FD',
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
    flexGrow: 1,
    paddingBottom: 10,
  },
  bubbleContainer: {
    marginVertical: 10,
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
    backgroundColor: '#ccfbf1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatarLight: {},
  botAvatarDark:  {},
  bubble: {
    padding: 15,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.14)',
  },
  userBubbleText: {
    fontFamily: FontFamily.medium,
    color: Colors.white,
    fontSize: 16,
    lineHeight: 22,
  },
  botBubbleText: {
    fontFamily: FontFamily.regular,
    color: DribbbleColors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
  },
  botBubbleTextDark: {
    fontFamily: FontFamily.regular,
    color: '#f8fafc',
    fontSize: 16,
    lineHeight: 22,
  },
  typingBubble: {
    minWidth: 50,
    alignItems: 'center',
  },
  typingText: {
    fontSize: 18,
    color: Colors.darkGray,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputContainerDark: {},
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
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AssistantScreen;