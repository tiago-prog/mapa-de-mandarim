const GOOGLE_CLIENT_ID_SUFFIX = ".apps.googleusercontent.com";

function googleIosUrlScheme(clientId) {
  const normalized = clientId.trim();
  if (!normalized) {
    throw new Error("GOOGLE_IOS_CLIENT_ID is required for iOS builds");
  }

  if (normalized.startsWith("com.googleusercontent.apps.")) {
    return normalized;
  }

  if (!normalized.endsWith(GOOGLE_CLIENT_ID_SUFFIX)) {
    throw new Error("GOOGLE_IOS_CLIENT_ID must end with .apps.googleusercontent.com");
  }

  const clientKey = normalized.slice(0, -GOOGLE_CLIENT_ID_SUFFIX.length);
  if (!clientKey) {
    throw new Error("GOOGLE_IOS_CLIENT_ID has an invalid client key");
  }

  return `com.googleusercontent.apps.${clientKey}`;
}

function requireAbsoluteHttpUrl(value, variableName) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${variableName} is required`);
  }

  let url;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error(`${variableName} must be an absolute http(s) URL`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${variableName} must use http or https`);
  }

  return normalized.replace(/\/$/, "");
}

module.exports = { googleIosUrlScheme, requireAbsoluteHttpUrl };
