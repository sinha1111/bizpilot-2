import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useApp } from "@/context/AppContext";
import { TransactionItem } from "@/components/TransactionItem";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { Transaction } from "@/context/AppContext";

type Filter = "all" | "income" | "expense" | "unpaid";

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, deleteTransaction, updateTransaction } = useApp();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const tabBarHeight = useTabBarHeight();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const unpaidCount = useMemo(() => transactions.filter(t => t.isPaid === false).length, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const matchFilter =
        filter === "all" ? true :
        filter === "unpaid" ? t.isPaid === false :
        t.type === filter;
      const matchSearch = !search ||
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        (t.customerName ?? "").toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [transactions, filter, search]);

  const totalShown = filtered.reduce((s, t) => t.type === "income" ? s + t.amount : s - t.amount, 0);

  const FILTERS: { key: Filter; label: string; badge?: number }[] = [
    { key: "all", label: "সব" },
    { key: "income", label: "আয়" },
    { key: "expense", label: "ব্যয়" },
    { key: "unpaid", label: "বাকি", badge: unpaidCount },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>লেনদেন</Text>
        <View style={[styles.summary, { backgroundColor: totalShown >= 0 ? colors.incomeSubtle : colors.expenseSubtle }]}>
          <Text style={{ color: totalShown >= 0 ? colors.income : colors.expense, fontFamily: "Inter_700Bold", fontSize: 16 }}>
            ৳{Math.abs(totalShown).toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="খুঁজুন..."
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

      <View style={[styles.filterRow, { backgroundColor: colors.background }]}>
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          const showBadge = f.key === "unpaid" && (f.badge ?? 0) > 0;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
              style={[styles.filterBtn, {
                backgroundColor: isActive ? (f.key === "unpaid" ? colors.warning : colors.primary) : colors.muted,
                borderColor: isActive ? (f.key === "unpaid" ? colors.warning : colors.primary) : colors.border,
              }]}
            >
              <Text style={{ color: isActive ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                {f.label}
              </Text>
              {showBadge && (
                <View style={[styles.badgeDot, { backgroundColor: isActive ? "rgba(255,255,255,0.3)" : colors.warning }]}>
                  <Text style={{ color: isActive ? "#fff" : "#fff", fontSize: 10, fontFamily: "Inter_700Bold" }}>{f.badge}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TransactionItem
            item={item}
            onDelete={deleteTransaction}
            onEdit={(t) => setEditTransaction(t)}
            onTogglePaid={(id) => updateTransaction(id, { isPaid: !transactions.find(x => x.id === id)?.isPaid })}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>কোনো লেনদেন নেই</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 8 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <AddTransactionModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <EditTransactionModal visible={!!editTransaction} onClose={() => setEditTransaction(null)} transaction={editTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  summary: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  badgeDot: { minWidth: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
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
