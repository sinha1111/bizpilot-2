import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useColors } from "@/hooks/useColors";
import { TransactionType, useApp } from "@/context/AppContext";

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
}

const INCOME_CATEGORIES = ["বিক্রয়", "সেবা", "কমিশন", "অন্যান্য আয়"];
const EXPENSE_CATEGORIES = ["ক্রয়", "বেতন", "ভাড়া", "বিদ্যুৎ", "পরিবহন", "খরচ", "অন্যান্য ব্যয়"];

interface FormErrors {
  amount: boolean;
  description: boolean;
  category: boolean;
}

export function AddTransactionModal({ visible, onClose, defaultType = "income" }: AddTransactionModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, customers } = useApp();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isPaid, setIsPaid] = useState(true);
  const [txDate, setTxDate] = useState(new Date());
  const [errors, setErrors] = useState<FormErrors>({ amount: false, description: false, category: false });
  const [showSuggestions, setShowSuggestions] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setType(defaultType);
      setCategory("");
      setAmount("");
      setDescription("");
      setCustomerName("");
      setIsPaid(true);
      setTxDate(new Date());
      setErrors({ amount: false, description: false, category: false });
      setShowSuggestions(false);
    }
  }, [visible, defaultType]);

  const addDay = (n: number) => {
    const d = new Date(txDate);
    d.setDate(d.getDate() + n);
    if (d <= new Date()) setTxDate(d);
  };

  const formatTxDate = (d: Date) => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "আজ";
    if (d.toDateString() === yesterday.toDateString()) return "গতকাল";
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const isToday = txDate.toDateString() === new Date().toDateString();

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filteredCustomers = customers.filter(c =>
    customerName.length > 0 && c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  const handleSave = () => {
    const newErrors: FormErrors = {
      amount: !amount || parseFloat(amount) <= 0,
      description: !description.trim(),
      category: !category,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransaction({
      type,
      amount: parseFloat(amount),
      description,
      category,
      customerName: customerName || undefined,
      isPaid,
      date: txDate.toISOString(),
    });
    setAmount(""); setDescription(""); setCategory(""); setCustomerName(""); setIsPaid(true);
    onClose();
  };

  const btnBg = type === "income" ? colors.income : colors.expense;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>নতুন লেনদেন</Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: btnBg }]}>
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>সংরক্ষণ</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
              {(["income", "expense"] as TransactionType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => { Haptics.selectionAsync(); setType(t); setCategory(""); setErrors(prev => ({ ...prev, category: false })); }}
                  style={[styles.typeBtn, type === t && { backgroundColor: t === "income" ? colors.income : colors.expense }]}
                >
                  <Feather name={t === "income" ? "trending-up" : "trending-down"} size={16} color={type === t ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.typeText, { color: type === t ? "#fff" : colors.mutedForeground }]}>
                    {t === "income" ? "আয়" : "ব্যয়"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>পরিমাণ (টাকা) *</Text>
            <TextInput
              style={[styles.input, styles.amountInput, {
                backgroundColor: colors.card,
                borderColor: errors.amount ? colors.expense : colors.border,
                color: colors.foreground,
              }]}
              placeholder="০"
              placeholderTextColor={colors.mutedForeground}
              value={amount}
              onChangeText={t => { setAmount(t); if (errors.amount) setErrors(prev => ({ ...prev, amount: false })); }}
              keyboardType="numeric"
            />
            {errors.amount && (
              <Text style={[styles.errorText, { color: colors.expense }]}>পরিমাণ অবশ্যই দিতে হবে</Text>
            )}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>বিবরণ *</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.card,
                borderColor: errors.description ? colors.expense : colors.border,
                color: colors.foreground,
              }]}
              placeholder="লেনদেনের বিবরণ লিখুন"
              placeholderTextColor={colors.mutedForeground}
              value={description}
              onChangeText={t => { setDescription(t); if (errors.description) setErrors(prev => ({ ...prev, description: false })); }}
            />
            {errors.description && (
              <Text style={[styles.errorText, { color: colors.expense }]}>বিবরণ অবশ্যই দিতে হবে</Text>
            )}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ক্যাটাগরি *</Text>
            {errors.category && (
              <Text style={[styles.errorText, { color: colors.expense, marginBottom: 4 }]}>ক্যাটাগরি নির্বাচন করুন</Text>
            )}
            <View style={styles.categoryGrid}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat); setErrors(prev => ({ ...prev, category: false })); }}
                  style={[styles.catChip, {
                    backgroundColor: category === cat ? colors.primary : colors.muted,
                    borderColor: errors.category ? colors.expense : (category === cat ? colors.primary : colors.border),
                  }]}
                >
                  <Text style={{ color: category === cat ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>গ্রাহকের নাম (ঐচ্ছিক)</Text>
            <View style={{ position: "relative" }}>
              <View style={[styles.input, styles.customerInputRow, {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingHorizontal: 16,
                paddingVertical: 0,
              }]}>
                <TextInput
                  style={[styles.customerInput, { color: colors.foreground }]}
                  placeholder="গ্রাহকের নাম"
                  placeholderTextColor={colors.mutedForeground}
                  value={customerName}
                  onChangeText={t => {
                    setCustomerName(t);
                    setShowSuggestions(t.length > 0);
                  }}
                  onFocus={() => { if (customerName.length > 0) setShowSuggestions(true); }}
                />
                {customerName.length > 0 && (
                  <TouchableOpacity onPress={() => { setCustomerName(""); setShowSuggestions(false); }}>
                    <Feather name="x" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {showSuggestions && filteredCustomers.length > 0 && (
                <View style={[styles.suggestionBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filteredCustomers.slice(0, 4).map((c, i) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.suggestionItem, {
                        borderBottomColor: colors.border,
                        borderBottomWidth: i < filteredCustomers.slice(0, 4).length - 1 ? 1 : 0,
                      }]}
                      onPress={() => {
                        setCustomerName(c.name);
                        setShowSuggestions(false);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Feather name="user" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.suggestionName, { color: colors.foreground }]}>{c.name}</Text>
                      {c.due > 0 && (
                        <Text style={[styles.suggestionDue, { color: colors.expense }]}>বাকি ৳{c.due.toLocaleString()}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

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
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  amountInput: { fontSize: 28, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 20 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
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
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  customerInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customerInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    paddingVertical: 12,
  },
  suggestionBox: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    zIndex: 100,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  suggestionDue: { fontSize: 12, fontFamily: "Inter_500Medium" },
  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  dateArrow: { padding: 14 },
  dateCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
