import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle } from 'lucide-react';
import type { SupplierBill } from '@/types/supplier-portal';
import { supplierFetch } from '@/lib/supplierApi';
import { toast } from 'sonner';

interface DisputeDialogProps {
  bill: SupplierBill;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisputeDialog({ bill, isOpen, onClose, onSuccess }: DisputeDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await supplierFetch<{ success: boolean; data: any }>(`/supplier-portal/bills/${bill._id}/dispute`, {
        method: 'POST',
        data: { reason } // axios uses data, fetch uses body. Since we use axios in supplierFetch:
      });

      if (res.success) {
        toast.success('Dispute submitted. The shop owner will be notified.');
        setReason('');
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit dispute');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Dispute this bill
          </DialogTitle>
          <DialogDescription>
            If you disagree with the amount or line items on this bill, you can raise a dispute. The shop owner will review your reason.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-3 rounded-lg border border-border mt-2">
          <p className="text-sm font-medium">{bill.description}</p>
          <p className="text-lg font-bold text-foreground">₹{formatCurrency(bill.amount)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="reason">Reason for dispute</Label>
              <span className="text-xs text-muted-foreground">
                {reason.length}/500
              </span>
            </div>
            <Textarea
              id="reason"
              placeholder="e.g. The delivery was short by 2 items, the total should be ₹8,000"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              className="min-h-[100px] resize-none"
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Dispute
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
