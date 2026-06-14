import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, Navigation, UserCircle } from "lucide-react";
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
import { toast } from "sonner";
import { supplierConnectionAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";

export function MyShopsPage() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState("connected");
  const [searchQuery, setSearchQuery] = useState("");

  const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
  const [connectionToDisconnect, setConnectionToDisconnect] = useState<any | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [statusTab]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await supplierConnectionAPI.getConnections({ status: statusTab });
      setConnections(response.data);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch connections");
    } finally {
      setLoading(false);
    }
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
      await supplierConnectionAPI.disconnect(connectionToDisconnect._id);
      setConnections(prev => prev.filter(c => c._id !== connectionToDisconnect._id));
      setDisconnectDialogOpen(false);
      toast.success("Disconnected from shop");
    } catch (error: any) {
      toast.error(error.message || "Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  const filteredConnections = connections.filter((conn) =>
    conn.shopOwnerId?.shopName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    conn.shopOwnerId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">My Shops</h1>
          <p className="text-muted-foreground mt-1">Manage your connected shops and businesses.</p>
        </div>
      </div>

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
            placeholder="Search by shop name..."
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
          <h3 className="text-xl font-semibold text-foreground">No {statusTab} shops found</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            {statusTab === 'connected' 
              ? "You aren't connected to any shops yet. Get discovered in the directory." 
              : "You don't have any archived shops."}
          </p>
          {statusTab === 'connected' && (
            <Button className="mt-6" onClick={() => navigate('/supplier/directory')}>
              Find Shops
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConnections.map((conn) => {
            const shop = conn.shopOwnerId;
            return (
              <Card
                key={conn._id}
                className="p-6 hover:shadow-xl transition-all duration-300 border-border/50 bg-card cursor-pointer flex flex-col h-full group"
                onClick={() => navigate(`/supplier/shops/${conn._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <UserCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground line-clamp-1">{shop?.shopName || shop?.name || 'Unknown Shop'}</h3>
                      <p className="text-sm text-muted-foreground">{shop?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 flex-1 mb-4">
                  {/* Shop details can go here */}
                  <p className="text-sm text-muted-foreground">Connected since {new Date(conn.connectedAt || conn.createdAt).toLocaleDateString()}</p>
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

      <AlertDialog open={disconnectDialogOpen} onOpenChange={setDisconnectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Shop</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect from <strong>{connectionToDisconnect?.shopOwnerId?.shopName || connectionToDisconnect?.shopOwnerId?.name}</strong>?
              This will hide them from your active shops.
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
