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

      // If we got a real Razorpay order ID, open the checkout
      if (r.data.razorpayOrderId && r.data.razorpayOrderId !== 'mock_rzp_order_id') {
        const options = {
          description: 'PetHub Pharmacy Order',
          currency: 'INR',
          key: process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_Sjl8rbraXb2cls',
          amount: Math.round(r.data.total * 100),
          name: 'PetHub',
          order_id: r.data.razorpayOrderId,
          prefill: {
            email: 'user@pethub.com',
            contact: '9999999999',
            name: 'PetHub User'
          },
          theme: { color: colors.primary },
        };

        try {
          const success = await RazorpayCheckout.open(options);
          Alert.alert('Payment Successful! 🎉', `Payment ID: ${success.razorpay_payment_id}\nYour order has been confirmed.`);
          setCart({});
          load();
        } catch (error) {
          // Payment failed or cancelled
          if (error.code === 2) { // 2 is typically user cancelled
            Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
          } else {
            Alert.alert('Payment Failed', error.description || 'Something went wrong during payment.');
          }
          return; // Stop here, don't show the generic "Order Placed" alert
        }
      } else {
        // Mock payment or COD
        Alert.alert('Order Placed! 🎉', `Total ₹${r.data.total.toFixed(2)} — Your order has been confirmed.`);
        setCart({});
        load();
      }
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
              <Text style={s.medPrice}>₹{item.price.toFixed(2)}</Text>
            </View>
            <View style={s.tagsRow}>
              <Text style={s.medCategory}>{item.category || 'General'}</Text>
              {item.requiresRx && (
                <View style={s.rxBadge}>
                  <Text style={s.rxText}>Prescription Required</Text>
                </View>
              )}
            </View>
            
            {item.description && (
              <Text style={s.medDesc} numberOfLines={2}>{item.description}</Text>
            )}

            <View style={s.medMeta}>
              <Ionicons name="cube-outline" size={12} color={colors.textMuted} />
              <Text style={s.medStock}>Stock: {item.stock}</Text>
              {item.stock < 10 && item.stock > 0 && (
                <Text style={s.lowStock}>• Low Stock</Text>
              )}
            </View>
          </View>
        </View>

        <View style={s.actionRow}>
          {qty === 0 ? (
            <TouchableOpacity
              style={[s.pillBtn, s.addPillBtn, item.stock === 0 && s.disabledBtn]}
              onPress={() => inc(item.id)}
              disabled={item.stock === 0}
              activeOpacity={0.8}
            >
              <Text style={s.addPillText}>{item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</Text>
              <Ionicons name="cart-outline" size={16} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={s.qtyControl}>
              <TouchableOpacity style={s.qtyPillBtn} onPress={() => dec(item.id)}>
                <Ionicons name="remove" size={20} color={colors.primary} />
              </TouchableOpacity>
              <View style={s.qtyNumWrapper}>
                <Text style={s.qtyNum}>{qty}</Text>
              </View>
              <TouchableOpacity style={s.qtyPillBtn} onPress={() => inc(item.id)}>
                <Ionicons name="add" size={20} color={colors.primary} />
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
  headerWrap: { backgroundColor: colors.surface, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg, marginHorizontal: 16, marginTop: 16, borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '500' },
  catScroll: { flexGrow: 0, backgroundColor: colors.surface, paddingBottom: 4 },
  catContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  catChip: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 24, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
  catTextActive: { color: colors.white },
  listContent: { padding: 16, gap: 16, paddingBottom: 140 },
  medCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: colors.borderLight },
  medInfoContainer: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  medIcon: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  medInfo: { flex: 1 },
  medTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  medName: { fontSize: 16, fontWeight: '700', color: colors.text, flex: 1, marginRight: 8 },
  medPrice: { fontSize: 17, fontWeight: '800', color: colors.primary },
  tagsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  medCategory: { fontSize: 12, color: colors.textSub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  rxBadge: { backgroundColor: colors.errorLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  rxText: { fontSize: 10, fontWeight: '700', color: colors.error, textTransform: 'uppercase' },
  medDesc: { fontSize: 13, color: colors.textSub, lineHeight: 18, marginBottom: 10 },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  medStock: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  lowStock: { fontSize: 12, color: colors.warning, fontWeight: '600' },
  actionRow: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 14, alignItems: 'flex-end' },
  pillBtn: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 100, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addPillBtn: { backgroundColor: colors.primary },
  addPillText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  disabledBtn: { backgroundColor: colors.textMuted },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 100, padding: 2 },
  qtyPillBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  qtyNumWrapper: { paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  qtyNum: { fontWeight: '800', color: colors.primary, fontSize: 15 },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 16 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  cartBarWrap: { position: 'absolute', bottom: 24, left: 16, right: 16 },
  cartBar: { backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  cartInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cartBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  cartItems: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
  cartTotal: { color: colors.white, fontWeight: '800', fontSize: 18, marginBottom: 1 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 16 },
  checkoutText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
