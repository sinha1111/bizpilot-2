import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { usePin } from "@/context/PinContext";

type Step = "current" | "new" | "confirm";

const KEYS = [
  ["১", "২", "৩"],
  ["৪", "৫", "৬"],
  ["৭", "৮", "৯"],
  ["", "০", "del"],
];

const BN_TO_NUM: Record<string, string> = {
  "০":"0","১":"1","২":"2","৩":"3","৪":"4",
  "৫":"5","৬":"6","৭":"7","৮":"8","৯":"9",
};

interface Props {
  visible: boolean;
  mode: "set" | "change" | "disable";
  onDone: () => void;
  onCancel: () => void;
}

export function PinSetupModal({ visible, mode, onDone, onCancel }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setNewPin, disablePin, verifyPin } = usePin();
  const [step, setStep] = useState<Step>(mode === "set" ? "new" : "current");
  const [digits, setDigits] = useState<string[]>([]);
  const [error, setError] = useState("");
  const newPinRef = useRef<string>("");

  const botPad = Platform.OS === "web" ? Math.max(insets.bottom, 34) : Math.max(insets.bottom, 24);

  const reset = () => {
    setStep(mode === "set" ? "new" : "current");
    setDigits([]);
    setError("");
    newPinRef.current = "";
  };

  const handleCancel = () => { reset(); onCancel(); };

  const submitPin = (pin: string) => {
    setError("");
    if (step === "current") {
      if (!verifyPin(pin)) {
        setError("ভুল পিন! আবার চেষ্টা করুন");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setDigits([]);
        return;
      }
      if (mode === "disable") { disablePin(pin); reset(); onDone(); return; }
      newPinRef.current = "";
      setDigits([]);
      setStep("new");
    } else if (step === "new") {
      newPinRef.current = pin;
      setDigits([]);
      setStep("confirm");
    } else if (step === "confirm") {
      if (pin !== newPinRef.current) {
        setError("পিন মিলছে না! আবার চেষ্টা করুন");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setDigits([]);
        newPinRef.current = "";
        setStep("new");
        return;
      }
      setNewPin(pin).then(() => { reset(); onDone(); });
    }
  };

  const press = (key: string) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    if (key === "del") { setDigits(d => d.slice(0, -1)); return; }
    if (digits.length >= 4) return;
    const next = [...digits, key];
    setDigits(next);
    if (next.length === 4) {
      const pin = next.map(d => BN_TO_NUM[d] ?? d).join("");
      setTimeout(() => submitPin(pin), 80);
    }
  };

  const stepTitle: Record<Step, string> = {
    current: "বর্তমান পিন দিন",
    new: "নতুন পিন সেট করুন",
    confirm: "পিন আবার দিন",
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCancel}>
      <View style={[styles.container, { backgroundColor: colors.background, paddingBottom: botPad }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>বাতিল</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {mode === "disable" ? "পিন বন্ধ করুন" : mode === "change" ? "পিন পরিবর্তন" : "পিন সেট করুন"}
          </Text>
          <View style={{ width: 50 }} />
        </View>

        <View style={styles.body}>
          <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
            <Feather name="shield" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>{stepTitle[step]}</Text>
          {error ? (
            <Text style={[styles.error, { color: colors.expense }]}>{error}</Text>
          ) : (
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>৪ সংখ্যার পিন</Text>
          )}
          <View style={styles.dots}>
            {[0,1,2,3].map(i => (
              <View key={i} style={[styles.dot, {
                backgroundColor: i < digits.length ? colors.primary : colors.muted,
                borderColor: i < digits.length ? colors.primary : colors.border,
              }]} />
            ))}
          </View>
        </View>

        <View style={styles.pad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((key, ki) => {
                const empty = key === "";
                return (
                  <TouchableOpacity
                    key={ki}
                    style={[styles.key, {
                      backgroundColor: empty ? "transparent" : colors.card,
                      borderColor: colors.border,
                      borderWidth: empty ? 0 : 1,
                    }]}
                    onPress={() => !empty && press(key)}
                    disabled={empty}
                    activeOpacity={0.7}
                  >
                    {key === "del" ? (
                      <Feather name="delete" size={20} color={colors.foreground} />
                    ) : !empty ? (
                      <Text style={[styles.keyText, { color: colors.foreground }]}>{key}</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  handle: { width: 40, height: 4, borderRadius: 2, marginTop: 12, marginBottom: 4 },
  header: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", width:"100%", paddingHorizontal:16, paddingVertical:12 },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  title: { fontSize: 17, fontFamily: "Inter_700Bold" },
  body: { alignItems:"center", gap:8, marginTop:24, marginBottom:32 },
  iconBox: { width:64, height:64, borderRadius:18, alignItems:"center", justifyContent:"center", marginBottom:4 },
  stepTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  error: { fontSize: 13, fontFamily: "Inter_500Medium" },
  dots: { flexDirection:"row", gap:16, marginTop:8 },
  dot: { width:16, height:16, borderRadius:8, borderWidth:2 },
  pad: { width:"100%", paddingHorizontal:32, gap:12 },
  row: { flexDirection:"row", justifyContent:"space-between", gap:12 },
  key: { flex:1, height:64, borderRadius:14, alignItems:"center", justifyContent:"center" },
  keyText: { fontSize: 24, fontFamily: "Inter_500Medium" },
});
