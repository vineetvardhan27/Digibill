import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { SupplierBill } from '@/types/supplier-portal';
import { CheckCircle2, AlertTriangle, FileText, Upload, Link as LinkIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BillDetailSheetProps {
  bill: SupplierBill;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onDispute: () => void;
}

export function BillDetailSheet({ bill, isOpen, onClose, onAcknowledge, onDispute }: BillDetailSheetProps) {
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

  const calculateSubtotal = () => {
    if (!bill.lineItems || bill.lineItems.length === 0) return bill.amount;
    return bill.lineItems.reduce((acc, item) => acc + item.total, 0);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border/50">
          <div className="flex justify-between items-start">
            <div>
              <SheetTitle className="text-3xl font-bold tracking-tight text-foreground">
                ₹{formatCurrency(bill.amount)}
              </SheetTitle>
              <SheetDescription className="mt-1 text-base">
                {bill.description}
              </SheetDescription>
            </div>
            <div>
              {bill.status === 'pending' && <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20 px-3 py-1 text-sm">Pending</Badge>}
              {bill.status === 'paid' && <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 px-3 py-1 text-sm">Paid</Badge>}
              {bill.status === 'disputed' && <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 px-3 py-1 text-sm">Disputed</Badge>}
            </div>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Created On</p>
              <p className="font-medium text-foreground">{formatDate(bill.createdAt)}</p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Due Date</p>
              <p className="font-medium text-foreground">{formatDate(bill.dueDate)}</p>
            </div>
          </div>

          {/* Acknowledgement & Dispute Status */}
          <div className="space-y-3">
            {bill.acknowledgedAt ? (
              <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Acknowledged on {formatDate(bill.acknowledgedAt)}</span>
              </div>
            ) : bill.status !== 'paid' ? (
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-muted-foreground">Not yet acknowledged</span>
                <Button size="sm" onClick={() => onAcknowledge(bill._id)}>Acknowledge Now</Button>
              </div>
            ) : null}

            {bill.dispute ? (
              <div className="space-y-2 bg-destructive/5 p-4 rounded-lg border border-destructive/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-destructive font-semibold">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Disputed on {formatDate(bill.dispute.createdAt)}</span>
                  </div>
                  <Badge variant="outline" className="border-destructive/50 text-destructive bg-background">
                    {bill.dispute.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-foreground bg-background/50 p-2 rounded border border-destructive/10">
                  <span className="font-medium text-muted-foreground block mb-1">Reason:</span>
                  {bill.dispute.reason}
                </p>
                {bill.dispute.ownerNote && (
                  <p className="text-sm text-foreground bg-primary/5 p-2 rounded border border-primary/10 mt-2">
                    <span className="font-medium text-primary block mb-1">Shop Owner Reply:</span>
                    {bill.dispute.ownerNote}
                  </p>
                )}
              </div>
            ) : bill.status !== 'paid' ? (
              <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border border-border">
                <span className="text-sm font-medium text-muted-foreground">No dispute raised</span>
                <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20" onClick={onDispute}>
                  Raise Dispute
                </Button>
              </div>
            ) : null}
          </div>

          <Separator className="my-6" />

          {/* Line Items */}
          <div>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              Line Items
            </h3>
            
            {bill.lineItems && bill.lineItems.length > 0 ? (
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold text-right">Qty</th>
                      <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {bill.lineItems.map((item, index) => (
                      <tr key={index} className="bg-background">
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right">{item.quantity}</td>
                        <td className="px-4 py-3 text-right">₹{formatCurrency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-right font-medium">₹{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/20 font-semibold border-t-2 border-border">
                      <td colSpan={3} className="px-4 py-3 text-right">Total Amount</td>
                      <td className="px-4 py-3 text-right text-base text-primary">₹{formatCurrency(bill.amount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-muted/30 p-4 rounded-lg text-center text-muted-foreground text-sm border border-dashed border-border">
                No specific line items provided for this bill.
              </div>
            )}
          </div>

          {/* Linked Invoices */}
          {bill.invoices && bill.invoices.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
                Linked Invoices
              </h3>
              <div className="space-y-3">
                {bill.invoices.map((inv) => (
                  <div key={inv._id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg bg-background">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{inv.fileName}</p>
                        <p className="text-xs text-muted-foreground">Uploaded {formatDate(inv.uploadedAt)}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={inv.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </SheetContent>
    </Sheet>
  );
}
