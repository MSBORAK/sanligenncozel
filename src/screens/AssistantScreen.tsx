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
  const slideAnim = useRef(new Animated.Value(10)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
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
          <View style={[styles.botAvatar, isDark && styles.botAvatarDark, !isDark && styles.botAvatarLight]}>
            <Bot color={isDark ? '#5eead4' : Colors.primary.teal} size={20} />
          </View>
        )}
        {item.sender === 'user' ? (
          <LinearGradient
            colors={isDark ? [...Gradients.assistantUserDark] : [...Gradients.assistantUserLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.userBubble]}
          >
            <Text style={styles.userBubbleText}>
              {item.text}
            </Text>
          </LinearGradient>
        ) : (
          <View style={[
            styles.bubble, 
            styles.botBubble,
            isDark && { 
              backgroundColor: Colors.dark.card,
              borderWidth: 1,
              borderColor: Colors.dark.border,
              shadowColor: Platform.OS === 'android' ? 'transparent' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: Platform.OS === 'android' ? 0 : 0.2,
              shadowRadius: Platform.OS === 'android' ? 0 : 4,
              elevation: Platform.OS === 'android' ? 0 : 3,
            }
          ]}>
            <Text style={isDark ? styles.botBubbleTextDark : styles.botBubbleText}>
              {item.text}
            </Text>
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

  return (
    <SafeAreaView
      style={[styles.container, isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: DribbbleColors.background }]}
      edges={['top']}
    >
          <LinearGradient
            colors={isDark ? [...Gradients.assistantSheetDark] : [...Gradients.assistantSheetLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[
              styles.bubblePage,
              { marginBottom: pageBottomMargin },
              isDark && { shadowOpacity: Platform.OS === 'android' ? 0 : 0.25 },
            ]}
          >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 25}
        >
          {/* Header */}
          <LinearGradient
            colors={isDark ? ['rgba(13,148,136,0.35)', 'transparent'] : ['rgba(20,184,166,0.18)', 'transparent']}
            style={styles.headerGradient}
          >
            <View style={styles.header}>
              <Text style={[styles.headerTitle, isDark && { color: '#f8fafc' }]}>ŞanlıAsistan</Text>
              <View style={styles.headerModelRow}>
                <Activity size={14} color={Colors.primary.teal} />
                <Text style={[styles.headerSubtitle, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                  {activeModel === 'Model Aranıyor...' ? 'Model aranıyor…' : activeModel}
                </Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Quick Start Suggestions */}
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickStartContainer}
            >
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.quickStartChip,
                    isDark && styles.quickStartChipDark,
                    !isDark && styles.quickStartChipLight,
                  ]}
                  onPress={() => { void sendUserMessage(action.text); }}
                  activeOpacity={0.9}
                >
                  <View style={styles.quickStartChipInner}>
                    <Text style={[styles.quickStartText, isDark && { color: '#f8fafc' }]}>{action.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Chat Area */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.chatContainer, { paddingTop: 12 }]}
            showsVerticalScrollIndicator={false}
            inverted
            style={{ flex: 1 }}
            initialNumToRender={12}
            maxToRenderPerBatch={4}
            windowSize={10}
          />

          {/* Typing indicator */}
          {isTyping && (
            <View
              style={[
                styles.bubbleContainer,
                styles.botBubbleContainer,
                { paddingHorizontal: 15 },
              ]}
            >
              <View style={[styles.botAvatar, isDark && styles.botAvatarDark, !isDark && styles.botAvatarLight]}>
                <Bot color={isDark ? '#5eead4' : Colors.primary.teal} size={20} />
              </View>
              <View style={[styles.bubble, styles.botBubble, styles.typingBubble, isDark && { backgroundColor: Colors.dark.card }]}>
                <Text style={[styles.typingText, isDark && { color: '#f8fafc' }]}>{typingDots}</Text>
              </View>
            </View>
          )}

          {/* Input */}
          <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
            <TextInput
              placeholder="Mesajını buraya yaz..."
              style={[styles.input, isDark && { backgroundColor: 'rgba(255,255,255,0.06)', color: Colors.dark.text }]}
              placeholderTextColor={isDark ? '#94a3b8' : '#9ca3af'}
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
                 colors={isDark ? [...Gradients.assistantUserDark] : [...Gradients.assistantUserLight]}
                 start={{ x: 0, y: 0 }}
                 end={{ x: 1, y: 1 }}
                 style={styles.sendButtonGradient}
               >
                  <SendHorizonal color={Colors.white} size={24} />
               </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DribbbleColors.background,
  },
  bubblePage: {
    flex: 1,
    marginHorizontal: 14,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#2dd4bf33' : 'rgba(20,184,166,0.2)',
    shadowColor: Platform.OS === 'android' ? 'transparent' : '#0f766e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'android' ? 0 : 0.1,
    shadowRadius: Platform.OS === 'android' ? 0 : 16,
    elevation: Platform.OS === 'android' ? 0 : 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 4,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 26,
    letterSpacing: -0.4,
    color: DribbbleColors.textPrimary,
  },
  headerModelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  headerSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DribbbleColors.textSecondary,
    flex: 1,
  },
  quickStartContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  quickStartChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickStartChipLight: {
    backgroundColor: Platform.OS === 'android' ? '#e6f4ea' : 'rgba(230,244,234,0.95)',
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#6ee7b7' : 'rgba(16,185,129,0.28)',
  },
  quickStartChipDark: {
    backgroundColor: Platform.OS === 'android' ? '#0f172a' : 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#155e63' : 'rgba(45,212,191,0.22)',
  },
  quickStartChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStartText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: DribbbleColors.textPrimary,
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
  botAvatarLight: {
    backgroundColor: Platform.OS === 'android' ? '#ccfbf1' : 'rgba(204,251,241,0.95)',
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#5eead4' : 'rgba(20,184,166,0.35)',
  },
  botAvatarDark: {
    backgroundColor: Platform.OS === 'android' ? '#0f172a' : 'rgba(13,148,136,0.22)',
    borderWidth: 1,
    borderColor: Platform.OS === 'android' ? '#155e63' : 'rgba(45,212,191,0.35)',
  },
  bubble: {
    padding: 15,
    borderRadius: 20,
  },
  userBubble: {
    borderBottomRightRadius: 5,
  },
  botBubble: {
    backgroundColor: DribbbleColors.cardWhite,
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.14)',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Platform.OS === 'android' ? '#99f6e4' : 'rgba(20,184,166,0.18)',
    backgroundColor: Platform.OS === 'android' ? '#ecfdf5' : 'rgba(236,253,245,0.45)',
  },
  inputContainerDark: {
    borderTopColor: Platform.OS === 'android' ? '#134e4a' : 'rgba(45,212,191,0.15)',
    backgroundColor: Platform.OS === 'android' ? '#020617' : 'rgba(0,0,0,0.15)',
  },
  input: {
    flex: 1,
    height: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 25,
    paddingHorizontal: 18,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.18)',
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