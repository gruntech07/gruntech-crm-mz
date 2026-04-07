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

async function canAccessCustomer(
  userId: string,
  role: string,
  customerId: string
) {
  if (role === "ADMIN") return true;

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      assignedToId: true,
      createdById: true,
      teamLeadId: true,
      visibilityScope: true,
      visibilityUserIds: true,
    },
  });

  if (!customer) return false;
  if (customer.createdById === userId) return true;
  if (customer.visibilityScope === "public") return true;
  if (customer.visibilityScope === "restricted") {
    return customer.visibilityUserIds.includes(userId);
  }
  if (customer.visibilityScope === "admin_only") return false;
  if (customer.visibilityScope === "team_lead_only") {
    return role === "SALES_MANAGER" || role === "PROJECT_MANAGER";
  }
  if (role === "SALES_REP") return customer.assignedToId === userId;

  return customer.teamLeadId === userId || customer.assignedToId === userId;
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!(await canAccessCustomer(currentUser.id, currentUser.role, id))) {
      return NextResponse.json(
        { message: "Bu müşteriye erişim yok." },
        { status: 403 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: { customerId: id },
      select: {
        id: true,
        customerId: true,
        userId: true,
        type: true,
        description: true,
        dueDate: true,
        isCompleted: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(
      { activities },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/customers/[id]/activities error:", error);
    return NextResponse.json(
      { message: "Aktiviteler alınamadı." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!(await canAccessCustomer(currentUser.id, currentUser.role, id))) {
      return NextResponse.json(
        { message: "Bu müşteriye erişim yok." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const description = String(body.description || "").trim();

    if (!description) {
      return NextResponse.json(
        { message: "Açıklama zorunludur." },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        customerId: id,
        userId: currentUser.id,
        type: mapActivityType(body.type) as never,
        description,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
      select: {
        id: true,
        customerId: true,
        userId: true,
        type: true,
        description: true,
        dueDate: true,
        isCompleted: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ activity }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/activities error:", error);
    return NextResponse.json(
      { message: "Aktivite eklenemedi." },
      { status: 500 }
    );
  }
}