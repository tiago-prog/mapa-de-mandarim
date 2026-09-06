import { describe, expect, it } from "vitest";

const { googleIosUrlScheme, requireAbsoluteHttpUrl } = require("./google-config.js") as {
  googleIosUrlScheme: (clientId: string) => string;
  requireAbsoluteHttpUrl: (value: string, variableName: string) => string;
};

describe("googleIosUrlScheme", () => {
  it("converts a full iOS client id to a reversed scheme", () => {
    expect(googleIosUrlScheme("1234567890-abc.apps.googleusercontent.com")).toBe(
      "com.googleusercontent.apps.1234567890-abc",
    );
  });

  it("accepts an already reversed scheme", () => {
    expect(googleIosUrlScheme("com.googleusercontent.apps.1234567890-abc")).toBe(
      "com.googleusercontent.apps.1234567890-abc",
    );
  });

  it("rejects malformed client ids", () => {
    expect(() => googleIosUrlScheme("not-a-google-client-id")).toThrow(
      "GOOGLE_IOS_CLIENT_ID must end with .apps.googleusercontent.com",
    );
  });
});

describe("requireAbsoluteHttpUrl", () => {
  it("normalizes a valid URL", () => {
    expect(requireAbsoluteHttpUrl("https://api.example.com/", "API_URL")).toBe(
      "https://api.example.com",
    );
  });

  it("rejects relative and unsupported URLs", () => {
    expect(() => requireAbsoluteHttpUrl("/api", "API_URL")).toThrow(
      "API_URL must be an absolute http(s) URL",
    );
    expect(() => requireAbsoluteHttpUrl("file:///tmp/api", "API_URL")).toThrow(
      "API_URL must use http or https",
    );
  });
});
