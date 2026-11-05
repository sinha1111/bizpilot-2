import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useTabBarHeight } from "@/hooks/useTabBarHeight";
import { Customer, useApp } from "@/context/AppContext";
import { CustomerItem } from "@/components/CustomerItem";
import { AddCustomerModal } from "@/components/AddCustomerModal";
import { CustomerDetailModal } from "@/components/CustomerDetailModal";

export default function CustomersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, deleteCustomer } = useApp();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const tabBarHeight = useTabBarHeight();
  const topPad = Platform.OS === "web" ? Math.max(insets.top, 67) : insets.top;

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search);
      const matchDue = !showDueOnly || c.due > 0;
      return matchSearch && matchDue;
    });
  }, [customers, search, showDueOnly]);

  const totalDue = customers.reduce((s, c) => s + c.due, 0);

  const handleCustomerPress = (customer: Customer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCustomer(customer);
    setShowDetail(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topPad + 16, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>গ্রাহক</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{customers.length} জন গ্রাহক</Text>
        </View>
        {totalDue > 0 && (
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); setShowDueOnly(!showDueOnly); }}
            style={[styles.dueBadge, { backgroundColor: showDueOnly ? colors.expense : colors.expenseSubtle }]}
          >
            <Text style={{ color: showDueOnly ? "#fff" : colors.expense, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>
              বাকি ৳{totalDue.toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {totalDue > 0 && !showDueOnly && (
        <TouchableOpacity
          style={[styles.dueBanner, { backgroundColor: colors.pendingSubtle, borderColor: colors.pendingBorder }]}
          onPress={() => { Haptics.selectionAsync(); setShowDueOnly(true); }}
        >
          <Feather name="alert-circle" size={16} color={colors.warning} />
          <Text style={[styles.dueBannerText, { color: colors.warning }]}>
            {customers.filter(c => c.due > 0).length} গ্রাহকের কাছে মোট ৳{totalDue.toLocaleString()} বাকি আছে — গ্রাহকে চাপুন বাকি নিতে
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarHeight + 16 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CustomerItem
            item={item}
            onDelete={deleteCustomer}
            onPress={handleCustomerPress}
            onEdit={(c) => { setEditCustomer(c); setShowAdd(true); }}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>কোনো গ্রাহক নেই</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: tabBarHeight + 8 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <AddCustomerModal
        visible={showAdd}
        onClose={() => { setShowAdd(false); setEditCustomer(null); }}
        editCustomer={editCustomer}
      />
      <CustomerDetailModal
        visible={showDetail}
        onClose={() => { setShowDetail(false); setSelectedCustomer(null); }}
        customer={selectedCustomer}
        onEdit={(c) => { setEditCustomer(c); setShowAdd(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  dueBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  searchRow: { paddingHorizontal: 20, paddingVertical: 10 },
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
  dueBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  dueBannerText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 20 },
  empty: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 16,
  },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  fab: {
    position: "absolute",
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4f46e5",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
});
