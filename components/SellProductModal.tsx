import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  FlatList,
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

interface SellProductModalProps {
  visible: boolean;
  onClose: () => void;
  initialProduct?: Product | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function SellProductModal({ visible, onClose, initialProduct }: SellProductModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { products, customers, recordSale } = useApp();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | undefined>(undefined);
  const [isPaid, setIsPaid] = useState(true);
  const [searchProduct, setSearchProduct] = useState("");
  const [discount, setDiscount] = useState("");
  const [step, setStep] = useState<"select" | "checkout">("select");
  const [showCustomerList, setShowCustomerList] = useState(false);

  useEffect(() => {
    if (visible && initialProduct && initialProduct.stock > 0) {
      setCart([{ product: initialProduct, quantity: 1 }]);
    } else if (!visible) {
      setCart([]);
      setCustomerName("");
      setDiscount("");
      setIsPaid(true);
      setStep("select");
      setSearchProduct("");
      setSelectedCustomerId(undefined);
      setShowCustomerList(false);
    }
  }, [visible, initialProduct]);

  const filteredProducts = products.filter(p =>
    !searchProduct || p.name.toLowerCase().includes(searchProduct.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    !customerName || c.name.toLowerCase().includes(customerName.toLowerCase())
  );

  const total = cart.reduce((s, c) => s + c.product.price * c.quantity, 0);
  const discountAmt = parseFloat(discount || "0");
  const finalTotal = Math.max(0, total - discountAmt);

  const addToCart = (product: Product) => {
    Haptics.selectionAsync();
    if (product.stock === 0) return;
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(c => c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    Haptics.selectionAsync();
    setCart(prev => {
      const existing = prev.find(c => c.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.product.id !== productId);
      return prev.map(c => c.product.id === productId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const getQty = (productId: string) => cart.find(c => c.product.id === productId)?.quantity ?? 0;

  const handleCheckout = () => {
    if (cart.length === 0 || finalTotal < 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recordSale({
      cart,
      finalAmount: finalTotal,
      discount: discountAmt,
      customerName,
      customerId: selectedCustomerId,
      isPaid,
    });
    setCart([]); setCustomerName(""); setDiscount(""); setIsPaid(true);
    setStep("select"); setSearchProduct(""); setSelectedCustomerId(undefined); setShowCustomerList(false);
    onClose();
  };

  const handleClose = () => {
    setCart([]); setCustomerName(""); setDiscount(""); setIsPaid(true);
    setStep("select"); setSearchProduct(""); setSelectedCustomerId(undefined); setShowCustomerList(false);
    onClose();
  };

  const selectCustomer = (name: string, id: string) => {
    setCustomerName(name);
    setSelectedCustomerId(id);
    setShowCustomerList(false);
    Haptics.selectionAsync();
  };

  const botPad = Platform.OS === "web" ? 34 : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 20) }]}>
            <TouchableOpacity onPress={() => step === "checkout" ? setStep("select") : handleClose()} style={styles.closeBtn}>
              <Feather name={step === "checkout" ? "arrow-left" : "x"} size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {step === "select" ? "পণ্য নির্বাচন" : "চেকআউট"}
            </Text>
            {step === "select" ? (
              <TouchableOpacity
                onPress={() => { if (cart.length > 0) { Haptics.selectionAsync(); setStep("checkout"); } }}
                disabled={cart.length === 0}
                style={[styles.nextBtn, { backgroundColor: cart.length > 0 ? colors.primary : colors.muted }]}
              >
                <Text style={{ color: cart.length > 0 ? "#fff" : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>
                  পরবর্তী {cart.length > 0 ? `(${cart.reduce((s, c) => s + c.quantity, 0)})` : ""}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleCheckout} style={[styles.nextBtn, { backgroundColor: colors.income }]}>
                <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>বিক্রয় সম্পন্ন</Text>
              </TouchableOpacity>
            )}
          </View>

          {step === "select" ? (
            <>
              <View style={[styles.searchRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="পণ্য খুঁজুন..."
                    placeholderTextColor={colors.mutedForeground}
                    value={searchProduct}
                    onChangeText={setSearchProduct}
                  />
                </View>
              </View>

              {cart.length > 0 && (
                <View style={[styles.cartBar, { backgroundColor: colors.secondary }]}>
                  <Feather name="shopping-cart" size={14} color={colors.primary} />
                  <Text style={[styles.cartBarText, { color: colors.primary }]}>
                    {cart.reduce((s, c) => s + c.quantity, 0)} পণ্য · মোট ৳{total.toLocaleString()}
                  </Text>
                </View>
              )}

              {products.length === 0 && (
                <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="shopping-bag" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.emptyTitle, { color: colors.foreground }]}>কোনো পণ্য নেই</Text>
                  <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                    আগে স্টক ট্যাব থেকে পণ্য যোগ করুন (+ বাটন), তারপর বিক্রয় করুন।
                  </Text>
                  <TouchableOpacity onPress={handleClose} style={[styles.emptyBtn, { backgroundColor: colors.primary }]}>
                    <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>বন্ধ করুন</Text>
                  </TouchableOpacity>
                </View>
              )}
              <FlatList
                data={filteredProducts}
                keyExtractor={p => p.id}
                contentContainerStyle={styles.productList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item: product }) => {
                  const qty = getQty(product.id);
                  const isOOS = product.stock === 0;
                  return (
                    <View style={[styles.productRow, { backgroundColor: colors.card, borderColor: product.stock < 5 && !isOOS ? colors.pendingBorder : colors.border, opacity: isOOS ? 0.6 : 1 }]}>
                      <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                        <Text style={[styles.productMeta, { color: colors.mutedForeground }]}>
                          ৳{product.price}/{product.unit} · স্টক: {product.stock}
                          {product.stock < 5 && !isOOS ? " ⚠️" : ""}
                        </Text>
                      </View>
                      <View style={styles.qtyControl}>
                        {qty > 0 ? (
                          <>
                            <TouchableOpacity onPress={() => removeFromCart(product.id)} style={[styles.qtyBtn, { backgroundColor: colors.muted }]}>
                              <Feather name="minus" size={16} color={colors.foreground} />
                            </TouchableOpacity>
                            <Text style={[styles.qtyText, { color: colors.foreground }]}>{qty}</Text>
                            <TouchableOpacity onPress={() => addToCart(product)} style={[styles.qtyBtn, { backgroundColor: colors.primary }]} disabled={isOOS || qty >= product.stock}>
                              <Feather name="plus" size={16} color="#fff" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity onPress={() => addToCart(product)} style={[styles.addBtn, { backgroundColor: isOOS ? colors.muted : colors.secondary }]} disabled={isOOS}>
                            <Text style={{ color: isOOS ? colors.mutedForeground : colors.primary, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                              {isOOS ? "শেষ" : "যোগ"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            </>
          ) : (
            <KeyboardAwareScrollViewCompat style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.checkoutBody} keyboardShouldPersistTaps="handled" bottomOffset={16}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>পণ্যের তালিকা</Text>
              <View style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {cart.map((c, i) => (
                  <View key={c.product.id} style={[styles.cartItemRow, { borderBottomColor: colors.border, borderBottomWidth: i < cart.length - 1 ? 1 : 0 }]}>
                    <Text style={[styles.cartItemName, { color: colors.foreground }]}>{c.product.name}</Text>
                    <Text style={[styles.cartItemQty, { color: colors.mutedForeground }]}>×{c.quantity}</Text>
                    <Text style={[styles.cartItemPrice, { color: colors.foreground }]}>৳{(c.product.price * c.quantity).toLocaleString()}</Text>
                  </View>
                ))}
                {discountAmt > 0 && (
                  <View style={[styles.cartItemRow, { borderTopColor: colors.border, borderTopWidth: 1 }]}>
                    <Text style={[styles.cartItemName, { color: colors.expense }]}>ছাড়</Text>
                    <Text style={[styles.cartItemPrice, { color: colors.expense }]}>-৳{discountAmt.toLocaleString()}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.totalLabel, { color: colors.foreground }]}>মোট</Text>
                  <Text style={[styles.totalAmount, { color: colors.primary }]}>৳{finalTotal.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ছাড় (ঐচ্ছিক)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="৳ ছাড়ের পরিমাণ"
                placeholderTextColor={colors.mutedForeground}
                value={discount}
                onChangeText={setDiscount}
                keyboardType="numeric"
              />

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>গ্রাহক (ঐচ্ছিক)</Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, borderColor: selectedCustomerId ? colors.primary : colors.border, color: colors.foreground }]}
                  placeholder="গ্রাহকের নাম লিখুন বা নির্বাচন করুন"
                  placeholderTextColor={colors.mutedForeground}
                  value={customerName}
                  onChangeText={t => { setCustomerName(t); setSelectedCustomerId(undefined); setShowCustomerList(t.length > 0); }}
                  onFocus={() => setShowCustomerList(customerName.length > 0 || customers.length > 0)}
                />
                {selectedCustomerId && (
                  <View style={[styles.selectedBadge, { backgroundColor: colors.secondary }]}>
                    <Feather name="check" size={12} color={colors.primary} />
                    <Text style={{ color: colors.primary, fontSize: 11, fontFamily: "Inter_500Medium" }}>খাতায় লেখা হবে</Text>
                  </View>
                )}
              </View>

              {showCustomerList && filteredCustomers.length > 0 && (
                <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {filteredCustomers.slice(0, 5).map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                      onPress={() => selectCustomer(c.name, c.id)}
                    >
                      <Text style={[styles.dropdownName, { color: colors.foreground }]}>{c.name}</Text>
                      {c.due > 0 && <Text style={[styles.dropdownDue, { color: colors.expense }]}>বাকি ৳{c.due.toLocaleString()}</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>পেমেন্ট অবস্থা</Text>
              <View style={[styles.typeToggle, { backgroundColor: colors.muted }]}>
                {[true, false].map(paid => (
                  <TouchableOpacity
                    key={String(paid)}
                    onPress={() => { Haptics.selectionAsync(); setIsPaid(paid); }}
                    style={[styles.typeBtn, isPaid === paid && { backgroundColor: paid ? colors.income : colors.warning }]}
                  >
                    <Feather name={paid ? "check-circle" : "clock"} size={14} color={isPaid === paid ? "#fff" : colors.mutedForeground} />
                    <Text style={[styles.typeText, { color: isPaid === paid ? "#fff" : colors.mutedForeground }]}>
                      {paid ? "নগদ" : "বাকি"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!isPaid && customerName && (
                <View style={[styles.duenote, { backgroundColor: colors.pendingSubtle, borderColor: colors.pendingBorder }]}>
                  <Feather name="info" size={14} color={colors.warning} />
                  <Text style={{ color: colors.warning, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>
                    {selectedCustomerId ? `"${customerName}"-এর খাতায় ৳${finalTotal.toLocaleString()} বাকি যোগ হবে` : `গ্রাহক লিস্টে থাকলে স্বয়ংক্রিয়ভাবে বাকি আপডেট হবে`}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleCheckout}
                style={[styles.checkoutBtn, { backgroundColor: colors.income }]}
              >
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.checkoutBtnText}>৳{finalTotal.toLocaleString()} বিক্রয় সম্পন্ন করুন</Text>
              </TouchableOpacity>
            </KeyboardAwareScrollViewCompat>
          )}
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
  nextBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
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
  cartBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  cartBarText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productList: { padding: 16, gap: 10 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  productMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  qtyControl: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyBtn: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  qtyText: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "center" },
  addBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  checkoutBody: { padding: 20, gap: 12 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 8 },
  cartCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cartItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
  },
  cartItemName: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  cartItemQty: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cartItemPrice: { fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 80, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  totalLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  totalAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  selectedBadge: {
    position: "absolute",
    right: 12,
    top: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -8,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  dropdownDue: { fontSize: 12, fontFamily: "Inter_500Medium" },
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
  duenote: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  checkoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  checkoutBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    margin: 16,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtext: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
});
