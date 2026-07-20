import { useState, useEffect } from "react";
import { Activity, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

export function AdminQueueView() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/admin/queue-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch queue status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Status</h1>
          <p className="text-muted-foreground mt-1">
            Monitor background jobs and email tasks in BullMQ
          </p>
        </div>
        <button
          onClick={fetchQueueStatus}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      {loading && !stats ? (
        <div className="flex justify-center items-center h-64">
          <Activity className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Waiting (Pending)"
            value={stats.counts.waiting}
            icon={<Clock className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Active (Processing)"
            value={stats.counts.active}
            icon={<Activity className="h-5 w-5 text-orange-500" />}
          />
          <StatCard
            title="Completed"
            value={stats.counts.completed}
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
          />
          <StatCard
            title="Failed"
            value={stats.counts.failed}
            icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          />
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
      <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="p-6 pt-0">
        <div className="text-3xl font-bold">{value}</div>
      </div>
    </div>
  );
}
