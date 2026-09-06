import { randomUUID } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import { OAuth2Client } from "google-auth-library";
import { SignJWT, jwtVerify } from "jose";
import type { Express, Request, Response } from "express";

import { SESSION_TTL_MS, COOKIE_NAME } from "../../shared/const.js";
import { getUserByOpenId, upsertUser } from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const GOOGLE_AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_STATE_COOKIE = "mapa_oauth_state";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

type GoogleUser = { sub?: string; name?: string; email?: string };

const googleTokenClient = new OAuth2Client();

function query(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function googleOAuthClientId() {
  return ENV.googleWebClientId || ENV.googleClientId;
}

function isGoogleConfigured() {
  return Boolean(googleOAuthClientId() && ENV.googleClientSecret && ENV.googleRedirectUri && ENV.cookieSecret);
}

function allowedWebOrigins() {
  return new Set(
    [
      ...(ENV.isProduction ? [] : ["http://localhost:8081", "http://127.0.0.1:8081"]),
      process.env.EXPO_WEB_PREVIEW_URL,
      process.env.EXPO_WEB_URL,
      ...(process.env.CORS_ALLOWED_ORIGINS ?? "").split(","),
    ]
      .map((origin) => origin?.trim().replace(/\/$/, ""))
      .filter((origin): origin is string => Boolean(origin)),
  );
}

export function allowedReturnUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return allowedWebOrigins().has(url.origin);
  } catch {
    return false;
  }
}

async function signState(returnTo: string) {
  if (!allowedReturnUrl(returnTo)) throw new Error("OAuth return URL is not allowed");
  const nonce = randomUUID();
  const state = await new SignJWT({ returnTo, nonce })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("10m")
    .sign(new TextEncoder().encode(ENV.cookieSecret));
  return { state, nonce };
}

async function readState(req: Request, state: string) {
  const { payload } = await jwtVerify(
    state,
    new TextEncoder().encode(ENV.cookieSecret),
    { algorithms: ["HS256"] },
  );
  if (typeof payload.returnTo !== "string" || !allowedReturnUrl(payload.returnTo)) {
    throw new Error("OAuth return URL is not allowed");
  }
  const cookies = parseCookieHeader(req.headers.cookie ?? "");
  if (typeof payload.nonce !== "string" || cookies[OAUTH_STATE_COOKIE] !== payload.nonce) {
    throw new Error("OAuth state does not match the initiating browser");
  }
  return payload.returnTo;
}

async function exchangeCode(code: string) {
  const clientId = googleOAuthClientId();
  if (!clientId) throw new Error("Google web client ID is not configured");
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: ENV.googleClientSecret,
      redirect_uri: ENV.googleRedirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) throw new Error(`Google token exchange failed (${response.status})`);
  return (await response.json()) as { access_token?: string };
}

async function getGoogleUser(accessToken: string): Promise<GoogleUser> {
  if (!accessToken) throw new Error("Google did not return an access token");
  const response = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Google user info failed (${response.status})`);
  return (await response.json()) as GoogleUser;
}

async function syncGoogleUser(googleUser: GoogleUser) {
  if (!googleUser.sub || !googleUser.email) throw new Error("Google account has no stable identity or email");
  const openId = `google:${googleUser.sub}`;
  await upsertUser({
    openId,
    name: googleUser.name || googleUser.email,
    email: googleUser.email,
    loginMethod: "google",
    lastSignedIn: new Date(),
  });
  const user = await getUserByOpenId(openId);
  if (!user) throw new Error("Google user could not be saved");
  return user;
}

async function createGoogleSession(code: string) {
  const token = await exchangeCode(code);
  const googleUser = await getGoogleUser(token.access_token || "");
  const user = await syncGoogleUser(googleUser);
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Google user",
    expiresInMs: SESSION_TTL_MS,
    sessionVersion: user.sessionVersion,
  });
  return { sessionToken, user };
}

async function verifyNativeGoogleIdToken(idToken: string) {
  if (!ENV.googleWebClientId) throw new Error("GOOGLE_WEB_CLIENT_ID is not configured");

  const ticket = await googleTokenClient.verifyIdToken({
    idToken,
    audience: ENV.googleWebClientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error("Google ID token has no verified identity");
  }

  return syncGoogleUser({ sub: payload.sub, email: payload.email, name: payload.name });
}

function userResponse(user: Awaited<ReturnType<typeof getUserByOpenId>>) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    role: user?.role ?? "user",
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

function hasBearerToken(req: Request) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  return typeof authHeader === "string" && authHeader.startsWith("Bearer ");
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/auth/google/start", async (req: Request, res: Response) => {
    if (!isGoogleConfigured()) {
      res.status(503).json({ error: "Google OAuth is not configured. Check GOOGLE_* and JWT_SECRET." });
      return;
    }

    const returnTo = query(req, "returnTo") || process.env.EXPO_WEB_PREVIEW_URL || "http://localhost:8081";
    try {
      const { state, nonce } = await signState(returnTo);
      res.cookie(OAUTH_STATE_COOKIE, nonce, {
        ...getSessionCookieOptions(req),
        maxAge: OAUTH_STATE_TTL_MS,
      });
      const url = new URL(GOOGLE_AUTHORIZE_URL);
      url.search = new URLSearchParams({
        client_id: googleOAuthClientId(),
        redirect_uri: ENV.googleRedirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      }).toString();
      res.redirect(302, url.toString());
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid OAuth configuration" });
    }
  });

  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = query(req, "code");
    const state = query(req, "state");
    if (query(req, "error")) {
      res.status(401).send("Login Google cancelado.");
      return;
    }
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const returnTo = await readState(req, state);
      const { sessionToken } = await createGoogleSession(code);
      res.clearCookie(OAUTH_STATE_COOKIE, getSessionCookieOptions(req));
      res.cookie(COOKIE_NAME, sessionToken, {
        ...getSessionCookieOptions(req),
        maxAge: SESSION_TTL_MS,
      });
      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      res.status(500).json({ error: "Não foi possível concluir o login Google." });
    }
  });

  app.post("/api/auth/google/native", async (req: Request, res: Response) => {
    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : undefined;
    if (!idToken || idToken.length > 8192) {
      res.status(400).json({ error: "idToken is required" });
      return;
    }
    if (!ENV.googleWebClientId || !ENV.cookieSecret) {
      res.status(503).json({ error: "Google native authentication is not configured" });
      return;
    }

    try {
      const user = await verifyNativeGoogleIdToken(idToken);
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || user.email || "Google user",
        expiresInMs: SESSION_TTL_MS,
        sessionVersion: user.sessionVersion,
      });
      res.json({ app_session_id: sessionToken, user: userResponse(user) });
    } catch (error) {
      console.error("[Google OAuth] Native token verification failed", error instanceof Error ? error.message : "unknown error");
      res.status(401).json({ error: "Não foi possível validar a conta Google." });
    }
  });

  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    try {
      await sdk.revokeRequest(req);
      res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
      res.json({ success: true });
    } catch (error) {
      if (hasBearerToken(req)) {
        res.status(503).json({ error: "Não foi possível revogar a sessão. Tente novamente." });
        return;
      }
      res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(req), maxAge: -1 });
      res.json({ success: true });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      res.json({ user: userResponse(await sdk.authenticateRequest(req)) });
    } catch {
      res.status(401).json({ error: "Not authenticated", user: null });
    }
  });
}
