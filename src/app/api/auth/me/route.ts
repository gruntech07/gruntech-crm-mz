import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Oturum bulunamadı.", user: null },
        { status: 401 }
      );
    }

    const payload = verifyAuthToken(token);

    if (!payload?.id) {
      return NextResponse.json(
        { message: "Geçersiz oturum.", user: null },
        { status: 401 }
      );
    }

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

    if (!user || !user.isActive) {
      return NextResponse.json(
        { message: "Kullanıcı bulunamadı veya pasif.", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/auth/me error:", error);
    return NextResponse.json(
      { message: "Oturum bilgisi alınamadı.", user: null },
      { status: 500 }
    );
  }
}