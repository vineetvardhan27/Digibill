/**
 * ExtractedBillForm Component
 * Pre-filled bill form using OCR-extracted data.
 * All fields are editable for manual correction with confidence indicators.
 */

import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, AlertCircle, CheckCircle2, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Supplier, ParsedBillData, ParsedBillItem, OCRFieldConfidence, MatchedSupplier } from '@/types';
import { supplierAPI } from '@/lib/api';
import { cn } from '@/lib/utils';
import { GSTLineItemEditor } from '../bills/GSTLineItemEditor';
import { GSTSummary } from '@/types/gst';

interface ExtractedBillFormProps {
  editableData: ParsedBillData;
  fieldConfidence: OCRFieldConfidence;
  matchedSupplier: MatchedSupplier | null;
  matchConfidence: number;
  selectedSupplierId: string;
  onFieldChange: <K extends keyof ParsedBillData>(field: K, value: ParsedBillData[K]) => void;
  onItemChange: (index: number, item: ParsedBillItem) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSupplierChange: (id: string) => void;
  onSave: () => void;
  saving?: boolean;
  error?: string | null;
  className?: string;
}

function ConfidenceBadge({ level }: { level: 'high' | 'low' | 'missing' }) {
  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
        <CheckCircle2 className="h-2.5 w-2.5" />
        Auto
      </span>
    );
  }
  if (level === 'low') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-yellow-600 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
        <AlertCircle className="h-2.5 w-2.5" />
        Review
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
      <MinusCircle className="h-2.5 w-2.5" />
      Manual
    </span>
  );
}

export function ExtractedBillForm({
  editableData,
  fieldConfidence,
  matchedSupplier,
  matchConfidence,
  selectedSupplierId,
  onFieldChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onSupplierChange,
  onSave,
  saving = false,
  error,
  className,
}: ExtractedBillFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Fetch suppliers for the dropdown
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        const response = await supplierAPI.getSuppliers({ limit: 200 });
        setSuppliers(response.data.suppliers);
      } catch {
        console.error('Failed to fetch suppliers');
      } finally {
        setLoadingSuppliers(false);
      }
    };
    fetchSuppliers();
  }, []);

  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleTotalsChange = (totals: GSTSummary) => {
    if (totals.grandTotal !== editableData.totalAmount) {
      // Auto-update total amount to match the items total
      onFieldChange('totalAmount', totals.grandTotal);
      onFieldChange('subtotal', totals.subtotal);
      onFieldChange('totalCGST', totals.totalCGST);
      onFieldChange('totalSGST', totals.totalSGST);
      onFieldChange('totalIGST', totals.totalIGST);
    }
  };

  return (
    <div className={cn('rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm', className)}>
      {/* Header */}
      <div className="border-b border-border/50 px-6 py-4">
        <h3 className="text-lg font-semibold text-foreground">Review Extracted Data</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Verify and correct the extracted fields before saving
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Supplier Selection ──────────────────────────────────── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="supplier" className="text-sm font-medium">
              Supplier *
            </Label>
            {matchedSupplier && (
              <span className="text-[10px] font-medium text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                Auto-matched ({Math.round(matchConfidence * 100)}%)
              </span>
            )}
          </div>
          <select
            id="supplier"
            value={selectedSupplierId}
            onChange={(e) => onSupplierChange(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="">Select a supplier...</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {s._id === matchedSupplier?._id ? '(Matched)' : ''}
              </option>
            ))}
          </select>
          {editableData.supplierName && !matchedSupplier && (
            <p className="text-xs text-yellow-600">
              OCR detected "{editableData.supplierName}" but no matching supplier found. Select manually or create a new supplier.
            </p>
          )}
        </div>

        {/* ─── Core Fields ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Invoice Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="invoiceNumber" className="text-sm font-medium">Invoice #</Label>
              <ConfidenceBadge level={fieldConfidence.invoiceNumber} />
            </div>
            <Input
              id="invoiceNumber"
              value={editableData.invoiceNumber || ''}
              onChange={(e) => onFieldChange('invoiceNumber', e.target.value || null)}
              placeholder="e.g., INV-001"
            />
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="totalAmount" className="text-sm font-medium">Total Amount (₹) *</Label>
              <ConfidenceBadge level={fieldConfidence.totalAmount} />
            </div>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={editableData.totalAmount ?? ''}
              onChange={(e) => onFieldChange('totalAmount', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0.00"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="date" className="text-sm font-medium">Bill Date</Label>
              <ConfidenceBadge level={fieldConfidence.date} />
            </div>
            <Input
              id="date"
              type="date"
              value={formatDateForInput(editableData.date)}
              onChange={(e) => onFieldChange('date', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="dueDate" className="text-sm font-medium">Due Date</Label>
              <ConfidenceBadge level={fieldConfidence.dueDate} />
            </div>
            <Input
              id="dueDate"
              type="date"
              value={formatDateForInput(editableData.dueDate)}
              onChange={(e) => onFieldChange('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)}
            />
          </div>

          {/* GST Number */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="gstNumber" className="text-sm font-medium">GST Number</Label>
              <ConfidenceBadge level={fieldConfidence.gstNumber} />
            </div>
            <Input
              id="gstNumber"
              value={editableData.gstNumber || ''}
              onChange={(e) => onFieldChange('gstNumber', e.target.value || null)}
              placeholder="e.g., 27AAACB1234F1Z5"
            />
          </div>

          {/* Tax */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="tax" className="text-sm font-medium">Tax (₹)</Label>
              <ConfidenceBadge level={fieldConfidence.tax} />
            </div>
            <Input
              id="tax"
              type="number"
              step="0.01"
              min="0"
              value={editableData.tax ?? ''}
              onChange={(e) => onFieldChange('tax', e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* ─── Line Items ─────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Line Items</Label>
              <ConfidenceBadge level={fieldConfidence.items} />
              <span className="text-xs text-muted-foreground">
                ({editableData.items.length} items)
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={onAddItem}
            >
              <Plus className="h-3 w-3" />
              Add Item
            </Button>
          </div>

          <GSTLineItemEditor
            items={editableData.items as any}
            onChange={(newItems) => onFieldChange('items', newItems as any)}
            onTotalsChange={handleTotalsChange}
          />
        </div>

        {/* ─── Save Button ────────────────────────────────────────── */}
        <div className="pt-2 border-t border-border/30">
          <Button
            onClick={onSave}
            disabled={saving || !selectedSupplierId || !editableData.totalAmount}
            className="w-full h-11 gap-2 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm text-base font-semibold"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Bill'}
          </Button>
          {(!selectedSupplierId || !editableData.totalAmount) && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Supplier and total amount are required to save
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
