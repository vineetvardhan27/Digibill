import { useState, useEffect } from "react";
import { Wallet, FileText, Users, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { SpendingChart } from "@/components/dashboard/SpendingChart";
import { SupplierBreakdown } from "@/components/dashboard/SupplierBreakdown";
import { RecentBills } from "@/components/dashboard/RecentBills";
import { DuePayments } from "@/components/dashboard/DuePayments";
import { formatCurrency } from "@/lib/mockData";
import { dashboardAPI } from "@/lib/api";
import { DashboardStats } from "@/types";
import { toast } from "sonner";

export function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getStats();
      setStats(response.data.stats);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch dashboard stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Overview of your business metrics" />
        <main className="px-8 py-6">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Overview of your business metrics" />
        <main className="px-8 py-6">
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Failed to load dashboard stats</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Overview of your business metrics" />
      
      <main className="px-8 py-6 space-y-6">
        {/* Hero Stats */}
        <div className="gradient-hero rounded-3xl p-8 text-primary-foreground shadow-2xl">
          <p className="text-sm font-medium opacity-90 uppercase tracking-wider">Total Monthly Spend</p>
          <p className="text-5xl font-bold mt-3">
            {formatCurrency(stats.monthlySpend)}
          </p>
          <div className="flex items-center gap-2 mt-4 text-base">
            <TrendingUp className="h-5 w-5" />
            <span className="font-medium opacity-90">
              {stats.monthlyChange > 0 ? '+' : ''}{stats.monthlyChange.toFixed(1)}% from last month
            </span>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <StatCard
            title="Total Spend"
            value={formatCurrency(stats.totalSpend)}
            icon={Wallet}
            color="primary"
          />
          <StatCard
            title="Total Bills"
            value={stats.totalBills.toString()}
            icon={FileText}
            color="accent"
          />
          <StatCard
            title="Suppliers"
            value={stats.totalSuppliers.toString()}
            icon={Users}
            color="success"
          />
          <StatCard
            title="Pending"
            value={formatCurrency(stats.pendingPayments)}
            icon={AlertTriangle}
            color="warning"
          />
        </div>

        {/* Due Payments Alert */}
        <DuePayments />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SpendingChart />
          <SupplierBreakdown />
        </div>

        {/* Recent Bills */}
        <RecentBills />
      </main>
    </div>
  );
}
