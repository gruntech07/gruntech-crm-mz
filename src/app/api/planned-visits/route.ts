import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PlannedVisitStatus } from "@prisma/client";

function isManagerLike(role?: string | null) {
  if (!role) return false;
  return ["ADMIN", "SALES_MANAGER", "PROJECT_MANAGER"].includes(role);
}

function canSeeVisit(
  visit: {
    createdById: string;
    assignedToId: string | null;
    teamLeadId: string | null;
    visibilityScope: string | null;
    visibilityUserIds: string[] | null;
  },
  user: {
    id: string;
    role?: string | null;
  }
) {
  if (isManagerLike(user.role)) return true;
  if (visit.createdById === user.id) return true;
  if (visit.assignedToId === user.id) return true;
  if (visit.teamLeadId === user.id) return true;
  if (visit.visibilityUserIds?.includes(user.id)) return true;

  switch (visit.visibilityScope) {
    case "private":
      return visit.createdById === user.id;
    case "assigned_only":
      return visit.createdById === user.id || visit.assignedToId === user.id;
    case "team":
      return (
        visit.createdById === user.id ||
        visit.assignedToId === user.id ||
        visit.teamLeadId === user.id
      );
    case "custom":
      return (
        visit.createdById === user.id ||
        visit.visibilityUserIds?.includes(user.id) ||
        false
      );
    default:
      return (
        visit.createdById === user.id ||
        visit.assignedToId === user.id ||
        visit.teamLeadId === user.id
      );
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const q = searchParams.get("q");

    const visits = await prisma.plannedVisit.findMany({
      where: {
        ...(status ? { status: status as PlannedVisitStatus } : {}),
        ...(assignedToId ? { assignedToId } : {}),
        ...(q
          ? {
              OR: [
                { companyName: { contains: q, mode: "insensitive" } },
                { contactName: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { city: { contains: q, mode: "insensitive" } },
                { district: { contains: q, mode: "insensitive" } },
                { address: { contains: q, mode: "insensitive" } },
                { sector: { contains: q, mode: "insensitive" } },
                { locationNote: { contains: q, mode: "insensitive" } },
                { remoteNotes: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        teamLead: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: [{ plannedAt: "asc" }, { createdAt: "desc" }],
    });

    const filtered = visits.filter((visit) =>
      canSeeVisit(
        {
          createdById: visit.createdById,
          assignedToId: visit.assignedToId,
          teamLeadId: visit.teamLeadId,
          visibilityScope: visit.visibilityScope,
          visibilityUserIds: visit.visibilityUserIds,
        },
        currentUser
      )
    );

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("planned-visits GET error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Planlanan ziyaretler alınamadı.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : "";
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : null;
    const phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim()
        : null;
    const email =
      typeof body.email === "string" && body.email.trim()
        ? body.email.trim()
        : null;
    const city =
      typeof body.city === "string" && body.city.trim() ? body.city.trim() : null;
    const district =
      typeof body.district === "string" && body.district.trim()
        ? body.district.trim()
        : null;
    const address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : null;
    const sector =
      typeof body.sector === "string" && body.sector.trim()
        ? body.sector.trim()
        : null;
    const locationNote =
      typeof body.locationNote === "string" && body.locationNote.trim()
        ? body.locationNote.trim()
        : null;
    const remoteNotes =
      typeof body.remoteNotes === "string" && body.remoteNotes.trim()
        ? body.remoteNotes.trim()
        : null;

        const locationLink =
  typeof body.locationLink === "string" && body.locationLink.trim()
    ? body.locationLink.trim()
    : null;

    const assignedToId =
      typeof body.assignedToId === "string" && body.assignedToId.trim()
        ? body.assignedToId.trim()
        : null;

    const teamLeadId =
      typeof body.teamLeadId === "string" && body.teamLeadId.trim()
        ? body.teamLeadId.trim()
        : null;

    const visibilityScope =
      typeof body.visibilityScope === "string" && body.visibilityScope.trim()
        ? body.visibilityScope.trim()
        : "assigned_only";

    const visibilityUserIds = Array.isArray(body.visibilityUserIds)
      ? body.visibilityUserIds.filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
      : [];

    const plannedAtRaw =
      typeof body.plannedAt === "string" ? body.plannedAt : null;

    if (!companyName) {
      return NextResponse.json(
        { message: "Firma adı zorunludur." },
        { status: 400 }
      );
    }

    if (!plannedAtRaw) {
      return NextResponse.json(
        { message: "Planlanan ziyaret tarihi zorunludur." },
        { status: 400 }
      );
    }

    const plannedAt = new Date(plannedAtRaw);

    if (Number.isNaN(plannedAt.getTime())) {
      return NextResponse.json(
        { message: "Planlanan ziyaret tarihi geçersiz." },
        { status: 400 }
      );
    }

    const created = await prisma.plannedVisit.create({
      data: {
        companyName,
        contactName,
        phone,
        email,
        city,
        district,
        address,
        sector,
        locationNote,
        locationLink,
        remoteNotes,
        assignedToId,
        teamLeadId,
        createdById: currentUser.id,
        plannedAt,
        status: PlannedVisitStatus.PLANNED,
        visibilityScope,
        visibilityUserIds,
      },
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true },
        },
        teamLead: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        customer: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("planned-visits POST error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Planlanan ziyaret oluşturulamadı.",
      },
      { status: 500 }
    );
  }
}