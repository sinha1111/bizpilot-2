import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Product } from "@/context/AppContext";

interface ProductItemProps {
  item: Product;
  onDelete?: (id: string) => void;
  onEdit?: (item: Product) => void;
  onSell?: (item: Product) => void;
  onRestock?: (item: Product) => void;
}

export function ProductItem({ item, onDelete, onEdit, onSell, onRestock }: ProductItemProps) {
  const colors = useColors();
  const isLowStock = item.stock < 20;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      onDelete?.(item.id);
    } else {
      Alert.alert("মুছে ফেলুন", `"${item.name}" মুছে ফেলতে চান?`, [
        { text: "না", style: "cancel" },
        { text: "হ্যাঁ", style: "destructive", onPress: () => onDelete?.(item.id) },
      ]);
    }
  };

  const stockBg = item.stock === 0 ? colors.expenseSubtle : isLowStock ? colors.pendingSubtle : colors.incomeSubtle;
  const stockColor = item.stock === 0 ? colors.expense : isLowStock ? colors.warning : colors.income;

  const profit = item.costPrice != null && item.costPrice > 0 ? item.price - item.costPrice : null;
  const margin = profit != null ? Math.round((profit / item.price) * 100) : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: colors.secondary }]}>
          <Feather name="box" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.actions}>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); onSell?.(item); }}
              style={[styles.actionBtn, { backgroundColor: item.stock === 0 ? colors.muted : colors.incomeSubtle }]}
              disabled={item.stock === 0}
            >
              <Feather name="shopping-cart" size={13} color={item.stock === 0 ? colors.mutedForeground : colors.income} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); onEdit?.(item); }}
              style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
            >
              <Feather name="edit-2" size={13} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); onRestock?.(item); }}
              style={[styles.actionBtn, { backgroundColor: colors.warningSubtle }]}
            >
              <Feather name="plus-circle" size={13} color={colors.warning} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            >
              <Feather name="trash-2" size={13} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.bottomLeft}>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>{item.category}</Text>
          {profit != null && (
            <Text style={[styles.marginText, { color: profit >= 0 ? colors.income : colors.expense }]}>
              মুনাফা ৳{profit.toFixed(0)} ({margin}%)
            </Text>
          )}
        </View>
        <View style={styles.bottomRight}>
          <Text style={[styles.price, { color: colors.primary }]}>৳{item.price}/{item.unit}</Text>
          <View style={[styles.stockBadge, { backgroundColor: stockBg }]}>
            <Text style={{ fontSize: 11, color: stockColor, fontFamily: "Inter_600SemiBold" }}>
              {item.stock === 0 ? "স্টক শেষ" : `${item.stock} ${item.unit}`}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  name: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", lineHeight: 20 },
  actions: { gap: 4, flexShrink: 0 },
  actionRow: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 5, borderRadius: 8 },
  bottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingLeft: 46 },
  bottomLeft: { gap: 2, flex: 1 },
  bottomRight: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  category: { fontSize: 12, fontFamily: "Inter_400Regular" },
  marginText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  price: { fontSize: 13, fontFamily: "Inter_700Bold" },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
});
