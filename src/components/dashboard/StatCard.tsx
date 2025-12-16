import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "accent" | "success" | "warning" | "destructive";
}

const colorStyles = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({
  title,
  value,
  change,
  icon: Icon,
  trend = "neutral",
  color = "primary",
}: StatCardProps) {
  return (
    <Card variant="stat" className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div
                className={cn(
                  "flex items-center gap-1 text-sm font-semibold",
                  trend === "up" && "text-success",
                  trend === "down" && "text-destructive",
                  trend === "neutral" && "text-muted-foreground"
                )}
              >
                {trend === "up" && "↑"}
                {trend === "down" && "↓"}
                {Math.abs(change)}% from last month
              </div>
            )}
          </div>
          <div className={cn("rounded-2xl p-4 shadow-lg", colorStyles[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </div>
    </Card>
  );
}
