import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Search, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { DirectorySupplier, DirectoryFilters, ConnectionStatus } from '@/types';
import { ConnectRequestDialog } from '@/components/directory/ConnectRequestDialog';
import { useToast } from '@/components/ui/use-toast';

export default function SupplierDirectoryPage() {
  const [suppliers, setSuppliers] = useState<DirectorySupplier[]>([]);
  const [filters, setFilters] = useState<DirectoryFilters>({ categories: [], cities: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [city, setCity] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<{ id: string; name: string; category?: string } | null>(null);

  const { toast } = useToast();

  const fetchSuppliers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });
      if (search) params.append('search', search);
      if (category !== 'all') params.append('category', category);
      if (city !== 'all') params.append('city', city);

      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/directory/suppliers?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSuppliers(response.data.data.suppliers);
        setFilters(response.data.data.filters);
        setTotalPages(response.data.data.totalPages);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch directory',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchSuppliers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, category, city, page]);

  const handleConnectClick = (supplier: DirectorySupplier) => {
    setSelectedSupplier({ id: supplier._id, name: supplier.businessName, category: supplier.category });
    setDialogOpen(true);
  };

  const handleConnectSuccess = (newStatus: ConnectionStatus) => {
    if (selectedSupplier) {
      setSuppliers(suppliers.map(s => 
        s._id === selectedSupplier.id ? { ...s, connectionStatus: newStatus } : s
      ));
    }
  };

  const renderHealthBadge = (health?: any) => {
    if (!health) return null;
    let color = 'bg-green-100 text-green-800';
    if (health.grade === 'Fair') color = 'bg-yellow-100 text-yellow-800';
    if (health.grade === 'At Risk' || health.grade === 'Critical') color = 'bg-red-100 text-red-800';
    
    return (
      <Badge className={`${color} ml-2`} variant="outline">
        Health: {health.score} ({health.grade})
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Find Suppliers</h1>
        <p className="text-muted-foreground mt-2">Connect with suppliers and start tracking bills together.</p>
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur py-4 border-b mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={category} onValueChange={(val) => { setCategory(val); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {filters.categories?.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={city} onValueChange={(val) => { setCity(val); setPage(1); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cities</SelectItem>
            {filters.cities?.map(c => (
              <SelectItem key={c.name} value={c.name}>{c.name} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-10 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No suppliers found matching your filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {suppliers.map(supplier => (
              <Card key={supplier._id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{supplier.businessName}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">{supplier.category}</Badge>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    {supplier.location?.city}, {supplier.location?.state}
                    {renderHealthBadge(supplier.aggregateHealthScore)}
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                    {supplier.description || 'No description provided.'}
                  </p>
                  <p className="text-sm font-medium mt-4">
                    {supplier.totalConnectedShops} shop(s) connected
                  </p>
                </CardContent>
                <CardFooter>
                  {supplier.connectionStatus === 'none' || supplier.connectionStatus === 'disconnected' ? (
                    <Button className="w-full" onClick={() => handleConnectClick(supplier)}>Connect</Button>
                  ) : supplier.connectionStatus === 'pending_sent' ? (
                    <Button className="w-full" variant="secondary" disabled>
                      <Clock className="h-4 w-4 mr-2" /> Request Sent
                    </Button>
                  ) : supplier.connectionStatus === 'pending_received' ? (
                    <Button className="w-full" variant="outline" asChild>
                      <Link to="/connections/pending">Respond to Request</Link>
                    </Button>
                  ) : supplier.connectionStatus === 'connected' ? (
                    <div className="w-full text-center py-2 bg-green-50 text-green-700 rounded-md flex items-center justify-center border border-green-200">
                      <CheckCircle className="h-4 w-4 mr-2" /> Connected
                    </div>
                  ) : (
                    <Button className="w-full" variant="outline" onClick={() => handleConnectClick(supplier)}>Reconnect</Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <div className="flex items-center px-4">Page {page} of {totalPages}</div>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      {selectedSupplier && (
        <ConnectRequestDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          targetId={selectedSupplier.id}
          targetName={selectedSupplier.name}
          targetCategory={selectedSupplier.category}
          initiatorType="shop"
          onSuccess={handleConnectSuccess}
        />
      )}
    </div>
  );
}
