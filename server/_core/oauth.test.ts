import { afterEach, describe, expect, it } from "vitest";

import { allowedReturnUrl } from "./oauth";

describe("OAuth return URL", () => {
  afterEach(() => {
    delete process.env.EXPO_WEB_PREVIEW_URL;
    delete process.env.EXPO_WEB_URL;
    delete process.env.CORS_ALLOWED_ORIGINS;
  });

  it("aceita somente origens web explicitamente configuradas", () => {
    process.env.EXPO_WEB_PREVIEW_URL = "https://preview.example";
    expect(allowedReturnUrl("https://preview.example/" )).toBe(true);
    expect(allowedReturnUrl("https://preview.example/lesson/1")).toBe(true);
  });

  it("aceita origens adicionais do CORS", () => {
    process.env.CORS_ALLOWED_ORIGINS = "https://app.example.com, https://admin.example.com";
    expect(allowedReturnUrl("https://app.example.com")).toBe(true);
    expect(allowedReturnUrl("https://admin.example.com/account")).toBe(true);
  });

  it("rejeita esquemas nativos, esquemas parecidos e origens desconhecidas", () => {
    process.env.EXPO_WEB_PREVIEW_URL = "https://preview.example";
    expect(allowedReturnUrl("manusmapamandarim://oauth/callback")).toBe(false);
    expect(allowedReturnUrl("manusmapamandarim.evil://oauth/callback")).toBe(false);
    expect(allowedReturnUrl("https://preview.example.evil/oauth/callback")).toBe(false);
    expect(allowedReturnUrl("javascript:alert(1)")).toBe(false);
  });
});
