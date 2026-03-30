"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  DollarSign,
  Target,
  Phone,
  Calendar,
  Clock,
  TrendingUp,
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Toplam Müşteri"
          value={stats.total ?? 0}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Tahmini Değer"
          value={formatCurrency(stats.totalEstimatedValue ?? 0)}
          icon={DollarSign}
          color="bg-green-500"
        />
        <MetricCard
          title="Ağırlıklı Tahmin"
          value={formatCurrency(stats.weightedForecast ?? 0)}
          icon={Target}
          color="bg-purple-500"
        />
        <MetricCard
          title="Dönüşüm Oranı"
          value={`%${stats.conversionRate ?? 0}`}
          icon={TrendingUp}
          color="bg-orange-500"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Satış Hunisi Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <PipelineBar
              label={statusLabels.new}
              count={byStatus.new}
              total={stats.total ?? 0}
              color="bg-gray-500"
            />
            <PipelineBar
              label={statusLabels.contacted}
              count={byStatus.contacted}
              total={stats.total ?? 0}
              color="bg-blue-500"
            />
            <PipelineBar
              label={statusLabels.qualified}
              count={byStatus.qualified}
              total={stats.total ?? 0}
              color="bg-indigo-500"
            />
            <PipelineBar
              label={statusLabels.proposal}
              count={byStatus.proposal}
              total={stats.total ?? 0}
              color="bg-purple-500"
            />
            <PipelineBar
              label={statusLabels.negotiation}
              count={byStatus.negotiation}
              total={stats.total ?? 0}
              color="bg-yellow-500"
            />
            <PipelineBar
              label={statusLabels.closed_won}
              count={byStatus.closed_won}
              total={stats.total ?? 0}
              color="bg-green-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Yaklaşan Görevler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {upcomingActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Yaklaşan görev bulunmuyor
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingActivities.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {activityLabels[activity.type]}
                          </Badge>
                          {activity.dueDate && (
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Son Eklenen Müşteriler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {recentCustomers.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Henüz müşteri eklenmemiş
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCustomers.slice(0, 10).map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {customer.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {statusLabels[customer.status]}
                          </span>
                          {customer.estimatedValue && (
                            <span className="text-xs text-green-600">
                              {formatCurrency(customer.estimatedValue)}
                            </span>
                          )}
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

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Aylık Performans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {stats.monthlyNew ?? 0}
              </div>
              <div className="text-sm text-gray-100">Yeni Müşteri</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats.monthlyClosed ?? 0}
              </div>
              <div className="text-sm text-gray-600">Kapanan Satış</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {byProbability.high}
              </div>
              <div className="text-sm text-gray-600">Yüksek İhtimal</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {byProbability.medium + byProbability.low}
              </div>
              <div className="text-sm text-gray-600">Potansiyel</div>
            </div>
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
  color: string;
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold mt-1">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg`}>
            <Icon className="w-5 h-5 text-white" />
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
  color: string;
}

function PipelineBar({ label, count, total, color }: PipelineBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ₺`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K ₺`;
  }
  return `${value} ₺`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}