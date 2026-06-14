import { useState, useEffect } from "react";
import { 
  IndianRupee, 
  FileText, 
  Store, 
  TrendingUp,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supplierConnectionAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function SupplierAccountDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await supplierConnectionAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your business across all connected shops.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Owed</CardTitle>
            <div className="p-2 bg-orange-500/10 text-orange-600 rounded-full">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">₹{formatCurrency(stats.totalOwedToYou)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total pending payments</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amount Received</CardTitle>
            <div className="p-2 bg-green-500/10 text-green-600 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">₹{formatCurrency(stats.totalReceived)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total paid across all time</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Bills</CardTitle>
            <div className="p-2 bg-blue-500/10 text-blue-600 rounded-full">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.totalBills}</div>
            <p className="text-xs text-muted-foreground mt-1">Bills issued to connected shops</p>
          </CardContent>
        </Card>

        <Card 
          className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => navigate('/supplier/shops')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Connected Shops</CardTitle>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-full">
              <Store className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight">{stats.connectedShopsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active business relationships</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p>No recent bill activity found.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center mr-4 shrink-0">
                      {activity.isPaid ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <FileText className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {activity.isPaid ? 'Payment Received' : 'New Bill Issued'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{activity.shopName}</span> &bull; {activity.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">₹{formatCurrency(activity.amount)}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(activity.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
