import { NextResponse } from "next/server";
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

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const updateData: {
      name?: string;
      role?: UserRole;
      isActive?: boolean;
    } = {};

    if (typeof body?.name === "string") {
      const trimmedName = body.name.trim();
      if (!trimmedName) {
        return NextResponse.json({ message: "Ad Soyad boş olamaz." }, { status: 400 });
      }
      updateData.name = trimmedName;
    }

    if (typeof body?.role === "string") {
      const normalizedRole = normalizeRole(body.role);
      if (!normalizedRole) {
        return NextResponse.json({ message: "Geçersiz kullanıcı rolü." }, { status: 400 });
      }
      updateData.role = normalizedRole;
    }

    if (typeof body?.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "Güncellenecek alan bulunamadı." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    return NextResponse.json({
      message: "Kullanıcı güncellendi.",
      user,
    });
  } catch (error) {
    console.error("PATCH /users/[id] error:", error);
    return NextResponse.json(
      { message: "Kullanıcı güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Bu işlem için yetkiniz yok." }, { status: 403 });
    }

    const { id } = await context.params;

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existingUser) {
      return NextResponse.json({ message: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      message: "Kullanıcı pasife alındı.",
    });
  } catch (error) {
    console.error("DELETE /users/[id] error:", error);
    return NextResponse.json(
      { message: "Kullanıcı pasife alınamadı." },
      { status: 500 }
    );
  }
}