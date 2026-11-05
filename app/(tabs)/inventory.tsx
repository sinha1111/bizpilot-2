import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { Product, useApp } from "@/context/AppContext";
import { ProductItem } from "@/components/ProductItem";
import { AddProductModal } from "@/components/AddProductModal";
import { SellProductModal } from "@/components/SellProductModal";
import { RestockModal } from "@/components/RestockModal";

export default function InventoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, deleteProduct } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [quickSellProduct, setQuickSellProduct] = useState<Product | null>(null);
  const [quickRestockProduct, setQuickRestockProduct] = useState<Product | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const tabBarHeight = useTabBarHeight();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const categories = useMemo(() => {
    const cats = [...new Set(products.map(p => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
      const matchLow = !showLowStock || p.stock < 20;
      const matchCat = !categoryFilter || p.category === categoryFilter;
      return matchSearch && matchLow && matchCat;
    });
  }, [products, search, showLowStock, categoryFilter]);

  const lowStockCount = products.filter(p => p.stock < 20).length;
  const totalCostValue = products.reduce((s, p) => s + (p.costPrice ?? p.price) * p.stock, 0);
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.topRow}>
          <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>স্টক</Text>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowRestock(true); }}
            style={[styles.iconBtn, { backgroundColor: colors.warning }]}
          >
            <Feather name="plus-circle" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSell(true); }}
            style={[styles.iconBtn, { backgroundColor: colors.income }]}
          >
            <Feather name="shopping-cart" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomRow}>
          <Text style={[styles.subtitle, { color: colors.mutedForeground, flex: 1 }]} numberOfLines={1}>
            বিক্রয় ৳{totalValue.toLocaleString()} · ক্রয় ৳{totalCostValue.toLocaleString()}
          </Text>
          {lowStockCount > 0 && (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); setShowLowStock(!showLowStock); }}
              style={[styles.alertBadge, { backgroundColor: showLowStock ? colors.expense : colors.expenseSubtle }]}
            >
              <Feather name="alert-triangle" size={12} color={showLowStock ? "#fff" : colors.expense} />
              <Text style={{ color: showLowStock ? "#fff" : colors.expense, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                {lowStockCount} কম
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="পণ্য খুঁজুন..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {categories.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catScrollView}
          contentContainerStyle={styles.catRow}
        >
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setCategoryFilter(null); }}
            style={[styles.catChip, {
              backgroundColor: !categoryFilter ? colors.primary : colors.muted,
              borderColor: !categoryFilter ? colors.primary : colors.border,
            }]}
          >
            <Text style={{ color: !categoryFilter ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>সব</Text>
          </TouchableOpacity>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => { Haptics.selectionAsync(); setCategoryFilter(categoryFilter === cat ? null : cat); }}
              style={[styles.catChip, {
                backgroundColor: categoryFilter === cat ? colors.primary : colors.muted,
                borderColor: categoryFilter === cat ? colors.primary : colors.border,
              }]}
            >
              <Text style={{ color: categoryFilter === cat ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 80 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ProductItem
            item={item}
            onDelete={deleteProduct}
            onEdit={(p) => { setEditProduct(p); setShowAdd(true); }}
            onSell={(p) => { setQuickSellProduct(p); setShowSell(true); }}
            onRestock={(p) => { setQuickRestockProduct(p); setShowRestock(true); }}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="package" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>কোনো পণ্য নেই</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 8 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEditProduct(null); setShowAdd(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <AddProductModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditProduct(null); }}
        editProduct={editProduct}
      />
      <SellProductModal
        visible={showSell}
        onClose={() => { setShowSell(false); setQuickSellProduct(null); }}
        initialProduct={quickSellProduct}
      />
      <RestockModal
        visible={showRestock}
        onClose={() => { setShowRestock(false); setQuickRestockProduct(null); }}
        initialProduct={quickRestockProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: { paddingHorizontal: 20, paddingVertical: 10 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  catScrollView: { flexShrink: 0, flexGrow: 0 },
  catRow: { paddingHorizontal: 20, paddingBottom: 8, gap: 8, flexDirection: "row", alignItems: "center" },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  list: { paddingHorizontal: 20 },
  empty: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 16,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
