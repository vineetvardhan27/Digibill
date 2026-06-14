import { useState, useEffect, useRef } from "react";
import { Search, MapPin, Loader2, Trash2, ShieldCheck, Mail, Navigation, HeartPulse, UserCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { connectionAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { HealthGradeBadge } from "@/components/views/SupplierHealthDialog";

export function SuppliersView() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("connected");
  const [searchQuery, setSearchQuery] = useState("");

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<any | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  // Debounced notes
  const notesTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchConnections();
  }, [statusTab]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await connectionAPI.getConnections({ status: statusTab });
      setConnections(response.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
  };

  const handleNotesChange = (id: string, value: string) => {
    setConnections(prev => prev.map(c => c._id === id ? { ...c, shopNotes: value } : c));

    if (notesTimeoutRef.current[id]) {
      clearTimeout(notesTimeoutRef.current[id]);
    }

    notesTimeoutRef.current[id] = setTimeout(async () => {
      try {
        await connectionAPI.updateNotes(id, value);
      } catch (error) {
        toast.error("Failed to save note");
      }
    }, 1000);
  };

  const handleDisconnectClick = (conn: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectionToDisconnect(conn);
    setDisconnectDialogOpen(true);
  };

  const handleDisconnectConfirm = async () => {
    if (!connectionToDisconnect) return;
    try {
      setDisconnecting(true);
      await connectionAPI.disconnect(connectionToDisconnect._id);
      setConnections(prev => prev.filter(c => c._id !== connectionToDisconnect._id));
      setDisconnectDialogOpen(false);
      toast.success("Connection disconnected");
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const filteredConnections = connections.filter((conn) =>
    conn.supplierAccountId?.businessName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount || 0);
  };

  return (
    <div className="min-h-screen">
      <Header title="My Network" subtitle="Manage your connected suppliers and private notes" />

      <main className="px-8 py-6 space-y-6">
        <div className="flex gap-4 flex-col md:flex-row justify-between">
          <Tabs defaultValue="connected" value={statusTab} onValueChange={setStatusTab} className="w-full md:w-auto">
            <TabsList className="grid w-full md:w-[300px] grid-cols-2">
              <TabsTrigger value="connected">Active</TabsTrigger>
              <TabsTrigger value="disconnected">Archived</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by business name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-11 text-base bg-muted/50 border-border/50 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-4 bg-muted/10 rounded-xl border border-dashed border-border">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Navigation className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No {statusTab} suppliers found</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              {statusTab === 'connected' 
                ? "You don't have any active connections yet. Head to the directory to discover suppliers." 
                : "You don't have any archived connections."}
            </p>
            {statusTab === 'connected' && (
              <Button className="mt-6" onClick={() => navigate('/directory')}>
                Find Suppliers
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredConnections.map((conn) => {
              const supplier = conn.supplierAccountId;
              const stats = conn.stats;

              return (
                <Card
                  key={conn._id}
                  className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 bg-card cursor-pointer flex flex-col h-full group"
                  onClick={() => navigate(`/suppliers/${conn._id}`)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <UserCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{supplier.businessName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="font-normal">{supplier.category}</Badge>
                          {stats?.healthScore && <HealthGradeBadge grade={stats.healthScore.grade} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending Due</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        ₹{formatCurrency(stats?.pendingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Bills</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {stats?.totalBills || 0}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 mb-4">
                    {supplier.location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{supplier.location.city}, {supplier.location.state}</span>
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mt-auto" onClick={(e) => e.stopPropagation()}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Private Notes</p>
                    <Textarea 
                      placeholder="Add private notes..."
                      value={conn.shopNotes || ""}
                      onChange={(e) => handleNotesChange(conn._id, e.target.value)}
                      className="resize-none h-20 text-sm focus-visible:ring-primary/50"
                    />
                  </div>

                  {statusTab === 'connected' && (
                    <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDisconnectClick(conn, e)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Disconnecting will hide <strong>{connectionToDisconnect?.supplierAccountId?.businessName}</strong> from your active suppliers. 
              Bill history is preserved and can be viewed in Archived Connections.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disconnecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnectConfirm}
              disabled={disconnecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
