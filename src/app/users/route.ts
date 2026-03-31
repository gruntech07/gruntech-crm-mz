import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function normalizeRole(role: string): UserRole | null {
  const value = String(role || "").trim().toUpperCase();

  switch (value) {
    case "ADMIN":
      return UserRole.ADMIN;
    case "TEAM_LEAD":
      return UserRole.SALES_MANAGER;
    case "SALES_MANAGER":
      return UserRole.SALES_MANAGER;
    case "PROJECT_MANAGER":
      return UserRole.PROJECT_MANAGER;
    case "SALES_REP":
      return UserRole.SALES_REP;
    default:
      return null;
  }
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("GET /users error:", error);
    return NextResponse.json({ message: "Kullanıcılar alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const body = await req.json();

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const role = normalizeRole(String(body?.role || ""));

    if (!name) {
      return NextResponse.json({ message: "Ad zorunludur." }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ message: "E-posta zorunludur." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ message: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ message: "Geçersiz kullanıcı rolü." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ message: "Bu e-posta ile kayıtlı kullanıcı zaten var." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, message: "Kullanıcı oluşturuldu." }, { status: 201 });
  } catch (error) {
    console.error("POST /users error:", error);
    return NextResponse.json({ message: "Kullanıcı oluşturulamadı." }, { status: 500 });
  }
}