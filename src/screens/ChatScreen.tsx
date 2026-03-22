import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, Camera, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { supabase, processImageUrl } from '@/lib/supabase';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Snapchat Renk Paleti
const SnapColors = {
  yellow: '#FFFC00',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#8E8E93',
  lightGray: '#F2F2F7',
  blue: '#0FADFF',
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
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const flatListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (!params.userId || params.userId === '') {
          Alert.alert('Hata', 'Kullanıcı bilgisi bulunamadı');
          navigation.goBack();
          return;
        }

        // Arkadaşlık kontrolü
        const { data: friendship } = await supabase
          .from('friendships')
          .select('id, status')
          .eq('status', 'accepted')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${user.id})`)
          .single();

        if (!friendship) {
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
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, currentUserId]);

  const getOrCreateConversation = async (user1Id: string, user2Id: string) => {
    try {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user1Id,
        user2_id: user2Id,
      });
      if (error) throw error;
      setConversationId(data);
    } catch {
      Alert.alert('Hata', 'Sohbet başlatılamadı. Lütfen tekrar deneyin.');
      navigation.goBack();
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, content, image_url, is_read, is_snap, snap_opened_at, snap_expires_at, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);

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

    const messageContent = newMessage.trim();
    setNewMessage(''); // Input'u hemen temizle

    try {
      setSending(true);
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          content: messageContent,
        })
        .select()
        .single();

      if (error) throw error;

      // Realtime subscription mesajı ekleyecek, fallback olarak da ekle
      setTimeout(() => {
        setMessages((prev) => {
          if (prev.some(msg => msg.id === data.id)) return prev;
          return [...prev, data as Message];
        });
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch {
      Alert.alert('Hata', 'Mesaj gönderilemedi. Lütfen tekrar deneyin.');
      setNewMessage(messageContent);
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
      Alert.alert('Kamera İzni', 'Snap çekebilmek için kamera iznine ihtiyaç var.');
      return;
    }
    setCapturedPhoto(null);
    setCameraVisible(true);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || cameraBusy) return;
    try {
      setCameraBusy(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      if (photo?.uri) setCapturedPhoto(photo.uri);
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
        Alert.alert('Snap Süresi Doldu', 'Bu snap artık görüntülenemiyor.');
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === currentUserId;
    const isSnap = item.is_snap && item.image_url;
    
    // Snap için özel görünüm
    if (isSnap) {
      const isOpened = !!item.snap_opened_at;
      const isExpired = item.snap_expires_at && new Date() > new Date(item.snap_expires_at);
      const canView = isMe || (!isExpired);

      return (
        <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
          {!isMe && (
            <Image
              source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
              style={styles.messageAvatar}
            />
          )}
          <TouchableOpacity
            style={[styles.snapBubble, isMe ? styles.mySnapBubble : styles.theirSnapBubble]}
            onPress={() => handleSnapPress(item)}
            disabled={!canView}
          >
            <View style={styles.snapContent}>
              <Camera 
                color={isMe ? SnapColors.white : SnapColors.blue} 
                size={20} 
              />
              <Text style={[styles.snapText, isMe ? styles.mySnapText : styles.theirSnapText]}>
                {isExpired ? '🔒 Snap süresi doldu' : 
                 isOpened && !isMe ? '👁 Açıldı' : 
                 'Snap'}
              </Text>
            </View>
            <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
              {formatTime(item.created_at)}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Normal mesaj
    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        {!isMe && (
          <Image
            source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
            style={styles.messageAvatar}
          />
        )}
        <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
          <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color={SnapColors.black} size={24} />
          </TouchableOpacity>
          <Image
            source={{ uri: params.userAvatar || 'https://i.pravatar.cc/150' }}
            style={styles.headerAvatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{params.userName}</Text>
            <Text style={styles.headerUsername}>@{params.username}</Text>
          </View>
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
                <Text style={styles.emptyStateText}>
                  {params.userName} ile sohbete başla! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
          >
            <Camera color={SnapColors.blue} size={24} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={SnapColors.gray}
            value={newMessage}
            onChangeText={setNewMessage}
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
      </KeyboardAvoidingView>

      {/* Kamera Modalı */}
      <Modal visible={cameraVisible} animationType="slide" onRequestClose={() => setCameraVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {!capturedPhoto ? (
            <>
              <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SnapColors.white,
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
  backButton: {
    marginRight: 12,
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
  headerUsername: {
    fontSize: 13,
    color: SnapColors.gray,
    marginTop: 2,
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
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: SnapColors.blue,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: SnapColors.lightGray,
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
  snapBubble: {
    maxWidth: '70%',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: SnapColors.lightGray,
    backgroundColor: SnapColors.white,
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
