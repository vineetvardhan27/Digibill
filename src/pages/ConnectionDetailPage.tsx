import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Mail, Loader2, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { connectionAPI } from "@/lib/api";
import { BillsView } from "@/components/views/BillsView";
import { DisputesPage } from "@/pages/DisputesPage";
import { HealthGradeBadge } from "@/components/views/SupplierHealthDialog";

export function ConnectionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchConnection();
    }
  }, [id]);

  const fetchConnection = async () => {
    try {
      setLoading(true);
      const response = await connectionAPI.getConnections({ status: 'all' });
      // since the api gets all connections, we filter here for now
      // Or we can add an endpoint to get single connection. But we will filter here.
      const conn = response.data.find((c: any) => c._id === id);
      if (conn) {
        setConnection(conn);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="p-8">
        <Button variant="ghost" onClick={() => navigate('/connections')} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Connection not found</h2>
      </div>
    );
  }

  const supplier = connection.supplierAccountId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b border-border/50">
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/connections')} className="mb-4 -ml-4 hover:bg-muted/50">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to Network
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <UserCircle className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{supplier.businessName}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant="secondary">{supplier.category}</Badge>
                  {connection.stats?.healthScore && <HealthGradeBadge grade={connection.stats.healthScore.grade} />}
                  <Badge variant={connection.status === 'connected' ? 'default' : 'secondary'}>
                    {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {supplier.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.location.city}, {supplier.location.state} {supplier.location.pincode}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.gstin && (
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-semibold mr-1">GSTIN:</span> {supplier.gstin}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-8 py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="bills" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-3">
            <TabsTrigger value="bills">Bills</TabsTrigger>
            <TabsTrigger value="disputes">Disputes</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm min-h-[500px]">
            <TabsContent value="bills" className="m-0 border-0 outline-none">
              <BillsView connectionId={id} hideHeader />
            </TabsContent>
            
            <TabsContent value="disputes" className="m-0 border-0 outline-none">
              <DisputesPage connectionId={id} hideHeader />
            </TabsContent>
            
            <TabsContent value="activity" className="m-0 border-0 outline-none p-8">
              <div className="text-center py-20 text-muted-foreground">
                <p>Activity timeline for this connection will be shown here.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
