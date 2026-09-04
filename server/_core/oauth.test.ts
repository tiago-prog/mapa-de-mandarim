import { afterEach, describe, expect, it } from "vitest";

import { allowedReturnUrl } from "./oauth";

describe("OAuth return URL", () => {
  afterEach(() => {
    delete process.env.EXPO_MOBILE_REDIRECT_SCHEME;
    delete process.env.EXPO_WEB_PREVIEW_URL;
  });

  it("aceita o deep link nativo configurado", () => {
    process.env.EXPO_MOBILE_REDIRECT_SCHEME = "mapamandarim";
    expect(allowedReturnUrl("mapamandarim://oauth/callback")).toBe(true);
  });

  it("rejeita esquemas parecidos e origens desconhecidas", () => {
    process.env.EXPO_MOBILE_REDIRECT_SCHEME = "mapamandarim";
    expect(allowedReturnUrl("mapamandarim.evil://oauth/callback")).toBe(false);
    expect(allowedReturnUrl("https://evil.example/oauth/callback")).toBe(false);
  });

  it("aceita somente origens web explicitamente configuradas", () => {
    process.env.EXPO_WEB_PREVIEW_URL = "https://preview.example";
    expect(allowedReturnUrl("https://preview.example/oauth/callback")).toBe(true);
    expect(allowedReturnUrl("https://preview.example.evil/oauth/callback")).toBe(false);
  });
});
