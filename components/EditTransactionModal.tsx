import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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
import { Transaction, TransactionType, useApp } from "@/context/AppContext";

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const INCOME_CATEGORIES = ["বিক্রয়", "সেবা", "কমিশন", "বাকি পরিশোধ", "অন্যান্য আয়"];
const EXPENSE_CATEGORIES = ["ক্রয়", "বেতন", "ভাড়া", "বিদ্যুৎ", "পরিবহন", "খরচ", "অন্যান্য ব্যয়"];

export function EditTransactionModal({ visible, onClose, transaction }: EditTransactionModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateTransaction } = useApp();
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [type, setType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [txDate, setTxDate] = useState(new Date());

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setDescription(transaction.description);
      setCategory(transaction.category);
      setCustomerName(transaction.customerName ?? "");
      setIsPaid(transaction.isPaid ?? true);
      setTxDate(new Date(transaction.date));
    }
  }, [transaction, visible]);

  const addDay = (n: number) => {
    const d = new Date(txDate);
    d.setDate(d.getDate() + n);
    if (d <= new Date()) setTxDate(d);
  };

  const formatTxDate = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "আজ";
    if (d.toDateString() === yesterday.toDateString()) return "গতকাল";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const isToday = txDate.toDateString() === new Date().toDateString();

  if (!transaction) return null;

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSave = () => {
    if (!amount || !description || !category) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateTransaction(transaction.id, {
      type,
      amount: parseFloat(amount),
      description,
      category,
      customerName: customerName || undefined,
      isPaid,
      date: txDate.toISOString(),
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>লেনদেন সম্পাদনা</Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: type === "income" ? colors.income : colors.expense }]}>
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>সংরক্ষণ</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
              {(["income", "expense"] as TransactionType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { Haptics.selectionAsync(); setType(t); setCategory(""); }}
                  style={[styles.typeBtn, type === t && { backgroundColor: t === "income" ? colors.income : colors.expense }]}
                >
                  <Feather name={t === "income" ? "trending-up" : "trending-down"} size={16} color={type === t ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.typeText, { color: type === t ? "#fff" : colors.mutedForeground }]}>
                    {t === "income" ? "আয়" : "ব্যয়"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>পরিমাণ (টাকা)</Text>
            <TextInput
              style={[styles.input, styles.amountInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="০"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>বিবরণ</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="লেনদেনের বিবরণ"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ক্যাটাগরি</Text>
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat); }}
                  style={[styles.catChip, {
                    backgroundColor: category === cat ? colors.primary : colors.muted,
                    borderColor: category === cat ? colors.primary : colors.border,
                  }]}
                >
                  <Text style={{ color: category === cat ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>গ্রাহকের নাম (ঐচ্ছিক)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="গ্রাহকের নাম"
              placeholderTextColor={colors.mutedForeground}
              value={customerName}
              onChangeText={setCustomerName}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>পরিশোধ অবস্থা</Text>
            <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
              {[true, false].map(paid => (
                <TouchableOpacity
                  key={String(paid)}
                  onPress={() => { Haptics.selectionAsync(); setIsPaid(paid); }}
                  style={[styles.typeBtn, isPaid === paid && { backgroundColor: paid ? colors.income : colors.warning }]}
                >
                  <Text style={[styles.typeText, { color: isPaid === paid ? "#fff" : colors.mutedForeground }]}>
                    {paid ? "পরিশোধিত" : "বাকি"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>তারিখ</Text>
            <View style={[styles.datePicker, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => addDay(-1)} style={styles.dateArrow}>
                <Feather name="chevron-left" size={20} color={colors.foreground} />
              </TouchableOpacity>
              <View style={styles.dateCenter}>
                <Feather name="calendar" size={14} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.foreground }]}>{formatTxDate(txDate)}</Text>
              </View>
              <TouchableOpacity onPress={() => addDay(1)} style={styles.dateArrow} disabled={isToday}>
                <Feather name="chevron-right" size={20} color={isToday ? colors.muted : colors.foreground} />
              </TouchableOpacity>
            </View>
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
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  body: { padding: 20, gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 4, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  amountInput: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 20 },
  typeToggle: { flexDirection: "row", borderRadius: 14, padding: 4, gap: 4 },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  typeText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dateArrow: { padding: 8 },
  dateCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  dateText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
