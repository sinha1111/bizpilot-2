import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { MAX_PIN_ATTEMPTS, usePin } from "@/context/PinContext";

const KEYS = [
  ["১", "২", "৩"],
  ["৪", "৫", "৬"],
  ["৭", "৮", "৯"],
  ["bio", "০", "del"],
];

const BN_TO_NUM: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

export function PinLockScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { unlock, unlockBiometric, hasBiometrics, failedAttempts, lockedOutUntil } = usePin();
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (hasBiometrics) setTimeout(() => unlockBiometric(), 300);
  }, []);

  useEffect(() => {
    if (!lockedOutUntil) { setCountdown(0); return; }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedOutUntil - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining > 0) setTimeout(tick, 1000);
    };
    tick();
  }, [lockedOutUntil]);

  useEffect(() => {
    if (digits.length !== 4) return;
    if (lockedOutUntil && Date.now() < lockedOutUntil) {
      setDigits([]);
      return;
    }
    const pin = digits.map(d => BN_TO_NUM[d] ?? d).join("");
    const ok = unlock(pin);
    if (!ok) {
      setShake(true);
      setError(true);
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => { setDigits([]); setShake(false); }, 600);
      setTimeout(() => setError(false), 2000);
    } else {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [digits]);

  const press = (key: string) => {
    if (lockedOutUntil && Date.now() < lockedOutUntil) return;
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (key === "del") setDigits(d => d.slice(0, -1));
    else if (key === "bio") unlockBiometric();
    else if (digits.length < 4) setDigits(d => [...d, key]);
  };

  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;
  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : Math.max(insets.bottom, 24);
  const isLockedOut = !!(lockedOutUntil && countdown > 0);
  const attemptsLeft = MAX_PIN_ATTEMPTS - failedAttempts;
  const showAttemptsWarning = !isLockedOut && failedAttempts > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPad, paddingBottom: botPad }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: isLockedOut ? colors.expenseSubtle : colors.secondary }]}>
          <Feather name={isLockedOut ? "shield-off" : "lock"} size={32} color={isLockedOut ? colors.expense : colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>BizPilot</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {isLockedOut ? `${countdown} সেকেন্ড অপেক্ষা করুন` : "পিন দিয়ে আনলক করুন"}
        </Text>
      </View>

      <View style={[styles.dotsRow, shake && styles.shake]}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < digits.length
                  ? (error ? colors.expense : colors.primary)
                  : colors.muted,
                borderColor: i < digits.length
                  ? (error ? colors.expense : colors.primary)
                  : colors.border,
              },
            ]}
          />
        ))}
      </View>

      {isLockedOut ? (
        <View style={[styles.lockoutBox, { backgroundColor: colors.expenseSubtle, borderColor: colors.expense }]}>
          <Feather name="alert-triangle" size={14} color={colors.expense} />
          <Text style={[styles.lockoutText, { color: colors.expense }]}>
            অনেকবার ভুল পিন — {countdown}s পর আবার চেষ্টা করুন
          </Text>
        </View>
      ) : error ? (
        <Text style={[styles.errorText, { color: colors.expense }]}>
          ভুল পিন! আবার চেষ্টা করুন
        </Text>
      ) : showAttemptsWarning ? (
        <Text style={[styles.warningText, { color: colors.warning }]}>
          আরও {attemptsLeft} বার সুযোগ আছে
        </Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <View style={[styles.pad, isLockedOut && styles.padDisabled]}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map(key => {
              const isBio = key === "bio";
              const isDel = key === "del";
              const skip = isBio && !hasBiometrics;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.key,
                    { backgroundColor: (isBio || isDel || skip) ? "transparent" : colors.card, borderColor: colors.border },
                    isLockedOut && styles.keyDisabled,
                  ]}
                  onPress={() => !skip && press(key)}
                  activeOpacity={0.7}
                  disabled={skip || isLockedOut}
                >
                  {isDel ? (
                    <Feather name="delete" size={22} color={isLockedOut ? colors.mutedForeground : colors.foreground} />
                  ) : isBio && hasBiometrics ? (
                    <Feather name="cpu" size={22} color={isLockedOut ? colors.mutedForeground : colors.primary} />
                  ) : !skip ? (
                    <Text style={[styles.keyText, { color: isLockedOut ? colors.mutedForeground : colors.foreground }]}>{key}</Text>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "space-between", paddingHorizontal: 32 },
  header: { alignItems: "center", gap: 12, marginTop: 32 },
  iconBox: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  sub: { fontSize: 15, fontFamily: "Inter_400Regular" },
  dotsRow: { flexDirection: "row", gap: 20, marginVertical: 8 },
  shake: { transform: [{ translateX: 10 }] },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  warningText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errorPlaceholder: { height: 18 },
  lockoutBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  lockoutText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  pad: { width: "100%", gap: 12, marginBottom: 8 },
  padDisabled: { opacity: 0.4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  key: {
    flex: 1,
    aspectRatio: 1.6,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  keyDisabled: { opacity: 0.5 },
  keyText: { fontSize: 26, fontFamily: "Inter_500Medium" },
});
