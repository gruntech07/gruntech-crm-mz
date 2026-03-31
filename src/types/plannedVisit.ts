export type PlannedVisitStatus =
  | "PLANNED"
  | "VISITED"
  | "POSTPONED"
  | "CANCELLED"
  | "CONVERTED";

export type VisibilityScope =
  | "private"
  | "assigned_only"
  | "team"
  | "custom";

export interface PlannedVisit {
  id: string;
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  district?: string | null;
  address?: string | null;
  sector?: string | null;
  locationNote?: string | null;
  remoteNotes?: string | null;

  assignedToId?: string | null;
  teamLeadId?: string | null;
  createdById: string;

  plannedAt: string;
  status: PlannedVisitStatus;

  visitNotes?: string | null;
  visitResult?: string | null;
  buildingPermit?: boolean | null;
  visitPhotos: string[];

  visibilityScope: string;
  visibilityUserIds: string[];

  customerId?: string | null;
  createdAt: string;
  updatedAt: string;

  assignedTo?: {
    id: string;
    name: string;
    email: string;
  } | null;

  teamLead?: {
    id: string;
    name: string;
    email: string;
  } | null;

  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;

  customer?: {
    id: string;
    name: string;
    company?: string | null;
    phone: string;
  } | null;
}

export interface PlannedVisitFormData {
  companyName: string;
  contactName?: string;
  phone?: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
  sector?: string;
  locationNote?: string;
  remoteNotes?: string;

  assignedToId?: string;
  teamLeadId?: string;

  plannedAt: string;

  visibilityScope?: string;
  visibilityUserIds?: string[];
}

export interface PlannedVisitVisitResultFormData {
  visitNotes?: string;
  visitResult?: string;
  buildingPermit?: boolean;
  visitPhotos?: string[];
  status: Extract<PlannedVisitStatus, "VISITED" | "POSTPONED" | "CANCELLED">;
}

export interface ConvertPlannedVisitToCustomerPayload {
  plannedVisitId: string;
  customerData?: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    district?: string;
    sector?: string;
    contactName?: string;
    locationNote?: string;
    notesText?: string;
    buildingPermit?: boolean;
    siteVisitPhotos?: string[];
  };
}