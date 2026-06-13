import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Loader2, TrendingUp, AlertCircle, Info, FileText } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useForecast } from '@/hooks/useForecast';
import { formatCurrency } from '@/lib/mockData';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

export function ForecastView() {
  const [days, setDays] = useState<30 | 90>(30);
  const { forecast, loading, error } = useForecast(days);
  const navigate = useNavigate();

  // Sort upcoming bills by date
  const sortedItems = useMemo(() => {
    if (!forecast?.items) return [];
    return [...forecast.items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [forecast?.items]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBillClick = (billId?: string) => {
    if (billId) {
      // Assuming you have a way to view a bill, or just navigate to bills page
      navigate('/bills');
    }
  };

  if (loading && !forecast) {
    return (
      <div className="min-h-screen">
        <Header title="Cash Flow Forecast" subtitle="Predict future outflows based on payment history" />
        <main className="px-8 py-6">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header title="Cash Flow Forecast" subtitle="Predict future outflows based on payment history" />
        <main className="px-8 py-6">
          <div className="flex flex-col justify-center items-center py-20 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground">Failed to load forecast</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        </main>
      </div>
    );
  }

  const totalExpected = (forecast?.totalConfirmed || 0) + (forecast?.totalPredicted || 0);

  return (
    <div className="min-h-screen pb-10">
      <Header title="Cash Flow Forecast" subtitle="Predict future outflows based on payment history" />

      <main className="px-8 py-6 space-y-6">
        {/* Controls */}
        <div className="flex justify-end">
          <ToggleGroup type="single" value={days.toString()} onValueChange={(val) => {
            if (val === '30' || val === '90') setDays(parseInt(val) as 30 | 90);
          }} className="bg-muted/50 p-1 rounded-lg">
            <ToggleGroupItem value="30" className="px-6 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
              30 Days
            </ToggleGroupItem>
            <ToggleGroupItem value="90" className="px-6 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm">
              90 Days
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Confirmed Outflow</p>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-orange-500">₹{formatCurrency(forecast?.totalConfirmed || 0)}</p>
              <p className="text-sm text-muted-foreground mb-1">Pending bills</p>
            </div>
          </Card>
          
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Predicted Outflow</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">Projected based on recurring payment patterns detected from past paid bills.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-3xl font-bold text-blue-500">₹{formatCurrency(forecast?.totalPredicted || 0)}</p>
              <p className="text-sm text-muted-foreground mb-1">Recurring estimates</p>
            </div>
          </Card>
          
          <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp className="h-24 w-24 text-destructive" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2 relative z-10">Total Expected Outflow</p>
            <p className="text-4xl font-bold text-destructive relative z-10">₹{formatCurrency(totalExpected)}</p>
          </Card>
        </div>

        {/* Area Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Daily Outflow Projection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={forecast?.dailyTotals || []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorConfirmed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    dy={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    dx={-10}
                  />
                  <RechartsTooltip 
                    labelFormatter={(label) => formatDate(label as string)}
                    formatter={(value: number, name: string) => [
                      `₹${formatCurrency(value)}`, 
                      name === 'confirmed' ? 'Confirmed' : name === 'predicted' ? 'Predicted' : name
                    ]}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                    itemStyle={{ fontWeight: 600 }}
                  />
                  {/* Stack the areas */}
                  <Area 
                    type="monotone" 
                    dataKey="predicted" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fill="url(#colorPredicted)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="confirmed" 
                    stackId="1" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    fill="url(#colorConfirmed)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                <span className="text-sm text-muted-foreground font-medium">Confirmed (Pending Bills)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-muted-foreground font-medium">Predicted (Recurring)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Table */}
        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-border/50">
            <CardTitle className="text-lg">Upcoming Bills & Projections</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Supplier</th>
                  <th className="px-6 py-4 font-semibold">Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No upcoming outflows detected for this period.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, i) => (
                    <tr key={`${item.supplierId}-${item.date}-${i}`} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4 font-medium">{formatDate(item.date)}</td>
                      <td className="px-6 py-4">{item.supplierName}</td>
                      <td className="px-6 py-4 font-semibold">₹{formatCurrency(item.amount)}</td>
                      <td className="px-6 py-4">
                        {item.type === 'confirmed' ? (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                            Confirmed
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                              Predicted
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Projected based on payment history</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {item.type === 'confirmed' && item.billId && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-primary gap-2"
                            onClick={() => handleBillClick(item.billId)}
                          >
                            <FileText className="h-4 w-4" />
                            View Bill
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
