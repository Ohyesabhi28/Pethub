import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Image, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import client from '../api/client';
import { colors, shadows } from '../theme/colors';

const SPECIES = [
  { key: 'dog',    label: 'Dog',    icon: 'paw',    color: colors.dog    },
  { key: 'cat',    label: 'Cat',    icon: 'paw',    color: colors.cat    },
  { key: 'bird',   label: 'Bird',   icon: 'egg',    color: colors.bird   },
  { key: 'rabbit', label: 'Rabbit', icon: 'leaf',   color: colors.rabbit },
  { key: 'other',  label: 'Other',  icon: 'ellipse',color: colors.other  },
];

function Field({ label, required, children }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>
        {label}
        {required && <Text style={{ color: colors.error }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const f = StyleSheet.create({
  wrap: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSub, marginBottom: 7 },
});

export default function AddPetScreen({ navigation, route }) {
  const [name, setName]       = useState('');
  const [species, setSpecies] = useState('dog');
  const [breed, setBreed]     = useState('');
  const [age, setAge]         = useState('');
  const [weight, setWeight]   = useState('');
  const [history, setHistory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy]       = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Photo library access denied.');
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.5,
      allowsEditing: true,
      aspect: [1, 1],
      maxWidth: 800,
      maxHeight: 800,
    });
    if (!r.canceled && r.assets?.[0]) {
      const a = r.assets[0];
      setImageUrl(`data:${a.mimeType || 'image/jpeg'};base64,${a.base64}`);
    }
  };

  const onSave = async () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Please enter your pet\'s name.');
    if (!age)          return Alert.alert('Missing age',  'Please enter your pet\'s age.');
    setBusy(true);
    try {
      await client.post('/pets', {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
        age: parseFloat(age),
        weightKg: weight ? parseFloat(weight) : null,
        history: history.trim() || undefined,
        imageUrl: imageUrl || undefined,
      });
      route.params?.onSaved?.();
      navigation.goBack();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message;
      Alert.alert('Save failed', msg);
    } finally {
      setBusy(false);
    }
  };

  const selectedSpecies = SPECIES.find((s) => s.key === species);

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Photo area */}
      <TouchableOpacity style={s.photoArea} onPress={pickPhoto} activeOpacity={0.8}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={s.photo} />
        ) : (
          <View style={s.photoPlaceholder}>
            <View style={[s.photoIconCircle, { backgroundColor: (selectedSpecies?.color || colors.primary) + '22' }]}>
              <Ionicons name={selectedSpecies?.icon || 'paw'} size={36} color={selectedSpecies?.color || colors.primary} />
            </View>
            <Text style={s.photoHint}>Tap to add a photo</Text>
            <Text style={s.photoSub}>Optional — JPEG or PNG</Text>
          </View>
        )}
        <View style={s.cameraBtn}>
          <Ionicons name="camera" size={16} color={colors.white} />
        </View>
      </TouchableOpacity>

      {/* Form card */}
      <View style={[s.card, shadows.sm]}>
        {/* Pet name */}
        <Field label="Pet Name" required>
          <View style={s.inputRow}>
            <Ionicons name="heart-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="e.g. Buddy, Mia, Kiku..."
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>
        </Field>

        {/* Species */}
        <Field label="Species" required>
          <View style={s.speciesRow}>
            {SPECIES.map((sp) => (
              <TouchableOpacity
                key={sp.key}
                style={[s.speciesChip, species === sp.key && { backgroundColor: sp.color, borderColor: sp.color }]}
                onPress={() => setSpecies(sp.key)}
                activeOpacity={0.75}
              >
                <Ionicons name={sp.icon} size={14} color={species === sp.key ? colors.white : colors.textSub} />
                <Text style={[s.speciesText, species === sp.key && s.speciesTextActive]}>{sp.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        {/* Breed */}
        <Field label="Breed">
          <View style={s.inputRow}>
            <Ionicons name="ribbon-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="e.g. Golden Retriever, Indie..."
              placeholderTextColor={colors.textMuted}
              value={breed}
              onChangeText={setBreed}
            />
          </View>
        </Field>

        {/* Age & Weight row */}
        <View style={s.twoCol}>
          <View style={{ flex: 1 }}>
            <Field label="Age (years)" required>
              <View style={s.inputRow}>
                <Ionicons name="calendar-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="e.g. 2"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={age}
                  onChangeText={setAge}
                />
              </View>
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Weight (kg)">
              <View style={s.inputRow}>
                <Ionicons name="barbell-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  placeholder="e.g. 12"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={weight}
                  onChangeText={setWeight}
                />
              </View>
            </Field>
          </View>
        </View>

        {/* Medical history */}
        <Field label="Medical History / Notes">
          <View style={[s.inputRow, s.textAreaRow]}>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="Allergies, past conditions, vaccinations..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={history}
              onChangeText={setHistory}
            />
          </View>
        </Field>
      </View>

      {/* Save button */}
      <TouchableOpacity
        style={[s.saveBtn, busy && s.saveBtnDisabled]}
        disabled={busy}
        onPress={onSave}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={colors.white} />
            <Text style={s.saveBtnText}>Save Pet</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },

  // Photo
  photoArea: {
    height: 180, borderRadius: 18, overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
  },
  photo: { width: '100%', height: '100%', borderRadius: 18 },
  photoPlaceholder: { alignItems: 'center', gap: 8 },
  photoIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontSize: 14, fontWeight: '600', color: colors.textSub },
  photoSub: { fontSize: 12, color: colors.textMuted },
  cameraBtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  // Card
  card: { backgroundColor: colors.surface, borderRadius: 18, padding: 20, marginBottom: 16 },

  // Inputs
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 12, backgroundColor: colors.bg,
    paddingHorizontal: 12, minHeight: 50,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },

  textAreaRow: { alignItems: 'flex-start', paddingVertical: 10 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },

  // Species chips
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.bg,
  },
  speciesText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
  speciesTextActive: { color: colors.white },

  // Two-column layout
  twoCol: { flexDirection: 'row', gap: 12 },

  // Save
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.primary,
    height: 56, borderRadius: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.55, shadowOpacity: 0 },
  saveBtnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});
