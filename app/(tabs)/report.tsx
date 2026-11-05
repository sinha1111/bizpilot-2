import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
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

type Period = "today" | "week" | "month" | "all";

const DAY_NAMES = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];

export default function ReportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, products, customers } = useApp();
  const [period, setPeriod] = useState<Period>("month");

  const tabBarHeight = useTabBarHeight();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: "আজ" },
    { key: "week", label: "সপ্তাহ" },
    { key: "month", label: "মাস" },
    { key: "all", label: "সব" },
  ];

  const periodLabel = PERIODS.find(p => p.key === period)?.label ?? "";

  const filtered = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (period === "today") return d.toDateString() === now.toDateString();
      if (period === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }
      if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, period]);

  const income = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;
  const totalDue = customers.reduce((s, c) => s + c.due, 0);
  const lowStockItems = products.filter(p => p.stock < 20);
  const pendingDueCount = customers.filter(c => c.due > 0).length;
  const totalCustomerPurchase = customers.reduce((s, c) => s + c.totalPurchase, 0);

  const incomeCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "income").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [filtered]);

  const expenseCategories = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] ?? 0) + t.amount;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [filtered]);

  const maxInc = Math.max(...incomeCategories.map(([, v]) => v), 1);
  const maxExp = Math.max(...expenseCategories.map(([, v]) => v), 1);

  const topCustomers = [...customers]
    .sort((a, b) => b.totalPurchase - a.totalPurchase)
    .slice(0, 3);

  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toDateString();
      const inc = transactions
        .filter(t => t.type === "income" && new Date(t.date).toDateString() === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      const exp = transactions
        .filter(t => t.type === "expense" && new Date(t.date).toDateString() === dateStr)
        .reduce((s, t) => s + t.amount, 0);
      return {
        dayName: DAY_NAMES[d.getDay()],
        date: d.getDate(),
        inc,
        exp,
        isToday: i === 6,
      };
    });
  }, [transactions]);

  const maxDaily = Math.max(...last7Days.map(d => Math.max(d.inc, d.exp)), 1);
  const BAR_HEIGHT = 72;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: tabBarHeight + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>রিপোর্ট</Text>

      <View style={styles.filterRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            onPress={() => { Haptics.selectionAsync(); setPeriod(p.key); }}
            style={[styles.filterBtn, {
              backgroundColor: period === p.key ? colors.primary : colors.muted,
              borderColor: period === p.key ? colors.primary : colors.border,
            }]}
          >
            <Text style={{ color: period === p.key ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.profitCard, { backgroundColor: profit >= 0 ? colors.income : colors.expense }]}>
        <Text style={styles.profitLabel}>{periodLabel}ের নিট মুনাফা</Text>
        <Text style={styles.profitAmount}>৳{Math.abs(profit).toLocaleString()}</Text>
        <View style={styles.profitRow}>
          <Text style={styles.profitSub}>{profit >= 0 ? "লাভ" : "লোকসান"}</Text>
          {income > 0 && (
            <Text style={styles.profitMargin}>
              মার্জিন: {Math.round((profit / income) * 100)}%
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statsGrid}>
        {[
          { label: "মোট আয়", amount: income, color: colors.income, bg: colors.incomeSubtle, icon: "arrow-up-circle", prefix: "৳" },
          { label: "মোট ব্যয়", amount: expense, color: colors.expense, bg: colors.expenseSubtle, icon: "arrow-down-circle", prefix: "৳" },
          { label: "বাকি আদায়যোগ্য", amount: totalDue, color: colors.warning, bg: colors.warningSubtle, icon: "clock", prefix: "৳" },
          { label: "লেনদেন সংখ্যা", amount: filtered.length, color: colors.primary, bg: colors.secondary, icon: "list", prefix: "" },
        ].map((s) => (
          <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
              <Feather name={s.icon as any} size={18} color={s.color} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            <Text style={[styles.statAmount, { color: s.color }]}>
              {s.prefix}{s.amount.toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* 7-day chart */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeader}>
          <Feather name="bar-chart-2" size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>সাত দিনের সারসংক্ষেপ</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.income }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>আয়</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.expense }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>ব্যয়</Text>
          </View>
        </View>
        <View style={styles.chartRow}>
          {last7Days.map((day, i) => (
            <View key={i} style={styles.chartCol}>
              <View style={[styles.barsGroup, { height: BAR_HEIGHT }]}>
                <View style={styles.barPair}>
                  <View style={[styles.barBase, {
                    height: day.inc > 0 ? Math.max(4, (day.inc / maxDaily) * BAR_HEIGHT) : 2,
                    backgroundColor: day.inc > 0 ? colors.income : colors.muted,
                    borderRadius: 4,
                  }]} />
                  <View style={[styles.barBase, {
                    height: day.exp > 0 ? Math.max(4, (day.exp / maxDaily) * BAR_HEIGHT) : 2,
                    backgroundColor: day.exp > 0 ? colors.expense : colors.muted,
                    borderRadius: 4,
                  }]} />
                </View>
              </View>
              <Text style={[styles.chartDayName, {
                color: day.isToday ? colors.primary : colors.mutedForeground,
                fontFamily: day.isToday ? "Inter_700Bold" : "Inter_400Regular",
              }]}>
                {day.dayName}
              </Text>
              <Text style={[styles.chartDate, { color: day.isToday ? colors.primary : colors.mutedForeground }]}>
                {day.date}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {incomeCategories.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-up" size={16} color={colors.income} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>আয়ের বিশ্লেষণ</Text>
          </View>
          {incomeCategories.map(([cat, amount]) => (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catLeft}>
                <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                <Text style={[styles.catAmount, { color: colors.mutedForeground }]}>৳{amount.toLocaleString()}</Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.barFill, { width: `${(amount / maxInc) * 100}%` as any, backgroundColor: colors.income }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {expenseCategories.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="trending-down" size={16} color={colors.expense} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ব্যয়ের বিশ্লেষণ</Text>
          </View>
          {expenseCategories.map(([cat, amount]) => (
            <View key={cat} style={styles.catRow}>
              <View style={styles.catLeft}>
                <Text style={[styles.catName, { color: colors.foreground }]}>{cat}</Text>
                <Text style={[styles.catAmount, { color: colors.mutedForeground }]}>৳{amount.toLocaleString()}</Text>
              </View>
              <View style={[styles.barBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.barFill, { width: `${(amount / maxExp) * 100}%` as any, backgroundColor: colors.expense }]} />
              </View>
            </View>
          ))}
        </View>
      )}

      {topCustomers.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="star" size={16} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>শীর্ষ গ্রাহক</Text>
          </View>
          {topCustomers.map((c, i) => (
            <View key={c.id} style={styles.customerRow}>
              <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.warningSubtle : colors.muted }]}>
                <Text style={{ color: i === 0 ? colors.warning : colors.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                  #{i + 1}
                </Text>
              </View>
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: colors.foreground }]}>{c.name}</Text>
                {c.due > 0 && (
                  <Text style={[styles.customerDue, { color: colors.expense }]}>বাকি ৳{c.due.toLocaleString()}</Text>
                )}
              </View>
              <Text style={[styles.customerTotal, { color: colors.primary }]}>৳{c.totalPurchase.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {pendingDueCount > 0 && (
        <View style={[styles.section, { backgroundColor: colors.pendingSubtle, borderColor: colors.pendingBorder }]}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.sectionTitle, { color: colors.warning }]}>বাকি আদায়ের তালিকা</Text>
          </View>
          {customers.filter(c => c.due > 0).slice(0, 5).map(c => (
            <View key={c.id} style={styles.dueRow}>
              <View>
                <Text style={[styles.dueCustomerName, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.dueCustomerPhone, { color: colors.mutedForeground }]}>{c.phone}</Text>
              </View>
              <Text style={[styles.dueAmount, { color: colors.expense }]}>৳{c.due.toLocaleString()}</Text>
            </View>
          ))}
          {pendingDueCount > 5 && (
            <Text style={[styles.moreText, { color: colors.warning }]}>+{pendingDueCount - 5} জন আরও...</Text>
          )}
        </View>
      )}

      {lowStockItems.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.expenseSubtle, borderColor: colors.expenseBorder }]}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={16} color={colors.expense} />
            <Text style={[styles.sectionTitle, { color: colors.expense }]}>কম স্টক সতর্কতা</Text>
          </View>
          {lowStockItems.map(p => (
            <View key={p.id} style={styles.lowStockRow}>
              <Text style={[styles.lowStockName, { color: colors.foreground }]}>{p.name}</Text>
              <View style={[styles.lowStockBadge, { backgroundColor: p.stock === 0 ? colors.expenseSubtle : colors.pendingSubtle }]}>
                <Text style={{ color: p.stock === 0 ? colors.expense : colors.warning, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
                  {p.stock === 0 ? "শেষ হয়েছে" : `${p.stock} ${p.unit} বাকি`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  profitCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 4,
  },
  profitLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_500Medium" },
  profitAmount: { color: "#fff", fontSize: 40, fontFamily: "Inter_700Bold" },
  profitRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  profitSub: { color: "rgba(255,255,255,0.9)", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  profitMargin: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_400Regular" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statBox: {
    width: "47%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  legendRow: { flexDirection: "row", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 4,
  },
  chartCol: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barsGroup: {
    justifyContent: "flex-end",
    width: "100%",
    alignItems: "center",
  },
  barPair: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    width: "100%",
    justifyContent: "center",
  },
  barBase: {
    width: 8,
  },
  chartDayName: { fontSize: 10, textAlign: "center" },
  chartDate: { fontSize: 9, textAlign: "center" },
  catRow: { gap: 6 },
  catLeft: { flexDirection: "row", justifyContent: "space-between" },
  catName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  catAmount: { fontSize: 13, fontFamily: "Inter_400Regular" },
  barBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  customerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  rankBadge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  customerInfo: { flex: 1 },
  customerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customerDue: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  customerTotal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  dueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dueCustomerName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dueCustomerPhone: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  dueAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  moreText: { fontSize: 13, fontFamily: "Inter_500Medium", textAlign: "center" },
  lowStockRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  lowStockName: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  lowStockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
});
