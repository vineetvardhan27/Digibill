import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useSupplierHealth } from "@/hooks/useSupplierHealth";
import type { HealthGrade } from "@/types/health";

// ── Grade → Color mapping ──────────────────────────────────────────────────
const gradeConfig: Record<
  HealthGrade,
  { bg: string; text: string; ring: string; stroke: string }
> = {
  Excellent: {
    bg: "bg-green-500/15",
    text: "text-green-500",
    ring: "ring-green-500/30",
    stroke: "stroke-green-500",
  },
  Good: {
    bg: "bg-emerald-400/15",
    text: "text-emerald-400",
    ring: "ring-emerald-400/30",
    stroke: "stroke-emerald-400",
  },
  Fair: {
    bg: "bg-yellow-500/15",
    text: "text-yellow-500",
    ring: "ring-yellow-500/30",
    stroke: "stroke-yellow-500",
  },
  "At Risk": {
    bg: "bg-orange-500/15",
    text: "text-orange-500",
    ring: "ring-orange-500/30",
    stroke: "stroke-orange-500",
  },
  Critical: {
    bg: "bg-red-600/15",
    text: "text-red-600",
    ring: "ring-red-600/30",
    stroke: "stroke-red-600",
  },
};

// ── Insight generator ───────────────────────────────────────────────────────
function getInsight(
  grade: HealthGrade,
  overdueBills: number
): string {
  switch (grade) {
    case "Excellent":
      return "This supplier has a strong payment history. Keep it up!";
    case "Good":
      return "Payments are mostly on time. A few improvements could push this to excellent.";
    case "Fair":
      return "Payment patterns show room for improvement. Monitor due dates closely.";
    case "At Risk":
      return `${overdueBills} bill${overdueBills !== 1 ? "s are" : " is"} currently overdue. Consider reaching out to resolve pending payments.`;
    case "Critical":
      return "Payment history with this supplier is poor. Review your outstanding dues immediately.";
    default:
      return "";
  }
}

// ── Trend Arrow component ───────────────────────────────────────────────────
function TrendIndicator({ trend }: { trend: "improving" | "stable" | "declining" }) {
  if (trend === "improving")
    return (
      <span className="inline-flex items-center gap-1.5 text-green-500 font-semibold text-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Improving
      </span>
    );
  if (trend === "declining")
    return (
      <span className="inline-flex items-center gap-1.5 text-red-500 font-semibold text-sm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M8 4V12M8 12L4 8M8 12L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Declining
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground font-semibold text-sm">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Stable
    </span>
  );
}

// ── Circular Progress SVG ───────────────────────────────────────────────────
function CircularScore({
  score,
  grade,
}: {
  score: number;
  grade: HealthGrade;
}) {
  const [mounted, setMounted] = useState(false);
  const config = gradeConfig[grade];
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    // Trigger the CSS transition on mount
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg
        width="144"
        height="144"
        viewBox="0 0 120 120"
        className="-rotate-90"
      >
        {/* Background track */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/20"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={config.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? offset : circumference}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-4xl font-bold tabular-nums ${config.text}`}>
          {score}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-border/50 p-4 ${
        highlight
          ? "bg-red-500/5 border-red-500/20"
          : "bg-muted/30"
      }`}
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </p>
      <p className={`text-2xl font-bold tabular-nums ${highlight ? "text-red-500" : "text-foreground"}`}>
        {value}
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground ml-0.5">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
interface SupplierHealthDialogProps {
  supplierId: string | null;
  supplierName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupplierHealthDialog({
  supplierId,
  supplierName,
  open,
  onOpenChange,
}: SupplierHealthDialogProps) {
  const { health, loading, error } = useSupplierHealth(
    open ? supplierId : null
  );

  const grade = health?.grade ?? "Good";
  const config = gradeConfig[grade];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            Health Score
            <span className="text-base font-normal text-muted-foreground">
              — {supplierName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {health && !loading && (
          <div className="space-y-6 pt-2">
            {/* Score Circle + Grade */}
            <div className="text-center space-y-3">
              <CircularScore score={health.score} grade={grade} />
              <Badge
                className={`${config.bg} ${config.text} border-0 px-4 py-1 text-sm font-semibold ring-1 ${config.ring}`}
              >
                {grade}
              </Badge>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="On-Time Rate"
                value={health.breakdown.onTimeRate.toFixed(1)}
                suffix="%"
              />
              <StatCard
                label="Avg Days Late"
                value={health.breakdown.avgDaysLate}
                suffix="d"
              />
              <StatCard
                label="Total Bills"
                value={health.breakdown.totalBills}
              />
              <StatCard
                label="Currently Overdue"
                value={health.breakdown.overdueBills}
                highlight={health.breakdown.overdueBills > 0}
              />
            </div>

            {/* Trend */}
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground font-medium">
                Recent Trend
              </span>
              <TrendIndicator trend={health.breakdown.recentTrend} />
            </div>

            {/* Insight */}
            <div className="rounded-xl bg-muted/40 border border-border/30 px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                💡{" "}
                {getInsight(grade, health.breakdown.overdueBills)}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Inline Health Badge (for supplier cards) ────────────────────────────────
export function HealthGradeBadge({ grade }: { grade: HealthGrade }) {
  const config = gradeConfig[grade];
  return (
    <Badge
      className={`${config.bg} ${config.text} border-0 text-[11px] font-semibold px-2 py-0.5 ring-1 ${config.ring}`}
    >
      {grade}
    </Badge>
  );
}
