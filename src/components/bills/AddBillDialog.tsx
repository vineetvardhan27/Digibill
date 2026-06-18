import { useState, useEffect, useRef } from "react";
import { Loader2, Plus, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { billAPI } from "@/lib/api";
import { useOCRScan } from "@/hooks/useOCRScan";
import { BillScanUploader } from "@/components/OCR/BillScanUploader";
import { GSTLineItemEditor } from "@/components/bills/GSTLineItemEditor";
import { formatDate } from "@/lib/mockData";
import { Bill, Supplier } from "@/types";

interface AddBillDialogProps {
  suppliers: any[];
  defaultConnectionId?: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function AddBillDialog({ suppliers, defaultConnectionId, onSuccess, trigger }: AddBillDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateCheckLoading, setDuplicateCheckLoading] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState<Bill[]>([]);
  const [lastCheckedSignature, setLastCheckedSignature] = useState<string>("");
  
  const [newBill, setNewBill] = useState({
    supplierId: "",
    amount: "",
    description: "",
    dueDate: "",
    items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0, gstType: 'CGST_SGST' }] as any[],
  });

  const userEditedFields = useRef<Set<string>>(new Set());

  const {
    isScanning,
    previewUrl,
    scanResult,
    scanBill: performScan,
    cleanup: cleanupOCR,
  } = useOCRScan();

  // Duplicate Check Debounce Logic
  useEffect(() => {
    const supplierId = newBill.supplierId;
    const amount = newBill.amount;
    
    if (!supplierId || !amount || parseFloat(amount) <= 0) {
      setDuplicateMatches([]);
      return;
    }

    const signature = `${supplierId}-${amount}`;
    if (signature === lastCheckedSignature) return;

    const timeoutId = setTimeout(async () => {
      try {
        setDuplicateCheckLoading(true);
        const result = await billAPI.checkDuplicate({
          supplierId,
          amount: parseFloat(amount),
          billDate: new Date().toISOString()
        });
        
        setDuplicateMatches(result.data.matches || []);
        setLastCheckedSignature(signature);
      } catch (error) {
        console.error('Duplicate check failed', error);
      } finally {
        setDuplicateCheckLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newBill.supplierId, newBill.amount, lastCheckedSignature]);

  // ─── Auto-populate form when scan completes ────────────────────────────────
  useEffect(() => {
    if (!scanResult) return;

    const updates: Partial<typeof newBill> = {};

    if (scanResult.totalAmount !== null && !userEditedFields.current.has('amount')) {
      updates.amount = String(scanResult.totalAmount);
    }

    if (scanResult.dueDate && !userEditedFields.current.has('dueDate')) {
      updates.dueDate = scanResult.dueDate;
    }

    if (scanResult.description && !userEditedFields.current.has('description')) {
      updates.description = scanResult.description;
    }

    // Auto-populate line items (Fix for Issue 1)
    if (scanResult.items && scanResult.items.length > 0 && !userEditedFields.current.has('items')) {
      updates.items = scanResult.items.map(item => ({
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        hsnCode: item.hsnCode || '',
        gstRate: item.gstRate || 0,
        gstType: item.gstType || 'CGST_SGST'
      }));
    }

    if (Object.keys(updates).length > 0) {
      setNewBill(prev => ({ ...prev, ...updates }));
    }

    // Fuzzy match supplier name
    if (scanResult.supplierName && !userEditedFields.current.has('supplierId') && !defaultConnectionId) {
      const scannedName = scanResult.supplierName.toLowerCase().trim();

      let matched = suppliers.find(s => s.name.toLowerCase().trim() === scannedName);

      if (!matched) {
        matched = suppliers.find(s =>
          s.name.toLowerCase().includes(scannedName) || scannedName.includes(s.name.toLowerCase())
        );
      }

      if (!matched) {
        const scannedWords = scannedName.split(/\s+/);
        matched = suppliers.find(s => {
          const supplierWords = s.name.toLowerCase().split(/\s+/);
          const overlap = scannedWords.filter(w =>
            supplierWords.some(sw => sw.includes(w) || w.includes(sw))
          );
          return overlap.length >= Math.min(2, scannedWords.length);
        });
      }

      if (matched) {
        setNewBill(prev => ({ ...prev, supplierId: matched._id || matched.id || '' }));
        toast.success(`Supplier matched: ${matched.name}`);
      } else {
        toast.info(`Supplier "${scanResult.supplierName}" not found`, {
          description: 'Please select a supplier from the list or add them first.',
        });
      }
    }
  }, [scanResult, suppliers, defaultConnectionId]);

  const handleAddBill = async () => {
    if (!defaultConnectionId && (!newBill.supplierId || !newBill.supplierId.trim())) {
      toast.error("Please select a supplier");
      return;
    }

    if (!newBill.amount || !newBill.amount.trim() || newBill.amount === "0") {
      toast.error("Please add line items with a valid price");
      return;
    }

    const amountValue = parseFloat(newBill.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast.error("Total amount must be greater than 0");
      return;
    }

    try {
      setSubmitting(true);
      
      const selectedSupplier = suppliers.find(s => (s._id || s.id) === newBill.supplierId);
      const isConnectionSelected = selectedSupplier && selectedSupplier.isConnection;
      
      const payload: any = {
        amount: amountValue,
        date: new Date().toISOString(),
        dueDate: newBill.dueDate || undefined,
        description: newBill.description || undefined,
        items: newBill.items.length > 0 ? newBill.items : undefined,
      };
      
      if (defaultConnectionId) {
        payload.connectionId = defaultConnectionId;
      } else if (isConnectionSelected) {
        payload.connectionId = newBill.supplierId;
      } else {
        payload.supplierId = newBill.supplierId;
      }

      const response = await billAPI.createBill(payload);
      
      setNewBill({ supplierId: "", amount: "", description: "", dueDate: "", items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0, gstType: 'CGST_SGST' }] });
      userEditedFields.current.clear();
      cleanupOCR();
      setIsDialogOpen(false);
      toast.success(response.message || "Bill added successfully!");
      
      onSuccess();
    } catch (error: any) {
      console.error("Bill creation error:", error);
      toast.error(error.message || "Failed to add bill");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setNewBill({ supplierId: "", amount: "", description: "", dueDate: "", items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0, gstType: 'CGST_SGST' }] });
      userEditedFields.current.clear();
      cleanupOCR();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2 shadow-lg">
            <Plus className="h-5 w-5" />
            Add Bill
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Bill</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 pt-4">
          <BillScanUploader
            isScanning={isScanning}
            previewUrl={previewUrl}
            onFileSelect={performScan}
            onClear={cleanupOCR}
            scanComplete={!!scanResult}
            confidence={scanResult?.confidence}
            disabled={submitting}
          />

          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
              {scanResult ? 'Review & edit below' : 'or fill manually'}
            </span>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {!defaultConnectionId && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Supplier *</Label>
              <Select
                value={newBill.supplierId}
                onValueChange={(value) => {
                  userEditedFields.current.add('supplierId');
                  setNewBill({ ...newBill, supplierId: value });
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {suppliers.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No suppliers found. Please add a supplier first.
                    </div>
                  ) : (
                    <>
                      {suppliers.map((supplier) => (
                        <SelectItem 
                          key={supplier._id || supplier.id} 
                          value={supplier._id || supplier.id || ''}
                        >
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              {newBill.supplierId && (
                <p className="text-xs text-muted-foreground">
                  Selected: {suppliers.find(s => (s._id || s.id) === newBill.supplierId)?.name || newBill.supplierId}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Line Items</Label>
            <div className="bg-background/50 rounded-lg p-2 border border-border/40 overflow-x-auto">
              <GSTLineItemEditor
                items={newBill.items}
                onChange={(newItems) => {
                  userEditedFields.current.add('items');
                  setNewBill({ ...newBill, items: newItems as any });
                }}
                onTotalsChange={(totals) => {
                  if (totals.grandTotal > 0) {
                    setNewBill(prev => ({ ...prev, amount: totals.grandTotal.toString() }));
                    userEditedFields.current.add('amount');
                  }
                }}
              />
            </div>
          </div>

          {duplicateCheckLoading && (
            <p className="text-sm text-muted-foreground animate-pulse flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking for duplicates...
            </p>
          )}

          {duplicateMatches.length > 0 && !duplicateCheckLoading && (
            <Alert variant="default" className="border-warning/50 bg-warning/10 text-warning [&>svg]:text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="font-semibold">Possible Duplicate Detected</AlertTitle>
              <AlertDescription className="mt-1">
                We found similar bills from this supplier recently:
                <ul className="mt-2 mb-2 space-y-1 list-disc list-inside">
                  {duplicateMatches.map(match => (
                    <li key={match._id || match.id}>
                      ₹{match.amount} on {formatDate(match.date)}
                    </li>
                  ))}
                </ul>
                Are you sure you want to add this new bill?
              </AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full h-11 text-base" 
            onClick={handleAddBill}
            disabled={submitting || isScanning}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Bill"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
