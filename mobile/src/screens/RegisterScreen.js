import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme/colors';

const ROLES = [
  { key: 'PetOwner', label: 'Pet Owner', icon: 'person', desc: 'Manage your pets & appointments' },
  { key: 'Veterinarian', label: 'Veterinarian', icon: 'medkit', desc: 'Accept & manage appointments' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PetOwner');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password || !name) {
      Alert.alert('Missing fields', 'All fields are required.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await register({ email: email.trim(), password, name, role });
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Unknown error';
      Alert.alert('Registration failed', msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[s.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>

      <Text style={s.pageTitle}>Create account</Text>
      <Text style={s.pageSub}>Join PetHub to care for your pet</Text>

      <View style={[s.card, shadows.md]}>
        {/* Name */}
        <View style={s.inputWrap}>
          <Text style={s.label}>Full Name</Text>
          <View style={s.inputRow}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        {/* Email */}
        <View style={s.inputWrap}>
          <Text style={s.label}>Email</Text>
          <View style={s.inputRow}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        {/* Password */}
        <View style={s.inputWrap}>
          <Text style={s.label}>Password</Text>
          <View style={s.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Min 6 characters"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Selector */}
        <Text style={[s.label, { marginBottom: 10 }]}>I am a</Text>
        <View style={s.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity
              key={r.key}
              style={[s.roleCard, role === r.key && s.roleCardActive]}
              onPress={() => setRole(r.key)}
              activeOpacity={0.8}
            >
              <Ionicons name={r.icon} size={20} color={role === r.key ? colors.white : colors.textSub} />
              <Text style={[s.roleLabel, role === r.key && s.roleLabelActive]}>{r.label}</Text>
              <Text style={[s.roleDesc, role === r.key && { color: 'rgba(255,255,255,0.75)' }]}>{r.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {role === 'Veterinarian' && (
          <View style={s.noteBox}>
            <Ionicons name="time-outline" size={15} color={colors.warning} />
            <Text style={s.noteText}>Vet accounts require admin approval before you can receive bookings.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, busy && s.btnDisabled]}
          disabled={busy}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          <Text style={s.btnText}>{busy ? 'Creating account...' : 'Create account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()} style={s.linkBtn}>
          <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...{ shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } },
  pageTitle: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 6 },
  pageSub: { color: colors.textSub, fontSize: 15, marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 22 },
  inputWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSub, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.bg, paddingHorizontal: 12, height: 50 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bg, gap: 6 },
  roleCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  roleLabelActive: { color: colors.white },
  roleDesc: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  noteBox: { flexDirection: 'row', gap: 8, backgroundColor: colors.warningLight, borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'flex-start' },
  noteText: { flex: 1, fontSize: 13, color: colors.warning, lineHeight: 18 },
  btn: { backgroundColor: colors.primary, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: colors.textSub, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
});
