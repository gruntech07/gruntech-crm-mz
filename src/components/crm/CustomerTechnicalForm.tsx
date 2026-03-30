"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer } from "@/types";
import {
  hybridInverterPreferenceLabels,
  roofSuitabilityLabels,
} from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Battery,
  Factory,
  Gauge,
  Home,
  Settings2,
  Zap,
} from "lucide-react";

export interface CustomerTechnicalFormData {
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
}

interface CustomerTechnicalFormProps {
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerTechnicalFormData) => Promise<void> | void;
}

const initialFormData: CustomerTechnicalFormData = {
  roofSuitable: "",
  roofAreaM2: null,
  transformerPowerKva: null,
  contractPowerKw: null,
  monthlyConsumptionKwh: null,
  monthlyBillTl: null,
  wantsBackupPower: null,
  batteryRequested: null,
  hasCriticalLoads: null,
  criticalLoadsDescription: "",
  hybridInverterPreference: "",
  wantsAlternativeProposal: null,
  alternativeProposalNotes: "",
};

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function booleanToSelectValue(value: boolean | null | undefined): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return "unknown";
}

function selectValueToBoolean(value: string): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function CustomerTechnicalForm({
  customer,
  isOpen,
  onClose,
  onSubmit,
}: CustomerTechnicalFormProps) {
  const [formData, setFormData] =
    useState<CustomerTechnicalFormData>(initialFormData);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roofOptions = useMemo(
    () => [
      { value: "evet", label: roofSuitabilityLabels.evet ?? "Evet" },
      { value: "hayir", label: roofSuitabilityLabels.hayir ?? "Hayır" },
      {
        value: "bilinmiyor",
        label: roofSuitabilityLabels.bilinmiyor ?? "Bilinmiyor",
      },
    ],
    []
  );

  const hybridOptions = useMemo(
    () => [
      {
        value: "evaluate",
        label: hybridInverterPreferenceLabels.evaluate ?? "Değerlendirilecek",
      },
      { value: "yes", label: hybridInverterPreferenceLabels.yes ?? "İsteniyor" },
      { value: "no", label: hybridInverterPreferenceLabels.no ?? "İstenmiyor" },
    ],
    []
  );

  useEffect(() => {
    if (!isOpen) return;

    if (customer) {
      setFormData({
        roofSuitable: customer.roofSuitable ?? "",
        roofAreaM2: customer.roofAreaM2 ?? null,
        transformerPowerKva: customer.transformerPowerKva ?? null,
        contractPowerKw: customer.contractPowerKw ?? null,
        monthlyConsumptionKwh: customer.monthlyConsumptionKwh ?? null,
        monthlyBillTl: customer.monthlyBillTl ?? null,
        wantsBackupPower: customer.wantsBackupPower ?? null,
        batteryRequested: customer.batteryRequested ?? null,
        hasCriticalLoads: customer.hasCriticalLoads ?? null,
        criticalLoadsDescription: customer.criticalLoadsDescription ?? "",
        hybridInverterPreference: customer.hybridInverterPreference ?? "",
        wantsAlternativeProposal: customer.wantsAlternativeProposal ?? null,
        alternativeProposalNotes: customer.alternativeProposalNotes ?? "",
      });
    } else {
      setFormData(initialFormData);
    }

    setSubmitError("");
    setIsSubmitting(false);
  }, [customer, isOpen]);

  const handleChange = (
    field: keyof CustomerTechnicalFormData,
    value: string | number | boolean | null
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitError("");
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Teknik bilgiler kaydedilemedi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const technicalSummary = [
    {
      label: "Çatı Alanı",
      value: formData.roofAreaM2 != null ? `${formData.roofAreaM2} m²` : "-",
    },
    {
      label: "Trafo Gücü",
      value:
        formData.transformerPowerKva != null
          ? `${formData.transformerPowerKva} kVA`
          : "-",
    },
    {
      label: "Aylık Tüketim",
      value:
        formData.monthlyConsumptionKwh != null
          ? `${formData.monthlyConsumptionKwh} kWh`
          : "-",
    },
    {
      label: "Aylık Fatura",
      value:
        formData.monthlyBillTl != null
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(formData.monthlyBillTl)
          : "-",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-6cm)] max-w-[1300px] h-[90vh] p-0 overflow-hidden rounded-[28px] border-0 bg-slate-100 shadow-2xl">
        <DialogTitle className="sr-only">Teknik müşteri bilgilerini düzenle</DialogTitle>

        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      Teknik Bilgileri Güncelle
                    </h2>
                    <DialogDescription className="mt-1 text-sm text-slate-500">
                      Çatı, trafo, tüketim, batarya ve hibrit yapı bilgilerini düzenleyin.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:w-[360px]">
                {technicalSummary.map((item) => (
                  <MiniSummaryCard
                    key={item.label}
                    label={item.label}
                    value={item.value}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,2.2fr)_360px]">
              <div className="space-y-6">
                {submitError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {submitError}
                  </div>
                ) : null}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Home className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">
                      Saha ve Teknik Uygunluk
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <FormField label="Çatı Uygunluğu">
                      <Select
                        value={formData.roofSuitable || "unknown"}
                        onValueChange={(v) =>
                          handleChange("roofSuitable", v === "unknown" ? "" : v)
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          {roofOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Tahmini Çatı Alanı (m²)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={formData.roofAreaM2 ?? ""}
                        onChange={(e) =>
                          handleChange("roofAreaM2", toNullableNumber(e.target.value))
                        }
                        placeholder="Örn. 500"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Trafo Gücü (kVA)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={formData.transformerPowerKva ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "transformerPowerKva",
                            toNullableNumber(e.target.value)
                          )
                        }
                        placeholder="Örn. 250"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Sözleşme Gücü (kW)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={formData.contractPowerKw ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "contractPowerKw",
                            toNullableNumber(e.target.value)
                          )
                        }
                        placeholder="Örn. 196"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Factory className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-bold text-slate-900">
                      Tüketim ve Fatura Profili
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Aylık Tüketim (kWh)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={formData.monthlyConsumptionKwh ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "monthlyConsumptionKwh",
                            toNullableNumber(e.target.value)
                          )
                        }
                        placeholder="Örn. 20000"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Aylık Fatura ($)">
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={formData.monthlyBillTl ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "monthlyBillTl",
                            toNullableNumber(e.target.value)
                          )
                        }
                        placeholder="Örn. 65000"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Battery className="h-5 w-5 text-violet-600" />
                    <h3 className="text-xl font-bold text-slate-900">
                      Kesinti, Batarya ve Hibrit Yapı
                    </h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Kesintide Enerji İstiyor mu?">
                      <Select
                        value={booleanToSelectValue(formData.wantsBackupPower)}
                        onValueChange={(v) =>
                          handleChange("wantsBackupPower", selectValueToBoolean(v))
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          <SelectItem value="true">Evet</SelectItem>
                          <SelectItem value="false">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Batarya Talebi">
                      <Select
                        value={booleanToSelectValue(formData.batteryRequested)}
                        onValueChange={(v) =>
                          handleChange("batteryRequested", selectValueToBoolean(v))
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          <SelectItem value="true">Evet</SelectItem>
                          <SelectItem value="false">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Kritik Yükler Var mı?">
                      <Select
                        value={booleanToSelectValue(formData.hasCriticalLoads)}
                        onValueChange={(v) =>
                          handleChange("hasCriticalLoads", selectValueToBoolean(v))
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          <SelectItem value="true">Evet</SelectItem>
                          <SelectItem value="false">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <div className="xl:col-span-3">
                      <FormField label="Kritik Yük Açıklaması">
                        <Textarea
                          value={formData.criticalLoadsDescription ?? ""}
                          onChange={(e) =>
                            handleChange("criticalLoadsDescription", e.target.value)
                          }
                          placeholder="Örn. CNC, sunucu odası, soğutma, otomasyon, üretim hattı..."
                          rows={4}
                          className="resize-none rounded-2xl border-slate-200 bg-slate-50"
                        />
                      </FormField>
                    </div>

                    <FormField label="Hibrit İnverter Tercihi">
                      <Select
                        value={formData.hybridInverterPreference || "unknown"}
                        onValueChange={(v) =>
                          handleChange(
                            "hybridInverterPreference",
                            v === "unknown" ? "" : v
                          )
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          {hybridOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Alternatif Teklif İstiyor mu?">
                      <Select
                        value={booleanToSelectValue(formData.wantsAlternativeProposal)}
                        onValueChange={(v) =>
                          handleChange(
                            "wantsAlternativeProposal",
                            selectValueToBoolean(v)
                          )
                        }
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue placeholder="Seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unknown">Bilinmiyor</SelectItem>
                          <SelectItem value="true">Evet</SelectItem>
                          <SelectItem value="false">Hayır</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormField>

                    <div className="xl:col-span-3">
                      <FormField label="Alternatif Teklif Notu">
                        <Textarea
                          value={formData.alternativeProposalNotes ?? ""}
                          onChange={(e) =>
                            handleChange("alternativeProposalNotes", e.target.value)
                          }
                          placeholder="Örn. Bataryalı ve bataryasız iki teklif hazırlansın, hibrit alternatif değerlendirilsin..."
                          rows={4}
                          className="resize-none rounded-2xl border-slate-200 bg-slate-50"
                        />
                      </FormField>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-slate-600" />
                    <h3 className="text-lg font-bold text-slate-900">Teknik Özet</h3>
                  </div>

                  <div className="mt-4 space-y-3">
                    {technicalSummary.map((item) => (
                      <MiniSummaryRow
                        key={item.label}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                    <MiniSummaryRow
                      label="Batarya"
                      value={
                        formData.batteryRequested === true
                          ? "Evet"
                          : formData.batteryRequested === false
                          ? "Hayır"
                          : "-"
                      }
                    />
                    <MiniSummaryRow
                      label="Kritik Yük"
                      value={
                        formData.hasCriticalLoads === true
                          ? "Evet"
                          : formData.hasCriticalLoads === false
                          ? "Hayır"
                          : "-"
                      }
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-900">Bilgi</h3>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Bu form teknik keşif ve teklif hazırlık alanları içindir. Müşteri
                    temel iletişim bilgileri genel müşteri formundan güncellenir.
                  </p>
                </section>
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-white px-6 py-4">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 rounded-2xl border-slate-200 px-6"
              >
                İptal
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="h-11 rounded-2xl px-6"
              >
                {isSubmitting ? "Kaydediliyor..." : "Teknik Bilgileri Kaydet"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MiniSummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function MiniSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}