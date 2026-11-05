import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Customer } from "@/context/AppContext";

interface CustomerItemProps {
  item: Customer;
  onDelete?: (id: string) => void;
  onPress?: (item: Customer) => void;
  onEdit?: (item: Customer) => void;
}

export function CustomerItem({ item, onDelete, onPress, onEdit }: CustomerItemProps) {
  const colors = useColors();
  const hasDue = item.due > 0;

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

  const initials = item.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: hasDue ? colors.pendingBorder : colors.border }]}
      onPress={() => { Haptics.selectionAsync(); onPress?.(item); }}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.avatar, { backgroundColor: hasDue ? colors.pendingSubtle : colors.secondary }]}>
        <Text style={[styles.initials, { color: hasDue ? colors.warning : colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[styles.phone, { color: colors.mutedForeground }]}>{item.phone}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.total, { color: colors.foreground }]}>
          ৳{item.totalPurchase.toLocaleString()}
        </Text>
        {hasDue ? (
          <View style={[styles.dueBadge, { backgroundColor: colors.expenseSubtle }]}>
            <Text style={{ fontSize: 10, color: colors.expense, fontFamily: "Inter_600SemiBold" }}>
              বাকি ৳{item.due.toLocaleString()}
            </Text>
          </View>
        ) : (
          <View style={[styles.dueBadge, { backgroundColor: colors.incomeSubtle }]}>
            <Text style={{ fontSize: 10, color: colors.income, fontFamily: "Inter_600SemiBold" }}>পরিশোধিত</Text>
          </View>
        )}
      </View>
      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onEdit(item); }} style={styles.actionBtn}>
            <Feather name="edit-2" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 16, fontFamily: "Inter_700Bold" },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  phone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  right: { alignItems: "flex-end", gap: 4 },
  total: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dueBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  actions: { flexDirection: "column", gap: 4 },
  actionBtn: { padding: 4 },
});
