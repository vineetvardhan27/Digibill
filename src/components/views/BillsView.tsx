import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Camera, FileText, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatCurrency, formatDate } from "@/lib/mockData";
import { Bill, Supplier } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { billAPI, supplierAPI, connectionAPI } from "@/lib/api";
import { useOCRScan } from "@/hooks/useOCRScan";
import { BillScanUploader } from "@/components/OCR/BillScanUploader";
import { GSTLineItemEditor } from "@/components/bills/GSTLineItemEditor";
import { Download } from "lucide-react";
import { generateGSTInvoice } from "@/lib/pdfGenerator";

export function BillsView({ connectionId, hideHeader }: { connectionId?: string; hideHeader?: boolean }) {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [openDisputes, setOpenDisputes] = useState<any[]>([]);
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

  // Track which fields the user has manually edited (so OCR doesn't overwrite them)
  const userEditedFields = useRef<Set<string>>(new Set());

  // OCR scan hook
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

  // Fetch bills and suppliers on mount
  useEffect(() => {
    fetchBills();
    fetchSuppliers();
    fetchOpenDisputes();
  }, []);

  const fetchOpenDisputes = async () => {
    try {
      const res = await billAPI.getDisputes('open');
      if (res.success) setOpenDisputes(res.data);
    } catch (e) {
      console.error('Failed to fetch open disputes:', e);
    }
  };

  // ─── Auto-populate form when scan completes ────────────────────────────────
  useEffect(() => {
    if (!scanResult) return;

    const updates: Partial<typeof newBill> = {};

    // Auto-populate amount (if not manually edited and extracted value is non-null)
    if (scanResult.totalAmount !== null && !userEditedFields.current.has('amount')) {
      updates.amount = String(scanResult.totalAmount);
    }

    // Auto-populate due date
    if (scanResult.dueDate && !userEditedFields.current.has('dueDate')) {
      updates.dueDate = scanResult.dueDate;
    }

    // Auto-populate description
    if (scanResult.description && !userEditedFields.current.has('description')) {
      updates.description = scanResult.description;
    }

    // Apply updates
    if (Object.keys(updates).length > 0) {
      setNewBill(prev => ({ ...prev, ...updates }));
    }

    // ─── Fuzzy match supplier name ───────────────────────────────────
    if (scanResult.supplierName && !userEditedFields.current.has('supplierId')) {
      const scannedName = scanResult.supplierName.toLowerCase().trim();

      // Try exact match first
      let matched = suppliers.find(
        s => s.name.toLowerCase().trim() === scannedName
      );

      // Try contains match
      if (!matched) {
        matched = suppliers.find(
          s =>
            s.name.toLowerCase().includes(scannedName) ||
            scannedName.includes(s.name.toLowerCase())
        );
      }

      // Try word overlap fuzzy match
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
  }, [scanResult, suppliers]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getBills({
        sortBy: "date",
        order: "desc",
        ...(connectionId ? { connectionId } : {})
      });
      setBills(Array.isArray(response.data.bills) ? response.data.bills : []);
    } catch (error: any) {
      console.error('Fetch bills error:', error);
      toast.error(error.message || "Failed to fetch bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const [suppliersRes, connectionsRes] = await Promise.all([
        supplierAPI.getSuppliers(),
        connectionAPI.getConnections({ status: 'connected' })
      ]);
      
      const localSuppliers = Array.isArray(suppliersRes.data.suppliers) ? suppliersRes.data.suppliers : [];
      
      // Transform connections into supplier-like objects
      const connectedSuppliers = (connectionsRes.data || []).map(conn => ({
        ...conn.supplierAccountId,
        _id: conn._id,
        id: conn._id,
        isConnection: true,
        name: conn.supplierAccountId?.businessName || conn.supplierAccountId?.ownerName || 'Connected Supplier',
      }));

      setSuppliers([...connectedSuppliers, ...localSuppliers]);
    } catch (error: any) {
      console.error('Fetch suppliers/connections error:', error);
      toast.error(error.message || "Failed to fetch suppliers");
      setSuppliers([]);
    }
  };

  const filteredBills = bills.filter((bill) => {
    const supplierName = typeof bill.supplierId === 'object' && bill.supplierId 
      ? (bill.supplierId as any).name 
      : bill.supplier?.name || '';
    
    const matchesSearch =
      supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bill.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "paid" && bill.isPaid) ||
      (activeTab === "pending" && !bill.isPaid);
    return matchesSearch && matchesTab;
  });

  const handleAddBill = async () => {
    console.log("Form submission - Current newBill state:", newBill);
    
    if (!connectionId && (!newBill.supplierId || !newBill.supplierId.trim())) {
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
      
      // Check if the selected supplier is actually a connection
      const selectedSupplier = suppliers.find(s => (s._id || s.id) === newBill.supplierId);
      const isConnectionSelected = selectedSupplier && (selectedSupplier as any).isConnection;
      
      const payload: any = {
        amount: amountValue,
        date: new Date().toISOString(),
        dueDate: newBill.dueDate || undefined,
        description: newBill.description || undefined,
        items: newBill.items.length > 0 ? newBill.items : undefined,
      };
      
      if (connectionId) {
        payload.connectionId = connectionId;
      } else if (isConnectionSelected) {
        payload.connectionId = newBill.supplierId;
      } else {
        payload.supplierId = newBill.supplierId;
      }

      const response = await billAPI.createBill(payload);

      console.log('Bill created successfully:', response.data.bill);
      
      setBills((prevBills) => {
        const newBills = Array.isArray(prevBills) ? prevBills : [];
        return [response.data.bill, ...newBills];
      });
      
      setNewBill({ supplierId: "", amount: "", description: "", dueDate: "", items: [{ description: '', quantity: 1, unitPrice: 0, hsnCode: '', gstRate: 0, gstType: 'CGST_SGST' }] });
      userEditedFields.current.clear();
      cleanupOCR();
      setIsDialogOpen(false);
      toast.success(response.message || "Bill added successfully!");
      
      setTimeout(() => fetchBills(), 500);
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

  // Handle file selection from the scanner
  const handleScanFile = async (file: File) => {
    await performScan(file);
  };

  const handleMarkAsPaid = async (billId: string) => {
    try {
      const response = await billAPI.markAsPaid(billId, new Date().toISOString());
      setBills(
        bills.map((bill) =>
          (bill._id || bill.id) === billId ? response.data.bill : bill
        )
      );
      toast.success(response.message || "Bill marked as paid!");
    } catch (error: any) {
      toast.error(error.message || "Failed to mark bill as paid");
    }
  };

  return (
    <div className={cn("min-h-screen", hideHeader ? "pt-2" : "")}>
      {!hideHeader && <Header title="Bills" subtitle={`Manage your ${bills.length} bills and payments`} />}

      <main className={cn(hideHeader ? "" : "px-8 py-6", "space-y-6")}>
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg">
                <Plus className="h-5 w-5" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                {/* ─── OCR Scanner ─────────────────────────────────────── */}
                <BillScanUploader
                  isScanning={isScanning}
                  previewUrl={previewUrl}
                  onFileSelect={handleScanFile}
                  onClear={cleanupOCR}
                  scanComplete={!!scanResult}
                  confidence={scanResult?.confidence}
                  disabled={submitting}
                />

                {/* ─── Divider ────────────────────────────────────────── */}
                <div className="relative flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider whitespace-nowrap">
                    {scanResult ? 'Review & edit below' : 'or fill manually'}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* ─── Manual Form Fields ─────────────────────────────── */}
                {!connectionId && (
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
                      onChange={(newItems) => setNewBill({ ...newBill, items: newItems as any })}
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
                            <button 
                              type="button"
                              onClick={(e) => { e.preventDefault(); setSelectedBill(match); }}
                              className="underline hover:text-warning/80"
                            >
                              ₹{match.amount} on {formatDate(match.date)}
                            </button>
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
        </div>

        {/* Search & Tabs */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-muted/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="all" className="px-6">All</TabsTrigger>
              <TabsTrigger value="pending" className="px-6">Pending</TabsTrigger>
              <TabsTrigger value="paid" className="px-6">Paid</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* Bills Grid */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBills.map((bill) => (
              <Card
                key={bill._id || bill.id}
                className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer"
                onClick={() => setSelectedBill(bill)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">
                          {/* Handle both populated supplierId and separate supplier field */}
                          {(typeof bill.supplierId === 'object' && bill.supplierId 
                            ? (bill.supplierId as any).name 
                            : bill.supplier?.name) || "Unknown Supplier"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(bill.date)}
                        </p>
                      </div>
                    </div>
                    {bill.isPaid ? (
                      <Badge className="bg-success hover:bg-success/90 shrink-0">
                        Paid
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-warning border-warning shrink-0">
                        Pending
                      </Badge>
                    )}
                    {openDisputes.some(d => 
                      (typeof d.billId === 'string' ? d.billId : d.billId?._id) === (bill._id || bill.id)
                    ) && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive ml-2 shrink-0">
                        Disputed
                      </Badge>
                    )}
                  </div>

                  {bill.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {bill.description}
                    </p>
                  )}

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Amount</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {formatCurrency(bill.amount)}
                      </p>
                    </div>
                    {!bill.isPaid && (
                      <Button
                        variant="default"
                        className="shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsPaid(bill._id || bill.id || '');
                        }}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>

                  {bill.dueDate && !bill.isPaid && (
                    <p className="text-sm text-warning font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
                      Due: {formatDate(bill.dueDate)}
                    </p>
                  )}
                </div>
              </Card>
            ))}

            {filteredBills.length === 0 && (
              <div className="col-span-full text-center py-20">
                <p className="text-muted-foreground text-lg">No bills found</p>
              </div>
            )}
          </div>
        )}

        {/* Bill Details Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
          <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Bill Details
              </DialogTitle>
            </DialogHeader>

            {selectedBill && (
              <div className="space-y-6 pt-4">
                {/* Dispute Alert Banner */}
                {openDisputes.find(d => 
                  (typeof d.billId === 'string' ? d.billId : d.billId?._id) === (selectedBill._id || selectedBill.id)
                ) && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Dispute Raised</p>
                      <p className="text-sm mt-1">
                        {openDisputes.find(d => 
                          (typeof d.billId === 'string' ? d.billId : d.billId?._id) === (selectedBill._id || selectedBill.id)
                        )?.reason}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive whitespace-nowrap"
                      onClick={() => {
                        setSelectedBill(null);
                        navigate('/disputes');
                      }}
                    >
                      Resolve Dispute
                    </Button>
                  </div>
                )}

                {/* Header info */}
                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier</p>
                    <p className="font-semibold text-lg">
                      {(typeof selectedBill.supplierId === 'object' && selectedBill.supplierId 
                        ? (selectedBill.supplierId as any).name 
                        : selectedBill.supplier?.name) || "Unknown Supplier"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="font-bold text-2xl text-primary">{formatCurrency(selectedBill.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Bill Date</p>
                    <p className="font-medium">{formatDate(selectedBill.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1 flex justify-end">
                      {selectedBill.isPaid ? (
                        <Badge className="bg-success">Paid</Badge>
                      ) : (
                        <Badge variant="outline" className="text-warning border-warning">Pending</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-2 mb-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => {
                      if (selectedBill) generateGSTInvoice(selectedBill);
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Download GST Invoice
                  </Button>
                </div>

                {selectedBill.description && (
                  <div>
                    <p className="text-sm font-semibold mb-1">Description</p>
                    <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/30">
                      {selectedBill.description}
                    </p>
                  </div>
                )}

                {/* Items List */}
                <div>
                  <h4 className="text-sm font-semibold mb-3">Line Items</h4>
                  {(!selectedBill.items || selectedBill.items.length === 0) ? (
                    <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed border-border/50">
                      <p className="text-sm text-muted-foreground">No line items recorded for this bill.</p>
                    </div>
                  ) : (
                    <GSTLineItemEditor 
                      items={selectedBill.items as any} 
                      onChange={() => {}} 
                      readOnly 
                    />
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
