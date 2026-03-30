import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db/prisma";

export const AUTH_COOKIE_NAME = "auth_token";

type AuthTokenPayload = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export function signAuthToken(payload: AuthTokenPayload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET tanımlı değil.");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET tanımlı değil.");
    }

    return jwt.verify(token, secret) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) return null;

    const payload = verifyAuthToken(token);

    if (!payload?.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) return null;

    return user;
  } catch (err) {
    console.error("getCurrentUser error:", err);
    return null;
  }
}