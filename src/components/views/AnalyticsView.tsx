import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency } from "@/lib/mockData";
import { TrendingUp, Package, Loader2, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import { analyticsAPI } from "@/lib/api";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface MonthlyData {
  monthName: string;
  totalAmount: number;
  billCount: number;
}

interface SupplierSpend {
  supplierName: string;
  totalSpend: number;
  percentage: number;
  billCount: number;
}

interface CategoryData {
  itemName: string;
  totalQuantity: number;
  totalValue: number;
}

export function AnalyticsView() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [supplierData, setSupplierData] = useState<SupplierSpend[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgMonthly, setAvgMonthly] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await analyticsAPI.getCharts(6);
      
      const monthly = response.data.monthlySpend || [];
      const suppliers = response.data.supplierBreakdown || [];
      const categories = response.data.categoryBreakdown || [];
      
      setMonthlyData(monthly);
      setSupplierData(suppliers);
      setCategoryData(categories);
      
      // Calculate average monthly spend
      const avg = monthly.length > 0
        ? monthly.reduce((sum, m) => sum + m.totalAmount, 0) / monthly.length
        : 0;
      setAvgMonthly(avg);
      
      // Calculate total unique products
      setTotalProducts(categories.length);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setMonthlyData([]);
      setSupplierData([]);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Analytics" subtitle="Detailed insights and business reports" />
        <main className="px-8 py-6">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Analytics" subtitle="Detailed insights and business reports" />

      <main className="px-8 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-success/10 shadow-lg">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Avg. Monthly Spend</p>
                <p className="text-lg font-bold">{formatCurrency(avgMonthly)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 shadow-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Unique Products</p>
                <p className="text-lg font-bold">{totalProducts}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Monthly Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No spending data available</p>
                <p className="text-xs text-muted-foreground mt-1">Add bills to see monthly trends</p>
              </div>
            ) : (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="monthName"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `₹${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Spend"]}
                    />
                    <Bar
                      dataKey="totalAmount"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Supplier Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {supplierData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <PieChartIcon className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No supplier data available</p>
                <p className="text-xs text-muted-foreground mt-1">Add suppliers and bills to see distribution</p>
              </div>
            ) : (
              <>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={supplierData.slice(0, 5)}
                        dataKey="totalSpend"
                        nameKey="supplierName"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {supplierData.slice(0, 5).map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "0.5rem",
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center">
                  {supplierData.slice(0, 5).map((item, index) => (
                    <div key={item.supplierName} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {item.supplierName} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Top Products by Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {categoryData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No product data available</p>
                <p className="text-xs text-muted-foreground mt-1">Add bills with item details to see top products</p>
              </div>
            ) : (
              categoryData.slice(0, 5).map((product, index) => (
                <div
                  key={product.itemName}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{product.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {product.totalQuantity}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(product.totalValue)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
