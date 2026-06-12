/**
 * OCRScanView Component
 * Main view that orchestrates the full OCR bill scanning workflow.
 * Step-by-step: Upload → Processing → Review → Save
 */

import { ScanLine, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOCR } from '@/hooks/useOCR';
import { UploadZone } from '@/components/OCR/UploadZone';
import { OCRLoader } from '@/components/OCR/OCRLoader';
import { OCRPreview } from '@/components/OCR/OCRPreview';
import { OCRResultCard } from '@/components/OCR/OCRResultCard';
import { ExtractedBillForm } from '@/components/OCR/ExtractedBillForm';
import { cn } from '@/lib/utils';

export function OCRScanView() {
  const {
    state,
    file,
    preview,
    ocrResult,
    editableData,
    error,
    uploadFile,
    reset,
    setField,
    setItem,
    addItem,
    removeItem,
    setSelectedSupplierId,
    selectedSupplierId,
    startReview,
    saveBill,
  } = useOCR();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-xl px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20">
              <ScanLine className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Scan Bill</h1>
              <p className="text-sm text-muted-foreground">
                Upload a bill image or PDF to extract data automatically
              </p>
            </div>
          </div>

          {state !== 'idle' && state !== 'saved' && (
            <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Start Over
            </Button>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {['Upload', 'Process', 'Review', 'Save'].map((step, i) => {
            const stepStates = [
              ['idle'],
              ['uploading', 'processing'],
              ['parsed', 'reviewing'],
              ['saving', 'saved'],
            ];
            const isActive = stepStates[i].includes(state);
            const isPast = i < stepStates.findIndex((ss) => ss.includes(state));

            return (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && (
                  <div className={cn(
                    'h-px w-8 transition-colors',
                    isPast ? 'bg-primary' : 'bg-border/50',
                  )} />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-all',
                      isActive && 'bg-primary text-primary-foreground scale-110',
                      isPast && 'bg-primary/20 text-primary',
                      !isActive && !isPast && 'bg-muted text-muted-foreground',
                    )}
                  >
                    {isPast ? '✓' : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium hidden sm:inline',
                      isActive && 'text-primary',
                      isPast && 'text-primary/70',
                      !isActive && !isPast && 'text-muted-foreground',
                    )}
                  >
                    {step}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-5xl mx-auto">
        {/* ─── IDLE: Upload Zone ──────────────────────────────────── */}
        {state === 'idle' && (
          <div className="mt-8">
            <UploadZone onFileSelect={uploadFile} />
          </div>
        )}

        {/* ─── UPLOADING / PROCESSING: Loader ────────────────────── */}
        {(state === 'uploading' || state === 'processing') && (
          <OCRLoader />
        )}

        {/* ─── ERROR: Error State ─────────────────────────────────── */}
        {state === 'error' && (
          <div className="mt-8 flex flex-col items-center gap-6 py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
              <span className="text-3xl">⚠️</span>
            </div>
            <div className="text-center space-y-2 max-w-md">
              <h3 className="text-lg font-semibold text-foreground">Processing Failed</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={reset} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* ─── PARSED: Results + Preview ──────────────────────────── */}
        {state === 'parsed' && ocrResult && editableData && (
          <div className="mt-6 space-y-6">
            <OCRResultCard
              parsedData={editableData}
              confidence={ocrResult.metadata.parsingConfidence}
              ocrConfidence={ocrResult.metadata.ocrConfidence}
              onEditAndSave={startReview}
              onScanAnother={reset}
            />

            <OCRPreview
              imagePreview={preview}
              rawText={ocrResult.rawText}
              fileName={file?.name}
              isPdf={file?.type === 'application/pdf'}
            />
          </div>
        )}

        {/* ─── REVIEWING: Edit Form ───────────────────────────────── */}
        {state === 'reviewing' && ocrResult && editableData && (
          <div className="mt-6 space-y-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground"
              onClick={() => startReview()} // Stay on review but could go back
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Results
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form: takes 3 cols */}
              <div className="lg:col-span-3">
                <ExtractedBillForm
                  editableData={editableData}
                  fieldConfidence={ocrResult.metadata.parsingConfidence.fields}
                  matchedSupplier={ocrResult.matchedSupplier}
                  matchConfidence={ocrResult.supplierMatchConfidence}
                  selectedSupplierId={selectedSupplierId}
                  onFieldChange={setField}
                  onItemChange={setItem}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onSupplierChange={setSelectedSupplierId}
                  onSave={saveBill}
                  saving={state === 'saving'}
                  error={error}
                />
              </div>

              {/* Preview: takes 2 cols */}
              <div className="lg:col-span-2">
                <div className="sticky top-32">
                  <OCRPreview
                    imagePreview={preview}
                    rawText={ocrResult.rawText}
                    fileName={file?.name}
                    isPdf={file?.type === 'application/pdf'}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SAVING: Show loader overlay ─────────────────────────── */}
        {state === 'saving' && ocrResult && editableData && (
          <div className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3">
                <ExtractedBillForm
                  editableData={editableData}
                  fieldConfidence={ocrResult.metadata.parsingConfidence.fields}
                  matchedSupplier={ocrResult.matchedSupplier}
                  matchConfidence={ocrResult.supplierMatchConfidence}
                  selectedSupplierId={selectedSupplierId}
                  onFieldChange={setField}
                  onItemChange={setItem}
                  onAddItem={addItem}
                  onRemoveItem={removeItem}
                  onSupplierChange={setSelectedSupplierId}
                  onSave={saveBill}
                  saving={true}
                  error={error}
                />
              </div>
              <div className="lg:col-span-2">
                <OCRPreview
                  imagePreview={preview}
                  rawText={ocrResult.rawText}
                  fileName={file?.name}
                  isPdf={file?.type === 'application/pdf'}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── SAVED: Success State ───────────────────────────────── */}
        {state === 'saved' && (
          <div className="mt-8 flex flex-col items-center gap-6 py-16">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/30">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">Bill Saved Successfully!</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                The scanned bill has been saved to your records. You can view it in the Bills section.
              </p>
            </div>
            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2 bg-gradient-to-r from-primary to-primary/90">
                <ScanLine className="h-4 w-4" />
                Scan Another Bill
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
