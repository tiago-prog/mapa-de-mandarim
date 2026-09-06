import { Platform } from "react-native";

import { startOAuthLogin } from "@/constants/oauth";

export async function signInWithGoogle(): Promise<void> {
  if (Platform.OS !== "web") {
    throw new Error("Use o adaptador nativo para autenticação fora da web.");
  }
  await startOAuthLogin();
}

export function isGoogleSignInCancelled(_error: unknown): boolean {
  return false;
}
