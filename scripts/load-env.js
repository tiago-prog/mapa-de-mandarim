/**
 * Load local environment files for Expo config.
 * System variables always win over .env.local and .env values.
 */
import fs from "fs";
import path from "path";

const root = process.cwd();
const fileValues = {};

for (const filename of [".env", ".env.local"]) {
  const envPath = path.resolve(root, filename);
  if (!fs.existsSync(envPath)) continue;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim().replace(/^['"]|['"]$/g, "");
    fileValues[key] = value;
  }
}

for (const [key, value] of Object.entries(fileValues)) {
  if (!process.env[key]) process.env[key] = value;
}

const mappings = {
  VITE_APP_ID: "EXPO_PUBLIC_APP_ID",
  VITE_OAUTH_PORTAL_URL: "EXPO_PUBLIC_OAUTH_PORTAL_URL",
  OAUTH_SERVER_URL: "EXPO_PUBLIC_OAUTH_SERVER_URL",
  OWNER_OPEN_ID: "EXPO_PUBLIC_OWNER_OPEN_ID",
  OWNER_NAME: "EXPO_PUBLIC_OWNER_NAME",
};

for (const [systemVar, expoVar] of Object.entries(mappings)) {
  if (process.env[systemVar] && !process.env[expoVar]) {
    process.env[expoVar] = process.env[systemVar];
  }
}
