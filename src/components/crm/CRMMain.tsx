"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useUsers } from "@/hooks/useUsers";
import { usePlannedVisits } from "@/hooks/usePlannedVisits";
import { useCustomerNotes } from "@/hooks/useCustomerNotes";
import { Dashboard } from "@/components/crm/Dashboard";
import { PipelineView } from "@/components/crm/PipelineView";
import { CustomerForm } from "@/components/crm/CustomerForm";
import { CustomerDetail } from "@/components/crm/CustomerDetail";
import { CustomerTechnicalForm } from "@/components/crm/CustomerTechnicalForm";
import { PlannedVisitsView } from "@/components/crm/PlannedVisitsView";
import { PlannedVisitForm } from "@/components/crm/PlannedVisitForm";
import { CustomerCard } from "@/components/crm/CustomerCard";
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
  CalendarIcon,
  Tag,
  CircleDollarSign,
  LayoutGrid,
  Filter,
  Rows3,
} from "lucide-react";
import type {
  Customer,
  CustomerFormData,
  CustomerStatus,
  ActivityType,
  User as AppUser,
} from "@/types";
import type { PlannedVisit, PlannedVisitFormData } from "@/types/plannedVisit";
import { statusLabels, probabilityLabels, roleLabels } from "@/types";

type SessionRole = "ADMIN" | "SALES_MANAGER" | "PROJECT_MANAGER" | "SALES_REP";
type LegacyRole = "admin" | "team_lead" | "sales_rep";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: SessionRole;
};

type LegacyUser = {
  id: string;
  name: string;
  email: string;
  role: LegacyRole;
  teamId?: string;
  isActive: boolean;
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
  };
}

export function CRMMain() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");

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

  const {
    plannedVisits,
    isLoading: plannedVisitsLoading,
    error: plannedVisitsError,
    loadPlannedVisits,
    createPlannedVisit,
    updatePlannedVisit,
    deletePlannedVisit,
    convertPlannedVisitToCustomer,
  } = usePlannedVisits({
    autoLoad: false,
  });

  const visitsLoadedRef = useRef(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | "all">("all");
  const [probabilityFilter, setProbabilityFilter] = useState<
    "all" | "high" | "medium" | "low" | "none"
  >("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [customerViewMode, setCustomerViewMode] = useState<"card" | "list">("card");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTechnicalFormOpen, setIsTechnicalFormOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  const [isPlannedVisitFormOpen, setIsPlannedVisitFormOpen] = useState(false);
  const [plannedVisitToEdit, setPlannedVisitToEdit] = useState<PlannedVisit | null>(null);
  const [isPlannedVisitSubmitting, setIsPlannedVisitSubmitting] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

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

  useEffect(() => {
    if (activeTab !== "visits") return;
    if (visitsLoadedRef.current) return;

    visitsLoadedRef.current = true;
    void loadPlannedVisits();
  }, [activeTab, loadPlannedVisits]);

  const auth = useMemo(() => {
    const user: AppUser | null = legacyUser
      ? {
          id: legacyUser.id,
          name: legacyUser.name,
          email: legacyUser.email,
          role: legacyUser.role,
          teamId: legacyUser.teamId,
          isActive: legacyUser.isActive,
          createdAt: new Date().toISOString(),
        }
      : null;

    const users: AppUser[] =
      legacyUser?.role === "admin"
        ? managedUsers
        : user
        ? [user]
        : [];

    return {
      user,
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

  const salesUsers = useMemo(
    () =>
      auth.users.filter(
        (u) => u.role === "sales_rep" || u.role === "team_lead" || u.role === "admin"
      ),
    [auth.users]
  );

  const {
    notes: selectedCustomerNotes,
    isLoading: isCustomerNotesLoading,
    isAdding: isCustomerNoteAdding,
    error: customerNotesError,
    addNote: addCustomerTimelineNote,
  } = useCustomerNotes({
    customerId: selectedCustomer?.id ?? null,
    enabled: isDetailOpen && !!selectedCustomer,
  });

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

  const handleAddNote = async (payload: {
    content: string;
    noteDate?: string;
    noteType?: "note" | "call" | "visit" | "meeting" | "offer" | "technical";
  }) => {
    if (!selectedCustomer) return;

    await addCustomerTimelineNote({
      content: payload.content,
      noteDate: payload.noteDate,
      noteType: payload.noteType ?? "note",
      type: payload.noteType?.toUpperCase() || "NOTE",
    });

    addContactNote(selectedCustomer.id, payload.content, "note");
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

  const handleOpenPlannedVisitCreate = () => {
    setPlannedVisitToEdit(null);
    setIsPlannedVisitFormOpen(true);
  };

  const handleOpenPlannedVisitEdit = (visit: PlannedVisit) => {
    setPlannedVisitToEdit(visit);
    setIsPlannedVisitFormOpen(true);
  };

  const handlePlannedVisitSubmit = async (data: PlannedVisitFormData) => {
    try {
      setIsPlannedVisitSubmitting(true);

      if (plannedVisitToEdit) {
        await updatePlannedVisit(plannedVisitToEdit.id, data);
        setPlannedVisitToEdit(null);
      } else {
        await createPlannedVisit(data);
      }

      setIsPlannedVisitFormOpen(false);
      await loadPlannedVisits();
      visitsLoadedRef.current = true;
    } finally {
      setIsPlannedVisitSubmitting(false);
    }
  };

  const handleConvertPlannedVisit = async (visit: PlannedVisit) => {
    await convertPlannedVisitToCustomer(visit.id, {
      customerData: {
        company: visit.companyName,
        name: visit.contactName || visit.companyName,
        phone: visit.phone || "-",
        email: visit.email || "",
        city: visit.city || "",
        district: visit.district || "",
        address: visit.address || "",
        sector: visit.sector || "",
        locationNote: visit.locationNote || "",
        notesText: visit.remoteNotes || "",
      },
    });

    await loadPlannedVisits();
    visitsLoadedRef.current = true;
    setActiveTab("list");
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
        <div className="mx-auto w-[calc(100%-24px)] md:w-[calc(100%-6cm)] px-0">
          <div className="flex min-h-[64px] items-center justify-between gap-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <Users className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <h1 className="line-clamp-2 text-lg font-bold leading-tight tracking-tight text-slate-900 sm:text-xl">
                  Müşteri Takip Sistemi
                </h1>
                <p className="truncate text-xs text-slate-500">
                  {auth.user?.name} • {roleLabels[auth.user?.role || "sales_rep"]}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {auth.canManageUsers && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsUserManagementOpen(true)}
                  className="h-10 w-10 rounded-2xl border-slate-200"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={handleNewCustomer}
                className="h-10 w-10 rounded-2xl border-slate-200"
              >
                <Plus className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={auth.logout}
                className="h-10 w-10 rounded-2xl"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-[calc(100%-24px)] md:w-[calc(100%-5cm)] px-0 py-4">
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            value={formatUsd(statistics.totalEstimatedValue)}
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="w-full overflow-x-auto">
                <TabsList className="grid min-w-[720px] grid-cols-4 rounded-2xl bg-slate-100 p-1">
                  <TabsTrigger value="list" className="rounded-xl px-3 py-2 text-sm">
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    Liste
                  </TabsTrigger>
                  <TabsTrigger value="pipeline" className="rounded-xl px-3 py-2 text-sm">
                    <Columns className="mr-2 h-4 w-4" />
                    Pipeline
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="rounded-xl px-3 py-2 text-sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    İstatistikler
                  </TabsTrigger>
                  <TabsTrigger value="visits" className="rounded-xl px-3 py-2 text-sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Ziyaretler
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700">
                <CircleDollarSign className="h-4 w-4" />
                USD görünüm aktif
              </div>
            </div>
          </div>

          <TabsContent value="list" className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb flex items-center justify-between gap-3">
                <div className="mb flex items-center gap-4">
                  <Filter className="h-6 w-4 text-slate-500" />
                  <h3 className="text-[15px] font-semibold text-slate-900">Arama ve Filtreler</h3>
                </div>
              </div>

              <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="relative min-w-0 flex-1 xl:max-w-[680px]">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder="Müşteri, firma, telefon veya etiket ara..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 rounded-2xl border-slate-200 bg-slate-50 pl-11"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 xl:ml-1">
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => setStatusFilter(v as CustomerStatus | "all")}
                    >
                      <SelectTrigger className="h-8 w-[150px] rounded-2xl border-slate-200 bg-slate-50">
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
                        setProbabilityFilter(v as "all" | "high" | "medium" | "low" | "none")
                      }
                    >
                      <SelectTrigger className="h-8 w-[155px] rounded-2xl border-slate-200 bg-slate-50">
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
                        <SelectTrigger className="h-8 w-[150px] rounded-2xl border-slate-200 bg-slate-50">
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

                <div className="xl:ml-6">
                  <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    <Button
                      type="button"
                      variant={customerViewMode === "card" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCustomerViewMode("card")}
                      className="rounded-xl"
                    >
                      <LayoutGrid className="mr-2 h-4 w-4" />
                      Kart
                    </Button>

                    <Button
                      type="button"
                      variant={customerViewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setCustomerViewMode("list")}
                      className="rounded-xl"
                    >
                      <Rows3 className="mr-2 h-4 w-4" />
                      Liste
                    </Button>
                  </div>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-900">
                  Müşteri bulunamadı
                </h3>
                <Button
                  onClick={handleNewCustomer}
                  variant="outline"
                  className="rounded-2xl border-slate-200"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Müşteri Ekle
                </Button>
              </div>
            ) : customerViewMode === "card" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onClick={() => handleCustomerClick(customer)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCustomers.map((customer) => (
                  <CustomerListRow
                    key={customer.id}
                    customer={customer}
                    onClick={() => handleCustomerClick(customer)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pipeline">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <PipelineView
                customers={customers}
                onCustomerClick={handleCustomerClick}
                onStatusChange={handleStatusChange}
              />
            </div>
          </TabsContent>

          <TabsContent value="visits">
            <PlannedVisitsView
              plannedVisits={plannedVisits}
              isLoading={plannedVisitsLoading}
              error={plannedVisitsError}
              onCreate={handleOpenPlannedVisitCreate}
              onEdit={handleOpenPlannedVisitEdit}
              onRefresh={async () => {
                await loadPlannedVisits();
                visitsLoadedRef.current = true;
              }}
              onDelete={async (visit) => {
                await deletePlannedVisit(visit.id);
              }}
              onUpdateStatus={async (visit, status) => {
                await updatePlannedVisit(visit.id, { status });
              }}
              onConvert={handleConvertPlannedVisit}
            />
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
        currentUser={auth.user!}
        users={auth.users}
        teamLeads={auth.getTeamLeads()}
        allTags={allTags}
      />

      <Dialog
        open={isPlannedVisitFormOpen}
        onOpenChange={(open) => {
          setIsPlannedVisitFormOpen(open);
          if (!open) {
            setPlannedVisitToEdit(null);
          }
        }}
      >
        <DialogContent className="w-[min(920px,calc(100vw-32px))] rounded-3xl p-0 sm:max-w-none">
          <div className="border-b border-slate-100 px-6 py-5">
            <DialogHeader>
              <DialogTitle className="text-xl text-slate-900">
                {plannedVisitToEdit ? "Ziyaret Planını Düzenle" : "Yeni Ziyaret Planı"}
              </DialogTitle>
              <DialogDescription>
                Aday müşteri kaydını planlanan ziyaret havuzuna ekleyin.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="max-h-[80vh] overflow-y-auto px-6 py-5">
            <PlannedVisitForm
              visit={plannedVisitToEdit}
              salesReps={salesUsers}
              currentUser={auth.user}
              onSubmit={handlePlannedVisitSubmit}
              onCancel={() => {
                setIsPlannedVisitFormOpen(false);
                setPlannedVisitToEdit(null);
              }}
              isSubmitting={isPlannedVisitSubmitting}
            />
          </div>
        </DialogContent>
      </Dialog>

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
        customerNotes={selectedCustomerNotes}
        customerNotesLoading={isCustomerNotesLoading}
        customerNotesAdding={isCustomerNoteAdding}
        customerNotesError={customerNotesError}
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
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold leading-none tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

interface CustomerListRowProps {
  customer: Customer;
  onClick: () => void;
}

function CustomerListRow({ customer, onClick }: CustomerListRowProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition hover:bg-slate-50"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_1.4fr_1fr_1fr_1fr] lg:items-center">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">
            {customer.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {customer.company || "-"}
          </div>
        </div>

        <div className="text-sm text-slate-700">{customer.phone || "-"}</div>

        <div>
          <Badge
            variant="outline"
            className="rounded-full border-slate-200 bg-white text-[11px]"
          >
            {statusLabels[customer.status]}
          </Badge>
        </div>

        <div>
          <Badge
            variant="outline"
            className={`border px-2 py-0.5 text-[10px] font-semibold ${
              probabilityTone[customer.probability]
            }`}
          >
            {probabilityLabels[customer.probability]}
          </Badge>
        </div>

        <div className="text-sm font-semibold text-emerald-600">
          {formatUsd(statisticsSafeValue(customer.estimatedValue))}
        </div>
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

function statisticsSafeValue(value?: number | null) {
  return value ?? null;
}

function formatUsd(value?: number | null) {
  if (value == null) return "-";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));
}