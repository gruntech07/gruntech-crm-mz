import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";

type Params = {
  params: Promise<{ id: string }>;
};

function mapActivityType(value: unknown) {
  const v = String(value || "").toUpperCase();
  const allowed = [
    "CREATED",
    "UPDATED",
    "NOTE_ADDED",
    "STATUS_CHANGED",
    "ASSIGNED",
    "CONTACTED",
    "NOTE",
    "CALL",
    "MEETING",
    "TASK",
  ];
  return allowed.includes(v) ? v : "TASK";
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    const { id } = await params;

    const activities = await prisma.activity.findMany({
      where: { customerId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error("GET /api/customers/[id]/activities error:", error);
    return NextResponse.json({ message: "Aktiviteler alınamadı." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const description = String(body.description || "").trim();
    if (!description) {
      return NextResponse.json({ message: "Açıklama zorunludur." }, { status: 400 });
    }

    const activity = await prisma.activity.create({
      data: {
        customerId: id,
        userId: currentUser.id,
        type: mapActivityType(body.type) as any,
        description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/activities error:", error);
    return NextResponse.json({ message: "Aktivite eklenemedi." }, { status: 500 });
  }
}