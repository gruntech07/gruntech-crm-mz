"use client";

import { LoginPage } from "@/components/crm/LoginPage";

export default function Page() {
  const handleLogin = (email: string, password: string) => {
    console.log("Login denemesi:", email, password);
    return true;
  };

  return <LoginPage />;
}