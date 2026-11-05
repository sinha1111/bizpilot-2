import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  amount: number;
  icon: string;
  color: string;
  bgColor: string;
  prefix?: string;
  onPress?: () => void;
}

export function StatCard({ label, amount, icon, color, bgColor, prefix = "৳", onPress }: StatCardProps) {
  const colors = useColors();
  const cardStyle = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }];

  const inner = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.amount, { color }]}>
        {prefix}{amount.toLocaleString("bn-BD")}
      </Text>
      {onPress && (
        <View style={styles.chevron}>
          <Feather name="chevron-right" size={11} color={colors.mutedForeground} />
        </View>
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        activeOpacity={0.72}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  amount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  chevron: {
    position: "absolute",
    top: 12,
    right: 12,
  },
});
