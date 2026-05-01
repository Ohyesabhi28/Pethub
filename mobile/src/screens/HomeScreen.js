import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { colors, shadows } from '../theme/colors';

const { width } = Dimensions.get('window');
const CARD_W = (width - 48) / 2;

const ACTIONS = [
  { label: 'My Pets', screen: 'Pets', icon: 'paw', color: '#F59E0B', bg: '#FEF3C7' },
  { label: 'Ask AI', screen: 'AI', icon: 'chatbubble-ellipses', color: '#8B5CF6', bg: '#EDE9FE' },
  { label: 'Find a Vet', screen: 'Vets', icon: 'medical', color: '#0284C7', bg: '#E0F2FE' },
  { label: 'Pharmacy', screen: 'Pharmacy', icon: 'medkit', color: '#059669', bg: '#D1FAE5' },
];

export default function HomeScreen({ navigation }) {
  const { profile, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const initials = profile?.name
    ? profile.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Hero Header */}
      <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
        <View style={s.heroRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Hi, {profile?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={s.roleText}>{profile?.role || 'PetHub User'}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={s.signOutBtn} accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
        <View style={s.heroBadge}>
          <Ionicons name="shield-checkmark" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={s.heroBadgeText}>Your pet's health, all in one place</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Actions</Text>
        <View style={s.grid}>
          {ACTIONS.map(({ label, screen, icon, color, bg }) => (
            <TouchableOpacity
              key={label}
              style={[s.card, { backgroundColor: bg }, shadows.sm]}
              onPress={() => navigation.navigate(screen)}
              activeOpacity={0.75}
              accessibilityLabel={label}
            >
              <View style={[s.iconCircle, { backgroundColor: color }]}>
                <Ionicons name={icon} size={22} color="#fff" />
              </View>
              <Text style={[s.cardLabel, { color }]}>{label}</Text>
              <Ionicons name="chevron-forward" size={14} color={color} style={{ opacity: 0.6 }} />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tips card */}
      <View style={s.section}>
        <View style={[s.tipsCard, shadows.sm]}>
          <View style={s.tipsIconWrap}>
            <Ionicons name="bulb" size={20} color={colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.tipTitle}>Pet Care Tip</Text>
            <Text style={s.tipBody}>Regular vet checkups every 6 months keep your pet healthy and happy.</Text>
          </View>
        </View>
      </View>

      {/* Admin Panel */}
      {profile?.role === 'Admin' && (
        <View style={[s.section, { marginBottom: 8 }]}>
          <TouchableOpacity
            style={[s.adminBanner, shadows.sm]}
            onPress={() => navigation.navigate('Admin')}
            activeOpacity={0.8}
          >
            <View style={s.adminIcon}>
              <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            </View>
            <Text style={s.adminText}>Admin Panel</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  avatarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  greeting: { color: colors.white, fontSize: 20, fontWeight: '700' },
  roleText: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 1 },
  signOutBtn: { padding: 6 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroBadgeText: { color: 'rgba(255,255,255,0.78)', fontSize: 13 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: CARD_W,
    padding: 18,
    borderRadius: 16,
    gap: 10,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: 14, fontWeight: '700' },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  tipsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontWeight: '700', color: colors.text, fontSize: 14, marginBottom: 4 },
  tipBody: { color: colors.textSub, fontSize: 13, lineHeight: 19 },
  adminBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  adminIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminText: { flex: 1, fontWeight: '700', color: colors.primary, fontSize: 15 },
});
