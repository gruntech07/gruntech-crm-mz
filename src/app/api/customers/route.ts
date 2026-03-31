import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";

function mapStatus(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "contacted": return "CONTACTED";
    case "qualified": return "QUALIFIED";
    case "proposal": return "PROPOSAL";
    case "negotiation": return "NEGOTIATION";
    case "closed_won": return "WON";
    case "closed_lost": return "LOST";
    default: return "NEW";
  }
}
function mapProbability(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "low": return "LOW";
    case "high": return "HIGH";
    default: return "MEDIUM";
  }
}
function mapSource(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "website": return "WEBSITE";
    case "referral": return "REFERRAL";
    case "cold_call":
    case "phone": return "PHONE";
    case "email": return "EMAIL";
    case "social_media": return "SOCIAL_MEDIA";
    case "event":
    case "walk_in": return "WALK_IN";
    default: return "OTHER";
  }
}

function canViewCustomer(currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>, customer: {assignedToId:string; teamLeadId:string|null; createdById:string; visibilityScope:string; visibilityUserIds:string[]}) {
  if (currentUser.role === "ADMIN") return true;
  if (customer.createdById === currentUser.id) return true;
  if (customer.visibilityScope === "public") return true;
  if (customer.visibilityScope === "admin_only") return false;
  if (customer.visibilityScope === "team_lead_only") {
    return currentUser.role === "SALES_MANAGER" || currentUser.role === "PROJECT_MANAGER";
  }
  if (customer.visibilityScope === "restricted") {
    return customer.visibilityUserIds.includes(currentUser.id);
  }
  if (currentUser.role === "SALES_REP") {
    return customer.assignedToId === currentUser.id;
  }
  return customer.teamLeadId === currentUser.id || customer.assignedToId === currentUser.id;
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ message: "Oturum bulunamadı.", customers: [] }, { status: 401 });

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        notes: { include: { author: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
        activities: { include: { user: { select: { id: true, name: true, email: true } } }, orderBy: { createdAt: "desc" } },
      },
    });

    const filtered = customers.filter((customer) =>
      canViewCustomer(currentUser, {
        assignedToId: customer.assignedToId,
        teamLeadId: customer.teamLeadId,
        createdById: customer.createdById,
        visibilityScope: customer.visibilityScope,
        visibilityUserIds: customer.visibilityUserIds,
      })
    );

    return NextResponse.json({ customers: filtered }, { status: 200 });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json({ message: "Müşteriler alınamadı.", customers: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ message: "Oturum bulunamadı." }, { status: 401 });
    const body = await req.json();

    const customer = await prisma.customer.create({
      data: {
        name: String(body.name || "").trim(),
        company: body.company || null,
        phone: String(body.phone || "").trim(),
        email: body.email || null,
        address: body.address || null,
        probability: mapProbability(body.probability) as never,
        estimatedValue: body.estimatedValue ?? null,
        expectedCloseDate: body.expectedCloseDate ? new Date(body.expectedCloseDate) : null,
        assignedToId: body.assignedToId || currentUser.id,
        teamLeadId: body.teamLeadId || null,
        createdById: body.createdById || currentUser.id,
        status: mapStatus(body.status) as never,
        source: mapSource(body.source) as never,
        tags: Array.isArray(body.tags) ? body.tags : [],
        notesText: body.notes || "",
        lastContact: body.lastContact ? new Date(body.lastContact) : null,
        lastContactNotes: body.lastContactNotes || "",
        visibilityScope: body.visibilityScope || "assigned_only",
        visibilityUserIds: Array.isArray(body.visibilityUserIds) ? body.visibilityUserIds.filter(Boolean) : [],
      },
    });

    await prisma.activity.create({
      data: { customerId: customer.id, userId: currentUser.id, type: "CREATED", description: "Müşteri kaydı oluşturuldu." },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("POST /api/customers error:", error);
    return NextResponse.json({ message: "Müşteri oluşturulamadı." }, { status: 500 });
  }
}
