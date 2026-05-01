import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

const SPECIALITY_ICONS = {
  'General practice': 'medical',
  'Orthopedics': 'body',
  'Dermatology': 'color-palette',
  'Cardiology': 'heart',
  'Dentistry': 'happy',
  'Surgery': 'cut',
};

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#0284C7', '#8B5CF6'];

export default function VetSearchScreen({ navigation }) {
  const [vets, setVets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await client.get('/appointments/vets');
      setVets(r.data.vets || []);
    } catch (err) {
      Alert.alert('Failed to load vets', err?.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderVet = ({ item, index }) => {
    const speciality = item.speciality || 'General practice';
    const iconName = SPECIALITY_ICONS[speciality] || 'medical';
    const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

    return (
      <View style={[s.card, shadows.sm]}>
        {/* Avatar */}
        <View style={[s.avatar, { backgroundColor: avatarColor }]}>
          <Text style={s.avatarText}>{getInitials(item.name)}</Text>
        </View>

        {/* Info */}
        <View style={s.info}>
          <Text style={s.vetName}>{item.name}</Text>
          <View style={s.specialityRow}>
            <Ionicons name={iconName} size={13} color={colors.primary} />
            <Text style={s.specialityText}>{speciality}</Text>
          </View>
          <View style={s.badgeRow}>
            <View style={s.verifiedBadge}>
              <Ionicons name="shield-checkmark" size={11} color={colors.success} />
              <Text style={s.verifiedText}>Verified</Text>
            </View>
            <View style={s.availBadge}>
              <View style={s.dot} />
              <Text style={s.availText}>Available</Text>
            </View>
          </View>
        </View>

        {/* Book Button */}
        <TouchableOpacity
          style={s.bookBtn}
          onPress={() => navigation.navigate('Booking', { vet: item })}
          activeOpacity={0.8}
          accessibilityLabel={`Book appointment with ${item.name}`}
        >
          <Text style={s.bookText}>Book</Text>
          <Ionicons name="calendar-outline" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <FlatList
        data={vets}
        keyExtractor={(v) => v.uid}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />
        }
        contentContainerStyle={vets.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="medical-outline" size={48} color={colors.primaryLight} />
            </View>
            <Text style={s.emptyTitle}>No vets available</Text>
            <Text style={s.emptySub}>Ask your admin to approve veterinarians so they appear here.</Text>
          </View>
        }
        renderItem={renderVet}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: colors.white, fontWeight: '800', fontSize: 18 },

  info: { flex: 1, gap: 4 },
  vetName: { fontSize: 16, fontWeight: '700', color: colors.text },
  specialityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specialityText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.successLight,
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8,
  },
  verifiedText: { fontSize: 11, color: colors.success, fontWeight: '600' },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primaryLight,
    paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  availText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.primary,
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12,
  },
  bookText: { color: colors.white, fontWeight: '700', fontSize: 14 },
});
