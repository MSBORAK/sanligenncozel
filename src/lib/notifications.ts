/**
 * ŞanlıSosyal — Push Notification Servisi
 *
 * ⚠️ ŞU ANDA DEVRE DIŞI - Development için geçici olarak kapatıldı
 *
 * Kullanım alanları:
 *  - Arkadaşlık isteği gönderildi
 *  - Arkadaşlık isteği kabul edildi
 *  - Yeni mesaj alındı
 *  - Arkadaş yeni snap attı
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Bildirim geldiğinde uygulama açıkken nasıl davransın
// ⚠️ Geçici olarak devre dışı
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
*/

/**
 * Kullanıcının Expo push token'ını al ve Supabase'e kaydet.
 * Uygulama açılışında (UserContext veya AppNavigator'da) çağrılmalı.
 * 
 * ⚠️ ŞU ANDA DEVRE DIŞI - Development için kapatıldı
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  console.log('Push notifications: Geçici olarak devre dışı');
  return null;
}

/**
 * Expo Push API üzerinden bildirim gönder.
 * 
 * ⚠️ ŞU ANDA DEVRE DIŞI - Development için kapatıldı
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
  console.log('Push notification devre dışı:', title, body);
  // Geçici olarak devre dışı
  return;
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

  /** Grup kıvılcımı — seçilen arkadaşlara */
  groupSnap: (recipientId: string, senderName: string, totalRecipients: number) =>
    sendPushNotification(
      recipientId,
      'Grup kıvılcımı',
      `${senderName} seni ve ${Math.max(0, totalRecipients - 1)} kişiyi seçti.`,
      { type: 'group_snap' }
    ),
};
