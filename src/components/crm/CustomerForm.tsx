"use client";

import { useEffect, useMemo, useState } from "react";
import type { Customer, CustomerFormData, User as AppUser } from "@/types";
import { probabilityLabels, statusLabels, sourceLabels } from "@/types";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CircleDollarSign,
  Info,
  Plus,
  Tags,
  User,
  Users,
  X,
} from "lucide-react";

interface CustomerFormProps {
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => Promise<void> | void;
  currentUser: AppUser;
  users: AppUser[];
  teamLeads: AppUser[];
  allTags: string[];
}

const initialFormData: CustomerFormData = {
  name: "",
  company: "",
  phone: "",
  email: "",
  address: "",
  probability: "medium",
  estimatedValue: undefined,
  expectedCloseDate: "",
  status: "new",
  source: "other",
  tags: [],
  notes: "",
  lastContact: "",
  lastContactNotes: "",
  assignedTo: "",
  teamLeadId: "",
};

export function CustomerForm({
  customer,
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  users,
  teamLeads,
  allTags,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [newTag, setNewTag] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAssignOthers = currentUser.role === "admin";
  const canAssignTeamLead = currentUser.role === "admin";

  const salesReps = useMemo(
    () => users.filter((u) => u.role === "sales_rep" && u.isActive),
    [users]
  );

  const defaultAssignedTo = useMemo(() => {
    return currentUser.role === "admin" ? salesReps[0]?.id || "" : currentUser.id;
  }, [currentUser.id, currentUser.role, salesReps]);

  useEffect(() => {
    if (!isOpen) return;

    if (customer) {
      setFormData({
        name: customer.name || "",
        company: customer.company || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        probability: customer.probability || "medium",
        estimatedValue: customer.estimatedValue || undefined,
        expectedCloseDate: customer.expectedCloseDate || "",
        status: customer.status || "new",
        source: customer.source || "other",
        tags: customer.tags || [],
        notes: customer.notes || "",
        lastContact: customer.lastContact || "",
        lastContactNotes: customer.lastContactNotes || "",
        assignedTo: customer.assignedTo || "",
        teamLeadId: customer.teamLeadId || "",
      });
    } else {
      setFormData({
        ...initialFormData,
        assignedTo: defaultAssignedTo,
        teamLeadId: "",
      });
    }

    setSubmitError("");
    setIsSubmitting(false);
    setNewTag("");
  }, [customer, isOpen, defaultAssignedTo]);

  const handleChange = (field: keyof CustomerFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag || formData.tags.includes(tag)) return;
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmitError("Müşteri adı ve telefon zorunludur.");
      return;
    }

    try {
      setSubmitError("");
      setIsSubmitting(true);
      await onSubmit(formData);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Müşteri kaydedilemedi.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewValue =
    formData.estimatedValue != null
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(formData.estimatedValue)
      : "-";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100vw-6cm)] max-w-[1300px] h-[90vh] p-0 overflow-hidden rounded-[28px] border-0 bg-slate-100 shadow-2xl">
        <DialogTitle className="sr-only">
          {customer ? "Müşteri düzenle" : "Yeni müşteri ekle"}
        </DialogTitle>

        <form onSubmit={handleSubmit} className="flex h-full min-h-0 flex-col">
          <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                      {customer ? "Müşteri Düzenle" : "Yeni Müşteri"}
                    </h2>
                    <DialogDescription className="mt-1 text-sm text-slate-500">
                      Müşteri temel bilgileri, atama, notlar ve satış verilerini düzenleyin.
                    </DialogDescription>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
                <MiniSummaryCard
                  label="Durum"
                  value={statusLabels[formData.status] || "-"}
                />
                <MiniSummaryCard
                  label="Olasılık"
                  value={probabilityLabels[formData.probability] || "-"}
                />
                <MiniSummaryCard label="Tahmini Değer" value={previewValue} />
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
                    <User className="h-5 w-5 text-blue-600" />
                    <h3 className="text-xl font-bold text-slate-900">İletişim Bilgileri</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Müşteri Adı *">
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        placeholder="Ad Soyad veya Firma Yetkilisi"
                        required
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Firma">
                      <Input
                        value={formData.company}
                        onChange={(e) => handleChange("company", e.target.value)}
                        placeholder="Firma adı"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Telefon *">
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="05XX XXX XX XX"
                        required
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="E-posta">
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="ornek@email.com"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <div className="md:col-span-2">
                      <FormField label="Adres">
                        <Textarea
                          value={formData.address}
                          onChange={(e) => handleChange("address", e.target.value)}
                          placeholder="Açık adres bilgisi"
                          rows={3}
                          className="resize-none rounded-2xl border-slate-200 bg-slate-50"
                        />
                      </FormField>
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <CircleDollarSign className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-xl font-bold text-slate-900">Satış Bilgileri</h3>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <FormField label="Durum">
                      <Select
                        value={formData.status}
                        onValueChange={(v) => handleChange("status", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Satış Olasılığı">
                      <Select
                        value={formData.probability}
                        onValueChange={(v) => handleChange("probability", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(probabilityLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Kaynak">
                      <Select
                        value={formData.source}
                        onValueChange={(v) => handleChange("source", v)}
                      >
                        <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(sourceLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormField>

                    <FormField label="Tahmini Değer ($)">
                      <Input
                        type="number"
                        value={formData.estimatedValue ?? ""}
                        onChange={(e) =>
                          handleChange(
                            "estimatedValue",
                            e.target.value ? Number(e.target.value) : undefined
                          )
                        }
                        placeholder="100000"
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Beklenen Kapanış">
                      <Input
                        type="date"
                        value={formData.expectedCloseDate}
                        onChange={(e) =>
                          handleChange("expectedCloseDate", e.target.value)
                        }
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <FormField label="Son Temas Tarihi">
                      <Input
                        type="date"
                        value={formData.lastContact}
                        onChange={(e) => handleChange("lastContact", e.target.value)}
                        className="rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </FormField>

                    <div className="md:col-span-2 xl:col-span-3">
                      <FormField label="Son Temas Notu">
                        <Textarea
                          value={formData.lastContactNotes}
                          onChange={(e) =>
                            handleChange("lastContactNotes", e.target.value)
                          }
                          placeholder="Son telefon görüşmesi veya keşif notu..."
                          rows={3}
                          className="resize-none rounded-2xl border-slate-200 bg-slate-50"
                        />
                      </FormField>
                    </div>
                  </div>
                </section>

                {canAssignOthers && (
                  <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <Users className="h-5 w-5 text-violet-600" />
                      <h3 className="text-xl font-bold text-slate-900">Atama</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField label="Satış Temsilcisi">
                        <Select
                          value={formData.assignedTo || "none"}
                          onValueChange={(v) =>
                            handleChange("assignedTo", v === "none" ? "" : v)
                          }
                        >
                          <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                            <SelectValue placeholder="Temsilci seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {salesReps.length === 0 ? (
                              <SelectItem value="none">Aktif satış temsilcisi yok</SelectItem>
                            ) : (
                              salesReps.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </FormField>

                      {canAssignTeamLead && (
                        <FormField label="Ekip Lideri">
                          <Select
                            value={formData.teamLeadId || "none"}
                            onValueChange={(v) =>
                              handleChange("teamLeadId", v === "none" ? "" : v)
                            }
                          >
                            <SelectTrigger className="rounded-2xl border-slate-200 bg-slate-50">
                              <SelectValue placeholder="Ekip lideri seçin" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Atanmadı</SelectItem>
                              {teamLeads.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      )}
                    </div>
                  </section>
                )}

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Tags className="h-5 w-5 text-amber-600" />
                    <h3 className="text-xl font-bold text-slate-900">Etiketler</h3>
                  </div>

                  <div className="mb-3 flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Yeni etiket"
                      className="rounded-2xl border-slate-200 bg-slate-50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      className="rounded-2xl"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Ekle
                    </Button>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="flex items-center gap-1 rounded-full border-slate-200 bg-slate-50 px-3 py-1"
                        >
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {allTags.length > 0 && (
                    <div>
                      <div className="mb-2 text-xs text-slate-500">Hazır etiketler</div>
                      <div className="flex flex-wrap gap-2">
                        {allTags
                          .filter((t) => !formData.tags.includes(t))
                          .slice(0, 12)
                          .map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  tags: [...prev.tags, tag],
                                }))
                              }
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
                            >
                              + {tag}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5 text-slate-600" />
                    <h3 className="text-xl font-bold text-slate-900">Genel Notlar</h3>
                  </div>

                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Müşteri ile ilgili genel değerlendirme, teklif notu veya önemli bilgiler..."
                    rows={6}
                    className="resize-none rounded-2xl border-slate-200 bg-slate-50"
                  />
                </section>
              </div>

              <div className="space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Form Özeti</h3>

                  <div className="mt-4 space-y-3">
                    <MiniSummaryRow label="Müşteri" value={formData.name || "-"} />
                    <MiniSummaryRow label="Firma" value={formData.company || "-"} />
                    <MiniSummaryRow label="Telefon" value={formData.phone || "-"} />
                    <MiniSummaryRow
                      label="Durum"
                      value={statusLabels[formData.status] || "-"}
                    />
                    <MiniSummaryRow
                      label="Olasılık"
                      value={probabilityLabels[formData.probability] || "-"}
                    />
                    <MiniSummaryRow label="Tahmini Değer" value={previewValue} />
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900">Bilgi</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Bu form yalnızca müşteri temel bilgilerini günceller. Teknik veriler
                    ayrı teknik form üzerinden yönetilir.
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
                {isSubmitting
                  ? "Kaydediliyor..."
                  : customer
                  ? "Müşteri Güncelle"
                  : "Müşteri Kaydet"}
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