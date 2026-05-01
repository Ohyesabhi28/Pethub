import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('owner@pethub.local');
  const [password, setPassword] = useState('password123');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Email and password are required.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      Alert.alert('Login failed', err?.message || 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
      <ScrollView
        contentContainerStyle={[s.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoCircle}>
            <Ionicons name="paw" size={38} color={colors.white} />
          </View>
          <Text style={s.appName}>PetHub</Text>
          <Text style={s.tagline}>Pet care, in your pocket</Text>
        </View>

        {/* Form Card */}
        <View style={[s.card, shadows.md]}>
          <Text style={s.cardTitle}>Welcome back</Text>

          <View style={s.inputWrap}>
            <Text style={s.label}>Email</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={s.inputWrap}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="Enter your password"
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

          <TouchableOpacity
            style={[s.btn, busy && s.btnDisabled]}
            disabled={busy}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            {busy
              ? <Text style={s.btnText}>Signing in...</Text>
              : (
                <View style={s.btnInner}>
                  <Text style={s.btnText}>Sign in</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </View>
              )
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={s.linkBtn}>
            <Text style={s.linkText}>
              Don't have an account? <Text style={s.linkBold}>Create one</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Demo hint */}
        <View style={s.hint}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <Text style={s.hintText}>Demo: owner@pethub.local / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  appName: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  tagline: { color: colors.textSub, fontSize: 14, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 20 },
  inputWrap: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSub, marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: colors.text },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  btnDisabled: { opacity: 0.6, shadowOpacity: 0 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  linkBtn: { alignItems: 'center', marginTop: 16 },
  linkText: { color: colors.textSub, fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: '700' },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  hintText: { color: colors.textMuted, fontSize: 12 },
});
