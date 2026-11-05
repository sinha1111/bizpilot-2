import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Linking,
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
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { useApp } from "@/context/AppContext";
import { ThemePreference, useTheme } from "@/context/ThemeContext";
import { usePin } from "@/context/PinContext";
import { PinSetupModal } from "@/components/PinSetupModal";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, clearAllData, transactions, products, customers } = useApp();
  const { preference, setPreference } = useTheme();
  const { pinEnabled, hasBiometrics } = usePin();

  const [businessName, setBusinessName] = useState(settings.businessName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pinModal, setPinModal] = useState<"set" | "change" | "disable" | null>(null);
  const [nameError, setNameError] = useState(false);

  React.useEffect(() => {
    setBusinessName(settings.businessName);
    setOwnerName(settings.ownerName);
    setPhone(settings.phone);
    setAddress(settings.address);
  }, [settings.businessName, settings.ownerName, settings.phone, settings.address]);

  const tabBarHeight = useTabBarHeight();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const handleSave = () => {
    if (!businessName.trim()) {
      setNameError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setNameError(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings({ businessName: businessName.trim(), ownerName: ownerName.trim(), phone: phone.trim(), address: address.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (Platform.OS === "web") {
      setShowDeleteConfirm(true);
    } else {
      Alert.alert(
        "সব ডেটা মুছুন",
        "এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সব লেনদেন, পণ্য ও গ্রাহক মুছে যাবে।",
        [
          { text: "বাতিল", style: "cancel" },
          { text: "মুছে ফেলুন", style: "destructive", onPress: clearAllData },
        ]
      );
    }
  };

  const themeOptions: { key: ThemePreference; label: string; icon: string }[] = [
    { key: "system", label: "সিস্টেম", icon: "smartphone" },
    { key: "light", label: "হালকা", icon: "sun" },
    { key: "dark", label: "গাঢ়", icon: "moon" },
  ];

  const stats = [
    { label: "মোট লেনদেন", value: transactions.length, icon: "repeat", color: colors.primary },
    { label: "মোট পণ্য", value: products.length, icon: "package", color: colors.income },
    { label: "মোট গ্রাহক", value: customers.length, icon: "users", color: colors.accent },
  ];

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={16}
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>সেটিংস</Text>

        <View style={styles.statsRow}>
          {stats.map(s => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="moon" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>থিম</Text>
          </View>
          <Text style={[styles.themeDesc, { color: colors.mutedForeground }]}>
            অ্যাপের রং পছন্দ অনুযায়ী পরিবর্তন করুন
          </Text>
          <View style={[styles.themeToggle, { backgroundColor: colors.muted }]}>
            {themeOptions.map(opt => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => { Haptics.selectionAsync(); setPreference(opt.key); }}
                style={[
                  styles.themeBtn,
                  preference === opt.key && { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5 },
                ]}
              >
                <Feather
                  name={opt.icon as any}
                  size={16}
                  color={preference === opt.key ? colors.primary : colors.mutedForeground}
                />
                <Text style={[
                  styles.themeBtnText,
                  { color: preference === opt.key ? colors.primary : colors.mutedForeground },
                  preference === opt.key && { fontFamily: "Inter_700Bold" },
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Business Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>ব্যবসার তথ্য</Text>
          </View>

          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            ব্যবসার নাম <Text style={{ color: colors.expense }}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: nameError ? colors.expense : colors.border, color: colors.foreground }]}
            placeholder="আপনার ব্যবসার নাম"
            placeholderTextColor={colors.mutedForeground}
            value={businessName}
            onChangeText={v => { setBusinessName(v); if (nameError) setNameError(false); }}
          />
          {nameError && (
            <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.expense, marginTop: -4 }}>
              ব্যবসার নাম খালি রাখা যাবে না
            </Text>
          )}

          <Text style={[styles.label, { color: colors.mutedForeground }]}>মালিকের নাম</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="আপনার নাম"
            placeholderTextColor={colors.mutedForeground}
            value={ownerName}
            onChangeText={setOwnerName}
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>ফোন নম্বর</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="০১XXXXXXXXX"
            placeholderTextColor={colors.mutedForeground}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { color: colors.mutedForeground }]}>ঠিকানা</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="আপনার দোকানের ঠিকানা"
            placeholderTextColor={colors.mutedForeground}
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveBtn, { backgroundColor: saved ? colors.income : colors.primary }]}
          >
            <Feather name={saved ? "check" : "save"} size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{saved ? "সংরক্ষিত হয়েছে!" : "সংরক্ষণ করুন"}</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="info" size={18} color={colors.mutedForeground} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>অ্যাপের তথ্য</Text>
          </View>
          {[
            { label: "অ্যাপের নাম", value: "BizPilot" },
            { label: "ডেটা সংরক্ষণ", value: "আপনার ডিভাইসে" },
          ].map(item => (
            <View key={item.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{item.label}</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{item.value}</Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.privacyRow, { borderTopColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              Linking.openURL("https://app-privacy-center.blogspot.com/2026/06/privacy-policy-business-suite-control.html");
            }}
            activeOpacity={0.7}
          >
            <Feather name="shield" size={15} color={colors.primary} />
            <Text style={[styles.privacyText, { color: colors.primary }]}>গোপনীয়তা নীতি</Text>
            <Feather name="external-link" size={14} color={colors.primary} style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        </View>

        {/* Security */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Feather name="shield" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>নিরাপত্তা</Text>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoLabel, { color: colors.foreground, fontSize: 15 }]}>পিন লক</Text>
              <Text style={[{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 2 }]}>
                {pinEnabled ? (hasBiometrics ? "চালু · বায়োমেট্রিক সমর্থিত" : "চালু") : "বন্ধ · অ্যাপ খুলতে পিন লাগবে না"}
              </Text>
            </View>
            <View style={[styles.pinBadge, { backgroundColor: pinEnabled ? colors.incomeSubtle : colors.muted }]}>
              <Text style={[styles.pinBadgeText, { color: pinEnabled ? colors.income : colors.mutedForeground }]}>
                {pinEnabled ? "চালু" : "বন্ধ"}
              </Text>
            </View>
          </View>
          {!pinEnabled ? (
            <TouchableOpacity
              style={[styles.pinBtn, { backgroundColor: colors.primary }]}
              onPress={() => { Haptics.selectionAsync(); setPinModal("set"); }}
              activeOpacity={0.85}
            >
              <Feather name="lock" size={15} color="#fff" />
              <Text style={[styles.pinBtnText, { color: "#fff" }]}>পিন সেট করুন</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.pinActions}>
              <TouchableOpacity
                style={[styles.pinActionBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => { Haptics.selectionAsync(); setPinModal("change"); }}
                activeOpacity={0.85}
              >
                <Feather name="edit-2" size={14} color={colors.foreground} />
                <Text style={[styles.pinActionText, { color: colors.foreground }]}>পরিবর্তন</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pinActionBtn, { backgroundColor: colors.expenseSubtle, borderColor: colors.expenseBorder }]}
                onPress={() => { Haptics.selectionAsync(); setPinModal("disable"); }}
                activeOpacity={0.85}
              >
                <Feather name="unlock" size={14} color={colors.expense} />
                <Text style={[styles.pinActionText, { color: colors.expense }]}>বন্ধ করুন</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.expenseBorder }]}>
          <View style={styles.sectionHeader}>
            <Feather name="alert-triangle" size={18} color={colors.expense} />
            <Text style={[styles.sectionTitle, { color: colors.expense }]}>বিপজ্জনক এলাকা</Text>
          </View>
          <Text style={[styles.dangerDesc, { color: colors.mutedForeground }]}>
            সব ডেটা মুছে ফেললে পুনরুদ্ধার করা সম্ভব হবে না।
          </Text>
          <TouchableOpacity
            onPress={handleClearData}
            style={[styles.dangerBtn, { borderColor: colors.expense }]}
          >
            <Feather name="trash-2" size={16} color={colors.expense} />
            <Text style={[styles.dangerBtnText, { color: colors.expense }]}>সব ডেটা মুছে ফেলুন</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollViewCompat>

      {pinModal && (
        <PinSetupModal
          visible={true}
          mode={pinModal}
          onDone={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setPinModal(null); }}
          onCancel={() => setPinModal(null)}
        />
      )}

      {/* Web Delete Confirmation Modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <View style={styles.overlay}>
          <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.confirmIcon, { backgroundColor: colors.expenseSubtle }]}>
              <Feather name="alert-triangle" size={28} color={colors.expense} />
            </View>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>সব ডেটা মুছুন?</Text>
            <Text style={[styles.confirmDesc, { color: colors.mutedForeground }]}>
              এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না। সব লেনদেন, পণ্য ও গ্রাহক চিরতরে মুছে যাবে।
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: colors.muted }]}
                onPress={() => setShowDeleteConfirm(false)}
              >
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, { backgroundColor: colors.expense }]}
                onPress={() => { setShowDeleteConfirm(false); clearAllData(); }}
              >
                <Feather name="trash-2" size={16} color="#fff" />
                <Text style={styles.confirmDeleteText}>মুছে ফেলুন</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statsRow: { flexDirection: "row", gap: 10 },
  statBox: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  section: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  themeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: -4 },
  themeToggle: { flexDirection: "row", borderRadius: 14, padding: 4, gap: 4 },
  themeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  themeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    marginTop: 6,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  infoLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  privacyText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pinBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pinBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pinBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginTop: 10 },
  pinBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pinActions: { flexDirection: "row", gap: 10, marginTop: 10 },
  pinActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  pinActionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dangerDesc: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 4,
  },
  dangerBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 14,
    alignItems: "center",
  },
  confirmIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmBtns: { flexDirection: "row", gap: 12, width: "100%", marginTop: 4 },
  confirmCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmCancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmDeleteBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
  },
  confirmDeleteText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
