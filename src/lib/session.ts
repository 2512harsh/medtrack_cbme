// Signed session cookie helpers. Built on the Web Crypto API (`crypto.subtle`)
// specifically because this needs to run in both the Node.js API routes AND
// the Edge middleware (proxy.ts) — Node's built-in `crypto` module isn't
// available in the Edge runtime, but `crypto.subtle` is a global in both.

export const SESSION_COOKIE_NAME = "medtrack_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  role: string;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return secret;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const body = base64UrlEncode(encoder.encode(JSON.stringify({ ...payload, expires })));
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return `${body}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify("HMAC", key, base64UrlDecode(signature).slice().buffer, encoder.encode(body));
    if (!valid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(body))) as SessionPayload & { expires: number };
    if (typeof payload.expires !== "number" || payload.expires < Date.now()) return null;

    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}
