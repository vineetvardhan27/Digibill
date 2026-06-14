import { useState, useEffect } from 'react';
import { supplierFetch } from '@/lib/supplierApi';
import type { ActivityItem } from '@/types/supplier-portal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, CheckCircle, AlertTriangle, CheckCircle2, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SupplierActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivity = async () => {
    setIsLoading(true);
    try {
      const response = await supplierFetch<{ success: boolean; data: ActivityItem[] }>('/supplier-connections/activity');
      if (response.success) {
        setActivities(response.data);
      }
    } catch (err: any) {
      if (err.message === 'Route not found' || err.status === 404) {
        setActivities([]);
      } else {
        setError(err.message || 'Failed to load activity');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    if (Math.abs(diffInDays) > 0) return rtf.format(-diffInDays, 'day');
    
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
    if (Math.abs(diffInHours) > 0) return rtf.format(-diffInHours, 'hour');
    
    const diffInMinutes = Math.round(diffInMs / (1000 * 60));
    return rtf.format(-diffInMinutes, 'minute');
  };

  const getActivityStyle = (type: ActivityItem['type']) => {
    switch (type) {
      case 'bill_created':
        return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
      case 'bill_paid':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' };
      case 'dispute_opened':
        return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
      case 'dispute_resolved':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
      case 'invoice_uploaded':
        return { icon: Upload, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
      default:
        return { icon: FileText, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20' };
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Activity</h1>
          <p className="text-muted-foreground mt-1">
            Recent updates and events related to your account.
          </p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm max-w-3xl">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {error ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <h3 className="font-semibold">Failed to load activity</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={fetchActivity} variant="outline" size="sm">Retry</Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-8 pl-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No recent activity</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                Your timeline is empty. New events like bills being generated or paid will appear here.
              </p>
            </div>
          ) : (
            <div className="relative border-l-2 border-border/50 ml-4 space-y-8 py-4">
              {activities.map((activity) => {
                const style = getActivityStyle(activity.type);
                const Icon = style.icon;
                
                return (
                  <div key={activity.id} className="relative pl-8 sm:pl-10 group">
                    <div className={cn(
                      "absolute -left-[17px] top-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background",
                      style.border,
                      style.color
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {activity.text}
                      </p>
                      <time className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
                        {getRelativeTime(activity.createdAt)}
                      </time>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
