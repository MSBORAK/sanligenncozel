/**
 * Tüm kartlarda tutarlı, ince "elevation" hissi için ortak gölge/kenar stili.
 * Abartılı/koyu gölge yok — sadece kağıt sayfadan hafifçe ayrılmış gibi dursun.
 */

export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.18,
  shadowRadius: 22,
  elevation: 8,
};

/**
 * İki katmanlı kart yapısı — shadow ve overflow:'hidden' AYNI view'da olursa
 * iOS shadow'u tamamen kırpar. Bu yüzden shadow dış wrapper'da, kırpma iç
 * content view'da olmalı:
 *   <View style={[cardOuterShadow, {borderRadius, backgroundColor}]}>
 *     <View style={[cardInnerClip, {borderRadius}]}>...içerik...</View>
 *   </View>
 */
export const cardOuterShadow = {
  ...cardShadow,
};

export const cardInnerClip = {
  overflow: 'hidden' as const,
};

/** Açık (beyaz) kartlar için ince kenarlık */
export const cardBorderLight = {
  borderWidth: 1,
  borderColor: 'rgba(0,0,0,0.07)',
};

/** Koyu (siyah/dark) kartlar için ince kenarlık */
export const cardBorderDark = {
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.06)',
};
