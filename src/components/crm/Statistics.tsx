"use client";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { probabilityLabels, statusLabels } from '@/types/customer';
import { Users, TrendingUp, Phone, CheckCircle } from 'lucide-react';

interface StatisticsProps {
  total: number;
  byProbability: {
    high: number;
    medium: number;
    low: number;
    none: number;
  };
  byStatus: {
    new: number;
    contacted: number;
    negotiating: number;
    closed_won: number;
    closed_lost: number;
  };
}

export function Statistics({ total, byProbability, byStatus }: StatisticsProps) {
  const activeCustomers = byStatus.new + byStatus.contacted + byStatus.negotiating;
  const wonCustomers = byStatus.closed_won;
  const conversionRate = total > 0 ? Math.round((wonCustomers / total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Ana İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Toplam Müşteri</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Aktif Müşteri</p>
                <p className="text-2xl font-bold">{activeCustomers}</p>
              </div>
              <Phone className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tamamlanan Satış</p>
                <p className="text-2xl font-bold">{wonCustomers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Dönüşüm Oranı</p>
                <p className="text-2xl font-bold">%{conversionRate}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satış Olasılığı Dağılımı */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Satış Olasılığı Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <ProbabilityBar 
              label={probabilityLabels.high} 
              count={byProbability.high} 
              total={total}
              color="bg-green-500"
            />
            <ProbabilityBar 
              label={probabilityLabels.medium} 
              count={byProbability.medium} 
              total={total}
              color="bg-yellow-500"
            />
            <ProbabilityBar 
              label={probabilityLabels.low} 
              count={byProbability.low} 
              total={total}
              color="bg-orange-500"
            />
            <ProbabilityBar 
              label={probabilityLabels.none} 
              count={byProbability.none} 
              total={total}
              color="bg-red-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Durum Dağılımı */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Müşteri Durum Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatusBox label={statusLabels.new} count={byStatus.new} color="bg-gray-100" />
            <StatusBox label={statusLabels.contacted} count={byStatus.contacted} color="bg-blue-100" />
            <StatusBox label={statusLabels.negotiating} count={byStatus.negotiating} color="bg-yellow-100" />
            <StatusBox label={statusLabels.closed_won} count={byStatus.closed_won} color="bg-green-100" />
            <StatusBox label={statusLabels.closed_lost} count={byStatus.closed_lost} color="bg-red-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ProbabilityBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

function ProbabilityBar({ label, count, total, color }: ProbabilityBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-medium">{count} (%{Math.round(percentage)})</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface StatusBoxProps {
  label: string;
  count: number;
  color: string;
}

function StatusBox({ label, count, color }: StatusBoxProps) {
  return (
    <div className={`${color} p-3 rounded-lg text-center`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs text-gray-600">{label}</div>
    </div>
  );
}
