import React, { useState, useEffect } from 'react';
import { AppAlert } from '@/lib/alert';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Keyboard, ActivityIndicator, Dimensions, Modal, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MapPin, Star, Maximize2, Minimize2, Navigation, ArrowRight, Bus, X } from 'lucide-react-native';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import { cardOuterShadow, cardInnerClip, cardBorderLight, cardBorderDark } from '@/constants/Shadows';
import { MOCK_STOPS } from '@/data/transport';
import { calculateDistance } from '@/utils/estimateTime';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from '@/theme/useAppTheme';
import { useFavorites } from '@/context/FavoritesContext';

const SERIF = Platform.select<string>({ ios: 'Georgia', android: 'serif', default: 'serif' });

const TransportScreen = () => {
  const { t: tr } = useTranslation();
  const { isDark, pageBg, cardBg, cardBdr, txt1, txt2, ctaBg, ctaTxt, chipBg, accent } = useAppTheme();
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.162800,
    longitude: 38.793700,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [nearestStop, setNearestStop] = useState<typeof MOCK_STOPS[0] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { favoriteStopIds: favorites, isFavoriteStop, toggleFavorite } = useFavorites();
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [fromStop, setFromStop] = useState<typeof MOCK_STOPS[0] | null>(null);
  const [toStop, setToStop] = useState<typeof MOCK_STOPS[0] | null>(null);
  const [showStopPicker, setShowStopPicker] = useState<'from' | 'to' | null>(null);
  const [editingFavorites, setEditingFavorites] = useState(false);
  const [routes, setRoutes] = useState<Array<{
    type: 'direct' | 'transfer';
    directLine?: string;
    transferFromLine?: string;
    transferToLine?: string;
    transferStop?: typeof MOCK_STOPS[0];
  }>>([]);

  const onToggleFavorite = (stopId: string) => toggleFavorite('stop', stopId);

  // Filtreleme mantığı
  const filteredStops = MOCK_STOPS.filter((stop) => {
    // 1. Bölge filtresi
    if (selectedArea && stop.region !== selectedArea) return false;

    // 2. Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLocaleLowerCase('tr-TR').trim();
      const matchName = stop.name.toLocaleLowerCase('tr-TR').includes(query);
      const matchLine = stop.buses.some(bus => 
        bus.line.toLocaleLowerCase('tr-TR').includes(query) || 
        bus.route.toLocaleLowerCase('tr-TR').includes(query)
      );
      return matchName || matchLine;
    }

    return true;
  });

  // Bölge değiştiğinde haritayı o bölgeye odakla ve ilk durağı seç
  useEffect(() => {
    if (selectedArea && filteredStops.length > 0) {
      const firstStop = filteredStops[0];
      
      // Haritayı odakla
      setMapRegion({
        latitude: firstStop.lat,
        longitude: firstStop.lng,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      });

      // O bölgedeki ilk durağı otomatik seç (Böylece liste güncellenir)
      setNearestStop(firstStop);
    } else if (selectedArea === null && location) {
      // "Tümü" seçildiyse ve konum varsa, tekrar en yakın durağı bulmaya çalış (Opsiyonel ama hoş olur)
      // Şimdilik sadece haritayı biraz uzaklaştıralım
       setMapRegion({
        latitude: 37.1674,
        longitude: 38.7955,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  }, [selectedArea]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (!isMounted) return;
        if (status !== 'granted') {
          AppAlert.alert(
            tr('transport.izinGerekli'),
            tr('transport.izinMesaji'),
            [
              { text: tr('common.ok'), style: 'cancel' },
              { text: tr('transport.ayarlaraGit'), onPress: () => Linking.openSettings() },
            ]
          );
          // Varsayılan olarak Abide durağını seç
          setNearestStop(MOCK_STOPS[0]);
          setFromStop(MOCK_STOPS[0]);
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        if (!isMounted) return;
        setLocation(location);

        // En yakın durağı bul
        if (location) {
          let minDistance = Infinity;
          let closest = MOCK_STOPS[0];

          // Kullanıcı Şanlıurfa merkezden 50km uzakta mı?
          const distToCenter = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            37.1674,
            38.7955
          );

          // Eğer yakındaysa haritayı kullanıcıya odakla
          if (distToCenter < 50) {
            setMapRegion({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }
          // Uzaktaysa (örn: İstanbul veya Simülatör/San Francisco), varsayılan Şanlıurfa kalır.

          MOCK_STOPS.forEach((stop) => {
            const dist = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              stop.lat,
              stop.lng
            );
            if (dist < minDistance) {
              minDistance = dist;
              closest = stop;
            }
          });

          setNearestStop(closest);
          setFromStop(closest); // En yakın durağı varsayılan "Nereden" olarak ayarla
        } else {
          // Konum yoksa varsayılan olarak Abide durağını seç
          setNearestStop(MOCK_STOPS[0]);
          setFromStop(MOCK_STOPS[0]); // Varsayılan durağı "Nereden" olarak ayarla
        }
      } catch (e) {
        // Konum servisleri kapalı / GPS zaman aşımı / simülatör hatası — sessizce varsayılana düş
        if (isMounted) {
          setNearestStop(MOCK_STOPS[0]);
          setFromStop(MOCK_STOPS[0]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Rota planlama algoritması
  useEffect(() => {
    if (!fromStop || !toStop || fromStop.id === toStop.id) {
      setRoutes([]);
      return;
    }

    const foundRoutes: Array<{
      type: 'direct' | 'transfer';
      directLine?: string;
      transferFromLine?: string;
      transferToLine?: string;
      transferStop?: typeof MOCK_STOPS[0];
    }> = [];

    // 1. Direkt hat kontrolü: Her iki duraktan da geçen hatlar
    const fromLines = new Set(fromStop.buses.map(bus => bus.line));
    const toLines = new Set(toStop.buses.map(bus => bus.line));
    const commonLines = Array.from(fromLines).filter(line => toLines.has(line));
    
    commonLines.forEach(line => {
      foundRoutes.push({ type: 'direct', directLine: line });
    });

    // 2. Aktarmalı rota: Bir ara durak üzerinden iki hat ile gitme
    // fromStop'tan bir hat ile ara durağa, oradan başka bir hat ile toStop'a
    // NOT: Direkt rota varsa, direkt rota hatlarını kullanarak aktarmalı rota gösterme
    fromStop.buses.forEach(fromBus => {
      // Direkt rota olan hatları kullanarak aktarmalı rota oluşturma
      if (commonLines.includes(fromBus.line)) {
        return; // Bu hat zaten direkt rota, gereksiz aktarma
      }

      // Bu hatın geçtiği durakları bul
      const stopsWithFromLine = MOCK_STOPS.filter(stop => 
        stop.id !== fromStop.id && 
        stop.id !== toStop.id &&
        stop.buses.some(bus => bus.line === fromBus.line)
      );

      stopsWithFromLine.forEach(transferStop => {
        // Aktarma durağından toStop'a giden hatları kontrol et
        const transferStopLines = new Set(transferStop.buses.map(bus => bus.line));
        const toStopLines = new Set(toStop.buses.map(bus => bus.line));
        // Direkt rota hatlarını hariç tut - çünkü direkt rota zaten var
        const availableLines = Array.from(transferStopLines).filter(line => 
          toStopLines.has(line) && 
          !commonLines.includes(line) // Direkt rota hatlarını kullanma
        );

        availableLines.forEach(toLine => {
          // Daha önce eklenmiş mi kontrol et
          const alreadyAdded = foundRoutes.some(route =>
            route.type === 'transfer' &&
            route.transferFromLine === fromBus.line &&
            route.transferToLine === toLine &&
            route.transferStop?.id === transferStop.id
          );

          if (!alreadyAdded && fromBus.line !== toLine) {
            foundRoutes.push({
              type: 'transfer',
              transferFromLine: fromBus.line,
              transferToLine: toLine,
              transferStop: transferStop,
            });
          }
        });
      });
    });

    setRoutes(foundRoutes);
  }, [fromStop, toStop]);

  const insets  = useSafeAreaInsets();
  const TRANSPORT_ACCENT      = ctaBg;
  const TRANSPORT_ACCENT_SOFT = chipBg;
  const ROUTE_LINE_FALLBACK   = TRANSPORT_ACCENT;

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: pageBg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={TRANSPORT_ACCENT} />
        <Text style={{ marginTop: 12, color: txt2, fontWeight: '500' }}>
          Konum ve duraklar yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: pageBg }]} edges={[]}>
      {/* Full Screen Map - Rendered at SafeAreaView level when expanded */}
      {isMapExpanded && (
        <View style={styles.mapExpanded}>
          <MapView
            provider={PROVIDER_DEFAULT}
            style={StyleSheet.absoluteFill}
            region={mapRegion}
            showsUserLocation={true}
            onRegionChangeComplete={(region) => setMapRegion(region)}
            mapType="standard"
            showsMyLocationButton={false}
            showsCompass={false}
            toolbarEnabled={false}
          >
            {filteredStops.map((stop) => (
              <Marker
                key={stop.id}
                coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                title={stop.name}
                description={nearestStop?.id === stop.id ? tr('transport.enYakinDurak') : tr('transport.durak')}
                pinColor={nearestStop?.id === stop.id ? TRANSPORT_ACCENT : "#ef4444"}
                onPress={() => setNearestStop(stop)}
              />
            ))}
          </MapView>
          
          <View style={styles.mapOverlayRow}>
            {location && (
              <View style={[styles.mapLocationPill, isDark && { backgroundColor: Colors.dark.card }]}>
                <MapPin color={txt1} size={16} />
                <Text style={[styles.mapLocationText, isDark && { color: '#f8fafc' }]}>{tr('transport.konumunuzAlindi')}</Text>
              </View>
            )}
            {nearestStop && (
              <View style={[styles.mapStopPill, isDark && { backgroundColor: '#059669', opacity: 0.2 }]}>
                <Text style={[styles.mapStopLabel, { color: txt1 }]}>{tr('transport.enYakinDurak')}</Text>
                <Text style={[styles.mapStopValue, { color: txt1 }]}>{nearestStop.name}</Text>
              </View>
            )}
          </View>

          {/* Harita Tam Ekranken Görünecek Arama Çubuğu */}
          <View style={styles.expandedSearchWrapper}>
            <View style={styles.expandedSearchRow}>
              <View style={[styles.expandedSearchContainer, isDark && { backgroundColor: Colors.dark.card, borderColor: Colors.dark.border, borderWidth: 1 }]}>
                <Search color={isDark ? '#94a3b8' : '#9ca3af'} size={20} />
                <TextInput
                  placeholder={tr('transport.haritadaDurakAra')}
                  style={[styles.searchInput, isDark && { color: '#f8fafc' }]}
                  placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
                  value={searchQuery}
                  onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text.length > 0) setSelectedArea(null);
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                    <Text style={{ color: isDark ? '#94a3b8' : '#9ca3af', fontSize: 20, marginLeft: 8 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <TouchableOpacity 
                style={[styles.expandedMinimizeButton, isDark && { backgroundColor: Colors.dark.card, borderColor: Colors.dark.border, borderWidth: 1 }]}
                onPress={() => {
                  setIsMapExpanded(false);
                  setSearchQuery('');
                }}
              >
                <Minimize2 color={isDark ? '#94a3b8' : Colors.darkGray} size={24} />
              </TouchableOpacity>
            </View>

            {searchQuery.length > 0 && (
              <View style={[styles.expandedSearchResultsList, isDark && { backgroundColor: Colors.dark.card, borderColor: Colors.dark.border }]}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                  {filteredStops.length > 0 ? (
                    filteredStops.map((stop) => (
                      <TouchableOpacity
                        key={stop.id}
                        style={[styles.searchResultItem, isDark && { borderBottomColor: Colors.dark.border }]}
                        onPress={() => {
                          setNearestStop(stop);
                          setSearchQuery('');
                          Keyboard.dismiss();
                          setMapRegion({
                            latitude: stop.lat,
                            longitude: stop.lng,
                            latitudeDelta: 0.005,
                            longitudeDelta: 0.005,
                          });
                        }}
                      >
                        <View style={[styles.searchResultIcon, isDark && { backgroundColor: Colors.dark.border }, !isDark && { backgroundColor: TRANSPORT_ACCENT_SOFT }]}>
                          <MapPin size={16} color={txt1} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.searchResultTitle, isDark && { color: '#f8fafc' }]}>{stop.name}</Text>
                          <Text style={[styles.searchResultLines, isDark && { color: '#94a3b8' }]} numberOfLines={1}>
                            Hatlar: {stop.buses.map((b) => b.line).join(', ')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.searchResultItem}>
                      <Text style={[styles.noResultText, isDark && { color: '#94a3b8' }]}>{tr('transport.sonucBulunamadi')}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Normal Content - Hidden when map is expanded */}
      {!isMapExpanded && (
        <>
          {/* ── HERO — Home ekranındaki sade, düz zeminli başlık dili ── */}
          <View style={[styles.hero, { paddingTop: insets.top + 18, backgroundColor: pageBg, borderBottomColor: cardBdr }]}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.heroLabel,{color:txt2}]}>{tr('transport.ulasimRehberi')}</Text>
                <Text style={[styles.heroTitle,{color:txt1}]}>Durağını bul,{'\n'}yolunu planla</Text>
              </View>
              <View style={[styles.heroIconWrap,{backgroundColor:chipBg, borderColor:cardBdr}]}>
                <Bus color={txt1} size={22} strokeWidth={1.8}/>
              </View>
            </View>
            {nearestStop && (
              <View style={[styles.heroPill,{backgroundColor:chipBg, borderColor:cardBdr}]}>
                <MapPin color={txt1} size={12} strokeWidth={2.5}/>
                <Text style={[styles.heroPillTxt,{color:txt1}]}>En yakın: {nearestStop.name}</Text>
              </View>
            )}
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          <View style={styles.card}>

            {/* Nereden - Nereye Seçimi */}
            <View style={styles.routeSelector}>
              <View style={[cardOuterShadow, {flex:1, backgroundColor:cardBg, borderRadius:18, borderWidth:1.2, borderColor:cardBdr}]}>
                <TouchableOpacity
                  style={[styles.routeButton, cardInnerClip, {borderRadius:18}]}
                  onPress={() => setShowStopPicker('from')}
                  activeOpacity={0.8}
                >
                  <View style={styles.routeButtonContent}>
                    <Navigation color={txt1} size={20} />
                    <View style={styles.routeButtonTextContainer}>
                      <Text style={[styles.routeButtonLabel, { color: txt2 }]}>{tr('transport.nereden')}</Text>
                      <Text style={[styles.routeButtonValue, { color: txt1 }]} numberOfLines={1}>
                        {fromStop ? fromStop.name : 'Durak seçin'}
                      </Text>
                    </View>
                    {fromStop && (
                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); setFromStop(null); }} hitSlop={8}>
                        <X color={txt2} size={16} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              <ArrowRight color={txt2} size={20} style={{ marginHorizontal: 8 }} />

              <View style={[cardOuterShadow, {flex:1, backgroundColor:cardBg, borderRadius:18, borderWidth:1.2, borderColor:cardBdr}]}>
                <TouchableOpacity
                  style={[styles.routeButton, cardInnerClip, {borderRadius:18}]}
                  onPress={() => setShowStopPicker('to')}
                  activeOpacity={0.8}
                >
                  <View style={styles.routeButtonContent}>
                    <MapPin color={txt1} size={20} />
                    <View style={styles.routeButtonTextContainer}>
                      <Text style={[styles.routeButtonLabel, { color: txt2 }]}>{tr('transport.nereye')}</Text>
                      <Text style={[styles.routeButtonValue, { color: txt1 }]} numberOfLines={1}>
                        {toStop ? toStop.name : 'Durak seçin'}
                      </Text>
                    </View>
                    {toStop && (
                      <TouchableOpacity onPress={(e) => { e.stopPropagation(); setToStop(null); }} hitSlop={8}>
                        <X color={txt2} size={16} />
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Harita — artık destekleyici, küçük bir kart (merkezi eleman değil) */}
            <View style={[cardOuterShadow, {backgroundColor:cardBg, borderRadius:20, marginBottom:16, borderWidth:1.2, borderColor:cardBdr}]}>
              <View style={[styles.mapPreview, cardInnerClip, {borderRadius:20}]}>
                <MapView
                  provider={PROVIDER_DEFAULT}
                  style={StyleSheet.absoluteFill}
                  region={mapRegion}
                  showsUserLocation={true}
                  onRegionChangeComplete={(region) => setMapRegion(region)}
                  mapType="standard"
                  showsMyLocationButton={false}
                  showsCompass={false}
                  toolbarEnabled={false}
                >
                  {filteredStops.map((stop) => (
                    <Marker
                      key={stop.id}
                      coordinate={{ latitude: stop.lat, longitude: stop.lng }}
                      title={stop.name}
                      description={nearestStop?.id === stop.id ? tr('transport.enYakinDurak') : tr('transport.durak')}
                      pinColor={nearestStop?.id === stop.id ? TRANSPORT_ACCENT : "#6B7280"}
                      onPress={() => setNearestStop(stop)}
                    />
                  ))}
                </MapView>

                <View style={styles.mapOverlayRow}>
                  {location && (
                    <View style={styles.mapLocationPill}>
                      <MapPin color={txt1} size={16} />
                      <Text style={styles.mapLocationText}>{tr('transport.konumunuzAlindi')}</Text>
                    </View>
                  )}
                  {nearestStop && (
                    <View style={styles.mapStopPill}>
                      <Text style={[styles.mapStopLabel, { color: txt1 }]}>{tr('transport.enYakinDurak')}</Text>
                      <Text style={[styles.mapStopValue, { color: txt1 }]}>{nearestStop.name}</Text>
                    </View>
                  )}
                </View>

                {/* Expand Button */}
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setIsMapExpanded(true)}
                >
                  <Maximize2 color={txt1} size={20} />
                </TouchableOpacity>
              </View>
            </View>

          {/* Search */}
          <View style={{ zIndex: 10 }}>
            <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor: cardBdr, borderWidth: 1.2 }]}>
              <Search color={txt1} size={19} />
              <TextInput
                placeholder={tr('transport.hatVeyaDurakAra')}
                style={[styles.searchInput, { color: txt1 }]}
                placeholderTextColor={txt2}
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  if (text.length > 0) setSelectedArea(null);
                }}
              />
            </View>

            {/* Search Results Dropdown */}
            {searchQuery.length > 0 && (
              <View style={styles.searchResultsList}>
                <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                  {filteredStops.length > 0 ? (
                    filteredStops.map((stop) => (
                      <TouchableOpacity
                        key={stop.id}
                        style={styles.searchResultItem}
                        onPress={() => {
                          setNearestStop(stop);
                          setSearchQuery(''); // Seçim yapınca aramayı kapat
                          Keyboard.dismiss(); // Klavyeyi kapat
                          setMapRegion({
                            latitude: stop.lat,
                            longitude: stop.lng,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                          });
                        }}
                      >
                        <View style={[styles.searchResultIcon, !isDark && { backgroundColor: chipBg }]}>
                          <MapPin size={16} color={txt1} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.searchResultTitle}>{stop.name}</Text>
                          <Text style={styles.searchResultLines} numberOfLines={1}>
                            Hatlar: {stop.buses.map((b) => b.line).join(', ')}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View style={styles.searchResultItem}>
                      <Text style={styles.noResultText}>{tr('transport.sonucBulunamadi')}</Text>
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Area pills */}
          <View style={styles.areaPillsRow}>
            {['Tümü', 'Merkez', 'Osmanbey', 'Karaköprü', 'Eyyübiye', 'Balıklıgöl'].map((area) => {
              const active = selectedArea === area || (area === 'Tümü' && selectedArea === null);
              return (
                <TouchableOpacity
                  key={area}
                  style={[styles.areaPill,
                    active ? { backgroundColor: ctaBg, borderColor: ctaBg, borderWidth: 1 } : { backgroundColor: chipBg, borderColor: cardBdr, borderWidth: 1 },
                  ]}
                  onPress={() => setSelectedArea(area === 'Tümü' ? null : area)}
                >
                  <Text style={[styles.areaPillText, { color: active ? ctaTxt : txt2, fontWeight: active ? '800' : '700' }]}>{area}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Favorite Stops */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: txt2 }]}>{tr('transport.favoriDuraklar')}</Text>
            <TouchableOpacity onPress={() => setEditingFavorites(v => !v)}>
              <Text style={[styles.editText, { color: txt1 }]}>{editingFavorites ? tr('common.ok') : tr('sosyalMain.duzenle')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.favoriteRow}
          >
            {favorites.length > 0 ? (
              favorites.map((favId) => {
                const stop = MOCK_STOPS.find((s) => s.id === favId);
                if (!stop) return null;
                return (
                  <View key={stop.id} style={[cardOuterShadow, {backgroundColor:cardBg, borderRadius:18, marginRight:12, borderWidth:1.2, borderColor:cardBdr}]}>
                    <TouchableOpacity
                      style={[styles.favoriteCard, cardInnerClip, {backgroundColor:cardBg, marginRight:0, borderRadius:20}]}
                      onPress={() => {
                        setNearestStop(stop);
                        setMapRegion({
                          latitude: stop.lat,
                          longitude: stop.lng,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });
                      }}
                    >
                      <View style={[styles.favoriteIconCircle, { backgroundColor: chipBg }]}>
                        <MapPin color={txt1} size={18} />
                      </View>
                      <Text style={[styles.favoriteName, { color: txt1 }]}>{stop.name}</Text>
                      <Text style={[styles.favoriteLines, { color: txt2 }]} numberOfLines={1}>
                        {stop.buses.map((b) => b.line).join(', ')}
                      </Text>
                      <TouchableOpacity
                        style={[styles.favoriteStar, editingFavorites && {backgroundColor:'#EF4444', borderRadius:11, width:22, height:22, alignItems:'center', justifyContent:'center'}]}
                        onPress={() => onToggleFavorite(stop.id)}
                      >
                        {editingFavorites ? (
                          <X color="#fff" size={13} strokeWidth={2.5} />
                        ) : (
                          <Star color={TRANSPORT_ACCENT} size={16} fill={TRANSPORT_ACCENT} />
                        )}
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                );
              })
            ) : (
              <Text style={{ color: '#9ca3af', marginLeft: 4, fontStyle: 'italic' }}>
                Henüz favori durak eklemediniz.
              </Text>
            )}
          </ScrollView>

          {/* Rota Planlama Sonuçları */}
          {fromStop && toStop && fromStop.id !== toStop.id && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: txt2 }]}>{tr('transport.alternatifRotalar')}</Text>
              </View>

              <View style={[styles.routeInfoCard, cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}>
                <View style={styles.routeInfoRow}>
                  <Navigation color={txt1} size={18} />
                  <Text style={[styles.routeInfoFrom, { color: txt1 }]} numberOfLines={1}>
                    {fromStop.name}
                  </Text>
                </View>
                <View style={styles.routeInfoArrow}>
                  <ArrowRight color={isDark ? '#64748b' : '#9ca3af'} size={20} />
                </View>
                <View style={styles.routeInfoRow}>
                  <MapPin color={txt1} size={18} />
                  <Text style={[styles.routeInfoTo, { color: txt1 }]} numberOfLines={1}>
                    {toStop.name}
                  </Text>
                </View>
              </View>

              {routes.length === 0 ? (
                <View style={[styles.noRouteCard, cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}>
                  <Text style={[styles.noRouteText, { color: txt2 }]}>
                    Bu iki durak arasında direkt veya aktarmalı rota bulunamadı.
                  </Text>
                </View>
              ) : (
                <View style={styles.routeList}>
                  {/* Önce direkt rotaları göster */}
                  {routes.filter(route => route.type === 'direct').map((route, index) => (
                    <View
                      key={`direct-${index}`}
                      style={[styles.routeCard, cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}
                    >
                      <View style={styles.routeCardContent}>
                        <View style={styles.routeDetails}>
                          <View style={styles.routeLineContainer}>
                            <View
                              style={[
                                styles.routeLineBadge,
                                {
                                  borderColor:
                                    fromStop.buses.find(b => b.line === route.directLine)?.color ||
                                    ROUTE_LINE_FALLBACK,
                                  backgroundColor:
                                    fromStop.buses.find(b => b.line === route.directLine)?.color
                                      ? `${fromStop.buses.find(b => b.line === route.directLine)?.color}15`
                                      : `${ROUTE_LINE_FALLBACK}15`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.routeLineText,
                                  {
                                    color:
                                      fromStop.buses.find(b => b.line === route.directLine)?.color ||
                                      ROUTE_LINE_FALLBACK,
                                  },
                                ]}
                              >
                                {route.directLine}
                              </Text>
                            </View>
                            <View style={styles.routeTextContainer}>
                              <Text style={[styles.routeDescription, { color: txt1 }]}>
                                {fromStop.buses.find(b => b.line === route.directLine)?.route}
                              </Text>
                              <View style={styles.routeTypeInline}>
                                <View style={[styles.routeTypeBadgeSmall, { backgroundColor: '#dcfce7' }]}>
                                  <Text style={[styles.routeTypeTextSmall, { color: '#16a34a' }]}>{tr('transport.direkt')}</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  {/* Sonra aktarmalı rotaları göster */}
                  {routes.filter(route => route.type === 'transfer').map((route, index) => (
                    <View
                      key={`transfer-${index}`}
                      style={[styles.routeCard, cardOuterShadow, isDark ? cardBorderDark : cardBorderLight, { backgroundColor: cardBg }]}
                    >
                      <View style={styles.routeCardContent}>
                        <View style={styles.routeDetails}>
                          {/* İlk Hat */}
                          <View style={styles.routeLineContainer}>
                            <View
                              style={[
                                styles.routeLineBadge,
                                {
                                  borderColor:
                                    fromStop.buses.find(b => b.line === route.transferFromLine)?.color ||
                                    ROUTE_LINE_FALLBACK,
                                  backgroundColor:
                                    fromStop.buses.find(b => b.line === route.transferFromLine)?.color
                                      ? `${fromStop.buses.find(b => b.line === route.transferFromLine)?.color}15`
                                      : `${ROUTE_LINE_FALLBACK}15`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.routeLineText,
                                  {
                                    color:
                                      fromStop.buses.find(b => b.line === route.transferFromLine)?.color ||
                                      ROUTE_LINE_FALLBACK,
                                  },
                                ]}
                              >
                                {route.transferFromLine}
                              </Text>
                            </View>
                            <View style={styles.routeTextContainer}>
                              <Text style={[styles.routeDescription, { color: txt1 }]}>
                                {fromStop.buses.find(b => b.line === route.transferFromLine)?.route}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Aktarma Noktası - Daha görsel */}
                          <View style={[styles.routeTransferContainer, { backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(219,234,254,0.8)' }]}>
                            <View style={[styles.routeTransferLine, { backgroundColor: TRANSPORT_ACCENT }]} />
                            <View style={styles.routeTransferContent}>
                              <MapPin color={TRANSPORT_ACCENT} size={16} />
                              <Text style={[styles.routeTransferText, { color: isDark ? '#93C5FD' : '#1D4ED8' }]}>
                                {route.transferStop?.name}
                              </Text>
                            </View>
                            <View style={[styles.routeTransferLine, isDark && { backgroundColor: TRANSPORT_ACCENT }]} />
                          </View>
                          
                          {/* İkinci Hat */}
                          <View style={styles.routeLineContainer}>
                            <View
                              style={[
                                styles.routeLineBadge,
                                {
                                  borderColor:
                                    toStop.buses.find(b => b.line === route.transferToLine)?.color ||
                                    '#10b981',
                                  backgroundColor:
                                    toStop.buses.find(b => b.line === route.transferToLine)?.color
                                      ? `${toStop.buses.find(b => b.line === route.transferToLine)?.color}15`
                                      : '#10b98115',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.routeLineText,
                                  {
                                    color:
                                      toStop.buses.find(b => b.line === route.transferToLine)?.color ||
                                      '#10b981',
                                  },
                                ]}
                              >
                                {route.transferToLine}
                              </Text>
                            </View>
                            <View style={styles.routeTextContainer}>
                              <Text style={[styles.routeDescription, { color: txt1 }]}>
                                {toStop.buses.find(b => b.line === route.transferToLine)?.route}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          </View>
          </ScrollView>
        </>
      )}

      {/* Durak seçim — tam opak tam ekran; gündüz ulaşım pembesi ile uyumlu */}
      <Modal
        visible={showStopPicker !== null}
        transparent={false}
        animationType="slide"
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
        onRequestClose={() => setShowStopPicker(null)}
      >
        <View
          style={[styles.modalRootFill, { backgroundColor: pageBg }]}
        >
          <SafeAreaView style={styles.modalScreen} edges={['top', 'left', 'right', 'bottom']}>
          <View style={[styles.modalHeader, { borderBottomColor: cardBdr, backgroundColor: pageBg }]}>
            <Text style={[styles.modalTitle, { color: txt1 }]}>
              {showStopPicker === 'from' ? 'Nereden?' : 'Nereye?'}
            </Text>
            <TouchableOpacity onPress={() => setShowStopPicker(null)} style={styles.modalCloseButton}>
              <Text style={[styles.modalCloseText, isDark && { color: '#94a3b8' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.modalSearchContainer, { backgroundColor: cardBg, borderColor: cardBdr, borderWidth: 1 }]}>
            <Search color={isDark ? '#94a3b8' : txt1} size={20} />
            <TextInput
              placeholder={tr('transport.durakAra')}
              style={[styles.modalSearchInput, { color: txt1 }]}
              placeholderTextColor={isDark ? '#64748b' : '#9ca3af'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator>
            {filteredStops.map((stop) => (
              <TouchableOpacity
                key={stop.id}
                style={[
                  styles.modalStopItem,
                  { borderBottomColor: cardBdr },
                  ((showStopPicker === 'from' && fromStop?.id === stop.id) ||
                    (showStopPicker === 'to' && toStop?.id === stop.id)) && { backgroundColor: TRANSPORT_ACCENT_SOFT },
                ]}
                onPress={() => {
                  if (showStopPicker === 'from') {
                    setFromStop(stop);
                  } else {
                    setToStop(stop);
                  }
                  setShowStopPicker(null);
                  setSearchQuery('');
                }}
              >
                <View
                  style={[styles.modalStopIcon, { backgroundColor: TRANSPORT_ACCENT_SOFT }]}
                >
                  <MapPin size={18} color={txt1} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalStopName, { color: txt1 }]}>{stop.name}</Text>
                  <Text style={[styles.modalStopLines, { color: txt2 }]}>
                    {stop.buses.map((b) => b.line).join(', ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 110,
  },
  // Hero
  hero: {
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 12,
    borderBottomWidth: 1.2,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '500',
    letterSpacing: -0.35,
    fontFamily: SERIF,
  },
  heroIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroPillTxt: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  card: {},
  mapPreview: {
    height: 142,
    position: 'relative',
  },
  mapExpanded: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    borderRadius: 0, // Full screen - no rounded corners
    marginBottom: 0,
    overflow: 'hidden',
  },
  expandButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expandedSearchWrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20, // Tam ekran harita için üstten boşluk
    left: 16,
    right: 16,
    zIndex: 10000,
  },
  expandedSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  expandedSearchContainer: {
    flex: 1, // Kalan alanı kapla
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  expandedMinimizeButton: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  expandedSearchResultsList: {
    marginTop: 8,
    marginRight: 62, // Minimize butonunun hizasına kadar
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  mapOverlayRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  mapLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  mapLocationText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  mapStopPill: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  mapStopLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  mapStopValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2F2418',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    paddingHorizontal: 15,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.darkGray,
  },
  areaPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  areaPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1E3CB',
  },
  areaPillActive: {
    backgroundColor: '#111114',
  },
  areaPillText: {
    color: '#6b7280',
    fontSize: 12.5,
    fontWeight: '700',
  },
  areaPillTextActive: {
    color: '#ffffff',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  editText: {
    color: '#111114',
    fontWeight: '800',
  },
  favoriteRow: {
    paddingVertical: 16,
    gap: 12,
  },
  favoriteCard: {
    width: 150,
    marginRight: 12,
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    padding: 14,
    position: 'relative',
  },
  favoriteIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  favoriteName: {
    fontWeight: '600',
    color: Colors.darkGray,
  },
  favoriteLines: {
    color: '#9ca3af',
    marginTop: 4,
    fontSize: 12,
  },
  favoriteStar: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  nearestPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#dcfce7',
  },
  nearestPillText: {
    color: '#16a34a',
    fontWeight: '600',
    fontSize: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  searchResultsList: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    maxHeight: 250, // Yüksekliği sınırla
    overflow: 'hidden', // Taşmayı engelle
    zIndex: 1000,
    elevation: 10, // Android gölge
    shadowColor: '#000', // iOS gölge
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.32)',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58,42,26,0.12)',
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchResultTitle: {
    fontWeight: '800',
    color: '#111114',
    fontSize: 14,
  },
  searchResultLines: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  noResultText: {
    color: '#6b7280',
    textAlign: 'center',
    padding: 8,
  },
  routeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeButton: {
    padding: 14,
  },
  routeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeButtonTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  routeButtonLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 4,
  },
  routeButtonValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkGray,
  },
  modalRootFill: {
    flex: 1,
  },
  modalScreen: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '500',
    fontFamily: SERIF,
    color: Colors.darkGray,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 24,
    color: Colors.darkGray,
  },
  modalSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    height: 50,
  },
  modalSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: Colors.darkGray,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
  },
  modalStopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(58,42,26,0.12)',
  },
  modalStopItemSelected: {
    backgroundColor: 'rgba(244,114,182,0.14)',
  },
  modalStopItemSelectedDark: {
    backgroundColor: 'rgba(244,114,182,0.16)',
  },
  modalStopIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalStopName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  modalStopLines: {
    fontSize: 13,
    color: '#9ca3af',
  },
  routeInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.32)',
  },
  routeInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeInfoFrom: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  routeInfoTo: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
  },
  routeInfoArrow: {
    marginHorizontal: 12,
  },
  noRouteCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.32)',
    marginTop: 12,
  },
  noRouteText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 14,
  },
  routeList: {
    marginTop: 12,
    gap: 12,
  },
  routeCard: {
    backgroundColor: '#FFF8EA',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(58,42,26,0.32)',
  },
  routeCardContent: {
    width: '100%',
  },
  routeDetails: {
    flex: 1,
  },
  routeLineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeLineBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  routeLineText: {
    fontSize: 18,
    fontWeight: '700',
  },
  routeTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  routeDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 6,
  },
  routeTypeInline: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeTypeBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  routeTypeTextSmall: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeTransferContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  routeTransferLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#fbbf24',
    borderRadius: 1,
  },
  routeTransferContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  routeTransferText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
    flex: 1,
  },
});

export default TransportScreen;
