import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, Check, Users } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase, processImageUrl } from '@/lib/supabase';

const SnapColors = {
  yellow: '#FFFC00',
  black: '#000000',
  white: '#FFFFFF',
  blue: '#0FADFF',
  red: '#FF2D55',
};

interface UserProfile {
  user_id: string;
  username: string;
  name: string;
  avatar_url: string | null;
}

const SendSnapScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const imageUri = route?.params?.imageUri;
  const preselectedRecipientId = route?.params?.recipientId;
  
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>(
    preselectedRecipientId ? [preselectedRecipientId] : []
  );
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, username, name, avatar_url')
        .neq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      if (data) setAllUsers(data);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const toggleRecipient = (userId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedRecipients(allUsers.map(u => u.user_id));
  };

  const clearAllUsers = () => {
    setSelectedRecipients([]);
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { data, error } = await supabase.storage
        .from('social-media')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('social-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const getOrCreateConversation = async (recipientId: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        user1_id: user.id,
        user2_id: recipientId,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  };

  const handleSendSnap = async () => {
    if (!imageUri) {
      Alert.alert('Hata', 'Resim bulunamadı.');
      return;
    }

    if (selectedRecipients.length === 0) {
      Alert.alert('Hata', 'Lütfen en az bir kişi seçin.');
      return;
    }

    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Hata', 'Giriş yapmanız gerekiyor.');
        return;
      }

      // Resmi yükle
      const imageUrl = await uploadImage(imageUri);
      if (!imageUrl) {
        Alert.alert('Hata', 'Resim yüklenirken bir hata oluştu.');
        setUploading(false);
        return;
      }

      // Her seçili kullanıcıya snap gönder (mesaj olarak)
      const messagePromises = selectedRecipients.map(async (recipientId) => {
        // Sohbet oluştur veya bul
        const conversationId = await getOrCreateConversation(recipientId);
        if (!conversationId) return null;

        // Snap mesajı gönder
        const messageContent = content.trim() || '📷 Snap';
        
        const { error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            content: messageContent,
            image_url: imageUrl,
            is_snap: true, // Snap olarak işaretle
            snap_opened_at: null, // Henüz açılmadı
            snap_expires_at: null, // Açıldığında ayarlanacak
          });

        if (error) throw error;
        return conversationId;
      });

      await Promise.all(messagePromises);

      Alert.alert(
        'Başarılı', 
        `Snap ${selectedRecipients.length} kişiye gönderildi!`,
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Send snap error:', error);
      Alert.alert('Hata', 'Snap gönderilirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient 
        colors={[SnapColors.black, SnapColors.black]} 
        style={StyleSheet.absoluteFill} 
      />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <X color={SnapColors.white} size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Snap Gönder</Text>
          <TouchableOpacity
            onPress={() => setShowRecipientSelector(true)}
            style={styles.recipientsButton}
          >
            <Users color={SnapColors.white} size={24} />
            {selectedRecipients.length > 0 && (
              <View style={styles.recipientBadge}>
                <Text style={styles.recipientBadgeText}>{selectedRecipients.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recipient Selector Modal */}
        <Modal
          visible={showRecipientSelector}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Kime Gönderilsin?</Text>
                <TouchableOpacity onPress={() => setShowRecipientSelector(false)}>
                  <X color={SnapColors.black} size={24} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={selectAllUsers}
                >
                  <Text style={styles.actionButtonText}>Hepsini Seç</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={clearAllUsers}
                >
                  <Text style={styles.actionButtonText}>Temizle</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={allUsers}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => {
                  const isSelected = selectedRecipients.includes(item.user_id);
                  return (
                    <TouchableOpacity
                      style={styles.userItem}
                      onPress={() => toggleRecipient(item.user_id)}
                    >
                      <Image
                        source={{ uri: processImageUrl(item.avatar_url) || 'https://i.pravatar.cc/150' }}
                        style={styles.userAvatar}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.name}</Text>
                        <Text style={styles.userUsername}>@{item.username}</Text>
                      </View>
                      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                        {isSelected && <Check color={SnapColors.white} size={16} />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Kullanıcı bulunamadı</Text>
                  </View>
                }
              />

              <TouchableOpacity
                style={[styles.doneButton, selectedRecipients.length === 0 && styles.doneButtonDisabled]}
                onPress={() => setShowRecipientSelector(false)}
                disabled={selectedRecipients.length === 0}
              >
                <Text style={styles.doneButtonText}>
                  Tamam ({selectedRecipients.length} kişi)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Preview */}
            {imageUri && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              </View>
            )}

            {/* Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                placeholder="Snap'ine bir şeyler ekle..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                multiline
                value={content}
                onChangeText={setContent}
                style={styles.textInput}
                maxLength={200}
              />
              <Text style={styles.charCount}>{content.length}/200</Text>
            </View>
          </ScrollView>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handleSendSnap}
            disabled={uploading || !imageUri || selectedRecipients.length === 0}
            style={[
              styles.sendButton,
              (uploading || !imageUri || selectedRecipients.length === 0) && styles.sendButtonDisabled,
            ]}
          >
            {uploading ? (
              <ActivityIndicator color={SnapColors.white} size="small" />
            ) : (
              <>
                <Send color={SnapColors.white} size={20} />
                <Text style={styles.sendButtonText}>
                  {selectedRecipients.length > 0 
                    ? `${selectedRecipients.length} Kişiye Gönder` 
                    : 'Kişi Seç'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SnapColors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  imagePreviewContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  textInputContainer: {
    marginTop: 20,
  },
  textInput: {
    fontSize: 16,
    color: SnapColors.white,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    marginTop: 8,
  },
  recipientsButton: {
    position: 'relative',
    padding: 8,
  },
  recipientBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: SnapColors.red,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  recipientBadgeText: {
    color: SnapColors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  sendButton: {
    backgroundColor: SnapColors.blue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: SnapColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: SnapColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: SnapColors.black,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: SnapColors.black,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: SnapColors.black,
  },
  userUsername: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d0d0d0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: SnapColors.blue,
    borderColor: SnapColors.blue,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  doneButton: {
    backgroundColor: SnapColors.blue,
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    color: SnapColors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default SendSnapScreen;
