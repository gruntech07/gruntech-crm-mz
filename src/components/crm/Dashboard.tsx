"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  CircleDollarSign,
  Phone,
  BarChart3,
} from "lucide-react";
import type { Customer, Activity } from "@/types";
import { statusLabels, activityLabels } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DashboardProps {
  stats: {
    total: number;
    byStatus?: Record<string, number>;
    byProbability?: Record<string, number>;
    totalEstimatedValue: number;
    weightedForecast: number;
    monthlyNew: number;
    monthlyClosed: number;
    conversionRate: number;
  };
  recentCustomers: Customer[];
  upcomingActivities: Activity[];
}

export function Dashboard({
  stats,
  recentCustomers,
  upcomingActivities,
}: DashboardProps) {
  const byStatus = {
    new: stats.byStatus?.new ?? 0,
    contacted: stats.byStatus?.contacted ?? 0,
    qualified: stats.byStatus?.qualified ?? 0,
    proposal: stats.byStatus?.proposal ?? 0,
    negotiation: stats.byStatus?.negotiation ?? 0,
    closed_won: stats.byStatus?.closed_won ?? 0,
    closed_lost: stats.byStatus?.closed_lost ?? 0,
  };

  const byProbability = {
    high: stats.byProbability?.high ?? 0,
    medium: stats.byProbability?.medium ?? 0,
    low: stats.byProbability?.low ?? 0,
    none: stats.byProbability?.none ?? 0,
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          title="Toplam Müşteri"
          value={stats.total ?? 0}
          icon={Users}
          tone="blue"
        />
        <MetricCard
          title="Tahmini Değer"
          value={formatCurrency(stats.totalEstimatedValue ?? 0)}
          icon={CircleDollarSign}
          tone="green"
        />
        <MetricCard
          title="Ağırlıklı Tahmin"
          value={formatCurrency(stats.weightedForecast ?? 0)}
          icon={Target}
          tone="violet"
        />
        <MetricCard
          title="Dönüşüm Oranı"
          value={`%${stats.conversionRate ?? 0}`}
          icon={TrendingUp}
          tone="amber"
        />
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center text-base font-semibold text-slate-900">
            <BarChart3 className="mr-2 h-4 w-4" />
            Satış Hunisi Durumu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PipelineBar
            label={statusLabels.new}
            count={byStatus.new}
            total={stats.total ?? 0}
            tone="bg-slate-500"
          />
          <PipelineBar
            label={statusLabels.contacted}
            count={byStatus.contacted}
            total={stats.total ?? 0}
            tone="bg-sky-500"
          />
          <PipelineBar
            label={statusLabels.qualified}
            count={byStatus.qualified}
            total={stats.total ?? 0}
            tone="bg-indigo-500"
          />
          <PipelineBar
            label={statusLabels.proposal}
            count={byStatus.proposal}
            total={stats.total ?? 0}
            tone="bg-violet-500"
          />
          <PipelineBar
            label={statusLabels.negotiation}
            count={byStatus.negotiation}
            total={stats.total ?? 0}
            tone="bg-amber-500"
          />
          <PipelineBar
            label={statusLabels.closed_won}
            count={byStatus.closed_won}
            total={stats.total ?? 0}
            tone="bg-emerald-500"
          />
          <PipelineBar
            label={statusLabels.closed_lost}
            count={byStatus.closed_lost}
            total={stats.total ?? 0}
            tone="bg-rose-500"
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base font-semibold text-slate-900">
              <Clock className="mr-2 h-4 w-4" />
              Yaklaşan Görevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              {upcomingActivities.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Yaklaşan görev bulunmuyor
                </p>
              ) : (
                <div className="space-y-2.5">
                  {upcomingActivities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <Calendar className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {activity.description}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white text-[11px]"
                            >
                              {activityLabels[activity.type]}
                            </Badge>

                            {activity.dueDate ? (
                              <span className="text-xs text-slate-500">
                                {formatDateTime(activity.dueDate)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-base font-semibold text-slate-900">
              <Users className="mr-2 h-4 w-4" />
              Son Eklenen Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72">
              {recentCustomers.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  Henüz müşteri eklenmemiş
                </p>
              ) : (
                <div className="space-y-2.5">
                  {recentCustomers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                          <Phone className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {customer.name}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className="rounded-full border-slate-200 bg-white text-[11px]"
                            >
                              {statusLabels[customer.status]}
                            </Badge>

                            {customer.estimatedValue ? (
                              <span className="text-xs font-medium text-emerald-600">
                                {formatCurrency(customer.estimatedValue)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-900">
            Aylık Performans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <MiniStatBox
              value={stats.monthlyNew ?? 0}
              label="Yeni Müşteri"
              tone="blue"
            />
            <MiniStatBox
              value={stats.monthlyClosed ?? 0}
              label="Kapanan Satış"
              tone="green"
            />
            <MiniStatBox
              value={byProbability.high}
              label="Yüksek İhtimal"
              tone="violet"
            />
            <MiniStatBox
              value={byProbability.medium + byProbability.low}
              label="Potansiyel"
              tone="amber"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tone: "blue" | "green" | "violet" | "amber";
}

function MetricCard({ title, value, icon: Icon, tone }: MetricCardProps) {
  const toneMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 truncate text-2xl font-bold leading-none text-slate-900">
              {value}
            </p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${toneMap[tone]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PipelineBarProps {
  label: string;
  count: number;
  total: number;
  tone: string;
}

function PipelineBar({ label, count, total, tone }: PipelineBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="mb-1.5 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-semibold text-slate-900">{count}</span>
      </div>

      <div className="h-2.5 w-full rounded-full bg-slate-200">
        <div
          className={`${tone} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function MiniStatBox({
  value,
  label,
  tone,
}: {
  value: string | number;
  label: string;
  tone: "blue" | "green" | "violet" | "amber";
}) {
  const toneMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className={`rounded-2xl p-4 text-center ${toneMap[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-sm text-slate-600">{label}</div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Mn $`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)} Bin $`;
  }
  return `${value.toLocaleString("tr-TR")} $`;
}

function formatDateTime(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleString("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
      });
}