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
import { Customer, useApp } from "@/context/AppContext";

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  editCustomer?: Customer | null;
}

interface FormErrors {
  name: boolean;
  phone: boolean;
}

export function AddCustomerModal({ visible, onClose, editCustomer }: AddCustomerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCustomer, updateCustomer } = useApp();
  const botPad = Platform.OS === "web" ? 34 : 0;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [due, setDue] = useState("");
  const [errors, setErrors] = useState<FormErrors>({ name: false, phone: false });

  useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name);
      setPhone(editCustomer.phone);
      setAddress(editCustomer.address ?? "");
      setDue(editCustomer.due > 0 ? String(editCustomer.due) : "");
    } else {
      setName(""); setPhone(""); setAddress(""); setDue("");
    }
    setErrors({ name: false, phone: false });
  }, [editCustomer, visible]);

  const handleSave = () => {
    const newErrors: FormErrors = {
      name: !name.trim(),
      phone: !phone.trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editCustomer) {
      updateCustomer(editCustomer.id, {
        name,
        phone,
        address: address || undefined,
        due: parseFloat(due || "0"),
      });
    } else {
      addCustomer({
        name,
        phone,
        address: address || undefined,
        due: parseFloat(due || "0"),
        totalPurchase: 0,
      });
    }
    setName(""); setPhone(""); setAddress(""); setDue("");
    onClose();
  };

  const errBorder = (hasErr: boolean) => hasErr ? colors.expense : colors.border;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {editCustomer ? "গ্রাহক সম্পাদনা" : "নতুন গ্রাহক"}
            </Text>
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
              <Text style={{ color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 14 }}>সংরক্ষণ</Text>
            </TouchableOpacity>
          </View>

          <KeyboardAwareScrollViewCompat style={{ flex: 1 }} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bottomOffset={16}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>নাম *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errBorder(errors.name), color: colors.foreground }]}
              placeholder="গ্রাহকের নাম"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={t => { setName(t); if (errors.name) setErrors(prev => ({ ...prev, name: false })); }}
            />
            {errors.name && <Text style={[styles.errorText, { color: colors.expense }]}>নাম অবশ্যই দিতে হবে</Text>}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ফোন নম্বর *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: errBorder(errors.phone), color: colors.foreground }]}
              placeholder="০১XXXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={t => { setPhone(t); if (errors.phone) setErrors(prev => ({ ...prev, phone: false })); }}
              keyboardType="phone-pad"
            />
            {errors.phone && <Text style={[styles.errorText, { color: colors.expense }]}>ফোন নম্বর অবশ্যই দিতে হবে</Text>}

            <Text style={[styles.label, { color: colors.mutedForeground }]}>ঠিকানা (ঐচ্ছিক)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="ঠিকানা লিখুন"
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {editCustomer ? "বর্তমান বাকি (৳)" : "প্রারম্ভিক বাকি (ঐচ্ছিক)"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="০"
              placeholderTextColor={colors.mutedForeground}
              value={due}
              onChangeText={setDue}
              keyboardType="numeric"
            />

            {editCustomer && (
              <View style={[styles.infoRow, { backgroundColor: colors.secondary, borderRadius: 12, padding: 14 }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>
                  মোট কেনার পরিমাণ: ৳{editCustomer.totalPurchase.toLocaleString()}
                </Text>
              </View>
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
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
});
