import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CRMMain } from "@/components/crm/CRMMain";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <CRMMain />;
}