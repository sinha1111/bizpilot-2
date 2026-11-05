import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface QuickActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSell: () => void;
  onIncome: () => void;
  onExpense: () => void;
  onRestock: () => void;
}

export function QuickActionSheet({ visible, onClose, onSell, onIncome, onExpense, onRestock }: QuickActionSheetProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const botPad = Platform.OS === "web" ? 34 : 0;

  const actions = [
    { label: "পণ্য বিক্রয়", sublabel: "স্টক থেকে বিক্রয় করুন", icon: "shopping-cart", color: colors.income, bg: colors.incomeSubtle, onPress: onSell },
    { label: "স্টক রিস্টক", sublabel: "নতুন মাল স্টকে যোগ করুন", icon: "plus-circle", color: colors.warning, bg: colors.pendingSubtle, onPress: onRestock },
    { label: "আয় যোগ", sublabel: "অন্য আয় রেকর্ড করুন", icon: "trending-up", color: colors.primary, bg: colors.secondary, onPress: onIncome },
    { label: "ব্যয় যোগ", sublabel: "খরচ রেকর্ড করুন", icon: "trending-down", color: colors.expense, bg: colors.expenseSubtle, onPress: onExpense },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, botPad) + 16 }]}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <Text style={[styles.title, { color: colors.foreground }]}>দ্রুত কার্যক্রম</Text>
              {actions.map(a => (
                <TouchableOpacity
                  key={a.label}
                  style={[styles.actionRow, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); a.onPress(); onClose(); }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconWrap, { backgroundColor: a.bg }]}>
                    <Feather name={a.icon as any} size={22} color={a.color} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={[styles.actionLabel, { color: colors.foreground }]}>{a.label}</Text>
                    <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>{a.sublabel}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { flex: 1 },
  actionLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  actionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
