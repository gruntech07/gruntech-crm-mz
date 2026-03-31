import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  PlannedVisitStatus,
  CustomerStatus,
  SalesProbability,
} from "@prisma/client";

function isManagerLike(role?: string | null) {
  if (!role) return false;
  return ["ADMIN", "SALES_MANAGER", "PROJECT_MANAGER"].includes(role);
}

function canConvertVisit(
  visit: {
    createdById: string;
    assignedToId: string | null;
    teamLeadId: string | null;
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
  return false;
}

function toJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (typeof val === "bigint") return val.toString();
      return val;
    })
  );
}

const plannedVisitInclude = {
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
};

export async function POST(
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

    const visit = await prisma.plannedVisit.findUnique({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!visit) {
      return NextResponse.json(
        { message: "Planlanan ziyaret bulunamadı." },
        { status: 404 }
      );
    }

    const allowed = canConvertVisit(
      {
        createdById: visit.createdById,
        assignedToId: visit.assignedToId,
        teamLeadId: visit.teamLeadId,
        visibilityUserIds: visit.visibilityUserIds ?? [],
      },
      currentUser
    );

    if (!allowed) {
      return NextResponse.json(
        { message: "Bu kaydı müşteriye dönüştürme yetkiniz yok." },
        { status: 403 }
      );
    }

    if (visit.customerId || visit.customer) {
      return NextResponse.json(
        { message: "Bu planlanan ziyaret zaten müşteriye dönüştürülmüş." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const customerData = body?.customerData ?? {};

    const customerName =
      typeof customerData.name === "string" && customerData.name.trim()
        ? customerData.name.trim()
        : visit.contactName?.trim() || visit.companyName.trim();

    const customerCompany =
      typeof customerData.company === "string" && customerData.company.trim()
        ? customerData.company.trim()
        : visit.companyName.trim();

    const customerPhone =
      typeof customerData.phone === "string" && customerData.phone.trim()
        ? customerData.phone.trim()
        : visit.phone?.trim() || "-";

    const customerEmail =
      typeof customerData.email === "string"
        ? customerData.email.trim() || null
        : visit.email || null;

    const customerAddress =
      typeof customerData.address === "string"
        ? customerData.address.trim() || null
        : visit.address || null;

    const customerCity =
      typeof customerData.city === "string"
        ? customerData.city.trim() || null
        : visit.city || null;

    const customerDistrict =
      typeof customerData.district === "string"
        ? customerData.district.trim() || null
        : visit.district || null;

    const customerSector =
      typeof customerData.sector === "string"
        ? customerData.sector.trim() || null
        : visit.sector || null;

    const customerLocationNote =
      typeof customerData.locationNote === "string"
        ? customerData.locationNote.trim() || null
        : visit.locationNote || null;

    const notesText =
      typeof customerData.notesText === "string"
        ? customerData.notesText.trim()
        : [
            visit.remoteNotes ? `Uzaktan tespit notu: ${visit.remoteNotes}` : null,
            visit.visitNotes ? `Ziyaret notu: ${visit.visitNotes}` : null,
            visit.visitResult ? `Ziyaret sonucu: ${visit.visitResult}` : null,
            visit.contactName ? `Görüşülen kişi: ${visit.contactName}` : null,
            customerLocationNote ? `Konum notu: ${customerLocationNote}` : null,
          ]
            .filter(Boolean)
            .join("\n");

    const buildingPermit =
      typeof customerData.buildingPermit === "boolean"
        ? customerData.buildingPermit
        : visit.buildingPermit ?? null;

    const siteVisitPhotos = Array.isArray(customerData.siteVisitPhotos)
      ? customerData.siteVisitPhotos.filter(
          (item: unknown): item is string =>
            typeof item === "string" && item.trim().length > 0
        )
      : visit.visitPhotos ?? [];

    const visibilityScope = visit.visibilityScope || "assigned_only";
    const visibilityUserIds = visit.visibilityUserIds ?? [];
    const safeAssignedToId = visit.assignedToId || currentUser.id;

    const result = await prisma.$transaction(async (tx) => {
      const createdCustomer = await tx.customer.create({
        data: {
          name: customerName,
          company: customerCompany,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          city: customerCity,
          district: customerDistrict,
          sector: customerSector,
          assignedTo: {
            connect: { id: safeAssignedToId },
          },
          createdBy: {
            connect: { id: currentUser.id },
          },
          locationNote: customerLocationNote ?? null,
          buildingPermit: buildingPermit ?? null,
          siteVisitPhotos,
          visibilityScope,
          visibilityUserIds,
          status: CustomerStatus.NEW,
          probability: SalesProbability.MEDIUM,
          tags: [],
          estimatedValue: 0,
        },
        select: {
          id: true,
          name: true,
          company: true,
          phone: true,
          email: true,
          city: true,
          district: true,
          assignedToId: true,
          createdById: true,
          createdAt: true,
        },
      });

      const updatedVisit = await tx.plannedVisit.update({
        where: { id: visit.id },
        data: {
  status: PlannedVisitStatus.CONVERTED,
  customer: {
    connect: { id: createdCustomer.id },
  },
  visitResult: visit.visitResult || "Müşteriye dönüştürüldü",
  visitNotes: notesText || visit.visitNotes || null,
},
        include: plannedVisitInclude,
      });

      return {
        customer: createdCustomer,
        plannedVisit: updatedVisit,
      };
    });

    if (!result) {
      return NextResponse.json(
        { message: "Dönüştürme sonucu alınamadı." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      toJsonSafe({
        customer: result.customer,
        plannedVisit: result.plannedVisit,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("planned-visits/[id]/convert POST error:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Planlanan ziyaret müşteriye dönüştürülemedi.",
      },
      { status: 500 }
    );
  }
}