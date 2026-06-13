import { useState, useEffect } from 'react';
import { supplierFetch } from '@/lib/supplierApi';
import type { SupplierInvoice } from '@/types/supplier-portal';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, FileText, AlertCircle, Calendar, Link as LinkIcon, Download } from 'lucide-react';
import { UploadInvoiceDialog } from '@/components/supplier/UploadInvoiceDialog';

export function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await supplierFetch<{ success: boolean; data: SupplierInvoice[] }>('/supplier-portal/invoices');
      if (response.success) {
        setInvoices(response.data);
      }
    } catch (err: any) {
      if (err.message === 'Route not found' || err.status === 404) {
        setInvoices([]);
      } else {
        setError(err.message || 'Failed to load invoices');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Invoices you've uploaded to Digibill for the shop owner.
          </p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="w-full sm:w-auto">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Invoice
        </Button>
      </div>

      {error ? (
        <div className="p-8 flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-border/50">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold">Failed to load invoices</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchInvoices} className="mt-4" variant="outline" size="sm">Retry</Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-muted/10 rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No invoices uploaded yet</h3>
          <p className="text-muted-foreground mt-1 max-w-sm mb-6">
            Upload your own invoices to keep records in sync with the shop owner.
          </p>
          <Button onClick={() => setIsUploadOpen(true)}>
            Upload your first invoice
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice) => (
            <Card key={invoice._id} className="shadow-sm border-border/50 flex flex-col hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-primary/10 text-primary rounded-lg shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-base font-bold truncate" title={invoice.fileName}>
                      {invoice.fileName}
                    </CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(invoice.uploadedAt)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="py-4 flex-1">
                {invoice.billId ? (
                  <div className="flex items-center gap-2 text-sm text-foreground bg-muted/50 p-2 rounded border border-border mb-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Linked to a Bill</span>
                  </div>
                ) : null}
                
                {invoice.notes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-sm text-foreground line-clamp-2" title={invoice.notes}>
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 border-t border-border/50 mt-auto bg-muted/10 flex justify-end gap-2 p-3">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download / View
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <UploadInvoiceDialog 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={() => {
          setIsUploadOpen(false);
          fetchInvoices();
        }} 
      />
    </div>
  );
}
