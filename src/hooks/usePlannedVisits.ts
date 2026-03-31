"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  PlannedVisit,
  PlannedVisitFormData,
  PlannedVisitVisitResultFormData,
  ConvertPlannedVisitToCustomerPayload,
} from "@/types/plannedVisit";

interface UsePlannedVisitsOptions {
  initialStatus?: string;
  assignedToId?: string;
  onlyMine?: boolean;
  autoLoad?: boolean;
}

interface LoadPlannedVisitsParams {
  status?: string;
  assignedToId?: string;
  q?: string;
  onlyMine?: boolean;
}

export function usePlannedVisits(options: UsePlannedVisitsOptions = {}) {
  const {
    initialStatus,
    assignedToId,
    onlyMine = false,
    autoLoad = true,
  } = options;

  const [plannedVisits, setPlannedVisits] = useState<PlannedVisit[]>([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string>("");

  const buildQueryString = (params?: LoadPlannedVisitsParams) => {
    const searchParams = new URLSearchParams();

    const status = params?.status ?? initialStatus;
    const assigned = params?.assignedToId ?? assignedToId;
    const onlyMineValue = params?.onlyMine ?? onlyMine;

    if (status) searchParams.set("status", status);
    if (assigned) searchParams.set("assignedToId", assigned);
    if (params?.q) searchParams.set("q", params.q);
    if (onlyMineValue) searchParams.set("onlyMine", "true");

    const qs = searchParams.toString();
    return qs ? `?${qs}` : "";
  };

  const loadPlannedVisits = useCallback(
    async (params?: LoadPlannedVisitsParams) => {
      try {
        setIsLoading(true);
        setError("");

        const res = await fetch(
          `/api/planned-visits${buildQueryString(params)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Planlanan ziyaretler alınamadı.");
        }

        setPlannedVisits(Array.isArray(data) ? data : []);
        return Array.isArray(data) ? data : [];
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Planlanan ziyaretler yüklenemedi.";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [initialStatus, assignedToId, onlyMine]
  );

  const createPlannedVisit = useCallback(async (payload: PlannedVisitFormData) => {
    try {
      setError("");

      const res = await fetch("/api/planned-visits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Planlanan ziyaret oluşturulamadı.");
      }

      setPlannedVisits((prev) => [data, ...prev]);
      return data as PlannedVisit;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Planlanan ziyaret oluşturulamadı.";
      setError(message);
      throw err;
    }
  }, []);

  const getPlannedVisit = useCallback(async (id: string) => {
    const res = await fetch(`/api/planned-visits/${id}`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || "Planlanan ziyaret detayı alınamadı.");
    }

    return data as PlannedVisit;
  }, []);

  const updatePlannedVisit = useCallback(
    async (
      id: string,
      payload: Partial<PlannedVisitFormData & PlannedVisitVisitResultFormData>
    ) => {
      try {
        setError("");

        const res = await fetch(`/api/planned-visits/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Planlanan ziyaret güncellenemedi.");
        }

        setPlannedVisits((prev) =>
          prev.map((item) => (item.id === id ? data : item))
        );

        return data as PlannedVisit;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Planlanan ziyaret güncellenemedi.";
        setError(message);
        throw err;
      }
    },
    []
  );

  const deletePlannedVisit = useCallback(async (id: string) => {
    try {
      setError("");

      const res = await fetch(`/api/planned-visits/${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Planlanan ziyaret silinemedi.");
      }

      setPlannedVisits((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Planlanan ziyaret silinemedi.";
      setError(message);
      throw err;
    }
  }, []);

  const markVisitResult = useCallback(
    async (id: string, payload: PlannedVisitVisitResultFormData) => {
      return updatePlannedVisit(id, payload);
    },
    [updatePlannedVisit]
  );

  const convertPlannedVisitToCustomer = useCallback(
    async (
      id: string,
      payload?: Omit<ConvertPlannedVisitToCustomerPayload, "plannedVisitId">
    ) => {
      try {
        setError("");

        const res = await fetch(`/api/planned-visits/${id}/convert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload ?? {}),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.message || "Planlanan ziyaret müşteriye dönüştürülemedi."
          );
        }

        if (data?.plannedVisit?.id) {
          setPlannedVisits((prev) =>
            prev.map((item) => (item.id === id ? data.plannedVisit : item))
          );
        }

        return data as {
          customer: {
            id: string;
            name: string;
            company?: string | null;
            phone: string;
            email?: string | null;
          };
          plannedVisit: PlannedVisit;
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Planlanan ziyaret müşteriye dönüştürülemedi.";
        setError(message);
        throw err;
      }
    },
    []
  );

  useEffect(() => {
    if (!autoLoad) return;
    loadPlannedVisits().catch(() => undefined);
  }, [autoLoad, loadPlannedVisits]);

  const stats = useMemo(() => {
    return {
      total: plannedVisits.length,
      planned: plannedVisits.filter((x) => x.status === "PLANNED").length,
      visited: plannedVisits.filter((x) => x.status === "VISITED").length,
      postponed: plannedVisits.filter((x) => x.status === "POSTPONED").length,
      cancelled: plannedVisits.filter((x) => x.status === "CANCELLED").length,
      converted: plannedVisits.filter((x) => x.status === "CONVERTED").length,
    };
  }, [plannedVisits]);

  return {
    plannedVisits,
    setPlannedVisits,
    isLoading,
    error,
    stats,

    loadPlannedVisits,
    getPlannedVisit,
    createPlannedVisit,
    updatePlannedVisit,
    deletePlannedVisit,
    markVisitResult,
    convertPlannedVisitToCustomer,
  };
}