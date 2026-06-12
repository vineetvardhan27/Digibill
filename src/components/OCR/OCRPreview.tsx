/**
 * OCRPreview Component
 * Displays the uploaded bill image alongside extracted raw text.
 * Responsive: side-by-side on desktop, stacked on mobile.
 */

import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, FileText, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OCRPreviewProps {
  imagePreview: string | null;
  rawText: string;
  fileName?: string;
  isPdf?: boolean;
  className?: string;
}

export function OCRPreview({
  imagePreview,
  rawText,
  fileName,
  isPdf = false,
  className,
}: OCRPreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {/* Image Preview */}
      <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {isPdf ? 'PDF Document' : 'Bill Image'}
            </span>
            {fileName && (
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                — {fileName}
              </span>
            )}
          </div>

          {/* Zoom controls */}
          {imagePreview && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-mono text-muted-foreground w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleResetZoom}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative h-[400px] overflow-auto bg-muted/20 p-4">
          {imagePreview ? (
            <div className="flex items-center justify-center min-h-full">
              <img
                src={imagePreview}
                alt="Uploaded bill"
                className="max-w-full rounded-lg shadow-sm transition-transform duration-200"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <FileText className="h-12 w-12 opacity-40" />
              <p className="text-sm">
                {isPdf ? 'PDF preview not available' : 'No image preview'}
              </p>
              {fileName && (
                <p className="text-xs font-medium">{fileName}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raw Text Output */}
      <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-foreground">Extracted Text</span>
            <span className="text-xs text-muted-foreground">
              {rawText.length} characters
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={handleCopyText}
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
        </div>

        <div className="h-[400px] overflow-auto p-4">
          {rawText ? (
            <pre className="text-sm leading-relaxed text-foreground/80 font-mono whitespace-pre-wrap break-words">
              {rawText}
            </pre>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <p className="text-sm">No text extracted</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
