import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

const STATUS_COLORS = {
  Pending:    { bg: colors.warningLight, text: colors.warning  },
  Processing: { bg: colors.infoLight,    text: colors.info     },
  Shipped:    { bg: colors.primaryLight, text: colors.primary  },
  Delivered:  { bg: colors.successLight, text: colors.success  },
  Cancelled:  { bg: colors.errorLight,   text: colors.error    },
};

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || { bg: colors.surfaceAlt, text: colors.textSub };
  return (
    <View style={[sb.badge, { backgroundColor: style.bg }]}>
      <Text style={[sb.text, { color: style.text }]}>{status || 'Unknown'}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  badge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8 },
  text: { fontSize: 11, fontWeight: '700' },
});

function SectionHeader({ icon, title, count }) {
  return (
    <View style={sh.row}>
      <View style={sh.iconWrap}>
        <Ionicons name={icon} size={16} color={colors.primary} />
      </View>
      <Text style={sh.title}>{title}</Text>
      <View style={sh.countBadge}>
        <Text style={sh.count}>{count}</Text>
      </View>
    </View>
  );
}
const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.bg },
  iconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  countBadge: { backgroundColor: colors.primary, minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  count: { color: colors.white, fontSize: 12, fontWeight: '700' },
});

export default function AdminScreen() {
  const [pending, setPending] = useState([]);
  const [orders, setOrders]   = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [pv, ord] = await Promise.all([
        client.get('/admin/pending-vets'),
        client.get('/admin/orders'),
      ]);
      setPending(pv.data.vets   || []);
      setOrders(ord.data.orders || []);
    } catch (err) {
      Alert.alert('Failed to load', err?.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const approve = (uid, name) => {
    Alert.alert(`Approve ${name}?`, 'They will be able to receive appointments.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Approve',
        onPress: async () => {
          try { await client.post(`/admin/approve-vet/${uid}`); load(); }
          catch (err) { Alert.alert('Failed', err?.message); }
        },
      },
    ]);
  };

  return (
    <View style={s.root}>
      <FlatList
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <>
            {/* ── Pending Vets ─────────────────────────────── */}
            <SectionHeader icon="time-outline" title="Pending Vet Approvals" count={pending.length} />

            {pending.length === 0 ? (
              <View style={s.emptySection}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
                <Text style={s.emptyText}>All vets approved — nothing pending!</Text>
              </View>
            ) : (
              <View style={s.cardList}>
                {pending.map((v) => (
                  <View key={v.uid} style={[s.vetCard, shadows.sm]}>
                    <View style={s.vetAvatar}>
                      <Text style={s.vetAvatarText}>
                        {(v.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.vetInfo}>
                      <Text style={s.vetName}>{v.name}</Text>
                      <Text style={s.vetEmail} numberOfLines={1}>{v.email}</Text>
                      {v.speciality && (
                        <Text style={s.vetSpec}>{v.speciality}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={s.approveBtn}
                      onPress={() => approve(v.uid, v.name)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                      <Text style={s.approveBtnText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* ── Orders ────────────────────────────────────── */}
            <SectionHeader icon="bag-outline" title="Recent Orders" count={orders.length} />
          </>
        }
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          !refreshing && (
            <View style={s.emptySection}>
              <Ionicons name="receipt-outline" size={24} color={colors.border} />
              <Text style={s.emptyText}>No orders yet</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={[s.orderCard, shadows.sm]}>
            <View style={s.orderIcon}>
              <Ionicons name="receipt-outline" size={20} color={colors.primary} />
            </View>
            <View style={s.orderInfo}>
              <Text style={s.orderTotal}>₹{(item.total ?? 0).toFixed(2)}</Text>
              <Text style={s.orderMeta}>
                {item.items?.length || 0} item{item.items?.length !== 1 ? 's' : ''} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  emptySection: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 16, marginHorizontal: 16, marginBottom: 8,
    backgroundColor: colors.surface, borderRadius: 14,
  },
  emptyText: { color: colors.textSub, fontSize: 14, fontWeight: '500' },

  cardList: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },

  // Vet pending card
  vetCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 12,
  },
  vetAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  vetAvatarText: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  vetInfo: { flex: 1 },
  vetName: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  vetEmail: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  vetSpec: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  approveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.success,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12,
  },
  approveBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },

  // Order card
  orderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, marginHorizontal: 16, marginBottom: 10, gap: 12,
  },
  orderIcon: {
    width: 44, height: 44, borderRadius: 13,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  orderInfo: { flex: 1 },
  orderTotal: { fontSize: 16, fontWeight: '700', color: colors.text },
  orderMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
