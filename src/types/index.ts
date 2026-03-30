// ==================== USER TYPES ====================
export type UserRole = "admin" | "team_lead" | "sales_rep";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ==================== AUTH TYPES ====================
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ==================== CUSTOMER TYPES ====================
export type SalesProbability = "high" | "medium" | "low" | "none";

export type CustomerStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost";

export type CustomerSource =
  | "referral"
  | "cold_call"
  | "social_media"
  | "website"
  | "email"
  | "event"
  | "other";

export interface Customer {
  id: string;
  name: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;

  probability: SalesProbability;
  estimatedValue?: number | null;
  expectedCloseDate?: string | null;

  assignedTo: string;
  teamLeadId?: string | null;
  createdBy: string;

  status: CustomerStatus;
  source: CustomerSource;
  tags: string[];

  notes: string;
  lastContact?: string | null;
  lastContactNotes: string;

  createdAt: string;
  updatedAt: string;

  recordNo?: string | null;
  recordDate?: string | null;
  city?: string | null;
  district?: string | null;
  facilityName?: string | null;
  sector?: string | null;
  contactName?: string | null;
  contactTitle?: string | null;
  hasWhatsapp?: boolean | null;
  locationNote?: string | null;
  firstContactChannel?: string | null;
  referralSource?: string | null;
  responsiblePerson?: string | null;
  facilityType?: string | null;
  currentSituation?: string | null;
  needAnalysis?: string | null;
  meetingSummary?: string | null;
  roofSuitable?: string | null;
  roofAreaM2?: number | null;
  transformerPowerKva?: number | null;
  contractPowerKw?: number | null;
  monthlyConsumptionKwh?: number | null;
  monthlyBillTl?: number | null;
  wantsBackupPower?: boolean | null;
  batteryRequested?: boolean | null;
  outageLoadsDescription?: string | null;
  hasCriticalLoads?: boolean | null;
  criticalLoadsDescription?: string | null;
  hybridInverterPreference?: string | null;
  wantsAlternativeProposal?: boolean | null;
  alternativeProposalNotes?: string | null;
  requestedWorkType?: string | null;
  proposalGiven?: boolean | null;
  proposalDate?: string | null;
  proposalNo?: string | null;
  proposalAmountVatExcl?: number | null;
  proposalAmountVatIncl?: number | null;
  estimatedCost?: number | null;
  estimatedProfit?: number | null;
  estimatedProfitRate?: number | null;
  stage?: string | null;
  lastMeetingDate?: string | null;
  result?: string | null;
  lostReason?: string | null;
  competitor?: string | null;
  completedWork?: string | null;
  contractValue?: number | null;
  actualCost?: number | null;
  actualProfit?: number | null;
  paymentStatus?: string | null;
  receivedPayment?: number | null;
  remainingReceivable?: number | null;
  jobStartDate?: string | null;
  jobEndDate?: string | null;
  invoiceIssued?: boolean | null;
  invoiceNo?: string | null;
  maintenanceProposal?: string | null;
  nextFollowUpDate?: string | null;
  priority?: string | null;
  statusNote?: string | null;
  siteMediaNotes?: string | null;
  fileLink?: string | null;
}

// ==================== ACTIVITY TYPES ====================
export type ActivityType =
  | "call"
  | "email"
  | "meeting"
  | "task"
  | "note"
  | "status_change";

export interface Activity {
  id: string;
  customerId: string;
  type: ActivityType;
  description: string;
  createdBy: string;
  createdAt: string;
  dueDate?: string;
  isCompleted?: boolean;
}

// ==================== PIPELINE TYPES ====================
export interface PipelineStage {
  id: CustomerStatus;
  name: string;
  color: string;
  order: number;
}

// ==================== DASHBOARD TYPES ====================
export interface DashboardStats {
  total: number;
  byStatus: Record<CustomerStatus, number>;
  byProbability: Record<SalesProbability, number>;
  totalEstimatedValue: number;
  weightedForecast: number;
  monthlyNew: number;
  monthlyClosed: number;
  conversionRate: number;
}

// ==================== FORM TYPES ====================
export interface CustomerFormData {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  probability: SalesProbability;
  estimatedValue?: number;
  expectedCloseDate?: string;
  status: CustomerStatus;
  source: CustomerSource;
  tags: string[];
  notes: string;
  lastContact?: string;
  lastContactNotes?: string;
  assignedTo?: string;
  teamLeadId?: string;
  createdBy?: string;
  facilityName?: string;
  contactName?: string;
}

export interface UserFormData {
  email: string;
  name: string;
  role: UserRole;
  password: string;
}

// ==================== FILTER TYPES ====================
export interface CustomerFilters {
  search: string;
  status: CustomerStatus | "all";
  probability: SalesProbability | "all";
  assignedTo: string | "all" | "me";
  source: CustomerSource | "all";
  tags: string[];
  dateRange: "all" | "today" | "week" | "month" | "quarter";
}

// ==================== BASE LABELS ====================
export const probabilityLabels: Record<SalesProbability, string> = {
  high: "Yüksek İhtimal",
  medium: "Belki",
  low: "Düşük İhtimal",
  none: "Düşünmüyor",
};

export const probabilityColors: Record<SalesProbability, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-orange-500",
  none: "bg-red-500",
};

export const statusLabels: Record<CustomerStatus, string> = {
  new: "Yeni",
  contacted: "İletişime Geçildi",
  qualified: "Değerlendirildi",
  proposal: "Teklif Verildi",
  negotiation: "Görüşülüyor",
  closed_won: "Kazanıldı",
  closed_lost: "Kaybedildi",
};

export const statusColors: Record<CustomerStatus, string> = {
  new: "bg-gray-500",
  contacted: "bg-blue-500",
  qualified: "bg-indigo-500",
  proposal: "bg-purple-500",
  negotiation: "bg-yellow-500",
  closed_won: "bg-green-500",
  closed_lost: "bg-red-500",
};

export const sourceLabels: Record<CustomerSource, string> = {
  referral: "Referans",
  cold_call: "Soğuk Arama",
  social_media: "Sosyal Medya",
  website: "Web Sitesi",
  email: "E-posta",
  event: "Etkinlik",
  other: "Diğer",
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Yönetici",
  team_lead: "Ekip Lideri",
  sales_rep: "Satış Temsilcisi",
};

export const activityLabels: Record<ActivityType, string> = {
  call: "Arama",
  email: "E-posta",
  meeting: "Toplantı",
  task: "Görev",
  note: "Not",
  status_change: "Durum Değişikliği",
};

export const pipelineStages: PipelineStage[] = [
  { id: "new", name: "Yeni", color: "#6b7280", order: 0 },
  { id: "contacted", name: "İletişim", color: "#3b82f6", order: 1 },
  { id: "qualified", name: "Değerlendirme", color: "#6366f1", order: 2 },
  { id: "proposal", name: "Teklif", color: "#a855f7", order: 3 },
  { id: "negotiation", name: "Görüşme", color: "#eab308", order: 4 },
  { id: "closed_won", name: "Kazanıldı", color: "#22c55e", order: 5 },
  { id: "closed_lost", name: "Kaybedildi", color: "#ef4444", order: 6 },
];

// ==================== EXTRA DETAIL LABELS ====================
export const contactChannelLabels: Record<string, string> = {
  ziyaret: "Ziyaret",
  telefon: "Telefon",
  whatsapp: "WhatsApp",
  email: "E-posta",
  referans: "Referans",
  fuar: "Fuar",
  sosyal_medya: "Sosyal Medya",
  website: "Web Sitesi",
  diger: "Diğer",
};

export const hybridInverterPreferenceLabels: Record<string, string> = {
  evaluate: "Değerlendirilecek",
  yes: "İsteniyor",
  no: "İstenmiyor",
};

export const paymentStatusLabels: Record<string, string> = {
  unpaid: "Ödenmedi",
  partial: "Kısmi Ödeme",
  paid: "Ödendi",
};

export const priorityLabels: Record<string, string> = {
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
};

export const resultLabels: Record<string, string> = {
  bekliyor: "Bekliyor",
  olumlu: "Olumlu",
  olumsuz: "Olumsuz",
  ertelendi: "Ertelendi",
};

export const roofSuitabilityLabels: Record<string, string> = {
  evet: "Evet",
  hayir: "Hayır",
  bilinmiyor: "Bilinmiyor",
};

export const stageLabels: Record<string, string> = {
  ilk_ziyaret: "İlk Ziyaret",
  ihtiyac_analizi: "İhtiyaç Analizi",
  kesif_planlandi: "Keşif Planlandı",
  kesif_yapildi: "Keşif Yapıldı",
  teklif_hazirlaniyor: "Teklif Hazırlanıyor",
  teklif_sunuldu: "Teklif Sunuldu",
  revize_bekleniyor: "Revize Bekleniyor",
  karar_bekleniyor: "Karar Bekleniyor",
  kazanildi: "Kazanıldı",
  kaybedildi: "Kaybedildi",
};

export const workTypeLabels: Record<string, string> = {
  cati_ges: "Çatı GES",
  arazi_ges: "Arazi GES",
  hibrit_sistem: "Hibrit Sistem",
  depolama: "Depolama",
  sarj_istasyonu: "Şarj İstasyonu",
  enerji_verimliligi: "Enerji Verimliliği",
  bakim_onarim: "Bakım Onarım",
  diger: "Diğer",
};