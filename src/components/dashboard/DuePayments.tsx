import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Loader2, CheckCircle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { differenceInDays } from "date-fns";
import { billAPI } from "@/lib/api";
import { Bill } from "@/types";
import { toast } from "sonner";

export function DuePayments() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingBillId, setPayingBillId] = useState<string | null>(null);

  useEffect(() => {
    fetchDueBills();
  }, []);

  const fetchDueBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getBills({ 
        isPaid: false,
        sortBy: 'dueDate',
        order: 'asc'
      });
      const dueBills = (response.data.bills || [])
        .filter((bill: Bill) => bill.dueDate)
        .slice(0, 3);
      setBills(dueBills);
    } catch (error) {
      console.error('Failed to fetch due bills:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = async (billId: string) => {
    try {
      setPayingBillId(billId);
      await billAPI.markAsPaid(billId);
      toast.success('Bill marked as paid');
      fetchDueBills();
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark bill as paid');
    } finally {
      setPayingBillId(null);
    }
  };

  return (
    <Card className="col-span-full border-warning/30 bg-warning/5">
      <CardHeader className="pb-3 flex flex-row items-center gap-2">
        <AlertCircle className="h-5 w-5 text-warning" />
        <CardTitle className="text-lg">Due Payments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bills.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <CheckCircle className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">
              No pending payments! 🎉
            </p>
          </div>
        ) : (
          bills.map((bill) => {
            const supplierName = typeof bill.supplierId === 'object'
              ? bill.supplierId.name
              : bill.supplier?.name || 'Unknown Supplier';
            const dueDate = new Date(bill.dueDate!);
            const daysUntilDue = differenceInDays(dueDate, new Date());
            const isOverdue = daysUntilDue < 0;
            const isUrgent = daysUntilDue >= 0 && daysUntilDue <= 3;
            const billId = bill._id || bill.id || '';

            return (
              <div
                key={billId}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {supplierName}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <span
                      className={
                        isOverdue
                          ? "text-destructive font-medium"
                          : isUrgent
                          ? "text-warning font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : `Due ${formatDate(dueDate)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(bill.amount)}
                  </span>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-8"
                    onClick={() => handlePayBill(billId)}
                    disabled={payingBillId === billId}
                  >
                    {payingBillId === billId ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Pay'
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
