import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { AppAlert } from '@/lib/alert';
import Animated, { useAnimatedStyle, interpolate, Extrapolation, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import { ArrowLeft, Send, Camera, X, RefreshCw, Heart, Reply } from 'lucide-react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase, processImageUrl } from '@/lib/supabase';
import { notify } from '@/lib/notifications';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Video, ResizeMode } from 'expo-av';
import * as ImageManipulator from 'expo-image-manipulator';
import { useAppTheme } from '@/theme/useAppTheme';
import { Editorial } from '@/theme/colors';
import { Clean } from '@/constants/Colors';
import { useTranslation } from 'react-i18next';

// SnapColors — static fallback values (Editorial defaults); theme-responsive
// values come from useAppTheme via `sc` inside the component.
const SnapColors = {
  yellow: '#F1E3CB',
  black: '#111114',
  white: '#FFF8EA',
  gray: '#3A2A1A',
  lightGray: '#F1E3CB',
  blue: '#2F2418',
  red: '#FF2D55',
};

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  is_read: boolean;
  is_snap?: boolean;
  snap_opened_at?: string | null;
  snap_expires_at?: string | null;
  created_at: string;
  reply_to_id?: string | null;
  reply_snippet?: string | null;
  heart_user_ids?: string[] | null;
}

interface RouteParams {
  userId: string;
  userName: string;
  userAvatar: string;
  username: string;
}

/** Kaydırınca beliren yanıt ikonu — parmakla senkron scale/opacity (WA/IG hissi) */
function SwipeReplyIcon({ progress, color }: { progress: SharedValue<number>; color: string }) {
  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(progress.value, [0, 1], [0.4, 1], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.6, 1], [0, 0.6, 1], Extrapolation.CLAMP);
    return { transform: [{ scale }], opacity };
  });
  return (
    <View style={styles.swipeReplyWrap}>
      <Animated.View style={iconStyle}>
        <Reply color={color} size={22} strokeWidth={2.2} />
      </Animated.View>
    </View>
  );
}

const ChatScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { t: tr } = useTranslation();
  const t = useAppTheme();
  const isDark = t.isDark;

  // Theme-derived chat colors
  const sc = useMemo(() => ({
    yellow: t.chipBg,
    black: t.txt1,
    white: t.ctaTxt,
    gray: t.txt2,
    lightGray: t.chipBg,
    blue: t.ctaBg,
    red: '#FF2D55',
    darkBg: t.pageBg,
    darkCard: t.cardBg,
    darkBorder: t.cardBdr,
    darkText: t.txt1,
    darkSecondary: t.txt2,
  }), [t]);

  const [messages, setMessages] = useState<Message[]>([]);
  /** Ters FlatList için: en yeni mesaj index 0'da (yani dipte) olacak şekilde */
  const invertedMessages = useMemo(() => [...messages].slice().reverse(), [messages]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedIsVideo, setCapturedIsVideo] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);
  /** Tepki mesajındaki kıvılcım önizlemesi — tam ekran */
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [partnerName, setPartnerName] = useState(params.userName?.trim() || '');
  const [partnerUsername, setPartnerUsername] = useState(params.username?.trim() || '');
  const [partnerAvatar, setPartnerAvatar] = useState(params.userAvatar || '');
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSendThrottleRef = useRef(0);
  const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  /** Swipeable + yüzde maxWidth bazen ~0 genişlik hesaplanmasına yol açıyor; sabit üst sınır metni yatay sarar */
  const maxBubbleWidth = Math.min(windowWidth * 0.78, 340);

  useEffect(() => {
    setPartnerName(params.userName?.trim() || '');
    setPartnerUsername(params.username?.trim() || '');
    setPartnerAvatar(params.userAvatar || '');
  }, [params.userName, params.username, params.userAvatar]);

  useEffect(() => {
    if (!params.userId || partnerName) return;
    let isMounted = true;
    (async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('name, username, avatar_url')
        .eq('user_id', params.userId)
        .maybeSingle();
      if (!isMounted || !data) return;
      if (data.name?.trim()) setPartnerName(data.name.trim());
      if (data.username?.trim()) setPartnerUsername(data.username.trim());
      if (data.avatar_url) setPartnerAvatar(processImageUrl(data.avatar_url) ?? data.avatar_url);
    })();
    return () => { isMounted = false; };
  }, [params.userId, partnerName]);

  const headerDisplayName = partnerName || partnerUsername || tr('common.kullanici');

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (user) {
        if (!params.userId || params.userId === '') {
          AppAlert.alert(tr('common.error'), tr('chat.kullaniciBilgisiBulunamadi'));
          navigation.goBack();
          return;
        }

        // Arkadaşlık kontrolü — her iki yönü de kontrol et
        const { data: friendships } = await supabase
          .from('friendships')
          .select('id, status')
          .eq('status', 'accepted')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`);

        if (!isMounted) return;
        const isFriend = friendships && friendships.length > 0;

        if (!isFriend) {
          AppAlert.alert(
            tr('chat.arkadasDegilsiniz'),
            tr('chat.arkadaslikIstegiGerekli'),
            [{ text: tr('sendSnap.tamam'), onPress: () => navigation.goBack() }]
          );
          return;
        }

        setCurrentUserId(user.id);
        await getOrCreateConversation(user.id, params.userId);
      }
    };
    init();
    return () => { isMounted = false; };
  }, [params.userId]);

  // Ekrana her fokus geldiğinde arkadaşlık ve engelleme durumunu tekrar doğrula
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        if (!params.userId || !currentUserId) return;
        try {
          const { data: friendship } = await supabase
            .from('friendships')
            .select('id')
            .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${currentUserId})`)
            .eq('status', 'accepted')
            .maybeSingle();
          if (!isActive) return;
          if (!friendship) {
            AppAlert.alert(tr('chat.arkadasDegilsiniz'), tr('chat.arkadaslikIstegiGerekli'), [{ text: tr('sendSnap.tamam'), onPress: () => navigation.goBack() }]);
            return;
          }

          const { data: blockRow } = await supabase
            .from('blocked_users')
            .select('id')
            .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${params.userId}),and(blocker_id.eq.${params.userId},blocked_id.eq.${currentUserId})`)
            .maybeSingle();
          if (!isActive) return;
          if (blockRow) {
            AppAlert.alert(tr('chat.engellemeVar'), tr('chat.engellemeAciklama'));
            navigation.goBack();
            return;
          }
        } catch (e) {
          // ignore transient errors
        }
      })();
      return () => { isActive = false; };
    }, [conversationId, currentUserId, params.userId])
  );

  useEffect(() => {
    if (conversationId && currentUserId) {
      fetchMessages();

      const channel = supabase
        .channel(`messages:${conversationId}`, {
          config: { broadcast: { self: true } },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newMsg = payload.new as Message;
              setMessages((prev) => {
                if (prev.some(msg => msg.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              // Ters listede en yeni mesaj zaten dipte belirir; kendi mesajımızda dibe (offset 0) in
              if (newMsg.sender_id === currentUserId) {
                setTimeout(() => {
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }, 100);
              }
              if (newMsg.sender_id !== currentUserId) {
                supabase.rpc('mark_messages_as_read', {
                  p_conversation_id: conversationId,
                  p_user_id: currentUserId,
                });
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedMsg = payload.new as Message;
              setMessages((prev) =>
                prev.map(msg => msg.id === updatedMsg.id ? updatedMsg : msg)
              );
            }
          }
        )
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          const uid = (payload as { userId?: string })?.userId;
          if (!uid || uid === currentUserId) return;
          setOtherTyping(true);
          if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
          typingHideTimerRef.current = setTimeout(() => setOtherTyping(false), 2800);
        })
        .on('broadcast', { event: 'typing_stop' }, ({ payload }) => {
          const uid = (payload as { userId?: string })?.userId;
          if (!uid || uid === currentUserId) return;
          if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
          typingHideTimerRef.current = null;
          setOtherTyping(false);
        })
        .subscribe();

      messageChannelRef.current = channel;

      return () => {
        if (typingHideTimerRef.current) clearTimeout(typingHideTimerRef.current);
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        messageChannelRef.current = null;
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, currentUserId]);

  const broadcastTyping = useCallback(() => {
    const ch = messageChannelRef.current;
    if (!ch || !currentUserId) return;
    const now = Date.now();
    if (now - typingSendThrottleRef.current < 450) return;
    typingSendThrottleRef.current = now;
    ch.send({ type: 'broadcast', event: 'typing', payload: { userId: currentUserId } });
  }, [currentUserId]);

  const broadcastTypingStop = useCallback(() => {
    const ch = messageChannelRef.current;
    if (!ch || !currentUserId) return;
    ch.send({ type: 'broadcast', event: 'typing_stop', payload: { userId: currentUserId } });
  }, [currentUserId]);

  const handleMessageInputChange = useCallback(
    (t: string) => {
      setNewMessage(t);
      if (t.length > 0) {
        broadcastTyping();
        if (typingIdleTimerRef.current) clearTimeout(typingIdleTimerRef.current);
        typingIdleTimerRef.current = setTimeout(() => {
          typingIdleTimerRef.current = null;
          broadcastTypingStop();
        }, 1600);
      } else {
        if (typingIdleTimerRef.current) {
          clearTimeout(typingIdleTimerRef.current);
          typingIdleTimerRef.current = null;
        }
        broadcastTypingStop();
      }
    },
    [broadcastTyping, broadcastTypingStop]
  );

  const toggleMessageHeart = useCallback(
    async (messageId: string) => {
      if (!currentUserId) return;
      // Optimistik güncelleme — UI anında tepki verir
      setMessages(prev => prev.map(m => {
        if (m.id !== messageId) return m;
        const ids = m.heart_user_ids ?? [];
        const liked = ids.includes(currentUserId);
        return {
          ...m,
          heart_user_ids: liked ? ids.filter(id => id !== currentUserId) : [...ids, currentUserId],
        };
      }));
      try {
        const { error } = await supabase.rpc('toggle_message_heart', { p_message_id: messageId });
        if (error) throw error;
      } catch {
        // Hata olursa geri al
        setMessages(prev => prev.map(m => {
          if (m.id !== messageId) return m;
          const ids = m.heart_user_ids ?? [];
          const liked = ids.includes(currentUserId);
          return {
            ...m,
            heart_user_ids: liked ? ids.filter(id => id !== currentUserId) : [...ids, currentUserId],
          };
        }));
      }
    },
    [currentUserId]
  );

  const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user1Id,
        user2_id: user2Id,
      });
      if (error) throw error;
      setConversationId(data);
    } catch (err: any) {
      const detail = err?.message || err?.details || JSON.stringify(err) || tr('chat.bilinmeyenHata');
      AppAlert.alert(tr('chat.sohbetBaslatilamadi'), detail);
      navigation.goBack();
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);

      // Sohbet daha önce "sil"inmişse (hidden_at damgası varsa), o tarihten
      // ÖNCEKİ mesajlar bu kullanıcı için bir daha görünmemeli.
      let hiddenAt: string | null = null;
      if (currentUserId) {
        const { data: participantRow, error: participantError } = await supabase
          .from('conversation_participants')
          .select('hidden_at')
          .eq('conversation_id', conversationId)
          .eq('user_id', currentUserId)
          .maybeSingle();
        console.log('[Sohbet Mesajları] hidden_at sorgusu', { conversationId, currentUserId, participantRow, participantError });
        hiddenAt = participantRow?.hidden_at ?? null;
      }

      let messagesQuery = supabase
        .from('messages')
        .select(
          'id, conversation_id, sender_id, content, image_url, is_read, is_snap, snap_opened_at, snap_expires_at, created_at, reply_to_id, reply_snippet, heart_user_ids'
        )
        .eq('conversation_id', conversationId);
      if (hiddenAt) messagesQuery = messagesQuery.gt('created_at', hiddenAt);
      const { data, error } = await messagesQuery.order('created_at', { ascending: true });
      console.log('[Sohbet Mesajları] mesaj sorgusu sonucu', { hiddenAt, count: data?.length, error });

      if (error) throw error;
      if (data) {
        // Ters (inverted) liste otomatik olarak en yeni mesajda (dipte) açılır — ekstra scroll gerekmez
        setMessages(data);
      }

      // Mesajları okundu olarak işaretle
      if (currentUserId) {
        await supabase.rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: currentUserId,
        });
      }
    } catch (e: any) {
      console.error('[Sohbet Mesajları] HATA', e);
      // Hata varsa mesaj listesi boş görünecek ve kullanıcı kaynaktan habersiz kalacak.
      // Daha iyi: bir retry prompt gösterilmeli, ama şimdilik loglayıp farkında olalım.
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

    // Sunucu tarafı kurallarıyla uyum: tekrar arkadaşlık ve engelleme kontrolü yap
    try {
      const { data: friendship } = await supabase
        .from('friendships')
        .select('id')
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${currentUserId})`)
        .eq('status', 'accepted')
        .maybeSingle();
      if (!friendship) {
        AppAlert.alert(tr('chat.arkadasDegilsiniz'), tr('chat.arkadaslikIstegiGerekli'));
        return;
      }
      const { data: blockRow } = await supabase
        .from('blocked_users')
        .select('id')
        .or(`and(blocker_id.eq.${currentUserId},blocked_id.eq.${params.userId}),and(blocker_id.eq.${params.userId},blocked_id.eq.${currentUserId})`)
        .maybeSingle();
      if (blockRow) {
        AppAlert.alert(tr('chat.engellemeVar'), tr('chat.engellemeAciklama'));
        return;
      }
    } catch (e) {
      // Eğer kontrol sırasında hata olursa, mesaj göndermeyi durdur
      AppAlert.alert(tr('common.error'), tr('chat.bilinmeyenHata'));
      return;
    }

    if (typingIdleTimerRef.current) {
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = null;
    }
    broadcastTypingStop();

    const messageContent = newMessage.trim();
    const replyTarget = replyingTo;
    setNewMessage('');
    setReplyingTo(null);

    const replySnippet =
      replyTarget != null
        ? replyTarget.content?.trim()?.slice(0, 220) ||
          (replyTarget.image_url ? (replyTarget.is_snap ? `📷 ${tr('sosyalProfile.kivilcim')}` : `📷 ${tr('chat.medya')}`) : '')
        : null;

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
          reply_to_id: replyTarget?.id ?? null,
          reply_snippet: replySnippet || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Alıcıya push bildirim gönder (arka planda, hata olsa devam et)
      notify.newMessage(params.userId, params.userName, messageContent, conversationId).catch(() => {});

      // Realtime subscription mesajı ekleyecek, fallback olarak da ekle
      setTimeout(() => {
        setMessages((prev) => {
          if (prev.some(msg => msg.id === data.id)) return prev;
          return [...prev, data as Message];
        });
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 200);
    } catch (err: any) {
      const detail = err?.message || err?.details || JSON.stringify(err) || tr('chat.bilinmeyenHata');
      AppAlert.alert(tr('chat.mesajGonderilemedi'), detail);
      setNewMessage(messageContent);
      setReplyingTo(replyTarget);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleCameraPress = async () => {
    const camPerm = cameraPermission ?? await requestCameraPermission();
    if (!camPerm?.granted) {
      AppAlert.alert(tr('chat.kameraIzni'), tr('chat.kameraIzniAciklama'));
      return;
    }
    
    // Video modu için mikrofon izni de gerekli
    const micPerm = microphonePermission ?? await requestMicrophonePermission();
    if (!micPerm?.granted) {
      AppAlert.alert(tr('chat.mikrofonIzni'), tr('chat.mikrofonIzniAciklama'));
      return;
    }
    
    setCapturedPhoto(null);
    setCapturedIsVideo(false);
    setCameraFacing('back');
    setCameraVisible(true);
  };

  const toggleCameraFacing = () => {
    console.log('🔄 Kamera döndürülüyor:', cameraFacing, '→', cameraFacing === 'back' ? 'front' : 'back');
    setCameraFacing(prev => prev === 'back' ? 'front' : 'back');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || cameraBusy) return;
    try {
      setCameraBusy(true);
      const photo = await cameraRef.current.takePictureAsync({ 
        quality: 0.8, 
        skipProcessing: true,
      });
      
      if (photo?.uri) {
        // Ön kameradaysa fotoğrafı yatay flip et
        if (cameraFacing === 'front') {
          const flipped = await ImageManipulator.manipulateAsync(
            photo.uri,
            [{ flip: ImageManipulator.FlipType.Horizontal }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          setCapturedIsVideo(false);
          setCapturedPhoto(flipped.uri);
        } else {
          setCapturedIsVideo(false);
          setCapturedPhoto(photo.uri);
        }
      }
    } catch (e) {
      AppAlert.alert(tr('common.error'), tr('chat.fotografCekilemedi'));
    } finally {
      setCameraBusy(false);
    }
  };

  const handleStartRecording = async () => {
    if (!cameraRef.current || cameraBusy || isRecording) return;
    
    console.log('🎥 Video kaydı başlıyor...');
    
    try {
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Video kayıt süresini takip et
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('⏱️ Kayıt süresi:', newDuration);
          if (newDuration >= 59) {
            // 60 saniye doldu, otomatik durdur
            console.log('⏰ 60 saniye doldu, otomatik durduruluyor');
            handleStopRecording();
            return 60;
          }
          return newDuration;
        });
      }, 1000);
      
      console.log('📹 recordAsync başlatılıyor...');
      // recordAsync promise döner ve kayıt bitene kadar bekler
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60,
      });
      
      console.log('✅ Video kaydedildi:', video?.uri);
      
      // Kayıt tamamlandı
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      
      if (video?.uri) {
        setCapturedIsVideo(true);
        setCapturedPhoto(video.uri);
      }
      
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (e: any) {
      console.error('❌ Video kayıt hatası:', e);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Kullanıcı manuel durdurdu, hata gösterme
      if (e?.message?.includes('recording') || e?.code === 'E_RECORDING_FAILED') {
        console.log('ℹ️ Kayıt kullanıcı tarafından durduruldu');
        return;
      }
      AppAlert.alert(tr('common.error'), tr('chat.videoKaydedilemedi'));
    }
  };

  const handleStopRecording = () => {
    console.log('⏹️ Video kaydı durduruluyor...');
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const handleCapturePress = () => {
    console.log('📸 Çekim butonu tıklandı. Mod:', cameraMode, 'Kayıt durumu:', isRecording);
    if (cameraMode === 'photo') {
      handleTakePhoto();
    } else {
      if (isRecording) {
        handleStopRecording();
      } else {
        handleStartRecording();
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmSnap = () => {
    if (!capturedPhoto) return;
    setCameraVisible(false);
    navigation.navigate('SendSnap', { recipientId: params.userId, imageUri: capturedPhoto });
    setCapturedPhoto(null);
  };

  const handleSnapPress = async (message: Message) => {
    if (!message.is_snap || !message.image_url) return;

    const isMe = message.sender_id === currentUserId;
    
    // Gönderen her zaman açabilir
    if (isMe) {
      navigation.navigate('SnapView', {
        imageUrl: message.image_url,
        canView: true,
      });
      return;
    }

    // Alıcı için kontroller
    const now = new Date();
    
    // Eğer snap açılmışsa ve süresi dolmuşsa
    if (message.snap_expires_at) {
      const expiresAt = new Date(message.snap_expires_at);
      if (now > expiresAt) {
        AppAlert.alert(tr('chat.kivilcimSuresiDoldu'), tr('chat.kivilcimGoruntulenemiyor'));
        return;
      }
    }

    // Snap'i aç
    navigation.navigate('SnapView', {
      imageUrl: message.image_url,
      messageId: message.id,
      canView: true,
    });

    // Eğer ilk kez açılıyorsa işaretle
    if (!message.snap_opened_at && currentUserId) {
      try {
        await supabase.rpc('mark_snap_as_opened', {
          p_message_id: message.id,
          p_user_id: currentUserId,
        });
      } catch (error) {
        console.error('Mark snap as opened error:', error);
      }
    }
  };

  const handleDeleteMessage = (item: Message) => {
    const isMe = item.sender_id === currentUserId;
    if (!isMe) return; // Sadece kendi mesajlarını silebilir

    AppAlert.alert(
      tr('chat.mesajiSil'),
      tr('chat.mesajiSilOnay'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('chat.sil'),
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('messages')
              .delete()
              .eq('id', item.id);
            if (error) {
              AppAlert.alert(tr('common.error'), tr('chat.mesajSilinemedi'));
            } else {
              setMessages(prev => prev.filter(m => m.id !== item.id));
            }
          },
        },
      ]
    );
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    const isSnap = item.is_snap && item.image_url;
    /** Kıvılcım tepkisi: metin + küçük görsel (is_snap değil, sadece önizleme URL'i) */
    const isKivilcimReplyPreview = !!item.image_url && item.is_snap !== true;

    // Snap için özel görünüm
    if (isSnap) {
      const isOpened = !!item.snap_opened_at;
      const isExpired = item.snap_expires_at && new Date() > new Date(item.snap_expires_at);
      const canView = isMe || (!isExpired);

      return (
        <View style={styles.messageRowOuter}>
          {wrapSwipeable(
            item,
            <View style={[styles.messageContainer, !isMe && styles.theirMessage, { backgroundColor: sc.darkBg }]}>
              {isMe ? <View style={styles.messageRowSpacer} /> : null}
              {!isMe && (
                <Image
                  source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
                  style={styles.messageAvatar}
                />
              )}
              <View
                style={[
                  styles.bubbleColumn,
                  isMe && styles.bubbleColumnMe,
                  { maxWidth: maxBubbleWidth, flexShrink: 0 },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.snapBubble,
                    { maxWidth: maxBubbleWidth },
                    isMe ? styles.mySnapBubble : (isDark ? styles.theirSnapBubbleDark : styles.theirSnapBubble),
                  ]}
                  onPress={() => handleSnapPress(item)}
                  onLongPress={() => handleDeleteMessage(item)}
                  delayLongPress={400}
                  disabled={!canView}
                >
                  {item.reply_snippet ? replyQuoteBlock(item.reply_snippet, isMe) : null}
                  <View style={styles.snapContent}>
                    <Camera color={isMe ? sc.white : sc.blue} size={20} />
                    <Text style={[styles.snapText, isMe ? styles.mySnapText : styles.theirSnapText]}>
                      {isExpired ? `🔒 ${tr('chat.sureDoldu')}` : isOpened && !isMe ? `👁 ${tr('chat.acildi')}` : tr('sosyalProfile.kivilcim')}
                    </Text>
                  </View>
                  {item.content && item.content !== '📷 Snap' && (
                    <Text style={[styles.snapCaption, isMe ? styles.mySnapCaption : styles.theirSnapCaption]}>
                      {item.content}
                    </Text>
                  )}
                  <View style={[styles.timeSeenRow, isMe ? styles.timeSeenRowMe : styles.timeSeenRowThem]}>
                    <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                      {formatTime(item.created_at)}
                    </Text>
                    {isMe && item.is_read ? (
                      <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>{tr('chat.gorulduLabel')}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {heartMeta(item, isMe)}
        </View>
      );
    }

    // Kıvılcım tepkisi — üstte küçük görsel, altta metin
    if (isKivilcimReplyPreview) {
      const thumbUri = processImageUrl(item.image_url!) ?? item.image_url!;
      return (
        <View style={styles.messageRowOuter}>
          {wrapSwipeable(
            item,
            <View style={[styles.messageContainer, !isMe && styles.theirMessage, { backgroundColor: sc.darkBg }]}>
              {isMe ? <View style={styles.messageRowSpacer} /> : null}
              {!isMe && (
                <Image
                  source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
                  style={styles.messageAvatar}
                />
              )}
              <View
                style={[
                  styles.bubbleColumn,
                  isMe && styles.bubbleColumnMe,
                  { maxWidth: maxBubbleWidth, flexShrink: 0 },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onLongPress={() => handleDeleteMessage(item)}
                  delayLongPress={400}
                  style={[
                    styles.messageBubble,
                    styles.kivilcimReplyBubble,
                    { maxWidth: maxBubbleWidth },
                    isMe ? [styles.myBubble, isDark && styles.myBubbleDark] : (isDark ? styles.theirBubbleDark : styles.theirBubble),
                  ]}
                >
                  {item.reply_snippet ? replyQuoteBlock(item.reply_snippet, isMe) : null}
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPreviewImageUri(thumbUri)}
                    style={styles.kivilcimReplyThumbWrap}
                  >
                    <Image
                      source={{ uri: thumbUri }}
                      style={styles.kivilcimReplyThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.kivilcimReplyThumbLabel}>
                      <Text style={styles.kivilcimReplyThumbLabelText}>{tr('sosyalProfile.kivilcim')}</Text>
                    </View>
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.messageText,
                      isMe ? styles.myMessageText : (isDark ? styles.theirMessageTextDark : styles.theirMessageText),
                    ]}
                  >
                    {item.content}
                  </Text>
                  <View style={[styles.timeSeenRow, isMe ? styles.timeSeenRowMe : styles.timeSeenRowThem]}>
                    <Text
                      style={[
                        styles.messageTime,
                        isMe ? styles.myMessageTime : (isDark ? styles.theirMessageTimeDark : styles.theirMessageTime),
                      ]}
                    >
                      {formatTime(item.created_at)}
                    </Text>
                    {isMe && item.is_read ? (
                      <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>{tr('chat.gorulduLabel')}</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {heartMeta(item, isMe)}
        </View>
      );
    }

    // Normal mesaj
    return (
      <View style={styles.messageRowOuter}>
        {wrapSwipeable(
          item,
          <View style={[styles.messageContainer, !isMe && styles.theirMessage, { backgroundColor: sc.darkBg }]}>
            {isMe ? <View style={styles.messageRowSpacer} /> : null}
            {!isMe && (
              <Image
                source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
                style={styles.messageAvatar}
              />
            )}
            <View
              style={[
                styles.bubbleColumn,
                isMe && styles.bubbleColumnMe,
                { maxWidth: maxBubbleWidth, flexShrink: 0 },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onLongPress={() => handleDeleteMessage(item)}
                delayLongPress={400}
                style={[
                  styles.messageBubble,
                  { maxWidth: maxBubbleWidth },
                  isMe ? [styles.myBubble, isDark && styles.myBubbleDark] : (isDark ? styles.theirBubbleDark : styles.theirBubble),
                ]}
              >
                {item.reply_snippet ? replyQuoteBlock(item.reply_snippet, isMe) : null}
                <Text
                  style={[
                    styles.messageText,
                    isMe ? styles.myMessageText : (isDark ? styles.theirMessageTextDark : styles.theirMessageText),
                  ]}
                >
                  {item.content}
                </Text>
                <View style={[styles.timeSeenRow, isMe ? styles.timeSeenRowMe : styles.timeSeenRowThem]}>
                  <Text
                    style={[
                      styles.messageTime,
                      isMe ? styles.myMessageTime : (isDark ? styles.theirMessageTimeDark : styles.theirMessageTime),
                    ]}
                  >
                    {formatTime(item.created_at)}
                  </Text>
                  {isMe && item.is_read ? (
                    <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>{tr('chat.gorulduLabel')}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {heartMeta(item, isMe)}
      </View>
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, isDark, maxBubbleWidth, params.userAvatar, toggleMessageHeart, setReplyingTo, setPreviewImageUri, sc, t]);

  const renderReplySwipeAction = useCallback(
    (progress: SharedValue<number>) => <SwipeReplyIcon progress={progress} color={sc.white} />,
    [sc]
  );

  const replyQuoteBlock = (snippet: string, isMe: boolean) => (
    <View
      style={[
        styles.replyQuote,
        isMe ? styles.replyQuoteMe : isDark ? styles.replyQuoteThemDark : styles.replyQuoteThem,
      ]}
    >
      <View style={[styles.replyQuoteBar, isMe && styles.replyQuoteBarMe]} />
      <Text
        style={[
          styles.replyQuoteText,
          isMe ? styles.replyQuoteTextMe : isDark ? styles.replyQuoteTextThemDark : styles.replyQuoteTextThem,
        ]}
        numberOfLines={2}
      >
        {snippet}
      </Text>
    </View>
  );

  const heartMeta = (item: Message, isMe: boolean) => {
    const ids = item.heart_user_ids ?? [];
    const count = ids.length;
    const iLiked = currentUserId ? ids.includes(currentUserId) : false;
    return (
      <View style={[styles.heartMetaRow, isMe ? styles.heartMetaRowMe : styles.heartMetaRowThem]}>
        <TouchableOpacity
          onPress={() => toggleMessageHeart(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.heartBtn}
        >
          <Heart
            size={15}
            color={iLiked ? sc.red : sc.gray}
            fill={iLiked ? sc.red : 'transparent'}
            strokeWidth={2.2}
          />
          {count > 0 ? <Text style={[styles.heartCount, isDark && styles.heartCountDark]}>{count}</Text> : null}
        </TouchableOpacity>
      </View>
    );
  };

  /** Sağa kaydırınca yanıt (WhatsApp gibi) — ReanimatedSwipeable UI-thread'de çalışır, akıcı */
  const wrapSwipeable = useCallback((item: Message, row: React.ReactElement) => {
    const swipeableRef = React.createRef<SwipeableMethods>();
    return (
      <ReanimatedSwipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={60}
        overshootLeft={false}
        overshootFriction={12}
        dragOffsetFromLeftEdge={1}
        containerStyle={styles.swipeableRowContainer}
        childrenContainerStyle={styles.swipeableRowChildren}
        renderLeftActions={renderReplySwipeAction}
        onSwipeableWillOpen={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setReplyingTo(item);
          swipeableRef.current?.close();
        }}
      >
        {row}
      </ReanimatedSwipeable>
    );
  }, [renderReplySwipeAction]);

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <SafeAreaView style={[styles.root, { backgroundColor: t.pageBg }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t.cardBg, borderBottomColor: t.divider }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
            <ArrowLeft color={t.txt1} size={24} />
          </Pressable>
          <Pressable
            style={styles.headerUserInfo}
            onPress={() => navigation.navigate('SosyalProfile', { userId: params.userId })}
          >
            <Image
              source={{ uri: partnerAvatar || 'https://i.pravatar.cc/150' }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerTextWrap}>
              <Text style={[styles.headerName, { color: t.txt1 }]} numberOfLines={1}>
                {headerDisplayName}
              </Text>
              {otherTyping ? (
                <Text style={[styles.headerTyping, { color: t.txt2 }]} numberOfLines={1}>
                  {tr('chat.yaziyor')}
                </Text>
              ) : null}
            </View>
          </Pressable>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={sc.blue} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={invertedMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={{ transform: [{ scaleY: -1 }] }}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            removeClippedSubviews={true}
            windowSize={5}
            maxToRenderPerBatch={8}
            initialNumToRender={12}
            updateCellsBatchingPeriod={50}
            getItemLayout={(data, index) => ({
              length: 80,
              offset: 80 * index,
              index,
            })}
            ListEmptyComponent={
              <View style={[styles.emptyState, { transform: [{ scaleY: -1 }] }]}>
                <Text style={[styles.emptyStateText, { color: t.txt2 }]}>
                  {tr('chat.sohbeteBasla', { name: params.userName })} 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputOuter, { borderTopColor: t.divider, backgroundColor: t.cardBg }]}>
          {replyingTo ? (
            <View style={[styles.replyBar, { backgroundColor: t.chipBg }]}>
              <View style={styles.replyBarAccent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.replyBarLabel, { color: t.ctaBg }]}>{tr('chat.yanitlaniyor')}</Text>
                <Text style={[styles.replyBarText, { color: t.txt1 }]} numberOfLines={3}>
                  {replyingTo.content?.trim() ||
                    (replyingTo.image_url ? (replyingTo.is_snap ? '📷 Kıvılcım' : '📷 Medya') : '')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={12} style={{ paddingTop: 2 }}>
                <X color={t.txt2} size={22} />
              </TouchableOpacity>
            </View>
          ) : null}
        <View style={[styles.inputContainer, { backgroundColor: t.cardBg }]}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
          >
            <Camera color={sc.blue} size={24} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: t.pageBg, color: t.txt1, borderColor: t.border }]}
            placeholder={tr('chat.mesajYaz')}
            placeholderTextColor={t.txt2}
            value={newMessage}
            onChangeText={handleMessageInputChange}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={sc.white} />
            ) : (
              <Send color={sc.white} size={20} />
            )}
          </TouchableOpacity>
        </View>
        </View>
      </KeyboardAvoidingView>

      {/* Kamera Modalı */}
      <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => {
        if (isRecording) {
          handleStopRecording();
        }
        setCameraVisible(false);
        setCapturedPhoto(null);
        setCapturedIsVideo(false);
      }}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {!capturedPhoto ? (
            <>
              <CameraView 
                ref={cameraRef} 
                style={{ flex: 1 }} 
                facing={cameraFacing}
                mirror={cameraFacing === 'front'}
              />
              
              {/* Üst kontroller */}
              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: 0, left: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (isRecording) {
                        handleStopRecording();
                      }
                      setCameraVisible(false);
                      setCapturedPhoto(null);
                      setCapturedIsVideo(false);
                    }}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X color="#fff" size={22} strokeWidth={2.5} />
                  </TouchableOpacity>
                  
                  {isRecording && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 6 }} />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                        {formatRecordingTime(recordingDuration)}
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    onPress={toggleCameraFacing}
                    disabled={isRecording}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', opacity: isRecording ? 0.5 : 1 }}
                  >
                    <RefreshCw color="#fff" size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
              
              {/* Alt kontroller */}
              <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                  {/* Mod seçici */}
                  {!isRecording && (
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
                      <TouchableOpacity
                        onPress={() => setCameraMode('photo')}
                        style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                      >
                        <Text style={{ color: cameraMode === 'photo' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '700' }}>
                          {tr('chat.foto')}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setCameraMode('video')}
                        style={{ paddingVertical: 8, paddingHorizontal: 16 }}
                      >
                        <Text style={{ color: cameraMode === 'video' ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 16, fontWeight: '700' }}>
                          {tr('chat.video')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Çekim butonu */}
                  <View style={{ alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={handleCapturePress}
                      onLongPress={() => {
                        if (cameraMode === 'video' && !isRecording) {
                          handleStartRecording();
                        }
                      }}
                      delayLongPress={200}
                      disabled={cameraBusy && !isRecording}
                      style={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: 40, 
                        backgroundColor: isRecording ? '#FF3B30' : '#fff', 
                        borderWidth: 5, 
                        borderColor: isRecording ? 'rgba(255,59,48,0.5)' : 'rgba(255,255,255,0.5)', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        opacity: (cameraBusy && !isRecording) ? 0.5 : 1,
                      }}
                    >
                      {cameraBusy && !isRecording ? (
                        <ActivityIndicator color="#000" />
                      ) : isRecording ? (
                        <View style={{ width: 24, height: 24, backgroundColor: '#fff', borderRadius: 4 }} />
                      ) : null}
                    </TouchableOpacity>
                    {cameraMode === 'video' && !isRecording && (
                      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 8, fontWeight: '500' }}>
                        {tr('chat.tiklaVeyaBasiliTut')}
                      </Text>
                    )}
                  </View>
                </View>
              </SafeAreaView>
            </>
          ) : (
            <>
              {capturedIsVideo ? (
                <Video
                  source={{ uri: capturedPhoto! }}
                  style={{ flex: 1, backgroundColor: '#000' }}
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay
                  isLooping
                  useNativeControls
                />
              ) : (
                <Image source={{ uri: capturedPhoto }} style={{ flex: 1 }} resizeMode="contain" />
              )}
              <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 20 }}>
                  <TouchableOpacity 
                    onPress={() => {
                      setCapturedPhoto(null);
                      setCapturedIsVideo(false);
                    }} 
                    style={{ paddingHorizontal: 28, paddingVertical: 14, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 28, minWidth: 120, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{tr('chat.tekrar')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={handleConfirmSnap} 
                    style={{ paddingHorizontal: 32, paddingVertical: 14, backgroundColor: sc.blue, borderRadius: 28, minWidth: 120, alignItems: 'center' }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{tr('common.send')}</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </>
          )}
        </View>
      </Modal>

      {/* Kıvılcım tepkisi — önizleme tam ekran */}
      <Modal
        visible={!!previewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.imagePreviewRoot}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setPreviewImageUri(null)}
          />
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.imagePreviewImage}
              resizeMode="contain"
            />
          ) : null}
          <SafeAreaView edges={['top']} style={styles.imagePreviewTopBar}>
            <TouchableOpacity
              onPress={() => setPreviewImageUri(null)}
              style={styles.imagePreviewCloseBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X color="#fff" size={28} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
    backgroundColor: Clean.bg,
  },
  rootDark: {
    backgroundColor: Editorial.bg,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Clean.divider,
    backgroundColor: Clean.surface,
  },
  headerDark: {
    backgroundColor: Editorial.surface,
    borderBottomColor: Editorial.divider,
  },
  backButton: {
    marginRight: 12,
  },
  headerUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  headerName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: SnapColors.black,
  },
  headerNameDark: {
    color: Editorial.ink,
  },
  headerUsername: {
    fontSize: 13,
    color: SnapColors.gray,
    marginTop: 2,
  },
  headerUsernameDark: {
    color: Editorial.coffeeSoft,
  },
  headerTyping: {
    fontSize: 12,
    fontWeight: '500',
    color: SnapColors.gray,
    marginTop: 1,
  },
  headerTypingDark: {
    color: '#5ac8fa',
  },
  bubbleColumn: {},
  bubbleColumnMe: {
    alignItems: 'flex-end',
  },
  swipeReplyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: '100%',
    marginRight: 8,
    borderRadius: 14,
    backgroundColor: SnapColors.blue,
  },
  replyQuote: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  replyQuoteMe: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  replyQuoteThem: {
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  replyQuoteThemDark: {
    backgroundColor: 'rgba(47,36,24,0.10)',
  },
  replyQuoteBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: SnapColors.blue,
  },
  replyQuoteBarMe: {
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  replyQuoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 17,
  },
  replyQuoteTextMe: {
    color: 'rgba(255,255,255,0.95)',
  },
  replyQuoteTextThem: {
    color: SnapColors.black,
  },
  replyQuoteTextThemDark: {
    color: Editorial.ink,
  },
  timeSeenRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  timeSeenRowMe: {
    justifyContent: 'flex-end',
  },
  timeSeenRowThem: {
    justifyContent: 'flex-start',
  },
  seenLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  seenLabelMe: {
    color: 'rgba(255,255,255,0.92)',
  },
  heartMetaRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  heartMetaRowMe: {
    justifyContent: 'flex-end',
    alignSelf: 'flex-end',
  },
  heartMetaRowThem: {
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
  },
  heartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heartCount: {
    fontSize: 12,
    fontWeight: '600',
    color: SnapColors.gray,
  },
  heartCountDark: {
    color: Editorial.coffeeSoft,
  },
  inputOuter: {
    borderTopWidth: 1,
    borderTopColor: Clean.divider,
    backgroundColor: Clean.surface,
  },
  inputOuterDark: {
    borderTopColor: Editorial.divider,
    backgroundColor: Editorial.surface,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: Clean.bgSoft,
  },
  replyBarDark: {
    backgroundColor: Editorial.chip,
  },
  replyBarAccent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: SnapColors.blue,
  },
  replyBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: SnapColors.blue,
    marginBottom: 2,
  },
  replyBarLabelDark: {
    color: Editorial.coffee,
  },
  replyBarText: {
    fontSize: 13,
    color: SnapColors.black,
    lineHeight: 18,
  },
  replyBarTextDark: {
    color: Editorial.ink,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRowOuter: {
    alignSelf: 'stretch',
    width: '100%',
    marginBottom: 16,
    transform: [{ scaleY: -1 }],
  },
  swipeableRowContainer: {
    width: '100%',
    overflow: 'visible',
  },
  swipeableRowChildren: {
    width: '100%',
    flexShrink: 0,
    backgroundColor: 'transparent',
  },
  /** FlatList satırında flex:1 kullanma — giden mesaj tek çocukken yükseklik/genişlik 0’a çökebiliyor */
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageRowSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 14,
  },
  kivilcimReplyBubble: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },
  kivilcimReplyThumbWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  kivilcimReplyThumb: {
    width: 220,
    height: 132,
    backgroundColor: '#0f172a',
  },
  kivilcimReplyThumbLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  kivilcimReplyThumbLabelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  imagePreviewRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    justifyContent: 'center',
  },
  imagePreviewImage: {
    width: '100%',
    height: '78%',
    alignSelf: 'center',
  },
  imagePreviewTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  imagePreviewCloseBtn: {
    padding: 10,
  },
  myBubble: {
    backgroundColor: Clean.ctaBg,
    borderBottomRightRadius: 0,
  },
  myBubbleDark: {
    backgroundColor: Editorial.coffee,
  },
  theirBubble: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderWidth: 1.2,
    borderColor: Clean.textPrimary,
  },
  theirBubbleDark: {
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderWidth: 1.2,
    borderColor: Editorial.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: SnapColors.white,
  },
  theirMessageText: {
    color: SnapColors.black,
  },
  theirMessageTextDark: {
    color: Editorial.ink,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: SnapColors.gray,
  },
  theirMessageTimeDark: {
    color: Editorial.coffeeSoft,
  },
  snapBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  mySnapBubble: {
    backgroundColor: SnapColors.blue,
    borderBottomRightRadius: 0,
  },
  theirSnapBubble: {
    backgroundColor: SnapColors.lightGray,
    borderBottomLeftRadius: 0,
  },
  theirSnapBubbleDark: {
    backgroundColor: Editorial.chip,
    borderBottomLeftRadius: 4,
  },
  snapContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapText: {
    fontSize: 15,
    fontWeight: '600',
  },
  mySnapText: {
    color: SnapColors.white,
  },
  theirSnapText: {
    color: SnapColors.blue,
  },
  snapCaption: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 18,
  },
  mySnapCaption: {
    color: 'rgba(255,255,255,0.9)',
  },
  theirSnapCaption: {
    color: SnapColors.black,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: SnapColors.gray,
    textAlign: 'center',
  },
  emptyStateTextDark: {
    color: Editorial.coffeeSoft,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Clean.surface,
  },
  inputContainerDark: {
    backgroundColor: Editorial.surface,
  },
  cameraButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Clean.bgSoft,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: Clean.textPrimary,
    borderWidth: 1,
    borderColor: Clean.border,
  },
  inputDark: {
    backgroundColor: Editorial.chip,
    color: Editorial.ink,
    borderColor: Editorial.borderSoft,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SnapColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen;
