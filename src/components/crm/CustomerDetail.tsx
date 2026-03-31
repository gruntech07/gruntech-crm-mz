"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import type { Activity, ActivityType, Customer, CustomerStatus } from "@/types";
import {
  statusLabels,
  probabilityLabels,
  hybridInverterPreferenceLabels,
  roofSuitabilityLabels,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  Mail,
  MapPin,
  Phone,
  Save,
  User,
  Wrench,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  MessageSquare,
  Sparkles,
  Zap,
  Battery,
  Sun,
  TrendingUp,
  ChevronRight,
  CircleDollarSign,
} from "lucide-react";

interface CustomerDetailProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEditGeneral: () => void;
  onEditTechnical: () => void;
  onDelete: () => void;
  onAddNote: (note: string, type: ActivityType) => Promise<void> | void;
  onAddActivity: (
    type: ActivityType,
    description: string,
    dueDate?: string
  ) => Promise<void> | void;
  onCompleteActivity: (activityId: string) => void;
  onStatusChange?: (
    customerId: string,
    newStatus: CustomerStatus
  ) => Promise<void> | void;
  activities: Activity[];
  getUserName: (id: string) => string;
  onTabChange?: (tab: "general" | "technical" | "proposal") => void;
  canDelete?: boolean;
}

export function CustomerDetail({
  customer,
  isOpen,
  onClose,
  onEditGeneral,
  onEditTechnical,
  onDelete,
  onAddNote,
  onAddActivity,
  onCompleteActivity,
  onStatusChange,
  activities,
  getUserName,
  onTabChange,
  canDelete = false,
}: CustomerDetailProps) {
  const [activeTab, setActiveTab] = useState<"general" | "technical" | "proposal">(
    "general"
  );
  const [noteText, setNoteText] = useState("");
  const [activityType, setActivityType] = useState<ActivityType>("task");
  const [activityText, setActivityText] = useState("");
  const [activityDueDate, setActivityDueDate] = useState("");
  const [isNoteSaving, setIsNoteSaving] = useState(false);
  const [isActivitySaving, setIsActivitySaving] = useState(false);

  const sortedActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [activities]
  );

  if (!customer) return null;

  const handleTabChange = (value: string) => {
    const next = value as "general" | "technical" | "proposal";
    setActiveTab(next);
    onTabChange?.(next);
  };

  const handleQuickStatusChange = async (value: string) => {
    if (!onStatusChange) return;
    await onStatusChange(customer.id, value as CustomerStatus);
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    try {
      setIsNoteSaving(true);
      await onAddNote(noteText.trim(), "note");
      setNoteText("");
    } finally {
      setIsNoteSaving(false);
    }
  };

  const handleSaveActivity = async () => {
    if (!activityText.trim()) return;
    try {
      setIsActivitySaving(true);
      await onAddActivity(
        activityType,
        activityText.trim(),
        activityDueDate || undefined
      );
      setActivityText("");
      setActivityDueDate("");
      setActivityType("task");
    } finally {
      setIsActivitySaving(false);
    }
  };

  const getProbabilityTone = (probability: string) => {
    const map: Record<string, string> = {
      high: "bg-emerald-50 text-emerald-700 border-emerald-200",
      medium: "bg-amber-50 text-amber-700 border-amber-200",
      low: "bg-orange-50 text-orange-700 border-orange-200",
      none: "bg-rose-50 text-rose-700 border-rose-200",
    };
    return map[probability] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const summaryRows = [
    { label: "Tahmini Proje", value: formatMoney(customer.estimatedValue) },
    { label: "Aylık Fatura", value: formatMoney(customer.monthlyBillTl) },
    { label: "Batarya Talebi", value: formatBool(customer.batteryRequested) },
    { label: "Kritik Yük", value: formatBool(customer.hasCriticalLoads) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-6cm)] max-w-[1500px] h-[90vh] overflow-hidden border-0 bg-slate-100 p-0 rounded-[28px]">
        <DialogTitle className="sr-only">
          {customer.name} müşteri detayları
        </DialogTitle>

        <div className="flex h-full min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white shadow-sm">
                  {customer.name.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      {customer.name}
                    </h2>

                    <Badge
                      variant="outline"
                      className={`border px-3 py-1 text-xs font-semibold ${getProbabilityTone(
                        customer.probability
                      )}`}
                    >
                      {probabilityLabels[customer.probability]}
                    </Badge>

                    <Badge
                      variant="outline"
                      className="border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {statusLabels[customer.status]}
                    </Badge>

                    {customer.estimatedValue != null && (
                      <Badge
                        variant="outline"
                        className="border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700"
                      >
                        <CircleDollarSign className="mr-1 h-3.5 w-3.5" />
                        {formatMoney(customer.estimatedValue)}
                      </Badge>
                    )}
                  </div>

                  {customer.company ? (
                    <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                      <Building2 className="h-4 w-4" />
                      {customer.company}
                    </p>
                  ) : null}

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <CompactInfoCard
                      icon={<Phone className="h-4 w-4" />}
                      label="Telefon"
                      value={customer.phone || "-"}
                      href={customer.phone ? `tel:${customer.phone}` : undefined}
                    />
                    <CompactInfoCard
                      icon={<Mail className="h-4 w-4" />}
                      label="E-posta"
                      value={customer.email || "-"}
                      href={customer.email ? `mailto:${customer.email}` : undefined}
                    />
                    <CompactInfoCard
                      icon={<MapPin className="h-4 w-4" />}
                      label="Konum"
                      value={
                        [customer.city, customer.district].filter(Boolean).join(" / ") ||
                        customer.address ||
                        "-"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1.2fr]">
                <Button
                  onClick={onEditGeneral}
                  className="h-10 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Genel Güncelle
                </Button>

                <Button
                  variant="outline"
                  onClick={onEditTechnical}
                  className="h-10 rounded-2xl border-slate-200 bg-white"
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Teknik Güncelle
                </Button>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500">
                    Hızlı Durum Güncelle
                  </Label>
                  <Select value={customer.status} onValueChange={handleQuickStatusChange}>
                    <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Yeni</SelectItem>
                      <SelectItem value="contacted">İletişim Kuruldu</SelectItem>
                      <SelectItem value="qualified">Nitelikli</SelectItem>
                      <SelectItem value="proposal">Teklif</SelectItem>
                      <SelectItem value="negotiation">Müzakere</SelectItem>
                      <SelectItem value="closed_won">Kazanıldı</SelectItem>
                      <SelectItem value="closed_lost">Kaybedildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-2 bg-transparent p-0">
                  <TabsTrigger
                    value="general"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm data-[state=active]:border-slate-300"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Müşteri Bilgileri
                  </TabsTrigger>
                  <TabsTrigger
                    value="technical"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm data-[state=active]:border-slate-300"
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Teknik Bilgiler
                  </TabsTrigger>
                  <TabsTrigger
                    value="proposal"
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm data-[state=active]:border-slate-300"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Teklif & Finans
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4">
                  <TabsContent value="general" className="m-0">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,2.6fr)_360px]">
                      <div className="space-y-6">
                        <InfoSection
                          title="Genel Bilgiler"
                          icon={<User className="h-5 w-5 text-blue-600" />}
                          items={[
                            { label: "Firma", value: customer.company },
                            { label: "Yetkili", value: customer.contactName || customer.name },
                            { label: "Telefon", value: customer.phone },
                            { label: "E-posta", value: customer.email },
                            { label: "Adres", value: customer.address },
                            {
                              label: "Şehir / İlçe",
                              value: [customer.city, customer.district].filter(Boolean).join(" / "),
                            },
                            { label: "Sektör", value: customer.sector },
                            { label: "Durum", value: statusLabels[customer.status], highlight: true },
                            {
                              label: "Satış Olasılığı",
                              value: probabilityLabels[customer.probability],
                              highlight: true,
                            },
                            {
                              label: "Tahmini Proje Tutarı",
                              value: formatMoney(customer.estimatedValue),
                              highlight: true,
                            },
                          ]}
                        />

                        <InfoSection
                          title="Süreç ve Takvim"
                          icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
                          items={[
                            { label: "Oluşturulma", value: formatDate(customer.createdAt) },
                            { label: "Son Güncelleme", value: formatDate(customer.updatedAt) },
                            { label: "Son Temas", value: formatDate(customer.lastContact) },
                            {
                              label: "Beklenen Kapanış",
                              value: formatDate(customer.expectedCloseDate),
                            },
                            { label: "Son Temas Notu", value: customer.lastContactNotes },
                          ]}
                        />

                        {customer.notes ? (
                          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 shadow-sm">
                            <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-amber-900">
                              <Sparkles className="h-4 w-4" />
                              Genel Notlar
                            </h4>
                            <p className="whitespace-pre-wrap text-sm leading-7 text-amber-900">
                              {customer.notes}
                            </p>
                          </div>
                        ) : null}

                        {canDelete && (
                          <section className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-red-600">Yönetici İşlemi</h3>
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                onClick={onDelete}
                                className="h-11 w-full rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Müşteriyi Sil
                              </Button>
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="space-y-6">
                        <SidebarStack
                          noteText={noteText}
                          setNoteText={setNoteText}
                          onSaveNote={handleSaveNote}
                          isNoteSaving={isNoteSaving}
                          activityType={activityType}
                          setActivityType={setActivityType}
                          activityText={activityText}
                          setActivityText={setActivityText}
                          activityDueDate={activityDueDate}
                          setActivityDueDate={setActivityDueDate}
                          onSaveActivity={handleSaveActivity}
                          isActivitySaving={isActivitySaving}
                          activities={sortedActivities}
                          getUserName={getUserName}
                          onCompleteActivity={onCompleteActivity}
                          summaryRows={summaryRows}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="technical" className="m-0">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,2.6fr)_360px]">
                      <div className="space-y-6">
                        <div className="flex justify-end">
                          <Button onClick={onEditTechnical} className="rounded-2xl">
                            <Wrench className="mr-2 h-4 w-4" />
                            Teknik Formu Aç
                          </Button>
                        </div>

                        <InfoSection
                          title="Saha ve Teknik Uygunluk"
                          icon={<Sun className="h-5 w-5 text-amber-500" />}
                          items={[
                            {
                              label: "Çatı Uygunluğu",
                              value: customer.roofSuitable
                                ? roofSuitabilityLabels[
                                    customer.roofSuitable as keyof typeof roofSuitabilityLabels
                                  ]
                                : null,
                            },
                            {
                              label: "Tahmini Çatı Alanı",
                              value: valueWithUnit(customer.roofAreaM2, "m²"),
                            },
                            {
                              label: "Trafo Gücü",
                              value: valueWithUnit(customer.transformerPowerKva, "kVA"),
                            },
                            {
                              label: "Sözleşme Gücü",
                              value: valueWithUnit(customer.contractPowerKw, "kW"),
                            },
                          ]}
                        />

                        <InfoSection
                          title="Tüketim ve Fatura Profili"
                          icon={<Zap className="h-5 w-5 text-yellow-500" />}
                          items={[
                            {
                              label: "Aylık Tüketim",
                              value: valueWithUnit(customer.monthlyConsumptionKwh, "kWh"),
                            },
                            {
                              label: "Aylık Fatura",
                              value: formatMoney(customer.monthlyBillTl),
                              highlight: true,
                            },
                          ]}
                        />

                        <InfoSection
                          title="Batarya ve Yedek Güç"
                          icon={<Battery className="h-5 w-5 text-emerald-500" />}
                          items={[
                            {
                              label: "Kesintide Enerji İstiyor",
                              value: formatBool(customer.wantsBackupPower),
                            },
                            {
                              label: "Batarya Talebi",
                              value: formatBool(customer.batteryRequested),
                            },
                            {
                              label: "Kritik Yükler",
                              value: formatBool(customer.hasCriticalLoads),
                            },
                            {
                              label: "Kritik Yük Açıklaması",
                              value: customer.criticalLoadsDescription,
                            },
                            {
                              label: "Hibrit İnverter",
                              value: customer.hybridInverterPreference
                                ? hybridInverterPreferenceLabels[
                                    customer.hybridInverterPreference as keyof typeof hybridInverterPreferenceLabels
                                  ]
                                : null,
                            },
                            {
                              label: "Alternatif Teklif Talebi",
                              value: formatBool(customer.wantsAlternativeProposal),
                            },
                            {
                              label: "Alternatif Teklif Notu",
                              value: customer.alternativeProposalNotes,
                            },
                          ]}
                        />

                        {canDelete && (
                          <section className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-red-600">Yönetici İşlemi</h3>
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                onClick={onDelete}
                                className="h-11 w-full rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Müşteriyi Sil
                              </Button>
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="space-y-6">
                        <SummaryCard
                          title="Teknik Özet"
                          rows={[
                            {
                              label: "Çatı Durumu",
                              value:
                                customer.roofSuitable
                                  ? roofSuitabilityLabels[
                                      customer.roofSuitable as keyof typeof roofSuitabilityLabels
                                    ] || "Belirtilmemiş"
                                  : "Belirtilmemiş",
                            },
                            {
                              label: "Aylık Tüketim",
                              value: valueWithUnit(customer.monthlyConsumptionKwh, "kWh"),
                            },
                            {
                              label: "Aylık Fatura",
                              value: formatMoney(customer.monthlyBillTl),
                            },
                            {
                              label: "Batarya",
                              value: formatBool(customer.batteryRequested),
                            },
                            {
                              label: "Kritik Yük",
                              value: formatBool(customer.hasCriticalLoads),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="proposal" className="m-0">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,2.6fr)_360px]">
                      <div className="space-y-6">
                        <InfoSection
                          title="Teklif Detayları"
                          icon={<FileText className="h-5 w-5 text-blue-600" />}
                          items={[
                            { label: "Teklif Verildi", value: formatBool(customer.proposalGiven) },
                            { label: "Teklif Tarihi", value: formatDate(customer.proposalDate) },
                            { label: "Teklif No", value: customer.proposalNo },
                            {
                              label: "KDV Hariç Tutar",
                              value: formatMoney(customer.proposalAmountVatExcl),
                            },
                            {
                              label: "KDV Dahil Tutar",
                              value: formatMoney(customer.proposalAmountVatIncl),
                              highlight: true,
                            },
                            {
                              label: "Tahmini Maliyet",
                              value: formatMoney(customer.estimatedCost),
                            },
                            {
                              label: "Tahmini Kâr",
                              value: formatMoney(customer.estimatedProfit),
                              highlight: true,
                            },
                            {
                              label: "Kâr Oranı",
                              value:
                                customer.estimatedProfitRate != null
                                  ? `%${customer.estimatedProfitRate}`
                                  : null,
                            },
                          ]}
                        />

                        <InfoSection
                          title="Satış Süreci"
                          icon={<TrendingUp className="h-5 w-5 text-violet-600" />}
                          items={[
                            { label: "Aşama", value: customer.stage },
                            { label: "Son Görüşme", value: formatDate(customer.lastMeetingDate) },
                            { label: "Sonuç", value: customer.result },
                            { label: "Rakip", value: customer.competitor },
                            { label: "Kayıp Nedeni", value: customer.lostReason },
                            {
                              label: "Sonraki Takip",
                              value: formatDate(customer.nextFollowUpDate),
                              highlight: true,
                            },
                          ]}
                        />

                        {canDelete && (
                          <section className="rounded-3xl border border-red-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-bold text-red-600">Yönetici İşlemi</h3>
                            <div className="mt-4">
                              <Button
                                variant="outline"
                                onClick={onDelete}
                                className="h-11 w-full rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Müşteriyi Sil
                              </Button>
                            </div>
                          </section>
                        )}
                      </div>

                      <div className="space-y-6">
                        <SummaryCard
                          title="Finansal Özet"
                          rows={[
                            {
                              label: "Teklif Tutarı",
                              value: formatMoney(customer.proposalAmountVatIncl),
                            },
                            {
                              label: "Tahmini Maliyet",
                              value: formatMoney(customer.estimatedCost),
                            },
                            {
                              label: "Tahmini Kâr",
                              value: formatMoney(customer.estimatedProfit),
                            },
                            {
                              label: "Kâr Oranı",
                              value:
                                customer.estimatedProfitRate != null
                                  ? `%${customer.estimatedProfitRate}`
                                  : "-",
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompactInfoCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <div className="mb-1 flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-semibold text-slate-900 break-all">{value}</div>
    </div>
  );

  if (href) {
    return (
      <a href={href} onClick={(e) => e.stopPropagation()}>
        {content}
      </a>
    );
  }

  return content;
}

function InfoSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: { label: string; value: any; highlight?: boolean }[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`rounded-2xl border p-4 ${
              item.highlight
                ? "border-blue-100 bg-blue-50"
                : "border-slate-100 bg-slate-50"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">
              {item.label}
            </p>
            <p
              className={`mt-1 text-sm font-semibold leading-6 break-words ${
                item.highlight ? "text-blue-900" : "text-slate-900"
              }`}
            >
              {item.value || "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>

      <div className="mt-4 space-y-3">
        {rows.map((row, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3"
          >
            <span className="text-sm text-slate-500">{row.label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right">
              {row.value || "-"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SidebarStack(props: {
  noteText: string;
  setNoteText: (value: string) => void;
  onSaveNote: () => void;
  isNoteSaving: boolean;
  activityType: ActivityType;
  setActivityType: (value: ActivityType) => void;
  activityText: string;
  setActivityText: (value: string) => void;
  activityDueDate: string;
  setActivityDueDate: (value: string) => void;
  onSaveActivity: () => void;
  isActivitySaving: boolean;
  activities: Activity[];
  getUserName: (id: string) => string;
  onCompleteActivity: (activityId: string) => void;
  summaryRows: { label: string; value: string }[];
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <MessageSquare className="h-4 w-4 text-blue-600" />
          Hızlı Not
        </h4>

        <div className="mt-4 space-y-3">
          <Textarea
            value={props.noteText}
            onChange={(e) => props.setNoteText(e.target.value)}
            placeholder="Müşteriyle ilgili hızlı not ekleyin..."
            rows={4}
            className="resize-none rounded-2xl border-slate-200 bg-slate-50"
          />
          <Button
            onClick={props.onSaveNote}
            disabled={props.isNoteSaving || !props.noteText.trim()}
            className="h-11 w-full rounded-2xl bg-slate-900 hover:bg-slate-800"
          >
            <Save className="mr-2 h-4 w-4" />
            {props.isNoteSaving ? "Kaydediliyor..." : "Not Kaydet"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <ClipboardList className="h-4 w-4 text-emerald-600" />
          Aktivite Planla
        </h4>

        <div className="mt-4 space-y-3">
          <div className="space-y-2">
            <Label>Aktivite Türü</Label>
            <Select
              value={props.activityType}
              onValueChange={(v) => props.setActivityType(v as ActivityType)}
            >
              <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="task">Görev</SelectItem>
                <SelectItem value="call">Arama</SelectItem>
                <SelectItem value="meeting">Toplantı</SelectItem>
                <SelectItem value="note">Not</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              rows={3}
              value={props.activityText}
              onChange={(e) => props.setActivityText(e.target.value)}
              placeholder="Örn. Teklif revizyonu için aranacak."
              className="resize-none rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <Label>Termin Tarihi</Label>
            <Input
              type="date"
              value={props.activityDueDate}
              onChange={(e) => props.setActivityDueDate(e.target.value)}
              className="rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <Button
            onClick={props.onSaveActivity}
            disabled={props.isActivitySaving || !props.activityText.trim()}
            className="h-11 w-full rounded-2xl"
          >
            {props.isActivitySaving ? "Kaydediliyor..." : "Aktivite Kaydet"}
          </Button>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900">Özet Kartı</h4>
        <div className="mt-4 space-y-3">
          {props.summaryRows.map((row, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3"
            >
              <span className="text-sm text-slate-500">{row.label}</span>
              <span className="text-sm font-semibold text-slate-900 text-right">
                {row.value || "-"}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900">Planlı Aktiviteler</h4>

        <div className="mt-4 space-y-3">
          {props.activities.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Henüz aktivite yok
            </p>
          ) : (
            props.activities.map((activity) => (
              <div
                key={activity.id}
                className={`rounded-2xl border p-4 ${
                  activity.isCompleted
                    ? "border-slate-200 bg-slate-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        activity.isCompleted
                          ? "text-slate-500 line-through"
                          : "text-slate-900"
                      }`}
                    >
                      {activity.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(activity.createdAt)}</span>
                      <ChevronRight className="h-3 w-3" />
                      <span>{props.getUserName(activity.createdBy)}</span>
                      {activity.dueDate ? (
                        <>
                          <ChevronRight className="h-3 w-3" />
                          <span className="text-amber-600">
                            Termin: {formatDate(activity.dueDate)}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {!activity.isCompleted ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => props.onCompleteActivity(activity.id)}
                      className="shrink-0 rounded-xl"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function valueWithUnit(value?: number | null, unit?: string) {
  if (value == null) return "-";
  return `${Number(value).toLocaleString("tr-TR")} ${unit || ""}`.trim();
}

function formatBool(value?: boolean | null) {
  if (value === true) return "Evet";
  if (value === false) return "Hayır";
  return "Belirtilmemiş";
}