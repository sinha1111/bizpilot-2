import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Customer, useApp } from "@/context/AppContext";
import { PayDueModal } from "./PayDueModal";

interface CustomerDetailModalProps {
  visible: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit?: (customer: Customer) => void;
}

export function CustomerDetailModal({ visible, onClose, customer, onEdit }: CustomerDetailModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, updateCustomer, addTransaction } = useApp();
  const [showPayDue, setShowPayDue] = useState(false);
  const botPad = Platform.OS === "web" ? 34 : 0;

  if (!customer) return null;

  const customerTransactions = transactions.filter(
    t => t.customerId === customer.id || t.customerName === customer.name
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const initials = customer.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Platform.OS === "ios" ? 20 : 20 }]}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>গ্রাহকের বিস্তারিত</Text>
            <TouchableOpacity onPress={() => { onEdit?.(customer); onClose(); }} style={styles.iconBtn}>
              <Feather name="edit-2" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={customerTransactions}
            keyExtractor={t => t.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, botPad) + (customer.due > 0 ? 100 : 40) }]}
            ListHeaderComponent={
              <>
                <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text>
                  {customer.phone ? (
                    <View style={styles.infoRow}>
                      <Feather name="phone" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{customer.phone}</Text>
                    </View>
                  ) : null}
                  {customer.address ? (
                    <View style={styles.infoRow}>
                      <Feather name="map-pin" size={14} color={colors.mutedForeground} />
                      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{customer.address}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.statsRow}>
                  <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statValue, { color: colors.primary }]}>৳{customer.totalPurchase.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>মোট কেনা</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: customer.due > 0 ? colors.pendingSubtle : colors.card, borderColor: customer.due > 0 ? colors.pendingBorder : colors.border }]}>
                    <Text style={[styles.statValue, { color: customer.due > 0 ? colors.warning : colors.income }]}>৳{customer.due.toLocaleString()}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>বর্তমান বাকি</Text>
                  </View>
                  <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.statValue, { color: colors.foreground }]}>{customerTransactions.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>লেনদেন</Text>
                  </View>
                </View>

                {customerTransactions.length > 0 && (
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>লেনদেনের ইতিহাস</Text>
                )}
              </>
            }
            ListEmptyComponent={
              <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="inbox" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>এই গ্রাহকের কোনো লেনদেন নেই</Text>
              </View>
            }
            renderItem={({ item: t }) => (
              <View style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.txIcon, { backgroundColor: t.type === "income" ? colors.incomeSubtle : colors.expenseSubtle }]}>
                  <Feather name={t.type === "income" ? "arrow-up" : "arrow-down"} size={14} color={t.type === "income" ? colors.income : colors.expense} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>{t.description}</Text>
                  <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{formatDate(t.date)} · {t.category}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: t.type === "income" ? colors.income : colors.expense }]}>
                    {t.type === "income" ? "+" : "-"}৳{t.amount.toLocaleString()}
                  </Text>
                  {!t.isPaid && (
                    <View style={[styles.badge, { backgroundColor: colors.pendingSubtle }]}>
                      <Text style={{ color: colors.warning, fontSize: 10, fontFamily: "Inter_600SemiBold" }}>বাকি</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          />

          {customer.due > 0 && (
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, botPad) + 8 }]}>
              <TouchableOpacity
                style={[styles.payBtn, { backgroundColor: colors.income }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPayDue(true); }}
              >
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.payBtnText}>বাকি নিন — ৳{customer.due.toLocaleString()}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      <PayDueModal
        visible={showPayDue}
        onClose={() => setShowPayDue(false)}
        customer={customer}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  avatarText: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 20, fontFamily: "Inter_700Bold" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  statValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 6 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  txIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  payBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
