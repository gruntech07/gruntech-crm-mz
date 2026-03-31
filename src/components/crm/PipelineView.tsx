"use client";
import * as React from "react";
import { useState } from 'react';
import type { Customer, CustomerStatus } from '@/types';
import { statusColors } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { 
  Phone, 
  Building2, 
  DollarSign, 
  Calendar,
  MoreHorizontal 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface PipelineViewProps {
  customers: Customer[];
  onCustomerClick: (customer: Customer) => void;
  onStatusChange: (customerId: string, newStatus: CustomerStatus) => void;
}

const stages: { id: CustomerStatus; name: string }[] = [
  { id: 'new', name: 'Yeni' },
  { id: 'contacted', name: 'İletişim' },
  { id: 'qualified', name: 'Değerlendirme' },
  { id: 'proposal', name: 'Teklif' },
  { id: 'negotiation', name: 'Görüşme' },
  { id: 'closed_won', name: 'Kazanıldı' },
  { id: 'closed_lost', name: 'Kaybedildi' }
];

export function PipelineView({ customers, onCustomerClick, onStatusChange }: PipelineViewProps) {
  const [draggedCustomer, setDraggedCustomer] = useState<Customer | null>(null);

  const getCustomersByStatus = (status: CustomerStatus) => {
    return customers.filter(c => c.status === status);
  };

  const handleDragStart = (customer: Customer) => {
    setDraggedCustomer(customer);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: CustomerStatus) => {
    e.preventDefault();
    if (draggedCustomer && draggedCustomer.status !== status) {
      onStatusChange(draggedCustomer.id, status);
      setDraggedCustomer(null);
    }
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-4 pb-4 min-w-max">
        {stages.map((stage) => {
          const stageCustomers = getCustomersByStatus(stage.id);
          const totalValue = stageCustomers.reduce((sum, c) => sum + (c.estimatedValue || 0), 0);

          return (
            <div
              key={stage.id}
              className="w-72 flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="bg-gray-100 rounded-lg p-3">
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${statusColors[stage.id]}`} />
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageCustomers.length}
                  </Badge>
                </div>

                {/* Total Value */}
                {totalValue > 0 && (
                  <div className="text-xs text-gray-600 mb-3 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1" />
                    {formatCurrency(totalValue)}
                  </div>
                )}

                {/* Cards */}
                <div className="space-y-2 min-h-[100px]">
                  {stageCustomers.map((customer) => (
                    <PipelineCard
                      key={customer.id}
                      customer={customer}
                      onClick={() => onCustomerClick(customer)}
                      onDragStart={() => handleDragStart(customer)}
                      onMove={(newStatus) => onStatusChange(customer.id, newStatus)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

interface PipelineCardProps {
  customer: Customer;
  onClick: () => void;
  onDragStart: () => void;
  onMove: (status: CustomerStatus) => void;
}

function PipelineCard({ customer, onClick, onDragStart, onMove }: PipelineCardProps) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-move hover:shadow-md transition-shadow bg-white"
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm truncate flex-1">{customer.name}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {stages.map(stage => (
                stage.id !== customer.status && (
                  <DropdownMenuItem key={stage.id} onClick={() => onMove(stage.id)}>
                    Taşı: {stage.name}
                  </DropdownMenuItem>
                )
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {customer.company && (
          <div className="flex items-center text-xs text-gray-500 mb-2">
            <Building2 className="w-3 h-3 mr-1" />
            <span className="truncate">{customer.company}</span>
          </div>
        )}

        <div className="flex items-center text-xs text-gray-600 mb-2">
          <Phone className="w-3 h-3 mr-1" />
          {customer.phone}
        </div>

        {customer.estimatedValue && (
          <div className="flex items-center text-xs font-medium text-green-600 mb-2">
            <DollarSign className="w-3 h-3 mr-1" />
            {formatCurrency(customer.estimatedValue)}
          </div>
        )}

        {customer.expectedCloseDate && (
          <div className="flex items-center text-xs text-gray-500">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(customer.expectedCloseDate)}
          </div>
        )}

        {customer.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {customer.tags.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
            {customer.tags.length > 2 && (
              <span className="text-xs text-gray-400">+{customer.tags.length - 2}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short'
  });
}
