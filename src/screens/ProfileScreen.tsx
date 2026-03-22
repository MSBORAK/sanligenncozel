import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Platform, Switch, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Bell, ShieldCheck, LogOut, User as UserIcon, X, Settings, HelpCircle, Info, Edit3, ArrowLeft, Moon, MessageSquare, Send, AlertCircle, Lightbulb, Heart, Users } from 'lucide-react-native';
import { Colors, Gradients, DribbbleColors } from '@/constants/Colors';
import { MOCK_USER } from '@/api/mockData';
import { useThemeMode } from '@/context/ThemeContext';
import { useFavorites } from '@/context/FavoritesContext';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';

type Nav = StackNavigationProp<RootStackParamList>;

const ProfileScreen = () => {
  const { mode, modeLabel, toggleTheme } = useThemeMode();
  const { profile, refreshProfile } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [accountSettingsVisible, setAccountSettingsVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [eventNotificationsEnabled, setEventNotificationsEnabled] = useState(true);
  const [discountNotificationsEnabled, setDiscountNotificationsEnabled] = useState(true);
  const [locationNotificationsEnabled, setLocationNotificationsEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [personalizationEnabled, setPersonalizationEnabled] = useState(true);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'complaint' | 'bug' | 'feature'>('complaint');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [friendCount, setFriendCount] = useState(0);
  const navigation = useNavigation<Nav>();

  const userName = profile?.name || MOCK_USER.name;
  const userUsername = profile?.username || '';
  const userEmail = profile?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();
  const isDark = mode === 'dark';
  const { events: favEvents, partners: favPartners, heritage: favHeritage, stops: favStops } = useFavorites();
  const favoritesCount = favEvents.length + favPartners.length + favHeritage.length + favStops.length;

  useEffect(() => {
    if (!profile?.userId) return;
    supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`sender_id.eq.${profile.userId},receiver_id.eq.${profile.userId}`)
      .then(({ count }) => setFriendCount(count || 0));
  }, [profile?.userId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const MenuItem = ({ label, icon, onPress, isLast, isDestructive }: { label: string, icon: React.ReactNode, onPress?: () => void, isLast?: boolean, isDestructive?: boolean }) => (
    <TouchableOpacity 
      style={[styles.menuItem, isLast && styles.menuItemLast, isDark && { borderBottomColor: Colors.dark.border }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIconContainer}>
          {icon}
        </View>
        <Text style={[styles.menuItemText, isDark && { color: Colors.dark.text }, isDestructive && { color: Colors.accent }]}>
          {label}
        </Text>
      </View>
      <ChevronRight color={isDark ? Colors.dark.textMuted : DribbbleColors.textSecondary} size={20} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.root, isDark ? { backgroundColor: Colors.dark.background } : { backgroundColor: DribbbleColors.background }]} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        bounces={true}
      >
          {/* Gradient Header */}
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={isDark ? Gradients.header : [DribbbleColors.progressBlue, '#60a5fa']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientHeader}
            >
            </LinearGradient>
            
            {/* Avatar Section - Overlapping Header */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatarWrapper}>
                <LinearGradient
                  colors={isDark ? Gradients.header : [DribbbleColors.progressBlue, '#60a5fa']}
                  style={styles.avatarGradientBorder}
                >
                  <View style={[styles.avatarInner, isDark && { backgroundColor: Colors.dark.card }, !isDark && { backgroundColor: DribbbleColors.lavender }]}>
                    <Text style={[styles.avatarText, isDark && { color: Colors.dark.text }, !isDark && { color: DribbbleColors.progressBlue }]}>{userInitial}</Text>
                  </View>
                </LinearGradient>
              </View>
              <Text style={[styles.userName, isDark && { color: Colors.dark.text }]}>{userName}</Text>
              {userUsername ? (
                <Text style={[styles.userStatus, isDark && { color: Colors.dark.textMuted }]}>@{userUsername}</Text>
              ) : (
                <Text style={[styles.userStatus, isDark && { color: Colors.dark.textMuted }]}>{MOCK_USER.status}</Text>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <Users size={14} color={isDark ? '#f59e0b' : DribbbleColors.progressBlue} strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#f59e0b' : DribbbleColors.progressBlue }}>
                  {friendCount} arkadaş
                </Text>
              </View>
            </View>
          </View>

          {/* Verification Card */}
          {!MOCK_USER.isVerified && (
            <TouchableOpacity 
              style={[styles.verificationCard, isDark && { backgroundColor: Colors.dark.card, borderColor: Colors.dark.border }]} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={styles.verificationContent}>
                <View style={styles.verificationIcon}>
                  <ShieldCheck color="#f59e0b" size={20} />
                </View>
                <View style={styles.verificationTextContainer}>
                  <Text style={[styles.verificationTitle, isDark && { color: '#fbbf24' }]}>Hesabını Doğrula</Text>
                  <Text style={[styles.verificationSubtitle, isDark && { color: '#d4a574' }]}>
                    Tüm avantajlardan yararlan
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Kullanıcı Bilgileri */}

          {/* Settings Menu Items */}
          <View style={styles.menuSection}>
            <View style={[styles.menuCard, isDark && { backgroundColor: Colors.dark.card }, !isDark && { backgroundColor: DribbbleColors.cardWhite }]}>
              <MenuItem 
                label={favoritesCount > 0 ? `Favorilerim (${favoritesCount})` : 'Favorilerim'} 
                icon={<Heart color={isDark ? Colors.dark.accent : DribbbleColors.progressBlue} size={22} fill={favoritesCount > 0 ? (isDark ? Colors.dark.accent : DribbbleColors.progressBlue) : 'transparent'} />}
                onPress={() => navigation.navigate('Events', { initialTab: 'Favorilerim' })}
              />
              <MenuItem 
                label="Hesap Ayarları" 
                icon={<UserIcon color={isDark ? '#fff' : DribbbleColors.textPrimary} size={22} />}
                onPress={() => {
                  setEditName(userName);
                  setEditEmail(userEmail);
                  setAccountSettingsVisible(true);
                }}
              />
              <MenuItem
                label="Gizlilik ve Güvenlik"
                icon={<ShieldCheck color={isDark ? '#fff' : DribbbleColors.textPrimary} size={22} />}
                onPress={() => setPrivacyModalVisible(true)}
              />
              <MenuItem
                label="Geri Bildirim"
                icon={<MessageSquare color={isDark ? '#fff' : DribbbleColors.textPrimary} size={22} />}
                onPress={() => setFeedbackModalVisible(true)}
                isLast
              />
            </View>
          </View>

          {/* Notification Toggle */}
          <View style={styles.menuSection}>
            <View style={[styles.menuCard, isDark && { backgroundColor: Colors.dark.card }, !isDark && { backgroundColor: DribbbleColors.cardWhite }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchIconContainer}>
                  <Bell color={isDark ? '#fff' : DribbbleColors.textPrimary} size={22} />
                </View>
                <Text style={[styles.switchLabel, isDark && { color: Colors.dark.text }]}>Bildirimler</Text>
                <Switch
                  value={eventNotificationsEnabled}
                  onValueChange={setEventNotificationsEnabled}
                  thumbColor="#fff"
                  trackColor={{ false: '#d1d5db', true: isDark ? '#10b981' : DribbbleColors.progressBlue }}
                  ios_backgroundColor="#d1d5db"
                />
              </View>
            </View>
          </View>

          {/* Dark Mode Toggle */}
          <View style={styles.menuSection}>
            <View style={[styles.menuCard, isDark && { backgroundColor: Colors.dark.card }, !isDark && { backgroundColor: DribbbleColors.cardWhite }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchIconContainer}>
                  <Moon color={isDark ? '#fff' : DribbbleColors.textPrimary} size={22} />
                </View>
                <Text style={[styles.switchLabel, isDark && { color: Colors.dark.text }]}>
                  {modeLabel}
                </Text>
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  thumbColor="#fff"
                  trackColor={{ false: '#d1d5db', true: isDark ? '#3b82f6' : '#10b981' }}
                  ios_backgroundColor="#d1d5db"
                />
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <View style={styles.menuSection}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>

          {/* Verification Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(!modalVisible)}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBackdrop}
            >
              <View style={[styles.modalView, isDark && { backgroundColor: Colors.dark.card }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <X color={isDark ? '#94a3b8' : '#9ca3af'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isDark && { color: Colors.dark.text }]}>Numara ile Doğrulama</Text>
                <Text style={[styles.modalSubtitle, isDark && { color: Colors.dark.textMuted }]}>
                  Avantajlardan yararlanmak için telefon numaranızı doğrulamanız gerekmektedir.
                </Text>
                <TextInput
                  placeholder="Telefon Numaranız"
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  style={[styles.modalInput, isDark && { backgroundColor: '#334155', color: '#f8fafc' }]}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus={true}
                />
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Doğrula ve Devam Et</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>

          {/* Privacy Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={privacyModalVisible}
            onRequestClose={() => setPrivacyModalVisible(!privacyModalVisible)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalView, isDark && { backgroundColor: Colors.dark.card }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setPrivacyModalVisible(false)}>
                  <X color={isDark ? '#94a3b8' : '#9ca3af'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isDark && { color: Colors.dark.text }]}>Gizlilik ve Güvenlik</Text>
                <Text style={[styles.modalSubtitle, isDark && { color: Colors.dark.textMuted }]}>
                  Uygulamamız, kişisel verilerinizi güvenli bir şekilde saklar ve işler. Konum, kullanım ve tercih bilgilerinizi yalnızca hizmetleri iyileştirmek ve size daha uygun içerikler sunmak için kullanırız.{'\n\n'}
                  Verileriniz şifrelenmiş olarak saklanır ve üçüncü taraflarla paylaşılmaz. Kişisel bilgilerinize her zaman buradan erişebilir ve güncelleyebilirsiniz.
                </Text>
                <TouchableOpacity style={styles.modalButton} onPress={() => setPrivacyModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Anladım</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Account Settings Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={accountSettingsVisible}
            onRequestClose={() => setAccountSettingsVisible(!accountSettingsVisible)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalView, isDark && { backgroundColor: Colors.dark.card }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setAccountSettingsVisible(false)}>
                  <X color={isDark ? '#94a3b8' : '#9ca3af'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isDark && { color: Colors.dark.text }]}>Hesap Ayarları</Text>
                
                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
                  <Text style={[styles.inputLabel, isDark && { color: Colors.dark.textMuted }]}>Kullanıcı Adı</Text>
                  <TextInput
                    placeholder="Kullanıcı Adı"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    style={[styles.modalInput, isDark && { backgroundColor: '#334155', color: '#f8fafc' }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoCapitalize="words"
                  />

                  <Text style={[styles.inputLabel, isDark && { color: Colors.dark.textMuted }]}>E-posta</Text>
                  <TextInput
                    placeholder="ornek@email.com"
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    style={[styles.modalInput, isDark && { backgroundColor: '#334155', color: '#f8fafc' }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </ScrollView>

                <TouchableOpacity 
                  style={styles.modalButton} 
                  onPress={async () => {
                    if (profile?.userId) {
                      await supabase
                        .from('user_profiles')
                        .update({ name: editName.trim() })
                        .eq('user_id', profile.userId);
                      await refreshProfile();
                    }
                    setAccountSettingsVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Feedback Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={feedbackModalVisible}
            onRequestClose={() => setFeedbackModalVisible(!feedbackModalVisible)}
          >
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalBackdrop}
            >
              <View style={[styles.modalView, isDark && { backgroundColor: Colors.dark.card }]}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setFeedbackModalVisible(false)}>
                  <X color={isDark ? '#94a3b8' : '#9ca3af'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, isDark && { color: Colors.dark.text }]}>Geri Bildirim</Text>
                <Text style={[styles.modalSubtitle, isDark && { color: Colors.dark.textMuted }]}>
                  Görüşleriniz bizim için çok değerli. Lütfen geri bildiriminizi paylaşın.
                </Text>

                {/* Feedback Type Selection */}
                <View style={styles.feedbackTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackTypeButton,
                      feedbackType === 'complaint' && styles.feedbackTypeButtonActive,
                      isDark && feedbackType === 'complaint' && { backgroundColor: '#334155' },
                      isDark && { borderColor: '#475569' }
                    ]}
                    onPress={() => setFeedbackType('complaint')}
                  >
                    <AlertCircle color={feedbackType === 'complaint' ? (isDark ? '#f8fafc' : DribbbleColors.progressBlue) : (isDark ? '#94a3b8' : DribbbleColors.textSecondary)} size={20} />
                    <Text style={[
                      styles.feedbackTypeText,
                      feedbackType === 'complaint' && styles.feedbackTypeTextActive,
                      isDark && { color: feedbackType === 'complaint' ? '#f8fafc' : '#94a3b8' }
                    ]}>
                      Şikayet/Öneri
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackTypeButton,
                      feedbackType === 'bug' && styles.feedbackTypeButtonActive,
                      isDark && feedbackType === 'bug' && { backgroundColor: '#334155' },
                      isDark && { borderColor: '#475569' }
                    ]}
                    onPress={() => setFeedbackType('bug')}
                  >
                    <AlertCircle color={feedbackType === 'bug' ? (isDark ? '#f8fafc' : DribbbleColors.progressBlue) : (isDark ? '#94a3b8' : DribbbleColors.textSecondary)} size={20} />
                    <Text style={[
                      styles.feedbackTypeText,
                      feedbackType === 'bug' && styles.feedbackTypeTextActive,
                      isDark && { color: feedbackType === 'bug' ? '#f8fafc' : '#94a3b8' }
                    ]}>
                      Hata Bildirimi
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.feedbackTypeButton,
                      feedbackType === 'feature' && styles.feedbackTypeButtonActive,
                      isDark && feedbackType === 'feature' && { backgroundColor: '#334155' },
                      isDark && { borderColor: '#475569' }
                    ]}
                    onPress={() => setFeedbackType('feature')}
                  >
                    <Lightbulb color={feedbackType === 'feature' ? (isDark ? '#f8fafc' : DribbbleColors.progressBlue) : (isDark ? '#94a3b8' : DribbbleColors.textSecondary)} size={20} />
                    <Text style={[
                      styles.feedbackTypeText,
                      feedbackType === 'feature' && styles.feedbackTypeTextActive,
                      isDark && { color: feedbackType === 'feature' ? '#f8fafc' : '#94a3b8' }
                    ]}>
                      Özellik İsteği
                    </Text>
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScrollView}>
                  <Text style={[styles.inputLabel, isDark && { color: Colors.dark.textMuted }]}>Başlık</Text>
                  <TextInput
                    placeholder={feedbackType === 'complaint' ? 'Şikayet/Öneri başlığı' : feedbackType === 'bug' ? 'Hata başlığı' : 'Özellik isteği başlığı'}
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    style={[styles.modalInput, isDark && { backgroundColor: '#334155', color: '#f8fafc' }]}
                    value={feedbackTitle}
                    onChangeText={setFeedbackTitle}
                    autoCapitalize="sentences"
                  />

                  <Text style={[styles.inputLabel, isDark && { color: Colors.dark.textMuted }]}>Açıklama</Text>
                  <TextInput
                    placeholder={feedbackType === 'complaint' ? 'Lütfen şikayet veya önerinizi detaylı bir şekilde yazın...' : feedbackType === 'bug' ? 'Hatanın nasıl oluştuğunu ve ne yaptığınızı açıklayın...' : 'İstediğiniz özelliği detaylı bir şekilde açıklayın...'}
                    placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                    style={[styles.modalTextArea, isDark && { backgroundColor: '#334155', color: '#f8fafc' }]}
                    value={feedbackDescription}
                    onChangeText={setFeedbackDescription}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    autoCapitalize="sentences"
                  />
                </ScrollView>

                <TouchableOpacity 
                  style={[styles.modalButton, (!feedbackTitle.trim() || !feedbackDescription.trim()) && styles.modalButtonDisabled]} 
                  onPress={async () => {
                    if (feedbackTitle.trim() && feedbackDescription.trim()) {
                      try {
                        // Supabase'e geri bildirim kaydet
                        const { error } = await supabase
                          .from('geri_bildirimler')
                          .insert({
                            kullanici_id: MOCK_USER.name, // Gerçek kullanıcı ID'si kullanılabilir
                            tur: feedbackType === 'complaint' ? 'sikayet_oneri' : feedbackType === 'bug' ? 'hata' : 'ozellik_istegi',
                            baslik: feedbackTitle.trim(),
                            aciklama: feedbackDescription.trim(),
                            durum: 'beklemede',
                            olusturma_tarihi: new Date().toISOString(),
                          });

                        if (error) {
                          throw error;
                        }

                        // Başarı mesajı
                        Alert.alert(
                          'Geri Bildirim Gönderildi',
                          'Geri bildiriminiz için teşekkür ederiz. En kısa sürede değerlendirilecektir.',
                          [{ text: 'Tamam', onPress: () => {
                            setFeedbackModalVisible(false);
                            setFeedbackTitle('');
                            setFeedbackDescription('');
                            setFeedbackType('complaint');
                          }}]
                        );
                      } catch (error: any) {
                        console.error('Geri bildirim gönderme hatası:', error);
                        Alert.alert(
                          'Hata',
                          'Geri bildirim gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
                          [{ text: 'Tamam' }]
                        );
                      }
                    }
                  }}
                  disabled={!feedbackTitle.trim() || !feedbackDescription.trim()}
                >
                  <View style={styles.sendButtonContent}>
                    <Send color={Colors.white} size={20} />
                    <Text style={styles.modalButtonText}>Gönder</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DribbbleColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 20,
  },
  gradientHeader: {
    height: 140,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: -50,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarGradientBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.primary.indigo,
    fontSize: 36,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  userStatus: {
    fontSize: 15,
    color: '#6b7280',
  },
  verificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  verificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  verificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationTextContainer: {
    flex: 1,
  },
  verificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 2,
  },
  verificationSubtitle: {
    fontSize: 13,
    color: '#b45309',
  },
  menuSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  menuCard: {
    backgroundColor: DribbbleColors.cardWhite,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.darkGray,
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  switchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.darkGray,
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    backgroundColor: DribbbleColors.cardWhite,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 16,
    maxHeight: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: Colors.darkGray,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalScrollView: {
    maxHeight: 400,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalButton: {
    width: '100%',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DribbbleColors.progressBlue,
  },
  modalButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackTypeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  feedbackTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  feedbackTypeButtonActive: {
    backgroundColor: DribbbleColors.lavender,
    borderColor: DribbbleColors.progressBlue,
  },
  feedbackTypeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  feedbackTypeTextActive: {
    color: DribbbleColors.progressBlue,
    fontWeight: '600',
  },
  modalTextArea: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 16,
  },
});

export default ProfileScreen;
