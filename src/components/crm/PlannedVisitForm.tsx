"use client";

import { useEffect, useRef, useState } from "react";
import type { PlannedVisit, PlannedVisitFormData } from "@/types/plannedVisit";
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

type SimpleUser = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
};

interface PlannedVisitFormProps {
  visit?: PlannedVisit | null;
  salesReps?: SimpleUser[];
  currentUser?: SimpleUser | null;
  onSubmit: (data: PlannedVisitFormData) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

const emptyForm: PlannedVisitFormData = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  city: "",
  district: "",
  address: "",
  sector: "",
  locationNote: "",
  remoteNotes: "",
  assignedToId: "",
  teamLeadId: "",
  plannedAt: "",
  visibilityScope: "assigned_only",
  visibilityUserIds: [],
};

function toLocalDateTimeInputValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function buildInitialForm(
  visit?: PlannedVisit | null,
  currentUser?: SimpleUser | null
): PlannedVisitFormData {
  if (visit) {
    return {
      companyName: visit.companyName || "",
      contactName: visit.contactName || "",
      phone: visit.phone || "",
      email: visit.email || "",
      city: visit.city || "",
      district: visit.district || "",
      address: visit.address || "",
      sector: visit.sector || "",
      locationNote: visit.locationNote || "",
      remoteNotes: visit.remoteNotes || "",
      assignedToId: visit.assignedToId || "",
      teamLeadId: visit.teamLeadId || "",
      plannedAt: toLocalDateTimeInputValue(visit.plannedAt),
      visibilityScope: visit.visibilityScope || "assigned_only",
      visibilityUserIds: visit.visibilityUserIds || [],
    };
  }

  return {
    ...emptyForm,
    teamLeadId: currentUser?.id || "",
  };
}

export function PlannedVisitForm({
  visit,
  salesReps = [],
  currentUser,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: PlannedVisitFormProps) {
  const [form, setForm] = useState<PlannedVisitFormData>(() =>
    buildInitialForm(visit, currentUser)
  );
  const [submitError, setSubmitError] = useState("");

  const initializedKeyRef = useRef<string>("");

  useEffect(() => {
    const key = visit?.id ? `edit:${visit.id}` : `new:${currentUser?.id || "anonymous"}`;

    if (initializedKeyRef.current === key) return;

    setForm(buildInitialForm(visit, currentUser));
    initializedKeyRef.current = key;
  }, [visit?.id, currentUser?.id, visit, currentUser]);

  const handleChange = (
    key: keyof PlannedVisitFormData,
    value: string | string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!form.companyName.trim()) {
      setSubmitError("Firma adı zorunludur.");
      return;
    }

    if (!form.plannedAt) {
      setSubmitError("Planlanan ziyaret tarihi zorunludur.");
      return;
    }

    try {
      await onSubmit({
        ...form,
        companyName: form.companyName.trim(),
        contactName: form.contactName?.trim() || "",
        phone: form.phone?.trim() || "",
        email: form.email?.trim() || "",
        city: form.city?.trim() || "",
        district: form.district?.trim() || "",
        address: form.address?.trim() || "",
        sector: form.sector?.trim() || "",
        locationNote: form.locationNote?.trim() || "",
        remoteNotes: form.remoteNotes?.trim() || "",
        assignedToId: form.assignedToId || "",
        teamLeadId: form.teamLeadId || "",
        plannedAt: new Date(form.plannedAt).toISOString(),
        visibilityScope: form.visibilityScope || "assigned_only",
        visibilityUserIds: form.visibilityUserIds || [],
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Planlanan ziyaret kaydedilemedi."
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Firma Adı *</Label>
          <Input
            id="companyName"
            value={form.companyName}
            onChange={(e) => handleChange("companyName", e.target.value)}
            placeholder="Örn. Akdeniz Tarım"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sector">Sektör</Label>
          <Input
            id="sector"
            value={form.sector}
            onChange={(e) => handleChange("sector", e.target.value)}
            placeholder="Örn. Tarım, Otel, Sanayi"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">İlgili Kişi</Label>
          <Input
            id="contactName"
            value={form.contactName}
            onChange={(e) => handleChange("contactName", e.target.value)}
            placeholder="Varsa ilgili kişi adı"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="Varsa telefon"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-posta</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="Varsa e-posta"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plannedAt">Planlanan Ziyaret Tarihi *</Label>
          <Input
            id="plannedAt"
            type="datetime-local"
            value={form.plannedAt}
            onChange={(e) => handleChange("plannedAt", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">İl</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Örn. Antalya"
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="district">İlçe</Label>
          <Input
            id="district"
            value={form.district}
            onChange={(e) => handleChange("district", e.target.value)}
            placeholder="Örn. Kepez"
            className="rounded-xl"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Açık Konum / Adres</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Açık adres veya tarif"
          className="rounded-xl"
        />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="locationNote">Konum Notu</Label>
          <Textarea
            id="locationNote"
            value={form.locationNote}
            onChange={(e) => handleChange("locationNote", e.target.value)}
            placeholder="Çatı yapısı, tarla konumu, sanayi bölgesi bilgisi vb."
            className="min-h-[110px] rounded-2xl"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="remoteNotes">Uzaktan Tespit Edilen Notlar</Label>
          <Textarea
            id="remoteNotes"
            value={form.remoteNotes}
            onChange={(e) => handleChange("remoteNotes", e.target.value)}
            placeholder="Google Maps, uydu görünümü veya saha ön bilgileri"
            className="min-h-[110px] rounded-2xl"
          />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Atanan Satış Personeli</Label>
          <Select
            value={form.assignedToId || "__none__"}
            onValueChange={(value) =>
              handleChange("assignedToId", value === "__none__" ? "" : value)
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Personel seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Atama yok</SelectItem>
              {salesReps.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ekip Lideri</Label>
          <Select
            value={form.teamLeadId || "__none__"}
            onValueChange={(value) =>
              handleChange("teamLeadId", value === "__none__" ? "" : value)
            }
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Ekip lideri seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Yok</SelectItem>
              {salesReps.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Görünürlük</Label>
          <Select
            value={form.visibilityScope || "assigned_only"}
            onValueChange={(value) => handleChange("visibilityScope", value)}
          >
            <SelectTrigger className="rounded-xl">
              <SelectValue placeholder="Görünürlük seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="private">Sadece oluşturan</SelectItem>
              <SelectItem value="assigned_only">Oluşturan + atanan</SelectItem>
              <SelectItem value="team">Takım görünümü</SelectItem>
              <SelectItem value="custom">Özel görünürlük</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {submitError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-xl"
          >
            Vazgeç
          </Button>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl"
        >
          {isSubmitting
            ? "Kaydediliyor..."
            : visit
            ? "Ziyaret Planını Güncelle"
            : "Ziyaret Planı Oluştur"}
        </Button>
      </div>
    </form>
  );
}