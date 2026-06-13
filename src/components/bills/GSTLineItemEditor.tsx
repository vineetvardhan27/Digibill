import React, { useMemo } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GSTLineItem, GSTRate, GSTType, calculateLineItem, calculateBillTotals } from '@/types/gst';

interface GSTLineItemEditorProps {
  items: Partial<GSTLineItem>[];
  onChange: (items: Partial<GSTLineItem>[]) => void;
  onTotalsChange?: (totals: ReturnType<typeof calculateBillTotals>) => void;
  readOnly?: boolean;
}

export function GSTLineItemEditor({
  items,
  onChange,
  onTotalsChange,
  readOnly = false,
}: GSTLineItemEditorProps) {
  // Compute full lines with all totals live
  const computedItems = useMemo(() => {
    return items.map(calculateLineItem);
  }, [items]);

  // Compute bill totals
  const totals = useMemo(() => {
    const calculatedTotals = calculateBillTotals(computedItems);
    if (onTotalsChange) {
      setTimeout(() => onTotalsChange(calculatedTotals), 0);
    }
    return calculatedTotals;
  }, [computedItems, onTotalsChange]);

  const handleUpdate = (index: number, field: keyof GSTLineItem, value: any) => {
    if (readOnly) return;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const handleAddRow = () => {
    if (readOnly) return;
    onChange([
      ...items,
      { description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0, gstType: 'CGST_SGST' },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (readOnly) return;
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full space-y-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium min-w-[150px]">Description</th>
              <th className="px-3 py-2 font-medium min-w-[80px]">Qty</th>
              <th className="px-3 py-2 font-medium min-w-[120px]">Unit Price (₹)</th>
              <th className="px-3 py-2 font-medium min-w-[80px]">HSN</th>
              <th className="px-3 py-2 font-medium min-w-[90px]">GST %</th>
              <th className="px-3 py-2 font-medium min-w-[130px]">GST Type</th>
              <th className="px-3 py-2 font-medium min-w-[90px] text-right">Taxable</th>
              <th className="px-3 py-2 font-medium min-w-[80px] text-right">Tax</th>
              <th className="px-3 py-2 font-medium min-w-[90px] text-right">Total</th>
              {!readOnly && <th className="px-3 py-2 w-[40px]"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {computedItems.map((item, index) => (
              <tr key={index} className="hover:bg-muted/30">
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">{item.description}</span>
                  ) : (
                    <Input
                      value={item.description}
                      onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                      placeholder="Item name"
                      className="h-8"
                    />
                  )}
                </td>
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">{item.quantity}</span>
                  ) : (
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleUpdate(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="h-8 text-right [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}
                </td>
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">₹{item.unitPrice.toFixed(2)}</span>
                  ) : (
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleUpdate(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="h-8 text-right [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  )}
                </td>
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">{item.hsnCode || '-'}</span>
                  ) : (
                    <Input
                      value={item.hsnCode || ''}
                      onChange={(e) => handleUpdate(index, 'hsnCode', e.target.value)}
                      placeholder="HSN"
                      className="h-8 text-center"
                    />
                  )}
                </td>
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">{item.gstRate}%</span>
                  ) : (
                    <Select
                      value={item.gstRate.toString()}
                      onValueChange={(val) => handleUpdate(index, 'gstRate', parseInt(val) as GSTRate)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="0%" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="p-2">
                  {readOnly ? (
                    <span className="px-1">{item.gstType === 'CGST_SGST' ? 'CGST+SGST' : 'IGST'}</span>
                  ) : (
                    <Select
                      value={item.gstType}
                      onValueChange={(val) => handleUpdate(index, 'gstType', val as GSTType)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CGST_SGST">CGST+SGST</SelectItem>
                        <SelectItem value="IGST">IGST</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="p-2 text-right font-medium text-muted-foreground">
                  ₹{item.taxableAmount.toFixed(2)}
                </td>
                <td className="p-2 text-right font-medium text-muted-foreground">
                  ₹{(item.cgst + item.sgst + item.igst).toFixed(2)}
                </td>
                <td className="p-2 text-right font-bold">
                  ₹{item.totalAmount.toFixed(2)}
                </td>
                {!readOnly && (
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveRow(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-muted/50 border-t border-border">
            <tr>
              <td colSpan={6} className="p-3 text-right font-medium text-muted-foreground">
                Totals:
              </td>
              <td className="p-3 text-right font-semibold">₹{totals.subtotal.toFixed(2)}</td>
              <td className="p-3 text-right font-semibold">
                ₹{(totals.totalCGST + totals.totalSGST + totals.totalIGST).toFixed(2)}
              </td>
              <td className="p-3 text-right font-bold text-primary">₹{totals.grandTotal.toFixed(2)}</td>
              {!readOnly && <td></td>}
            </tr>
          </tfoot>
        </table>
      </div>

      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddRow}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Row
        </Button>
      )}
    </div>
  );
}
