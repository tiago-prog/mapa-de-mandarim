export async function signInWithGoogle(): Promise<void> {
  throw new Error("O login nativo do Google só está disponível no Android.");
}

export function isGoogleSignInCancelled(_error: unknown): boolean {
  return false;
}
