import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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
import { useApp } from "@/context/AppContext";

export function OnboardingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateSettings } = useApp();

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nameError, setNameError] = useState(false);

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : Math.max(insets.bottom, 20);

  const handleStart = () => {
    if (!businessName.trim()) {
      setNameError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      isOnboarded: true,
    });
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.root, { backgroundColor: colors.background }]}
      bottomOffset={16}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.content, { paddingTop: topPad + 24, paddingBottom: botPad + 32 }]}>
        <View style={styles.hero}>
          <View style={[styles.logoBox, { backgroundColor: colors.primary }]}>
            <Feather name="briefcase" size={36} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>BizPilot</Text>
          <Text style={[styles.tagline, { color: colors.foreground }]}>আপনার ব্যবসার সেরা সঙ্গী</Text>
          <Text style={[styles.desc, { color: colors.mutedForeground }]}>
            শুরু করতে আপনার ব্যবসার তথ্য দিন। এটি একবারই করতে হবে।
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.fieldHeader}>
            <Feather name="briefcase" size={16} color={colors.primary} />
            <Text style={[styles.fieldHeaderText, { color: colors.foreground }]}>ব্যবসার তথ্য</Text>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              ব্যবসার নাম <Text style={{ color: colors.expense }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: nameError ? colors.expense : colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="যেমন: রহিম স্টোর, ABC ট্রেডিং..."
              placeholderTextColor={colors.mutedForeground}
              value={businessName}
              onChangeText={v => { setBusinessName(v); if (nameError) setNameError(false); }}
              returnKeyType="next"
              autoFocus
            />
            {nameError && (
              <Text style={[styles.errorText, { color: colors.expense }]}>
                ব্যবসার নাম অবশ্যই দিতে হবে
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>মালিকের নাম</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="আপনার নাম"
              placeholderTextColor={colors.mutedForeground}
              value={ownerName}
              onChangeText={setOwnerName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>ফোন নম্বর</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="০১XXXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>ঠিকানা</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="আপনার দোকানের ঠিকানা"
              placeholderTextColor={colors.mutedForeground}
              value={address}
              onChangeText={setAddress}
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            সব ডেটা শুধু আপনার ডিভাইসে থাকে। ইন্টারনেট ছাড়াই কাজ করে।
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary, opacity: businessName.trim() ? 1 : 0.6 }]}
          onPress={handleStart}
          activeOpacity={0.85}
        >
          <Text style={styles.startBtnText}>শুরু করুন</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 20 },
  hero: { alignItems: "center", gap: 8, paddingBottom: 8 },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#4f46e5", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  appName: { fontSize: 32, fontFamily: "Inter_700Bold", marginTop: 4 },
  tagline: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  desc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  card: { borderRadius: 16, borderWidth: 1, padding: 20, gap: 16 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  fieldHeaderText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  field: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
  },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  infoBox: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "flex-start" },
  infoText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  startBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  startBtnText: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
});
