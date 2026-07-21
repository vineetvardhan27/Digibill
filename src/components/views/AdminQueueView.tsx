import { useState, useEffect } from "react";
import { Activity, Clock, AlertTriangle, CheckCircle, RefreshCw, Inbox } from "lucide-react";
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

  const isAllEmpty = stats && 
    (stats?.queue?.counts?.waiting || 0) === 0 && 
    (stats?.queue?.counts?.active || 0) === 0 && 
    (stats?.queue?.counts?.completed || 0) === 0 && 
    (stats?.queue?.counts?.failed || 0) === 0;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight">Queue Status</h1>
          <p className="text-muted-foreground">
            Monitor background jobs and email tasks in BullMQ
          </p>
        </div>
        <button
          onClick={fetchQueueStatus}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-destructive">Failed to load queue status</h3>
            <p className="text-sm text-destructive/80 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={fetchQueueStatus}
            className="px-6 py-2 bg-destructive text-destructive-foreground rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors shadow-sm"
          >
            Try Again
          </button>
        </div>
      ) : loading && !stats ? (
        {/* Loading Skeletons */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm flex flex-col h-[152px] justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-2 w-1/2">
                  <div className="h-4 bg-muted/60 rounded animate-pulse"></div>
                  <div className="h-3 bg-muted/40 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-10 w-10 bg-muted/50 rounded-full animate-pulse"></div>
              </div>
              <div className="h-9 bg-muted/60 rounded w-1/3 animate-pulse mt-4"></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        {/* Statistics Cards */}
        <div className="space-y-8">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Waiting"
              subtitle="Pending Jobs"
              value={stats?.queue?.counts?.waiting || 0}
              icon={<Clock className="h-5 w-5" />}
              iconBgClass="bg-blue-100 dark:bg-blue-900/30"
              iconTextClass="text-blue-600 dark:text-blue-400"
            />
            <StatCard
              title="Active"
              subtitle="Currently Processing"
              value={stats?.queue?.counts?.active || 0}
              icon={<Activity className="h-5 w-5" />}
              iconBgClass="bg-orange-100 dark:bg-orange-900/30"
              iconTextClass="text-orange-600 dark:text-orange-400"
            />
            <StatCard
              title="Completed"
              subtitle="Successfully Completed"
              value={stats?.queue?.counts?.completed || 0}
              icon={<CheckCircle className="h-5 w-5" />}
              iconBgClass="bg-green-100 dark:bg-green-900/30"
              iconTextClass="text-green-600 dark:text-green-400"
            />
            <StatCard
              title="Failed"
              subtitle="Requires Attention"
              value={stats?.queue?.counts?.failed || 0}
              icon={<AlertTriangle className="h-5 w-5" />}
              iconBgClass="bg-red-100 dark:bg-red-900/30"
              iconTextClass="text-red-600 dark:text-red-400"
            />
          </div>

          {/* Empty State */}
          {isAllEmpty && (
            <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card/40 shadow-sm animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">All clear!</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                There are currently no jobs waiting in the queue.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ title, subtitle, value, icon, iconBgClass, iconTextClass }: any) {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1 flex flex-col h-full overflow-hidden group">
      <div className="p-6 flex flex-row items-start justify-between pb-2">
        <div className="space-y-1.5">
          <h3 className="tracking-tight text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-full transition-colors ${iconBgClass} ${iconTextClass}`}>
          {icon}
        </div>
      </div>
      <div className="p-6 pt-3 mt-auto">
        <div className="text-4xl font-bold tracking-tight">{value}</div>
      </div>
    </div>
  );
}
