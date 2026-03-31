import { useState, useEffect, useCallback } from 'react';
import type { User, AuthState, UserFormData } from '@/types';

const STORAGE_KEY = 'crm_auth';
const USERS_KEY = 'crm_users';

// Demo kullanıcılar
const demoUsers: User[] = [
  {
    id: 'admin-1',
    email: 'admin@crm.com',
    name: 'Ahmet Yönetici',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'lead-1',
    email: 'lead@crm.com',
    name: 'Mehmet Ekip Lideri',
    role: 'team_lead',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'rep-1',
    email: 'rep@crm.com',
    name: 'Ayşe Satışçı',
    role: 'sales_rep',
    isActive: true,
    createdAt: '2024-01-01'
  },
  {
    id: 'rep-2',
    email: 'rep2@crm.com',
    name: 'Can Satışçı',
    role: 'sales_rep',
    isActive: true,
    createdAt: '2024-01-01'
  }
];

// Demo şifreler (gerçek uygulamada hashlenmeli!)
const demoPasswords: Record<string, string> = {
  'admin@crm.com': 'admin123',
  'lead@crm.com': 'lead123',
  'rep@crm.com': 'rep123',
  'rep2@crm.com': 'rep123'
};

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  // Kullanıcıları yükle
  const [users, setUsers] = useState<User[]>(() => {
    if (typeof window === 'undefined') return demoUsers;
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));
    return demoUsers;
  });

  // Oturum kontrolü
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Giriş yap
  const login = useCallback((email: string, password: string): boolean => {
    // Demo şifre kontrolü
    if (demoPasswords[email] !== password) {
      return false;
    }

    const user = users.find(u => u.email === email && u.isActive);
    if (!user) return false;

    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
    
    setAuthState({
      user: updatedUser,
      isAuthenticated: true,
      isLoading: false
    });
    return true;
  }, [users]);

  // Çıkış yap
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  }, []);

  // Kullanıcı ekle (sadece admin)
  const addUser = useCallback((data: UserFormData): User | null => {
    if (users.some(u => u.email === data.email)) {
      return null;
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Demo şifre kaydet
    demoPasswords[data.email] = data.password;

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));

    return newUser;
  }, [users]);

  // Kullanıcı güncelle
  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, ...data } : u);
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Kullanıcı sil (deaktif et)
  const deactivateUser = useCallback((id: string) => {
    setUsers(prev => {
      const updated = prev.map(u => u.id === id ? { ...u, isActive: false } : u);
      localStorage.setItem(USERS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Tüm kullanıcıları getir
  const getAllUsers = useCallback(() => users.filter(u => u.isActive), [users]);

  // ID'ye göre kullanıcı getir
  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  // Ekip liderlerini getir
  const getTeamLeads = useCallback(() => {
    return users.filter(u => u.role === 'team_lead' && u.isActive);
  }, [users]);

  // Satış temsilcilerini getir
  const getSalesReps = useCallback(() => {
    return users.filter(u => u.role === 'sales_rep' && u.isActive);
  }, [users]);

  // Yetki kontrolleri
  const canManageUsers = authState.user?.role === 'admin';
  const canViewAllCustomers = authState.user?.role === 'admin';
  const canAssignTeamLead = authState.user?.role === 'admin';
  const isTeamLead = authState.user?.role === 'team_lead';
  const isSalesRep = authState.user?.role === 'sales_rep';

  return {
    ...authState,
    users,
    login,
    logout,
    addUser,
    updateUser,
    deactivateUser,
    getAllUsers,
    getUserById,
    getTeamLeads,
    getSalesReps,
    canManageUsers,
    canViewAllCustomers,
    canAssignTeamLead,
    isTeamLead,
    isSalesRep
  };
}
