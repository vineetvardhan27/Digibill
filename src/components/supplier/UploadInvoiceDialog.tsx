import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, UploadCloud, File, X } from 'lucide-react';
import type { SupplierBill } from '@/types/supplier-portal';
import { supplierFetch } from '@/lib/supplierApi';
import { toast } from 'sonner';

interface UploadInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadInvoiceDialog({ isOpen, onClose, onSuccess }: UploadInvoiceDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [billId, setBillId] = useState<string>('none');
  const [pendingBills, setPendingBills] = useState<SupplierBill[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingBills, setIsLoadingBills] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPendingBills();
      // Reset state
      setFile(null);
      setNotes('');
      setBillId('none');
    }
  }, [isOpen]);

  const fetchPendingBills = async () => {
    setIsLoadingBills(true);
    try {
      const res = await supplierFetch<{ success: boolean; data: { bills: SupplierBill[] } }>('/supplier-connections/bills?status=pending&limit=50');
      if (res.success) {
        setPendingBills(res.data.bills);
      }
    } catch (err) {
      console.error('Failed to fetch bills for dropdown', err);
    } finally {
      setIsLoadingBills(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (selected.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFile(selected);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('invoice', file);
    if (notes) formData.append('notes', notes);
    if (billId !== 'none') formData.append('billId', billId);

    try {
      setIsUploading(true);
      // We must use fetch directly here since axios handles FormData differently and we need to pass the token
      const token = localStorage.getItem('supplierToken');
      const response = await fetch('http://localhost:5000/api/supplier-connections/invoices/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Invoice uploaded successfully');
        onSuccess();
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload invoice');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Invoice</DialogTitle>
          <DialogDescription>
            Upload your own invoice copy for the shop owner's reference.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>Invoice File (PDF or Image, max 5MB)</Label>
            
            {!file ? (
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <p className="font-medium text-foreground">Click or drag file to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/20">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-primary/10 rounded">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0 text-muted-foreground hover:text-destructive">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="billLink">Link to an existing bill (Optional)</Label>
            <Select value={billId} onValueChange={setBillId} disabled={isLoadingBills}>
              <SelectTrigger id="billLink">
                <SelectValue placeholder="Select a bill..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Do not link</SelectItem>
                {pendingBills.map((bill) => (
                  <SelectItem key={bill._id} value={bill._id}>
                    ₹{new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(bill.amount)} - {bill.description.substring(0, 30)}{bill.description.length > 30 ? '...' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading || !file}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
