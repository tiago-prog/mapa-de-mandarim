import { Platform } from "react-native";

import { getApiBaseUrl } from "@/constants/oauth";

import * as Auth from "./auth";
import { notifyUnauthorized } from "./auth-events";

type ApiResponse<T> = {
  user?: T;
  app_session_id?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getRequestUrl(endpoint: string): string {
  const baseUrl = getApiBaseUrl();
  if (Platform.OS !== "web" && !baseUrl) {
    throw new ApiError(
      "Servidor da API não configurado. Defina EXPO_PUBLIC_API_BASE_URL no build nativo.",
      0,
    );
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : cleanEndpoint;
}

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (Platform.OS !== "web") {
    const sessionToken = await Auth.getSessionToken();
    if (sessionToken) headers.Authorization = `Bearer ${sessionToken}`;
  }

  const response = await fetch(getRequestUrl(endpoint), {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) notifyUnauthorized();
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const errorJson = JSON.parse(errorText) as { error?: string; message?: string };
      errorMessage = errorJson.error || errorJson.message || errorText;
    } catch {
      // Keep the response text when the server did not return JSON.
    }
    throw new ApiError(errorMessage || `API call failed with status ${response.status}`, response.status);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function exchangeGoogleIdToken(idToken: string): Promise<{
  sessionToken: string;
  user: Auth.User;
}> {
  if (!idToken.trim()) throw new Error("O Google não retornou um ID token válido.");
  const result = await apiCall<ApiResponse<unknown>>("/api/auth/google/native", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
  if (!result.app_session_id || !result.user) {
    throw new Error("A API não retornou uma sessão válida.");
  }
  return {
    sessionToken: result.app_session_id,
    user: Auth.normalizeUser(result.user),
  };
}

export async function logout(): Promise<void> {
  await apiCall<void>("/api/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<Auth.User | null> {
  try {
    const result = await apiCall<{ user: unknown }>("/api/auth/me");
    return result.user ? Auth.normalizeUser(result.user) : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}
