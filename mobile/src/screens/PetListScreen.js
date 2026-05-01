import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

const SPECIES_ICONS = { dog: 'paw', cat: 'paw', bird: 'egg', rabbit: 'leaf', other: 'ellipse' };
const SPECIES_COLORS = { dog: colors.dog, cat: colors.cat, bird: colors.bird, rabbit: colors.rabbit, other: colors.other };

export default function PetListScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await client.get('/pets');
      setPets(r.data.pets);
    } catch (err) {
      Alert.alert('Failed to load pets', err?.message || 'Network error');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = (id, name) => {
    Alert.alert(`Remove ${name}?`, 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try { await client.delete(`/pets/${id}`); load(); }
          catch (err) { Alert.alert('Delete failed', err?.message); }
        },
      },
    ]);
  };

  const speciesKey = (sp) => (sp || '').toLowerCase();

  return (
    <View style={s.root}>
      <FlatList
        data={pets}
        keyExtractor={(p) => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={pets.length === 0 ? s.emptyContainer : s.listContent}
        ListEmptyComponent={
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <Ionicons name="paw-outline" size={48} color={colors.primaryLight} />
            </View>
            <Text style={s.emptyTitle}>No pets yet</Text>
            <Text style={s.emptySub}>Tap the + button below to add your first pet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sp = speciesKey(item.species);
          const iconColor = SPECIES_COLORS[sp] || colors.other;
          const iconName = SPECIES_ICONS[sp] || 'paw';
          return (
            <View style={[s.petCard, shadows.sm]}>
              <View style={[s.petAvatar, { backgroundColor: iconColor + '22' }]}>
                <Ionicons name={iconName} size={24} color={iconColor} />
              </View>
              <View style={s.petInfo}>
                <Text style={s.petName}>{item.name}</Text>
                <Text style={s.petMeta}>
                  {item.species} · {item.breed || 'Mixed'} · {item.age}y
                  {item.weightKg ? ` · ${item.weightKg}kg` : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => remove(item.id, item.name)}
                style={s.deleteBtn}
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <TouchableOpacity
        style={[s.fab, shadows.lg]}
        onPress={() => navigation.navigate('AddPet', { onSaved: load })}
        accessibilityLabel="Add a pet"
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: 16, gap: 12, paddingBottom: 90 },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8 },
  emptySub: { color: colors.textSub, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  petCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 14, gap: 12 },
  petAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  petInfo: { flex: 1 },
  petName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 3 },
  petMeta: { fontSize: 13, color: colors.textSub },
  deleteBtn: { padding: 8 },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: colors.primary, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
});
