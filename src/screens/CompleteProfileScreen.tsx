import React, { useState, useEffect } from 'react';
import { AppAlert } from '@/lib/alert';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Check, X as XIcon, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Clean } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { PRIVACY_POLICY_TEXT, TERMS_OF_USE_TEXT } from '@/constants/legalTexts';

const CompleteProfileScreen = () => {
  const navigation = useNavigation();
  const { t: tr } = useTranslation();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [hasExistingUsername, setHasExistingUsername] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [legalModalDoc, setLegalModalDoc] = useState<'privacy' | 'terms' | null>(null);

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
        setHasExistingUsername(!!profile.username);
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
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        AppAlert.alert(tr('completeProfile.izinGerekli'), tr('completeProfile.izinMesaji'));
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
    } catch (e) {
      AppAlert.alert(tr('common.error'), tr('completeProfile.fotoSecmeHatasi'));
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
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('Avatar upload error:', error);
      return null;
    }
  };

  const handleBack = () => {
    AppAlert.alert(
      tr('completeProfile.cikisYapilsinMi'),
      tr('completeProfile.cikisYapilsinMiAciklama'),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('completeProfile.cikisYap'),
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' as never }],
            });
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      AppAlert.alert(tr('common.error'), tr('completeProfile.adGirin'));
      return;
    }

    if (!acceptedTerms) {
      AppAlert.alert(tr('common.error'), tr('completeProfile.sartlariKabulEt'));
      return;
    }

    if (!hasExistingUsername) {
      const cleanUsername = username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        AppAlert.alert(tr('common.error'), tr('completeProfile.kullaniciAdiGecersiz'));
        return;
      }
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

      // Profil satırı yoksa oluştur, varsa güncelle
      const { error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: user.id,
            name: name.trim(),
            avatar_url: avatarUrl,
            ...(hasExistingUsername ? {} : { username: username.trim().toLowerCase() }),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        if (error.code === '23505') {
          AppAlert.alert(tr('common.error'), tr('completeProfile.kullaniciAdiKullanimda'));
          return;
        }
        throw error;
      }

      // Ana sayfaya yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' as never, params: { screen: 'Home' } as never }],
      });
    } catch (error: any) {
      console.error('Profile completion error:', error);
      AppAlert.alert(tr('common.error'), error.message || tr('completeProfile.guncellemeHatasi'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: Clean.bg }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {loadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Clean.ctaBg} />
            <Text style={styles.loadingText}>{tr('completeProfile.profilYukleniyor')}</Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Geri / Çıkış */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ArrowLeft color={Clean.textPrimary} size={22} />
              </TouchableOpacity>

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>{tr('completeProfile.title')}</Text>
                <Text style={styles.subtitle}>
                  {tr('completeProfile.hosGeldin')}
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
                    <Camera color={Clean.textMuted} size={32} />
                  </View>
                )}
                <View style={styles.avatarBadge}>
                  <Camera color={Clean.ctaText} size={16} />
                </View>
              </TouchableOpacity>

              {/* Inputs */}
              <View style={styles.inputsContainer}>
                {/* Kullanıcı Adı */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>{tr('completeProfile.kullaniciAdin')}</Text>
                  {hasExistingUsername ? (
                    <View style={[styles.input, styles.inputDisabled]}>
                      <Text style={styles.inputDisabledText}>@{username}</Text>
                    </View>
                  ) : (
                    <TextInput
                      placeholder="ornek_kullanici"
                      placeholderTextColor={Clean.textMuted}
                      style={styles.input}
                      value={username}
                      onChangeText={(val) => setUsername(val.replace(/[^a-zA-Z0-9_]/g, ''))}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                    />
                  )}
                  <Text style={styles.inputHint}>
                    {hasExistingUsername
                      ? tr('completeProfile.kullaniciAdiDegismez')
                      : tr('completeProfile.kullaniciAdiOlustur')}
                  </Text>
                </View>

                {/* İsim */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputLabel}>{tr('completeProfile.adinSoyadin')}</Text>
                  <TextInput
                    placeholder={tr('completeProfile.adPlaceholder')}
                    placeholderTextColor={Clean.textMuted}
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                  <Text style={styles.inputHint}>
                    {tr('completeProfile.gercekAdOneri')}
                  </Text>
                </View>
              </View>

              {/* Şartlar/Gizlilik onayı */}
              <TouchableOpacity
                style={styles.termsRow}
                activeOpacity={0.8}
                onPress={() => setAcceptedTerms((v) => !v)}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <Check color={Clean.ctaText} size={14} strokeWidth={3} />}
                </View>
                <Text style={styles.termsText}>
                  {tr('completeProfile.sartlariOkudumOncesi')}{' '}
                  <Text style={styles.termsLink} onPress={() => setLegalModalDoc('terms')}>
                    {tr('completeProfile.kullanimSartlari')}
                  </Text>
                  {' '}{tr('completeProfile.ve')}{' '}
                  <Text style={styles.termsLink} onPress={() => setLegalModalDoc('privacy')}>
                    {tr('completeProfile.gizlilikPolitikasi')}
                  </Text>
                  {"'"}{tr('completeProfile.niOkudumKabulEdiyorum')}
                </Text>
              </TouchableOpacity>

              {/* Complete Button */}
              <TouchableOpacity
                style={[styles.completeButton, !acceptedTerms && styles.completeButtonDisabled]}
                onPress={handleComplete}
                disabled={loading || !acceptedTerms}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={Clean.ctaText} />
                ) : (
                  <>
                    <Check color={Clean.ctaText} size={22} />
                    <Text style={styles.completeButtonText}>{tr('completeProfile.tamamla')}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>

      <Modal
        visible={legalModalDoc !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setLegalModalDoc(null)}
      >
        <View style={styles.legalModalBackdrop}>
          <View style={styles.legalModalCard}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>
                {legalModalDoc === 'terms' ? tr('completeProfile.kullanimSartlari') : tr('completeProfile.gizlilikPolitikasi')}
              </Text>
              <TouchableOpacity onPress={() => setLegalModalDoc(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <XIcon color={Clean.textPrimary} size={22} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.legalModalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.legalModalText}>
                {legalModalDoc === 'terms' ? TERMS_OF_USE_TEXT : PRIVACY_POLICY_TEXT}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: Clean.textSecondary,
    fontSize: 16,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Clean.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Clean.textSecondary,
    textAlign: 'center',
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 36,
    position: 'relative',
  },
  avatar: {
    width: 116,
    height: 116,
    borderRadius: 58,
    borderWidth: 1.5,
    borderColor: '#111114',
  },
  avatarPlaceholder: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: Clean.surfaceSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#111114',
    borderStyle: 'dashed',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Clean.ctaBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Clean.bg,
  },
  inputsContainer: {
    gap: 22,
    marginBottom: 36,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Clean.textPrimary,
    marginLeft: 4,
  },
  input: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#111114',
    backgroundColor: Clean.surface,
    paddingHorizontal: 16,
    color: Clean.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  inputDisabled: {
    backgroundColor: Clean.surfaceSoft,
    justifyContent: 'center',
  },
  inputDisabledText: {
    color: Clean.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  inputHint: {
    fontSize: 12,
    color: Clean.textMuted,
    marginLeft: 4,
  },
  completeButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: Clean.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '76%',
    alignSelf: 'center',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: Clean.ctaText,
  },
  completeButtonDisabled: {
    opacity: 0.45,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Clean.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Clean.ctaBg,
    borderColor: Clean.ctaBg,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: Clean.textSecondary,
  },
  termsLink: {
    color: Clean.ctaBg,
    fontWeight: '700',
  },
  legalModalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  legalModalCard: {
    backgroundColor: Clean.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingTop: 16,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  legalModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Clean.textPrimary,
  },
  legalModalBody: {
    paddingHorizontal: 20,
  },
  legalModalText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: Clean.textSecondary,
    paddingBottom: 32,
  },
});

export default CompleteProfileScreen;
