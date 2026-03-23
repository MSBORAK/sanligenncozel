/**
 * ŞanlıSosyal — Push Notification Servisi
 *
 * Kullanım alanları:
 *  - Arkadaşlık isteği gönderildi
 *  - Arkadaşlık isteği kabul edildi
 *  - Yeni mesaj alındı
 *  - Arkadaş yeni snap attı
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Bildirim geldiğinde uygulama açıkken nasıl davransın
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Kullanıcının Expo push token'ını al ve Supabase'e kaydet.
 * Uygulama açılışında (UserContext veya AppNavigator'da) çağrılmalı.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (!Device.isDevice) {
    // Simülatörde push token alınamaz
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android için bildirim kanalı oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sosyal', {
      name: 'ŞanlıSosyal',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'sanligenc', // EAS project ID yoksa slug kullanılır
    });
    const token = tokenData.data;

    // Token'ı Supabase'e kaydet
    await supabase
      .from('user_profiles')
      .update({ push_token: token })
      .eq('user_id', userId);

    return token;
  } catch {
    return null;
  }
}

/**
 * Expo Push API üzerinden bildirim gönder.
 * Supabase Edge Function veya doğrudan Expo API kullanılır.
 *
 * @param recipientUserId - Bildirimi alacak kullanıcının Supabase user_id'si
 * @param title - Bildirim başlığı
 * @param body - Bildirim metni
 * @param data - Ek veri (navigasyon için)
 */
export async function sendPushNotification(
  recipientUserId: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  try {
    // Alıcının push token'ını al
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('push_token')
      .eq('user_id', recipientUserId)
      .single();

    const token = profile?.push_token;
    if (!token || !token.startsWith('ExponentPushToken')) return;

    // Expo Push API'ye gönder
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title,
        body,
        data,
        channelId: 'sosyal',
      }),
    });
  } catch {
    // Bildirim gönderilemezse sessizce geç — kritik değil
  }
}

// ─── Hazır bildirim şablonları ───────────────────────────────────────────────

export const notify = {
  /** Arkadaşlık isteği gönderildiğinde alıcıya bildir */
  friendRequest: (recipientId: string, senderName: string) =>
    sendPushNotification(
      recipientId,
      'Yeni Arkadaşlık İsteği',
      `${senderName} seni ŞanlıSosyal'e eklemek istiyor.`,
      { type: 'friend_request' }
    ),

  /** Arkadaşlık isteği kabul edildiğinde gönderene bildir */
  friendAccepted: (recipientId: string, acceptorName: string) =>
    sendPushNotification(
      recipientId,
      'Arkadaşlık İsteği Kabul Edildi!',
      `${acceptorName} arkadaşlık isteğini kabul etti. Artık mesajlaşabilirsiniz!`,
      { type: 'friend_accepted' }
    ),

  /** Yeni mesaj geldiğinde bildir */
  newMessage: (recipientId: string, senderName: string, preview: string, conversationId: string) =>
    sendPushNotification(
      recipientId,
      senderName,
      preview.length > 60 ? preview.substring(0, 60) + '…' : preview,
      { type: 'message', conversationId }
    ),

  /** Arkadaş yeni anlık görüntü attığında bildir */
  newSnap: (recipientId: string, senderName: string) =>
    sendPushNotification(
      recipientId,
      'Yeni Anlık Görüntü!',
      `${senderName} yeni bir anlık görüntü paylaştı.`,
      { type: 'snap' }
    ),
};
