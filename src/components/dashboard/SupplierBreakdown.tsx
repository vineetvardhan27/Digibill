import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/mockData";
import { Loader2, Users } from "lucide-react";
import { analyticsAPI } from "@/lib/api";

const colors = [
  "bg-primary",
  "bg-accent",
  "bg-success",
  "bg-chart-4",
  "bg-chart-5",
];

interface SupplierSpend {
  supplierName: string;
  totalSpend: number;
  percentage: number;
}

export function SupplierBreakdown() {
  const [suppliers, setSuppliers] = useState<SupplierSpend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSupplierData();
  }, []);

  const fetchSupplierData = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getCharts();
      setSuppliers(response.data.supplierBreakdown?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch supplier breakdown:', error);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Top Suppliers by Spend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No supplier data available</p>
            <p className="text-xs text-muted-foreground mt-1">Add suppliers and bills to see breakdown</p>
          </div>
        ) : (
          suppliers.map((supplier, index) => (
            <div key={supplier.supplierName} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground truncate max-w-[60%]">
                  {supplier.supplierName}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(supplier.totalSpend)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                    style={{ width: `${supplier.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-10 text-right">
                  {supplier.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
