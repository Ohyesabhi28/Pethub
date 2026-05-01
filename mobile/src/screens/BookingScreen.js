import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

// Build next 7 days × 4 slots each (10:00, 12:00, 14:00, 16:00).
function buildSlots() {
  const slots = [];
  const now = new Date();
  for (let d = 1; d <= 7; d++) {
    for (const hour of [10, 12, 14, 16]) {
      const dt = new Date(now);
      dt.setDate(now.getDate() + d);
      dt.setHours(hour, 0, 0, 0);
      slots.push(dt);
    }
  }
  return slots;
}

// Group slots by day label.
function groupByDay(slots) {
  const map = new Map();
  for (const dt of slots) {
    const key = dt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(dt);
  }
  return [...map.entries()];
}

export default function BookingScreen({ route, navigation }) {
  const { vet } = route.params;
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loadingPets, setLoadingPets] = useState(true);

  const slots = buildSlots();
  const grouped = groupByDay(slots);

  useEffect(() => {
    client.get('/pets')
      .then((r) => {
        const list = r.data.pets || [];
        setPets(list);
        if (list[0]) setPetId(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingPets(false));
  }, []);

  const book = async () => {
    if (!petId) return Alert.alert('Select a pet', 'Please pick a pet for this appointment.');
    if (!slot) return Alert.alert('Select a time', 'Please choose a time slot.');
    setBusy(true);
    try {
      const r = await client.post('/appointments', {
        petId,
        vetId: vet.uid,
        dateTime: slot.toISOString(),
      });
      const appt = r.data.appointment;
      Alert.alert(
        'Appointment Confirmed! 🎉',
        `Booked with ${vet.name} on ${slot.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} at ${slot.getHours()}:00`,
        [
          {
            text: 'Join Video Call',
            onPress: () => navigation.replace('VideoCall', { roomId: appt.id, role: 'caller' }),
          },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.error?.message || err?.message;
      if (status === 409) {
        Alert.alert('Slot Unavailable', 'This time was just booked. Please pick a different slot.');
      } else {
        Alert.alert('Booking failed', msg);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Vet Info Card */}
      <View style={[s.vetCard, shadows.md]}>
        <View style={s.vetAvatar}>
          <Text style={s.vetAvatarText}>
            {vet.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={s.vetInfo}>
          <Text style={s.vetName}>{vet.name}</Text>
          <View style={s.vetSpecRow}>
            <Ionicons name="medical" size={13} color={colors.primary} />
            <Text style={s.vetSpec}>{vet.speciality || 'General Practice'}</Text>
          </View>
          <View style={s.vetVerified}>
            <Ionicons name="shield-checkmark" size={12} color={colors.success} />
            <Text style={s.vetVerifiedText}>Verified Veterinarian</Text>
          </View>
        </View>
      </View>

      {/* Pet Selector */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          <Ionicons name="paw" size={16} color={colors.text} /> Select Pet
        </Text>
        {loadingPets ? (
          <ActivityIndicator color={colors.primary} />
        ) : pets.length === 0 ? (
          <View style={s.noPets}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={s.noPetsText}>Add a pet first before booking.</Text>
          </View>
        ) : (
          <View style={s.chipRow}>
            {pets.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[s.petChip, petId === p.id && s.petChipActive]}
                onPress={() => setPetId(p.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="paw"
                  size={13}
                  color={petId === p.id ? colors.white : colors.primary}
                />
                <Text style={[s.chipText, petId === p.id && s.chipTextActive]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Time Slot Picker */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>
          <Ionicons name="calendar" size={16} color={colors.text} /> Choose Time Slot
        </Text>
        {grouped.map(([dayLabel, daySlots]) => (
          <View key={dayLabel} style={s.dayGroup}>
            <Text style={s.dayLabel}>{dayLabel}</Text>
            <View style={s.slotsRow}>
              {daySlots.map((dt) => {
                const isSelected = slot?.getTime() === dt.getTime();
                return (
                  <TouchableOpacity
                    key={dt.toISOString()}
                    style={[s.slotChip, isSelected && s.slotChipActive]}
                    onPress={() => setSlot(dt)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.slotText, isSelected && s.slotTextActive]}>
                      {dt.getHours()}:00
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      {/* Selected summary */}
      {slot && (
        <View style={s.summaryBox}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={s.summaryText}>
            {slot.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })} at {slot.getHours()}:00
          </Text>
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        style={[s.confirmBtn, (busy || !slot || !petId) && s.confirmBtnDisabled]}
        disabled={busy || !slot || !petId}
        onPress={book}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Text style={s.confirmText}>Confirm Appointment</Text>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 120 },

  // Vet card
  vetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 16,
    marginBottom: 8,
  },
  vetAvatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  vetAvatarText: { color: colors.white, fontWeight: '800', fontSize: 20 },
  vetInfo: { flex: 1, gap: 4 },
  vetName: { fontSize: 18, fontWeight: '700', color: colors.text },
  vetSpecRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vetSpec: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  vetVerified: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vetVerifiedText: { fontSize: 12, color: colors.success, fontWeight: '600' },

  // Sections
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },

  noPets: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.warningLight, borderRadius: 10 },
  noPetsText: { color: colors.warning, fontSize: 13, fontWeight: '600' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  petChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  petChipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  chipTextActive: { color: colors.white },

  // Day groups
  dayGroup: { marginBottom: 14 },
  dayLabel: { fontSize: 13, fontWeight: '700', color: colors.textSub, marginBottom: 8 },
  slotsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
  slotTextActive: { color: colors.white },

  // Summary
  summaryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.successLight,
    borderRadius: 12, padding: 14, marginTop: 8,
  },
  summaryText: { fontSize: 14, fontWeight: '600', color: colors.success },

  // Confirm
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 56, borderRadius: 16, marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  confirmBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  confirmText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
