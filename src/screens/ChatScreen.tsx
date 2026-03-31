import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { ArrowLeft, Send, Camera, X, RefreshCw, Heart, Reply } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase, processImageUrl } from '@/lib/supabase';
import { notify } from '@/lib/notifications';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useThemeMode } from '@/context/ThemeContext';

// Snapchat Renk Paleti
const SnapColors = {
  yellow: '#FFFC00',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#8E8E93',
  lightGray: '#F2F2F7',
  blue: '#0FADFF',
  red: '#FF2D55',
  // Dark mode colors
  darkBg: '#000000',
  darkCard: '#1C1C1E',
  darkBorder: '#38383A',
  darkText: '#FFFFFF',
  darkSecondary: '#8E8E93',
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

const ChatScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);
  /** Tepki mesajındaki kıvılcım önizlemesi — tam ekran */
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const typingHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIdleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingSendThrottleRef = useRef(0);
  const messageChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const swipeableRefs = useRef<Map<string, React.ElementRef<typeof Swipeable> | null>>(new Map());
  const { width: windowWidth } = useWindowDimensions();
  /** Swipeable + yüzde maxWidth bazen ~0 genişlik hesaplanmasına yol açıyor; sabit üst sınır metni yatay sarar */
  const maxBubbleWidth = Math.min(windowWidth * 0.78, 340);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (!params.userId || params.userId === '') {
          Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
          navigation.goBack();
          return;
        }

        // Arkadaşlık kontrolü — her iki yönü de kontrol et
        const { data: friendships } = await supabase
          .from('friendships')
          .select('id, status')
          .eq('status', 'accepted')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`);

        const isFriend = friendships && friendships.length > 0;

        if (!isFriend) {
          Alert.alert(
            'Arkadaş Değilsiniz',
            'Mesajlaşmak için önce arkadaşlık isteği gönderip kabul ettirmeniz gerekiyor.',
            [{ text: 'Tamam', onPress: () => navigation.goBack() }]
          );
          return;
        }

        setCurrentUserId(user.id);
        await getOrCreateConversation(user.id, params.userId);
      }
    };
    init();
  }, []);

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
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
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
      try {
        const { error } = await supabase.rpc('toggle_message_heart', { p_message_id: messageId });
        if (error) throw error;
      } catch (e: any) {
        const msg = e?.message || 'Kalp güncellenemedi';
        Alert.alert('Hata', msg);
      }
    },
    []
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
      const detail = err?.message || err?.details || JSON.stringify(err) || 'Bilinmeyen hata';
      Alert.alert('Sohbet Başlatılamadı', detail);
      navigation.goBack();
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(
          'id, conversation_id, sender_id, content, image_url, is_read, is_snap, snap_opened_at, snap_expires_at, created_at, reply_to_id, reply_snippet, heart_user_ids'
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data);
        // Mesajlar yüklendikten sonra en alta scroll
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }

      // Mesajları okundu olarak işaretle
      if (currentUserId) {
        await supabase.rpc('mark_messages_as_read', {
          p_conversation_id: conversationId,
          p_user_id: currentUserId,
        });
      }
    } catch {
      // sessiz hata — kullanıcı deneyimini bozmaz
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !currentUserId) return;

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
          (replyTarget.image_url ? (replyTarget.is_snap ? '📷 Kıvılcım' : '📷 Medya') : '')
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
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (err: any) {
      const detail = err?.message || err?.details || JSON.stringify(err) || 'Bilinmeyen hata';
      Alert.alert('Mesaj Gönderilemedi', detail);
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
    const perm = cameraPermission ?? await requestCameraPermission();
    if (!perm?.granted) {
      Alert.alert('Kamera İzni', 'Kıvılcım çekebilmek için kamera iznine ihtiyaç var.');
      return;
    }
    setCapturedPhoto(null);
    setCameraFacing('back');
    setCameraVisible(true);
  };

  const toggleCameraFacing = () => {
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
          setCapturedPhoto(flipped.uri);
        } else {
          setCapturedPhoto(photo.uri);
        }
      }
    } catch (e) {
      Alert.alert('Hata', 'Fotoğraf çekilemedi');
    } finally {
      setCameraBusy(false);
    }
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
        Alert.alert('Kıvılcım Süresi Doldu', 'Bu kıvılcım artık görüntülenemiyor.');
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

    Alert.alert(
      'Mesajı Sil',
      'Bu mesajı silmek istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('messages')
              .delete()
              .eq('id', item.id);
            if (error) {
              Alert.alert('Hata', 'Mesaj silinemedi.');
            } else {
              setMessages(prev => prev.filter(m => m.id !== item.id));
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
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
            <View style={[styles.messageContainer, !isMe && styles.theirMessage]}>
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
                    <Camera color={isMe ? SnapColors.white : SnapColors.blue} size={20} />
                    <Text style={[styles.snapText, isMe ? styles.mySnapText : styles.theirSnapText]}>
                      {isExpired ? '🔒 Süre doldu' : isOpened && !isMe ? '👁 Açıldı' : 'Kıvılcım'}
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
                      <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>Görüldü</Text>
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
            <View style={[styles.messageContainer, !isMe && styles.theirMessage]}>
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
                    isMe ? styles.myBubble : (isDark ? styles.theirBubbleDark : styles.theirBubble),
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
                      <Text style={styles.kivilcimReplyThumbLabelText}>Kıvılcım</Text>
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
                      <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>Görüldü</Text>
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
          <View style={[styles.messageContainer, !isMe && styles.theirMessage]}>
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
                  isMe ? styles.myBubble : (isDark ? styles.theirBubbleDark : styles.theirBubble),
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
                    <Text style={[styles.seenLabel, isMe && styles.seenLabelMe]}>Görüldü</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {heartMeta(item, isMe)}
      </View>
    );
  };

  const renderReplySwipeAction = useCallback(
    () => (
      <View style={styles.swipeReplyWrap}>
        <Reply color={SnapColors.white} size={22} strokeWidth={2.2} />
      </View>
    ),
    []
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
            color={iLiked ? SnapColors.red : SnapColors.gray}
            fill={iLiked ? SnapColors.red : 'transparent'}
            strokeWidth={2.2}
          />
          {count > 0 ? <Text style={[styles.heartCount, isDark && styles.heartCountDark]}>{count}</Text> : null}
        </TouchableOpacity>
      </View>
    );
  };

  /** Sağa kaydırınca yanıt (WhatsApp gibi): sol aksiyon paneli açılır → RNGH onSwipeableOpen direction 'left' */
  const wrapSwipeable = (item: Message, row: React.ReactElement) => (
    <Swipeable
      ref={(el) => {
        if (el) swipeableRefs.current.set(item.id, el);
        else swipeableRefs.current.delete(item.id);
      }}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      containerStyle={styles.swipeableRowContainer}
      childrenContainerStyle={styles.swipeableRowChildren}
      renderLeftActions={renderReplySwipeAction}
      onSwipeableOpen={(direction) => {
        if (direction !== 'left') return;
        setReplyingTo(item);
        requestAnimationFrame(() => {
          swipeableRefs.current.get(item.id)?.close();
        });
      }}
    >
      {row}
    </Swipeable>
  );

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
    <SafeAreaView style={[styles.root, isDark && styles.rootDark]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={isDark ? SnapColors.darkText : SnapColors.black} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('SosyalProfile', { userId: params.userId })}
            style={styles.headerUserInfo}
          >
            <Image
              source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
              style={styles.headerAvatar}
            />
            <View style={styles.headerInfo}>
              <Text style={[styles.headerName, isDark && styles.headerNameDark]}>{params.userName}</Text>
              {otherTyping ? (
                <Text style={[styles.headerTyping, isDark && styles.headerTypingDark]}>Yazıyor ✍️</Text>
              ) : (
                <Text style={[styles.headerUsername, isDark && styles.headerUsernameDark]}>@{params.username}</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SnapColors.blue} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, isDark && styles.emptyStateTextDark]}>
                  {params.userName} ile sohbete başla! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={[styles.inputOuter, isDark && styles.inputOuterDark]}>
          {replyingTo ? (
            <View style={[styles.replyBar, isDark && styles.replyBarDark]}>
              <View style={styles.replyBarAccent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.replyBarLabel, isDark && styles.replyBarLabelDark]}>Yanıtlanıyor</Text>
                <Text style={[styles.replyBarText, isDark && styles.replyBarTextDark]} numberOfLines={2}>
                  {replyingTo.content?.trim() ||
                    (replyingTo.image_url ? (replyingTo.is_snap ? '📷 Kıvılcım' : '📷 Medya') : '')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} hitSlop={12}>
                <X color={isDark ? SnapColors.darkSecondary : SnapColors.gray} size={22} />
              </TouchableOpacity>
            </View>
          ) : null}
        <View style={[styles.inputContainer, isDark && styles.inputContainerDark]}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
          >
            <Camera color={SnapColors.blue} size={24} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            placeholder="Mesaj yaz..."
            placeholderTextColor={isDark ? SnapColors.darkSecondary : SnapColors.gray}
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
              <ActivityIndicator size="small" color={SnapColors.white} />
            ) : (
              <Send color={SnapColors.white} size={20} />
            )}
          </TouchableOpacity>
        </View>
        </View>
      </KeyboardAvoidingView>

      {/* Kamera Modalı */}
      <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => setCameraVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {!capturedPhoto ? (
            <>
              <CameraView 
                ref={cameraRef} 
                style={{ flex: 1 }} 
                facing={cameraFacing}
                mirror={false}
              />
              <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, right: 0, left: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16, paddingTop: 16 }}>
                  <TouchableOpacity
                    onPress={toggleCameraFacing}
                    style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <RefreshCw color="#fff" size={20} strokeWidth={2} />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
              <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#000' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 32, paddingVertical: 20 }}>
                  <TouchableOpacity onPress={() => setCameraVisible(false)}>
                    <X color="#fff" size={28} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleTakePhoto}
                    disabled={cameraBusy}
                    style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {cameraBusy && <ActivityIndicator color="#000" />}
                  </TouchableOpacity>
                  <View style={{ width: 28 }} />
                </View>
              </SafeAreaView>
            </>
          ) : (
            <>
              <Image source={{ uri: capturedPhoto }} style={{ flex: 1 }} resizeMode="cover" />
              <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#000' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 20 }}>
                  <TouchableOpacity onPress={() => setCapturedPhoto(null)} style={{ paddingHorizontal: 24, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>Tekrar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleConfirmSnap} style={{ paddingHorizontal: 32, paddingVertical: 12, backgroundColor: SnapColors.blue, borderRadius: 24 }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Gönder</Text>
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
    backgroundColor: SnapColors.white,
  },
  rootDark: {
    backgroundColor: SnapColors.darkBg,
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
    borderBottomColor: SnapColors.lightGray,
    backgroundColor: SnapColors.white,
  },
  headerDark: {
    backgroundColor: SnapColors.darkCard,
    borderBottomColor: SnapColors.darkBorder,
  },
  backButton: {
    marginRight: 12,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: SnapColors.black,
  },
  headerNameDark: {
    color: SnapColors.darkText,
  },
  headerUsername: {
    fontSize: 13,
    color: SnapColors.gray,
    marginTop: 2,
  },
  headerUsernameDark: {
    color: SnapColors.darkSecondary,
  },
  headerTyping: {
    fontSize: 13,
    fontWeight: '600',
    color: SnapColors.blue,
    marginTop: 2,
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
    marginRight: 8,
    marginBottom: 16,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
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
    color: SnapColors.darkText,
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
    color: SnapColors.darkSecondary,
  },
  inputOuter: {
    borderTopWidth: 1,
    borderTopColor: SnapColors.lightGray,
    backgroundColor: SnapColors.white,
  },
  inputOuterDark: {
    borderTopColor: SnapColors.darkBorder,
    backgroundColor: SnapColors.darkCard,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: SnapColors.lightGray,
  },
  replyBarDark: {
    backgroundColor: SnapColors.darkBorder,
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
    color: '#5ac8fa',
  },
  replyBarText: {
    fontSize: 13,
    color: SnapColors.black,
    lineHeight: 18,
  },
  replyBarTextDark: {
    color: SnapColors.darkText,
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
  },
  swipeableRowContainer: {
    width: '100%',
  },
  swipeableRowChildren: {
    width: '100%',
    flexShrink: 0,
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
    paddingVertical: 10,
    borderRadius: 20,
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
    backgroundColor: SnapColors.blue,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: SnapColors.lightGray,
    borderBottomLeftRadius: 4,
  },
  theirBubbleDark: {
    backgroundColor: SnapColors.darkCard,
    borderBottomLeftRadius: 4,
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
    color: SnapColors.darkText,
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
    color: SnapColors.darkSecondary,
  },
  snapBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  mySnapBubble: {
    backgroundColor: SnapColors.blue,
    borderBottomRightRadius: 4,
  },
  theirSnapBubble: {
    backgroundColor: SnapColors.lightGray,
    borderBottomLeftRadius: 4,
  },
  theirSnapBubbleDark: {
    backgroundColor: SnapColors.darkCard,
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
    color: SnapColors.darkSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: SnapColors.white,
  },
  inputContainerDark: {
    backgroundColor: SnapColors.darkCard,
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
    backgroundColor: SnapColors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
    color: SnapColors.black,
  },
  inputDark: {
    backgroundColor: SnapColors.darkBorder,
    color: SnapColors.darkText,
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
