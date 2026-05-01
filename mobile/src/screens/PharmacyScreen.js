import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, TextInput, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api/client';
import RazorpayCheckout from 'react-native-razorpay';
import { colors, shadows } from '../theme/colors';

const CATEGORIES = [
  'All', 'Antibiotics', 'Dewormers', 'Parasite Control', 'Vaccines',
  'Pain Relief', 'Allergy & Skin', 'Ear & Eye', 'Digestive',
  'Vitamins', 'Heart & Liver', 'Grooming', 'Hormonal',
  'Urinary', 'Diet Food', 'First Aid',
];

export default function PharmacyScreen() {
  const [meds, setMeds] = useState([]);
  const [cart, setCart] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const r = await client.get('/pharmacy/medicines');
      setMeds(r.data.medicines || []);
    } catch (err) {
      Alert.alert('Failed to load', err?.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const inc = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }));
  const dec = (id) =>
    setCart((c) => {
      const n = (c[id] || 0) - 1;
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = n;
      return next;
    });

  const filteredMeds = meds.filter((m) => {
    const matchCat = activeCategory === 'All' || m.category === activeCategory;
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const total = meds.reduce((sum, m) => sum + (cart[m.id] || 0) * m.price, 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const checkout = async () => {
    if (!itemCount) return Alert.alert('Cart is empty', 'Add medicines to your cart first.');
    setBusy(true);
    try {
      const items = Object.entries(cart).map(([medicineId, quantity]) => ({ medicineId, quantity }));
      const r = await client.post('/orders', { items, paymentMethod: 'razorpay' });

      if (r.data.razorpayOrderId && r.data.razorpayOrderId !== 'mock_rzp_order_id') {
        const options = {
          description: 'PetHub Pharmacy Order',
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: Math.round(r.data.total * 100),
          name: 'PetHub',
          order_id: r.data.razorpayOrderId,
          theme: { color: colors.primary },
        };
        await RazorpayCheckout.open(options);
      }

      Alert.alert('Order Placed! 🎉', `Total ₹${r.data.total.toFixed(2)} — Your order has been confirmed.`);
      setCart({});
      load();
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message;
      Alert.alert('Checkout failed', msg);
    } finally {
      setBusy(false);
    }
  };

  const renderMed = ({ item }) => {
    const qty = cart[item.id] || 0;
    return (
      <View style={[s.medCard, shadows.md]}>
        <View style={s.medInfoContainer}>
          <View style={[s.medIcon, { backgroundColor: item.requiresRx ? colors.errorLight : colors.primaryLight }]}>
            <Ionicons
              name={item.requiresRx ? 'document-text' : 'medical'}
              size={24}
              color={item.requiresRx ? colors.error : colors.primary}
            />
          </View>
          <View style={s.medInfo}>
            <View style={s.medTitleRow}>
              <Text style={s.medName} numberOfLines={1}>{item.name}</Text>
            </View>
            <View style={s.tagsRow}>
              <Text style={s.medCategory}>{item.category || 'General'}</Text>
              {item.requiresRx && (
                <View style={s.rxBadge}>
                  <Text style={s.rxText}>Prescription</Text>
                </View>
              )}
            </View>
            <View style={s.medMeta}>
              <Text style={s.medPrice}>₹{item.price.toFixed(2)}</Text>
              <Text style={s.medStock}>• Stock: {item.stock}</Text>
            </View>
          </View>
        </View>

        {/* Beautiful Qty Controls */}
        <View style={s.actionRow}>
          {qty === 0 ? (
            <TouchableOpacity
              style={[s.pillBtn, s.addPillBtn, item.stock === 0 && s.disabledBtn]}
              onPress={() => inc(item.id)}
              disabled={item.stock === 0}
              activeOpacity={0.8}
            >
              <Text style={s.addPillText}>{item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</Text>
              <Ionicons name="cart" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={s.qtyControl}>
              <TouchableOpacity style={s.qtyPillBtn} onPress={() => dec(item.id)}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <View style={s.qtyNumWrapper}>
                <Text style={s.qtyNum}>{qty}</Text>
              </View>
              <TouchableOpacity style={s.qtyPillBtn} onPress={() => inc(item.id)}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* Search Bar - Modern Soft UI */}
      <View style={s.headerWrap}>
        <View style={s.searchWrap}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={{ marginRight: 10 }} />
          <TextInput
            style={s.searchInput}
            placeholder="Search premium medicines..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modern Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catChip, activeCategory === cat && s.catChipActive, shadows.sm]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[s.catText, activeCategory === cat && s.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Medicines List */}
      <FlatList
        data={filteredMeds}
        keyExtractor={(m) => m.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.primary} />}
        contentContainerStyle={s.listContent}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="flask-outline" size={56} color={colors.border} />
            <Text style={s.emptyText}>No matching products found</Text>
          </View>
        }
        renderItem={renderMed}
      />

      {/* Premium Floating Cart Bar */}
      {itemCount > 0 && (
        <View style={[s.cartBarWrap, shadows.lg]}>
          <View style={s.cartBar}>
            <View style={s.cartInfo}>
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{itemCount}</Text>
              </View>
              <View>
                <Text style={s.cartTotal}>₹{total.toFixed(2)}</Text>
                <Text style={s.cartItems}>{itemCount} item{itemCount !== 1 ? 's' : ''} in cart</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.checkoutBtn, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={checkout}
              activeOpacity={0.85}
            >
              <Text style={s.checkoutText}>{busy ? 'Processing...' : 'Checkout'}</Text>
              {!busy && <Ionicons name="arrow-forward" size={18} color={colors.white} />}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  headerWrap: { backgroundColor: colors.surface, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, marginHorizontal: 16, marginTop: 16, borderRadius: 16, paddingHorizontal: 16, height: 54, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '500' },
  catScroll: { flexGrow: 0, backgroundColor: colors.surface, paddingBottom: 8 },
  catContent: { paddingHorizontal: 16, gap: 10, paddingVertical: 12 },
  catChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 14, fontWeight: '600', color: colors.textSub },
  catTextActive: { color: colors.white },
  listContent: { padding: 16, gap: 16, paddingBottom: 120 },
  medCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, overflow: 'hidden' },
  medInfoContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  medIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  medName: { fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  medCategory: { fontSize: 13, color: colors.textSub, fontWeight: '500' },
  rxBadge: { backgroundColor: colors.errorLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  rxText: { fontSize: 11, fontWeight: '700', color: colors.error },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  medStock: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  actionRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 16, alignItems: 'flex-end' },
  pillBtn: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addPillBtn: { backgroundColor: colors.primary },
  addPillText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  disabledBtn: { backgroundColor: colors.textMuted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, borderRadius: 100, padding: 4, borderWidth: 1, borderColor: colors.borderLight },
  qtyPillBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: shadows.sm, android: { elevation: 2 } }) },
  qtyNumWrapper: { paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontWeight: '800', color: colors.text, fontSize: 16 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 16 },
  emptyText: { color: colors.textMuted, fontSize: 16, fontWeight: '500' },
  cartBarWrap: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  cartBar: { backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 20, borderRadius: 24 },
  cartInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  cartBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  cartItems: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  cartTotal: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 2 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 100 },
  checkoutText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
