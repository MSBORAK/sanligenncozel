/**
 * Plus Jakarta Sans - özel tipografi
 */

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const Typography = {
  // Başlıklar
  h1: { fontFamily: FontFamily.extraBold, fontSize: 32 },
  h2: { fontFamily: FontFamily.bold, fontSize: 24 },
  h3: { fontFamily: FontFamily.semiBold, fontSize: 20 },
  // Gövde
  body: { fontFamily: FontFamily.regular, fontSize: 16 },
  bodyMedium: { fontFamily: FontFamily.medium, fontSize: 16 },
  bodySmall: { fontFamily: FontFamily.regular, fontSize: 14 },
  // Etiketler
  caption: { fontFamily: FontFamily.medium, fontSize: 12 },
  label: { fontFamily: FontFamily.semiBold, fontSize: 11 },
};
