/**
 * UploadZone Component
 * Premium drag-and-drop file upload area with click-to-browse and camera support.
 * Features animated gradient border, ripple effects, and real-time file validation.
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, FileImage, FileText, Camera, X, ImagePlus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_TYPES = '.jpg,.jpeg,.png,.pdf';
const MAX_SIZE_MB = 10;

export function UploadZone({ onFileSelect, disabled = false, className }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);

      // Validate type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setValidationError(`Invalid file type: ${file.type.split('/')[1]?.toUpperCase() || 'Unknown'}. Accepted: JPG, PNG, PDF`);
        return;
      }

      // Validate size
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setValidationError(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Maximum: ${MAX_SIZE_MB}MB`);
        return;
      }

      setSelectedFile(file);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left || clientX > rect.right ||
      clientY < rect.top || clientY > rect.bottom
    ) {
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

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [previewUrl]);

  return (
    <div className={cn('w-full', className)}>
      {/* Validation Error */}
      {validationError && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-destructive/5 border border-destructive/20 px-4 py-3 animate-slide-up">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 flex-shrink-0">
            <X className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-sm text-destructive font-medium">{validationError}</p>
          <button
            onClick={() => setValidationError(null)}
            className="ml-auto p-1 rounded-full hover:bg-destructive/10 text-destructive/60 hover:text-destructive transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File Preview (if selected) */}
      {selectedFile && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 animate-slide-up">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-14 w-14 rounded-lg object-cover border border-border/50 shadow-sm"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
              <FileText className="h-7 w-7 text-orange-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {selectedFile.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                selectedFile.type.includes('pdf')
                  ? 'bg-orange-500/10 text-orange-600'
                  : 'bg-blue-500/10 text-blue-600'
              )}>
                {selectedFile.type.split('/')[1]?.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={clearSelection}
            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center gap-5 rounded-2xl border-2 border-dashed p-8 md:p-14 cursor-pointer transition-all duration-500 group overflow-hidden',
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.01] shadow-xl shadow-primary/10'
            : 'border-border/50 hover:border-primary/40 hover:bg-muted/20 hover:shadow-lg hover:shadow-primary/5',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={cn(
            'absolute -top-12 -right-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/5 to-transparent transition-all duration-700',
            isDragging ? 'scale-150 opacity-100' : 'scale-100 opacity-50 group-hover:scale-125 group-hover:opacity-80',
          )} />
          <div className={cn(
            'absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-tr from-violet-500/5 to-transparent transition-all duration-700',
            isDragging ? 'scale-150 opacity-100' : 'scale-100 opacity-50 group-hover:scale-125 group-hover:opacity-80',
          )} />
        </div>

        {/* Animated upload icon */}
        <div className="relative">
          <div
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-2xl transition-all duration-500',
              isDragging
                ? 'bg-primary/15 scale-110 shadow-lg shadow-primary/10'
                : 'bg-gradient-to-br from-primary/10 via-primary/5 to-violet-500/5 group-hover:scale-105 group-hover:shadow-md group-hover:shadow-primary/5',
            )}
          >
            {isDragging ? (
              <ImagePlus className="h-9 w-9 text-primary animate-bounce" />
            ) : (
              <Upload className="h-9 w-9 text-primary/70 group-hover:text-primary transition-colors duration-300" />
            )}
          </div>
          {/* Sparkle decoration */}
          <Sparkles className={cn(
            'absolute -top-1 -right-1 h-4 w-4 text-amber-400 transition-all duration-500',
            isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-70 scale-75 group-hover:scale-100'
          )} />
        </div>

        {/* Text */}
        <div className="text-center space-y-2 relative z-10">
          <p className="text-lg font-bold text-foreground">
            {isDragging ? 'Drop your bill here' : 'Upload bill image or PDF'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isDragging
              ? 'Release to start scanning'
              : 'Drag and drop, click to browse, or use your camera'}
          </p>
        </div>

        {/* Format badges */}
        <div className="flex flex-wrap justify-center gap-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors group-hover:bg-blue-500/15">
            <FileImage className="h-3.5 w-3.5" />
            JPG
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors group-hover:bg-emerald-500/15">
            <FileImage className="h-3.5 w-3.5" />
            PNG
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-600 transition-colors group-hover:bg-orange-500/15">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </span>
        </div>

        {/* Size limit */}
        <p className="text-xs text-muted-foreground/60 relative z-10">
          Max file size: {MAX_SIZE_MB} MB • Powered by AI OCR
        </p>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          id="ocr-file-upload"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
          id="ocr-camera-capture"
        />
      </div>

      {/* Mobile camera button */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        id="ocr-camera-button"
        className={cn(
          'mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-all duration-300',
          'hover:border-primary/30 hover:text-foreground hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5',
          'active:scale-[0.99]',
          'md:hidden',
          disabled && 'opacity-50 pointer-events-none',
        )}
      >
        <Camera className="h-5 w-5" />
        Take Photo with Camera
      </button>
    </div>
  );
}
