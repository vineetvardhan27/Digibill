import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { ConnectionRequest } from '@/types';

export default function SupplierPendingConnectionsPage() {
  const [receivedRequests, setReceivedRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      
      const [receivedRes, sentRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/supplier-connections/pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('supplierToken')}` }
        }),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/supplier-connections?status=pending`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('supplierToken')}` }
        })
      ]);

      if (receivedRes.data.success) {
        setReceivedRequests(receivedRes.data.data);
      }
      
      if (sentRes.data.success) {
        // filter for initiatedBy supplier
        const sent = sentRes.data.data.filter((r: ConnectionRequest) => r.initiatedBy === 'supplier');
        setSentRequests(sent);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pending connections',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRespond = async (id: string, action: 'accept' | 'reject') => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/supplier-connections/${id}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${localStorage.getItem('supplierToken')}` } }
      );

      if (response.data.success) {
        toast({
          title: action === 'accept' ? 'Connected!' : 'Request Rejected',
          description: action === 'accept' 
            ? 'You are now connected with the shop.' 
            : 'Connection request was rejected.',
          variant: 'default'
        });
        
        // Remove from received list
        setReceivedRequests(receivedRequests.filter(r => r._id !== id));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to respond to request',
        variant: 'destructive'
      });
    }
  };

  const renderSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map(i => (
        <Card key={i}>
          <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
          <CardContent><Skeleton className="h-4 w-2/3" /></CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pending Connections</h1>
        <p className="text-muted-foreground mt-2">Manage your incoming and outgoing connection requests.</p>
      </div>

      <Tabs defaultValue="received">
        <TabsList className="mb-4">
          <TabsTrigger value="received">
            Received ({receivedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({sentRequests.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {isLoading ? renderSkeleton() : receivedRequests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-background">
              <p className="text-muted-foreground">You have no pending connection requests from shops.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedRequests.map(req => (
                <Card key={req._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {req.shopOwnerId?.shopName || req.shopOwnerId?.name || 'Unknown Shop'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {req.requestNote ? (
                      <div className="bg-muted p-3 rounded-md text-sm border">
                        <p className="font-semibold mb-1">Note from shop:</p>
                        <p>"{req.requestNote}"</p>
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">No note provided</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-4">
                      Sent on {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => handleRespond(req._id, 'reject')}>
                      Reject
                    </Button>
                    <Button onClick={() => handleRespond(req._id, 'accept')}>
                      Accept
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="sent">
          {isLoading ? renderSkeleton() : sentRequests.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-background">
              <p className="text-muted-foreground">You haven't sent any connection requests recently.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sentRequests.map(req => (
                <Card key={req._id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">
                      {req.shopOwnerId?.shopName || req.shopOwnerId?.name || 'Unknown Shop'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Status: <span className="font-medium text-amber-600">Awaiting Response</span>
                    </p>
                    {req.requestNote && (
                      <div className="bg-muted p-3 rounded-md text-sm border mt-3">
                        <p className="font-semibold mb-1">Your note:</p>
                        <p>"{req.requestNote}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
