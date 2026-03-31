import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PlannedVisitStatus } from "@prisma/client";

function isManagerLike(role?: string | null) {
  if (!role) return false;
  return ["ADMIN", "SALES_MANAGER", "PROJECT_MANAGER"].includes(role);
}

async function getPlannedVisitOrNull(id: string) {
  return prisma.plannedVisit.findUnique({
    where: { id },
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
        },
      },
    },
  });
}

function canReadOrEditVisit(
  visit: {
    createdById: string;
    assignedToId: string | null;
    teamLeadId: string | null;
    visibilityScope: string;
    visibilityUserIds: string[];
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

  if (visit.visibilityScope === "private") {
    return visit.createdById === user.id;
  }

  if (visit.visibilityScope === "assigned_only") {
    return visit.createdById === user.id || visit.assignedToId === user.id;
  }

  if (visit.visibilityScope === "team") {
    return (
      visit.createdById === user.id ||
      visit.assignedToId === user.id ||
      visit.teamLeadId === user.id
    );
  }

  if (visit.visibilityScope === "custom") {
    return (
      visit.createdById === user.id ||
      visit.visibilityUserIds?.includes(user.id)
    );
  }

  return false;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const visit = await getPlannedVisitOrNull(id);

    if (!visit) {
      return NextResponse.json(
        { message: "Planlanan ziyaret bulunamadı." },
        { status: 404 }
      );
    }

    const allowed = canReadOrEditVisit(
      {
        createdById: visit.createdById,
        assignedToId: visit.assignedToId,
        teamLeadId: visit.teamLeadId,
        visibilityScope: visit.visibilityScope,
        visibilityUserIds: visit.visibilityUserIds,
      },
      currentUser
    );

    if (!allowed) {
      return NextResponse.json({ message: "Yetkisiz erişim." }, { status: 403 });
    }

    return NextResponse.json(visit);
  } catch (error) {
    console.error("planned-visits/[id] GET error:", error);
    return NextResponse.json(
      { message: "Planlanan ziyaret detayı alınamadı." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existing = await getPlannedVisitOrNull(id);

    if (!existing) {
      return NextResponse.json(
        { message: "Planlanan ziyaret bulunamadı." },
        { status: 404 }
      );
    }

    const allowed = canReadOrEditVisit(
      {
        createdById: existing.createdById,
        assignedToId: existing.assignedToId,
        teamLeadId: existing.teamLeadId,
        visibilityScope: existing.visibilityScope,
        visibilityUserIds: existing.visibilityUserIds,
      },
      currentUser
    );

    if (!allowed) {
      return NextResponse.json({ message: "Yetkisiz işlem." }, { status: 403 });
    }

    const body = await req.json();

    const data: Record<string, unknown> = {};

    if (typeof body.companyName === "string") {
      const companyName = body.companyName.trim();
      if (!companyName) {
        return NextResponse.json(
          { message: "Firma adı boş olamaz." },
          { status: 400 }
        );
      }
      data.companyName = companyName;
    }

    if (typeof body.contactName === "string" || body.contactName === null) {
      data.contactName =
        typeof body.contactName === "string" ? body.contactName.trim() : null;
    }

    if (typeof body.phone === "string" || body.phone === null) {
      data.phone = typeof body.phone === "string" ? body.phone.trim() : null;
    }

    if (typeof body.email === "string" || body.email === null) {
      data.email = typeof body.email === "string" ? body.email.trim() : null;
    }

    if (typeof body.city === "string" || body.city === null) {
      data.city = typeof body.city === "string" ? body.city.trim() : null;
    }

    if (typeof body.district === "string" || body.district === null) {
      data.district =
        typeof body.district === "string" ? body.district.trim() : null;
    }

    if (typeof body.address === "string" || body.address === null) {
      data.address =
        typeof body.address === "string" ? body.address.trim() : null;
    }

    if (typeof body.sector === "string" || body.sector === null) {
      data.sector = typeof body.sector === "string" ? body.sector.trim() : null;
    }

    if (typeof body.locationNote === "string" || body.locationNote === null) {
      data.locationNote =
        typeof body.locationNote === "string"
          ? body.locationNote.trim()
          : null;
    }

    if (typeof body.remoteNotes === "string" || body.remoteNotes === null) {
      data.remoteNotes =
        typeof body.remoteNotes === "string"
          ? body.remoteNotes.trim()
          : null;
    }

    if (typeof body.visitNotes === "string" || body.visitNotes === null) {
      data.visitNotes =
        typeof body.visitNotes === "string" ? body.visitNotes.trim() : null;
    }

    if (typeof body.visitResult === "string" || body.visitResult === null) {
      data.visitResult =
        typeof body.visitResult === "string" ? body.visitResult.trim() : null;
    }

    if (typeof body.buildingPermit === "boolean" || body.buildingPermit === null) {
      data.buildingPermit = body.buildingPermit;
    }

    if (Array.isArray(body.visitPhotos)) {
      data.visitPhotos = body.visitPhotos.filter(
        (item: unknown): item is string =>
          typeof item === "string" && item.trim().length > 0
      );
    }

    if (typeof body.assignedToId === "string" || body.assignedToId === null) {
      data.assignedToId =
        typeof body.assignedToId === "string" && body.assignedToId.trim()
          ? body.assignedToId.trim()
          : null;
    }

    if (typeof body.teamLeadId === "string" || body.teamLeadId === null) {
      data.teamLeadId =
        typeof body.teamLeadId === "string" && body.teamLeadId.trim()
          ? body.teamLeadId.trim()
          : null;
    }

    if (typeof body.visibilityScope === "string") {
      data.visibilityScope = body.visibilityScope.trim() || "assigned_only";
    }

    if (Array.isArray(body.visibilityUserIds)) {
      data.visibilityUserIds = body.visibilityUserIds.filter(
        (item: unknown): item is string =>
          typeof item === "string" && item.trim().length > 0
      );
    }

    if (typeof body.plannedAt === "string") {
      const plannedAt = new Date(body.plannedAt);
      if (Number.isNaN(plannedAt.getTime())) {
        return NextResponse.json(
          { message: "Planlanan ziyaret tarihi geçersiz." },
          { status: 400 }
        );
      }
      data.plannedAt = plannedAt;
    }

if (typeof body.status === "string") {
  const allowedStatuses = Object.values(PlannedVisitStatus);
  if (!allowedStatuses.includes(body.status as PlannedVisitStatus)) {
    return NextResponse.json(
      { message: "Geçersiz ziyaret durumu." },
      { status: 400 }
    );
  }

  data.status = body.status;

  if (body.status === PlannedVisitStatus.VISITED) {
    data.visitedAt = new Date();
  }

  if (body.status !== PlannedVisitStatus.VISITED) {
    data.visitedAt = null;
  }
}

    const updated = await prisma.plannedVisit.update({
      where: { id },
      data,
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
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("planned-visits/[id] PATCH error:", error);
    return NextResponse.json(
      { message: "Planlanan ziyaret güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { message: "Oturum bulunamadı." },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existing = await getPlannedVisitOrNull(id);

    if (!existing) {
      return NextResponse.json(
        { message: "Planlanan ziyaret bulunamadı." },
        { status: 404 }
      );
    }

    const canDelete =
      isManagerLike(currentUser.role) || existing.createdById === currentUser.id;

    if (!canDelete) {
      return NextResponse.json(
        { message: "Bu kaydı silme yetkiniz yok." },
        { status: 403 }
      );
    }

    await prisma.plannedVisit.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("planned-visits/[id] DELETE error:", error);
    return NextResponse.json(
      { message: "Planlanan ziyaret silinemedi." },
      { status: 500 }
    );
  }
}