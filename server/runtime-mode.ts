export type RuntimeMode = "preview" | "persistent";

function configuredRuntimeMode(): RuntimeMode | null {
  const value = process.env.MAPA_RUNTIME_MODE;
  if (value === "preview" || value === "persistent") return value;
  return null;
}

export function isMemoryFallbackEnabled(): boolean {
  const mode = configuredRuntimeMode();
  if (mode) return mode === "preview";
  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL;
}

export function databaseRequiredError(): Error {
  return new Error("DATABASE_URL é obrigatória fora do modo preview");
}
