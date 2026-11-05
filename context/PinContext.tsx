import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

const PIN_KEY = "bizpilot_pin_hash";
const AUTO_LOCK_MS = 3 * 60 * 1000;
export const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000;

function hashPin(pin: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < pin.length; i++) {
    h ^= pin.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16) + "_" + pin.length;
}

async function storePin(pin: string) {
  if (Platform.OS === "web") {
    localStorage.setItem(PIN_KEY, hashPin(pin));
    return;
  }
  await SecureStore.setItemAsync(PIN_KEY, hashPin(pin));
}

async function loadStoredHash(): Promise<string | null> {
  if (Platform.OS === "web") return localStorage.getItem(PIN_KEY);
  return SecureStore.getItemAsync(PIN_KEY);
}

async function deletePin() {
  if (Platform.OS === "web") { localStorage.removeItem(PIN_KEY); return; }
  await SecureStore.deleteItemAsync(PIN_KEY);
}

interface PinContextValue {
  pinEnabled: boolean;
  isLocked: boolean;
  hasBiometrics: boolean;
  failedAttempts: number;
  lockedOutUntil: number | null;
  unlock: (pin: string) => boolean;
  unlockBiometric: () => Promise<boolean>;
  setNewPin: (pin: string) => Promise<void>;
  disablePin: (currentPin: string) => boolean;
  lock: () => void;
  verifyPin: (pin: string) => boolean;
}

const PinContext = createContext<PinContextValue | null>(null);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [storedHash, setStoredHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [ready, setReady] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedOutUntil, setLockedOutUntil] = useState<number | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bgTimeRef = useRef<number | null>(null);

  useEffect(() => {
    (async () => {
      const hash = await loadStoredHash();
      setStoredHash(hash);
      if (hash) setIsLocked(true);
      if (Platform.OS !== "web") {
        const bio = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(bio && enrolled);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storedHash) return;
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        bgTimeRef.current = Date.now();
      } else if (state === "active") {
        if (bgTimeRef.current && Date.now() - bgTimeRef.current > AUTO_LOCK_MS) {
          setIsLocked(true);
        }
        bgTimeRef.current = null;
      }
    });
    return () => sub.remove();
  }, [storedHash]);

  const verifyPin = useCallback((pin: string): boolean => {
    if (!storedHash) return false;
    return hashPin(pin) === storedHash;
  }, [storedHash]);

  const unlock = useCallback((pin: string): boolean => {
    if (lockedOutUntil && Date.now() < lockedOutUntil) return false;

    if (verifyPin(pin)) {
      setFailedAttempts(0);
      setLockedOutUntil(null);
      setIsLocked(false);
      return true;
    }

    const newAttempts = failedAttempts + 1;
    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      setLockedOutUntil(Date.now() + LOCKOUT_MS);
      setFailedAttempts(0);
    } else {
      setFailedAttempts(newAttempts);
    }
    return false;
  }, [verifyPin, failedAttempts, lockedOutUntil]);

  const unlockBiometric = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "web") return false;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "BizPilot আনলক করুন",
      cancelLabel: "বাতিল",
      fallbackLabel: "পিন ব্যবহার করুন",
    });
    if (result.success) {
      setFailedAttempts(0);
      setLockedOutUntil(null);
      setIsLocked(false);
      return true;
    }
    return false;
  }, []);

  const setNewPin = useCallback(async (pin: string) => {
    await storePin(pin);
    const hash = await loadStoredHash();
    setStoredHash(hash);
    setFailedAttempts(0);
    setLockedOutUntil(null);
    setIsLocked(false);
  }, []);

  const disablePin = useCallback((currentPin: string): boolean => {
    if (!verifyPin(currentPin)) return false;
    deletePin();
    setStoredHash(null);
    setIsLocked(false);
    setFailedAttempts(0);
    setLockedOutUntil(null);
    return true;
  }, [verifyPin]);

  const lock = useCallback(() => {
    if (storedHash) setIsLocked(true);
  }, [storedHash]);

  if (!ready) return null;

  return (
    <PinContext.Provider value={{
      pinEnabled: !!storedHash,
      isLocked: !!storedHash && isLocked,
      hasBiometrics,
      failedAttempts,
      lockedOutUntil,
      unlock,
      unlockBiometric,
      setNewPin,
      disablePin,
      lock,
      verifyPin,
    }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePin must be used within PinProvider");
  return ctx;
}
