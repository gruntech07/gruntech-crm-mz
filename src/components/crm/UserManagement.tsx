"use client";

import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Edit2,
  UserX,
  Shield,
  Users,
  User as UserIcon,
  Search,
} from "lucide-react";
import type { User, UserFormData, UserRole } from "@/types";
import { roleLabels } from "@/types";

interface UserManagementProps {
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (data: UserFormData) => Promise<void> | void;
  onUpdateUser: (id: string, data: Partial<User>) => Promise<void> | void;
  onDeactivateUser: (id: string) => Promise<void> | void;
}

const roleIcons: Record<UserRole, React.ElementType> = {
  admin: Shield,
  team_lead: Users,
  sales_rep: UserIcon,
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800",
  team_lead: "bg-blue-100 text-blue-800",
  sales_rep: "bg-green-100 text-green-800",
};

export function UserManagement({
  users,
  isOpen,
  onClose,
  onAddUser,
  onUpdateUser,
  onDeactivateUser,
}: UserManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    role: "sales_rep",
    password: "",
  });

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeUsers = filteredUsers.filter((u) => u.isActive);
  const inactiveUsers = filteredUsers.filter((u) => !u.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      if (editingUser) {
        await onUpdateUser(editingUser.id, {
          name: formData.name,
          role: formData.role,
        });
        setEditingUser(null);
      } else {
        await onAddUser(formData);
        setShowAddForm(false);
      }

      setFormData({
        email: "",
        name: "",
        role: "sales_rep",
        password: "",
      });
    } catch (error) {
      console.error("User submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Kullanıcı işlemi başarısız oldu."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setSubmitError("");
    try {
      await onDeactivateUser(id);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Kullanıcı pasife alınamadı."
      );
    }
  };

  const startEdit = (user: User) => {
    setSubmitError("");
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      password: "",
    });
    setShowAddForm(true);
  };

  const closeForm = () => {
    setSubmitError("");
    setShowAddForm(false);
    setEditingUser(null);
    setFormData({
      email: "",
      name: "",
      role: "sales_rep",
      password: "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Kullanıcı Yönetimi</span>
            {!showAddForm && (
              <Button size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Yeni Kullanıcı
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {submitError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        {showAddForm ? (
          <div className="mt-4">
            <h3 className="font-medium mb-4">
              {editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Ad Soyad</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Kullanıcı adı"
                    required
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="ornek@firma.com"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) =>
                      setFormData((prev) => ({ ...prev, role: v as UserRole }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="team_lead">Takım Lideri</SelectItem>
                      <SelectItem value="sales_rep">Satış Temsilcisi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? editingUser
                      ? "Güncelleniyor..."
                      : "Ekleniyor..."
                    : editingUser
                    ? "Güncelle"
                    : "Ekle"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={isSubmitting}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Kullanıcı ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Aktif Kullanıcılar ({activeUsers.length})
                </h4>
                <div className="space-y-2">
                  {activeUsers.map((user) => {
                    const RoleIcon = roleIcons[user.role];
                    return (
                      <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${roleColors[user.role]}`}
                            >
                              <RoleIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={roleColors[user.role]}>
                              {roleLabels[user.role]}
                            </Badge>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(user)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void handleDeactivate(user.id)}
                            >
                              <UserX className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {inactiveUsers.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pasif Kullanıcılar ({inactiveUsers.length})
                  </h4>
                  <div className="space-y-2">
                    {inactiveUsers.map((user) => (
                      <Card key={user.id} className="opacity-60">
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">Pasif</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}