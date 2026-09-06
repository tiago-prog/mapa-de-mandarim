import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { Platform } from "react-native";

import * as Api from "./api";
import * as Auth from "./auth";

function getPublicConfig() {
  const extra = Constants.expoConfig?.extra as
    | { googleWebClientId?: string; googleIosClientId?: string }
    | undefined;
  return {
    webClientId:
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra?.googleWebClientId ?? "",
    iosClientId:
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra?.googleIosClientId ?? "",
  };
}

export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS !== "android" && Platform.OS !== "ios") {
    throw new Error("O login nativo do Google só está disponível no Android e no iOS.");
  }

  const { webClientId, iosClientId } = getPublicConfig();
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não está configurado.");
  }
  if (Platform.OS === "ios" && !iosClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID não está configurado.");
  }

  GoogleSignin.configure({
    webClientId,
    ...(Platform.OS === "ios" ? { iosClientId } : {}),
  });

  if (Platform.OS === "android") {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  }

  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") {
    throw new Error("Login Google cancelado.");
  }

  const idToken = response.data.idToken;
  if (!idToken) {
    throw new Error("O Google não retornou um ID token.");
  }

  const result = await Api.exchangeGoogleIdToken(idToken);
  await Auth.setSessionToken(result.sessionToken);
  await Auth.setUserInfo(Auth.normalizeUser(result.user));
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === statusCodes.SIGN_IN_CANCELLED
  );
}
