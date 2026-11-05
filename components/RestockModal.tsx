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

interface RestockModalProps {
  visible: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

export function RestockModal({ visible, onClose, initialProduct }: RestockModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, restockProduct } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [costAmount, setCostAmount] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (visible && initialProduct) {
      setSelectedProduct(initialProduct);
    } else if (!visible) {
      setSelectedProduct(null);
      setQuantity("");
      setCostAmount("");
      setSearch("");
    }
  }, [visible, initialProduct]);

  const botPad = Platform.OS === "web" ? 34 : 0;

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleRestock = () => {
    if (!selectedProduct || !quantity || parseInt(quantity) <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    restockProduct(selectedProduct.id, parseInt(quantity), parseFloat(costAmount || "0"));
    setSelectedProduct(null);
    setQuantity("");
    setCostAmount("");
    setSearch("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 20) }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>স্টক রিস্টক</Text>
            <TouchableOpacity
              onPress={handleRestock}
              disabled={!selectedProduct || !quantity || parseInt(quantity || "0") <= 0}
              style={[styles.saveBtn, { backgroundColor: selectedProduct && quantity && parseInt(quantity) > 0 ? colors.primary : colors.muted }]}
            >
              <Text style={{ color: selectedProduct && quantity && parseInt(quantity) > 0 ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                যোগ করুন
              </Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            {!selectedProduct ? (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>পণ্য নির্বাচন করুন</Text>
                <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="পণ্য খুঁজুন..."
                    placeholderTextColor={colors.mutedForeground}
                    value={search}
                    onChangeText={setSearch}
                  />
                </View>
                {products.length === 0 && (
                  <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name="package" size={36} color={colors.mutedForeground} />
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>কোনো পণ্য নেই</Text>
                    <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                      আগে স্টক ট্যাব থেকে পণ্য যোগ করুন (+ বাটন), তারপর রিস্টক করুন।
                    </Text>
                    <TouchableOpacity onPress={onClose} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
                      <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>বন্ধ করুন</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {filtered.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => { Haptics.selectionAsync(); setSelectedProduct(p); }}
                    style={[styles.productRow, { backgroundColor: colors.card, borderColor: p.stock < 20 ? colors.pendingBorder : colors.border }]}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: p.stock < 20 ? colors.pendingSubtle : colors.secondary }]}>
                      <Feather name="package" size={18} color={p.stock < 20 ? colors.warning : colors.primary} />
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={[styles.productName, { color: colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                        বর্তমান স্টক: {p.stock} {p.unit}
                      </Text>
                    </View>
                    {p.stock < 20 && (
                      <View style={[styles.lowBadge, { backgroundColor: colors.pendingSubtle }]}>
                        <Text style={{ color: colors.warning, fontSize: 11, fontFamily: "Inter_600SemiBold" }}>কম</Text>
                      </View>
                    )}
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setSelectedProduct(null)}
                  style={[styles.selectedCard, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
                >
                  <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
                    <Feather name="package" size={18} color="#fff" />
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.primary }]}>{selectedProduct.name}</Text>
                    <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                      বর্তমান স্টক: {selectedProduct.stock} {selectedProduct.unit}
                    </Text>
                  </View>
                  <Feather name="edit-2" size={14} color={colors.primary} />
                </TouchableOpacity>

                <Text style={[styles.label, { color: colors.mutedForeground }]}>কতটি যোগ করবেন?</Text>
                <TextInput
                  style={[styles.input, styles.bigInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="০"
                  placeholderTextColor={colors.mutedForeground}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                  autoFocus
                />

                {quantity && parseInt(quantity) > 0 && (
                  <View style={[styles.previewRow, { backgroundColor: colors.muted, borderRadius: 12, padding: 14 }]}>
                    <Text style={[styles.previewText, { color: colors.mutedForeground }]}>বর্তমান</Text>
                    <Text style={[styles.previewVal, { color: colors.foreground }]}>{selectedProduct.stock} {selectedProduct.unit}</Text>
                    <Feather name="arrow-right" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.previewVal, { color: colors.income }]}>
                      {selectedProduct.stock + parseInt(quantity)} {selectedProduct.unit}
                    </Text>
                  </View>
                )}

                <Text style={[styles.label, { color: colors.mutedForeground }]}>ক্রয়মূল্য (ঐচ্ছিক)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                  placeholder="৳ মোট খরচ — ব্যয় হিসেবে রেকর্ড হবে"
                  placeholderTextColor={colors.mutedForeground}
                  value={costAmount}
                  onChangeText={setCostAmount}
                  keyboardType="numeric"
                />

                <TouchableOpacity
                  onPress={handleRestock}
                  style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus-circle" size={20} color="#fff" />
                  <Text style={styles.confirmBtnText}>স্টক আপডেট করুন</Text>
                </TouchableOpacity>
              </>
            )}
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
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeBtn: { padding: 4 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  body: { padding: 20, gap: 12 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  lowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  bigInput: { fontSize: 32, fontFamily: "Inter_700Bold", textAlign: "center", paddingVertical: 20 },
  previewRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  previewText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  previewVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  confirmBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 28,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});
