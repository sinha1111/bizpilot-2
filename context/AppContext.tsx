import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
  customerName?: string;
  customerId?: string;
  isPaid?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  costPrice?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalPurchase: number;
  due: number;
}

export interface AppSettings {
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  isOnboarded: boolean;
}

interface AppContextType {
  transactions: Transaction[];
  products: Product[];
  customers: Customer[];
  settings: AppSettings;
  updateSettings: (s: Partial<AppSettings>) => void;
  clearAllData: () => void;
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  restockProduct: (id: string, quantity: number, costAmount?: number) => void;
  addCustomer: (c: Omit<Customer, "id">) => void;
  updateCustomer: (id: string, c: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  recordSale: (params: {
    cart: Array<{ product: Product; quantity: number }>;
    finalAmount: number;
    discount: number;
    customerName: string;
    customerId?: string;
    isPaid: boolean;
  }) => void;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  todayIncome: number;
  todayExpense: number;
  monthIncome: number;
  monthExpense: number;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

const STORAGE_KEYS = {
  transactions: "@bizpilot_transactions",
  products: "@bizpilot_products",
  customers: "@bizpilot_customers",
  settings: "@bizpilot_settings",
};

const DEFAULT_SETTINGS: AppSettings = {
  businessName: "",
  ownerName: "",
  phone: "",
  address: "",
  isOnboarded: false,
};


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tRaw, pRaw, cRaw, sRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.transactions),
          AsyncStorage.getItem(STORAGE_KEYS.products),
          AsyncStorage.getItem(STORAGE_KEYS.customers),
          AsyncStorage.getItem(STORAGE_KEYS.settings),
        ]);
        setTransactions(tRaw ? JSON.parse(tRaw) : []);
        setProducts(pRaw ? JSON.parse(pRaw) : []);
        setCustomers(cRaw ? JSON.parse(cRaw) : []);
        setSettings(sRaw ? { ...DEFAULT_SETTINGS, ...JSON.parse(sRaw) } : DEFAULT_SETTINGS);
      } catch {
        setTransactions([]);
        setProducts([]);
        setCustomers([]);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const saveTransactions = useCallback(async (data: Transaction[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(data));
  }, []);
  const saveProducts = useCallback(async (data: Product[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.products, JSON.stringify(data));
  }, []);
  const saveCustomers = useCallback(async (data: Customer[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(data));
  }, []);
  const saveSettings = useCallback(async (data: AppSettings) => {
    await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(data));
  }, []);

  const updateSettings = useCallback((s: Partial<AppSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...s };
      saveSettings(updated);
      return updated;
    });
  }, [saveSettings]);

  const clearAllData = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.transactions),
      AsyncStorage.removeItem(STORAGE_KEYS.products),
      AsyncStorage.removeItem(STORAGE_KEYS.customers),
    ]);
    setTransactions([]);
    setProducts([]);
    setCustomers([]);
  }, []);

  const addTransaction = useCallback((t: Omit<Transaction, "id">) => {
    const newT = { ...t, id: generateId() };
    setTransactions(prev => {
      const updated = [newT, ...prev];
      saveTransactions(updated);
      return updated;
    });
  }, [saveTransactions]);

  const updateTransaction = useCallback((id: string, t: Partial<Transaction>) => {
    setTransactions(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...t } : item);
      saveTransactions(updated);
      return updated;
    });
  }, [saveTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveTransactions(updated);
      return updated;
    });
  }, [saveTransactions]);

  const addProduct = useCallback((p: Omit<Product, "id">) => {
    const newP = { ...p, id: generateId() };
    setProducts(prev => {
      const updated = [newP, ...prev];
      saveProducts(updated);
      return updated;
    });
  }, [saveProducts]);

  const updateProduct = useCallback((id: string, p: Partial<Product>) => {
    setProducts(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...p } : item);
      saveProducts(updated);
      return updated;
    });
  }, [saveProducts]);

  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveProducts(updated);
      return updated;
    });
  }, [saveProducts]);

  // Restock product: add stock and optionally record an expense
  const restockProduct = useCallback((id: string, quantity: number, costAmount?: number) => {
    setProducts(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, stock: item.stock + quantity } : item
      );
      saveProducts(updated);
      return updated;
    });
    if (costAmount && costAmount > 0) {
      const product = products.find(p => p.id === id);
      addTransaction({
        type: "expense",
        amount: costAmount,
        category: "ক্রয়",
        description: `স্টক রিস্টক: ${product?.name ?? "পণ্য"}`,
        isPaid: true,
        date: new Date().toISOString(),
      });
    }
  }, [saveProducts, products, addTransaction]);

  const addCustomer = useCallback((c: Omit<Customer, "id">) => {
    const newC = { ...c, id: generateId() };
    setCustomers(prev => {
      const updated = [newC, ...prev];
      saveCustomers(updated);
      return updated;
    });
  }, [saveCustomers]);

  const updateCustomer = useCallback((id: string, c: Partial<Customer>) => {
    setCustomers(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...c } : item);
      saveCustomers(updated);
      return updated;
    });
  }, [saveCustomers]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveCustomers(updated);
      return updated;
    });
  }, [saveCustomers]);

  // Unified sale recording: deducts stock, creates transaction, updates customer
  const recordSale = useCallback((params: {
    cart: Array<{ product: Product; quantity: number }>;
    finalAmount: number;
    discount: number;
    customerName: string;
    customerId?: string;
    isPaid: boolean;
  }) => {
    const { cart, finalAmount, customerName, customerId, isPaid } = params;

    // Build description
    const desc = cart.map(c => `${c.product.name} x${c.quantity}`).join(", ");

    // Add transaction
    const newT: Transaction = {
      id: generateId(),
      type: "income",
      amount: finalAmount,
      category: "বিক্রয়",
      description: `বিক্রয়: ${desc}`,
      customerName: customerName || undefined,
      customerId: customerId || undefined,
      isPaid,
      date: new Date().toISOString(),
    };
    setTransactions(prev => {
      const updated = [newT, ...prev];
      saveTransactions(updated);
      return updated;
    });

    // Deduct stock
    setProducts(prev => {
      const updated = prev.map(p => {
        const cartItem = cart.find(c => c.product.id === p.id);
        if (!cartItem) return p;
        return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
      });
      saveProducts(updated);
      return updated;
    });

    // Update customer totalPurchase and due
    if (customerName || customerId) {
      setCustomers(prev => {
        const updated = prev.map(c => {
          const match = customerId ? c.id === customerId : c.name.toLowerCase() === customerName.toLowerCase();
          if (!match) return c;
          return {
            ...c,
            totalPurchase: c.totalPurchase + finalAmount,
            due: isPaid ? c.due : c.due + finalAmount,
          };
        });
        saveCustomers(updated);
        return updated;
      });
    }
  }, [saveTransactions, saveProducts, saveCustomers]);

  const today = new Date().toDateString();
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const todayIncome = transactions
    .filter(t => t.type === "income" && new Date(t.date).toDateString() === today)
    .reduce((s, t) => s + t.amount, 0);
  const todayExpense = transactions
    .filter(t => t.type === "expense" && new Date(t.date).toDateString() === today)
    .reduce((s, t) => s + t.amount, 0);

  const monthIncome = transactions
    .filter(t => { const d = new Date(t.date); return t.type === "income" && d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = transactions
    .filter(t => { const d = new Date(t.date); return t.type === "expense" && d.getMonth() === thisMonth && d.getFullYear() === thisYear; })
    .reduce((s, t) => s + t.amount, 0);

  return (
    <AppContext.Provider value={{
      transactions, products, customers, settings,
      updateSettings,
      clearAllData,
      addTransaction, updateTransaction, deleteTransaction,
      addProduct, updateProduct, deleteProduct, restockProduct,
      addCustomer, updateCustomer, deleteCustomer,
      recordSale,
      totalIncome, totalExpense, balance: totalIncome - totalExpense,
      todayIncome, todayExpense, monthIncome, monthExpense,
      isLoading,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
