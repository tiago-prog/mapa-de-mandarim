import Constants from "expo-constants";
import * as ReactNative from "react-native";

type ExpoExtra = {
  apiBaseUrl?: string;
};

function getExpoExtra(): ExpoExtra {
  return (Constants.expoConfig?.extra ?? {}) as ExpoExtra;
}

function normalizeApiBaseUrl(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return normalized.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function configuredApiBaseUrl(): string {
  return normalizeApiBaseUrl(
    process.env.EXPO_PUBLIC_API_BASE_URL ?? getExpoExtra().apiBaseUrl ?? "",
  );
}

export const API_BASE_URL = configuredApiBaseUrl();

export function getApiBaseUrl(): string {
  if (API_BASE_URL) return API_BASE_URL;

  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) return `${protocol}//${apiHostname}`;
    if (port === "8081" || hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }
  }

  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

export function getLoginUrl(): string {
  if (ReactNative.Platform.OS !== "web") {
    throw new Error("Use o Google Sign-In nativo fora da web.");
  }
  const returnTo = typeof window !== "undefined" ? window.location.origin : "http://localhost:8081";
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) throw new Error("Servidor da API não configurado para OAuth web.");
  const url = new URL(`${baseUrl}/api/auth/google/start`);
  url.searchParams.set("returnTo", returnTo);
  return url.toString();
}

export async function startOAuthLogin(): Promise<void> {
  if (ReactNative.Platform.OS !== "web") {
    throw new Error("Use o botão nativo do Google no Android ou iOS.");
  }
  if (typeof window === "undefined") throw new Error("OAuth web precisa de um navegador.");
  window.location.href = getLoginUrl();
}
