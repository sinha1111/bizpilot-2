import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Transaction } from "@/context/AppContext";

interface TransactionItemProps {
  item: Transaction;
  onDelete?: (id: string) => void;
  onTogglePaid?: (id: string) => void;
  onEdit?: (item: Transaction) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  "বিক্রয়": "shopping-bag",
  "ক্রয়": "package",
  "খরচ": "credit-card",
  "বেতন": "users",
  "ভাড়া": "home",
  "বিদ্যুৎ": "zap",
  "পরিবহন": "truck",
  "বাকি পরিশোধ": "check-circle",
  "অন্যান্য": "more-horizontal",
};

export function TransactionItem({ item, onDelete, onTogglePaid, onEdit }: TransactionItemProps) {
  const colors = useColors();
  const isIncome = item.type === "income";
  const iconName = CATEGORY_ICONS[item.category] ?? "circle";
  const color = isIncome ? colors.income : colors.expense;
  const bgColor = isIncome ? colors.incomeSubtle : colors.expenseSubtle;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      onDelete?.(item.id);
    } else {
      Alert.alert("মুছে ফেলুন", "এই লেনদেন মুছে ফেলতে চান?", [
        { text: "না", style: "cancel" },
        { text: "হ্যাঁ", style: "destructive", onPress: () => onDelete?.(item.id) },
      ]);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "আজ";
    if (d.toDateString() === yesterday.toDateString()) return "গতকাল";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };
  const dateStr = formatDate(item.date);

  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Feather name={iconName as any} size={18} color={color} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {item.category} · {dateStr}
          {item.customerName ? ` · ${item.customerName}` : ""}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color }]}>
          {isIncome ? "+" : "-"}৳{item.amount.toLocaleString()}
        </Text>
        {item.isPaid !== undefined && (
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onTogglePaid?.(item.id); }}
            style={[styles.badge, { backgroundColor: item.isPaid ? colors.incomeSubtle : colors.warningSubtle }]}
          >
            <Text style={{ fontSize: 10, color: item.isPaid ? colors.income : colors.warning, fontFamily: "Inter_600SemiBold" }}>
              {item.isPaid ? "পরিশোধ" : "বাকি"}
            </Text>
          </TouchableOpacity>
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
    </View>
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
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  description: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  right: { alignItems: "flex-end", gap: 4 },
  amount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  actions: { flexDirection: "column", gap: 4, marginLeft: 2 },
  actionBtn: { padding: 4 },
});
