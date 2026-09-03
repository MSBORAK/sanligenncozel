import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { ArrowLeft, ShieldOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/context/UserContext';
import { useAppTheme } from '@/theme/useAppTheme';
import { AppAlert } from '@/lib/alert';

interface BlockedUserRow {
  id: string;
  blocked_id: string;
  name: string;
  username: string;
  avatar_url?: string;
}

export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const { t: tr } = useTranslation();
  const { profile } = useUser();
  const t = useAppTheme();

  const [rows, setRows] = useState<BlockedUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const fetchBlockedUsers = useCallback(async () => {
    const userId = profile?.userId;
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: blocks, error } = await supabase
        .from('blocked_users')
        .select('id, blocked_id')
        .eq('blocker_id', userId);
      if (error || !blocks || blocks.length === 0) {
        setRows([]);
        return;
      }

      const blockedIds = blocks.map((b: any) => b.blocked_id);
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, name, username, avatar_url')
        .in('user_id', blockedIds);
      const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));

      setRows(
        blocks.map((b: any) => {
          const p = profileMap.get(b.blocked_id);
          return {
            id: b.id,
            blocked_id: b.blocked_id,
            name: p?.name || p?.username || tr('common.kullanici'),
            username: p?.username || '',
            avatar_url: p?.avatar_url,
          };
        })
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.userId, tr]);

  useFocusEffect(
    useCallback(() => {
      fetchBlockedUsers();
    }, [fetchBlockedUsers])
  );

  const handleUnblock = (row: BlockedUserRow) => {
    AppAlert.alert(
      tr('sosyalProfile.engeliKaldir'),
      tr('sosyalProfile.engeliKaldirOnay', { name: row.name }),
      [
        { text: tr('common.cancel'), style: 'cancel' },
        {
          text: tr('sosyalProfile.engeliKaldir'),
          style: 'destructive',
          onPress: async () => {
            setUnblockingId(row.id);
            try {
              const { error } = await supabase
                .from('blocked_users')
                .delete()
                .eq('id', row.id);
              if (error) throw error;
              setRows(prev => prev.filter(r => r.id !== row.id));
            } catch {
              AppAlert.alert(tr('common.error'), tr('sosyalProfile.islemBasarisiz'));
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: t.pageBg }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: t.divider }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft color={t.txt1} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.txt1 }]}>{tr('profileScreen.engellenenKullanicilar')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.txt2} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.center}>
          <ShieldOff color={t.txt2} size={40} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: t.txt1 }]}>{tr('profileScreen.engellenenYok')}</Text>
          <Text style={[styles.emptySub, { color: t.txt2 }]}>{tr('profileScreen.engellenenYokAciklama')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderColor: t.cardBdr, backgroundColor: t.cardBg }]}>
              <View style={[styles.avatar, { backgroundColor: t.chipBg }]}>
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
                ) : (
                  <Text style={[styles.avatarText, { color: t.txt1 }]}>{item.name.charAt(0).toUpperCase()}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: t.txt1 }]} numberOfLines={1}>{item.name}</Text>
                {!!item.username && (
                  <Text style={[styles.username, { color: t.txt2 }]} numberOfLines={1}>@{item.username}</Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => handleUnblock(item)}
                disabled={unblockingId === item.id}
                style={[styles.unblockBtn, { backgroundColor: t.ctaBg }]}
              >
                {unblockingId === item.id ? (
                  <ActivityIndicator color={t.ctaTxt} size="small" />
                ) : (
                  <Text style={[styles.unblockTxt, { color: t.ctaTxt }]}>{tr('sosyalProfile.engeliKaldir')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptySub: { fontSize: 13, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 17, fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '700' },
  username: { fontSize: 13, marginTop: 1 },
  unblockBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  unblockTxt: { fontSize: 13, fontWeight: '700' },
});
