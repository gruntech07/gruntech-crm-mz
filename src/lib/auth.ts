import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "SALES_MANAGER" | "PROJECT_MANAGER" | "SALES_REP";
};

const COOKIE_NAME = "gruntechcrm_token";

export function signAuthToken(user: SessionUser) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tanımlı değil.");
  }

  return jwt.sign(user, secret, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): SessionUser | null {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET tanımlı değil.");
    }

    return jwt.verify(token, secret) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  return verifyAuthToken(token);
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;