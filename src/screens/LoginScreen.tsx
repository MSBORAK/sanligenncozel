import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Eye, EyeOff, Mail, Lock, CheckCircle2, Circle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';
import { Colors, Gradients } from '@/constants/Colors';
import BackgroundImage from '@/assets/images/background.jpg';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [loginVerificationCode, setLoginVerificationCode] = useState('');
  const [showLoginCodeInput, setShowLoginCodeInput] = useState(false);
  
  // Kayıt formu state'leri
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerVerificationCode, setRegisterVerificationCode] = useState('');
  const [showRegisterCodeInput, setShowRegisterCodeInput] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleLogin = () => {
    // Şimdilik direkt ana sayfaya yönlendiriyoruz
    navigation.replace('Main', { screen: 'Home' });
  };

  return (
    <View style={styles.root}>
      <ImageBackground source={BackgroundImage} style={StyleSheet.absoluteFill}>
        {/* Arka Plan Gradyanı ve Efektler */}
        <LinearGradient
          colors={['rgba(15,118,110,0.5)', 'rgba(13,148,136,0.4)', 'rgba(20,184,166,0.3)']}
          style={StyleSheet.absoluteFill}
        >
          {/* Dekoratif Işık - Balıklıgöl teal & Urfa taşı */}
          <View style={[styles.glow, { top: '10%', left: '-10%', backgroundColor: '#0d9488' }]} />
          <View style={[styles.glow, { bottom: '20%', right: '-10%', backgroundColor: '#14b8a6' }]} />
        </LinearGradient>
      </ImageBackground>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Başlık Bölümü */}
            <View style={styles.header}>
              <Text style={styles.title}>Şanlı Genç</Text>
              <Text style={styles.subtitle}>Şehrin Kalbine Hoşgeldiniz</Text>
            </View>

            {/* Giriş Kartı (Glassmorphism) */}
            <View style={styles.cardContainer}>
              <BlurView intensity={30} tint="light" style={styles.cardBlur}>
                <View style={styles.cardInner}>
                  {/* Tablar */}
                  <View style={styles.tabContainer}>
                    <TouchableOpacity
                      onPress={() => setActiveTab('login')}
                      style={[styles.tab, activeTab === 'login' && styles.activeTab]}
                    >
                      <Text style={[styles.tabText, activeTab === 'login' && styles.activeTabText]}>
                        Giriş Yap
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setActiveTab('register')}
                      style={[styles.tab, activeTab === 'register' && styles.activeTab]}
                    >
                      <Text style={[styles.tabText, activeTab === 'register' && styles.activeTabText]}>
                        Kayıt Ol
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inputlar */}
                  <View style={styles.inputContainer}>
                    {activeTab === 'login' ? (
                      // Giriş Yap Inputları
                      <>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            placeholder="E-posta"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!showLoginCodeInput}
                          />
                        </View>
                        
                        {showLoginCodeInput ? (
                          <View style={styles.inputWrapper}>
                            <TextInput
                              placeholder="Doğrulama Kodu"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              style={styles.input}
                              value={loginVerificationCode}
                              onChangeText={setLoginVerificationCode}
                              keyboardType="number-pad"
                              maxLength={6}
                            />
                          </View>
                        ) : null}
                      </>
                    ) : (
                      // Kayıt Ol Inputları
                      <>
                        <View style={styles.inputWrapper}>
                          <TextInput
                            placeholder="Kullanıcı Adı"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            style={styles.input}
                            value={registerUsername}
                            onChangeText={setRegisterUsername}
                            autoCapitalize="none"
                          />
                        </View>

                        <View style={styles.inputWrapper}>
                          <TextInput
                            placeholder="E-posta"
                            placeholderTextColor="rgba(255,255,255,0.5)"
                            style={styles.input}
                            value={registerEmail}
                            onChangeText={setRegisterEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!showRegisterCodeInput}
                          />
                        </View>

                        {showRegisterCodeInput ? (
                          <View style={styles.inputWrapper}>
                            <TextInput
                              placeholder="Doğrulama Kodu"
                              placeholderTextColor="rgba(255,255,255,0.5)"
                              style={styles.input}
                              value={registerVerificationCode}
                              onChangeText={setRegisterVerificationCode}
                              keyboardType="number-pad"
                              maxLength={6}
                            />
                          </View>
                        ) : null}
                      </>
                    )}
                  </View>

                  {/* Alt Seçenekler */}
                  {activeTab === 'register' && (
                    <View style={styles.optionsRow}>
                      <TouchableOpacity 
                          style={styles.rememberRow}
                          onPress={() => setAcceptTerms(!acceptTerms)}
                      >
                        {acceptTerms ? (
                          <CheckCircle2 color="#a855f7" size={18} />
                        ) : (
                          <Circle color="rgba(255,255,255,0.4)" size={18} />
                        )}
                        <Text style={[styles.optionText, { marginLeft: 6 }]}>Kullanım Koşulları'nı kabul ederim.</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Giriş/Kayıt Butonu */}
                  <TouchableOpacity 
                    activeOpacity={0.8} 
                    onPress={() => {
                      if (activeTab === 'login') {
                        // Giriş yapma akışı
                        if (showLoginCodeInput && loginVerificationCode) {
                          // Kod doğrulandıktan sonra ana sayfaya yönlendir
                          navigation.replace('Main', { screen: 'Home' });
                        } else if (showLoginCodeInput) {
                          // Kod doğrulama butonu basıldı
                          // Şimdilik direkt yönlendir, sonra doğrulama işlemi yapılacak
                          navigation.replace('Main', { screen: 'Home' });
                        } else {
                          // E-posta gönder butonu basıldı
                          // Şimdilik sadece UI, sonra Supabase ile kod göndereceğiz
                          setShowLoginCodeInput(true);
                        }
                      } else {
                        // Kayıt olma akışı
                        if (showRegisterCodeInput && registerVerificationCode) {
                          // Kod doğrulandıktan sonra ana sayfaya yönlendir
                          navigation.replace('Main', { screen: 'Home' });
                        } else if (showRegisterCodeInput) {
                          // Kod doğrulama butonu basıldı
                          // Şimdilik direkt yönlendir, sonra doğrulama işlemi yapılacak
                          navigation.replace('Main', { screen: 'Home' });
                        } else {
                          // E-posta gönder butonu basıldı
                          // Şimdilik sadece UI, sonra Supabase ile kod göndereceğiz
                          setShowRegisterCodeInput(true);
                        }
                      }
                    }}
                    style={styles.loginBtnWrapper}
                  >
                    <LinearGradient
                      colors={[...Gradients.hero]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.loginBtn}
                    >
                      <Text style={styles.loginBtnText}>
                        {activeTab === 'login'
                          ? showLoginCodeInput && email
                            ? 'Giriş Yap'
                            : 'Kod Gönder'
                          : showRegisterCodeInput
                            ? 'Kodu Doğrula'
                            : 'Doğrulama Kodu Gönder'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => navigation.replace('Main', { screen: 'Home' })}
                    style={styles.guestLoginButton}
                  >
                    <Text style={styles.guestLoginButtonText}>Misafir Girişi Yap</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Alt Şehir Silüeti (Basit Bir Çizim/Efekt) */}
      <View style={styles.cityOutlineContainer}>
        <View style={styles.cityOutline} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.3,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 42,
    color: '#fff',
    textShadowColor: 'rgba(13,148,136,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  cardContainer: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 10,
  },
  cardBlur: {
    padding: 2,
  },
  cardInner: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: Colors.primary.indigo,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 15,
  },
  activeTabText: {
    color: '#fff',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 20,
  },
  inputWrapper: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 4,
  },
  sendCodeButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  sendCodeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  forgotBtn: {
    paddingVertical: 4,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  loginBtnWrapper: {
    marginBottom: 24,
  },
  loginBtn: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0d9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  loginBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#fff',
    fontSize: 18,
    letterSpacing: 1,
  },
  guestLoginButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 28,
    backgroundColor: 'rgba(13,148,136,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(13,148,136,0.4)',
    marginTop: 10,
    shadowColor: Colors.primary.indigo,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  guestLoginButtonText: {
    color: Colors.primary.violet,
    fontSize: 16, // Biraz daha büyük font
    fontWeight: '700', // Daha kalın font
  },
  cityOutlineContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    opacity: 0.2,
  },
  cityOutline: {
    flex: 1,
    borderTopWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    // Burada basit bir silüet efekti için borderlar kullanılabilir
    // Gerçek bir silüet için SVG veya resim daha iyi olur
  },
});

export default LoginScreen;
