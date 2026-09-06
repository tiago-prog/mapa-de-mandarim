import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";
import Constants from "expo-constants";
import { Platform } from "react-native";

import * as Api from "./api";
import * as Auth from "./auth";

const webClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  Constants.expoConfig?.extra?.googleWebClientId ??
  "";

export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS !== "android") {
    throw new Error("O login nativo do Google está configurado para Android.");
  }
  if (!webClientId) {
    throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não está configurado.");
  }

  GoogleSignin.configure({ webClientId });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type === "cancelled") throw new Error("Login Google cancelado.");

  const idToken = response.data.idToken;
  if (!idToken) throw new Error("O Google não retornou um ID token.");

  const result = await Api.exchangeGoogleIdToken(idToken);
  await Auth.setSessionToken(result.sessionToken);
  await Auth.setUserInfo({
    ...result.user,
    lastSignedIn: new Date(result.user.lastSignedIn),
  });
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: string }).code === statusCodes.SIGN_IN_CANCELLED;
}