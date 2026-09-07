import React, { useCallback } from 'react';
import { AppAlert } from '@/lib/alert';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Library, MapPin, Clock, Navigation, Phone, Info } from 'lucide-react-native';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_LIBRARIES, Library as LibraryType } from '@/api/mockData';
import { useAppTheme } from '@/theme/useAppTheme';
import { useTranslation } from 'react-i18next';

const LibraryListScreen = () => {
  const t = useAppTheme();
  const { t: tr } = useTranslation();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, chipBg, accent: amber } = t;
  const insets = useSafeAreaInsets();
  const cardBorder = isDark ? cardBorderDark : cardBorderLight;

  const handleDirections = useCallback((library: LibraryType) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${library.name}, ${library.address}, Şanlıurfa`)}`;
    Linking.openURL(url).catch(err => {
      console.error('Yol tarifi açılamadı:', err);
      AppAlert.alert(tr('common.error'), tr('pharmacy.linkAcilamadi'));
    });
  }, [tr]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {
      AppAlert.alert(tr('common.error'), tr('pharmacy.linkAcilamadi'));
    });
  }, [tr]);

  const renderLibraryItem = useCallback(({ item }: { item: LibraryType }) => (
      <View style={[styles.libraryCardOuter, cardOuterShadow, cardBorder, { backgroundColor: cardBg }]}>
        <TouchableOpacity
          style={[styles.libraryCard, cardInnerClip]}
          activeOpacity={0.9}
        >
          <View style={[styles.iconContainer, { backgroundColor: chipBg }]}>
            <Library color={txt1} size={24} />
          </View>
          <View style={styles.infoContainer}>
            <Text style={[styles.libraryName, { color: txt1 }]}>{item.name}</Text>
            <View style={styles.addressRow}>
              <MapPin color={txt2} size={14} />
              <Text style={[styles.address, { color: txt2 }]} numberOfLines={1}>{item.address}</Text>
            </View>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Clock color={txt2} size={14} />
                <Text style={[styles.detailText, { color: txt2 }]} numberOfLines={1}>{item.workingHours}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.phoneRow} onPress={() => handleCall(item.phone)} hitSlop={6}>
              <Phone color={txt1} size={14} />
              <Text style={[styles.phoneText, { color: txt1 }]}>{item.phone}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.actionsCol}>
            <TouchableOpacity
              style={[styles.directionsButton, { backgroundColor: chipBg }]}
              onPress={() => handleDirections(item)}
              activeOpacity={0.9}
            >
              <Navigation color={txt1} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.directionsButton, { backgroundColor: chipBg }]}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.9}
            >
              <Phone color={txt1} size={18} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
  ), [cardBg, cardBdr, chipBg, txt1, txt2, amber, handleDirections, handleCall]);

  const listBottomPad = Math.max(insets.bottom, 20);

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      <View style={[styles.header, { backgroundColor: pageBg, paddingTop: insets.top + 18 }]}>
        <Text style={[styles.headerLabel, { color: txt2 }]}>{tr('pharmacy.kesfet')}</Text>
        <Text style={[styles.headerTitle, { color: txt1 }]}>{tr('library.title')}</Text>
        <Text style={[styles.headerSubtitle, { color: txt2 }]}>{tr('library.kutuphaneBulundu', { count: MOCK_LIBRARIES.length })}</Text>
      </View>

      <FlatList
        data={MOCK_LIBRARIES}
        renderItem={renderLibraryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: listBottomPad }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={6}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Library color={txt2} size={32} strokeWidth={2} />
            <Text style={[styles.emptyStateText, { color: txt2 }]}>{tr('library.sonucBulunamadi')}</Text>
          </View>
        }
        ListFooterComponent={
          <View style={[styles.disclaimer, { backgroundColor: chipBg }]}>
            <Info color={txt2} size={16} strokeWidth={2} />
            <Text style={[styles.disclaimerText, { color: txt2 }]}>{tr('library.uyariMetni')}</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 15,
    textAlign: 'center',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
    paddingTop: 4,
  },
  libraryCardOuter: {
    borderRadius: 20,
    marginBottom: 15,
  },
  libraryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  libraryName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  address: {
    fontSize: 13,
    marginLeft: 4,
    flex: 1,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 6,
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
  },
  actionsCol: {
    gap: 8,
    marginLeft: 10,
  },
  directionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});

export default LibraryListScreen;
