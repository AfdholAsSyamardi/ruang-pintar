import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "ruangpintar_session";

const secretKey = process.env.SESSION_SECRET || "ruangpintar-rahasia-super-aman-2026";
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function decrypt(input) {
  if (!input) return null;
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
