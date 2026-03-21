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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Check } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Gradients } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Mevcut profil bilgilerini yükle
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        setName(profile.name || '');
        if (profile.avatar_url) {
          setAvatarUri(profile.avatar_url);
        }
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { data, error } = await supabase.storage
        .from('social-media')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('social-media')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen adınızı girin');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Kullanıcı bulunamadı');

      // Avatar yükle (varsa)
      let avatarUrl: string | null = null;
      if (avatarUri) {
        avatarUrl = await uploadAvatar(avatarUri);
      }

      // Profili GÜNCELLE (insert değil update)
      const { error } = await supabase
        .from('user_profiles')
        .update({
          name: name.trim(),
          avatar_url: avatarUrl,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Ana sayfaya yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never, params: { screen: 'Home' } as never }],
      });
    } catch (error: any) {
      console.error('Profile completion error:', error);
      Alert.alert('Hata', error.message || 'Profil güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient 
        colors={Gradients.background} 
        style={StyleSheet.absoluteFill} 
      />

      <SafeAreaView style={styles.container} edges={['top']}>
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primaryHex} />
            <Text style={styles.loadingText}>Profil yükleniyor...</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Profilini Tamamla</Text>
            <Text style={styles.subtitle}>
              Şanlı Genç topluluğuna hoş geldin! 🎉
            </Text>
          </View>

          {/* Avatar */}
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Camera color={Colors.white} size={32} />
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Camera color={Colors.white} size={16} />
            </View>
          </TouchableOpacity>

          {/* Inputs */}
          <View style={styles.inputsContainer}>
            {/* Kullanıcı Adı (Sadece Gösterim) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Kullanıcı Adın</Text>
              <View style={[styles.input, styles.inputDisabled]}>
                <Text style={styles.inputDisabledText}>@{username}</Text>
              </View>
              <Text style={styles.inputHint}>
                Kullanıcı adın değiştirilemez
              </Text>
            </View>

            {/* İsim */}
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Adın Soyadın</Text>
              <TextInput
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.input}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <Text style={styles.inputHint}>
                Gerçek adını kullanmanı öneririz
              </Text>
            </View>
          </View>

          {/* Complete Button */}
          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={loading}
          >
            <LinearGradient
              colors={Gradients.heroWarm}
              style={styles.completeButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Check color={Colors.white} size={24} />
                  <Text style={styles.completeButtonText}>Tamamla</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </KeyboardAvoidingView>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primaryHex,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryHex,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background,
  },
  inputsContainer: {
    gap: 24,
    marginBottom: 40,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.buff,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    color: Colors.white,
    fontSize: 16,
  },
  inputDisabled: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
  },
  inputDisabledText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: 4,
  },
  completeButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: Colors.primaryHex,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  completeButtonGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default CompleteProfileScreen;
