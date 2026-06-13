import { useState, useEffect } from 'react';
import { useSupplierAuth } from '@/contexts/SupplierAuthContext';
import { supplierFetch } from '@/lib/supplierApi';
import type { SupplierDashboard } from '@/types/supplier-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, AlertCircle, TrendingUp, CheckCircle2, FileWarning } from 'lucide-react';

export function SupplierDashboardPage() {
  const { supplier } = useSupplierAuth();
  const [data, setData] = useState<SupplierDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await supplierFetch<{ success: boolean; data: SupplierDashboard }>('/supplier-portal/dashboard');
        if (response.success) {
          setData(response.data);
        }
      } catch (err: any) {
        // Fallback mock data if endpoint doesn't exist yet for demonstration
        if (err.message === 'Route not found' || err.status === 404) {
          console.warn('Dashboard endpoint not found. Using mock data.');
          setData({
            totalBills: 0,
            pendingAmount: 0,
            paidAmount: 0,
            disputedAmount: 0,
            recentBills: []
          });
        } else {
          setError(err.message || 'Failed to load dashboard data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 mt-8 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Dashboard Error</h2>
        <p className="text-muted-foreground mt-2">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6" variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Hello, {supplier?.name}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          You're viewing invoices from <span className="font-semibold text-foreground">{supplier?.shopName || 'the shop owner'}</span>
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Total Bills
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{data?.totalBills || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5">
            <TrendingUp className="h-16 w-16 text-orange-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-orange-500 uppercase tracking-wider relative z-10">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-orange-500">
              ₹{formatCurrency(data?.pendingAmount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute right-0 bottom-0 p-4 opacity-5">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-green-500 uppercase tracking-wider relative z-10">
              Paid
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-500">
              ₹{formatCurrency(data?.paidAmount || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-destructive uppercase tracking-wider">
              Disputed
            </CardTitle>
            <div className="p-2 bg-destructive/10 rounded-lg">
              <FileWarning className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ₹{formatCurrency(data?.disputedAmount || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bills Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle>Recent Bills</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {(!data?.recentBills || data.recentBills.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No invoices yet</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {supplier?.shopName || 'The shop owner'} hasn't added any bills for you yet. They will appear here once created.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                    <th className="px-6 py-4 font-semibold">Amount</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.recentBills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{formatDate(bill.createdAt)}</td>
                      <td className="px-6 py-4">{bill.description}</td>
                      <td className="px-6 py-4 font-semibold">₹{formatCurrency(bill.amount)}</td>
                      <td className="px-6 py-4">
                        {bill.status === 'pending' && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Pending</Badge>
                        )}
                        {bill.status === 'paid' && (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Paid</Badge>
                        )}
                        {bill.status === 'disputed' && (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Disputed</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
