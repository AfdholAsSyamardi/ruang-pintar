import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import DashboardSidebar from "@/components/DashboardSidebar";

export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "student") {
    redirect("/profile");
  }

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col lg:flex-row">
      <DashboardSidebar user={user} />
      <main className="flex-1 lg:pl-68">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
