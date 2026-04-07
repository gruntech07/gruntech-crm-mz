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
    "VISIT",
    "OFFER",
    "TECHNICAL",
  ];
  return allowed.includes(v) ? v : "NOTE";
}

function normalizeNoteType(value: unknown) {
  const v = String(value || "").trim().toLowerCase();
  const allowed = ["note", "call", "visit", "meeting", "offer", "technical"];
  return allowed.includes(v) ? v : "note";
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

    const notes = await prisma.customerNote.findMany({
      where: { customerId: id },
      select: {
        id: true,
        customerId: true,
        authorId: true,
        content: true,
        noteType: true,
        noteDate: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
      take: 100,
    });

    return NextResponse.json(
      { notes },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/customers/[id]/notes error:", error);
    return NextResponse.json(
      { message: "Notlar alınamadı." },
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

    const content = String(body.note || body.content || "").trim();
    if (!content) {
      return NextResponse.json(
        { message: "Not içeriği zorunludur." },
        { status: 400 }
      );
    }

    const noteType = normalizeNoteType(body.noteType);
    const noteDateRaw = body.noteDate ? new Date(body.noteDate) : null;
    const noteDate =
      noteDateRaw && !Number.isNaN(noteDateRaw.getTime())
        ? noteDateRaw
        : new Date();

    const note = await prisma.customerNote.create({
      data: {
        customerId: id,
        authorId: currentUser.id,
        content,
        noteType,
        noteDate,
      },
      select: {
        id: true,
        customerId: true,
        authorId: true,
        content: true,
        noteType: true,
        noteDate: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await prisma.activity.create({
      data: {
        customerId: id,
        userId: currentUser.id,
        type: mapActivityType(body.type || noteType) as never,
        description: content,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers/[id]/notes error:", error);
    return NextResponse.json(
      { message: "Not eklenemedi." },
      { status: 500 }
    );
  }
}