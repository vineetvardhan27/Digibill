/**
 * OCRResultCard Component
 * Summary card showing OCR extraction results with confidence meter and quick actions.
 */

import { CheckCircle2, AlertTriangle, XCircle, BarChart3, FileText, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OCRConfidence, ParsedBillData } from '@/types';
import { cn } from '@/lib/utils';

interface OCRResultCardProps {
  parsedData: ParsedBillData;
  confidence: OCRConfidence;
  ocrConfidence: number;
  onEditAndSave: () => void;
  onScanAnother: () => void;
  className?: string;
}

export function OCRResultCard({
  parsedData,
  confidence,
  ocrConfidence,
  onEditAndSave,
  onScanAnother,
  className,
}: OCRResultCardProps) {
  const overallScore = confidence.overall;

  // Determine quality level
  const quality =
    overallScore >= 70 ? 'excellent' :
    overallScore >= 45 ? 'good' :
    overallScore >= 25 ? 'partial' : 'low';

  const qualityConfig = {
    excellent: {
      label: 'Excellent',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      icon: CheckCircle2,
      gradient: 'from-green-500 to-emerald-500',
    },
    good: {
      label: 'Good',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      icon: CheckCircle2,
      gradient: 'from-blue-500 to-cyan-500',
    },
    partial: {
      label: 'Partial',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      icon: AlertTriangle,
      gradient: 'from-yellow-500 to-orange-500',
    },
    low: {
      label: 'Low',
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      icon: XCircle,
      gradient: 'from-red-500 to-rose-500',
    },
  };

  const config = qualityConfig[quality];
  const QualityIcon = config.icon;

  // Count fields
  const fieldStatuses = Object.values(confidence.fields);
  const foundCount = fieldStatuses.filter((s) => s === 'high' || s === 'low').length;
  const totalFields = fieldStatuses.length;
  const itemCount = parsedData.items?.length || 0;

  return (
    <div
      className={cn(
        'rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden',
        config.borderColor,
        className,
      )}
    >
      {/* Header with confidence */}
      <div className={cn('px-6 py-5', config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', config.bgColor)}>
              <QualityIcon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Extraction {config.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                Bill data extracted successfully
              </p>
            </div>
          </div>

          {/* Confidence score */}
          <div className="text-right">
            <p className={cn('text-2xl font-bold', config.color)}>
              {overallScore}%
            </p>
            <p className="text-xs text-muted-foreground">confidence</p>
          </div>
        </div>

        {/* Confidence bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-background/50">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-1000', config.gradient)}
            style={{ width: `${overallScore}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50">
        <div className="flex flex-col items-center gap-1 py-4">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">{ocrConfidence}%</p>
          <p className="text-xs text-muted-foreground">OCR Accuracy</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">
            {foundCount}/{totalFields}
          </p>
          <p className="text-xs text-muted-foreground">Fields Found</p>
        </div>
        <div className="flex flex-col items-center gap-1 py-4">
          <Package className="h-4 w-4 text-muted-foreground" />
          <p className="text-lg font-bold text-foreground">{itemCount}</p>
          <p className="text-xs text-muted-foreground">Items Detected</p>
        </div>
      </div>

      {/* Field status list */}
      <div className="border-t border-border/50 px-6 py-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Field Status
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(confidence.fields).map(([field, status]) => (
            <div key={field} className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  status === 'high' && 'bg-green-500',
                  status === 'low' && 'bg-yellow-500',
                  status === 'missing' && 'bg-muted-foreground/30',
                )}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {field.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/50 px-6 py-4 flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onEditAndSave}
          className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm"
        >
          Review & Save Bill
        </Button>
        <Button
          variant="outline"
          onClick={onScanAnother}
          className="flex-1"
        >
          Scan Another
        </Button>
      </div>
    </div>
  );
}
