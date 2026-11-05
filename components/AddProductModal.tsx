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
import { Product, useApp } from "@/context/AppContext";

interface AddProductModalProps {
  visible: boolean;
  onClose: () => void;
  editProduct?: Product | null;
}

const CATEGORIES = ["খাদ্যপণ্য", "তেল", "মশলা", "পানীয়", "দুগ্ধজাত", "স্বাস্থ্যবিধি", "পোশাক", "ইলেকট্রনিক্স", "অন্যান্য"];
const UNITS = ["কেজি", "লিটার", "পিস", "ডজন", "বস্তা", "বোতল", "প্যাকেট", "মিটার"];

interface FormErrors {
  name: boolean;
  price: boolean;
  stock: boolean;
  category: boolean;
}

export function AddProductModal({ visible, onClose, editProduct }: AddProductModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addProduct, updateProduct } = useApp();
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("কেজি");
  const [errors, setErrors] = useState<FormErrors>({ name: false, price: false, stock: false, category: false });

  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setPrice(String(editProduct.price));
      setCostPrice(editProduct.costPrice ? String(editProduct.costPrice) : "");
      setStock(String(editProduct.stock));
      setCategory(editProduct.category);
      setUnit(editProduct.unit);
    } else {
      setName(""); setPrice(""); setCostPrice(""); setStock(""); setCategory(""); setUnit("কেজি");
    }
    setErrors({ name: false, price: false, stock: false, category: false });
  }, [editProduct, visible]);

  const handleSave = () => {
    const newErrors: FormErrors = {
      name: !name.trim(),
      price: !price || parseFloat(price) <= 0,
      stock: !stock || parseInt(stock) < 0,
      category: !category,
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const data = {
      name,
      price: parseFloat(price),
      costPrice: costPrice ? parseFloat(costPrice) : undefined,
      stock: parseInt(stock),
      category,
      unit,
    };
    if (editProduct) {
      updateProduct(editProduct.id, data);
    } else {
      addProduct(data);
    }
    onClose();
  };

  const profit = price && costPrice ? parseFloat(price) - parseFloat(costPrice) : null;
  const margin = profit !== null && parseFloat(price) > 0
    ? Math.round((profit / parseFloat(price)) * 100)
    : null;

  const errBorder = (hasErr: boolean) => hasErr ? colors.expense : colors.border;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {editProduct ? "পণ্য সম্পাদনা" : "নতুন পণ্য"}
            </Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>সংরক্ষণ</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>পণ্যের নাম *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errBorder(errors.name), color: colors.foreground }]}
              placeholder="পণ্যের নাম লিখুন"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={t => { setName(t); if (errors.name) setErrors(prev => ({ ...prev, name: false })); }}
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.expense }]}>পণ্যের নাম অবশ্যই দিতে হবে</Text>}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>বিক্রয়মূল্য (৳) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: errBorder(errors.price), color: colors.foreground }]}
                  placeholder="০"
                  placeholderTextColor={colors.mutedForeground}
                  value={price}
                  onChangeText={t => { setPrice(t); if (errors.price) setErrors(prev => ({ ...prev, price: false })); }}
                  keyboardType="numeric"
                />
                {errors.price && <Text style={[styles.errorText, { color: colors.expense }]}>মূল্য দিতে হবে</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>ক্রয়মূল্য (৳)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="০"
                  placeholderTextColor={colors.mutedForeground}
                  value={costPrice}
                  onChangeText={setCostPrice}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {profit !== null && (
              <View style={[styles.marginRow, { backgroundColor: profit >= 0 ? colors.incomeSubtle : colors.expenseSubtle }]}>
                <Feather name={profit >= 0 ? "trending-up" : "trending-down"} size={14} color={profit >= 0 ? colors.income : colors.expense} />
                <Text style={{ color: profit >= 0 ? colors.income : colors.expense, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                  মুনাফা: ৳{profit.toFixed(2)} ({margin}% মার্জিন)
                </Text>
              </View>
            )}

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>স্টক *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: errBorder(errors.stock), color: colors.foreground }]}
                  placeholder="০"
                  placeholderTextColor={colors.mutedForeground}
                  value={stock}
                  onChangeText={t => { setStock(t); if (errors.stock) setErrors(prev => ({ ...prev, stock: false })); }}
                  keyboardType="numeric"
                />
                {errors.stock && <Text style={[styles.errorText, { color: colors.expense }]}>স্টক সংখ্যা দিতে হবে</Text>}
              </View>
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>একক</Text>
            <View style={styles.chipGrid}>
              {UNITS.map(u => (
                <TouchableOpacity
                  key={u}
                  onPress={() => { Haptics.selectionAsync(); setUnit(u); }}
                  style={[styles.chip, { backgroundColor: unit === u ? colors.accent : colors.muted, borderColor: unit === u ? colors.accent : colors.border }]}
                >
                  <Text style={{ color: unit === u ? "#fff" : colors.foreground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                    {u}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ক্যাটাগরি *</Text>
            {errors.category && <Text style={[styles.errorText, { color: colors.expense, marginBottom: 4 }]}>ক্যাটাগরি নির্বাচন করুন</Text>}
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => { Haptics.selectionAsync(); setCategory(cat); setErrors(prev => ({ ...prev, category: false })); }}
                  style={[styles.chip, {
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
  row: { flexDirection: "row", gap: 12 },
  marginRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -4,
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
