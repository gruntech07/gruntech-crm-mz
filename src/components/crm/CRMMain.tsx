"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useUsers } from "@/hooks/useUsers";
import { Dashboard } from "@/components/crm/Dashboard";
import { PipelineView } from "@/components/crm/PipelineView";
import { CustomerForm } from "@/components/crm/CustomerForm";
import { CustomerDetail } from "@/components/crm/CustomerDetail";
import { CustomerTechnicalForm } from "@/components/crm/CustomerTechnicalForm";
import type { CustomerTechnicalFormData } from "@/components/crm/CustomerTechnicalForm";
import { UserManagement } from "@/components/crm/UserManagement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  BarChart3,
  Users,
  Columns,
  LogOut,
  Settings,
  Trash2,
  AlertTriangle,
  Building2,
  Tag,
  CircleDollarSign,
  LayoutGrid,
  Filter,
} from "lucide-react";
import type {
  Customer,
  CustomerFormData,
  CustomerStatus,
  ActivityType,
  User as AppUser,
} from "@/types";
import { statusLabels, probabilityLabels, roleLabels } from "@/types";

type SessionRole = "ADMIN" | "SALES_MANAGER" | "PROJECT_MANAGER" | "SALES_REP";
type LegacyRole = "admin" | "team_lead" | "sales_rep";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
  createdAt?: string;
};

export type LegacyUser = {
  id: string;
  name: string;
  email: string;
  role: LegacyRole;
  isActive: boolean;
  teamId?: string;
  createdAt: Date;
};

function mapRole(role: SessionRole): LegacyRole {
  switch (role) {
    case "ADMIN":
      return "admin";
    case "SALES_MANAGER":
    case "PROJECT_MANAGER":
      return "team_lead";
    case "SALES_REP":
    default:
      return "sales_rep";
  }
}

function mapSessionUserToLegacy(user: SessionUser): LegacyUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapRole(user.role),
    isActive: true,
    teamId: undefined,
    createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
  };
}

export function CRMMain() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const legacyUser = sessionUser ? mapSessionUserToLegacy(sessionUser) : null;

  const {
    customers,
    isLoaded,
    addCustomer,
    updateCustomer,
    updateCustomerTechnical,
    deleteCustomer,
    addContactNote,
    addActivity,
    completeActivity,
    getCustomerActivities,
    getPendingActivities,
    changeStatus,
    searchCustomers,
    getStatistics,
    getAllTags,
  } = useCustomers(legacyUser);

  const {
    users: managedUsers,
    addUser,
    updateUser,
    deactivateUser,
  } = useUsers(legacyUser?.role === "admin");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [probabilityFilter, setProbabilityFilter] = useState<
    "all" | "high" | "medium" | "low" | "none"
  >("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTechnicalFormOpen, setIsTechnicalFormOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    const loadSessionUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json().catch(() => null);

        if (res.ok && data?.user) {
          setSessionUser(data.user as SessionUser);
        } else {
          setSessionUser(null);
        }
      } catch {
        setSessionUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    void loadSessionUser();
  }, []);

  const auth = useMemo(() => {
  const user = legacyUser;

  const currentUser: AppUser | null = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      }
    : null;

  const users: AppUser[] =
    user?.role === "admin"
      ? managedUsers
      : currentUser
      ? [currentUser]
      : [];

  return {
    user,
    currentUser,
    users,
    isAuthenticated: !!user,
    canManageUsers: user?.role === "admin",
    login: async () => true,
    logout: async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/login";
    },
    addUser,
    updateUser,
    deactivateUser,
    getUserById: (id: string) => users.find((u) => u.id === id),
    getTeamLeads: () =>
      users.filter((u) => u.role === "team_lead" || u.role === "admin"),
  };
}, [legacyUser, managedUsers, addUser, updateUser, deactivateUser]);

  const getUserName = useCallback(
    (id: string) => {
      const foundUser = auth.getUserById(id);
      return foundUser?.name || "Bilinmiyor";
    },
    [auth]
  );

  const filteredCustomers = useMemo(() => {
    let result = customers;

    if (searchQuery.trim()) {
      result = searchCustomers(searchQuery);
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    if (probabilityFilter !== "all") {
      result = result.filter((c) => c.probability === probabilityFilter);
    }

    if (tagFilter !== "all") {
      result = result.filter((c) => c.tags.includes(tagFilter));
    }

    return result;
  }, [
    customers,
    searchQuery,
    statusFilter,
    probabilityFilter,
    tagFilter,
    searchCustomers,
  ]);

  const statistics = useMemo(() => {
    const stats = getStatistics();
    return {
      ...stats,
      upcomingActivities: getPendingActivities(),
      recentCustomers: customers.slice(0, 5),
    };
  }, [getStatistics, getPendingActivities, customers]);

  const allTags = useMemo(() => getAllTags(), [getAllTags]);

  const handleFormSubmit = (data: CustomerFormData) => {
    if (customerToEdit) {
      void updateCustomer(customerToEdit.id, data);
      setCustomerToEdit(null);
    } else {
      void addCustomer(data);
    }
    setIsFormOpen(false);
  };

  const handleTechnicalFormSubmit = async (data: CustomerTechnicalFormData) => {
    if (!selectedCustomer) return;
    await updateCustomerTechnical(selectedCustomer.id, data);
    setIsTechnicalFormOpen(false);
  };

  const handleEditGeneral = () => {
    if (!selectedCustomer) return;
    setCustomerToEdit(selectedCustomer);
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleEditTechnical = () => {
    if (!selectedCustomer) return;
    setIsDetailOpen(false);
    setIsTechnicalFormOpen(true);
  };

  const handleDelete = () => {
    if (customerToDelete) {
      void deleteCustomer(customerToDelete.id);
      setCustomerToDelete(null);
      setIsDetailOpen(false);
    }
  };

  const handleAddNote = (note: string, type: ActivityType) => {
    if (selectedCustomer) {
      addContactNote(selectedCustomer.id, note, type);
    }
  };

  const handleAddActivity = (
    type: ActivityType,
    description: string,
    dueDate?: string
  ) => {
    if (selectedCustomer) {
      addActivity(selectedCustomer.id, type, description, dueDate);
    }
  };

  const handleNewCustomer = () => {
    setCustomerToEdit(null);
    setIsFormOpen(true);
  };

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
  };

  const handleStatusChange = (customerId: string, newStatus: CustomerStatus) => {
    void changeStatus(customerId, newStatus);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setProbabilityFilter("all");
    setTagFilter("all");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Oturum yükleniyor...</div>
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Oturum bulunamadı.</div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-lg text-slate-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[76px] items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  Müşteri Takip Sistemi
                </h1>
                <p className="text-xs text-slate-500">
                  {auth.user?.name} • {roleLabels[auth.user?.role || "sales_rep"]}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {auth.canManageUsers && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="rounded-2xl border-slate-200"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Kullanıcılar</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleNewCustomer}
                className="rounded-2xl border-slate-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Yeni Müşteri</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={auth.logout}
                className="rounded-2xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Toplam Müşteri" value={String(statistics.total || 0)} />
          <StatCard
            label="Aktif Teklif"
            value={String(statistics.byStatus?.proposal || 0)}
          />
          <StatCard
            label="Bekleyen Aktivite"
            value={String(statistics.upcomingActivities?.length || 0)}
          />
          <StatCard
            label="Tahmini Hacim"
            value={formatMoney(statistics.totalEstimatedValue)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <TabsList className="grid w-full max-w-[520px] grid-cols-3 rounded-2xl bg-slate-100 p-1">
                <TabsTrigger value="list" className="rounded-xl">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Liste
                </TabsTrigger>
                <TabsTrigger value="pipeline" className="rounded-xl">
                  <Columns className="mr-2 h-4 w-4" />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  İstatistikler
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                <CircleDollarSign className="h-4 w-4" />
                USD görünüm aktif
              </div>
            </div>
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-900">Arama ve Filtreler</h3>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Müşteri, firma, telefon veya etiket ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as CustomerStatus | "all")}
                  >
                    <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Durum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Durumlar</SelectItem>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={probabilityFilter}
                    onValueChange={(v) =>
                      setProbabilityFilter(
                        v as "all" | "high" | "medium" | "low" | "none"
                      )
                    }
                  >
                    <SelectTrigger className="h-12 w-[170px] rounded-2xl border-slate-200 bg-slate-50">
                      <SelectValue placeholder="Olasılık" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Olasılıklar</SelectItem>
                      {Object.entries(probabilityLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {allTags.length > 0 && (
                    <Select value={tagFilter} onValueChange={setTagFilter}>
                      <SelectTrigger className="h-12 w-[160px] rounded-2xl border-slate-200 bg-slate-50">
                        <Tag className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Etiket" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Etiketler</SelectItem>
                        {allTags.map((tag) => (
                          <SelectItem key={tag} value={tag}>
                            {tag}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              {(searchQuery ||
                statusFilter !== "all" ||
                probabilityFilter !== "all" ||
                tagFilter !== "all") && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-sm text-slate-600">
                    {filteredCustomers.length} müşteri bulundu
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="rounded-2xl"
                  >
                    Filtreleri Temizle
                  </Button>
                </div>
              )}
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Müşteri bulunamadı
                </h3>
                <Button onClick={handleNewCustomer} variant="outline" className="rounded-2xl border-slate-200">
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Müşteri Ekle
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredCustomers.map((customer) => (
                  <CustomerListCard
                    key={customer.id}
                    customer={customer}
                    onClick={() => handleCustomerClick(customer)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pipeline">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <PipelineView
                customers={customers}
                onCustomerClick={handleCustomerClick}
                onStatusChange={handleStatusChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="stats">
            <Dashboard
              stats={statistics}
              recentCustomers={statistics.recentCustomers}
              upcomingActivities={statistics.upcomingActivities}
            />
          </TabsContent>
        </Tabs>
      </main>

      <CustomerForm
        customer={customerToEdit}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setCustomerToEdit(null);
        }}
        onSubmit={handleFormSubmit}
        currentUser={auth.currentUser!}
        users={auth.users}
        teamLeads={auth.getTeamLeads()}
        allTags={allTags}
      />

      <CustomerTechnicalForm
        customer={selectedCustomer}
        isOpen={isTechnicalFormOpen}
        onClose={() => setIsTechnicalFormOpen(false)}
        onSubmit={handleTechnicalFormSubmit}
      />

      <CustomerDetail
        customer={selectedCustomer}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCustomer(null);
        }}
        onEditGeneral={handleEditGeneral}
        onEditTechnical={handleEditTechnical}
        onDelete={() => {
          setCustomerToDelete(selectedCustomer);
          setIsDetailOpen(false);
        }}
        onAddNote={handleAddNote}
        onAddActivity={handleAddActivity}
        onCompleteActivity={completeActivity}
        onStatusChange={handleStatusChange}
        activities={selectedCustomer ? getCustomerActivities(selectedCustomer.id) : []}
        getUserName={getUserName}
        canDelete={auth.user?.role === "admin"}
      />

      <UserManagement
        users={auth.users}
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        onAddUser={auth.addUser}
        onUpdateUser={auth.updateUser}
        onDeactivateUser={auth.deactivateUser}
      />

      <Dialog open={!!customerToDelete} onOpenChange={() => setCustomerToDelete(null)}>
        <DialogContent className="w-[min(560px,calc(100vw-6cm))] rounded-3xl p-6">
          <DialogTitle className="sr-only">Müşteri silme onayı</DialogTitle>
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Müşteri Silme Onayı
            </DialogTitle>
            <DialogDescription>
              <span className="font-medium">{customerToDelete?.name}</span> isimli
              müşteriyi silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setCustomerToDelete(null)}
              className="rounded-2xl"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-2xl"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

interface CustomerListCardProps {
  customer: Customer;
  onClick: () => void;
}

function CustomerListCard({ customer, onClick }: CustomerListCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900">{customer.name}</h3>
          {customer.company && (
            <div className="mt-1 flex items-center text-sm text-slate-500">
              <Building2 className="mr-1.5 h-4 w-4" />
              <span className="truncate">{customer.company}</span>
            </div>
          )}
        </div>

        <Badge
          variant="outline"
          className={`border px-3 py-1 text-xs font-semibold ${
            probabilityTone[customer.probability]
          }`}
        >
          {probabilityLabels[customer.probability]}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1 text-slate-500">Telefon</div>
          <div className="font-medium text-slate-900">{customer.phone}</div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="mb-1 text-slate-500">Durum</div>
          <div className="font-medium text-slate-900">
            {statusLabels[customer.status]}
          </div>
        </div>

        <div className="col-span-2 rounded-2xl bg-slate-50 p-3">
          <div className="mb-1 text-slate-500">Tahmini Proje</div>
          <div className="text-xl font-semibold text-slate-900">
            {formatMoney(customer.estimatedValue)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
        <Badge variant="outline" className="rounded-full border-slate-200 bg-white">
          {statusLabels[customer.status]}
        </Badge>

        {customer.tags.length > 0 && (
          <div className="flex gap-1">
            {customer.tags.slice(0, 2).map((tag, i) => (
              <span
                key={i}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const probabilityTone: Record<Customer["probability"], string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-orange-50 text-orange-700 border-orange-200",
  none: "bg-rose-50 text-rose-700 border-rose-200",
};

function formatMoney(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}