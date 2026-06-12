/**
 * BillScanUploader Component
 * Compact drag-and-drop image uploader with AI scanning overlay.
 * Designed to fit inside the Add Bill dialog.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Sparkles, CheckCircle2, Camera, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillScanUploaderProps {
  /** Whether a scan is currently in progress */
  isScanning: boolean;
  /** Preview URL for the selected image */
  previewUrl: string | null;
  /** Callback when a file is selected */
  onFileSelect: (file: File) => void;
  /** Callback to clear the selected file */
  onClear: () => void;
  /** Whether the scan completed successfully */
  scanComplete: boolean;
  /** Confidence level of the completed scan */
  confidence?: 'high' | 'medium' | 'low' | null;
  /** Disable the uploader */
  disabled?: boolean;
}

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.webp,.heic';
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];

export function BillScanUploader({
  isScanning,
  previewUrl,
  onFileSelect,
  onClear,
  scanComplete,
  confidence,
  disabled = false,
}: BillScanUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        return; // Validation handled in the hook
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isScanning) setIsDragging(true);
    },
    [disabled, isScanning]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled || isScanning) return;
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    },
    [disabled, isScanning, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFile(files[0]);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [handleFile]
  );

  // ─── Preview State (image selected) ────────────────────────────────────────
  if (previewUrl) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-muted/30">
        {/* Image preview */}
        <div className="relative aspect-[16/9] max-h-[180px]">
          <img
            src={previewUrl}
            alt="Bill preview"
            className={cn(
              'w-full h-full object-cover transition-all duration-300',
              isScanning && 'blur-[2px] brightness-75'
            )}
          />

          {/* Scanning overlay */}
          {isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 backdrop-blur-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-white">Scanning bill with AI...</p>
                <p className="text-xs text-white/70 mt-0.5">This may take a few seconds</p>
              </div>
              {/* Animated scan line */}
              <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
            </div>
          )}

          {/* Scan complete overlay */}
          {scanComplete && !isScanning && (
            <div className="absolute top-2 left-2">
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold backdrop-blur-md',
                  confidence === 'high' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                  confidence === 'medium' && 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                  confidence === 'low' && 'bg-red-500/20 text-red-300 border border-red-500/30'
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                {confidence === 'high' ? 'AI Scanned' : confidence === 'medium' ? 'Partial Scan' : 'Low Confidence'}
              </div>
            </div>
          )}

          {/* Clear button */}
          {!isScanning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/60 transition-all"
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── Upload State (no file selected) ───────────────────────────────────────
  return (
    <div>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all duration-300 group overflow-hidden',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-lg shadow-primary/10'
            : 'border-border/50 hover:border-primary/40 hover:bg-muted/30 hover:shadow-md hover:shadow-primary/5',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className={cn(
              'absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent transition-all duration-500',
              isDragging ? 'scale-150 opacity-100' : 'scale-100 opacity-40 group-hover:scale-125 group-hover:opacity-70'
            )}
          />
          <div
            className={cn(
              'absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-gradient-to-tr from-violet-500/5 to-transparent transition-all duration-500',
              isDragging ? 'scale-150 opacity-100' : 'scale-100 opacity-40 group-hover:scale-125 group-hover:opacity-70'
            )}
          />
        </div>

        {/* Icon */}
        <div className="relative">
          <div
            className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300',
              isDragging
                ? 'bg-primary/15 scale-110'
                : 'bg-gradient-to-br from-primary/10 to-violet-500/5 group-hover:scale-105'
            )}
          >
            {isDragging ? (
              <ImagePlus className="h-6 w-6 text-primary animate-bounce" />
            ) : (
              <Camera className="h-6 w-6 text-primary/70 group-hover:text-primary transition-colors" />
            )}
          </div>
          <Sparkles
            className={cn(
              'absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-400 transition-all duration-500',
              isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-60 scale-75 group-hover:scale-100'
            )}
          />
        </div>

        {/* Text */}
        <div className="text-center relative z-10">
          <p className="text-sm font-semibold text-foreground">
            {isDragging ? 'Drop your bill here' : 'Scan bill with AI'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isDragging ? 'Release to start' : 'Drop an image or click to upload'}
          </p>
        </div>

        {/* Format badges */}
        <div className="flex flex-wrap justify-center gap-1.5 relative z-10">
          {['JPG', 'PNG', 'WEBP', 'HEIC'].map((fmt) => (
            <span
              key={fmt}
              className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              {fmt}
            </span>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          id="bill-scan-upload"
        />
      </div>

      {/* Scan line animation style */}
      <style>{`
        @keyframes scan-line {
          0% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
          position: absolute;
        }
      `}</style>
    </div>
  );
}
