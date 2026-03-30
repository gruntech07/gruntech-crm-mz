"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  Activity,
  ActivityType,
  Customer,
  CustomerFormData,
  CustomerStatus,
} from "@/types";

export type CustomerTechnicalFormData = {
  roofSuitable?: string;
  roofAreaM2?: number | null;
  transformerPowerKva?: number | null;
  contractPowerKw?: number | null;
  monthlyConsumptionKwh?: number | null;
  monthlyBillTl?: number | null;
  wantsBackupPower?: boolean | null;
  batteryRequested?: boolean | null;
  hasCriticalLoads?: boolean | null;
  criticalLoadsDescription?: string;
  hybridInverterPreference?: string;
  wantsAlternativeProposal?: boolean | null;
  alternativeProposalNotes?: string;
};

type LegacyUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team_lead" | "sales_rep";
  teamId?: string;
  isActive: boolean;
} | null;

type ApiCustomer = Record<string, any>;

const emptyActivities: Activity[] = [];

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toNullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toNullableDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  return str ? str : null;
}

function normalizeStatus(value: unknown): Customer["status"] {
  const v = String(value || "").toLowerCase();

  if (
    v === "new" ||
    v === "contacted" ||
    v === "qualified" ||
    v === "proposal" ||
    v === "negotiation" ||
    v === "closed_won" ||
    v === "closed_lost"
  ) {
    return v;
  }

  switch (String(value || "").toUpperCase()) {
    case "NEW":
      return "new";
    case "CONTACTED":
      return "contacted";
    case "QUALIFIED":
      return "qualified";
    case "PROPOSAL":
      return "proposal";
    case "NEGOTIATION":
      return "negotiation";
    case "WON":
      return "closed_won";
    case "LOST":
      return "closed_lost";
    default:
      return "new";
  }
}

function normalizeProbability(value: unknown): Customer["probability"] {
  const v = String(value || "").toLowerCase();

  if (v === "high" || v === "medium" || v === "low" || v === "none") {
    return v;
  }

  switch (String(value || "").toUpperCase()) {
    case "HIGH":
      return "high";
    case "LOW":
      return "low";
    case "MEDIUM":
    default:
      return "medium";
  }
}

function normalizeSource(value: unknown): Customer["source"] {
  const v = String(value || "").toLowerCase();

  if (
    v === "referral" ||
    v === "cold_call" ||
    v === "social_media" ||
    v === "website" ||
    v === "email" ||
    v === "event" ||
    v === "other"
  ) {
    return v;
  }

  switch (String(value || "").toUpperCase()) {
    case "WEBSITE":
      return "website";
    case "REFERRAL":
      return "referral";
    case "PHONE":
      return "cold_call";
    case "EMAIL":
      return "email";
    case "SOCIAL_MEDIA":
      return "social_media";
    case "WALK_IN":
      return "event";
    case "OTHER":
    default:
      return "other";
  }
}

function normalizeActivityType(value: unknown): ActivityType {
  const v = String(value || "").toLowerCase();
  if (v === "note" || v === "call" || v === "meeting" || v === "task") return v;
  return "note";
}

function normalizeActivity(raw: Record<string, any>): Activity {
  return {
    id: String(raw.id),
    customerId: String(raw.customerId),
    type: normalizeActivityType(raw.type),
    description: raw.description || "",
    createdBy: raw.userId || raw.createdBy || raw.user?.id || "",
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString().slice(0, 10) : undefined,
    isCompleted: Boolean(raw.isCompleted),
  };
}

function normalizeCustomer(raw: ApiCustomer): Customer {
  return {
    id: String(raw.id),
    name: raw.name || "",
    company: raw.company ?? null,
    phone: raw.phone || "",
    email: raw.email ?? null,
    address: raw.address ?? null,
    probability: normalizeProbability(raw.probability),
    estimatedValue: raw.estimatedValue != null ? Number(raw.estimatedValue) : null,
    expectedCloseDate: raw.expectedCloseDate
      ? new Date(raw.expectedCloseDate).toISOString().slice(0, 10)
      : null,
    assignedTo: raw.assignedToId ?? raw.assignedTo ?? null,
    teamLeadId: raw.teamLeadId ?? null,
    createdBy: raw.createdById ?? raw.createdBy ?? null,
    status: normalizeStatus(raw.status),
    source: normalizeSource(raw.source),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    notes: raw.notesText ?? "",
    lastContact: raw.lastContact ? new Date(raw.lastContact).toISOString().slice(0, 10) : null,
    lastContactNotes: raw.lastContactNotes ?? "",
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),

    recordNo: raw.recordNo ?? null,
    recordDate: raw.recordDate ? new Date(raw.recordDate).toISOString().slice(0, 10) : null,
    city: raw.city ?? null,
    district: raw.district ?? null,
    facilityName: raw.facilityName ?? null,
    sector: raw.sector ?? null,
    contactName: raw.contactName ?? null,
    contactTitle: raw.contactTitle ?? null,
    hasWhatsapp: raw.hasWhatsapp ?? null,
    locationNote: raw.locationNote ?? null,
    firstContactChannel: raw.firstContactChannel?.toLowerCase?.() ?? null,
    referralSource: raw.referralSource ?? null,
    responsiblePerson: raw.responsiblePerson ?? null,
    facilityType: raw.facilityType ?? null,
    currentSituation: raw.currentSituation ?? null,
    needAnalysis: raw.needAnalysis ?? null,
    meetingSummary: raw.meetingSummary ?? null,
    roofSuitable: raw.roofSuitable?.toLowerCase?.() ?? null,
    roofAreaM2: raw.roofAreaM2 != null ? Number(raw.roofAreaM2) : null,
    transformerPowerKva: raw.transformerPowerKva != null ? Number(raw.transformerPowerKva) : null,
    contractPowerKw: raw.contractPowerKw != null ? Number(raw.contractPowerKw) : null,
    monthlyConsumptionKwh: raw.monthlyConsumptionKwh != null ? Number(raw.monthlyConsumptionKwh) : null,
    monthlyBillTl: raw.monthlyBillTl != null ? Number(raw.monthlyBillTl) : null,
    wantsBackupPower: raw.wantsBackupPower ?? null,
    batteryRequested: raw.batteryRequested ?? null,
    outageLoadsDescription: raw.outageLoadsDescription ?? null,
    hasCriticalLoads: raw.hasCriticalLoads ?? null,
    criticalLoadsDescription: raw.criticalLoadsDescription ?? null,
    hybridInverterPreference: raw.hybridInverterPreference?.toLowerCase?.() ?? null,
    wantsAlternativeProposal: raw.wantsAlternativeProposal ?? null,
    alternativeProposalNotes: raw.alternativeProposalNotes ?? null,
    requestedWorkType: raw.requestedWorkType?.toLowerCase?.() ?? null,
    proposalGiven: raw.proposalGiven ?? null,
    proposalDate: raw.proposalDate ? new Date(raw.proposalDate).toISOString().slice(0, 10) : null,
    proposalNo: raw.proposalNo ?? null,
    proposalAmountVatExcl: raw.proposalAmountVatExcl != null ? Number(raw.proposalAmountVatExcl) : null,
    proposalAmountVatIncl: raw.proposalAmountVatIncl != null ? Number(raw.proposalAmountVatIncl) : null,
    estimatedCost: raw.estimatedCost != null ? Number(raw.estimatedCost) : null,
    estimatedProfit: raw.estimatedProfit != null ? Number(raw.estimatedProfit) : null,
    estimatedProfitRate: raw.estimatedProfitRate != null ? Number(raw.estimatedProfitRate) : null,
    stage: raw.stage?.toLowerCase?.() ?? null,
    lastMeetingDate: raw.lastMeetingDate ? new Date(raw.lastMeetingDate).toISOString().slice(0, 10) : null,
    result: raw.result?.toLowerCase?.() ?? null,
    lostReason: raw.lostReason ?? null,
    competitor: raw.competitor ?? null,
    completedWork: raw.completedWork ?? null,
    contractValue: raw.contractValue != null ? Number(raw.contractValue) : null,
    actualCost: raw.actualCost != null ? Number(raw.actualCost) : null,
    actualProfit: raw.actualProfit != null ? Number(raw.actualProfit) : null,
    paymentStatus: raw.paymentStatus?.toLowerCase?.() ?? null,
    receivedPayment: raw.receivedPayment != null ? Number(raw.receivedPayment) : null,
    remainingReceivable: raw.remainingReceivable != null ? Number(raw.remainingReceivable) : null,
    jobStartDate: raw.jobStartDate ? new Date(raw.jobStartDate).toISOString().slice(0, 10) : null,
    jobEndDate: raw.jobEndDate ? new Date(raw.jobEndDate).toISOString().slice(0, 10) : null,
    invoiceIssued: raw.invoiceIssued ?? null,
    invoiceNo: raw.invoiceNo ?? null,
    maintenanceProposal: raw.maintenanceProposal ?? null,
    nextFollowUpDate: raw.nextFollowUpDate ? new Date(raw.nextFollowUpDate).toISOString().slice(0, 10) : null,
    priority: raw.priority?.toLowerCase?.() ?? null,
    statusNote: raw.statusNote ?? null,
    siteMediaNotes: raw.siteMediaNotes ?? null,
    fileLink: raw.fileLink ?? null,
  };
}

function buildCustomerPayload(
  formData: CustomerFormData,
  currentUser: LegacyUser
): Record<string, unknown> {
  return {
    name: toNullableString(formData.contactName || formData.name) || "",
    company: toNullableString(formData.company || formData.facilityName),
    phone: String(formData.phone || "").trim(),
    email: toNullableString(formData.email),
    address: toNullableString(formData.address),
    probability: String(formData.probability || "medium"),
    estimatedValue: toNullableNumber(formData.estimatedValue),
    expectedCloseDate: toNullableDate(formData.expectedCloseDate),
    assignedToId: toNullableString(formData.assignedTo) || currentUser?.id || null,
    teamLeadId: toNullableString(formData.teamLeadId),
    createdById: toNullableString(formData.createdBy) || currentUser?.id || null,
    status: String(formData.status || "new"),
    source: String(formData.source || "other"),
    tags: Array.isArray(formData.tags) ? formData.tags : [],
    notes: formData.notes || "",
    lastContact: toNullableDate(formData.lastContact),
    lastContactNotes: formData.lastContactNotes || "",
  };
}

function buildTechnicalPayload(formData: CustomerTechnicalFormData) {
  return {
    roofSuitable: toNullableString(formData.roofSuitable),
    roofAreaM2: toNullableNumber(formData.roofAreaM2),
    transformerPowerKva: toNullableNumber(formData.transformerPowerKva),
    contractPowerKw: toNullableNumber(formData.contractPowerKw),
    monthlyConsumptionKwh: toNullableNumber(formData.monthlyConsumptionKwh),
    monthlyBillTl: toNullableNumber(formData.monthlyBillTl),
    wantsBackupPower: formData.wantsBackupPower ?? null,
    batteryRequested: formData.batteryRequested ?? null,
    hasCriticalLoads: formData.hasCriticalLoads ?? null,
    criticalLoadsDescription: toNullableString(formData.criticalLoadsDescription),
    hybridInverterPreference: toNullableString(formData.hybridInverterPreference),
    wantsAlternativeProposal: formData.wantsAlternativeProposal ?? null,
    alternativeProposalNotes: toNullableString(formData.alternativeProposalNotes),
  };
}

async function parseJsonResponse(res: Response) {
  const text = await res.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text ? { message: text } : {};
  }
}

export function useCustomers(currentUser: LegacyUser) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activitiesByCustomer, setActivitiesByCustomer] = useState<Record<string, Activity[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteriler yüklenemedi");
      }

      const rows = Array.isArray(data?.customers) ? data.customers : [];
      const normalizedCustomers = rows.map(normalizeCustomer);
      setCustomers(normalizedCustomers);

      const nextActivities: Record<string, Activity[]> = {};
      for (const row of rows) {
        nextActivities[String(row.id)] = Array.isArray(row.activities)
          ? row.activities.map(normalizeActivity)
          : [];
      }
      setActivitiesByCustomer(nextActivities);
    } catch (error) {
      console.error("loadCustomers error", error);
      setCustomers([]);
      setActivitiesByCustomer({});
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCustomers([]);
      setActivitiesByCustomer({});
      setIsLoaded(true);
      return;
    }

    void loadCustomers();
  }, [currentUser, loadCustomers]);

  const addCustomer = useCallback(
    async (formData: CustomerFormData) => {
      const payload = buildCustomerPayload(formData, currentUser);

      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri eklenemedi");
      }

      await loadCustomers();
    },
    [currentUser, loadCustomers]
  );

  const updateCustomer = useCallback(
    async (customerId: string, formData: CustomerFormData) => {
      const payload = buildCustomerPayload(formData, currentUser);

      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri güncellenemedi");
      }

      await loadCustomers();
    },
    [currentUser, loadCustomers]
  );

  const updateCustomerTechnical = useCallback(
    async (customerId: string, formData: CustomerTechnicalFormData) => {
      const payload = buildTechnicalPayload(formData);

      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Teknik bilgiler güncellenemedi");
      }

      await loadCustomers();
    },
    [loadCustomers]
  );

  const deleteCustomer = useCallback(
    async (customerId: string) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri silinemedi");
      }

      await loadCustomers();
    },
    [loadCustomers]
  );

  const changeStatus = useCallback(
    async (customerId: string, newStatus: CustomerStatus) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Durum güncellenemedi");
      }

      await loadCustomers();
    },
    [loadCustomers]
  );

  const addActivity = useCallback(
    async (customerId: string, type: ActivityType, description: string, dueDate?: string) => {
      const res = await fetch(`/api/customers/${customerId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, description, dueDate }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Aktivite eklenemedi");
      }

      await loadCustomers();
    },
    [loadCustomers]
  );

  const addContactNote = useCallback(
    async (customerId: string, note: string, type: ActivityType = "note") => {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ note, type }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Not eklenemedi");
      }

      await loadCustomers();
    },
    [loadCustomers]
  );

  const completeActivity = useCallback(
    async (activityId: string) => {
      setActivitiesByCustomer((prev) => {
        const next: Record<string, Activity[]> = {};
        for (const [customerId, items] of Object.entries(prev)) {
          next[customerId] = items.map((item) =>
            item.id === activityId ? { ...item, isCompleted: true } : item
          );
        }
        return next;
      });
    },
    []
  );

  const getCustomerActivities = useCallback(
    (customerId: string) => activitiesByCustomer[customerId] || emptyActivities,
    [activitiesByCustomer]
  );

  const getPendingActivities = useCallback(() => {
    return Object.values(activitiesByCustomer)
      .flat()
      .filter((item) => !item.isCompleted && item.dueDate);
  }, [activitiesByCustomer]);

  const searchCustomers = useCallback(
    (query: string) => {
      const q = query.trim().toLowerCase();
      if (!q) return customers;

      return customers.filter((customer) => {
        const haystack = [
          customer.name,
          customer.contactName,
          customer.company,
          customer.facilityName,
          customer.phone,
          customer.email,
          customer.city,
          customer.district,
          customer.sector,
          customer.notes,
          ...(customer.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(q);
      });
    },
    [customers]
  );

  const getAllTags = useCallback(() => {
    return Array.from(new Set(customers.flatMap((customer) => customer.tags || []).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b, "tr"));
  }, [customers]);

  const getStatistics = useCallback(() => {
    const total = customers.length;

    const byStatus = {
      new: customers.filter((c) => c.status === "new").length,
      contacted: customers.filter((c) => c.status === "contacted").length,
      qualified: customers.filter((c) => c.status === "qualified").length,
      proposal: customers.filter((c) => c.status === "proposal").length,
      negotiation: customers.filter((c) => c.status === "negotiation").length,
      closed_won: customers.filter((c) => c.status === "closed_won").length,
      closed_lost: customers.filter((c) => c.status === "closed_lost").length,
    };

    const byProbability = {
      high: customers.filter((c) => c.probability === "high").length,
      medium: customers.filter((c) => c.probability === "medium").length,
      low: customers.filter((c) => c.probability === "low").length,
      none: customers.filter((c) => c.probability === "none").length,
    };

    const totalEstimatedValue = customers.reduce(
      (sum, c) => sum + (Number(c.estimatedValue) || 0),
      0
    );

    const weightedForecast = customers.reduce((sum, c) => {
      const value = Number(c.estimatedValue) || 0;
      const weight =
        c.probability === "high"
          ? 0.75
          : c.probability === "medium"
          ? 0.5
          : c.probability === "low"
          ? 0.25
          : 0;

      return sum + value * weight;
    }, 0);

    return {
      total,
      byStatus,
      byProbability,
      totalEstimatedValue,
      weightedForecast,
      monthlyNew: 0,
      monthlyClosed: 0,
      conversionRate: 0,
    };
  }, [customers]);

  return {
    customers,
    isLoaded,
    addCustomer,
    updateCustomer,
    updateCustomerTechnical,
    deleteCustomer,
    addContactNote,
    addActivity,
    completeActivity,
    getCustomerActivities,
    getPendingActivities,
    changeStatus,
    searchCustomers,
    getStatistics,
    getAllTags,
    reloadCustomers: loadCustomers,
  };
}