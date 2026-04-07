"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  buildingPermit?: boolean | null;
  siteVisitPhotos?: string[];
};

type LegacyUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "team_lead" | "sales_rep";
  teamId?: string;
  isActive: boolean;
} | null;

type ApiCustomer = Record<string, unknown>;
type ApiActivity = Record<string, unknown>;
type ApiResponse = {
  message?: string;
  customers?: ApiCustomer[];
  customer?: ApiCustomer;
  activity?: ApiActivity;
  note?: Record<string, unknown>;
} & Record<string, unknown>;

const emptyActivities: Activity[] = [];

function asString(value: unknown): string {
  if (value == null) return "";
  return String(value);
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const str = String(value).trim();
  return str || null;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value == null) return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (["true", "1", "yes", "evet"].includes(lower)) return true;
    if (["false", "0", "no", "hayir", "hayır"].includes(lower)) return false;
  }
  if (typeof value === "number") return Boolean(value);
  return null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0
  );
}

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
    [
      "new",
      "contacted",
      "qualified",
      "proposal",
      "negotiation",
      "closed_won",
      "closed_lost",
    ].includes(v)
  ) {
    return v as Customer["status"];
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
  if (["high", "medium", "low", "none"].includes(v)) {
    return v as Customer["probability"];
  }

  switch (String(value || "").toUpperCase()) {
    case "HIGH":
      return "high";
    case "LOW":
      return "low";
    case "NONE":
      return "none";
    default:
      return "medium";
  }
}

function normalizeSource(value: unknown): Customer["source"] {
  const v = String(value || "").toLowerCase();

  if (
    [
      "referral",
      "cold_call",
      "social_media",
      "website",
      "email",
      "event",
      "other",
    ].includes(v)
  ) {
    return v as Customer["source"];
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
    default:
      return "other";
  }
}

function normalizeActivityType(value: unknown): ActivityType {
  const v = String(value || "").toLowerCase();
  if (v === "note" || v === "call" || v === "meeting" || v === "task") {
    return v;
  }
  return "note";
}

function normalizeActivity(raw: Record<string, unknown>): Activity {
  return {
    id: String(raw.id ?? ""),
    customerId: String(raw.customerId ?? ""),
    type: normalizeActivityType(raw.type),
    description: asString(raw.description),
    createdBy: asString(
      raw.createdBy ??
        raw.userId ??
        (typeof raw.user === "object" && raw.user
          ? (raw.user as Record<string, unknown>).id
          : undefined)
    ),
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : new Date().toISOString(),
    dueDate: raw.dueDate ? new Date(String(raw.dueDate)).toISOString() : undefined,
    isCompleted: Boolean(raw.isCompleted),
  };
}

function normalizeCustomer(raw: ApiCustomer): Customer {
  return {
    id: String(raw.id),
    name: asString(raw.name),
    company: asNullableString(raw.company),
    phone: asString(raw.phone),
    email: asNullableString(raw.email),
    address: asNullableString(raw.address),
    probability: normalizeProbability(raw.probability),
    estimatedValue: raw.estimatedValue != null ? Number(raw.estimatedValue) : null,
    expectedCloseDate: raw.expectedCloseDate
      ? new Date(String(raw.expectedCloseDate)).toISOString().slice(0, 10)
      : null,
    assignedTo: asString(raw.assignedToId ?? raw.assignedTo),
    teamLeadId: asNullableString(raw.teamLeadId),
    createdBy: asString(raw.createdById ?? raw.createdBy),
    status: normalizeStatus(raw.status),
    source: normalizeSource(raw.source),
    tags: asStringArray(raw.tags),
    notes: asString(raw.notesText ?? raw.notes),
    lastContact: raw.lastContact
      ? new Date(String(raw.lastContact)).toISOString().slice(0, 10)
      : null,
    lastContactNotes: asString(raw.lastContactNotes),
    createdAt: raw.createdAt
      ? new Date(String(raw.createdAt)).toISOString()
      : new Date().toISOString(),
    updatedAt: raw.updatedAt
      ? new Date(String(raw.updatedAt)).toISOString()
      : new Date().toISOString(),
    recordNo: asNullableString(raw.recordNo),
    recordDate: raw.recordDate
      ? new Date(String(raw.recordDate)).toISOString().slice(0, 10)
      : null,
    city: asNullableString(raw.city),
    district: asNullableString(raw.district),
    facilityName: asNullableString(raw.facilityName),
    sector: asNullableString(raw.sector),
    contactName: asNullableString(raw.contactName),
    contactTitle: asNullableString(raw.contactTitle),
    hasWhatsapp: asNullableBoolean(raw.hasWhatsapp),
    locationNote: asNullableString(raw.locationNote),
    firstContactChannel:
      asNullableString(raw.firstContactChannel)?.toLowerCase() ?? null,
    referralSource: asNullableString(raw.referralSource),
    responsiblePerson: asNullableString(raw.responsiblePerson),
    facilityType: asNullableString(raw.facilityType),
    currentSituation: asNullableString(raw.currentSituation),
    needAnalysis: asNullableString(raw.needAnalysis),
    meetingSummary: asNullableString(raw.meetingSummary),
    roofSuitable: asNullableString(raw.roofSuitable)?.toLowerCase() ?? null,
    roofAreaM2: raw.roofAreaM2 != null ? Number(raw.roofAreaM2) : null,
    transformerPowerKva:
      raw.transformerPowerKva != null ? Number(raw.transformerPowerKva) : null,
    contractPowerKw:
      raw.contractPowerKw != null ? Number(raw.contractPowerKw) : null,
    monthlyConsumptionKwh:
      raw.monthlyConsumptionKwh != null ? Number(raw.monthlyConsumptionKwh) : null,
    monthlyBillTl: raw.monthlyBillTl != null ? Number(raw.monthlyBillTl) : null,
    wantsBackupPower: asNullableBoolean(raw.wantsBackupPower),
    batteryRequested: asNullableBoolean(raw.batteryRequested),
    outageLoadsDescription: asNullableString(raw.outageLoadsDescription),
    hasCriticalLoads: asNullableBoolean(raw.hasCriticalLoads),
    criticalLoadsDescription: asNullableString(raw.criticalLoadsDescription),
    hybridInverterPreference:
      asNullableString(raw.hybridInverterPreference)?.toLowerCase() ?? null,
    wantsAlternativeProposal: asNullableBoolean(raw.wantsAlternativeProposal),
    alternativeProposalNotes: asNullableString(raw.alternativeProposalNotes),
    requestedWorkType:
      asNullableString(raw.requestedWorkType)?.toLowerCase() ?? null,
    proposalGiven: asNullableBoolean(raw.proposalGiven),
    proposalDate: raw.proposalDate
      ? new Date(String(raw.proposalDate)).toISOString().slice(0, 10)
      : null,
    proposalNo: asNullableString(raw.proposalNo),
    proposalAmountVatExcl:
      raw.proposalAmountVatExcl != null ? Number(raw.proposalAmountVatExcl) : null,
    proposalAmountVatIncl:
      raw.proposalAmountVatIncl != null ? Number(raw.proposalAmountVatIncl) : null,
    estimatedCost: raw.estimatedCost != null ? Number(raw.estimatedCost) : null,
    estimatedProfit:
      raw.estimatedProfit != null ? Number(raw.estimatedProfit) : null,
    estimatedProfitRate:
      raw.estimatedProfitRate != null ? Number(raw.estimatedProfitRate) : null,
    stage: asNullableString(raw.stage)?.toLowerCase() ?? null,
    lastMeetingDate: raw.lastMeetingDate
      ? new Date(String(raw.lastMeetingDate)).toISOString().slice(0, 10)
      : null,
    result: asNullableString(raw.result)?.toLowerCase() ?? null,
    lostReason: asNullableString(raw.lostReason),
    competitor: asNullableString(raw.competitor),
    completedWork: asNullableString(raw.completedWork),
    contractValue: raw.contractValue != null ? Number(raw.contractValue) : null,
    actualCost: raw.actualCost != null ? Number(raw.actualCost) : null,
    actualProfit: raw.actualProfit != null ? Number(raw.actualProfit) : null,
    paymentStatus: asNullableString(raw.paymentStatus)?.toLowerCase() ?? null,
    receivedPayment:
      raw.receivedPayment != null ? Number(raw.receivedPayment) : null,
    remainingReceivable:
      raw.remainingReceivable != null ? Number(raw.remainingReceivable) : null,
    jobStartDate: raw.jobStartDate
      ? new Date(String(raw.jobStartDate)).toISOString().slice(0, 10)
      : null,
    jobEndDate: raw.jobEndDate
      ? new Date(String(raw.jobEndDate)).toISOString().slice(0, 10)
      : null,
    invoiceIssued: asNullableBoolean(raw.invoiceIssued),
    invoiceNo: asNullableString(raw.invoiceNo),
    maintenanceProposal: asNullableString(raw.maintenanceProposal),
    nextFollowUpDate: raw.nextFollowUpDate
      ? new Date(String(raw.nextFollowUpDate)).toISOString().slice(0, 10)
      : null,
    priority: asNullableString(raw.priority)?.toLowerCase() ?? null,
    statusNote: asNullableString(raw.statusNote),
    siteMediaNotes: asNullableString(raw.siteMediaNotes),
    fileLink: asNullableString(raw.fileLink),
    buildingPermit: asNullableBoolean(raw.buildingPermit),
    siteVisitPhotos: asStringArray(raw.siteVisitPhotos),
    visibilityScope: (
      ["public", "admin_only", "team_lead_only", "assigned_only", "restricted"].includes(
        String(raw.visibilityScope)
      )
        ? String(raw.visibilityScope)
        : "assigned_only"
    ) as Customer["visibilityScope"],
    visibilityUserIds: asStringArray(raw.visibilityUserIds),
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
    visibilityScope: formData.visibilityScope || "assigned_only",
    visibilityUserIds: Array.isArray(formData.visibilityUserIds)
      ? formData.visibilityUserIds
      : [],
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
    buildingPermit: formData.buildingPermit ?? null,
    siteVisitPhotos: Array.isArray(formData.siteVisitPhotos)
      ? formData.siteVisitPhotos.filter(Boolean)
      : [],
  };
}

async function parseJsonResponse(res: Response): Promise<ApiResponse> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text ? { message: text } : {};
  }
}

function mergeCustomer(
  previous: Customer,
  incoming: Partial<Customer> & { id?: string }
): Customer {
  return {
    ...previous,
    ...incoming,
    id: incoming.id ?? previous.id,
  };
}

export function useCustomers(currentUser: LegacyUser) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activitiesByCustomer, setActivitiesByCustomer] = useState<
    Record<string, Activity[]>
  >({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  const lastLoadedAtRef = useRef<number>(0);
  const inFlightRef = useRef<Promise<void> | null>(null);

  const setCustomerInState = useCallback((incoming: Customer) => {
    setCustomers((prev) => {
      const index = prev.findIndex((item) => item.id === incoming.id);

      if (index === -1) {
        return [incoming, ...prev];
      }

      const next = [...prev];
      next[index] = mergeCustomer(next[index], incoming);
      return next;
    });
  }, []);

  const patchCustomerById = useCallback(
    (customerId: string, patch: Partial<Customer>) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === customerId ? mergeCustomer(customer, patch) : customer
        )
      );
    },
    []
  );

  const removeCustomerFromState = useCallback((customerId: string) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== customerId));
    setActivitiesByCustomer((prev) => {
      if (!(customerId in prev)) return prev;
      const next = { ...prev };
      delete next[customerId];
      return next;
    });
  }, []);

  const loadCustomers = useCallback(
    async (options?: { force?: boolean }) => {
      if (!currentUser) {
        setCustomers([]);
        setActivitiesByCustomer({});
        setIsLoaded(true);
        setIsLoadingCustomers(false);
        return;
      }

      const now = Date.now();
      const isFresh = now - lastLoadedAtRef.current < 15_000;

      if (!options?.force && isFresh && isLoaded) {
        return;
      }

      if (inFlightRef.current) {
        return inFlightRef.current;
      }

      const request = (async () => {
        try {
          setIsLoadingCustomers(true);

          const res = await fetch("/api/customers", {
            credentials: "include",
            cache: "default",
          });

          const data = await parseJsonResponse(res);

          if (!res.ok) {
            throw new Error(data?.message || "Müşteriler yüklenemedi");
          }

          const rows: ApiCustomer[] = Array.isArray(data?.customers)
            ? data.customers
            : [];

          setCustomers(rows.map(normalizeCustomer));

          const nextActivities: Record<string, Activity[]> = {};
          for (const row of rows) {
            const rowId = String(row.id ?? "");
            nextActivities[rowId] = Array.isArray(row.activities)
              ? (row.activities as Record<string, unknown>[]).map(normalizeActivity)
              : [];
          }

          setActivitiesByCustomer(nextActivities);
          lastLoadedAtRef.current = Date.now();
        } catch (error) {
          console.error("loadCustomers error", error);
          setCustomers([]);
          setActivitiesByCustomer({});
        } finally {
          setIsLoaded(true);
          setIsLoadingCustomers(false);
          inFlightRef.current = null;
        }
      })();

      inFlightRef.current = request;
      return request;
    },
    [currentUser, isLoaded]
  );

  useEffect(() => {
    if (!currentUser) {
      setCustomers([]);
      setActivitiesByCustomer({});
      setIsLoaded(true);
      setIsLoadingCustomers(false);
      return;
    }

    void loadCustomers({ force: true });
  }, [currentUser, loadCustomers]);

  const addCustomer = useCallback(
    async (formData: CustomerFormData) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildCustomerPayload(formData, currentUser)),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri eklenemedi");
      }

      if (data?.customer && typeof data.customer === "object") {
        const newCustomer = normalizeCustomer(data.customer as ApiCustomer);
        setCustomers((prev) => [newCustomer, ...prev]);
        setActivitiesByCustomer((prev) => ({
          ...prev,
          [newCustomer.id]: prev[newCustomer.id] ?? [],
        }));
      } else {
        await loadCustomers({ force: true });
      }
    },
    [currentUser, loadCustomers]
  );

  const updateCustomer = useCallback(
    async (customerId: string, formData: CustomerFormData) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildCustomerPayload(formData, currentUser)),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Müşteri güncellenemedi");
      }

      const localPatch: Partial<Customer> = {
        name: toNullableString(formData.contactName || formData.name) || "",
        company: toNullableString(formData.company || formData.facilityName),
        phone: String(formData.phone || "").trim(),
        email: toNullableString(formData.email),
        address: toNullableString(formData.address),
        probability: normalizeProbability(formData.probability),
        estimatedValue: toNullableNumber(formData.estimatedValue),
        expectedCloseDate: toNullableDate(formData.expectedCloseDate),
        assignedTo: toNullableString(formData.assignedTo) || "",
        teamLeadId: toNullableString(formData.teamLeadId),
        status: normalizeStatus(formData.status),
        source: normalizeSource(formData.source),
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        notes: formData.notes || "",
        lastContact: toNullableDate(formData.lastContact),
        lastContactNotes: formData.lastContactNotes || "",
        visibilityScope: formData.visibilityScope || "assigned_only",
        visibilityUserIds: Array.isArray(formData.visibilityUserIds)
          ? formData.visibilityUserIds
          : [],
        updatedAt: new Date().toISOString(),
      };

      patchCustomerById(customerId, localPatch);

      if (!data?.customer) {
        await loadCustomers({ force: true });
      }
    },
    [currentUser, loadCustomers, patchCustomerById]
  );

  const updateCustomerTechnical = useCallback(
    async (customerId: string, formData: CustomerTechnicalFormData) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(buildTechnicalPayload(formData)),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Teknik bilgiler güncellenemedi");
      }

      patchCustomerById(customerId, {
        roofSuitable: toNullableString(formData.roofSuitable)?.toLowerCase() ?? null,
        roofAreaM2: toNullableNumber(formData.roofAreaM2),
        transformerPowerKva: toNullableNumber(formData.transformerPowerKva),
        contractPowerKw: toNullableNumber(formData.contractPowerKw),
        monthlyConsumptionKwh: toNullableNumber(formData.monthlyConsumptionKwh),
        monthlyBillTl: toNullableNumber(formData.monthlyBillTl),
        wantsBackupPower: formData.wantsBackupPower ?? null,
        batteryRequested: formData.batteryRequested ?? null,
        hasCriticalLoads: formData.hasCriticalLoads ?? null,
        criticalLoadsDescription: toNullableString(
          formData.criticalLoadsDescription
        ),
        hybridInverterPreference:
          toNullableString(formData.hybridInverterPreference)?.toLowerCase() ??
          null,
        wantsAlternativeProposal: formData.wantsAlternativeProposal ?? null,
        alternativeProposalNotes: toNullableString(
          formData.alternativeProposalNotes
        ),
        buildingPermit: formData.buildingPermit ?? null,
        siteVisitPhotos: Array.isArray(formData.siteVisitPhotos)
          ? formData.siteVisitPhotos.filter(Boolean)
          : [],
        updatedAt: new Date().toISOString(),
      });

      if (!data?.customer) {
        await loadCustomers({ force: true });
      }
    },
    [loadCustomers, patchCustomerById]
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

      removeCustomerFromState(customerId);
    },
    [removeCustomerFromState]
  );

  const changeStatus = useCallback(
    async (customerId: string, newStatus: CustomerStatus) => {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Durum güncellenemedi");
      }

      patchCustomerById(customerId, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    },
    [patchCustomerById]
  );

  const addActivity = useCallback(
    async (
      customerId: string,
      type: ActivityType,
      description: string,
      dueDate?: string
    ) => {
      const res = await fetch(`/api/customers/${customerId}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ type, description, dueDate }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Aktivite eklenemedi");
      }

      if (data?.activity && typeof data.activity === "object") {
        const activity = normalizeActivity(data.activity as Record<string, unknown>);
        setActivitiesByCustomer((prev) => ({
          ...prev,
          [customerId]: [activity, ...(prev[customerId] || [])],
        }));
      } else {
        await loadCustomers({ force: true });
      }
    },
    [loadCustomers]
  );

  const addContactNote = useCallback(
    async (customerId: string, note: string, type: ActivityType = "note") => {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ note, type }),
      });

      const data = await parseJsonResponse(res);

      if (!res.ok) {
        throw new Error(data?.message || "Not eklenemedi");
      }

      const optimisticActivity: Activity = {
        id: `temp-note-${Date.now()}`,
        customerId,
        type,
        description: note,
        createdBy: currentUser?.id || "",
        createdAt: new Date().toISOString(),
        isCompleted: false,
      };

      setActivitiesByCustomer((prev) => ({
        ...prev,
        [customerId]: [optimisticActivity, ...(prev[customerId] || [])],
      }));

      patchCustomerById(customerId, {
        updatedAt: new Date().toISOString(),
      });
    },
    [currentUser?.id, patchCustomerById]
  );

  const completeActivity = useCallback((activityId: string) => {
    setActivitiesByCustomer((prev) => {
      const next: Record<string, Activity[]> = {};

      for (const [customerId, items] of Object.entries(prev)) {
        next[customerId] = items.map((item) =>
          item.id === activityId ? { ...item, isCompleted: true } : item
        );
      }

      return next;
    });
  }, []);

  const getCustomerActivities = useCallback(
    (customerId: string) => activitiesByCustomer[customerId] || emptyActivities,
    [activitiesByCustomer]
  );

  const getPendingActivities = useCallback(
    () =>
      Object.values(activitiesByCustomer)
        .flat()
        .filter((item) => !item.isCompleted && item.dueDate),
    [activitiesByCustomer]
  );

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

  const getAllTags = useCallback(
    () =>
      Array.from(
        new Set(customers.flatMap((customer) => customer.tags || []).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "tr")),
    [customers]
  );

  const stats = useMemo(() => {
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
    isLoadingCustomers,
    stats,

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
    getStatistics: () => stats,
    getAllTags,
    reloadCustomers: () => loadCustomers({ force: true }),
  };
}