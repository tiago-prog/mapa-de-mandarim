import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

// Keep the native scheme stable so the server can validate signed OAuth state.
const schemeFromBundleId = "manusmapamandarim";

const env = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: process.env.EXPO_PUBLIC_OAUTH_SCHEME ?? schemeFromBundleId,
};

export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it
  if (API_BASE_URL) {
    return API_BASE_URL.replace(/\/$/, "");
  }

  // On web, derive from current hostname by replacing port 8081 with 3000
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname, port } = window.location;
    // Pattern: 8081-sandboxid.region.domain -> 3000-sandboxid.region.domain
    const apiHostname = hostname.replace(/^8081-/, "3000-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
    // Local Expo preview runs on 8081 while the API server runs on 3000.
    if (port === "8081" || hostname === "localhost" || hostname === "127.0.0.1") {
      return `${protocol}//${hostname}:3000`;
    }
  }

  // Fallback to empty (will use relative URL)
  return "";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

/**
 * Get the redirect URI for OAuth callback.
 * - Web: uses API server callback endpoint
 * - Native: uses deep link scheme
 */
export const getRedirectUri = () => {
  if (ReactNative.Platform.OS === "web") {
    return `${getApiBaseUrl()}/api/auth/google/callback`;
  } else {
    return Linking.createURL("/oauth/callback", {
      scheme: env.deepLinkScheme,
    });
  }
};

export const getLoginUrl = () => {
  const returnTo = ReactNative.Platform.OS === "web" ? (typeof window !== "undefined" ? window.location.origin : "http://localhost:8081") : getRedirectUri();
  const url = new URL(`${getApiBaseUrl() || "http://localhost:3000"}/api/auth/google/start`);
  url.searchParams.set("returnTo", returnTo);

  return url.toString();
};

/**
 * Start OAuth login flow.
 *
 * On native platforms (iOS/Android), open the system browser directly so
 * the OAuth callback returns via deep link to the app.
 *
 * On web, this simply redirects to the login URL.
 *
 * @returns Always null, the callback is handled via deep link.
 */
export async function startOAuthLogin(): Promise<string | null> {
  const loginUrl = getLoginUrl();

  if (ReactNative.Platform.OS === "web") {
    // On web, just redirect
    if (typeof window !== "undefined") {
      window.location.href = loginUrl;
    }
    return null;
  }

  const supported = await Linking.canOpenURL(loginUrl);
  if (!supported) {
    console.warn("[OAuth] Cannot open login URL: URL scheme not supported");
    // 可考虑抛出错误或返回错误状态，让调用方处理
    return null;
  }

  try {
    await Linking.openURL(loginUrl);
  } catch (error) {
    console.error("[OAuth] Failed to open login URL:", error);
    // 可考虑抛出错误让调用方处理
  }

  // The OAuth callback will reopen the app via deep link.
  return null;
}
