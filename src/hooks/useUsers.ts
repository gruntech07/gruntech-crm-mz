"use client";

import { useCallback, useEffect, useState } from "react";
import type { User, UserFormData, UserRole } from "@/types";

type ApiRole = "ADMIN" | "SALES_MANAGER" | "PROJECT_MANAGER" | "SALES_REP";

type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: ApiRole;
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
};

function mapApiRoleToLegacy(role: ApiRole): UserRole {
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

function mapLegacyRoleToApi(role: UserRole): string {
  switch (role) {
    case "admin":
      return "ADMIN";
    case "team_lead":
      return "TEAM_LEAD";
    case "sales_rep":
    default:
      return "SALES_REP";
  }
}

function mapApiUserToLegacy(user: ApiUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapApiRoleToLegacy(user.role),
    isActive: user.isActive,
    createdAt: user.createdAt ?? new Date().toISOString(),
    lastLogin: user.lastLogin,
  };
}

export function useUsers(enabled: boolean) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const loadUsers = useCallback(async () => {
    if (!enabled) {
      setUsers([]);
      return;
    }

    setIsLoadingUsers(true);

    try {
      const res = await fetch("/users", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Kullanıcılar yüklenemedi");
      }

      const nextUsers = Array.isArray(data?.users)
        ? data.users.map(mapApiUserToLegacy)
        : [];

      setUsers(nextUsers);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [enabled]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const addUser = useCallback(
    async (formData: UserFormData) => {
      const res = await fetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: mapLegacyRoleToApi(formData.role),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Kullanıcı eklenemedi");
      }

      await loadUsers();
    },
    [loadUsers]
  );

  const updateUser = useCallback(
    async (id: string, patch: Partial<User>) => {
      const payload: Record<string, unknown> = {};

      if (typeof patch.name === "string") {
        payload.name = patch.name;
      }

      if (typeof patch.role === "string") {
        payload.role = mapLegacyRoleToApi(patch.role);
      }

      if (typeof patch.isActive === "boolean") {
        payload.isActive = patch.isActive;
      }

      const res = await fetch(`/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Kullanıcı güncellenemedi");
      }

      await loadUsers();
    },
    [loadUsers]
  );

  const deactivateUser = useCallback(
    async (id: string) => {
      const res = await fetch(`/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Kullanıcı pasife alınamadı"
        );
      }

      await loadUsers();
    },
    [loadUsers]
  );

  return {
    users,
    isLoadingUsers,
    loadUsers,
    addUser,
    updateUser,
    deactivateUser,
  };
}