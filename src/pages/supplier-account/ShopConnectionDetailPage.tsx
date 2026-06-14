import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Mail, Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supplierConnectionAPI } from "@/lib/api";
import { SupplierBillsPage } from "@/pages/supplier/SupplierBillsPage";

export function ShopConnectionDetailPage() {
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
      const response = await supplierConnectionAPI.getConnections({ status: 'all' });
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
        <Button variant="ghost" onClick={() => navigate('/supplier/shops')} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <h2 className="text-2xl font-bold">Connection not found</h2>
      </div>
    );
  }

  const shop = connection.shopOwnerId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-card border-b border-border/50">
        <div className="px-8 py-6 max-w-7xl mx-auto">
          <Button variant="ghost" onClick={() => navigate('/supplier/shops')} className="mb-4 -ml-4 hover:bg-muted/50">
            <ChevronLeft className="w-4 h-4 mr-2" /> Back to My Shops
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Store className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{shop?.shopName || shop?.name || 'Unknown Shop'}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={connection.status === 'connected' ? 'default' : 'secondary'}>
                    {connection.status.charAt(0).toUpperCase() + connection.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
              {shop?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>{shop.phone}</span>
                </div>
              )}
              {shop?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{shop.email}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="px-8 py-6 max-w-7xl mx-auto">
        <Tabs defaultValue="bills" className="w-full">
          <TabsList className="grid w-full max-w-[200px] grid-cols-1">
            <TabsTrigger value="bills">Bills</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm min-h-[500px]">
            <TabsContent value="bills" className="m-0 border-0 outline-none">
              <SupplierBillsPage connectionId={id} hideHeader />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
