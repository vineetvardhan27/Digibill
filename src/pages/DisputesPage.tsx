import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, AlertCircle, FileText, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { billAPI } from '@/lib/api';

interface Dispute {
  _id: string;
  billId: {
    _id: string;
    amount: number;
    description: string;
  };
  supplierId: {
    _id: string;
    name: string;
  };
  reason: string;
  status: 'open' | 'resolved' | 'rejected';
  createdAt: string;
  ownerNote?: string;
}

export function DisputesPage({ connectionId, hideHeader }: { connectionId?: string; hideHeader?: boolean }) {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');

  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [actionType, setActionType] = useState<'resolve' | 'reject' | null>(null);
  const [ownerNote, setOwnerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setIsLoading(true);
    try {
      const res = await billAPI.getDisputes({ status: statusFilter, connectionId });
      if (res.success) {
        setDisputes(res.data);
      }
    } catch (err: any) {
      if (err.message?.includes('404')) {
        setDisputes([]);
      } else {
        setError(err.message || 'Failed to fetch disputes');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  const handleActionClick = (dispute: Dispute, action: 'resolve' | 'reject') => {
    setSelectedDispute(dispute);
    setActionType(action);
    setOwnerNote('');
  };

  const submitAction = async () => {
    if (!selectedDispute || !actionType) return;
    
    setIsSubmitting(true);
    try {
      const res = await billAPI.updateDispute(selectedDispute._id, {
        status: actionType === 'resolve' ? 'resolved' : 'rejected',
        ownerNote
      });

      if (res.success) {
        toast.success(`Dispute ${actionType === 'resolve' ? 'resolved' : 'rejected'} successfully`);
        setSelectedDispute(null);
        fetchDisputes(); // Refresh
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className={hideHeader ? "pt-2 space-y-6" : "p-4 md:p-8 space-y-6"}>
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supplier Disputes</h1>
          <p className="text-muted-foreground mt-1">Review and resolve issues raised by your suppliers.</p>
        </div>
      )}

      <Tabs defaultValue="open" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>

      {error ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-border/50">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold">Failed to load disputes</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchDisputes} className="mt-4" variant="outline" size="sm">Retry</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
        </div>
      ) : disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-muted/10 rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No {statusFilter} disputes</h3>
          <p className="text-muted-foreground mt-1 max-w-sm">
            Everything is looking good. There are no disputes in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {disputes.map((dispute) => (
            <Card key={dispute._id} className="shadow-sm border-border/50 flex flex-col">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dispute.supplierId.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">Raised on {formatDate(dispute.createdAt)}</p>
                    </div>
                  </div>
                  {dispute.status === 'open' && <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">Open</Badge>}
                  {dispute.status === 'resolved' && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Resolved</Badge>}
                  {dispute.status === 'rejected' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>}
                </div>
              </CardHeader>
              <CardContent className="py-4 space-y-4 flex-1">
                <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{dispute.billId.description}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">₹{formatCurrency(dispute.billId.amount)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dispute Reason</p>
                  <p className="text-sm text-foreground bg-destructive/5 p-3 rounded border border-destructive/10">
                    {dispute.reason}
                  </p>
                </div>

                {dispute.ownerNote && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Your Reply</p>
                    <p className="text-sm text-foreground bg-primary/5 p-3 rounded border border-primary/10">
                      {dispute.ownerNote}
                    </p>
                  </div>
                )}
              </CardContent>
              {dispute.status === 'open' && (
                <div className="p-4 border-t border-border/50 bg-muted/10 flex gap-2 justify-end">
                  <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={() => handleActionClick(dispute, 'reject')}>
                    Reject
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleActionClick(dispute, 'resolve')}>
                    Resolve
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedDispute} onOpenChange={(open) => !open && setSelectedDispute(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === 'resolve' ? 'Resolve Dispute' : 'Reject Dispute'}
            </DialogTitle>
            <DialogDescription>
              Add a note for the supplier explaining your decision. They will see this in their portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reply to Supplier (Optional)</Label>
              <Textarea 
                placeholder="Explain the resolution or reason for rejection..."
                value={ownerNote}
                onChange={(e) => setOwnerNote(e.target.value)}
                className="resize-none min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)} disabled={isSubmitting}>Cancel</Button>
            <Button 
              variant={actionType === 'reject' ? 'destructive' : 'default'}
              className={actionType === 'resolve' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={submitAction}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : `Confirm ${actionType === 'resolve' ? 'Resolution' : 'Rejection'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
