import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  lastSignedIn: Date;
};

export function normalizeUser(value: unknown): User {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid user payload");
  }

  const candidate = value as Record<string, unknown>;
  const id = Number(candidate.id);
  const openId = typeof candidate.openId === "string" ? candidate.openId : "";
  const role = candidate.role === "admin" ? "admin" : "user";
  const lastSignedIn = new Date(String(candidate.lastSignedIn ?? ""));

  if (!Number.isInteger(id) || id < 0 || !openId || Number.isNaN(lastSignedIn.getTime())) {
    throw new Error("Invalid user payload");
  }

  return {
    id,
    openId,
    name: typeof candidate.name === "string" ? candidate.name : null,
    email: typeof candidate.email === "string" ? candidate.email : null,
    loginMethod: typeof candidate.loginMethod === "string" ? candidate.loginMethod : null,
    role,
    lastSignedIn,
  };
}

function isNative() {
  return Platform.OS !== "web";
}

export async function getSessionToken(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    return await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setSessionToken(token: string): Promise<void> {
  if (!token.trim()) throw new Error("Cannot store an empty session token");
  if (!isNative()) return;
  await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
}

export async function removeSessionToken(): Promise<void> {
  if (!isNative()) return;
  try {
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  } catch {
    // Local cleanup is best effort; the server session is handled separately.
  }
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const info = isNative()
      ? await SecureStore.getItemAsync(USER_INFO_KEY)
      : typeof window !== "undefined"
        ? window.localStorage.getItem(USER_INFO_KEY)
        : null;
    if (!info) return null;
    return normalizeUser(JSON.parse(info));
  } catch {
    await clearUserInfo();
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  const serialized = JSON.stringify(normalizeUser(user));
  if (isNative()) {
    await SecureStore.setItemAsync(USER_INFO_KEY, serialized);
    return;
  }
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_INFO_KEY, serialized);
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (isNative()) {
      await SecureStore.deleteItemAsync(USER_INFO_KEY);
    } else if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_INFO_KEY);
    }
  } catch {
    // Local cleanup is best effort.
  }
}
