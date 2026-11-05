import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { Customer, useApp } from "@/context/AppContext";

interface PayDueModalProps {
  visible: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function PayDueModal({ visible, onClose, customer }: PayDueModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, updateCustomer } = useApp();
  const [amount, setAmount] = useState("");
  const botPad = Platform.OS === "web" ? 34 : 0;

  if (!customer) return null;

  const handlePay = () => {
    const paid = parseFloat(amount || "0");
    if (paid <= 0 || paid > customer.due) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addTransaction({
      type: "income",
      amount: paid,
      category: "বাকি পরিশোধ",
      description: `বাকি পরিশোধ: ${customer.name}`,
      customerName: customer.name,
      isPaid: true,
      date: new Date().toISOString(),
    });

    updateCustomer(customer.id, { due: Math.max(0, customer.due - paid) });
    setAmount("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>বাকি পরিশোধ</Text>
            <View style={{ width: 34 }} />
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            <View style={[styles.customerCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>
                  {customer.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View>
                <Text style={[styles.customerName, { color: colors.foreground }]}>{customer.name}</Text>
                <Text style={[styles.customerPhone, { color: colors.mutedForeground }]}>{customer.phone}</Text>
              </View>
            </View>

            <View style={[styles.dueRow, { backgroundColor: colors.expenseSubtle, borderRadius: 14, padding: 16 }]}>
              <Text style={[styles.dueLabel, { color: colors.expense }]}>মোট বাকি</Text>
              <Text style={[styles.dueAmount, { color: colors.expense }]}>৳{customer.due.toLocaleString()}</Text>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>পরিশোধের পরিমাণ</Text>
            <TextInput
              style={[styles.input, styles.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="৳ ০"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoFocus
            />

            <TouchableOpacity
              onPress={() => { setAmount(String(customer.due)); }}
              style={[styles.fullPayBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
            >
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                সম্পূর্ণ বাকি পরিশোধ (৳{customer.due.toLocaleString()})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handlePay}
              style={[styles.payBtn, { backgroundColor: colors.income }]}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <Text style={styles.payBtnText}>পরিশোধ নিশ্চিত করুন</Text>
            </TouchableOpacity>
          </KeyboardAwareScrollViewCompat>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  body: { padding: 20, gap: 16 },
  customerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  customerName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  customerPhone: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  dueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dueLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  dueAmount: { fontSize: 24, fontFamily: "Inter_700Bold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  bigInput: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 20 },
  fullPayBtn: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  payBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
});
