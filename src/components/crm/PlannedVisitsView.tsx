"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  MapPin,
  Building2,
  User2,
  Phone,
  FileText,
  Search,
  Plus,
  Pencil,
  CheckCircle2,
  Ban,
  RotateCcw,
  ArrowRightLeft,
  Trash2,
  Loader2,
} from "lucide-react";

import type { PlannedVisit } from "@/types/plannedVisit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PlannedVisitsViewProps = {
  plannedVisits: PlannedVisit[];
  isLoading?: boolean;
  error?: string;
  onCreate: () => void;
  onEdit: (visit: PlannedVisit) => void;
  onRefresh?: () => Promise<void> | void;
  onDelete: (visit: PlannedVisit) => Promise<void> | void;
  onUpdateStatus: (
    visit: PlannedVisit,
    status: "VISITED" | "POSTPONED" | "CANCELLED"
  ) => Promise<void> | void;
  onConvert: (visit: PlannedVisit) => Promise<void> | void;
};

const statusMap: Record<
  PlannedVisit["status"],
  { label: string; className: string }
> = {
  PLANNED: {
    label: "Planlandı",
    className: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  VISITED: {
    label: "Ziyaret Edildi",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  POSTPONED: {
    label: "Ertelendi",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  CANCELLED: {
    label: "İptal",
    className: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  },
  CONVERTED: {
    label: "Müşteriye Dönüştü",
    className:
      "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function SummaryCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: number;
  helper: string;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-5">
        <div className="text-sm text-slate-500">{title}</div>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {value}
        </div>
        <div className="mt-2 text-xs text-slate-500">{helper}</div>
      </CardContent>
    </Card>
  );
}

export function PlannedVisitsView({
  plannedVisits,
  isLoading = false,
  error = "",
  onCreate,
  onEdit,
  onRefresh,
  onDelete,
  onUpdateStatus,
  onConvert,
}: PlannedVisitsViewProps) {
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredVisits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plannedVisits;

    return plannedVisits.filter((visit) => {
      return [
        visit.companyName,
        visit.contactName,
        visit.phone,
        visit.city,
        visit.district,
        visit.sector,
        visit.locationNote,
        visit.remoteNotes,
        visit.assignedTo?.name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [plannedVisits, query]);

  const stats = useMemo(() => {
    return {
      total: plannedVisits.length,
      planned: plannedVisits.filter((x) => x.status === "PLANNED").length,
      visited: plannedVisits.filter((x) => x.status === "VISITED").length,
      postponed: plannedVisits.filter((x) => x.status === "POSTPONED").length,
      cancelled: plannedVisits.filter((x) => x.status === "CANCELLED").length,
      converted: plannedVisits.filter((x) => x.status === "CONVERTED").length,
    };
  }, [plannedVisits]);

  const handleAsync = async (id: string, fn: () => Promise<void> | void) => {
    try {
      setBusyId(id);
      await fn();
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "İşlem sırasında hata oluştu."
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <SummaryCard
          title="Toplam Plan"
          value={stats.total}
          helper="Ziyaret havuzundaki tüm kayıtlar"
        />
        <SummaryCard
          title="Planlandı"
          value={stats.planned}
          helper="Henüz ziyaret edilmemiş kayıtlar"
        />
        <SummaryCard
          title="Ziyaret Edildi"
          value={stats.visited}
          helper="Saha görüşmesi yapılmış kayıtlar"
        />
        <SummaryCard
          title="Ertelendi"
          value={stats.postponed}
          helper="Daha sonra tekrar gidilecek"
        />
        <SummaryCard
          title="İptal"
          value={stats.cancelled}
          helper="Takip dışı bırakılan kayıtlar"
        />
        <SummaryCard
          title="Müşteriye Dönüştü"
          value={stats.converted}
          helper="Artık müşteri kartına taşınmış kayıtlar"
        />
      </div>

      <Card className="rounded-3xl border-slate-200 shadow-sm">
        <CardHeader className="gap-4 border-b border-slate-100 pb-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-slate-900">
                Planlanan Ziyaretler
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Aday müşteri havuzu, saha planı ve müşteriye dönüştürme akışı
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {onRefresh ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => void onRefresh()}
                >
                  Yenile
                </Button>
              ) : null}

              <Button type="button" onClick={onCreate} className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Yeni Ziyaret Planı
              </Button>
            </div>
          </div>

          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Firma adı, sektör, konum, ilgili kişi veya not ara"
              className="rounded-2xl pl-10"
            />
          </div>
        </CardHeader>

        <CardContent className="p-5 md:p-6">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Planlanan ziyaretler yükleniyor...
              </div>
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
              <div className="mx-auto max-w-md">
                <div className="text-lg font-medium text-slate-900">
                  Planlanan ziyaret bulunamadı
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Henüz kayıt yoksa yeni ziyaret planı oluşturabilirsin.
                  Arama yaptıysan filtreyi temizleyip tekrar bak.
                </p>
                <div className="mt-5">
                  <Button onClick={onCreate} className="rounded-xl">
                    <Plus className="mr-2 h-4 w-4" />
                    Yeni Ziyaret Planı
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filteredVisits.map((visit) => {
                const statusInfo = statusMap[visit.status];
                const isBusy = busyId === visit.id;
                const canConvert =
                  visit.status !== "CONVERTED" && !visit.customerId;

                return (
                  <div
                    key={visit.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                              <Building2 className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">
                              {visit.companyName}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant="outline"
                              className={`rounded-full px-3 py-1 text-xs ${statusInfo.className}`}
                            >
                              {statusInfo.label}
                            </Badge>

                            {visit.sector ? (
                              <Badge
                                variant="outline"
                                className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600"
                              >
                                {visit.sector}
                              </Badge>
                            ) : null}

                            {visit.customerId ? (
                              <Badge
                                variant="outline"
                                className="rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs text-violet-700"
                              >
                                Müşteri kaydı oluştu
                              </Badge>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2 text-sm text-slate-600">
                            <CalendarDays className="h-4 w-4" />
                            {formatDate(visit.plannedAt)}
                          </div>
                          <div className="mt-1 flex items-center justify-end gap-2 text-sm font-medium text-slate-900">
                            <Clock3 className="h-4 w-4" />
                            {formatTime(visit.plannedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <MapPin className="h-4 w-4" />
                            Konum
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>
                              {[visit.city, visit.district]
                                .filter(Boolean)
                                .join(" / ") || "-"}
                            </p>
                            <p>{visit.address || visit.locationNote || "-"}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <User2 className="h-4 w-4" />
                            İlgili / Atanan
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{visit.contactName || "İlgili kişi yok"}</p>
                            <p>{visit.assignedTo?.name || "Atanan personel yok"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <Phone className="h-4 w-4" />
                            İletişim
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{visit.phone || "-"}</p>
                            <p>{visit.email || "-"}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 p-4">
                          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                            <FileText className="h-4 w-4" />
                            Sonuç / Not
                          </div>
                          <div className="space-y-1 text-sm text-slate-600">
                            <p>{visit.visitResult || "Henüz ziyaret sonucu yok"}</p>
                            <p className="line-clamp-2">
                              {visit.remoteNotes || visit.visitNotes || "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                        Oluşturulma: {formatDateTime(visit.createdAt)} · Son güncelleme:{" "}
                        {formatDateTime(visit.updatedAt)}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={isBusy}
                          onClick={() => onEdit(visit)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Düzenle
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          disabled={isBusy || visit.status === "CONVERTED"}
                          onClick={() =>
                            void handleAsync(visit.id, async () => {
                              await onUpdateStatus(visit, "VISITED");
                            })
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Ziyaret Edildi
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                          disabled={isBusy || visit.status === "CONVERTED"}
                          onClick={() =>
                            void handleAsync(visit.id, async () => {
                              await onUpdateStatus(visit, "POSTPONED");
                            })
                          }
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Ertele
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl border-red-200 text-red-700 hover:bg-red-50"
                          disabled={isBusy || visit.status === "CONVERTED"}
                          onClick={() =>
                            void handleAsync(visit.id, async () => {
                              await onUpdateStatus(visit, "CANCELLED");
                            })
                          }
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          İptal
                        </Button>

                        <Button
                          type="button"
                          className="rounded-xl"
                          disabled={isBusy || !canConvert}
                          onClick={() =>
                            void handleAsync(visit.id, async () => {
                              await onConvert(visit);
                            })
                          }
                        >
                          <ArrowRightLeft className="mr-2 h-4 w-4" />
                          Müşteriye Dönüştür
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          disabled={isBusy}
                          onClick={() =>
                            void handleAsync(visit.id, async () => {
                              await onDelete(visit);
                            })
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Sil
                        </Button>
                      </div>

                      {isBusy ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          İşlem uygulanıyor...
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}