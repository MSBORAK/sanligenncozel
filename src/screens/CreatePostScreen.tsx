import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Image as ImageIcon, Send, Camera as CameraIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const SnapColors = {
  yellow: '#FFFC00',
  black: '#000000',
  white: '#FFFFFF',
  blue: '#0FADFF',
};

const CreatePostScreen = ({ route }: any) => {
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState<string | null>(route?.params?.imageUri || null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Dosya adı oluştur
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Fetch ile dosyayı al
      const response = await fetch(uri);
      const blob = await response.blob();

      // ArrayBuffer'a çevir
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Supabase'e yükle
      const { data, error } = await supabase.storage
        .from('social-media')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (error) throw error;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('social-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      return null;
    }
  };

  const handlePost = async () => {
    if (!imageUri) {
      Alert.alert('Hata', 'Lütfen bir resim ekleyin.');
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

      // Hikaye olarak paylaş (24 saat sonra silinecek, herkese açık)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error } = await supabase
        .from('social_stories')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          recipient_id: null, // Herkese açık hikaye
          expires_at: expiresAt.toISOString(),
        });

      if (error) throw error;

      Alert.alert(
        'Başarılı', 
        'Hikayeniz paylaşıldı! 24 saat sonra silinecek.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Story creation error:', error);
      Alert.alert('Hata', 'Hikaye oluşturulurken bir hata oluştu.');
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
          <Text style={styles.headerTitle}>Hikaye Ekle</Text>
          <View style={{ width: 28 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image Preview or Camera Options */}
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setImageUri(null)}
                >
                  <X color={SnapColors.white} size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraOptions}>
                <TouchableOpacity
                  style={styles.cameraOptionButton}
                  onPress={takePhoto}
                >
                  <View style={styles.cameraIconContainer}>
                    <CameraIcon color={SnapColors.white} size={40} />
                  </View>
                  <Text style={styles.cameraOptionText}>Fotoğraf Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraOptionButton}
                  onPress={pickImage}
                >
                  <View style={styles.galleryIconContainer}>
                    <ImageIcon color={SnapColors.white} size={40} />
                  </View>
                  <Text style={styles.cameraOptionText}>Galeriden Seç</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📸 Hikayeniz tüm arkadaşlarınız tarafından görülebilir
              </Text>
              <Text style={styles.infoText}>
                ⏰ 24 saat sonra otomatik olarak silinir
              </Text>
            </View>
          </ScrollView>

          {/* Send Button */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={uploading || !imageUri}
            style={[
              styles.sendButton,
              (uploading || !imageUri) && styles.sendButtonDisabled,
            ]}
          >
            {uploading ? (
              <ActivityIndicator color={SnapColors.white} size="small" />
            ) : (
              <>
                <Send color={SnapColors.white} size={20} />
                <Text style={styles.sendButtonText}>Hikaye Olarak Paylaş</Text>
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
  postButton: {
    backgroundColor: SnapColors.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  cameraOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 40,
    gap: 20,
  },
  cameraOptionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  cameraIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: SnapColors.blue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: SnapColors.white,
  },
  imagePreviewContainer: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
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
  infoBox: {
    marginTop: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  recipientsButton: {
    position: 'relative',
    padding: 8,
  },
  recipientBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF2D55',
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

export default CreatePostScreen;
