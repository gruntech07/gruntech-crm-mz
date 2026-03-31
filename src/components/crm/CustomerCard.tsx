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
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 ${getStatusStripe(
          customer.status
        )}`}
      />

      <CardContent className="p-4 pl-5">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-[17px] font-bold leading-snug text-slate-900">
              {customer.name}
            </h3>

            {customer.company ? (
              <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="truncate">{customer.company}</span>
              </div>
            ) : null}
          </div>

          <Badge
            variant="outline"
            className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold ${getProbabilityTone(
              customer.probability
            )}`}
          >
            {probabilityLabels[customer.probability]}
          </Badge>
        </div>

        <div className="space-y-1.5">
          {customer.phone ? (
            <InfoLine icon={<Phone className="h-4 w-4" />} value={customer.phone} />
          ) : (
            <InfoLine icon={<Phone className="h-4 w-4" />} value="-" muted />
          )}

          {(customer.city || customer.address) && (
            <InfoLine
              icon={<MapPin className="h-4 w-4" />}
              value={customer.city || customer.address || "-"}
            />
          )}

          {customer.email ? (
            <InfoLine
              icon={<Mail className="h-4 w-4" />}
              value={customer.email}
              href={`mailto:${customer.email}`}
            />
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2 text-emerald-600">
          <CircleDollarSign className="h-4 w-4 shrink-0" />
          <span className="text-[15px] font-semibold">
            {formatMoney(customer.estimatedValue)}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700">
              {statusLabels[customer.status]}
            </span>

            {customer.tags?.slice(0, 2).map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="rounded-md bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfoLine({
  icon,
  value,
  href,
  muted = false,
}: {
  icon: React.ReactNode;
  value: string;
  href?: string;
  muted?: boolean;
}) {
  const content = (
    <div
      className={`flex items-center gap-2 text-sm ${
        muted ? "text-slate-400" : "text-slate-600"
      }`}
    >
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{value}</span>
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

function getStatusStripe(status: Customer["status"]) {
  const tones: Record<Customer["status"], string> = {
    new: "bg-blue-500",
    contacted: "bg-sky-500",
    qualified: "bg-indigo-500",
    proposal: "bg-violet-500",
    negotiation: "bg-amber-500",
    closed_won: "bg-emerald-500",
    closed_lost: "bg-rose-500",
  };

  return tones[status] || "bg-slate-300";
}

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value));
}