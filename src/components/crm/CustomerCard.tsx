"use client";

import * as React from "react";
import type { Customer } from "@/types/customer";
import { probabilityLabels, statusLabels } from "@/types/customer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Mail,
  Building2,
  Calendar,
  ArrowUpRight,
  MapPin,
  CircleDollarSign,
} from "lucide-react";

interface CustomerCardProps {
  customer: Customer;
  onClick: () => void;
}

export function CustomerCard({ customer, onClick }: CustomerCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-slate-900">
              {customer.name}
            </h3>

            {customer.company ? (
              <div className="mt-1.5 flex items-center text-sm text-slate-500">
                <div className="mr-2 flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <span className="truncate font-medium">{customer.company}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className={`border px-3 py-1 text-xs font-semibold ${getProbabilityTone(
                customer.probability
              )}`}
            >
              {probabilityLabels[customer.probability]}
            </Badge>

            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              {statusLabels[customer.status]}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoMiniCard
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Telefon"
            value={customer.phone}
            href={`tel:${customer.phone}`}
          />

          <InfoMiniCard
            icon={<Calendar className="h-3.5 w-3.5" />}
            label="Son İletişim"
            value={formatDate(customer.lastContact)}
          />

          {customer.email ? (
            <div className="col-span-2">
              <InfoMiniCard
                icon={<Mail className="h-3.5 w-3.5" />}
                label="E-posta"
                value={customer.email}
                href={`mailto:${customer.email}`}
              />
            </div>
          ) : null}

          {(customer.city || customer.address) && (
            <div className="col-span-2">
              <InfoMiniCard
                icon={<MapPin className="h-3.5 w-3.5" />}
                label="Konum"
                value={customer.city || customer.address || "-"}
              />
            </div>
          )}

          <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
            <div className="mb-1 flex items-center gap-2 text-slate-500">
              <CircleDollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Tahmini Proje</span>
            </div>
            <div className="text-xl font-semibold text-slate-900">
              {formatMoney(customer.estimatedValue)}
            </div>
          </div>
        </div>

        {customer.lastContactNotes ? (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="mb-1 text-xs text-slate-500">Son Not</p>
            <p className="line-clamp-2 text-sm leading-6 text-slate-700">
              {customer.lastContactNotes}
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="rounded-full border-slate-200 bg-white text-xs"
            >
              {statusLabels[customer.status]}
            </Badge>

            {customer.tags?.slice(0, 2).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoMiniCard({
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
    <div className="rounded-2xl bg-slate-50 p-3 transition-colors hover:bg-slate-100">
      <div className="mb-1 flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="truncate text-sm font-medium text-slate-900">{value}</div>
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

function getProbabilityTone(probability: Customer["probability"]) {
  const tones: Record<Customer["probability"], string> = {
    high: "bg-emerald-50 text-emerald-700 border-emerald-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-orange-50 text-orange-700 border-orange-200",
    none: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return tones[probability];
}

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "Dün";
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta önce`;

  return date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}