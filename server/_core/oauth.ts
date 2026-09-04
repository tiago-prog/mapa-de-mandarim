import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import type { Express, Request, Response } from "express";
import { getUserByOpenId, upsertUser } from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { ENV } from "./env";
import { SignJWT, jwtVerify } from "jose";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

type GoogleUser = { sub?: string; name?: string; email?: string };

function query(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function isGoogleConfigured() {
  return Boolean(ENV.googleClientId && ENV.googleClientSecret && ENV.googleRedirectUri && ENV.cookieSecret);
}

function allowedReturnUrl(value: string) {
  if (value.startsWith("manus")) return true;
  try {
    const url = new URL(value);
    const allowed = new Set([
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      process.env.EXPO_WEB_PREVIEW_URL,
      process.env.EXPO_PUBLIC_API_BASE_URL,
    ].filter(Boolean));
    return allowed.has(url.origin);
  } catch {
    return false;
  }
}

async function signState(returnTo: string) {
  if (!allowedReturnUrl(returnTo)) throw new Error("OAuth return URL is not allowed");
  return new SignJWT({ returnTo })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(ENV.cookieSecret));
}

async function readState(state: string) {
  const { payload } = await jwtVerify(state, new TextEncoder().encode(ENV.cookieSecret), { algorithms: ["HS256"] });
  if (typeof payload.returnTo !== "string" || !allowedReturnUrl(payload.returnTo)) throw new Error("OAuth return URL is not allowed");
  return payload.returnTo;
}

async function exchangeCode(code: string) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: ENV.googleClientId, client_secret: ENV.googleClientSecret, redirect_uri: ENV.googleRedirectUri, grant_type: "authorization_code" }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed (${response.status})`);
  return (await response.json()) as { access_token?: string };
}

async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Google user info failed (${response.status})`);
  return (await response.json()) as GoogleUser;
}

async function syncGoogleUser(googleUser: GoogleUser) {
  if (!googleUser.sub || !googleUser.email) throw new Error("Google account has no stable identity or email");
  const openId = `google:${googleUser.sub}`;
  await upsertUser({ openId, name: googleUser.name || googleUser.email, email: googleUser.email, loginMethod: "google", lastSignedIn: new Date() });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Google user could not be saved");
  return user;
}

function userResponse(user: Awaited<ReturnType<typeof getUserByOpenId>>) {
  return { id: user?.id ?? null, openId: user?.openId ?? null, name: user?.name ?? null, email: user?.email ?? null, loginMethod: user?.loginMethod ?? null, lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString() };
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req: Request, res: Response) => {
    if (!isGoogleConfigured()) {
      res.status(503).json({ error: "Google OAuth is not configured. Check GOOGLE_* and JWT_SECRET." });
      return;
    }
    const returnTo = query(req, "returnTo") || process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";
    try {
      const state = await signState(returnTo);
      const url = new URL(GOOGLE_AUTHORIZE_URL);
      url.search = new URLSearchParams({ client_id: ENV.googleClientId, redirect_uri: ENV.googleRedirectUri, response_type: "code", scope: "openid email profile", state, prompt: "select_account" }).toString();
      res.redirect(302, url.toString());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid OAuth configuration" });
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = query(req, "code");
    const state = query(req, "state");
    if (query(req, "error")) { res.status(401).send("Login Google cancelado."); return; }
    if (!code || !state) { res.status(400).json({ error: "code and state are required" }); return; }
    try {
      const returnTo = await readState(state);
      const token = await exchangeCode(code);
      const googleUser = await getGoogleUser(token.access_token || "");
      const user = await syncGoogleUser(googleUser);
      const sessionToken = await sdk.createSessionToken(user.openId, { name: user.name || user.email || "Google user", expiresInMs: ONE_YEAR_MS });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error);
      res.status(500).json({ error: "Não foi possível concluir o login Google." });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
    res.json({ success: true });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      res.json({ user: userResponse(await sdk.authenticateRequest(req)) });
    } catch {
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
}
