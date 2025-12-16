import { useState, useEffect } from "react";
import { Plus, Search, Filter, Camera, FileText, Loader2 } from "lucide-react";
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
import { billAPI, supplierAPI } from "@/lib/api";

export function BillsView() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newBill, setNewBill] = useState({
    supplierId: "",
    amount: "",
    description: "",
    dueDate: "",
  });

  // Fetch bills and suppliers on mount
  useEffect(() => {
    fetchBills();
    fetchSuppliers();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await billAPI.getBills({
        sortBy: "date",
        order: "desc",
      });
      // Ensure bills is always an array
      setBills(Array.isArray(response.data.bills) ? response.data.bills : []);
    } catch (error: any) {
      console.error('Fetch bills error:', error);
      toast.error(error.message || "Failed to fetch bills");
      // Set empty array on error to prevent crashes
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierAPI.getSuppliers();
      console.log("Fetched suppliers:", response.data.suppliers);
      // Ensure suppliers is always an array
      setSuppliers(Array.isArray(response.data.suppliers) ? response.data.suppliers : []);
    } catch (error: any) {
      console.error('Fetch suppliers error:', error);
      toast.error(error.message || "Failed to fetch suppliers");
      // Set empty array on error to prevent crashes
      setSuppliers([]);
    }
  };

  const filteredBills = bills.filter((bill) => {
    // Safely get supplier name - handle both populated (supplierId object) and unpopulated (string)
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
    // Debug current state
    console.log("Form submission - Current newBill state:", newBill);
    console.log("Supplier ID check:", newBill.supplierId, "Type:", typeof newBill.supplierId);
    
    // Validation
    if (!newBill.supplierId || !newBill.supplierId.trim()) {
      console.error("Validation failed: No supplier selected");
      toast.error("Please select a supplier");
      return;
    }

    if (!newBill.amount || !newBill.amount.trim()) {
      console.error("Validation failed: No amount entered");
      toast.error("Please enter an amount");
      return;
    }

    const amountValue = parseFloat(newBill.amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      console.error("Validation failed: Invalid amount", amountValue);
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    console.log("Validation passed, submitting bill...");
    
    try {
      setSubmitting(true);
      const response = await billAPI.createBill({
        supplierId: newBill.supplierId,
        amount: amountValue,
        date: new Date().toISOString(),
        dueDate: newBill.dueDate || undefined,
        description: newBill.description || undefined,
      });

      console.log('Bill created successfully:', response.data.bill);
      
      // Add new bill to the list - ensure bills array is valid
      setBills((prevBills) => {
        const newBills = Array.isArray(prevBills) ? prevBills : [];
        return [response.data.bill, ...newBills];
      });
      
      // Reset form
      setNewBill({ supplierId: "", amount: "", description: "", dueDate: "" });
      setIsDialogOpen(false);
      toast.success(response.message || "Bill added successfully!");
      
      // Refresh bills list to ensure data consistency
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
    // Reset form when dialog closes
    if (!open) {
      setNewBill({ supplierId: "", amount: "", description: "", dueDate: "" });
    }
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
    <div className="min-h-screen">
      <Header title="Bills" subtitle={`Manage your ${bills.length} bills and payments`} />

      <main className="px-8 py-6 space-y-6">
        {/* Action Buttons */}
        <div className="flex gap-4">
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg">
                <Plus className="h-5 w-5" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Supplier *</Label>
                  <Select
                    value={newBill.supplierId}
                    onValueChange={(value) => {
                      console.log("Selected supplier ID:", value);
                      console.log("Available suppliers:", suppliers);
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
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-sm font-semibold">Amount (₹) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={newBill.amount}
                    onChange={(e) =>
                      setNewBill({ ...newBill, amount: e.target.value })
                    }
                    className="h-11"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-sm font-semibold">Due Date (Optional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newBill.dueDate}
                    onChange={(e) =>
                      setNewBill({ ...newBill, dueDate: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Input
                    id="description"
                    placeholder="E.g., Rice, Dal supplies"
                    value={newBill.description}
                    onChange={(e) =>
                      setNewBill({ ...newBill, description: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <Button 
                  className="w-full h-11 text-base" 
                  onClick={handleAddBill}
                  disabled={submitting}
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
          <Button variant="outline" size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            Scan Bill
          </Button>
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
                className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
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
                        onClick={() => handleMarkAsPaid(bill._id || bill.id || '')}
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
      </main>
    </div>
  );
}
