import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/mockData";
import { ChevronRight, Loader2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { billAPI } from "@/lib/api";
import { Bill } from "@/types";
import { useNavigate } from "react-router-dom";

export function RecentBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentBills();
  }, []);

  const fetchRecentBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getBills({ 
        sortBy: 'date', 
        order: 'desc', 
        limit: 5 
      });
      setBills(response.data.bills || []);
    } catch (error) {
      console.error('Failed to fetch recent bills:', error);
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Bills</CardTitle>
        <button 
          onClick={() => navigate('/bills')}
          className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
        >
          View All <ChevronRight className="h-4 w-4" />
        </button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : bills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No bills found</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first bill to get started</p>
          </div>
        ) : (
          bills.slice(0, 4).map((bill) => {
            const supplierName = typeof bill.supplierId === 'object' 
              ? bill.supplierId.name 
              : bill.supplier?.name || 'Unknown Supplier';
            
            return (
              <div
                key={bill._id || bill.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate('/bills')}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {supplierName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(bill.date)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={bill.isPaid ? "default" : "destructive"}
                    className={cn(
                      "text-xs",
                      bill.isPaid && "bg-success hover:bg-success/90"
                    )}
                  >
                    {bill.isPaid ? "Paid" : "Pending"}
                  </Badge>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(bill.amount)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
