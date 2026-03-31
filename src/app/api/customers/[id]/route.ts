import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth";

function toDate(value: unknown) {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}
function toNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str ? str : null;
}
function toPrismaStatus(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "contacted": return "CONTACTED";
    case "qualified": return "QUALIFIED";
    case "proposal": return "PROPOSAL";
    case "negotiation": return "NEGOTIATION";
    case "closed_won":
    case "won": return "WON";
    case "closed_lost":
    case "lost": return "LOST";
    case "new": return "NEW";
    default: return undefined;
  }
}
function toPrismaProbability(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "high": return "HIGH";
    case "low": return "LOW";
    case "none": return "LOW";
    case "medium": return "MEDIUM";
    default: return undefined;
  }
}
function toPrismaSource(value: unknown) {
  switch (String(value || "").toLowerCase()) {
    case "website": return "WEBSITE";
    case "referral": return "REFERRAL";
    case "cold_call":
    case "phone": return "PHONE";
    case "email": return "EMAIL";
    case "social_media": return "SOCIAL_MEDIA";
    case "event":
    case "walk_in": return "WALK_IN";
    case "other": return "OTHER";
    default: return undefined;
  }
}

async function canAccessCustomer(userId: string, role: string, customerId: string) {
  if (role === "ADMIN") return true;
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { assignedToId: true, createdById: true, teamLeadId: true, visibilityScope: true, visibilityUserIds: true },
  });
  if (!customer) return false;
  if (customer.createdById === userId) return true;
  if (customer.visibilityScope === "public") return true;
  if (customer.visibilityScope === "restricted") return customer.visibilityUserIds.includes(userId);
  if (customer.visibilityScope === "admin_only") return false;
  if (customer.visibilityScope === "team_lead_only") return role === "SALES_MANAGER" || role === "PROJECT_MANAGER";
  if (role === "SALES_REP") return customer.assignedToId === userId;
  return customer.teamLeadId === userId || customer.assignedToId === userId;
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    const { id } = await context.params;
    if (!(await canAccessCustomer(currentUser.id, currentUser.role, id))) {
      return NextResponse.json({ message: "Bu müşteriye erişim yok" }, { status: 403 });
    }
    const body = await req.json();
    const data: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => { if (value !== undefined) data[key] = value; };

    if ("roofSuitable" in body) assign("roofSuitable", body.roofSuitable ?? null);
    if ("roofAreaM2" in body) assign("roofAreaM2", body.roofAreaM2 ?? null);
    if ("transformerPowerKva" in body) assign("transformerPowerKva", body.transformerPowerKva ?? null);
    if ("contractPowerKw" in body) assign("contractPowerKw", body.contractPowerKw ?? null);
    if ("monthlyConsumptionKwh" in body) assign("monthlyConsumptionKwh", body.monthlyConsumptionKwh ?? null);
    if ("monthlyBillTl" in body) assign("monthlyBillTl", body.monthlyBillTl ?? null);
    if ("wantsBackupPower" in body) assign("wantsBackupPower", body.wantsBackupPower ?? null);
    if ("batteryRequested" in body) assign("batteryRequested", body.batteryRequested ?? null);
    if ("hasCriticalLoads" in body) assign("hasCriticalLoads", body.hasCriticalLoads ?? null);
    if ("criticalLoadsDescription" in body) assign("criticalLoadsDescription", body.criticalLoadsDescription ?? null);
    if ("hybridInverterPreference" in body) assign("hybridInverterPreference", body.hybridInverterPreference ?? null);
    if ("wantsAlternativeProposal" in body) assign("wantsAlternativeProposal", body.wantsAlternativeProposal ?? null);
    if ("alternativeProposalNotes" in body) assign("alternativeProposalNotes", body.alternativeProposalNotes ?? null);
    if ("buildingPermit" in body) assign("buildingPermit", body.buildingPermit ?? null);
    if ("siteVisitPhotos" in body) assign("siteVisitPhotos", Array.isArray(body.siteVisitPhotos) ? body.siteVisitPhotos.filter(Boolean) : []);
    if ("visibilityScope" in body) assign("visibilityScope", body.visibilityScope ?? "assigned_only");
    if ("visibilityUserIds" in body) assign("visibilityUserIds", Array.isArray(body.visibilityUserIds) ? body.visibilityUserIds.filter(Boolean) : []);
    if ("name" in body) assign("name", toNullableString(body.name));
    if ("company" in body) assign("company", toNullableString(body.company));
    if ("phone" in body) assign("phone", toNullableString(body.phone));
    if ("email" in body) assign("email", toNullableString(body.email));
    if ("address" in body) assign("address", toNullableString(body.address));
    if ("probability" in body) assign("probability", toPrismaProbability(body.probability));
    if ("estimatedValue" in body) assign("estimatedValue", body.estimatedValue ?? null);
    if ("expectedCloseDate" in body) assign("expectedCloseDate", toDate(body.expectedCloseDate));
    if ("assignedToId" in body) assign("assignedToId", toNullableString(body.assignedToId));
    if ("teamLeadId" in body) assign("teamLeadId", toNullableString(body.teamLeadId));
    if ("status" in body) assign("status", toPrismaStatus(body.status));
    if ("source" in body) assign("source", toPrismaSource(body.source));
    if ("tags" in body) assign("tags", Array.isArray(body.tags) ? body.tags : []);
    if ("notes" in body) assign("notesText", body.notes ?? "");
    if ("lastContact" in body) assign("lastContact", toDate(body.lastContact));
    if ("lastContactNotes" in body) assign("lastContactNotes", body.lastContactNotes ?? "");

    const customer = await prisma.customer.update({ where: { id }, data });
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("PATCH /api/customers/[id] error", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Müşteri güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ message: "Yetkisiz erişim" }, { status: 401 });
    const { id } = await context.params;
    if (!(await canAccessCustomer(currentUser.id, currentUser.role, id))) {
      return NextResponse.json({ message: "Bu müşteriye erişim yok" }, { status: 403 });
    }
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/customers/[id] error", error);
    return NextResponse.json({ message: error instanceof Error ? error.message : "Müşteri silinemedi" }, { status: 500 });
  }
}
