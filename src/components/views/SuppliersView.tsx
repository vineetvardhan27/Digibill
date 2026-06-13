import { useState, useEffect } from "react";
import { Plus, Search, Phone, MapPin, ChevronRight, Loader2, Trash2, HeartPulse, Mail, Clock, UserCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/mockData";
import { Supplier } from "@/types";
import type { HealthSummaryItem } from "@/types/health";
import { toast } from "sonner";
import { supplierAPI } from "@/lib/api";
import apiClient from "@/lib/api";
import { SupplierHealthDialog, HealthGradeBadge } from "@/components/views/SupplierHealthDialog";

export function SuppliersView() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [supplierToInvite, setSupplierToInvite] = useState<Supplier | null>(null);
  const [inviting, setInviting] = useState(false);
  const [healthMap, setHealthMap] = useState<Record<string, HealthSummaryItem>>({});
  const [healthDialogOpen, setHealthDialogOpen] = useState(false);
  const [healthSupplierId, setHealthSupplierId] = useState<string | null>(null);
  const [healthSupplierName, setHealthSupplierName] = useState("");
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    address: "",
    email: "",
    gstNumber: "",
  });

  // Fetch suppliers on mount
  useEffect(() => {
    fetchSuppliers();
    fetchHealthSummary();
  }, []);

  const fetchHealthSummary = async () => {
    try {
      const response = await apiClient.get('/suppliers/health-summary');
      const map: Record<string, HealthSummaryItem> = {};
      for (const item of response.data.data) {
        map[item.supplierId] = item;
      }
      setHealthMap(map);
    } catch {
      // Health summary is non-critical — silently ignore errors
    }
  };

  const openHealthDialog = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = supplier._id || supplier.id;
    if (!id) return;
    setHealthSupplierId(id);
    setHealthSupplierName(supplier.name);
    setHealthDialogOpen(true);
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await supplierAPI.getSuppliers({
        sortBy: "createdAt",
        order: "desc",
      });
      setSuppliers(response.data.suppliers);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch suppliers");
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((supplier) =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast.error("Please enter supplier name");
      return;
    }
    if (!newSupplier.phone.trim()) {
      toast.error("Please enter phone number");
      return;
    }
    if (!newSupplier.address.trim()) {
      toast.error("Please enter address");
      return;
    }

    try {
      setSubmitting(true);
      const response = await supplierAPI.createSupplier({
        name: newSupplier.name,
        phone: newSupplier.phone,
        address: newSupplier.address,
        email: newSupplier.email || undefined,
        gstNumber: newSupplier.gstNumber || undefined,
      });

      setSuppliers([response.data.supplier, ...suppliers]);
      setNewSupplier({ name: "", phone: "", address: "", email: "", gstNumber: "" });
      setIsDialogOpen(false);
      toast.success(response.message || "Supplier added successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add supplier");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    setSupplierToDelete(supplier);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!supplierToDelete) return;

    try {
      setDeleting(true);
      // Use _id field from MongoDB
      const supplierId = supplierToDelete._id || supplierToDelete.id;
      if (!supplierId) {
        toast.error("Invalid supplier ID");
        return;
      }
      
      const response = await supplierAPI.deleteSupplier(supplierId);
      
      // Remove supplier from list using _id
      setSuppliers(suppliers.filter(s => (s._id || s.id) !== (supplierToDelete._id || supplierToDelete.id)));
      
      toast.success(response.message || "Supplier deleted successfully");
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete supplier");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleInviteClick = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!supplier.portalEmail && !supplier.email) {
      toast.error("Supplier needs an email address to be invited.");
      return;
    }
    setSupplierToInvite(supplier);
    setInviteDialogOpen(true);
  };

  const handleInviteConfirm = async () => {
    if (!supplierToInvite) return;
    try {
      setInviting(true);
      const supplierId = supplierToInvite._id || supplierToInvite.id;
      if (!supplierId) throw new Error("Invalid ID");
      
      const res = await supplierAPI.inviteSupplier(supplierId);
      toast.success(res.message || `Invitation sent to ${supplierToInvite.portalEmail || supplierToInvite.email}`);
      
      // Update local state
      setSuppliers(suppliers.map(s => (s._id || s.id) === supplierId ? { ...s, inviteStatus: 'invited' } : s));
      setInviteDialogOpen(false);
      setSupplierToInvite(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Suppliers" subtitle={`Manage your ${suppliers.length} suppliers`} />

      <main className="px-8 py-6 space-y-6">
        {/* Search & Add */}
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base bg-muted/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 shadow-lg">
                <Plus className="h-5 w-5" />
                Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Supplier</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">Supplier Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter supplier name"
                    value={newSupplier.name}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, name: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newSupplier.phone}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, phone: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-semibold">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter address"
                    value={newSupplier.address}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, address: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email"
                    value={newSupplier.email}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, email: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber" className="text-sm font-semibold">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    placeholder="Enter GST number"
                    value={newSupplier.gstNumber}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, gstNumber: e.target.value })
                    }
                    className="h-11"
                  />
                </div>
                <Button 
                  className="w-full h-11 text-base" 
                  onClick={handleAddSupplier}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Supplier"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        )}

        {/* Suppliers Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card
                key={supplier._id || supplier.id}
                className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground truncate flex items-center gap-2">
                        {supplier.name}
                        {healthMap[supplier._id] && (
                          <HealthGradeBadge grade={healthMap[supplier._id].grade} />
                        )}
                      </h3>
                      {supplier.pendingAmount > 0 && (
                        <Badge variant="destructive" className="mt-2">
                          ₹{formatCurrency(supplier.pendingAmount)} Due
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {supplier.inviteStatus === 'active' ? (
                        <Badge className="bg-success hover:bg-success/90 shrink-0 gap-1 h-8 px-2 flex items-center">
                          <UserCheck className="h-3.5 w-3.5" /> Active
                        </Badge>
                      ) : supplier.inviteStatus === 'invited' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="h-8 shrink-0 text-muted-foreground border-border/50 bg-muted/20"
                          title="Awaiting acceptance"
                        >
                          <Clock className="h-4 w-4 mr-1.5" /> Invited
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 shrink-0 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                          onClick={(e) => handleInviteClick(supplier, e)}
                        >
                          <Mail className="h-4 w-4 mr-1.5" /> Invite
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteClick(supplier, e)}
                        title="Delete supplier"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {supplier.phone && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Spend</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {formatCurrency(supplier.totalSpend)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Bills</p>
                      <p className="text-xl font-bold text-foreground mt-1">{supplier.totalBills}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 gap-2 text-muted-foreground hover:text-primary"
                    onClick={(e) => openHealthDialog(supplier, e)}
                  >
                    <HeartPulse className="h-4 w-4" />
                    View Health Score
                  </Button>
                </div>
              </Card>
            ))}

            {filteredSuppliers.length === 0 && (
              <div className="col-span-full text-center py-20">
                <p className="text-muted-foreground text-lg">No suppliers found</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>?
              {supplierToDelete && supplierToDelete.totalBills > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-500">
                  ⚠️ This supplier has {supplierToDelete.totalBills} associated bill(s). The bills will remain intact.
                </span>
              )}
              <span className="block mt-2">
                This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite Confirmation Dialog */}
      <AlertDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Portal Invite</AlertDialogTitle>
            <AlertDialogDescription>
              Send portal invite to <strong>{supplierToInvite?.name}</strong>?
              <span className="block mt-2">
                They'll receive an email at <strong>{supplierToInvite?.portalEmail || supplierToInvite?.email}</strong> to set up their account and view their invoices.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={inviting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleInviteConfirm}
              disabled={inviting}
            >
              {inviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Invite"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Health Score Dialog */}
      <SupplierHealthDialog
        supplierId={healthSupplierId}
        supplierName={healthSupplierName}
        open={healthDialogOpen}
        onOpenChange={setHealthDialogOpen}
      />
    </div>
  );
}
