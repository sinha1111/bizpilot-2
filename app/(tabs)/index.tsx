import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useApp } from "@/context/AppContext";
import { StatCard } from "@/components/StatCard";
import { TransactionItem } from "@/components/TransactionItem";
import { AddTransactionModal } from "@/components/AddTransactionModal";
import { SellProductModal } from "@/components/SellProductModal";
import { QuickActionSheet } from "@/components/QuickActionSheet";
import { RestockModal } from "@/components/RestockModal";
import { EditTransactionModal } from "@/components/EditTransactionModal";
import { Transaction } from "@/context/AppContext";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, balance, todayIncome, todayExpense, monthIncome, monthExpense, deleteTransaction, updateTransaction, customers, products, settings } = useApp();

  const [showQuick, setShowQuick] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [showIncome, setShowIncome] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const recent = transactions.slice(0, 8);
  const totalDue = customers.reduce((s, c) => s + c.due, 0);
  const lowStockCount = products.filter(p => p.stock < 20 && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const tabBarHeight = useTabBarHeight();

  const now = new Date();
  const greeting = now.getHours() < 12 ? "সুপ্রভাত" : now.getHours() < 17 ? "শুভ অপরাহ্ন" : "শুভ সন্ধ্যা";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: tabBarHeight + 16 }]}
      >
        <View style={styles.hero}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <Text style={[styles.bizName, { color: colors.foreground }]}>{settings.businessName || "আমার ব্যবসা"}</Text>
          </View>
          <View style={[styles.balanceBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>মোট ব্যালেন্স</Text>
            <Text style={styles.balanceAmount}>৳{balance.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="আজকের আয়" amount={todayIncome} icon="trending-up" color={colors.income} bgColor={colors.incomeSubtle} />
          <StatCard label="আজকের ব্যয়" amount={todayExpense} icon="trending-down" color={colors.expense} bgColor={colors.expenseSubtle} />
        </View>

        <View style={styles.statsRow}>
          <StatCard label="মাসিক আয়" amount={monthIncome} icon="bar-chart-2" color={colors.primary} bgColor={colors.secondary} />
          <StatCard label="মাসিক ব্যয়" amount={monthExpense} icon="trending-down" color={colors.expense} bgColor={colors.expenseSubtle} />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            label="মাসিক মুনাফা"
            amount={Math.abs(monthIncome - monthExpense)}
            icon={monthIncome >= monthExpense ? "award" : "alert-triangle"}
            color={monthIncome >= monthExpense ? colors.income : colors.expense}
            bgColor={monthIncome >= monthExpense ? colors.incomeSubtle : colors.expenseSubtle}
          />
          <StatCard
            label="মোট বাকি"
            amount={totalDue}
            icon="alert-circle"
            color={colors.warning}
            bgColor={colors.warningSubtle}
            onPress={totalDue > 0 ? () => router.push("/customers") : undefined}
          />
        </View>

        {/* Low/Out of Stock Warnings */}
        {outOfStockCount > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.expenseSubtle, borderColor: colors.expenseBorder }]}>
            <Feather name="alert-octagon" size={16} color={colors.expense} />
            <Text style={[styles.alertText, { color: colors.expense }]}>
              {outOfStockCount}টি পণ্য স্টক শেষ হয়েছে — রিস্টক করুন
            </Text>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowRestock(true); }}>
              <Text style={{ color: colors.expense, fontFamily: "Inter_700Bold", fontSize: 13 }}>রিস্টক →</Text>
            </TouchableOpacity>
          </View>
        )}
        {lowStockCount > 0 && (
          <View style={[styles.alertCard, { backgroundColor: colors.pendingSubtle, borderColor: colors.pendingBorder }]}>
            <Feather name="alert-triangle" size={16} color={colors.warning} />
            <Text style={[styles.alertText, { color: colors.warning }]}>
              {lowStockCount}টি পণ্যের স্টক কম
            </Text>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setShowRestock(true); }}>
              <Text style={{ color: colors.warning, fontFamily: "Inter_700Bold", fontSize: 13 }}>রিস্টক →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Sell Banner */}
        <TouchableOpacity
          style={[styles.sellBanner, { backgroundColor: colors.income }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowSell(true); }}
          activeOpacity={0.85}
        >
          <View style={styles.sellBannerLeft}>
            <View style={[styles.sellIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather name="shopping-cart" size={22} color="#fff" />
            </View>
            <View>
              <Text style={styles.sellBannerTitle}>পণ্য বিক্রয় করুন</Text>
              <Text style={styles.sellBannerSub}>স্টক থেকে নির্বাচন করুন</Text>
            </View>
          </View>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>সাম্প্রতিক লেনদেন</Text>
          {transactions.length > 8 && (
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); router.push("/transactions"); }}
              style={styles.seeAllBtn}
            >
              <Text style={[styles.seeAllText, { color: colors.primary }]}>সব দেখুন</Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {recent.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>কোনো লেনদেন নেই</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>নিচের + বোতামে চাপুন</Text>
          </View>
        ) : (
          recent.map(t => (
            <TransactionItem
              key={t.id}
              item={t}
              onDelete={deleteTransaction}
              onEdit={(tx) => setEditTransaction(tx)}
              onTogglePaid={(id) => updateTransaction(id, { isPaid: !transactions.find(x => x.id === id)?.isPaid })}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 8 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowQuick(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <QuickActionSheet
        visible={showQuick}
        onClose={() => setShowQuick(false)}
        onSell={() => setShowSell(true)}
        onRestock={() => setShowRestock(true)}
        onIncome={() => setShowIncome(true)}
        onExpense={() => setShowExpense(true)}
      />
      <SellProductModal visible={showSell} onClose={() => setShowSell(false)} />
      <RestockModal visible={showRestock} onClose={() => setShowRestock(false)} />
      <AddTransactionModal visible={showIncome} onClose={() => setShowIncome(false)} defaultType="income" />
      <AddTransactionModal visible={showExpense} onClose={() => setShowExpense(false)} defaultType="expense" />
      <EditTransactionModal visible={!!editTransaction} onClose={() => setEditTransaction(null)} transaction={editTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 12 },
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  bizName: { fontSize: 24, fontFamily: "Inter_700Bold", marginTop: 2 },
  balanceBadge: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "flex-end",
  },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontFamily: "Inter_500Medium" },
  balanceAmount: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 12 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  alertText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  sellBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    padding: 18,
    marginTop: 4,
  },
  sellBannerLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  sellIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  sellBannerTitle: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  sellBannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAllBtn: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  empty: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubText: { fontSize: 13, fontFamily: "Inter_400Regular" },
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
