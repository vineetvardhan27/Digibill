/**
 * OCRLoader Component
 * Animated loading state during OCR processing.
 * Shows progressive status messages with a scanning animation.
 */

import { useState, useEffect } from 'react';
import { Loader2, Upload, Eye, FileSearch, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OCRLoaderProps {
  className?: string;
}

const STAGES = [
  { label: 'Uploading file...', icon: Upload, duration: 1500 },
  { label: 'Preprocessing image...', icon: Eye, duration: 2000 },
  { label: 'Extracting text with OCR...', icon: FileSearch, duration: 8000 },
  { label: 'Parsing bill fields...', icon: CheckCircle2, duration: 2000 },
];

export function OCRLoader({ className }: OCRLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const advanceStage = () => {
      setCurrentStage((prev) => {
        const next = prev + 1;
        if (next < STAGES.length) {
          timeout = setTimeout(advanceStage, STAGES[next].duration);
        }
        return Math.min(next, STAGES.length - 1);
      });
    };

    timeout = setTimeout(advanceStage, STAGES[0].duration);

    return () => clearTimeout(timeout);
  }, []);

  const stage = STAGES[currentStage];
  const StageIcon = stage.icon;
  const progress = ((currentStage + 1) / STAGES.length) * 100;

  return (
    <div className={cn('flex flex-col items-center justify-center gap-8 py-16', className)}>
      {/* Scanning animation */}
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />

        {/* Middle ring */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30">
          {/* Scanning line */}
          <div className="absolute inset-2 overflow-hidden rounded-full">
            <div
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-bounce"
              style={{
                animationDuration: '1.5s',
                top: '50%',
              }}
            />
          </div>

          {/* Icon */}
          <StageIcon className="h-10 w-10 text-primary animate-pulse" />
        </div>
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <p className="text-lg font-semibold text-foreground">{stage.label}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          This may take a few seconds depending on the file size
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Processing</span>
          <span className="text-xs font-medium text-primary">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stage indicators */}
      <div className="flex gap-3">
        {STAGES.map((s, i) => (
          <div
            key={i}
            className={cn(
              'h-2 w-2 rounded-full transition-all duration-500',
              i <= currentStage ? 'bg-primary scale-125' : 'bg-muted-foreground/20',
            )}
          />
        ))}
      </div>
    </div>
  );
}
